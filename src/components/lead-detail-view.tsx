"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Pencil,
  Plus,
  Save,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { LeadFormDialog } from "@/components/lead-form-dialog";
import { StatusBadge } from "@/components/status-badge";
import { getPaidAmount, getPendingAmount } from "@/lib/analytics";
import { useLeadStore } from "@/lib/store";
import { LeadStatus, leadStatusLabels, leadStatuses } from "@/lib/types";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export function LeadDetailView({ id }: { id: string }) {
  const router = useRouter();
  const {
    getLead,
    updateLead,
    updateStatus,
    softDeleteLead,
    addPayment,
    addNote,
    updateActivity,
    deleteActivity,
    isLoading
  } = useLeadStore();
  const lead = getLead(id);
  const [editOpen, setEditOpen] = React.useState(false);
  const [paymentAmount, setPaymentAmount] = React.useState("");
  const [paymentNotes, setPaymentNotes] = React.useState("");
  const [note, setNote] = React.useState("");
  const [status, setStatus] = React.useState<LeadStatus>("not_confirmed");
  const [reason, setReason] = React.useState("");
  const [editingActivityId, setEditingActivityId] = React.useState<string | null>(
    null
  );
  const [activityMessage, setActivityMessage] = React.useState("");

  React.useEffect(() => {
    if (lead) {
      setStatus(lead.status);
      setReason(lead.cancellationReason ?? "");
    }
  }, [lead]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 xl:grid-cols-3">
          <Skeleton className="h-72 xl:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm font-medium">Lead not found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          It may have been deleted or moved.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/leads">Back to Leads</Link>
        </Button>
      </div>
    );
  }

  const paid = getPaidAmount(lead);
  const pending = getPendingAmount(lead);

  function deleteLead() {
    if (!lead) return;
    const ok = window.confirm(`Delete lead for ${lead.customerName}?`);
    if (ok) {
      softDeleteLead(lead.id);
      router.push("/leads");
    }
  }

  function submitPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lead) return;
    const amount = Number(paymentAmount);
    if (!amount || amount < 1) return;
    addPayment(lead.id, amount, paymentNotes || undefined);
    setPaymentAmount("");
    setPaymentNotes("");
  }

  function submitNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lead) return;
    if (!note.trim()) return;
    addNote(lead.id, note.trim());
    setNote("");
  }

  function startActivityEdit(activityId: string, message: string) {
    setEditingActivityId(activityId);
    setActivityMessage(message);
  }

  async function saveActivity(activityId: string) {
    if (!lead) return;
    await updateActivity(lead.id, activityId, activityMessage);
    setEditingActivityId(null);
    setActivityMessage("");
  }

  async function removeActivity(activityId: string) {
    if (!lead) return;
    const ok = window.confirm("Delete this activity?");
    if (ok) {
      await deleteActivity(lead.id, activityId);
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/leads">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back
            </Link>
          </Button>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">
              {lead.customerName}
            </h1>
            <StatusBadge status={lead.status} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {lead.serviceType} opened on {formatDate(lead.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" aria-hidden />
            Edit
          </Button>
          <Button variant="destructive" onClick={deleteLead}>
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Detail label="Phone" value={lead.phone} />
              <Detail label="Email" value={lead.email ?? "Not provided"} />
              <Detail
                label="Address"
                value={lead.address ?? "Not provided"}
                className="sm:col-span-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Detail label="Service Type" value={lead.serviceType} />
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="mt-1 text-sm leading-6">{lead.description}</p>
              </div>
              {lead.cancellationReason && (
                <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
                  {lead.cancellationReason}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lead.activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                      <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      {editingActivityId === activity.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={activityMessage}
                            onChange={(event) =>
                              setActivityMessage(event.target.value)
                            }
                            className="min-h-[76px]"
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() => void saveActivity(activity.id)}
                            >
                              <Save className="h-4 w-4" aria-hidden />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingActivityId(null);
                                setActivityMessage("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 break-words text-sm font-medium">
                            {activity.message}
                          </p>
                          <div className="flex shrink-0 gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Edit activity"
                              onClick={() =>
                                startActivityEdit(activity.id, activity.message)
                              }
                            >
                              <Pencil className="h-4 w-4" aria-hidden />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Delete activity"
                              onClick={() => void removeActivity(activity.id)}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </Button>
                          </div>
                        </div>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {activity.userName} - {formatDateTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Summary label="Total Amount" value={formatCurrency(lead.estimatedPrice)} />
              <Summary label="Paid Amount" value={formatCurrency(paid)} />
              <Summary label="Pending Amount" value={formatCurrency(pending)} strong />
              <form className="space-y-3 border-t border-border pt-4" onSubmit={submitPayment}>
                <Label>Record Payment</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="Amount"
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                />
                <Input
                  placeholder="Notes"
                  value={paymentNotes}
                  onChange={(event) => setPaymentNotes(event.target.value)}
                />
                <Button type="submit" className="w-full">
                  <CreditCard className="h-4 w-4" aria-hidden />
                  Add Payment
                </Button>
              </form>
              <div className="space-y-2">
                {lead.payments.map((payment) => (
                  <div key={payment.id} className="rounded-md bg-muted p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {formatCurrency(payment.amount)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(payment.paidAt)}
                      </span>
                    </div>
                    {payment.notes && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {payment.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={status}
                onChange={(event) => setStatus(event.target.value as LeadStatus)}
              >
                {leadStatuses.map((option) => (
                  <option key={option} value={option}>
                    {leadStatusLabels[option]}
                  </option>
                ))}
              </Select>
              {status === "cancelled" && (
                <Textarea
                  placeholder="Cancellation reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              )}
              <Button
                className="w-full"
                onClick={() => updateStatus(lead.id, status, reason || undefined)}
              >
                Save Status
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-3" onSubmit={submitNote}>
                <Textarea
                  placeholder="Add internal note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4" aria-hidden />
                  Add Note
                </Button>
              </form>
              <div className="space-y-2">
                {lead.notes.map((item) => (
                  <div key={item.id} className="rounded-md border border-border p-3 text-sm">
                    <p>{item.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <LeadFormDialog
        open={editOpen}
        lead={lead}
        onOpenChange={setEditOpen}
        onSubmit={(input) => updateLead(lead.id, input)}
      />
    </>
  );
}

function Detail({
  label,
  value,
  className
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium">{value}</p>
    </div>
  );
}

function Summary({
  label,
  value,
  strong
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={strong ? "text-lg font-semibold" : "text-sm font-medium"}>
        {value}
      </p>
    </div>
  );
}
