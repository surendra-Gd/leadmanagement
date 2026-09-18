import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/app-shell";
import DashboardPage from "./app/(app)/dashboard/page";
import LeadsPage from "./app/(app)/leads/page";
import { LeadDetailPage } from "./app/(app)/leads/[id]/page";
import CompletedPage from "./app/(app)/completed/page";
import CancelledPage from "./app/(app)/cancelled/page";
import SettingsPage from "./app/(app)/settings/page";
import { LoginPage } from "./app/login/page";
import ProspectsPage from "@/app/(app)/prospect/page";
import {ProspectDetailPage} from "@/app/(app)/prospect/[id]/page";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppShell><Outlet /></AppShell>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/leads/:id" element={<LeadDetailPage />} />
        <Route path="/completed" element={<CompletedPage />} />
        <Route path="/cancelled" element={<CancelledPage />} />
        <Route path="/settings" element={<SettingsPage />} />
          <Route path="/prospects" element={<ProspectsPage />} />
          <Route path="/prospects/:id" element={<ProspectDetailPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
