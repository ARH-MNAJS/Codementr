'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function BackgroundAnimation() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute top-10 -left-52 w-[500px] h-[500px] rounded-full bg-purple-700/15 blur-[100px]"
        animate={{ 
          x: [0, 100, 0],
          y: [0, 50, 0],
          opacity: [0.3, 0.5, 0.3] 
        }}
        transition={{ 
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut" 
        }}
      />
      <motion.div
        className="absolute bottom-20 -right-52 w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[100px]"
        animate={{ 
          x: [0, -80, 0],
          y: [0, -60, 0],
          opacity: [0.2, 0.4, 0.2] 
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
        className="absolute top-2/3 left-1/4 w-[400px] h-[400px] rounded-full bg-blue-600/15 blur-[100px]"
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          opacity: [0.2, 0.3, 0.2] 
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