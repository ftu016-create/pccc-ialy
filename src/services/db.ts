import { ReportData } from '../types';

const DB_NAME = 'pccc_ialy_db';
const DB_VERSION = 1;
const STORE_REPORTS = 'reports';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB not supported in this environment'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_REPORTS)) {
        db.createObjectStore(STORE_REPORTS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

export async function idbGetAllReports(): Promise<ReportData[]> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_REPORTS, 'readonly');
      const store = transaction.objectStore(STORE_REPORTS);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('idbGetAllReports error:', err);
    return [];
  }
}

export async function idbGetReport(id: string): Promise<ReportData | null> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_REPORTS, 'readonly');
      const store = transaction.objectStore(STORE_REPORTS);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('idbGetReport error:', err);
    return null;
  }
}

export async function idbSaveReport(report: ReportData): Promise<void> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_REPORTS, 'readwrite');
      const store = transaction.objectStore(STORE_REPORTS);
      const request = store.put(report);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('idbSaveReport error:', err);
  }
}

export async function idbSaveAllReports(reports: ReportData[]): Promise<void> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_REPORTS, 'readwrite');
      const store = transaction.objectStore(STORE_REPORTS);

      reports.forEach((rep) => {
        store.put(rep);
      });

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  } catch (err) {
    console.warn('idbSaveAllReports error:', err);
  }
}

export async function idbDeleteReport(id: string): Promise<void> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_REPORTS, 'readwrite');
      const store = transaction.objectStore(STORE_REPORTS);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('idbDeleteReport error:', err);
  }
}
