"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CheckCircle2,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  Users,
  XCircle
} from "lucide-react";
import * as React from "react";
import { Toaster } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeadStoreProvider, useLeadStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/completed", label: "Completed", icon: CheckCircle2 },
  { href: "/cancelled", label: "Cancelled", icon: XCircle },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  const [isNavigating, setIsNavigating] = React.useState(false);

  React.useEffect(() => {
    const stored = window.localStorage.getItem("theme") as "light" | "dark" | null;
    const resolved = stored ?? "light";
    setTheme(resolved);
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }, []);

  React.useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as Element | null;
      const link = target?.closest("a") as HTMLAnchorElement | null;
      if (!link || link.target || link.hasAttribute("download")) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const url = new URL(link.href);
      if (url.origin !== window.location.origin) return;

      const current = `${window.location.pathname}${window.location.search}`;
      const next = `${url.pathname}${url.search}`;
      if (next !== current) {
        setIsNavigating(true);
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => setIsNavigating(false), 250);
    return () => window.clearTimeout(timeout);
  }, [pathname]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  async function logout() {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/login");
    router.refresh();
  }

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-border bg-card px-4 py-5">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <BarChart3 className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold">Infotechs</p>
          <p className="text-xs text-muted-foreground">Internal management</p>
        </div>
      </div>

      <nav className="mt-8 grid gap-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <ConnectionCard />
    </aside>
  );

  return (
    <LeadStoreProvider>
      <div className="min-h-screen bg-background text-foreground">
        {isNavigating && <RouteLoadingBar />}
        <div className="lg:hidden">
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 flex">
              <button
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                aria-label="Close navigation"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="relative z-10">{sidebar}</div>
            </div>
          )}
        </div>

        <div className="hidden lg:fixed lg:inset-y-0 lg:flex">{sidebar}</div>

        <div className="lg:pl-72">
          <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" aria-hidden />
              </Button>

              <div className="relative hidden flex-1 sm:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="max-w-md pl-9"
                  placeholder="Search leads, services, phone numbers"
                  aria-label="Global search"
                />
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Toggle theme"
                  onClick={toggleTheme}
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" aria-hidden />
                  ) : (
                    <Moon className="h-4 w-4" aria-hidden />
                  )}
                </Button>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium">Admin</p>
                  <p className="text-xs text-muted-foreground">Operations</p>
                </div>
                <Button variant="outline" size="icon" onClick={logout} aria-label="Logout">
                  <LogOut className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>
          </header>

          <main className="px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-8">
            {children}
          </main>
        </div>
        <BottomNavigation pathname={pathname} />
      </div>
      <Toaster richColors position="top-right" />
    </LeadStoreProvider>
  );
}

function RouteLoadingBar() {
  return (
    <div className="fixed inset-x-0 top-0 z-[70] h-1 overflow-hidden bg-primary/10">
      <div className="h-full w-1/2 animate-pulse rounded-r-full bg-primary" />
    </div>
  );
}

function BottomNavigation({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-soft backdrop-blur lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-medium text-muted-foreground transition-colors",
                active && "bg-primary text-primary-foreground"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function ConnectionCard() {
  const { isSupabaseEnabled, isLoading, leads } = useLeadStore();

  return (
    <div className="mt-auto rounded-lg border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {isSupabaseEnabled ? "Supabase connected" : "Demo mode"}
        </p>
        <Badge variant={isSupabaseEnabled ? "success" : "warning"}>
          {isSupabaseEnabled ? "Live" : "Local"}
        </Badge>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {isSupabaseEnabled
          ? `${isLoading ? "Loading" : leads.length} leads loaded from database.`
          : "Add environment keys to enable secure persisted auth."}
      </p>
    </div>
  );
}
