// app/admin/page.tsx
import { Metadata } from "next";
import AdminClient from "./AdminClient";

export const metadata: Metadata = {
  title: "Admin Dashboard | Pledge Tracker",
  description: "Manage pledges, items, and view all submissions.",
  robots: "noindex, nofollow",
};

export default function AdminPage() {
  return <AdminClient />;
}