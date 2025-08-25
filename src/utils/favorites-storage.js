import { openDB } from "idb";

const DB_NAME = "WordAppDB";
const FAVORITES_STORE = "favorites";

async function getDB() {
  return openDB(DB_NAME, 2, {
    // bump version from 1 → 2 so upgrade runs
    upgrade(db) {
      if (!db.objectStoreNames.contains(FAVORITES_STORE)) {
        db.createObjectStore(FAVORITES_STORE, { keyPath: "id" }); // use word.id
      }
    },
  });
}

export async function addFavorite(word) {
  const db = await getDB();
  return db.put(FAVORITES_STORE, word);
}

export async function getFavorite(id) {
  const db = await getDB();
  return db.get(FAVORITES_STORE, id);
}

export async function removeFavorite(id) {
  const db = await getDB();
  return db.delete(FAVORITES_STORE, id);
}

export async function getAllFavorites() {
  const db = await getDB();
  return db.getAll(FAVORITES_STORE);
}
