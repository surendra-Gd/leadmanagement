"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LeadStatus, SortOption, leadStatusLabels, leadStatuses } from "@/lib/types";

export type LeadFiltersValue = {
  search: string;
  status: "all" | LeadStatus;
  sort: SortOption;
  minAmount: string;
  maxAmount: string;
  startDate: string;
  endDate: string;
};

export function LeadFilters({
  value,
  onChange,
  statusLocked
}: {
  value: LeadFiltersValue;
  onChange: (value: LeadFiltersValue) => void;
  statusLocked?: boolean;
}) {
  function setValue<Key extends keyof LeadFiltersValue>(
    key: Key,
    next: LeadFiltersValue[Key]
  ) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-4 xl:grid-cols-6">
      <div className="relative col-span-2 xl:col-span-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search customer, phone, or service"
          value={value.search}
          onChange={(event) => setValue("search", event.target.value)}
        />
      </div>
      <Select
        className="min-h-11"
        disabled={statusLocked}
        value={value.status}
        onChange={(event) =>
          setValue("status", event.target.value as LeadFiltersValue["status"])
        }
      >
        <option value="all">All statuses</option>
        {leadStatuses.map((status) => (
          <option key={status} value={status}>
            {leadStatusLabels[status]}
          </option>
        ))}
      </Select>
      <Select
        className="min-h-11"
        value={value.sort}
        onChange={(event) => setValue("sort", event.target.value as SortOption)}
      >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="highest">Highest Value</option>
        <option value="lowest">Lowest Value</option>
      </Select>
      <Input
        className="min-h-11"
        type="number"
        placeholder="Min amount"
        value={value.minAmount}
        onChange={(event) => setValue("minAmount", event.target.value)}
      />
      <Input
        className="min-h-11"
        type="number"
        placeholder="Max amount"
        value={value.maxAmount}
        onChange={(event) => setValue("maxAmount", event.target.value)}
      />
      <Input
        className="min-h-11"
        type="date"
        value={value.startDate}
        onChange={(event) => setValue("startDate", event.target.value)}
      />
      <Input
        className="min-h-11"
        type="date"
        value={value.endDate}
        onChange={(event) => setValue("endDate", event.target.value)}
      />
    </div>
  );
}
