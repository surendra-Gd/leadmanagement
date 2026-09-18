export type RecordType = "lead" | "prospect";
export type ProspectStatus = "warm" | "cold" | "not_interested";

export type LeadStatus =
  | "not_confirmed"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export type SortOption = "newest" | "oldest" | "highest" | "lowest";

export type Payment = {
  id: string;
  leadId: string;
  amount: number;
  paidAt: string;
  notes?: string;
};

export type LeadActivity = {
  id: string;
  leadId: string;
  createdAt: string;
  userName: string;
  message: string;
};

export type LeadNote = {
  id: string;
  leadId: string;
  createdAt: string;
  body: string;
};

export type Lead = {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  serviceType: string;
  description: string;
  estimatedPrice: number;
  status: LeadStatus;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  deletedAt?: string;
  payments: Payment[];
  activities: LeadActivity[];
  notes: LeadNote[];
  recordType: RecordType;
  prospectStatus?: ProspectStatus;
};

export type LeadInput = {
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  serviceType: string;
  description: string;
  estimatedPrice: number;
  status: LeadStatus;
  cancellationReason?: string;
  recordType?: RecordType;
  prospectStatus?: ProspectStatus;
};

export const leadStatusLabels: Record<LeadStatus, string> = {
  not_confirmed: "Not Confirmed",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled"
};

export const leadStatuses: LeadStatus[] = [
  "not_confirmed",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled"
];
