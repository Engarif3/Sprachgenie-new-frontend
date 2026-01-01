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
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

/**
 * ================================
 * COMPRESSION HELPERS
 * ================================
 */

// Always compress – NO silent fallback
function compressData(data) {
  const json = JSON.stringify(data);
  return pako.deflate(json);
}

// Always decompress safely
function decompressData(data) {
  if (!(data instanceof Uint8Array)) {
    return data;
  }

  const json = pako.inflate(data, { to: "string" });
  return JSON.parse(json);
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
  const db = await getDB();
  const compressed = compressData(value);
  return db.put(STORE_NAME, compressed, withVersion(key));
}

export async function getFromStorage(key) {
  const db = await getDB();
  const stored = await db.get(STORE_NAME, withVersion(key));
  if (!stored) return null;
  return decompressData(stored);
}

export async function removeFromStorage(key) {
  const db = await getDB();
  return db.delete(STORE_NAME, withVersion(key));
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
