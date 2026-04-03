"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { UserProfileProvider } from '@/context/UserProfileContext';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.replace('/login');
    } else {
      setIsAuthChecking(false);
    }
  }, [router]);

  if (isAuthChecking) {
    return <div className="flex items-center justify-center min-h-screen text-slate-500">인증 확인 중...</div>;
  }

  return (
    <UserProfileProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 bg-white p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </UserProfileProvider>
  );
}
