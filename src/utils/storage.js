import { openDB } from "idb";
import pako from "pako";

const DB_NAME = "WordAppDB";
const STORE_NAME = "cacheStore";

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

// Compress data - reduces size by 70-80%
function compressData(data) {
  try {
    const jsonString = JSON.stringify(data);
    const compressed = pako.deflate(jsonString);
    return compressed;
  } catch (error) {
    console.warn("Compression failed, storing uncompressed");
    return data;
  }
}

// Decompress data
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
    console.warn("Decompression failed, returning as-is");
    return compressedData;
  }
}

export async function setToStorage(key, value) {
  const db = await getDB();
  const compressedValue = compressData(value);
  return db.put(STORE_NAME, compressedValue, key);
}

export async function getFromStorage(key) {
  const db = await getDB();
  const compressedValue = await db.get(STORE_NAME, key);
  if (!compressedValue) return null;

  return decompressData(compressedValue);
}

export async function removeFromStorage(key) {
  const db = await getDB();
  return db.delete(STORE_NAME, key);
}
