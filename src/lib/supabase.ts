import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

export type SupabaseConfig = {
  url: string;
  anonKey: string;
  source: "env" | "custom" | "none";
};

export function getSupabaseConfig(): SupabaseConfig {
  if (typeof window !== "undefined") {
    const customUrl = window.localStorage.getItem("supabase_custom_url")?.trim();
    const customKey = window.localStorage.getItem("supabase_custom_anon_key")?.trim();
    if (customUrl && customKey) {
      return {
        url: customUrl.replace(/\/+$/, ""),
        anonKey: customKey,
        source: "custom"
      };
    }
  }

  // Check Vite environment variables (VITE_ and NEXT_PUBLIC_)
  const envUrl = (
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    (typeof window !== "undefined" && (window as unknown as { __ENV__?: Record<string, string> }).__ENV__?.VITE_SUPABASE_URL) ||
    (typeof window !== "undefined" && (window as unknown as { __ENV__?: Record<string, string> }).__ENV__?.NEXT_PUBLIC_SUPABASE_URL) ||
    ""
  ).trim();

  const envKey = (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (typeof window !== "undefined" && (window as unknown as { __ENV__?: Record<string, string> }).__ENV__?.VITE_SUPABASE_ANON_KEY) ||
    (typeof window !== "undefined" && (window as unknown as { __ENV__?: Record<string, string> }).__ENV__?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    ""
  ).trim();

  if (envUrl && envKey) {
    return {
      url: envUrl.replace(/\/+$/, ""),
      anonKey: envKey,
      source: "env"
    };
  }

  return {
    url: "",
    anonKey: "",
    source: "none"
  };
}

let activeClient: SupabaseClient | null = null;
let lastInitKey = "";

export function createClient(forceRefresh = false): SupabaseClient | null {
  const config = getSupabaseConfig();
  const initKey = `${config.url}::${config.anonKey}`;

  if (!forceRefresh && activeClient && lastInitKey === initKey) {
    return activeClient;
  }

  if (config.url && config.anonKey) {
    try {
      activeClient = createSupabaseClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      lastInitKey = initKey;
      return activeClient;
    } catch (err) {
      console.error("Failed to initialize Supabase client:", err);
      activeClient = null;
      lastInitKey = "";
      return null;
    }
  }

  activeClient = null;
  lastInitKey = "";
  return null;
}

export function saveSupabaseConfig(url: string, anonKey: string): SupabaseClient | null {
  if (typeof window !== "undefined") {
    const cleanUrl = url.trim().replace(/\/+$/, "");
    const cleanKey = anonKey.trim();
    if (!cleanUrl || !cleanKey) {
      throw new Error("Both Supabase URL and Anon Key are required.");
    }
    window.localStorage.setItem("supabase_custom_url", cleanUrl);
    window.localStorage.setItem("supabase_custom_anon_key", cleanKey);
    // Dispatch event so any listening components can react
    window.dispatchEvent(new Event("supabase-config-changed"));
  }
  return createClient(true);
}

export function clearSupabaseConfig(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("supabase_custom_url");
    window.localStorage.removeItem("supabase_custom_anon_key");
    window.dispatchEvent(new Event("supabase-config-changed"));
  }
  activeClient = null;
  lastInitKey = "";
  createClient(true);
}

export async function testSupabaseConnection(
  customUrl?: string,
  customKey?: string
): Promise<{ success: boolean; message: string; details?: string; authenticated: boolean }> {
  try {
    const url = (customUrl ?? getSupabaseConfig().url).trim().replace(/\/+$/, "");
    const key = (customKey ?? getSupabaseConfig().anonKey).trim();

    if (!url || !key) {
      return {
        success: false,
        message: "Supabase URL and Anon Key are missing.",
        authenticated: false
      };
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return {
        success: false,
        message: "Invalid URL format. Must start with https:// (e.g. https://your-id.supabase.co)",
        authenticated: false
      };
    }

    const testClient = createSupabaseClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Check auth session
    const { data: authData } = await testClient.auth.getSession();
    const isAuthenticated = Boolean(authData?.session?.user);

    // Try a ping query to public.leads
    const { data, error } = await testClient.from("leads").select("id").limit(1);

    if (error) {
      // Analyze common Supabase errors to give actionable guidance
      if (error.code === "PGRST116" || error.message.includes("relation") || error.message.includes("does not exist")) {
        return {
          success: false,
          message: "Connected to Supabase, but the 'leads' table does not exist.",
          details: "Please run the migration scripts found in supabase/schema.sql and supabase/migration/002_add_prospects.sql in your Supabase SQL Editor.",
          authenticated: isAuthenticated
        };
      }
      if (error.message.includes("JWT") || error.message.includes("apikey") || error.code === "PGRST301") {
        return {
          success: false,
          message: "Authentication error: Invalid Supabase Anon API Key or Project URL.",
          details: error.message,
          authenticated: isAuthenticated
        };
      }
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        return {
          success: false,
          message: "Network error: Could not reach Supabase endpoint. Please verify your Project URL.",
          details: error.message,
          authenticated: isAuthenticated
        };
      }
      // RLS warning if table exists but access denied
      if (error.code === "42501" || error.message.includes("row-level security")) {
        return {
          success: true,
          message: "Connected to Supabase! (Note: Row-Level Security is active; log in to read and modify leads)",
          details: error.message,
          authenticated: isAuthenticated
        };
      }

      return {
        success: false,
        message: `Supabase query error: ${error.message}`,
        details: `Code: ${error.code || "unknown"}`,
        authenticated: isAuthenticated
      };
    }

    return {
      success: true,
      message: `Successfully connected to Supabase! Lead query returned ${data ? "valid schema" : "response"}.`,
      authenticated: isAuthenticated
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Connection failed: ${errMsg}`,
      authenticated: false
    };
  }
}

export const supabase = createClient();
export default supabase;
