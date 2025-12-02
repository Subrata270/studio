"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';

export default function DashboardPage() {
  const router = useRouter();
  const currentUser = useAppStore((state) => state.currentUser);

  useEffect(() => {
    console.log('📍 Dashboard page - Current user:', currentUser ? {
      email: currentUser.email,
      role: currentUser.role,
      subrole: currentUser.subrole,
      department: currentUser.department
    } : 'null');

    if (currentUser) {
      const targetPath = `/dashboard/${currentUser.role}`;
      console.log('🚀 Redirecting to:', targetPath);
      router.replace(targetPath);
    } else {
        console.log('⚠️ No current user, redirecting to home');
        router.replace('/');
    }
  }, [currentUser, router]);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <p>Loading your dashboard...</p>
      {currentUser && (
        <p className="text-sm text-muted-foreground ml-2">
          (Redirecting to {currentUser.role} portal...)
        </p>
      )}
    </div>
  );
}