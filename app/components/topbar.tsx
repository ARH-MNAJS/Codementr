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
import { LucideBell } from "lucide-react";

interface TopbarProps {
  isSidebarCollapsed?: boolean;
}

export function Topbar({ isSidebarCollapsed = true }: TopbarProps) {
  const { user } = useUser();

  return (
    <div className="fixed top-0 right-0 z-30 flex h-16 items-center justify-between glass-panel border-b border-white/5 px-6 left-[70px] transition-all duration-200 dark:bg-gray-900 bg-gray-100">
      <div className="flex items-center">
        {/* Empty div to maintain layout */}
      </div>
      
      <div className="flex items-center space-x-5">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative dark:text-gray-400 text-gray-500 hover:bg-purple-100/90 dark:hover:bg-purple-900/80 hover:text-purple-700 dark:hover:text-purple-300 cursor-pointer transition-all duration-200">
          <LucideBell size={18} />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-purple-600 text-[10px] flex items-center justify-center text-white">
            3
          </span>
        </Button>
        
        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-purple-100/90 dark:hover:bg-purple-900/80 p-0 cursor-pointer transition-all duration-200">
              <Avatar className="h-8 w-8 ring-1 dark:ring-white/10 ring-gray-300/30">
                <AvatarImage
                  src={user?.image || undefined}
                  alt={user?.name || "User"}
                />
                <AvatarFallback className="dark:bg-gray-800 bg-gray-200 dark:text-gray-300 text-gray-600">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 dark:bg-gray-900 bg-white dark:border-white/10 border-gray-200 dark:text-gray-300 text-gray-700" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none dark:text-white text-gray-800">
                  {user?.name || "User Name"}
                </p>
                <p className="text-xs leading-none dark:text-gray-400 text-gray-500">
                  {user?.email || "user@example.com"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="dark:bg-white/10 bg-gray-200" />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/" })}
              className="cursor-pointer dark:hover:bg-white/5 hover:bg-purple-100/90 dark:focus:bg-white/5 focus:bg-purple-100/90 transition-all duration-200"
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}