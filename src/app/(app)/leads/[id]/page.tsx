"use client";

import { useParams } from "react-router-dom";
import { LeadDetailView } from "@/components/lead-detail-view";

export function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  return <LeadDetailView id={params.id ?? ""} />;
}
