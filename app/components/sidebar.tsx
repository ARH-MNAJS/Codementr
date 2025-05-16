"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { 
  LucideHome, 
  LucideUser, 
  LucideCode,
  LucideActivity,
  LucideUsers,
  LucideSettings,
  LucideChevronLeft, 
  LucideChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role?: "admin" | "user";
  onToggle?: (collapsed: boolean) => void;
}

export function Sidebar({ role = "user", onToggle }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const sidebarVariants = {
    expanded: { width: 240, transition: { duration: 0.2 } },
    collapsed: { width: 70, transition: { duration: 0.2 } },
  };

  // Only used for manual toggle via button
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };

  useEffect(() => {
    // Update parent component about initial state
    if (onToggle) {
      onToggle(true); // Always start collapsed
    }
  }, []);

  // Reset navigation state when pathname changes
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const handleMouseEnter = () => {
    setIsCollapsed(false);
    if (onToggle) {
      onToggle(false);
    }
  };

  const handleMouseLeave = () => {
    // Only collapse if we're not in the middle of navigation
    if (!isNavigating) {
      setIsCollapsed(true);
      if (onToggle) {
        onToggle(true);
      }
    }
  };

  const handleLinkClick = () => {
    // Mark that we're navigating so sidebar doesn't collapse
    setIsNavigating(true);
    // Sidebar will stay open until navigation completes (useEffect above)
  };

  const sidebarItems = role === "admin" 
    ? [
        { name: "Dashboard", href: "/admin", icon: LucideHome },
        { name: "Users", href: "/admin/users", icon: LucideUsers },
        { name: "Projects", href: "/admin/projects", icon: LucideCode },
        { name: "Activity", href: "/admin/activity", icon: LucideActivity },
        { name: "Settings", href: "/admin/settings", icon: LucideSettings },
      ]
    : [
        { name: "Home", href: "/dashboard", icon: LucideHome },
        { name: "Projects", href: "/dashboard/projects", icon: LucideCode },
        { name: "Settings", href: "/dashboard/settings", icon: LucideSettings },
      ];

  return (
    <motion.div
      ref={sidebarRef}
      variants={sidebarVariants}
      initial="collapsed"
      animate={isCollapsed ? "collapsed" : "expanded"}
      className="h-screen flex flex-col fixed top-0 left-0 z-40 glass-panel border-r border-white/5"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        {!isCollapsed && (
          <div className="font-bold text-xl text-white">
            Codementr
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
        >
          {isCollapsed ? <LucideChevronRight size={18} /> : <LucideChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 pt-8 px-3">
        <ul className="space-y-2">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center rounded-md p-2.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors",
                    isActive ? "bg-white/10 text-white" : "",
                    !isCollapsed && "justify-start w-full"
                  )}
                >
                  <item.icon size={20} className={isActive ? "text-purple-500" : ""} />
                  {!isCollapsed && (
                    <span className="ml-3 text-sm">
                      {item.name}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="mt-auto p-4 border-t border-white/5">
        <Link 
          href="/dashboard/profile" 
          onClick={handleLinkClick}
          className={cn(
            "flex items-center p-2 rounded-md hover:bg-white/10 transition-colors text-gray-400 hover:text-white",
            !isCollapsed && "justify-start"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-300 border border-gray-700">
            CM
          </div>
          {!isCollapsed && (
            <div className="ml-3 flex flex-col">
              <span className="text-sm text-white">User Name</span>
              <span className="text-xs text-gray-400">user@example.com</span>
            </div>
          )}
        </Link>
      </div>
    </motion.div>
  );
} 