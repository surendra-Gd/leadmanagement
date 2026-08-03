import { format, startOfMonth, subMonths } from "date-fns";
import { Lead, LeadStatus } from "@/lib/types";

export function getPaidAmount(lead: Lead) {
  return lead.payments.reduce((sum, payment) => sum + payment.amount, 0);
}

export function getPendingAmount(lead: Lead) {
  return Math.max(lead.estimatedPrice - getPaidAmount(lead), 0);
}

export function getDashboardStats(leads: Lead[]) {
  const activeLeads = leads.filter((lead) => !lead.deletedAt);
  const byStatus = activeLeads.reduce<Record<LeadStatus, number>>(
    (acc, lead) => {
      acc[lead.status] += 1;
      return acc;
    },
    {
      not_confirmed: 0,
      confirmed: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    }
  );

  const totalProjectValue = activeLeads.reduce(
    (sum, lead) => sum + lead.estimatedPrice,
    0
  );
  const totalReceived = activeLeads.reduce(
    (sum, lead) => sum + getPaidAmount(lead),
    0
  );
  const totalPending = activeLeads.reduce(
    (sum, lead) => sum + getPendingAmount(lead),
    0
  );
  const completed = byStatus.completed;
  const qualified = activeLeads.length - byStatus.cancelled;

  return {
    totalLeads: activeLeads.length,
    byStatus,
    totalProjectValue,
    totalReceived,
    totalPending,
    averageProjectValue: activeLeads.length
      ? Math.round(totalProjectValue / activeLeads.length)
      : 0,
    conversionRate: qualified ? Math.round((completed / qualified) * 100) : 0
  };
}

export function getMonthlySeries(leads: Lead[]) {
  const months = Array.from({ length: 6 })
    .map((_, index) => startOfMonth(subMonths(new Date(), 5 - index)))
    .map((date) => ({
      key: format(date, "yyyy-MM"),
      month: format(date, "MMM"),
      revenue: 0,
      completed: 0,
      leads: 0
    }));

  const lookup = new Map(months.map((month) => [month.key, month]));

  leads
    .filter((lead) => !lead.deletedAt)
    .forEach((lead) => {
      const leadMonth = lookup.get(format(new Date(lead.createdAt), "yyyy-MM"));
      if (leadMonth) {
        leadMonth.leads += 1;
      }

      lead.payments.forEach((payment) => {
        const month = lookup.get(format(new Date(payment.paidAt), "yyyy-MM"));
        if (month) {
          month.revenue += payment.amount;
        }
      });

      if (lead.completedAt) {
        const completedMonth = lookup.get(
          format(new Date(lead.completedAt), "yyyy-MM")
        );
        if (completedMonth) {
          completedMonth.completed += 1;
        }
      }
    });

  return months;
}
