"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LucideGithub } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import { ADMIN_GITHUB_USERNAME } from "../constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

export default function AuthPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();

  // Registration state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [college, setCollege] = useState("");
  const [branch, setBranch] = useState("");
  const [colleges, setColleges] = useState<{ name: string; branches: string[] }[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("login");

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      const isAdmin = session?.user?.username === ADMIN_GITHUB_USERNAME;
      router.push(isAdmin ? "/admin" : "/dashboard");
    }
  }, [session, status, router]);

  useEffect(() => {
    // Check for registration error in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    const accountExists = urlParams.get('accountExists');
    const tabParam = urlParams.get('tab');
    
    if (errorParam) {
      setError("Authentication failed. Please try again.");
    }
    
    if (accountExists === 'true') {
      setActiveTab("login");
      toast({
        title: "Account already exists",
        description: "You already have an account. Please sign in.",
        variant: "default",
      });
    }
    
    if (tabParam === 'login' || tabParam === 'register') {
      setActiveTab(tabParam);
    }
  }, []);

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await fetch('/api/colleges');
        if (!response.ok) {
          throw new Error('Failed to fetch colleges');
        }
        const data = await response.json();
        setColleges(data);
      } catch (err) {
        console.error('Error fetching colleges:', err);
      }
    };

    fetchColleges();
  }, []);

  useEffect(() => {
    if (college) {
      const selectedCollege = colleges.find(c => c.name === college);
      if (selectedCollege) {
        setBranches(selectedCollege.branches);
        // Reset branch if the current one isn't in the new list
        if (!selectedCollege.branches.includes(branch)) {
          setBranch('');
        }
      } else {
        setBranches([]);
        setBranch('');
      }
    } else {
      setBranches([]);
      setBranch('');
    }
  }, [college, colleges, branch]);

  // Registration and GitHub auth flow
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !college || !branch) {
      setError("All fields are required");
      return;
    }
    
    // Validate email format
    if (!email.includes('@') || !email.includes('.')) {
      setError("Please enter a valid email address");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Store user details in localStorage for use after GitHub auth
      localStorage.setItem('registration_data', JSON.stringify({
        name,
        email,
        college,
        branch
      }));
      
      // Trigger GitHub OAuth flow via NextAuth
      signIn("github", { callbackUrl: "/register/callback" });
    } catch (err) {
      setError("Failed to process registration");
      console.error(err);
      setLoading(false);
    }
  };

  // Login with GitHub
  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signIn("github", { callbackUrl: "/dashboard" });
    } catch (err) {
      setError("Failed to sign in");
      console.error(err);
      setLoading(false);
    }
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
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card border border-white/5 p-8 max-w-md w-full z-10"
      >
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-2xl font-bold mb-6 text-center gradient-text"
            >
              Sign In with GitHub
            </motion.h2>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-md mb-6"
              >
                {error}
              </motion.div>
            )}
            
            <Button 
              onClick={handleLogin} 
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-[#24292e] hover:bg-[#24292e]/90 text-white"
            >
              <LucideGithub size={18} />
              <span>Continue with GitHub</span>
            </Button>
          </TabsContent>
          
          <TabsContent value="register">
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-2xl font-bold mb-6 text-center gradient-text"
            >
              Register with GitHub
            </motion.h2>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-md mb-6"
              >
                {error}
              </motion.div>
            )}
            
            <form onSubmit={handleRegister}>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-4"
              >
                <label htmlFor="name" className="block text-white mb-2">
                  Full Name
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-black/30 border-white/10 text-white cursor-text"
                  placeholder="Enter your full name"
                  required
                />
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mb-4"
              >
                <label htmlFor="email" className="block text-white mb-2">
                  College Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-black/30 border-white/10 text-white cursor-text"
                  placeholder="Enter your college email"
                  required
                />
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mb-4"
              >
                <label htmlFor="college" className="block text-white mb-2">
                  College
                </label>
                <select
                  id="college"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full rounded-md bg-black/30 border border-white/10 text-white h-10 px-3 py-2 text-sm cursor-pointer"
                  required
                >
                  <option value="">Select your college</option>
                  {colleges.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mb-6"
              >
                <label htmlFor="branch" className="block text-white mb-2">
                  Branch
                </label>
                <select
                  id="branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full rounded-md bg-black/30 border border-white/10 text-white h-10 px-3 py-2 text-sm cursor-pointer"
                  required
                  disabled={branches.length === 0}
                >
                  <option value="">Select your branch</option>
                  {branches.map((br) => (
                    <option key={br} value={br}>
                      {br}
                    </option>
                  ))}
                </select>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="flex flex-col space-y-4"
              >
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 bg-[#24292e] hover:bg-[#24292e]/90 text-white"
                >
                  <LucideGithub size={18} />
                  <span>Register with GitHub</span>
                </Button>
              </motion.div>
            </form>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 text-center text-sm text-white/50">
          {activeTab === "login" ? (
            <p>
              Don't have an account?{" "}
              <button 
                onClick={() => setActiveTab("register")} 
                className="text-white underline hover:text-white/80"
              >
                Register
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button 
                onClick={() => setActiveTab("login")} 
                className="text-white underline hover:text-white/80"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
} 