"use client";

import * as React from "react";
import { Plus, ArrowRightCircle, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeadStore } from "@/lib/store";
import { Lead, LeadInput, ProspectStatus } from "@/lib/types";
import { ProspectFormDialog } from "@/components/prospect-form-dialog";
import { Link } from "react-router-dom";

const TABS: { key: ProspectStatus | "all"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "warm", label: "Warm Lead" },
    { key: "cold", label: "Cold Lead" },
    { key: "not_interested", label: "Not Interested" }
];

export function ProspectsView() {
    const {
        leads,
        isLoading,
        createLead,
        updateLead,
        updateProspectStatus,
        convertToLead,
        softDeleteLead
    } = useLeadStore();

    const [tab, setTab] = React.useState<ProspectStatus | "all">("all");
    const [search, setSearch] = React.useState("");
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editingProspect, setEditingProspect] = React.useState<Lead | undefined>();

    const prospects = React.useMemo(
        () => leads.filter((lead) => lead.recordType === "prospect" && !lead.deletedAt),
        [leads]
    );

    const counts = React.useMemo(() => {
        return {
            all: prospects.length,
            warm: prospects.filter((p) => p.prospectStatus === "warm").length,
            cold: prospects.filter((p) => p.prospectStatus === "cold").length,
            not_interested: prospects.filter((p) => p.prospectStatus === "not_interested").length
        };
    }, [prospects]);

    const filtered = React.useMemo(() => {
        const term = search.trim().toLowerCase();
        return prospects
            .filter((p) => tab === "all" || p.prospectStatus === tab)
            .filter((p) =>
                term
                    ? [p.customerName, p.phone, p.serviceType].join(" ").toLowerCase().includes(term)
                    : true
            )
            .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }, [prospects, tab, search]);

    function handleSubmit(input: LeadInput) {
        const payload: LeadInput = { ...input, recordType: "prospect" };
        if (editingProspect) {
            updateLead(editingProspect.id, payload);
        } else {
            createLead(payload);
        }
    }

    function handleDelete(prospect: Lead) {
        if (window.confirm(`Remove prospect ${prospect.customerName}?`)) {
            softDeleteLead(prospect.id);
        }
    }

    return (
        <>
            <PageHeader
                title="Prospects"
                description="People who reached out but aren't confirmed leads yet."
                action={
                    <Button
                        onClick={() => {
                            setEditingProspect(undefined);
                            setDialogOpen(true);
                        }}
                    >
                        <Plus className="h-4 w-4" aria-hidden />
                        Add Prospect
                    </Button>
                }
            />

            <div className="mb-4 flex flex-wrap gap-2">
                {TABS.map((t) => (
                    <Button
                        key={t.key}
                        size="sm"
                        variant={tab === t.key ? "default" : "outline"}
                        onClick={() => setTab(t.key)}
                    >
                        {t.label}
                        <span className="ml-1.5 text-xs opacity-70">({counts[t.key]})</span>
                    </Button>
                ))}
            </div>

            <Input
                placeholder="Search name, phone, service..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-4 max-w-sm"
            />

            {isLoading ? (
                <div className="rounded-lg border border-border bg-card p-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="mt-3 h-10 w-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    No prospects here yet.
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-muted-foreground">
                        <tr>
                            <th className="px-4 py-2 font-medium">Name</th>
                            <th className="px-4 py-2 font-medium">Phone</th>
                            <th className="px-4 py-2 font-medium">Service</th>
                            <th className="px-4 py-2 font-medium">Est. Price</th>
                            <th className="px-4 py-2 font-medium">Status</th>
                            <th className="px-4 py-2 font-medium text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map((prospect) => (
                            <tr key={prospect.id} className="border-t border-border">
                                <td className="px-4 py-2">
                                    <Link
                                    to={`/prospects/${prospect.id}`}
                                    className="font-medium text-primary hover:underline"
                                    >
                                    {prospect.customerName}
                                    </Link>
                                </td>
                                <td className="px-4 py-2">{prospect.phone}</td>
                                <td className="px-4 py-2">{prospect.serviceType}</td>
                                <td className="px-4 py-2">₹{prospect.estimatedPrice}</td>
                                <td className="px-4 py-2">
                                    <select
                                        className="rounded border border-border bg-background px-2 py-1 text-xs"
                                        value={prospect.prospectStatus ?? "cold"}
                                        onChange={(e) =>
                                            updateProspectStatus(prospect.id, e.target.value as ProspectStatus)
                                        }
                                    >
                                        <option value="warm">Warm Lead</option>
                                        <option value="cold">Cold Lead</option>
                                        <option value="not_interested">Not Interested</option>
                                    </select>
                                </td>
                                <td className="px-4 py-2">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            title="Convert to lead"
                                            onClick={() => convertToLead(prospect.id, "confirmed")}
                                        >
                                            <ArrowRightCircle className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            title="Edit"
                                            onClick={() => {
                                                setEditingProspect(prospect);
                                                setDialogOpen(true);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            title="Delete"
                                            onClick={() => handleDelete(prospect)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ProspectFormDialog
                open={dialogOpen}
                prospect={editingProspect}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
            />
        </>
    );
}