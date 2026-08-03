import { LeadsView } from "@/components/leads-view";

export default function CancelledPage() {
  return (
    <LeadsView
      title="Cancelled Leads"
      description="Cancelled opportunities with cancellation reasons and filterable history."
      fixedStatus="cancelled"
    />
  );
}
