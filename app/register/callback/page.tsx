"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { ADMIN_GITHUB_USERNAME } from "@/app/constants";

export default function RegisterCallback() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("Completing your registration...");

  useEffect(() => {
    const completeRegistration = async () => {
      if (status !== "authenticated" || !session?.user) {
        return;
      }

      try {
        // Get registration data from localStorage
        const registrationDataStr = localStorage.getItem('registration_data');
        if (!registrationDataStr) {
          setError("Registration data not found. Please try again.");
          setLoading(false);
          return;
        }

        const registrationData = JSON.parse(registrationDataStr);
        
        // Complete registration with GitHub data
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...registrationData,
            githubUsername: session.user.username || session.user.name,
            githubToken: (session as any).accessToken,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Check if the error is because the user already exists
          if (data.error?.includes('A user with this GitHub username already exists') || 
              data.error?.includes('A user with this email already exists')) {
            // Clear registration data from localStorage
            localStorage.removeItem('registration_data');
            
            // Redirect to login with accountExists flag
            setMessage("Account already exists. Redirecting to login...");
            setTimeout(() => {
              router.push("/login?accountExists=true");
            }, 2000);
            return;
          }
          
          throw new Error(data.error || 'Registration failed');
        }

        // Clear registration data from localStorage
        localStorage.removeItem('registration_data');
        
        // Redirect to appropriate dashboard
        const isAdmin = session?.user?.username === ADMIN_GITHUB_USERNAME;
        
        setMessage("Registration successful! Redirecting to dashboard...");
        setTimeout(() => {
          router.push(isAdmin ? "/admin" : "/dashboard");
        }, 2000);
      } catch (err) {
        console.error('Error completing registration:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      completeRegistration();
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [session, status, router]);

  return (
    <div className="dark-glow-bg min-h-screen flex flex-col items-center justify-center relative text-white overflow-hidden">
      {/* Background animated elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 -left-20 w-64 h-64 rounded-full bg-purple-700/10 blur-3xl"
          animate={{ 
            x: [0, 40, 0],
            opacity: [0.5, 0.7, 0.5] 
          }}
          transition={{ 
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        />
        <motion.div
          className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl"
          animate={{ 
            x: [0, -30, 0],
            opacity: [0.4, 0.6, 0.4] 
          }}
          transition={{ 
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>
      
      <div className="glass-card border border-white/5 p-8 max-w-md w-full text-center z-10">
        <h2 className="text-2xl font-bold mb-6 gradient-text">GitHub Integration</h2>
        
        {error ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        ) : (
          <>
            {loading ? (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
                <p>{message}</p>
              </div>
            ) : (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-md mb-6">
                {message}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 