import { useParams } from "react-router-dom";
import { ProspectDetailView } from "@/components/prospect-detail-view";

export function ProspectDetailPage() {
    const params = useParams<{ id: string }>();
    return <ProspectDetailView id={params.id ?? ""} />;
}