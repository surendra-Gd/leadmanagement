import * as React from "react";
import { X } from "lucide-react";

export function Dialog({
                           open,
                           onOpenChange,
                           children
                       }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => onOpenChange(false)}
        >
            <div
                className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
                    onClick={() => onOpenChange(false)}
                    type="button"
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>
                {children}
            </div>
        </div>
    );
}

export function DialogContent({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
    return <div className="mb-4 flex flex-col space-y-1.5 text-left">{children}</div>;
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
    return (
        <div className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            {children}
        </div>
    );
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
    return <h2 className="text-lg font-semibold leading-none tracking-tight">{children}</h2>;
}