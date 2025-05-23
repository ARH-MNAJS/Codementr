'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTheme } from "@/app/providers/ThemeProvider";

export function BackgroundAnimation() {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <motion.div
        className={`absolute top-10 -left-52 w-[500px] h-[500px] rounded-full ${isDark ? 'bg-purple-700/15' : 'bg-purple-400/10'} blur-[100px]`}
        animate={{ 
          x: [0, 100, 0],
          y: [0, 50, 0],
          opacity: isDark ? [0.3, 0.5, 0.3] : [0.2, 0.3, 0.2] 
        }}
        transition={{ 
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut" 
        }}
      />
      <motion.div
        className={`absolute bottom-20 -right-52 w-[600px] h-[600px] rounded-full ${isDark ? 'bg-indigo-600/15' : 'bg-indigo-400/10'} blur-[100px]`}
        animate={{ 
          x: [0, -80, 0],
          y: [0, -60, 0],
          opacity: isDark ? [0.2, 0.4, 0.2] : [0.1, 0.2, 0.1] 
        }}
        transition={{ 
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: 1
        }}
      />
      <motion.div
        className={`absolute top-2/3 left-1/4 w-[400px] h-[400px] rounded-full ${isDark ? 'bg-blue-600/15' : 'bg-blue-400/10'} blur-[100px]`}
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          opacity: isDark ? [0.2, 0.3, 0.2] : [0.1, 0.15, 0.1] 
        }}
        transition={{ 
          duration: 12,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: 2
        }}
      />
    </div>
  );
} 