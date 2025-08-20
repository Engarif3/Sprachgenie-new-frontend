import { openDB } from "idb";

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

export async function setToStorage(key, value) {
  const db = await getDB();
  return db.put(STORE_NAME, value, key);
}

export async function getFromStorage(key) {
  const db = await getDB();
  return db.get(STORE_NAME, key);
}

export async function removeFromStorage(key) {
  const db = await getDB();
  return db.delete(STORE_NAME, key);
}
