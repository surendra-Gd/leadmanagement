"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Lead, LeadInput, ProspectStatus } from "@/lib/types";

export function ProspectFormDialog({
                                       open,
                                       prospect,
                                       onOpenChange,
                                       onSubmit
                                   }: {
    open: boolean;
    prospect?: Lead;
    onOpenChange: (open: boolean) => void;
    onSubmit: (input: LeadInput) => void;
}) {
    const [customerName, setCustomerName] = React.useState("");
    const [phone, setPhone] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [serviceType, setServiceType] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [estimatedPrice, setEstimatedPrice] = React.useState("0");
    const [prospectStatus, setProspectStatus] = React.useState<ProspectStatus>("cold");

    React.useEffect(() => {
        if (open) {
            setCustomerName(prospect?.customerName ?? "");
            setPhone(prospect?.phone ?? "");
            setEmail(prospect?.email ?? "");
            setServiceType(prospect?.serviceType ?? "");
            setDescription(prospect?.description ?? "");
            setEstimatedPrice(String(prospect?.estimatedPrice ?? 0));
            setProspectStatus(prospect?.prospectStatus ?? "cold");
        }
    }, [open, prospect]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        onSubmit({
            customerName,
            phone,
            email: email || undefined,
            serviceType,
            description,
            estimatedPrice: Number(estimatedPrice) || 0,
            status: "not_confirmed",
            recordType: "prospect",
            prospectStatus
        });
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{prospect ? "Edit Prospect" : "Add Prospect"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <Label>Name</Label>
                        <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                    </div>
                    <div>
                        <Label>Phone</Label>
                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
                    </div>
                    <div>
                        <Label>Email</Label>
                        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <Label>Service Type</Label>
                        <Input value={serviceType} onChange={(e) => setServiceType(e.target.value)} required />
                    </div>
                    <div>
                        <Label>Description</Label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div>
                        <Label>Estimated Price</Label>
                        <Input
                            type="number"
                            value={estimatedPrice}
                            onChange={(e) => setEstimatedPrice(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>Status</Label>
                        <select
                            className="w-full rounded border border-border bg-background px-2 py-2 text-sm"
                            value={prospectStatus}
                            onChange={(e) => setProspectStatus(e.target.value as ProspectStatus)}
                        >
                            <option value="warm">Warm Lead</option>
                            <option value="cold">Cold Lead</option>
                            <option value="not_interested">Not Interested</option>
                        </select>
                    </div>
                    <DialogFooter>
                        <Button type="submit">{prospect ? "Save" : "Add Prospect"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}