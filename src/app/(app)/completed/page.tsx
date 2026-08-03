import { LeadsView } from "@/components/leads-view";

export default function CompletedPage() {
  return (
    <LeadsView
      title="Completed Leads"
      description="Completed projects with values, paid amounts, pending amounts, search, and filters."
      fixedStatus="completed"
    />
  );
}
