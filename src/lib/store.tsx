"use client";

import * as React from "react";
import { toast } from "sonner";
import { initialLeads } from "@/lib/mock-data";
import {
  createClient,
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  type SupabaseConfig
} from "@/lib/supabase";
import {
  Lead,
  LeadActivity,
  LeadInput,
  LeadNote,
  LeadStatus,
  Payment,
  ProspectStatus,
  RecordType
} from "@/lib/types";

type StoreContextValue = {
  leads: Lead[];
  isLoading: boolean;
  isSupabaseEnabled: boolean;
  supabaseConfig: SupabaseConfig;
  lastApiError: string | null;
  getLead: (id: string) => Lead | undefined;
  refreshLeads: () => Promise<void>;
  reconnectSupabase: (url?: string, key?: string) => Promise<boolean>;
  disconnectSupabase: () => void;
  clearApiError: () => void;
  createLead: (input: LeadInput) => Promise<Lead | undefined>;
  updateLead: (id: string, input: LeadInput) => Promise<void>;
  updateStatus: (id: string, status: LeadStatus, reason?: string) => Promise<void>;
  updateProspectStatus: (id: string, prospectStatus: ProspectStatus) => Promise<void>;
  convertToLead: (id: string, status?: LeadStatus) => Promise<void>;
  softDeleteLead: (id: string) => Promise<void>;
  addPayment: (leadId: string, amount: number, notes?: string) => Promise<void>;
  addNote: (leadId: string, body: string) => Promise<void>;
  updateActivity: (
      leadId: string,
      activityId: string,
      message: string
  ) => Promise<void>;
  deleteActivity: (leadId: string, activityId: string) => Promise<void>;
};

const StoreContext = React.createContext<StoreContextValue | null>(null);
const storageKey = "lead-management-demo-state";

type PaymentRow = {
  id: string;
  lead_id: string;
  amount: number | string;
  paid_at: string;
  notes: string | null;
};

type ActivityRow = {
  id: string;
  lead_id: string;
  created_at: string;
  message: string;
};

type NoteRow = {
  id: string;
  lead_id: string;
  created_at: string;
  body: string;
};

type LeadRow = {
  id: string;
  customer_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  service_type: string | null;
  description: string | null;
  estimated_price: number | string | null;
  status: LeadStatus;
  record_type: RecordType;
  prospect_status: ProspectStatus | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  deleted_at: string | null;
  payments?: PaymentRow[] | null;
  lead_activities?: ActivityRow[] | null;
  lead_notes?: NoteRow[] | null;
};

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function addActivity(
    lead: Lead,
    message: string,
    createdAt = new Date().toISOString()
): LeadActivity {
  return {
    id: uid("activity"),
    leadId: lead.id,
    createdAt,
    userName: "Admin",
    message
  };
}

function statusMessage(status: LeadStatus) {
  return status.replace("_", " ");
}

function prospectStatusMessage(status: ProspectStatus) {
  return status.replace("_", " ");
}

function mapPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    leadId: row.lead_id,
    amount: Number(row.amount),
    paidAt: row.paid_at,
    notes: row.notes ?? undefined
  };
}

function mapActivity(row: ActivityRow): LeadActivity {
  return {
    id: row.id,
    leadId: row.lead_id,
    createdAt: row.created_at,
    userName: "Admin",
    message: row.message
  };
}

function mapNote(row: NoteRow): LeadNote {
  return {
    id: row.id,
    leadId: row.lead_id,
    createdAt: row.created_at,
    body: row.body
  };
}

function mapLead(row: LeadRow): Lead {
  return {
    id: row.id,
    customerName: row.customer_name ?? "",
    phone: row.phone ?? "",
    email: row.email ?? undefined,
    address: row.address ?? undefined,
    serviceType: row.service_type ?? "",
    description: row.description ?? "",
    estimatedPrice: Number(row.estimated_price ?? 0),
    status: row.status,
    recordType: row.record_type ?? "lead",
    prospectStatus: row.prospect_status ?? undefined,
    cancellationReason: row.cancellation_reason ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? undefined,
    cancelledAt: row.cancelled_at ?? undefined,
    deletedAt: row.deleted_at ?? undefined,
    payments: (row.payments ?? [])
        .map(mapPayment)
        .sort((a, b) => +new Date(b.paidAt) - +new Date(a.paidAt)),
    activities: (row.lead_activities ?? [])
        .map(mapActivity)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    notes: (row.lead_notes ?? [])
        .map(mapNote)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  };
}

function leadPayload(input: LeadInput, timestamp = new Date().toISOString()) {
  return {
    customer_name: input.customerName,
    phone: input.phone,
    email: input.email || null,
    address: input.address || null,
    service_type: input.serviceType,
    description: input.description,
    estimated_price: input.estimatedPrice,
    status: input.status,
    record_type: input.recordType ?? "lead",
    prospect_status:
        (input.recordType ?? "lead") === "prospect"
            ? input.prospectStatus ?? "cold"
            : null,
    cancellation_reason:
        input.status === "cancelled" ? input.cancellationReason ?? null : null,
    completed_at: input.status === "completed" ? timestamp : null,
    cancelled_at: input.status === "cancelled" ? timestamp : null
  };
}

export function LeadStoreProvider({ children }: { children: React.ReactNode }) {
  const [supabaseConfig, setSupabaseConfig] = React.useState<SupabaseConfig>(() => getSupabaseConfig());
  const [supabase, setSupabase] = React.useState(() => createClient());
  const isSupabaseEnabled = Boolean(supabase);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [lastApiError, setLastApiError] = React.useState<string | null>(null);

  const refreshLeads = React.useCallback(async (clientOverride?: ReturnType<typeof createClient>) => {
    const activeClient = clientOverride !== undefined ? clientOverride : supabase;
    if (!activeClient) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLastApiError(null);

    try {
      // 1. First attempt full nested select
      const { data, error } = await activeClient
        .from("leads")
        .select(`
          *,
          payments (*),
          lead_activities (*),
          lead_notes (*)
        `)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Nested select on leads failed, attempting flat select fallback:", error);

        // 2. Fallback: If relations (foreign keys) are not yet configured or erroring, try basic select
        const flatRes = await activeClient
          .from("leads")
          .select("*")
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (flatRes.error) {
          console.error("Supabase API flat query failed:", flatRes.error);
          setLastApiError(flatRes.error.message);
          toast.error(`Supabase API: ${flatRes.error.message}`);
          setIsLoading(false);
          return;
        }

        setLeads(((flatRes.data ?? []) as LeadRow[]).map(mapLead));
        setLastApiError(null);
        setIsLoading(false);
        return;
      }

      setLeads(((data ?? []) as LeadRow[]).map(mapLead));
      setLastApiError(null);
      setIsLoading(false);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("Unexpected Supabase error:", err);
      setLastApiError(errMsg);
      toast.error(`Supabase error: ${errMsg}`);
      setIsLoading(false);
    }
  }, [supabase]);

  // Listen to configuration changes (e.g. user saved credentials in Settings)
  React.useEffect(() => {
    const handleConfigChange = () => {
      const newConfig = getSupabaseConfig();
      setSupabaseConfig(newConfig);
      const newClient = createClient(true);
      setSupabase(newClient);
      if (newClient) {
        void refreshLeads(newClient);
      }
    };

    window.addEventListener("supabase-config-changed", handleConfigChange);
    return () => window.removeEventListener("supabase-config-changed", handleConfigChange);
  }, [refreshLeads]);

  React.useEffect(() => {
    if (supabase) {
      void refreshLeads(supabase);
      return;
    }

    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        setLeads(JSON.parse(stored) as Lead[]);
      } catch {
        setLeads(initialLeads);
      }
    } else {
      setLeads(initialLeads);
    }
    setIsHydrated(true);
    setIsLoading(false);
  }, [refreshLeads, supabase]);

  React.useEffect(() => {
    if (!supabase && isHydrated) {
      window.localStorage.setItem(storageKey, JSON.stringify(leads));
    }
  }, [isHydrated, leads, supabase]);

  const reconnectSupabase = React.useCallback(async (url?: string, key?: string) => {
    if (url && key) {
      saveSupabaseConfig(url, key);
    }
    const newConfig = getSupabaseConfig();
    setSupabaseConfig(newConfig);
    const newClient = createClient(true);
    setSupabase(newClient);
    if (newClient) {
      await refreshLeads(newClient);
      toast.success("Connected to Supabase!");
      return true;
    }
    toast.error("Could not initialize Supabase. Check URL and Key.");
    return false;
  }, [refreshLeads]);

  const disconnectSupabase = React.useCallback(() => {
    clearSupabaseConfig();
    const newConfig = getSupabaseConfig();
    setSupabaseConfig(newConfig);
    setSupabase(null);
    setLastApiError(null);

    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        setLeads(JSON.parse(stored) as Lead[]);
      } catch {
        setLeads(initialLeads);
      }
    } else {
      setLeads(initialLeads);
    }
    toast.info("Switched to Local Demo Mode");
  }, []);

  const clearApiError = React.useCallback(() => {
    setLastApiError(null);
  }, []);

  const getLead = React.useCallback(
      (id: string) => leads.find((lead) => lead.id === id && !lead.deletedAt),
      [leads]
  );

  const createLead = React.useCallback(async (input: LeadInput) => {
    const timestamp = new Date().toISOString();

    if (supabase) {
      const { data, error } = await supabase
          .from("leads")
          .insert(leadPayload(input, timestamp))
          .select()
          .single();

      if (error) {
        toast.error(error.message);
        return undefined;
      }

      const row = data as LeadRow;
      const createdMessage =
          (input.recordType ?? "lead") === "prospect"
              ? "Prospect added"
              : "Lead created";

      const { error: activityError } = await supabase
          .from("lead_activities")
          .insert({
            lead_id: row.id,
            message: createdMessage,
            created_at: timestamp
          });

      if (activityError) {
        toast.error(activityError.message);
      }

      await refreshLeads();
      toast.success(
          (input.recordType ?? "lead") === "prospect"
              ? "Prospect added"
              : "Lead created"
      );
      return mapLead({ ...row, payments: [], lead_activities: [], lead_notes: [] });
    }

    const lead: Lead = {
      id: uid("lead"),
      ...input,
      recordType: input.recordType ?? "lead",
      prospectStatus:
          (input.recordType ?? "lead") === "prospect"
              ? input.prospectStatus ?? "cold"
              : undefined,
      cancellationReason:
          input.status === "cancelled" ? input.cancellationReason : undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
      completedAt: input.status === "completed" ? timestamp : undefined,
      cancelledAt: input.status === "cancelled" ? timestamp : undefined,
      payments: [],
      activities: [],
      notes: []
    };
    lead.activities = [
      addActivity(
          lead,
          lead.recordType === "prospect" ? "Prospect added" : "Lead created",
          timestamp
      )
    ];

    setLeads((current) => [lead, ...current]);
    toast.success(lead.recordType === "prospect" ? "Prospect added" : "Lead created");
    return lead;
  }, [refreshLeads, supabase]);

  const updateLead = React.useCallback(async (id: string, input: LeadInput) => {
    const timestamp = new Date().toISOString();

    if (supabase) {
      const previous = leads.find((lead) => lead.id === id);
      const payload = leadPayload(input, timestamp);

      const { error } = await supabase.from("leads").update(payload).eq("id", id);
      if (error) {
        toast.error(error.message);
        return;
      }

      const activityMessage =
          previous && previous.status !== input.status
              ? `Status changed to ${statusMessage(input.status)}`
              : "Details updated";

      const { error: activityError } = await supabase
          .from("lead_activities")
          .insert({
            lead_id: id,
            message: activityMessage,
            created_at: timestamp
          });

      if (activityError) {
        toast.error(activityError.message);
      }

      await refreshLeads();
      toast.success("Updated");
      return;
    }

    setLeads((current) =>
        current.map((lead) => {
          if (lead.id !== id) return lead;

          const statusChanged = lead.status !== input.status;
          const updated: Lead = {
            ...lead,
            ...input,
            recordType: input.recordType ?? lead.recordType,
            prospectStatus:
                (input.recordType ?? lead.recordType) === "prospect"
                    ? input.prospectStatus ?? lead.prospectStatus ?? "cold"
                    : undefined,
            cancellationReason:
                input.status === "cancelled" ? input.cancellationReason : undefined,
            updatedAt: timestamp,
            completedAt:
                input.status === "completed"
                    ? lead.completedAt ?? timestamp
                    : undefined,
            cancelledAt:
                input.status === "cancelled"
                    ? lead.cancelledAt ?? timestamp
                    : undefined
          };

          return {
            ...updated,
            activities: [
              addActivity(
                  updated,
                  statusChanged
                      ? `Status changed to ${input.status}`
                      : "Details updated",
                  timestamp
              ),
              ...lead.activities
            ]
          };
        })
    );
    toast.success("Updated");
  }, [leads, refreshLeads, supabase]);

  const updateStatus = React.useCallback(
      async (id: string, status: LeadStatus, reason?: string) => {
        const timestamp = new Date().toISOString();

        if (supabase) {
          const { error } = await supabase
              .from("leads")
              .update({
                status,
                cancellation_reason: status === "cancelled" ? reason ?? null : null,
                completed_at: status === "completed" ? timestamp : null,
                cancelled_at: status === "cancelled" ? timestamp : null
              })
              .eq("id", id);

          if (error) {
            toast.error(error.message);
            return;
          }

          const { error: activityError } = await supabase
              .from("lead_activities")
              .insert({
                lead_id: id,
                message: `Status changed to ${statusMessage(status)}`,
                created_at: timestamp
              });

          if (activityError) {
            toast.error(activityError.message);
          }

          await refreshLeads();
          toast.success("Status updated");
          return;
        }

        setLeads((current) =>
            current.map((lead) => {
              if (lead.id !== id) return lead;

              const updated: Lead = {
                ...lead,
                status,
                cancellationReason: status === "cancelled" ? reason : undefined,
                updatedAt: timestamp,
                completedAt:
                    status === "completed" ? lead.completedAt ?? timestamp : undefined,
                cancelledAt:
                    status === "cancelled" ? lead.cancelledAt ?? timestamp : undefined
              };

              return {
                ...updated,
                activities: [
                  addActivity(updated, `Status changed to ${status}`, timestamp),
                  ...lead.activities
                ]
              };
            })
        );
        toast.success("Status updated");
      },
      [refreshLeads, supabase]
  );

  const updateProspectStatus = React.useCallback(
      async (id: string, prospectStatus: ProspectStatus) => {
        const timestamp = new Date().toISOString();

        if (supabase) {
          const { error } = await supabase
              .from("leads")
              .update({ prospect_status: prospectStatus, updated_at: timestamp })
              .eq("id", id);

          if (error) {
            toast.error(error.message);
            return;
          }

          await supabase.from("lead_activities").insert({
            lead_id: id,
            message: `Marked as ${prospectStatusMessage(prospectStatus)}`,
            created_at: timestamp
          });

          await refreshLeads();
          toast.success("Prospect updated");
          return;
        }

        setLeads((current) =>
            current.map((lead) => {
              if (lead.id !== id) return lead;
              const updated: Lead = { ...lead, prospectStatus, updatedAt: timestamp };
              return {
                ...updated,
                activities: [
                  addActivity(
                      updated,
                      `Marked as ${prospectStatusMessage(prospectStatus)}`,
                      timestamp
                  ),
                  ...lead.activities
                ]
              };
            })
        );
        toast.success("Prospect updated");
      },
      [refreshLeads, supabase]
  );

  const convertToLead = React.useCallback(
      async (id: string, status: LeadStatus = "confirmed") => {
        const timestamp = new Date().toISOString();

        if (supabase) {
          const { error } = await supabase
              .from("leads")
              .update({
                record_type: "lead",
                status,
                prospect_status: null,
                updated_at: timestamp
              })
              .eq("id", id);

          if (error) {
            toast.error(error.message);
            return;
          }

          await supabase.from("lead_activities").insert({
            lead_id: id,
            message: `Converted to lead (${statusMessage(status)})`,
            created_at: timestamp
          });

          await refreshLeads();
          toast.success("Converted to lead");
          return;
        }

        setLeads((current) =>
            current.map((lead) => {
              if (lead.id !== id) return lead;
              const updated: Lead = {
                ...lead,
                recordType: "lead",
                status,
                prospectStatus: undefined,
                updatedAt: timestamp
              };
              return {
                ...updated,
                activities: [
                  addActivity(
                      updated,
                      `Converted to lead (${statusMessage(status)})`,
                      timestamp
                  ),
                  ...lead.activities
                ]
              };
            })
        );
        toast.success("Converted to lead");
      },
      [refreshLeads, supabase]
  );

  const softDeleteLead = React.useCallback(async (id: string) => {
    const timestamp = new Date().toISOString();

    if (supabase) {
      const { error } = await supabase
          .from("leads")
          .update({ deleted_at: timestamp })
          .eq("id", id);

      if (error) {
        toast.error(error.message);
        return;
      }

      await supabase.from("lead_activities").insert({
        lead_id: id,
        message: "Soft deleted",
        created_at: timestamp
      });

      await refreshLeads();
      toast.success("Deleted");
      return;
    }

    setLeads((current) =>
        current.map((lead) =>
            lead.id === id
                ? {
                  ...lead,
                  deletedAt: timestamp,
                  updatedAt: timestamp,
                  activities: [
                    addActivity(lead, "Soft deleted", timestamp),
                    ...lead.activities
                  ]
                }
                : lead
        )
    );
    toast.success("Deleted");
  }, [refreshLeads, supabase]);

  const addPayment = React.useCallback(
      async (leadId: string, amount: number, notes?: string) => {
        const timestamp = new Date().toISOString();

        if (supabase) {
          const { error } = await supabase.from("payments").insert({
            lead_id: leadId,
            amount,
            notes: notes ?? null,
            paid_at: timestamp
          });

          if (error) {
            toast.error(error.message);
            return;
          }

          await supabase.from("lead_activities").insert({
            lead_id: leadId,
            message: `Payment recorded: INR ${amount}`,
            created_at: timestamp
          });

          await supabase
              .from("leads")
              .update({ updated_at: timestamp })
              .eq("id", leadId);

          await refreshLeads();
          toast.success("Payment recorded");
          return;
        }

        setLeads((current) =>
            current.map((lead) => {
              if (lead.id !== leadId) return lead;
              const payment: Payment = {
                id: uid("payment"),
                leadId,
                amount,
                paidAt: timestamp,
                notes
              };

              return {
                ...lead,
                payments: [payment, ...lead.payments],
                updatedAt: timestamp,
                activities: [
                  addActivity(lead, `Payment recorded: INR ${amount}`, timestamp),
                  ...lead.activities
                ]
              };
            })
        );
        toast.success("Payment recorded");
      },
      [refreshLeads, supabase]
  );

  const addNote = React.useCallback(async (leadId: string, body: string) => {
    const timestamp = new Date().toISOString();

    if (supabase) {
      const { error } = await supabase.from("lead_notes").insert({
        lead_id: leadId,
        body,
        created_at: timestamp
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      await supabase.from("lead_activities").insert({
        lead_id: leadId,
        message: "Manual note added",
        created_at: timestamp
      });

      await supabase
          .from("leads")
          .update({ updated_at: timestamp })
          .eq("id", leadId);

      await refreshLeads();
      toast.success("Note added");
      return;
    }

    setLeads((current) =>
        current.map((lead) => {
          if (lead.id !== leadId) return lead;
          const note: LeadNote = {
            id: uid("note"),
            leadId,
            body,
            createdAt: timestamp
          };

          return {
            ...lead,
            notes: [note, ...lead.notes],
            updatedAt: timestamp,
            activities: [addActivity(lead, "Manual note added", timestamp), ...lead.activities]
          };
        })
    );
    toast.success("Note added");
  }, [refreshLeads, supabase]);

  const updateActivity = React.useCallback(
      async (leadId: string, activityId: string, message: string) => {
        const nextMessage = message.trim();
        if (!nextMessage) {
          toast.error("Activity message cannot be empty");
          return;
        }

        if (supabase) {
          const { error } = await supabase
              .from("lead_activities")
              .update({ message: nextMessage })
              .eq("id", activityId);

          if (error) {
            toast.error(error.message);
            return;
          }

          await refreshLeads();
          toast.success("Activity updated");
          return;
        }

        setLeads((current) =>
            current.map((lead) =>
                lead.id === leadId
                    ? {
                      ...lead,
                      activities: lead.activities.map((activity) =>
                          activity.id === activityId
                              ? { ...activity, message: nextMessage }
                              : activity
                      )
                    }
                    : lead
            )
        );
        toast.success("Activity updated");
      },
      [refreshLeads, supabase]
  );

  const deleteActivity = React.useCallback(
      async (leadId: string, activityId: string) => {
        if (supabase) {
          const { error } = await supabase
              .from("lead_activities")
              .delete()
              .eq("id", activityId);

          if (error) {
            toast.error(error.message);
            return;
          }

          await refreshLeads();
          toast.success("Activity deleted");
          return;
        }

        setLeads((current) =>
            current.map((lead) =>
                lead.id === leadId
                    ? {
                      ...lead,
                      activities: lead.activities.filter(
                          (activity) => activity.id !== activityId
                      )
                    }
                    : lead
            )
        );
        toast.success("Activity deleted");
      },
      [refreshLeads, supabase]
  );

  const value = React.useMemo<StoreContextValue>(
      () => ({
        leads,
        isLoading,
        isSupabaseEnabled,
        supabaseConfig,
        lastApiError,
        getLead,
        refreshLeads,
        reconnectSupabase,
        disconnectSupabase,
        clearApiError,
        createLead,
        updateLead,
        updateStatus,
        updateProspectStatus,
        convertToLead,
        softDeleteLead,
        addPayment,
        addNote,
        updateActivity,
        deleteActivity
      }),
      [
        leads,
        isLoading,
        isSupabaseEnabled,
        supabaseConfig,
        lastApiError,
        getLead,
        refreshLeads,
        reconnectSupabase,
        disconnectSupabase,
        clearApiError,
        createLead,
        updateLead,
        updateStatus,
        updateProspectStatus,
        convertToLead,
        softDeleteLead,
        addPayment,
        addNote,
        updateActivity,
        deleteActivity
      ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useLeadStore() {
  const value = React.useContext(StoreContext);
  if (!value) {
    throw new Error("useLeadStore must be used inside LeadStoreProvider");
  }
  return value;
}