"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  FileX2,
  TrendingUp,
  Users
} from "lucide-react";
import type { ElementType } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeadStore } from "@/lib/store";
import { getDashboardStats, getMonthlySeries } from "@/lib/analytics";
import { formatCurrency } from "@/lib/utils";

export function DashboardView() {
  const { leads, isLoading } = useLeadStore();
  const stats = getDashboardStats(leads);
  const monthly = getMonthlySeries(leads);

  const cards = [
    {
      label: "Total Leads",
      value: stats.totalLeads,
      icon: Users,
      tone: "text-sky-600"
    },
    {
      label: "Confirmed",
      value: stats.byStatus.confirmed,
      icon: CheckCircle2,
      tone: "text-emerald-600"
    },
    {
      label: "Not Confirmed",
      value: stats.byStatus.not_confirmed,
      icon: Clock3,
      tone: "text-slate-600 dark:text-slate-300"
    },
    {
      label: "In Progress",
      value: stats.byStatus.in_progress,
      icon: TrendingUp,
      tone: "text-amber-600"
    },
    {
      label: "Completed",
      value: stats.byStatus.completed,
      icon: FileCheck2,
      tone: "text-teal-600"
    },
    {
      label: "Cancelled",
      value: stats.byStatus.cancelled,
      icon: FileX2,
      tone: "text-rose-600"
    }
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Business overview, revenue movement, conversion, and current lead health."
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="mt-2 text-2xl font-semibold">{card.value}</p>
                  </div>
                  <Icon className={`h-5 w-5 ${card.tone}`} aria-hidden />
                </div>
              </CardContent>
            </Card>
          );
        })}
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <FinancialCard
          label="Total Project Value"
          value={formatCurrency(stats.totalProjectValue)}
          icon={CircleDollarSign}
        />
        <FinancialCard
          label="Total Received"
          value={formatCurrency(stats.totalReceived)}
          icon={CheckCircle2}
        />
        <FinancialCard
          label="Total Pending"
          value={formatCurrency(stats.totalPending)}
          icon={Clock3}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{ borderRadius: 8 }}
                  />
                  <Area
                    dataKey="revenue"
                    type="monotone"
                    stroke="#0284c7"
                    fill="#7dd3fc"
                    fillOpacity={0.35}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-72 flex-col justify-center">
              <p className="text-5xl font-semibold">{stats.conversionRate}%</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Completed projects compared with non-cancelled leads.
              </p>
              <div className="mt-6 h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(stats.conversionRate, 100)}%` }}
                />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Average project value: {formatCurrency(stats.averageProjectValue)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Monthly Completed Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8 }} />
                <Bar dataKey="completed" fill="#14b8a6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function FinancialCard({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string;
  icon: ElementType;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
        <Icon className="h-6 w-6 text-primary" aria-hidden />
      </CardContent>
    </Card>
  );
}
