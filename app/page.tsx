"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LucideGithub } from "lucide-react";
import { ADMIN_GITHUB_USERNAME } from "./constants";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      // Check if user is admin
      const isAdmin = session?.user?.username === ADMIN_GITHUB_USERNAME;
      router.push(isAdmin ? "/admin" : "/dashboard");
    }
  }, [session, status, router]);

  const handleGitHubSignIn = () => {
    signIn("github");
  };

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

      {/* Main content */}
      <div className="w-full max-w-screen-md text-center px-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 text-3xl font-medium"
        >
          Welcome To
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="gradient-text text-6xl md:text-7xl font-bold mb-6 tracking-tight"
        >
          Codementr
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-white/70 mb-10 max-w-lg mx-auto"
        >
          Mentoring coders with AI-driven insights and real-time project-based guidance.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mb-10 flex justify-center items-center"
        >
          <motion.button
            onClick={handleGitHubSignIn}
            className="github-connect-btn flex items-center justify-center gap-2"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <LucideGithub size={20} />
            Connect Your Github
          </motion.button>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center text-xs text-white/50 px-4 max-w-3xl z-10">
        <p className="mb-4">
          This application is the property of Codementr and is intended solely for customers who have legally
          obtained a copy of this application. Unauthorized reproduction, distribution, or disclosure of any part of
          this document is strictly prohibited. All rights reserved.
        </p>
        <p className="text-white/70">
          Made for innovation by Campus Credentials
        </p>
      </div>
    </div>
  );
}