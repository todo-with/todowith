import Sidebar from '@/components/layout/Sidebar';
import { UserProfileProvider } from '@/context/UserProfileContext';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
