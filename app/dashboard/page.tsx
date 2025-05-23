"use client";

import { DashboardLayout } from "../components/layout";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold dark:text-white text-gray-800">Dashboard</h1>
      </div>
      
      <div className="h-[70vh] flex items-center justify-center">
        <p className="text-xl dark:text-gray-400 text-gray-600">Welcome to your dashboard.</p>
      </div>
    </DashboardLayout>
  );
}