export async function get(key: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open('nexusflow-db', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('keyval');
    };
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('keyval')) {
        resolve(null);
        return;
      }
      const tx = db.transaction('keyval', 'readonly');
      const store = tx.objectStore('keyval');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as string | null ?? null);
      req.onerror = () => reject(req.error);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function set(key: string, value: string): Promise<void> {
  if (typeof window === 'undefined') return;
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open('nexusflow-db', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('keyval');
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('keyval', 'readwrite');
      const store = tx.objectStore('keyval');
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function del(key: string): Promise<void> {
  if (typeof window === 'undefined') return;
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open('nexusflow-db', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('keyval');
    };
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('keyval')) {
        resolve();
        return;
      }
      const tx = db.transaction('keyval', 'readwrite');
      const store = tx.objectStore('keyval');
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    };
    request.onerror = () => reject(request.error);
  });
}

export const idbStorage = {
  getItem: get,
  setItem: set,
  removeItem: del,
};
