import { useEffect, useState, useCallback, useRef } from 'react';
import { StorageService } from '../services/storageService';

export interface OnlineStatusState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  syncNow: () => Promise<boolean>;
}

export function useOnlineStatus(storage?: StorageService): OnlineStatusState {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(() => {
    return storage ? storage.getPendingSyncCount() : 0;
  });
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    return storage ? storage.getLastSyncedAt() : null;
  });

  const storageRef = useRef(storage);
  storageRef.current = storage;

  const syncNow = useCallback(async (): Promise<boolean> => {
    if (!storageRef.current) return false;
    setIsSyncing(true);
    try {
      const result = await storageRef.current.syncPendingChanges(true);
      setPendingCount(storageRef.current.getPendingSyncCount());
      setLastSyncedAt(storageRef.current.getLastSyncedAt());
      return result.success;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync immediately when returning online
      if (storageRef.current) {
        setIsSyncing(true);
        storageRef.current.syncPendingChanges().finally(() => {
          setIsSyncing(false);
          if (storageRef.current) {
            setPendingCount(storageRef.current.getPendingSyncCount());
            setLastSyncedAt(storageRef.current.getLastSyncedAt());
          }
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsSyncing(false);
    };

    const handleSyncStatus = (event: Event) => {
      const customEvent = event as CustomEvent<{
        isSyncing: boolean;
        pendingCount: number;
        lastSyncedAt: string | null;
      }>;
      if (customEvent.detail) {
        setIsSyncing(customEvent.detail.isSyncing);
        setPendingCount(customEvent.detail.pendingCount);
        if (customEvent.detail.lastSyncedAt) {
          setLastSyncedAt(customEvent.detail.lastSyncedAt);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('iponta-sync-status', handleSyncStatus);

    // Initial check on mount
    if (storageRef.current) {
      setPendingCount(storageRef.current.getPendingSyncCount());
      setLastSyncedAt(storageRef.current.getLastSyncedAt());
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('iponta-sync-status', handleSyncStatus);
    };
  }, []);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncedAt,
    syncNow,
  };
}
