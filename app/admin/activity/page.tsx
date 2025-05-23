"use client";

import { DashboardLayout } from "../../components/layout";

export default function AdminActivity() {
  return (
    <DashboardLayout role="admin">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Activity</h1>
      </div>
      
      <div className="h-[70vh] flex items-center justify-center">
        <p className="text-xl text-gray-400">Activity logs will appear here.</p>
      </div>
    </DashboardLayout>
  );
} 