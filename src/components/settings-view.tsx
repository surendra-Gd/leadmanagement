"use client";

import { Database, RefreshCw, ShieldCheck, UsersRound } from "lucide-react";
import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useLeadStore } from "@/lib/store";
import { LeadStatus, leadStatusLabels } from "@/lib/types";

export function SettingsView() {
  const { leads, isLoading, isSupabaseEnabled, refreshLeads } = useLeadStore();
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = React.useState(false);

  React.useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setSessionChecked(true);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
      setSessionChecked(true);
    });
  }, []);

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
        description="Supabase connection, authentication, database status, and operational totals."
        action={
          <Button variant="outline" onClick={() => void refreshLeads()}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Refresh
          </Button>
        }
      />

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
            <CardTitle>Database</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Storage</span>
              <Badge variant={isSupabaseEnabled ? "success" : "secondary"}>
                {isSupabaseEnabled ? "Connected" : "Local Browser"}
              </Badge>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Loaded leads</span>
              <span className="text-sm font-medium">
                {isLoading ? "Loading" : leads.length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <UsersRound className="h-5 w-5 text-primary" aria-hidden />
            <CardTitle>Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              New leads, edits, payments, notes, status changes, and soft
              deletes are saved to Supabase when connected.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Lead Status Totals</CardTitle>
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
          <p className="mt-4 text-sm text-muted-foreground">
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
