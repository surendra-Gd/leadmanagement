import { LeadDetailView } from "@/components/lead-detail-view";

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  return <LeadDetailView id={params.id} />;
}
