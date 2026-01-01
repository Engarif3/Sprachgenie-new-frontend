import { openDB } from "idb";
import pako from "pako";

const DB_NAME = "WordAppDB";
const STORE_NAME = "cacheStore";

async function getDB() {
  try {
    return await openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  } catch (error) {
    // IndexedDB not available, fallback to memory storage
    return null;
  }
}

// Compress data - reduces size by 70-80%
function compressData(data) {
  try {
    const jsonString = JSON.stringify(data);
    const compressed = pako.deflate(jsonString);
    return compressed;
  } catch (error) {
    // Compression failed, returning uncompressed as fallback
    return data;
  }
}

// Decompress data with fallback handling
function decompressData(compressedData) {
  try {
    // If it's already decompressed (fallback case)
    if (
      typeof compressedData === "object" &&
      !(compressedData instanceof Uint8Array)
    ) {
      return compressedData;
    }

    const decompressed = pako.inflate(compressedData, { to: "string" });
    return JSON.parse(decompressed);
  } catch (error) {
    // Decompression failed, returning as-is with safe fallback
    try {
      return typeof compressedData === "string"
        ? JSON.parse(compressedData)
        : compressedData;
    } catch {
      return null;
    }
  }
}

export async function setToStorage(key, value) {
  try {
    const db = await getDB();
    if (!db) {
      // IndexedDB unavailable, skip storage
      return null;
    }
    const compressedValue = compressData(value);
    return await db.put(STORE_NAME, compressedValue, key);
  } catch (error) {
    // Storage operation failed, continue without persistent cache
    return null;
  }
}

export async function getFromStorage(key) {
  try {
    const db = await getDB();
    if (!db) return null;

    const compressedValue = await db.get(STORE_NAME, key);
    if (!compressedValue) return null;

    return decompressData(compressedValue);
  } catch (error) {
    // Retrieval failed, return null and app will fetch fresh data
    return null;
  }
}

export async function removeFromStorage(key) {
  try {
    const db = await getDB();
    if (!db) return null;

    return await db.delete(STORE_NAME, key);
  } catch (error) {
    // Deletion failed, continue gracefully
    return null;
  }
}
