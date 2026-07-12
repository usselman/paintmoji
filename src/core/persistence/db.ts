import type { CustomBrushPreset, PaintDocument } from "../../types";
const DB = "paintmoji-v1",
  STORE = "records";
function open() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function put(key: string, value: unknown) {
  const db = await open();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}
async function get<T>(key: string) {
  const db = await open();
  return new Promise<T | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE);
    const request = tx.objectStore(STORE).get(key);
    request.onsuccess = () => {
      db.close();
      resolve(request.result as T | undefined);
    };
    request.onerror = () => reject(request.error);
  });
}
export const saveAutosave = (doc: PaintDocument) => put("autosave", doc);
export const loadAutosave = () => get<PaintDocument>("autosave");
export const saveBrushes = (brushes: CustomBrushPreset[]) =>
  put("brushes", brushes);
export const loadBrushes = () => get<CustomBrushPreset[]>("brushes");
