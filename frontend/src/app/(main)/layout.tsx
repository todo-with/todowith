"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { UserProfileProvider } from '@/context/UserProfileContext';
import { useUserProfile } from '@/hooks/useQueries';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const { error } = useUserProfile();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.replace('/login');
    } else {
      setIsAuthChecking(false);
    }
  }, [router]);

  useEffect(() => {
    if (error) {
      localStorage.removeItem('access_token');
      router.replace('/login');
    }
  }, [error, router]);

  if (isAuthChecking) {
    return <div className="flex items-center justify-center min-h-screen text-slate-500">인증 확인 중...</div>;
  }

  return (
    <UserProfileProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar />
        <main className="flex-1 bg-white overflow-y-auto rounded-tl-[32px] shadow-2xl border-l border-t border-slate-100">
          <div className="py-12 px-8">
            <div className="max-w-5xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </UserProfileProvider>
  );
}
