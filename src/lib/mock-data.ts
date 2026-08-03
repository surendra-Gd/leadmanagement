import { Lead } from "@/lib/types";

const now = new Date();
const daysAgo = (days: number) =>
  new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

export const initialLeads: Lead[] = [
  {
    id: "lead-001",
    customerName: "Aarav Sharma",
    phone: "+91 98765 43210",
    email: "aarav@example.com",
    address: "Indiranagar, Bengaluru",
    serviceType: "Website Development",
    description: "Corporate website refresh with service pages and enquiry forms.",
    estimatedPrice: 85000,
    status: "in_progress",
    createdAt: daysAgo(18),
    updatedAt: daysAgo(2),
    payments: [
      {
        id: "pay-001",
        leadId: "lead-001",
        amount: 30000,
        paidAt: daysAgo(15),
        notes: "Advance received"
      }
    ],
    activities: [
      {
        id: "act-001",
        leadId: "lead-001",
        createdAt: daysAgo(2),
        userName: "Admin",
        message: "Homepage design approved"
      },
      {
        id: "act-002",
        leadId: "lead-001",
        createdAt: daysAgo(15),
        userName: "Admin",
        message: "Advance received"
      }
    ],
    notes: [
      {
        id: "note-001",
        leadId: "lead-001",
        createdAt: daysAgo(12),
        body: "Client prefers a clean layout with prominent phone CTA."
      }
    ]
  },
  {
    id: "lead-002",
    customerName: "Meera Iyer",
    phone: "+91 99887 76655",
    serviceType: "Mobile App",
    description: "Android WebView wrapper for an existing web product.",
    estimatedPrice: 125000,
    status: "confirmed",
    createdAt: daysAgo(10),
    updatedAt: daysAgo(7),
    payments: [],
    activities: [
      {
        id: "act-003",
        leadId: "lead-002",
        createdAt: daysAgo(7),
        userName: "Admin",
        message: "Quotation accepted by customer"
      }
    ],
    notes: []
  },
  {
    id: "lead-003",
    customerName: "Rohan Traders",
    phone: "+91 91234 56780",
    email: "accounts@rohantraders.in",
    address: "MG Road, Pune",
    serviceType: "ERP Dashboard",
    description: "Internal stock and invoice dashboard for operations team.",
    estimatedPrice: 210000,
    status: "completed",
    createdAt: daysAgo(55),
    updatedAt: daysAgo(4),
    completedAt: daysAgo(4),
    payments: [
      {
        id: "pay-002",
        leadId: "lead-003",
        amount: 160000,
        paidAt: daysAgo(35),
        notes: "Milestone one and two"
      },
      {
        id: "pay-003",
        leadId: "lead-003",
        amount: 50000,
        paidAt: daysAgo(4),
        notes: "Final settlement"
      }
    ],
    activities: [
      {
        id: "act-004",
        leadId: "lead-003",
        createdAt: daysAgo(4),
        userName: "Admin",
        message: "Project completed"
      }
    ],
    notes: []
  },
  {
    id: "lead-004",
    customerName: "Nisha Kapoor",
    phone: "+91 90909 80808",
    serviceType: "SEO Package",
    description: "Six-month search optimization campaign.",
    estimatedPrice: 60000,
    status: "not_confirmed",
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
    payments: [],
    activities: [
      {
        id: "act-005",
        leadId: "lead-004",
        createdAt: daysAgo(3),
        userName: "Admin",
        message: "Lead created"
      }
    ],
    notes: []
  },
  {
    id: "lead-005",
    customerName: "Global Interiors",
    phone: "+91 97777 44444",
    serviceType: "E-commerce",
    description: "Catalog store with custom quote request flow.",
    estimatedPrice: 150000,
    status: "cancelled",
    cancellationReason: "Customer paused the project budget.",
    createdAt: daysAgo(33),
    updatedAt: daysAgo(20),
    cancelledAt: daysAgo(20),
    payments: [],
    activities: [
      {
        id: "act-006",
        leadId: "lead-005",
        createdAt: daysAgo(20),
        userName: "Admin",
        message: "Lead cancelled"
      }
    ],
    notes: []
  }
];
