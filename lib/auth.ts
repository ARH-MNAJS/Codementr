import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Re-export authOptions for use in API routes
export { authOptions };

// Define the extended session type
export interface ExtendedSession {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username?: string | null;
  };
}

// Get the server session
export async function getSession() {
  return await getServerSession(authOptions);
}

// Check if the user is authenticated
export async function checkAuth() {
  const session = await getSession();
  
  if (!session || !session.user) {
    redirect("/");
  }
  
  return session;
}

// Check if the user is an admin
export async function checkAdmin() {
  const session = await getSession() as ExtendedSession;
  
  if (!session || !session.user) {
    redirect("/");
  }
  
  // Check if the user's GitHub username matches the admin username
  const isAdmin = session.user.username === process.env.ADMIN_GITHUB_USERNAME;
  
  if (!isAdmin) {
    redirect("/dashboard");
  }
  
  return session;
}

// Check if user is authenticated on the client side
export function useIsAuthenticated() {
  // This is a placeholder - will be implemented in a React hook
  return true;
} 