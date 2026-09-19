"use client";

import { useNavigate, Link } from "react-router-dom";
import * as React from "react";
import { BarChart3, Database, KeyRound, LockKeyhole, Sparkles } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, getSupabaseConfig, saveSupabaseConfig } from "@/lib/supabase";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [supabaseConfig, setSupabaseConfig] = React.useState(() => getSupabaseConfig());
  const [showConfig, setShowConfig] = React.useState(false);
  const [inputUrl, setInputUrl] = React.useState("");
  const [inputKey, setInputKey] = React.useState("");

  const isSupabaseConfigured = Boolean(supabaseConfig.url && supabaseConfig.anonKey);

  React.useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate("/dashboard", { replace: true });
      }
    });
  }, [navigate, isSupabaseConfigured]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const supabase = createClient();

    if (!supabase) {
      window.sessionStorage.removeItem("demo_logged_out");
      toast.success("Entering Demo Mode");
      navigate("/dashboard");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Signed in successfully");
    navigate("/dashboard");
  }

  function handleSaveInlineConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!inputUrl.trim() || !inputKey.trim()) {
      toast.error("Please enter both URL and Anon Key");
      return;
    }
    saveSupabaseConfig(inputUrl.trim(), inputKey.trim());
    setSupabaseConfig(getSupabaseConfig());
    setShowConfig(false);
    toast.success("Supabase configured! You can now log in.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <BarChart3 className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <CardTitle>Infotechs</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Lead Management Portal
                </p>
              </div>
            </div>
            <Badge variant={isSupabaseConfigured ? "success" : "warning"}>
              {isSupabaseConfigured ? "Supabase Live" : "Demo Mode"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSupabaseConfigured && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-5 text-amber-900 dark:text-amber-200">
              <p className="font-semibold">Demo Mode Active (APIs not connected)</p>
              <p className="mt-1 opacity-90">
                Supabase credentials were not detected in the environment. You can explore the app immediately with local sample data, or connect your Supabase database below.
              </p>
            </div>
          )}

          <form className="space-y-4" onSubmit={submit}>
            <div>
              <Label>Email</Label>
              <Input
                className="mt-2"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={isSupabaseConfigured ? "admin@company.com" : "demo@infotechs.co.in"}
                required={isSupabaseConfigured}
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                className="mt-2"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required={isSupabaseConfigured}
              />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              <LockKeyhole className="h-4 w-4" aria-hidden />
              {loading
                ? "Signing in..."
                : isSupabaseConfigured
                  ? "Sign In with Supabase"
                  : "Enter Dashboard (Demo Mode)"}
            </Button>
          </form>

          {/* Quick config toggle for easy onboarding */}
          <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>{showConfig ? "Hide Supabase Keys" : "Connect Supabase Keys"}</span>
            </button>
            <Link to="/dashboard" className="hover:underline">
              Skip to Dashboard →
            </Link>
          </div>

          {showConfig && (
            <form onSubmit={handleSaveInlineConfig} className="space-y-3 rounded-lg border border-border bg-muted/30 p-3 text-xs">
              <p className="font-medium text-foreground">Connect Supabase directly:</p>
              <div>
                <Label className="text-[11px]">Supabase Project URL</Label>
                <Input
                  className="mt-1 h-8 text-xs font-mono"
                  placeholder="https://xyz.supabase.co"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label className="text-[11px]">Anon Public Key</Label>
                <Input
                  className="mt-1 h-8 text-xs font-mono"
                  type="password"
                  placeholder="eyJhbGciOi..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" size="sm" className="w-full text-xs">
                Save & Enable Live APIs
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
      <Toaster richColors position="top-right" />
    </main>
  );
}
