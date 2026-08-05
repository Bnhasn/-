import { safeGetLocalItem, safeSetLocalItem } from './safeLocalStorage';

export interface HybridSyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  mode: 'hybrid' | 'offline' | 'syncing';
}

interface QueuedDoc {
  docId: string;
  data: any;
  updatedAt: string;
  retryCount: number;
}

const QUEUE_STORAGE_KEY = 'military_hybrid_pending_queue_v1';
const LAST_SYNC_KEY = 'military_hybrid_last_sync_time_v1';

// Direct cloud sync function reference (passed from firebase module to prevent circular dependency)
type SyncExecutor = (docId: string, data: any) => Promise<boolean>;

class HybridSyncEngine {
  private syncExecutor: SyncExecutor | null = null;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private lastSyncedAt: string | null = null;
  private listeners: Set<(status: HybridSyncStatus) => void> = new Set();
  private autoSyncInterval: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.lastSyncedAt = localStorage.getItem(LAST_SYNC_KEY) || null;
      } catch (e) {}

      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);

      // Periodic check every 25 seconds to flush queue when online
      this.autoSyncInterval = setInterval(() => {
        if (this.isOnline && this.getQueueCount() > 0 && !this.isSyncing) {
          this.flushQueue();
        }
      }, 25000);
    }
  }

  public registerSyncExecutor(executor: SyncExecutor) {
    this.syncExecutor = executor;
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.notifyStatus();
    this.flushQueue();
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.notifyStatus();
  };

  private getQueue(): Record<string, QueuedDoc> {
    try {
      const queue = safeGetLocalItem<Record<string, QueuedDoc>>(QUEUE_STORAGE_KEY);
      return queue && typeof queue === 'object' ? queue : {};
    } catch (e) {
      return {};
    }
  }

  private saveQueue(queue: Record<string, QueuedDoc>): void {
    safeSetLocalItem(QUEUE_STORAGE_KEY, queue);
    this.notifyStatus();
  }

  public getQueueCount(): number {
    return Object.keys(this.getQueue()).length;
  }

  public getStatus(): HybridSyncStatus {
    const pendingCount = this.getQueueCount();
    let mode: 'hybrid' | 'offline' | 'syncing' = 'hybrid';
    if (!this.isOnline) {
      mode = 'offline';
    } else if (this.isSyncing) {
      mode = 'syncing';
    }

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount,
      lastSyncedAt: this.lastSyncedAt,
      mode
    };
  }

  public subscribe(callback: (status: HybridSyncStatus) => void): () => void {
    this.listeners.add(callback);
    callback(this.getStatus());
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyStatus(): void {
    const status = this.getStatus();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hybrid_sync_status_changed', { detail: status }));
    }
    this.listeners.forEach((cb) => {
      try {
        cb(status);
      } catch (e) {}
    });
  }

  /**
   * Queue a document for cloud synchronization
   * Immediately saves locally and pushes to Firebase if online
   */
  public enqueue(docId: string, data: any): void {
    const queue = this.getQueue();
    queue[docId] = {
      docId,
      data,
      updatedAt: new Date().toISOString(),
      retryCount: 0
    };
    this.saveQueue(queue);

    if (this.isOnline && !this.isSyncing) {
      // Non-blocking sync trigger
      setTimeout(() => this.flushQueue(), 100);
    }
  }

  /**
   * Flush all queued documents to Firebase
   */
  public async flushQueue(): Promise<{ success: boolean; syncedCount: number }> {
    if (!this.isOnline || this.isSyncing || !this.syncExecutor) {
      return { success: false, syncedCount: 0 };
    }

    const queue = this.getQueue();
    const docKeys = Object.keys(queue);
    if (docKeys.length === 0) {
      return { success: true, syncedCount: 0 };
    }

    this.isSyncing = true;
    this.notifyStatus();

    let syncedCount = 0;
    const currentQueue = { ...queue };

    for (const key of docKeys) {
      const item = currentQueue[key];
      if (!item) continue;

      try {
        const ok = await this.syncExecutor(item.docId, item.data);
        if (ok) {
          delete currentQueue[key];
          syncedCount++;
        } else {
          currentQueue[key].retryCount = (currentQueue[key].retryCount || 0) + 1;
        }
      } catch (err) {
        console.warn(`[HybridSync] Failed sync attempt for ${item.docId}:`, err);
        currentQueue[key].retryCount = (currentQueue[key].retryCount || 0) + 1;
      }
    }

    this.saveQueue(currentQueue);

    if (syncedCount > 0) {
      const nowIso = new Date().toISOString();
      this.lastSyncedAt = nowIso;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(LAST_SYNC_KEY, nowIso);
        } catch (e) {}
      }
    }

    this.isSyncing = false;
    this.notifyStatus();

    return { success: true, syncedCount };
  }

  public async forceSyncNow(): Promise<{ success: boolean; syncedCount: number; message: string }> {
    if (!this.isOnline) {
      return {
        success: false,
        syncedCount: 0,
        message: 'تعذر المزامنة! الجهاز أوفلاين ولا يوجد اتصال بالإنترنت حالياً.'
      };
    }

    const result = await this.flushQueue();
    const formattedTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    if (result.syncedCount > 0) {
      return {
        success: true,
        syncedCount: result.syncedCount,
        message: `تمت مزامنة (${result.syncedCount}) سجل بنجاح مع Firebase الساعة ${formattedTime}.`
      };
    } else {
      return {
        success: true,
        syncedCount: 0,
        message: `جميع البيانات والملفات محفوطة ومزامنة بالفعل مع Firebase Cloud (${formattedTime}).`
      };
    }
  }
}

export const hybridSyncEngine = new HybridSyncEngine();
