import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin Panel — Kevin's Construction OS",
  description:
    "Executive operations workspace: Sales CRM, 4-Phase Construction Management, and Automated Invoice Verification.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}

