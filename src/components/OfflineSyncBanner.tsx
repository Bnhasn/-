import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { StorageService } from '../lib/storage';

interface OfflineSyncBannerProps {
  onDataSyncTriggered?: () => void;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({ onDataSyncTriggered }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [showSyncSuccess, setShowSyncSuccess] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = async () => {
      setIsOnline(true);
      setIsSyncing(true);

      // Trigger automatic background sync when connection restores
      try {
        if (onDataSyncTriggered) {
          onDataSyncTriggered();
        }
      } catch (err) {
        console.warn('Sync handler error:', err);
      } finally {
        setIsSyncing(false);
        setShowSyncSuccess(true);
        setTimeout(() => {
          setShowSyncSuccess(false);
        }, 5000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowSyncSuccess(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onDataSyncTriggered]);

  if (isOnline && !showSyncSuccess && !isSyncing) {
    return null;
  }

  return (
    <div className="w-full z-40 transition-all duration-300 font-['Cairo',sans-serif] print:hidden no-print">
      {!isOnline && (
        <div className="bg-amber-600/90 text-amber-950 px-4 py-2 text-xs font-bold shadow-md border-b border-amber-700/50 backdrop-blur-xs flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2 space-x-reverse text-white">
              <WifiOff className="w-4 h-4 text-amber-200 shrink-0 animate-pulse" />
              <span>
                <strong>وضع العمل بدون إنترنت (أوفلاين):</strong> أجهزتك محمية ويتم حفظ جميع الإدخالات والتحديثات محلياً الآن. ستتزامن البيانات تلقائياً فور توفر الاتصال.
              </span>
            </div>
            <span className="text-[10px] bg-amber-950/60 text-amber-200 px-2 py-0.5 rounded-md font-bold shrink-0">
              حفظ محلي مفعّل ✓
            </span>
          </div>
        </div>
      )}

      {isOnline && isSyncing && (
        <div className="bg-blue-600/90 text-white px-4 py-2 text-xs font-bold shadow-md border-b border-blue-700/50 backdrop-blur-xs">
          <div className="max-w-7xl mx-auto w-full flex items-center space-x-2 space-x-reverse">
            <RefreshCw className="w-4 h-4 text-blue-200 animate-spin shrink-0" />
            <span>تم استعادة الاتصال بالإنترنت! جاري تحديث البيانات ومزامنتها تلقائياً...</span>
          </div>
        </div>
      )}

      {isOnline && showSyncSuccess && !isSyncing && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold shadow-md border-b border-emerald-700/50 animate-in fade-in duration-300">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>تم الاتصال بالإنترنت وتحديث ومزامنة كافة البيانات والعمليات بنجاح!</span>
            </div>
            <button
              onClick={() => setShowSyncSuccess(false)}
              className="text-[10px] bg-emerald-800 hover:bg-emerald-900 text-white px-2 py-0.5 rounded-md font-bold"
            >
              تم
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
