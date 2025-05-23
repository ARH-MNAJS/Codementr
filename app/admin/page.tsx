"use client";

import { DashboardLayout } from "../components/layout";

export default function AdminDashboard() {
  return (
    <DashboardLayout role="admin">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold dark:text-white text-gray-800">Admin Dashboard</h1>
      </div>
      
      <div className="h-[70vh] flex items-center justify-center">
        <p className="text-xl dark:text-gray-400 text-gray-600">Welcome to the admin dashboard.</p>
      </div>
    </DashboardLayout>
  );
} 