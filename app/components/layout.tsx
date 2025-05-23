"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { BackgroundAnimation } from "./background-animation";
import "../dashboard-styles.css";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: "admin" | "user";
}

export function DashboardLayout({ children, role = "user" }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  
  const onSidebarToggle = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  };

  return (
    <div className="min-h-screen dark:text-white text-gray-800">
      <Sidebar role={role} onToggle={onSidebarToggle} />
      <Topbar isSidebarCollapsed={isSidebarCollapsed} />
      <main className="pt-16 pb-10 ml-[70px] transition-all duration-200">
        <div className="container mx-auto p-4 md:p-6">{children}</div>
      </main>
      
      {/* Background animation */}
      <BackgroundAnimation />
    </div>
  );
} 