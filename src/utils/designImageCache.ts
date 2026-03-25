// src/utils/designImageCache.ts
// IndexedDB cache for RSVP design images.
// Images are stored here on selection and uploaded to CDN only on Save Design.

const DB_NAME = "rsvp-design-cache";
const STORE_NAME = "images";
const DB_VERSION = 1;

export interface CachedImage {
  id: string;
  file: File;
  blobUrl: string;
  createdAt: number;
  eventId: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
}

/** Saves a file to IndexedDB and returns a blob URL for immediate preview use. */
export async function saveImageToCache(
  id: string,
  file: File,
  eventId: string
): Promise<string> {
  const blobUrl = URL.createObjectURL(file);
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const entry: CachedImage = { id, file, blobUrl, createdAt: Date.now(), eventId };
    const req = store.put(entry);
    req.onsuccess = () => resolve(blobUrl);
    req.onerror = (e) => reject((e.target as IDBRequest).error);
    tx.oncomplete = () => db.close();
  });
}

/** Retrieves a single cached image entry by ID, or null if not found. */
export async function getImageFromCache(id: string): Promise<CachedImage | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = (e) => resolve((e.target as IDBRequest<CachedImage>).result ?? null);
    req.onerror = (e) => reject((e.target as IDBRequest).error);
    tx.oncomplete = () => db.close();
  });
}

/** Returns all cached images for a given event. */
export async function getCachedImagesByEvent(eventId: string): Promise<CachedImage[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = (e) => {
      const all = (e.target as IDBRequest<CachedImage[]>).result ?? [];
      resolve(all.filter((img) => img.eventId === eventId));
    };
    req.onerror = (e) => reject((e.target as IDBRequest).error);
    tx.oncomplete = () => db.close();
  });
}

/** Removes a cache entry and revokes its blob URL. */
export async function removeCachedImage(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    // Revoke blob URL before deletion
    const getReq = store.get(id);
    getReq.onsuccess = (e) => {
      const entry = (e.target as IDBRequest<CachedImage>).result;
      if (entry?.blobUrl) URL.revokeObjectURL(entry.blobUrl);
      store.delete(id);
    };
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = (e) => reject((e.target as IDBTransaction).error);
  });
}

/** Deletes cache entries older than maxAgeDays and revokes their blob URLs. */
export async function cleanupExpiredImages(maxAgeDays: number): Promise<void> {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.openCursor();
    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (!cursor) return;
      const entry = cursor.value as CachedImage;
      if (entry.createdAt < cutoff) {
        URL.revokeObjectURL(entry.blobUrl);
        cursor.delete();
      }
      cursor.continue();
    };
    req.onerror = (e) => reject((e.target as IDBRequest).error);
    tx.oncomplete = () => { db.close(); resolve(); };
  });
}
