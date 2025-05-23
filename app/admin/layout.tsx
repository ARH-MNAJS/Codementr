import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { ADMIN_GITHUB_USERNAME } from '../constants';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login');
  }
  
  // Redirect to dashboard if not admin
  const isAdmin = session.user?.username === ADMIN_GITHUB_USERNAME;
  if (!isAdmin) {
    redirect('/dashboard');
  }
  
  return <>{children}</>;
} 