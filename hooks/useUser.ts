"use client";

import { useSession } from "next-auth/react";
import { ADMIN_GITHUB_USERNAME } from "@/app/constants";

interface ExtendedUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  username?: string | null;
}

export function useUser() {
  const { data: session, status } = useSession();
  
  const isAdmin = session?.user?.username === ADMIN_GITHUB_USERNAME;
  
  return {
    user: session?.user as ExtendedUser | undefined,
    isAdmin,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
} 