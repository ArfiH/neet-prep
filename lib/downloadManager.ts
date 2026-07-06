import * as SecureStore from 'expo-secure-store';
import { gcm } from '@noble/ciphers/aes.js';
import { getRandomBytes } from 'expo-crypto';
import ReactNativeBlobUtil from 'react-native-blob-util';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_STORE_KEY = 'pdf_encryption_key';
const DOWNLOADED_PDFS_KEY = 'downloaded_pdfs';

export type DownloadedPDF = {
  id: string;
  title: string;
  subject: string;
  pagesCount: number;
  downloadedAt: string;
};

function base64ToBytes(base64: string): Uint8Array {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function getKey(): Promise<Uint8Array> {
  let keyBase64 = await SecureStore.getItemAsync(KEY_STORE_KEY);
  if (!keyBase64) {
    const key = getRandomBytes(32);
    keyBase64 = bytesToBase64(key);
    await SecureStore.setItemAsync(KEY_STORE_KEY, keyBase64);
    return key;
  }
  return base64ToBytes(keyBase64);
}

export async function getDownloadedPDFs(): Promise<DownloadedPDF[]> {
  try {
    const json = await AsyncStorage.getItem(DOWNLOADED_PDFS_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

async function saveDownloadedPDFs(list: DownloadedPDF[]): Promise<void> {
  await AsyncStorage.setItem(DOWNLOADED_PDFS_KEY, JSON.stringify(list));
}

export async function isPDFDownloaded(pdfId: string): Promise<boolean> {
  const list = await getDownloadedPDFs();
  return list.some((p) => p.id === pdfId);
}

export async function getDownloadedIds(): Promise<string[]> {
  const list = await getDownloadedPDFs();
  return list.map((p) => p.id);
}

function getLocalPDFPath(pdfId: string): string {
  return `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${pdfId}.enc`;
}

export async function hasLocalPDF(pdfId: string): Promise<boolean> {
  try {
    return await ReactNativeBlobUtil.fs.exists(getLocalPDFPath(pdfId));
  } catch {
    return false;
  }
}

export async function downloadPDF(
  pdfId: string,
  pdfTitle: string,
  pdfSubject: string,
  pagesCount: number,
  url: string,
  headers: Record<string, string>,
  onProgress?: (received: number, total: number) => void
): Promise<void> {
  const documentDir = ReactNativeBlobUtil.fs.dirs.DocumentDir;
  const tempPath = `${documentDir}/${pdfId}.tmp`;
  const encPath = getLocalPDFPath(pdfId);

  const res = await ReactNativeBlobUtil.config({ path: tempPath })
    .fetch('GET', url, headers)
    .progress({ count: 10 }, (received: number, total: number) => {
      onProgress?.(received, total);
    });

  const status = res.respInfo?.status;
  if (status !== 200 && status !== 206) {
    await ReactNativeBlobUtil.fs.unlink(tempPath).catch(() => {});
    throw new Error(`Download failed with status ${status}`);
  }

  const base64 = await ReactNativeBlobUtil.fs.readFile(tempPath, 'base64');
  await ReactNativeBlobUtil.fs.unlink(tempPath).catch(() => {});

  const plainBytes = base64ToBytes(base64);
  const key = await getKey();
  const iv = getRandomBytes(12);
  const cipher = gcm(key, iv);
  const ciphertext = cipher.encrypt(plainBytes);

  const combined = new Uint8Array(iv.length + ciphertext.length);
  combined.set(iv);
  combined.set(ciphertext, iv.length);
  const combinedB64 = bytesToBase64(combined);

  await ReactNativeBlobUtil.fs.writeFile(encPath, combinedB64, 'base64');

  const list = await getDownloadedPDFs();
  const existingIndex = list.findIndex((p) => p.id === pdfId);
  const entry: DownloadedPDF = {
    id: pdfId,
    title: pdfTitle,
    subject: pdfSubject,
    pagesCount,
    downloadedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    list[existingIndex] = entry;
  } else {
    list.push(entry);
  }
  await saveDownloadedPDFs(list);
}

export async function deleteLocalPDF(pdfId: string): Promise<boolean> {
  const encPath = getLocalPDFPath(pdfId);
  try {
    const exists = await ReactNativeBlobUtil.fs.exists(encPath);
    if (exists) {
      await ReactNativeBlobUtil.fs.unlink(encPath);
    }
    const list = await getDownloadedPDFs();
    await saveDownloadedPDFs(list.filter((p) => p.id !== pdfId));
    return true;
  } catch {
    return false;
  }
}

const CACHE_DIR = ReactNativeBlobUtil.fs.dirs.CacheDir;
const TEMP_FILE_PREFIX = 'pdf_';
const MAX_CACHED_FILES = 20;
const MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000;

async function getTempPath(pdfId: string): Promise<string> {
  return `${CACHE_DIR}/${TEMP_FILE_PREFIX}${pdfId}.pdf`;
}

export async function getCachedTempPath(pdfId: string): Promise<string | null> {
  const path = await getTempPath(pdfId);
  const exists = await ReactNativeBlobUtil.fs.exists(path);
  if (!exists) return null;
  return path;
}

export async function cleanupTempCache(): Promise<void> {
  try {
    const files = await ReactNativeBlobUtil.fs.ls(CACHE_DIR);
    const pdfFiles = files.filter(f => f.startsWith(TEMP_FILE_PREFIX) && f.endsWith('.pdf'));
    if (pdfFiles.length <= MAX_CACHED_FILES) return;

    const withStats: { name: string; mtime: number }[] = [];
    for (const f of pdfFiles) {
      try {
        const stat = await ReactNativeBlobUtil.fs.stat(`${CACHE_DIR}/${f}`);
        withStats.push({ name: f, mtime: new Date(stat.lastModified).getTime() });
      } catch {
        withStats.push({ name: f, mtime: 0 });
      }
    }

    withStats.sort((a, b) => b.mtime - a.mtime);
    const toDelete = withStats.slice(MAX_CACHED_FILES);
    for (const f of toDelete) {
      ReactNativeBlobUtil.fs.unlink(`${CACHE_DIR}/${f.name}`).catch(() => {});
    }
  } catch {
    // cleanup is best-effort
  }
}

export async function getDecryptedTempPath(pdfId: string): Promise<string> {
  const cached = await getCachedTempPath(pdfId);
  if (cached) return cached;

  const encPath = getLocalPDFPath(pdfId);
  const combinedB64 = await ReactNativeBlobUtil.fs.readFile(encPath, 'base64');
  const combined = base64ToBytes(combinedB64);

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const key = await getKey();
  const cipher = gcm(key, iv);
  const plainBytes = cipher.decrypt(ciphertext);

  const plainB64 = bytesToBase64(plainBytes);
  const tempPath = await getTempPath(pdfId);

  await ReactNativeBlobUtil.fs.writeFile(tempPath, plainB64, 'base64');

  cleanupTempCache();

  return tempPath;
}
