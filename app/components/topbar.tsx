"use client";

import { useUser } from "@/hooks/useUser";
import { signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LucideBell, LucideSearch } from "lucide-react";
import { usePathname } from "next/navigation";

interface TopbarProps {
  isSidebarCollapsed?: boolean;
}

export function Topbar({ isSidebarCollapsed = false }: TopbarProps) {
  const { user } = useUser();
  const pathname = usePathname();
  
  // Get page title from pathname
  const getPageTitle = () => {
    if (pathname === '/dashboard' || pathname === '/') {
      return 'Home';
    }
    
    const path = pathname.split('/').filter(Boolean);
    
    if (path.length === 0) return 'Home';
    
    if (path[0] === 'admin') {
      return path.length > 1 ? path[1].charAt(0).toUpperCase() + path[1].slice(1) : 'Admin';
    }
    
    if (path[0] === 'dashboard') {
      return path.length > 1 ? path[1].charAt(0).toUpperCase() + path[1].slice(1) : 'Dashboard';
    }
    
    return path[0].charAt(0).toUpperCase() + path[0].slice(1);
  };

  return (
    <div
      className={`fixed top-0 right-0 z-30 flex h-16 items-center justify-between glass-panel border-b border-white/5 px-6 ${
        isSidebarCollapsed ? "left-[70px]" : "left-[240px]"
      } transition-all duration-200`}
    >
      <div className="flex items-center">
        <div className="text-lg font-medium text-white">{getPageTitle()}</div>
      </div>
      
      <div className="flex items-center space-x-5">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <div className="absolute left-3">
            <LucideSearch className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="h-9 w-64 rounded-md bg-black/30 border border-white/10 pl-9 pr-4 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
        
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white">
          <LucideBell size={18} />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-purple-600 text-[10px] flex items-center justify-center text-white">
            3
          </span>
        </Button>
        
        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-transparent">
              <Avatar className="h-8 w-8 ring-1 ring-white/10">
                <AvatarImage
                  src={user?.image || ""}
                  alt={user?.name || "User"}
                />
                <AvatarFallback className="bg-gray-800 text-gray-300">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-gray-900 border-white/10 text-gray-300" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-white">
                  {user?.name || "User Name"}
                </p>
                <p className="text-xs leading-none text-gray-400">
                  {user?.email || "user@example.com"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/" })}
              className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}