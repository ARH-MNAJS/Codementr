"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface AnimatedGradientBgProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedGradientBg({
  children,
  className = "",
}: AnimatedGradientBgProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.div
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#4f46e5,#8b5cf6,#06b6d4)]"
        style={{
          backgroundSize: "200% 200%",
        }}
        animate={{
          backgroundPosition: [
            `${0 + mousePosition.x * 20}% ${0 + mousePosition.y * 20}%`,
            `${100 - mousePosition.x * 20}% ${0 + mousePosition.y * 20}%`,
            `${100 - mousePosition.x * 20}% ${100 - mousePosition.y * 20}%`,
            `${0 + mousePosition.x * 20}% ${100 - mousePosition.y * 20}%`,
            `${0 + mousePosition.x * 20}% ${0 + mousePosition.y * 20}%`,
          ],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear",
        }}
      />
      <div className="relative h-full w-full backdrop-blur-[100px]">
        {children}
      </div>
    </div>
  );
} 