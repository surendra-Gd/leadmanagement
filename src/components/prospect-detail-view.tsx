"use client";

import { Link, useNavigate } from "react-router-dom";
import * as React from "react";
import {
    ArrowLeft,
    ArrowRightCircle,
    CheckCircle2,
    Pencil,
    Plus,
    Save,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ProspectFormDialog } from "@/components/prospect-form-dialog";
import { useLeadStore } from "@/lib/store";
import { ProspectStatus } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/utils";

const prospectStatusMeta: Record<ProspectStatus, { label: string; className: string }> = {
    warm: {
        label: "Warm Lead",
        className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
    },
    cold: {
        label: "Cold Lead",
        className: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
    },
    not_interested: {
        label: "Not Interested",
        className: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
    }
};

export function ProspectDetailView({ id }: { id: string }) {
    const navigate = useNavigate();
    const {
        getLead,
        updateLead,
        updateProspectStatus,
        convertToLead,
        softDeleteLead,
        addNote,
        updateActivity,
        deleteActivity,
        isLoading
    } = useLeadStore();

    const prospect = getLead(id);
    const [editOpen, setEditOpen] = React.useState(false);
    const [note, setNote] = React.useState("");
    const [editingActivityId, setEditingActivityId] = React.useState<string | null>(
        null
    );
    const [activityMessage, setActivityMessage] = React.useState("");

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

    if (!prospect || prospect.recordType !== "prospect") {
        return (
            <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
                <p className="text-sm font-medium">Prospect not found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                    It may have been deleted, converted, or moved.
                </p>
                <Button className="mt-4" asChild>
                    <Link to="/prospects">Back to Prospects</Link>
                </Button>
            </div>
        );
    }

    const statusMeta = prospectStatusMeta[prospect.prospectStatus ?? "cold"];

    function deleteProspect() {
        if (!prospect) return;
        const ok = window.confirm(`Remove prospect ${prospect.customerName}?`);
        if (ok) {
            softDeleteLead(prospect.id);
            navigate("/prospects");
        }
    }

    function submitNote(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!prospect || !note.trim()) return;
        addNote(prospect.id, note.trim());
        setNote("");
    }

    function startActivityEdit(activityId: string, message: string) {
        setEditingActivityId(activityId);
        setActivityMessage(message);
    }

    async function saveActivity(activityId: string) {
        if (!prospect) return;
        await updateActivity(prospect.id, activityId, activityMessage);
        setEditingActivityId(null);
        setActivityMessage("");
    }

    async function removeActivity(activityId: string) {
        if (!prospect) return;
        const ok = window.confirm("Delete this activity?");
        if (ok) {
            await deleteActivity(prospect.id, activityId);
        }
    }

    return (
        <>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Button variant="ghost" size="sm" asChild>
                        <Link to="/prospects">
                            <ArrowLeft className="h-4 w-4" aria-hidden />
                            Back
                        </Link>
                    </Button>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">
                            {prospect.customerName}
                        </h1>
                        <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusMeta.className}`}
                        >
              {statusMeta.label}
            </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {prospect.serviceType} added on {formatDate(prospect.createdAt)}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setEditOpen(true)}>
                        <Pencil className="h-4 w-4" aria-hidden />
                        Edit
                    </Button>
                    <Button onClick={() => convertToLead(prospect.id, "confirmed")}>
                        <ArrowRightCircle className="h-4 w-4" aria-hidden />
                        Convert to Lead
                    </Button>
                    <Button variant="destructive" onClick={deleteProspect}>
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
                            <Detail label="Phone" value={prospect.phone} />
                            <Detail label="Email" value={prospect.email ?? "Not provided"} />
                            <Detail
                                label="Address"
                                value={prospect.address ?? "Not provided"}
                                className="sm:col-span-2"
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Interest Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Detail label="Service Type" value={prospect.serviceType} />
                            <Detail label="Estimated Price" value={`₹${prospect.estimatedPrice}`} />
                            <div>
                                <p className="text-sm text-muted-foreground">Description</p>
                                <p className="mt-1 text-sm leading-6">{prospect.description}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {prospect.notes.map((item) => (
                                <div key={item.id} className="rounded-md border border-border p-3 text-sm">
                                    <p className="leading-6">{item.body}</p>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        {formatDateTime(item.createdAt)}
                                    </p>
                                </div>
                            ))}
                            {prospect.notes.length === 0 && (
                                <p className="text-sm text-muted-foreground">No notes yet.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Activity Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {prospect.activities.map((activity) => (
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
                                {prospect.activities.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No activity yet.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Prospect Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {(["warm", "cold", "not_interested"] as ProspectStatus[]).map(
                                (option) => (
                                    <Button
                                        key={option}
                                        variant={prospect.prospectStatus === option ? "default" : "outline"}
                                        className="w-full justify-start"
                                        onClick={() => updateProspectStatus(prospect.id, option)}
                                    >
                                        {prospectStatusMeta[option].label}
                                    </Button>
                                )
                            )}
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
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ProspectFormDialog
                open={editOpen}
                prospect={prospect}
                onOpenChange={setEditOpen}
                onSubmit={(input) => updateLead(prospect.id, input)}
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