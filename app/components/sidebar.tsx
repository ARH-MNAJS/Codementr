"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useRef, useEffect } from "react";
import { 
  LucideHome, 
  LucideUsers, 
  LucideCode,
  LucideSchool,
  LucideGitBranch,
  LucideMoon,
  LucideSun
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "@/app/providers/ThemeProvider";

interface SidebarProps {
  role?: "admin" | "user";
  onToggle?: (collapsed: boolean) => void;
}

export function Sidebar({ role = "user", onToggle }: SidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  // Use useEffect to notify parent component that sidebar is collapsed
  useEffect(() => {
    if (onToggle) {
      onToggle(true);
    }
  }, [onToggle]);

  const sidebarItems = role === "admin" 
    ? [
        { name: "Home", href: "/admin", icon: LucideHome },
        { name: "Users", href: "/admin/users", icon: LucideUsers },
        { name: "Colleges", href: "/admin/colleges", icon: LucideSchool },
        { name: "Projects", href: "/admin/projects", icon: LucideCode },
      ]
    : [
        { name: "Home", href: "/dashboard", icon: LucideHome },
        { name: "Projects", href: "/dashboard/projects", icon: LucideCode },
        { name: "Settings", href: "/dashboard/settings", icon: LucideHome },
      ];

  return (
    <TooltipProvider>
      <motion.div
        ref={sidebarRef}
        className="h-screen w-[70px] flex flex-col fixed top-0 left-0 z-40 glass-panel border-r dark:border-white/5 border-gray-200 dark:bg-gray-900 bg-gray-100"
      >
        <div className="flex items-center justify-center p-5 border-b dark:border-white/5 border-gray-200">
          <div className="text-2xl">
            <LucideGitBranch size={24} className="text-purple-500" />
          </div>
        </div>

        <nav className="flex-1 pt-8 px-3">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link 
                        href={item.href}
                        className={cn(
                          "flex items-center justify-center rounded-md p-2.5 dark:text-gray-400 text-gray-500 transition-all duration-200 cursor-pointer",
                          "hover:bg-purple-100/90 dark:hover:bg-purple-900/80 hover:text-purple-700 dark:hover:text-purple-300",
                          isActive ? "dark:bg-purple-900/80 bg-purple-100/90 dark:text-purple-300 text-purple-700" : ""
                        )}
                      >
                        <item.icon size={20} className={isActive ? "text-purple-500" : ""} />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Theme toggle at the bottom */}
        <div className="mt-auto pb-5 px-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-full rounded-md p-2.5 dark:text-gray-400 text-gray-500 transition-all duration-200 cursor-pointer hover:bg-purple-100/90 dark:hover:bg-purple-900/80 hover:text-purple-700 dark:hover:text-purple-300"
              >
                {theme === 'dark' ? (
                  <LucideSun size={20} className="text-yellow-400" />
                ) : (
                  <LucideMoon size={20} className="text-blue-400" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </TooltipContent>
          </Tooltip>
        </div>
      </motion.div>
    </TooltipProvider>
  );
} 