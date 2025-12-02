
"use client";

import { SidebarProvider } from '@/components/ui/sidebar';
import MainSidebar from './components/main-sidebar';
import Header from './components/header';
import { FirebaseClientProvider } from '@/firebase';
import { AuthGuard } from '@/components/auth-guard';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AuthGuard>
        <SidebarProvider>
          <div className="flex min-h-screen w-screen bg-background">
            <MainSidebar />
            <div className="flex-1 flex flex-col">
              <Header />
              <main className="flex-1 overflow-y-auto bg-secondary/40 p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-screen-2xl">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </AuthGuard>
    </FirebaseClientProvider>
  );
}
