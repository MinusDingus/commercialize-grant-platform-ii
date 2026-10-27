import { GrantApplication } from '../types/grant';

const DB_NAME = 'crg_commercialize_grant_v1';
const DB_VERSION = 1;
const STORE_NAME = 'applications_store';
const KEY = 'all_applications';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Persists application records to client-side IndexedDB.
 * Supports hundreds of megabytes without the 5MB browser localStorage limit.
 */
export async function saveApplicationsToIndexedDb(apps: GrantApplication[]): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(apps, KEY);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        console.warn('IndexedDB write error:', request.error);
        resolve(false);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (err) {
    console.warn('Failed to save applications to IndexedDB:', err);
    return false;
  }
}

/**
 * Loads application records from client-side IndexedDB.
 */
export async function loadApplicationsFromIndexedDb(): Promise<GrantApplication[] | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(KEY);

      request.onsuccess = () => {
        const result = request.result;
        if (Array.isArray(result) && result.length > 0) {
          resolve(result as GrantApplication[]);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.warn('IndexedDB read error:', request.error);
        resolve(null);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (err) {
    console.warn('Failed to load applications from IndexedDB:', err);
    return null;
  }
}

/**
 * Clears applications from IndexedDB.
 */
export async function clearApplicationsIndexedDb(): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(KEY);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch {
    return false;
  }
}
