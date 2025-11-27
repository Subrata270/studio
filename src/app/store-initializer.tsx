'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/app-store';

/**
 * Ensures the Zustand store fetches Firestore data once per app lifecycle.
 */
export function StoreInitializer() {
  const syncFromFirestore = useAppStore((state) => state.syncFromFirestore);
  const hasFetchedFromFirestore = useAppStore((state) => state.hasFetchedFromFirestore);
  const isSyncing = useAppStore((state) => state.isSyncing);

  useEffect(() => {
    if (!hasFetchedFromFirestore && !isSyncing) {
      void syncFromFirestore();
    }
  }, [hasFetchedFromFirestore, isSyncing, syncFromFirestore]);

  return null;
}

