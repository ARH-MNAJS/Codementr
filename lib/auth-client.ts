"use client";

import { signIn } from "next-auth/react";

export const loginWithGithub = async () => {
  try {
    await signIn("github", { 
      callbackUrl: "/dashboard",
      redirect: true,
    });
  } catch (error) {
    console.error("GitHub login error:", error);
    throw error;
  }
}; 