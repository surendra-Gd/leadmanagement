"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Database,
  ExternalLink,
  Globe,
  Info,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UsersRound
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, testSupabaseConnection, type SupabaseConfig } from "@/lib/supabase";
import { useLeadStore } from "@/lib/store";
import { LeadStatus, leadStatusLabels } from "@/lib/types";

export function SettingsView() {
  const {
    leads,
    isLoading,
    isSupabaseEnabled,
    supabaseConfig,
    lastApiError,
    refreshLeads,
    reconnectSupabase,
    disconnectSupabase,
    clearApiError
  } = useLeadStore();

  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = React.useState(false);

  // Connection form state
  const [inputUrl, setInputUrl] = React.useState(supabaseConfig.url || "");
  const [inputKey, setInputKey] = React.useState(supabaseConfig.anonKey || "");
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  // Keep form in sync if external config changes
  React.useEffect(() => {
    if (supabaseConfig.url) setInputUrl(supabaseConfig.url);
    if (supabaseConfig.anonKey) setInputKey(supabaseConfig.anonKey);
  }, [supabaseConfig]);

  React.useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setUserEmail(null);
      setSessionChecked(true);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
      setSessionChecked(true);
    });
  }, [isSupabaseEnabled]);

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);

    const targetUrl = inputUrl.trim() || supabaseConfig.url;
    const targetKey = inputKey.trim() || supabaseConfig.anonKey;

    if (!targetUrl || !targetKey) {
      setTestResult({
        success: false,
        message: "Please enter both a Supabase Project URL and Anon API Key to test."
      });
      setTesting(false);
      return;
    }

    const res = await testSupabaseConnection(targetUrl, targetKey);
    setTestResult(res);
    setTesting(false);

    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  }

  async function handleSaveConnection(e: React.FormEvent) {
    e.preventDefault();
    if (!inputUrl.trim() || !inputKey.trim()) {
      toast.error("Please provide both Supabase Project URL and Anon Key.");
      return;
    }

    setTesting(true);
    const test = await testSupabaseConnection(inputUrl.trim(), inputKey.trim());
    setTestResult(test);

    if (!test.success && !window.confirm(`Connection test returned an issue:\n\n${test.message}\n\nDo you still want to save and connect anyway?`)) {
      setTesting(false);
      return;
    }

    await reconnectSupabase(inputUrl.trim(), inputKey.trim());
    setTesting(false);
  }

  function handleDisconnect() {
    if (window.confirm("Switch back to Local Demo Mode? Supabase API calls will be paused.")) {
      disconnectSupabase();
      setInputUrl("");
      setInputKey("");
      setTestResult(null);
      clearApiError();
    }
  }

  const counts = leads.reduce<Record<LeadStatus, number>>(
    (acc, lead) => {
      acc[lead.status] += 1;
      return acc;
    },
    {
      not_confirmed: 0,
      confirmed: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    }
  );

  return (
    <>
      <PageHeader
        title="Settings"
        description="Supabase connection, API diagnostics, database authentication, and operational statistics."
        action={
          <Button variant="outline" onClick={() => void refreshLeads()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden />
            Refresh
          </Button>
        }
      />

      {/* API Error Notification */}
      {lastApiError && (
        <div className="mb-6 flex items-start justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Supabase API Error Detected</p>
              <p className="mt-1 text-xs opacity-90">{lastApiError}</p>
              <p className="mt-2 text-xs opacity-80">
                Check that your Supabase tables match the schema in <code className="font-mono bg-destructive/20 px-1 py-0.5 rounded">supabase/schema.sql</code> and that your RLS policies allow access.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={clearApiError} className="h-7 text-xs">
            Dismiss
          </Button>
        </div>
      )}

      {/* System Status Overview Cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
            <CardTitle>Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Mode</span>
              <Badge variant={isSupabaseEnabled ? "success" : "warning"}>
                {isSupabaseEnabled ? "Supabase Auth" : "Demo Mode"}
              </Badge>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Signed in</span>
              <span className="break-all text-right text-sm font-medium">
                {userEmail ??
                  (sessionChecked
                    ? isSupabaseEnabled
                      ? "No active session"
                      : "Demo user"
                    : "Checking session")}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Database className="h-5 w-5 text-primary" aria-hidden />
            <CardTitle>Database & API</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Data Source</span>
              <Badge variant={isSupabaseEnabled ? "success" : "secondary"}>
                {isSupabaseEnabled
                  ? supabaseConfig.source === "env"
                    ? "Supabase (Env)"
                    : "Supabase (Custom)"
                  : "Local Browser Mock"}
              </Badge>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Loaded records</span>
              <span className="text-sm font-medium">
                {isLoading ? "Loading..." : `${leads.length} leads & prospects`}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Globe className="h-5 w-5 text-primary" aria-hidden />
            <CardTitle>Hosted Endpoint</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Target URL</span>
              <span className="max-w-[160px] truncate text-xs font-mono text-foreground" title={supabaseConfig.url || "None"}>
                {supabaseConfig.url || "Not configured"}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">API Calling</span>
              <span className="text-xs font-medium text-foreground">
                {isSupabaseEnabled ? "Active (Live REST)" : "Disabled (Local only)"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supabase Connection Configuration & Diagnostics */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              <CardTitle>Supabase API Connection & Diagnostics</CardTitle>
            </div>
            <Badge variant={isSupabaseEnabled ? "success" : "outline"}>
              {isSupabaseEnabled ? "Live Connection" : "Demo Mode"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Explanation for hosted environment issue */}
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-xs leading-5 text-muted-foreground space-y-2">
            <div className="flex items-center gap-2 font-medium text-foreground text-sm">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <span>Why wasn&apos;t the Supabase API called on your hosted dashboard?</span>
            </div>
            <p>
              In client-side single-page applications (Vite), environment variables like <code className="font-mono bg-background px-1 py-0.5 rounded border border-border">VITE_SUPABASE_URL</code> or <code className="font-mono bg-background px-1 py-0.5 rounded border border-border">NEXT_PUBLIC_SUPABASE_URL</code> must either be injected at build time, or configured below.
            </p>
            <p>
              When those variables are missing during deployment, the app safely defaults to local browser storage so it doesn&apos;t crash. You can connect your database right now using either method:
            </p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>
                <strong>Immediate Connection:</strong> Paste your Supabase Project URL and Public Anon Key below and click <strong>Test & Save Connection</strong>. It will persist in this browser and immediately start making live API calls.
              </li>
              <li>
                <strong>Permanent Deployment:</strong> Add <code className="font-mono bg-background px-1 py-0.5 rounded border border-border">VITE_SUPABASE_URL</code> and <code className="font-mono bg-background px-1 py-0.5 rounded border border-border">VITE_SUPABASE_ANON_KEY</code> (or <code className="font-mono bg-background px-1 py-0.5 rounded border border-border">NEXT_PUBLIC_SUPABASE_URL</code>) into your hosting dashboard (e.g. Cloudflare Pages, Vercel, Netlify) environment settings and trigger a redeploy.
              </li>
            </ol>
          </div>

          {/* Connection Test Feedback Box */}
          {testResult && (
            <div
              className={`rounded-lg border p-4 text-sm ${
                testResult.success
                  ? "border-emerald-500/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {testResult.success ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                )}
                <div className="space-y-1">
                  <p className="font-medium">{testResult.message}</p>
                  {testResult.details && (
                    <p className="text-xs opacity-90 font-mono mt-1 break-words">
                      {testResult.details}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSaveConnection} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="supabase-url">Supabase Project URL</Label>
                <Input
                  id="supabase-url"
                  type="url"
                  placeholder="https://your-project-id.supabase.co"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Found in your Supabase Dashboard under <strong>Project Settings → API</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supabase-key">Supabase Public / Anon Key</Label>
                <Input
                  id="supabase-key"
                  type="password"
                  placeholder="eyJh..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Found under <strong>Project Settings → API → Project API Keys (anon public)</strong>.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button type="submit" disabled={testing}>
                <Lock className="h-4 w-4" aria-hidden />
                {testing ? "Connecting..." : "Save & Connect"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing}
              >
                <RefreshCw className={`h-4 w-4 ${testing ? "animate-spin" : ""}`} aria-hidden />
                Test Connection
              </Button>

              {supabaseConfig.source === "custom" && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={handleDisconnect}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Clear & Revert to Demo Mode
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UsersRound className="h-5 w-5 text-primary" />
            <CardTitle>Lead Status Totals</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(Object.keys(counts) as LeadStatus[]).map((status) => (
              <div
                key={status}
                className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
              >
                <StatusBadge status={status} />
                <span className="text-lg font-semibold">{counts[status]}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Status labels:{" "}
            {(Object.keys(counts) as LeadStatus[])
              .map((status) => leadStatusLabels[status])
              .join(", ")}
          </p>
        </CardContent>
      </Card>
    </>
  );
}
