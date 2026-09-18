"use client";

import { Link } from "react-router-dom";
import { ArrowUpRight, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Lead } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getPaidAmount, getPendingAmount } from "@/lib/analytics";

export function LeadsTable({
  leads,
  onEdit,
  onDelete
}: {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}) {
  if (!leads.length) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm font-medium">No leads found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Adjust filters or create a new lead.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Service</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Value</th>
              <th className="px-4 py-3 font-semibold">Paid</th>
              <th className="px-4 py-3 font-semibold">Pending</th>
              <th className="px-4 py-3 font-semibold">Created</th>
              <th className="px-4 py-3 font-semibold">Last Note</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-muted/35">
                <td className="px-4 py-4">
                  <div className="font-medium">{lead.customerName}</div>
                  <div className="text-xs text-muted-foreground">{lead.phone}</div>
                </td>
                <td className="px-4 py-4">{lead.serviceType}</td>
                <td className="px-4 py-4">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="px-4 py-4">{formatCurrency(lead.estimatedPrice)}</td>
                <td className="px-4 py-4">{formatCurrency(getPaidAmount(lead))}</td>
                <td className="px-4 py-4">{formatCurrency(getPendingAmount(lead))}</td>
                <td className="px-4 py-4">{formatDate(lead.createdAt)}</td>
                <td className="px-4 py-4 max-w-[200px]">
                  {lead.notes && lead.notes.length > 0 ? (
                    <span className="line-clamp-2 text-xs" title={lead.notes[0].body}>
                      {lead.notes[0].body}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" asChild aria-label="View lead">
                      <Link to={`/leads/${lead.id}`}>
                        <ArrowUpRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Edit lead"
                      onClick={() => onEdit(lead)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete lead"
                      onClick={() => onDelete(lead)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-border md:hidden">
        {leads.map((lead) => (
          <div key={lead.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{lead.customerName}</p>
                <p className="text-sm text-muted-foreground">{lead.serviceType}</p>
              </div>
              <StatusBadge status={lead.status} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Metric label="Value" value={formatCurrency(lead.estimatedPrice)} />
              <Metric label="Pending" value={formatCurrency(getPendingAmount(lead))} />
              <Metric label="Phone" value={lead.phone} />
              <Metric label="Created" value={formatDate(lead.createdAt)} />
              <Metric label="Last Note" value={lead.notes && lead.notes.length > 0 ? lead.notes[0].body : "-"} />
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link to={`/leads/${lead.id}`}>Open</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit(lead)}>
                <Pencil className="h-4 w-4" aria-hidden />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDelete(lead)}>
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-medium">{value}</p>
    </div>
  );
}
