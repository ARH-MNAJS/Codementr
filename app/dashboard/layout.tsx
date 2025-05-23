import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login');
  }
  
  return <>{children}</>;
} 