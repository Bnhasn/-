import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, getFirestore, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { hybridSyncEngine } from './hybridSync';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  }, databaseId);
} catch (e) {
  firestoreInstance = getFirestore(app, databaseId);
}

export const db = firestoreInstance;

const MAX_DOC_BYTES = 600000; // Safe threshold well below 1MB Firestore limit
const ITEMS_PER_CHUNK = 300;

// Direct write to cloud - disabled for 100% local storage mode
export async function syncDocToCloudDirect<T>(_docId: string, _data: T): Promise<boolean> {
  return true;
}

// Synchronize document data - no-op for 100% local storage mode
export async function syncDocToCloud<T>(_docId: string, _data: T): Promise<void> {
  return;
}

// Subscribe to real-time cloud updates - no-op returning clean unsubscribe for local mode
export function subscribeCloudDoc<T>(
  _docId: string,
  _onDataReceived: (data: T) => void,
  _initialFallbackData?: T,
  _storageKey?: string
): () => void {
  return () => {};
}


