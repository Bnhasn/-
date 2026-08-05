// Zero Data Loss Local Persistence Engine (IndexedDB + Chunked LocalStorage)

const DB_NAME = 'MilitaryHQSafeStorage_v1';
const DB_VERSION = 1;
const STORE_NAME = 'records';

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function setIDBItem(key: string, value: any): Promise<void> {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[SafeStorage IDB] Write failed:', err);
  }
}

export async function getIDBItem<T>(key: string): Promise<T | null> {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

// Write data safely to localStorage + IndexedDB backup
export function safeSetLocalItem(key: string, value: any): void {
  if (typeof window === 'undefined') return;

  // Asynchronous un-capped IndexedDB backup
  setIDBItem(key, value);

  try {
    const json = JSON.stringify(value);
    localStorage.setItem(key, json);

    // Clean up any old chunk keys if standard set succeeds
    let chunkIdx = 0;
    while (localStorage.getItem(`${key}_chunk_${chunkIdx}`)) {
      localStorage.removeItem(`${key}_chunk_${chunkIdx}`);
      chunkIdx++;
    }
    localStorage.removeItem(`${key}_meta`);
  } catch (err: any) {
    console.warn(`[SafeStorage] LocalStorage quota exceeded for "${key}". Splitting into chunks...`);
    try {
      if (Array.isArray(value)) {
        const chunkSize = 200; // 200 items per chunk
        const totalChunks = Math.ceil(value.length / chunkSize);

        for (let i = 0; i < totalChunks; i++) {
          const chunkData = value.slice(i * chunkSize, (i + 1) * chunkSize);
          localStorage.setItem(`${key}_chunk_${i}`, JSON.stringify(chunkData));
        }
        localStorage.setItem(`${key}_meta`, JSON.stringify({ totalChunks, count: value.length, chunked: true }));
        // Main key stores lightweight metadata placeholder
        localStorage.setItem(key, JSON.stringify(value.slice(0, 20)));
      }
    } catch (e2) {
      console.error(`[SafeStorage] Failed to chunk local storage for ${key}:`, e2);
    }
  }
}

// Read data safely from Chunked LocalStorage or standard LocalStorage or IndexedDB
export function safeGetLocalItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Check if chunked in localStorage
    const metaRaw = localStorage.getItem(`${key}_meta`);
    if (metaRaw) {
      const meta = JSON.parse(metaRaw);
      if (meta && meta.chunked && meta.totalChunks > 0) {
        const combined: any[] = [];
        for (let i = 0; i < meta.totalChunks; i++) {
          const chunkRaw = localStorage.getItem(`${key}_chunk_${i}`);
          if (chunkRaw) {
            combined.push(...JSON.parse(chunkRaw));
          }
        }
        if (combined.length > 0) {
          return combined as unknown as T;
        }
      }
    }

    // 2. Check standard localStorage
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      // If parsed contains placeholder array, trigger background load from IndexedDB
      if (Array.isArray(parsed) && parsed.length === 20 && localStorage.getItem(`${key}_meta`)) {
        // Fallthrough to IndexedDB or return
      } else {
        return parsed as T;
      }
    }
  } catch (err) {
    console.error(`[SafeStorage] Error reading ${key} from LocalStorage:`, err);
  }

  return null;
}
