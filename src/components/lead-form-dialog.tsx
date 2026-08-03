"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Lead, LeadInput, leadStatusLabels, leadStatuses } from "@/lib/types";

const emptyLead: LeadInput = {
  customerName: "",
  phone: "",
  email: "",
  address: "",
  serviceType: "",
  description: "",
  estimatedPrice: 0,
  status: "not_confirmed",
  cancellationReason: ""
};

export function LeadFormDialog({
  open,
  lead,
  onOpenChange,
  onSubmit
}: {
  open: boolean;
  lead?: Lead;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: LeadInput) => void;
}) {
  const [form, setForm] = React.useState<LeadInput>(emptyLead);

  React.useEffect(() => {
    if (!open) return;
    setForm(
      lead
        ? {
            customerName: lead.customerName,
            phone: lead.phone,
            email: lead.email ?? "",
            address: lead.address ?? "",
            serviceType: lead.serviceType,
            description: lead.description,
            estimatedPrice: lead.estimatedPrice,
            status: lead.status,
            cancellationReason: lead.cancellationReason ?? ""
          }
        : emptyLead
    );
  }, [lead, open]);

  if (!open) return null;

  function update<Key extends keyof LeadInput>(key: Key, value: LeadInput[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      ...form,
      estimatedPrice: Number(form.estimatedPrice),
      email: form.email || undefined,
      address: form.address || undefined,
      cancellationReason: form.cancellationReason || undefined
    });
    onOpenChange(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-lg border border-border bg-card shadow-soft sm:rounded-lg"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">
              {lead ? "Edit Lead" : "Create Lead"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Capture customer, project, and workflow details.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Customer Name">
            <Input
              required
              value={form.customerName}
              onChange={(event) => update("customerName", event.target.value)}
            />
          </Field>
          <Field label="Phone Number">
            <Input
              required
              value={form.phone}
              onChange={(event) => update("phone", event.target.value)}
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
            />
          </Field>
          <Field label="Service Type">
            <Input
              required
              value={form.serviceType}
              onChange={(event) => update("serviceType", event.target.value)}
            />
          </Field>
          <Field label="Estimated Price">
            <Input
              required
              min={0}
              type="number"
              value={form.estimatedPrice}
              onChange={(event) =>
                update("estimatedPrice", Number(event.target.value))
              }
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(event) =>
                update("status", event.target.value as LeadInput["status"])
              }
            >
              {leadStatuses.map((status) => (
                <option key={status} value={status}>
                  {leadStatusLabels[status]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <Input
              value={form.address}
              onChange={(event) => update("address", event.target.value)}
            />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea
              required
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
            />
          </Field>
          {form.status === "cancelled" && (
            <Field label="Cancellation Reason" className="sm:col-span-2">
              <Textarea
                value={form.cancellationReason}
                onChange={(event) =>
                  update("cancellationReason", event.target.value)
                }
              />
            </Field>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit">{lead ? "Save Changes" : "Create Lead"}</Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  className,
  children
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
