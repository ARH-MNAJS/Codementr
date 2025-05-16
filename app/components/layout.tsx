"use client";

import { useState, useEffect } from "react";
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
  
  // Ensure dark mode is active for the dashboard
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  const onSidebarToggle = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  };

  return (
    <div className="min-h-screen text-white">
      <Sidebar role={role} onToggle={onSidebarToggle} />
      <Topbar isSidebarCollapsed={isSidebarCollapsed} />
      <main
        className={`pt-16 pb-10 transition-all duration-200 ${
          isSidebarCollapsed ? "ml-[70px]" : "ml-[240px]"
        }`}
      >
        <div className="container mx-auto p-4 md:p-6">{children}</div>
      </main>
      
      {/* Background animation */}
      <BackgroundAnimation />
    </div>
  );
} 