import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2, CloudUpload, X } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface OfflineSyncBannerProps {
  storage: StorageService;
  onSyncComplete?: () => void;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({
  storage,
  onSyncComplete,
}) => {
  const { isOnline, isSyncing, pendingCount, lastSyncedAt, syncNow } = useOnlineStatus(storage);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [prevSyncing, setPrevSyncing] = useState(false);

  // Detect when syncing finishes successfully to show a brief toast
  useEffect(() => {
    if (prevSyncing && !isSyncing && isOnline && pendingCount === 0) {
      setShowSuccessToast(true);
      if (onSyncComplete) onSyncComplete();
      const timer = setTimeout(() => {
        setShowSuccessToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
    setPrevSyncing(isSyncing);
  }, [isSyncing, isOnline, pendingCount, prevSyncing, onSyncComplete]);

  // Reset dismissal if connectivity state changes
  useEffect(() => {
    setIsDismissed(false);
  }, [isOnline]);

  const handleManualSync = async () => {
    const success = await syncNow();
    if (success && onSyncComplete) {
      onSyncComplete();
    }
  };

  // Case 1: Just finished syncing -> show success pill
  if (showSuccessToast) {
    return (
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-emerald-700 text-white shadow-xl border border-emerald-500/40 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
        <span className="text-xs font-bold tracking-tight">
          All data synchronized perfectly!
        </span>
        <button
          onClick={() => setShowSuccessToast(false)}
          className="ml-2 p-1 rounded-lg hover:bg-emerald-800 text-emerald-200 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // If user dismissed current offline notice, do not block screen
  if (isDismissed) {
    // Show tiny indicator in bottom corner if offline or has pending items
    if (!isOnline || pendingCount > 0) {
      return (
        <button
          onClick={() => setIsDismissed(false)}
          className={`fixed bottom-4 left-4 z-40 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold shadow-md cursor-pointer transition-all ${
            !isOnline
              ? 'bg-amber-500 text-slate-950'
              : 'bg-emerald-600 text-white'
          }`}
          title="Click to view connectivity & sync details"
        >
          {!isOnline ? <WifiOff className="w-3.5 h-3.5" /> : <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />}
          <span>{!isOnline ? 'Offline' : `${pendingCount} queued`}</span>
        </button>
      );
    }
    return null;
  }

  // Case 2: Currently Offline
  if (!isOnline) {
    return (
      <aside
        aria-label="Offline Mode"
        className="relative z-40 w-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-4 py-2.5 shadow-sm border-b border-amber-600/30 flex items-center justify-between text-xs font-semibold"
      >
        <div className="flex items-center gap-2.5 max-w-4xl mx-auto">
          <div className="p-1 rounded-lg bg-black/10 shrink-0">
            <WifiOff className="w-4 h-4 text-slate-950" />
          </div>
          <p className="leading-tight">
            <strong>Offline Mode Active:</strong> IponTa is running smoothly without internet. All your transactions, edits, and budgets are saved locally and will auto-sync when you reconnect.
            {pendingCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-black/15 text-[11px] font-bold">
                {pendingCount} change{pendingCount > 1 ? 's' : ''} stored locally
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-lg hover:bg-black/10 text-slate-900 transition-colors ml-2"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  // Case 3: Reconnected & currently synchronizing
  if (isSyncing) {
    return (
      <aside
        aria-label="Synchronizing Data"
        className="relative z-40 w-full bg-gradient-to-r from-teal-600 to-emerald-700 text-white px-4 py-2 shadow-sm border-b border-emerald-600/40 flex items-center justify-center text-xs font-semibold gap-2 animate-pulse"
      >
        <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-emerald-200" />
        <span>Back Online &bull; Synchronizing offline changes with database...</span>
      </aside>
    );
  }

  // Case 4: Online, but there are pending changes that haven't synced yet
  if (pendingCount > 0) {
    return (
      <aside
        aria-label="Pending Offline Changes"
        className="relative z-40 w-full bg-slate-900 text-white px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-medium"
      >
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <CloudUpload className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            You have <strong>{pendingCount} unsynced change{pendingCount > 1 ? 's' : ''}</strong> from offline use.
          </span>
          <button
            onClick={handleManualSync}
            className="ml-3 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors cursor-pointer shadow-xs"
          >
            Sync Now
          </button>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </aside>
    );
  }

  return null;
};
