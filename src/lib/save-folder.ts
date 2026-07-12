/**
 * Guardar archivos en una CARPETA LOCAL elegida por el usuario (File System Access API,
 * Chrome/Edge). Se elige la carpeta una vez, se recuerda (IndexedDB) y los renders
 * se guardan ahí directamente. Si el navegador no lo soporta, se cae a la descarga normal.
 */
interface FileHandleLike {
  createWritable(): Promise<{ write(data: Blob): Promise<void>; close(): Promise<void> }>;
}
interface DirHandleLike {
  name: string;
  getFileHandle(name: string, opts?: { create?: boolean }): Promise<FileHandleLike>;
  queryPermission(opts: { mode: "read" | "readwrite" }): Promise<PermissionState>;
  requestPermission(opts: { mode: "read" | "readwrite" }): Promise<PermissionState>;
}

const DB_NAME = "mpp-fs";
const STORE = "handles";
const KEY = "downloadDir";

function openDB(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
    tx.onsuccess = () => res(tx.result as T | undefined);
    tx.onerror = () => rej(tx.error);
  });
}
async function idbSet(key: string, val: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readwrite").objectStore(STORE).put(val, key);
    tx.onsuccess = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

export function folderPickerSupported(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

/** Abre el selector de carpeta y la recuerda. Devuelve el nombre o null si se cancela. */
export async function pickDownloadFolder(): Promise<string | null> {
  try {
    const w = window as unknown as { showDirectoryPicker: (o?: { mode?: string }) => Promise<DirHandleLike> };
    const handle = await w.showDirectoryPicker({ mode: "readwrite" });
    await idbSet(KEY, handle);
    return handle.name;
  } catch { return null; } // el usuario canceló
}

/** Nombre de la carpeta guardada (sin pedir permiso), o null. */
export async function savedFolderName(): Promise<string | null> {
  try { const h = await idbGet<DirHandleLike>(KEY); return h?.name ?? null; } catch { return null; }
}

export async function clearDownloadFolder(): Promise<void> {
  try { await idbSet(KEY, null); } catch {}
}

/**
 * Guarda el blob en la carpeta elegida. Devuelve true si se guardó, false si no hay
 * carpeta o se denegó el permiso (entonces conviene caer a la descarga normal).
 */
export async function saveToFolder(filename: string, blob: Blob): Promise<boolean> {
  try {
    const handle = await idbGet<DirHandleLike>(KEY);
    if (!handle) return false;
    let perm = await handle.queryPermission({ mode: "readwrite" });
    if (perm !== "granted") perm = await handle.requestPermission({ mode: "readwrite" });
    if (perm !== "granted") return false;
    const fh = await handle.getFileHandle(filename, { create: true });
    const w = await fh.createWritable();
    await w.write(blob);
    await w.close();
    return true;
  } catch { return false; }
}
