'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    console.log('[Home] State check:', { isLoading, hasUser: !!user });
    if (isLoading) return;

    if (user) {
      console.log('[Home] Redirecting to /dashboard');
      router.replace('/dashboard');
    } else {
      console.log('[Home] Redirecting to /login');
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center h-screen bg-slate-950">
      <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
}
