import { openDB } from "idb";
import pako from "pako";

/**
 * ================================
 * CONFIG
 * ================================
 */
const DB_NAME = "WordAppDB";
const DB_VERSION = 1;
const STORE_NAME = "cacheStore";
const CACHE_VERSION = "v1"; // bump this when data shape changes

/**
 * ================================
 * DB INITIALIZATION
 * ================================
 */
async function getDB() {
  try {
    return await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  } catch (error) {
    // IndexedDB not available, return null for graceful fallback
    return null;
  }
}

/**
 * ================================
 * COMPRESSION HELPERS
 * ================================
 */

// Always compress – NO silent fallback
function compressData(data) {
  try {
    const json = JSON.stringify(data);
    return pako.deflate(json);
  } catch (error) {
    // Compression failed, return data as fallback
    return data;
  }
}

// Always decompress safely
function decompressData(data) {
  try {
    if (!(data instanceof Uint8Array)) {
      return data;
    }

    const json = pako.inflate(data, { to: "string" });
    return JSON.parse(json);
  } catch (error) {
    // Decompression failed, try safe fallback
    try {
      return typeof data === "string" ? JSON.parse(data) : data;
    } catch {
      return null;
    }
  }
}

/**
 * ================================
 * STORAGE API
 * ================================
 */

// Internal key helper (versioned keys)
function withVersion(key) {
  return `${key}_${CACHE_VERSION}`;
}

export async function setToStorage(key, value) {
  try {
    const db = await getDB();
    if (!db) return null; // IndexedDB unavailable
    const compressed = compressData(value);
    return await db.put(STORE_NAME, compressed, withVersion(key));
  } catch (error) {
    // Storage operation failed, continue gracefully
    return null;
  }
}

export async function getFromStorage(key) {
  try {
    const db = await getDB();
    if (!db) return null; // IndexedDB unavailable
    const stored = await db.get(STORE_NAME, withVersion(key));
    if (!stored) return null;
    return decompressData(stored);
  } catch (error) {
    // Retrieval failed, return null and app will fetch fresh data
    return null;
  }
}

export async function removeFromStorage(key) {
  try {
    const db = await getDB();
    if (!db) return null; // IndexedDB unavailable
    return await db.delete(STORE_NAME, withVersion(key));
  } catch (error) {
    // Deletion failed, continue gracefully
    return null;
  }
}

/**
 * ================================
 * CACHE INVALIDATION HELPERS
 * ================================
 */

// Call this AFTER create/update/delete word
export async function invalidateWordsCache() {
  await removeFromStorage("words");
}

// Optional: clear everything
export async function clearAllCache() {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  await tx.objectStore(STORE_NAME).clear();
  await tx.done;
}
