"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadFilters, LeadFiltersValue } from "@/components/lead-filters";
import { LeadFormDialog } from "@/components/lead-form-dialog";
import { LeadsTable } from "@/components/leads-table";
import { PageHeader } from "@/components/page-header";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeadStore } from "@/lib/store";
import { Lead, LeadStatus } from "@/lib/types";

const defaultFilters: LeadFiltersValue = {
  search: "",
  status: "in_progress",
  sort: "newest",
  minAmount: "",
  maxAmount: "",
  startDate: "",
  endDate: ""
};

const LEAD_STATUS_TABS: { key: LeadStatus | "all"; label: string }[] = [
  { key: "in_progress", label: "In Progress" },
  { key: "confirmed", label: "Confirmed" },
  { key: "not_confirmed", label: "Not Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All Leads" }
];

export function LeadsView({
  title = "Leads",
  description = "Create, search, filter, sort, and manage active opportunities.",
  fixedStatus
}: {
  title?: string;
  description?: string;
  fixedStatus?: LeadStatus;
}) {
  const { leads, isLoading, createLead, updateLead, softDeleteLead } =
    useLeadStore();
  const [filters, setFilters] = React.useState<LeadFiltersValue>({
    ...defaultFilters,
    status: fixedStatus ?? "in_progress"
  });
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingLead, setEditingLead] = React.useState<Lead | undefined>();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  React.useEffect(() => {
    if (fixedStatus) {
      setFilters((current) => ({ ...current, status: fixedStatus }));
    } else {
      setFilters((current) => ({ ...current, status: "in_progress" }));
    }
  }, [fixedStatus]);

  React.useEffect(() => {
    setPage(1);
  }, [filters, pageSize]);

  const statusCounts = React.useMemo(() => {
    const activeLeads = leads.filter(
      (lead) => !lead.deletedAt && lead.recordType !== "prospect"
    );
    return {
      all: activeLeads.length,
      in_progress: activeLeads.filter((l) => l.status === "in_progress").length,
      confirmed: activeLeads.filter((l) => l.status === "confirmed").length,
      not_confirmed: activeLeads.filter((l) => l.status === "not_confirmed").length,
      completed: activeLeads.filter((l) => l.status === "completed").length,
      cancelled: activeLeads.filter((l) => l.status === "cancelled").length
    };
  }, [leads]);

  const filtered = React.useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const minAmount = filters.minAmount ? Number(filters.minAmount) : undefined;
    const maxAmount = filters.maxAmount ? Number(filters.maxAmount) : undefined;
    const startDate = filters.startDate ? new Date(filters.startDate) : undefined;
    const endDate = filters.endDate ? new Date(filters.endDate) : undefined;

    return leads
      .filter((lead) => !lead.deletedAt)
        .filter((lead) => lead.recordType !== "prospect")
      .filter((lead) => filters.status === "all" || lead.status === filters.status)
      .filter((lead) => {
        if (!search) return true;
        return [lead.customerName, lead.phone, lead.serviceType]
          .join(" ")
          .toLowerCase()
          .includes(search);
      })
      .filter((lead) =>
        minAmount === undefined ? true : lead.estimatedPrice >= minAmount
      )
      .filter((lead) =>
        maxAmount === undefined ? true : lead.estimatedPrice <= maxAmount
      )
      .filter((lead) =>
        startDate === undefined ? true : new Date(lead.createdAt) >= startDate
      )
      .filter((lead) =>
        endDate === undefined ? true : new Date(lead.createdAt) <= endDate
      )
      .sort((a, b) => {
        if (filters.sort === "oldest") {
          return +new Date(a.createdAt) - +new Date(b.createdAt);
        }
        if (filters.sort === "highest") {
          return b.estimatedPrice - a.estimatedPrice;
        }
        if (filters.sort === "lowest") {
          return a.estimatedPrice - b.estimatedPrice;
        }
        return +new Date(b.createdAt) - +new Date(a.createdAt);
      });
  }, [filters, leads]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  function handleDelete(lead: Lead) {
    const ok = window.confirm(`Delete lead for ${lead.customerName}?`);
    if (ok) {
      softDeleteLead(lead.id);
    }
  }

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        action={
          <Button
            onClick={() => {
              setEditingLead(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Create Lead
          </Button>
        }
      />

      <div className="space-y-4">
        {!fixedStatus && (
          <div className="flex flex-wrap items-center gap-2">
            {LEAD_STATUS_TABS.map((tab) => (
              <Button
                key={tab.key}
                size="sm"
                variant={filters.status === tab.key ? "default" : "outline"}
                onClick={() => setFilters((prev) => ({ ...prev, status: tab.key }))}
              >
                {tab.label}
                <span className="ml-1.5 text-xs opacity-70">
                  ({statusCounts[tab.key]})
                </span>
              </Button>
            ))}
          </div>
        )}

        <LeadFilters
          value={filters}
          onChange={setFilters}
          statusLocked={Boolean(fixedStatus)}
        />
        {isLoading ? (
          <div className="rounded-lg border border-border bg-card p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="mt-3 h-10 w-full" />
            <Skeleton className="mt-3 h-10 w-full" />
          </div>
        ) : (
          <>
            <LeadsTable
              leads={paginated}
              onEdit={(lead) => {
                setEditingLead(lead);
                setDialogOpen(true);
              }}
              onDelete={handleDelete}
            />
            <PaginationControls
              total={filtered.length}
              start={filtered.length ? start + 1 : 0}
              end={Math.min(start + pageSize, filtered.length)}
              page={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </div>

      <LeadFormDialog
        open={dialogOpen}
        lead={editingLead}
        onOpenChange={setDialogOpen}
        onSubmit={(input) => {
          if (editingLead) {
            updateLead(editingLead.id, input);
          } else {
            createLead(input);
          }
        }}
      />
    </>
  );
}

function PaginationControls({
  total,
  start,
  end,
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange
}: {
  total: number;
  start: number;
  end: number;
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{start}</span>-
        <span className="font-medium text-foreground">{end}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          className="h-9 w-24"
          value={String(pageSize)}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          aria-label="Rows per page"
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </Select>
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="min-w-20 text-center text-sm font-medium">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
