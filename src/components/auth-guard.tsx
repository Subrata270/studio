"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/store/app-store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const currentUser = useAppStore((state) => state.currentUser);
  const hasFetchedFromFirestore = useAppStore((state) => state.hasFetchedFromFirestore);
  const isSyncing = useAppStore((state) => state.isSyncing);
  const checkSession = useAppStore((state) => state.checkSession);
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for Firestore sync to complete before checking auth
    if (!hasFetchedFromFirestore || isSyncing) {
      return;
    }

    // Check if session is valid
    const isSessionValid = checkSession();
    
    if (!isSessionValid) {
      console.log('🔒 Invalid or expired session, redirecting to login...');
      router.push('/');
      return;
    }

    // Additional check for currentUser (should already be handled by checkSession)
    if (!currentUser) {
      console.log('🔒 No authenticated user found, redirecting to login...');
      router.push('/');
      return;
    }

    // Validate user role matches the current route
    const routeRoleMap: { [key: string]: string[] } = {
      '/dashboard/poc': ['poc'],
      '/dashboard/hod': ['hod'],
      '/dashboard/finance': ['finance'],
    };

    const currentRoute = Object.keys(routeRoleMap).find(route => pathname.startsWith(route));
    
    if (currentRoute) {
      const allowedRoles = routeRoleMap[currentRoute];
      if (!allowedRoles.includes(currentUser.role)) {
        console.log(`🚫 Access denied. User role: ${currentUser.role}, Required: ${allowedRoles.join(', ')}`);
        // Redirect to user's correct dashboard
        router.push(`/dashboard/${currentUser.role}`);
        return;
      }
    }

    console.log('✅ Auth check passed for user:', currentUser.email, 'Role:', currentUser.role);
    setIsChecking(false);
  }, [currentUser, hasFetchedFromFirestore, isSyncing, checkSession, router, pathname]);

  // Show loading state while checking authentication
  if (isChecking || isSyncing || !hasFetchedFromFirestore) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If no user after checking, don't render children (will redirect)
  if (!currentUser) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  return <>{children}</>;
}
