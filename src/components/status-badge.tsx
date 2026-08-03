import { Badge } from "@/components/ui/badge";
import { LeadStatus, leadStatusLabels } from "@/lib/types";

const variants: Record<
  LeadStatus,
  "secondary" | "success" | "warning" | "danger" | "info"
> = {
  not_confirmed: "secondary",
  confirmed: "info",
  in_progress: "warning",
  completed: "success",
  cancelled: "danger"
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return <Badge variant={variants[status]}>{leadStatusLabels[status]}</Badge>;
}
