import fs from 'fs';
import path from 'path';
import { ClientGallery } from './types';
import { slugify } from './vault-resolver';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'vaults.json');
const TEMP_FILE = path.join(DATA_DIR, 'vaults.json.tmp');

// In-memory cache for fast lookups across requests in the same Node process
let memoryCache: ClientGallery[] | null = null;

/**
 * Ensures the data directory exists
 */
function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

/**
 * Loads all vaults from disk or returns the in-memory cache
 */
export async function getAllServerGalleries(): Promise<ClientGallery[]> {
  if (memoryCache !== null) {
    return memoryCache;
  }

  ensureDataDir();

  try {
    if (!fs.existsSync(DATA_FILE)) {
      memoryCache = [];
      return [];
    }

    const content = await fs.promises.readFile(DATA_FILE, 'utf-8');
    if (!content.trim()) {
      memoryCache = [];
      return [];
    }

    const parsed = JSON.parse(content) as ClientGallery[];
    memoryCache = Array.isArray(parsed) ? parsed : [];
    return memoryCache;
  } catch (err) {
    console.error('Failed to read server vaults file:', err);
    return memoryCache || [];
  }
}

/**
 * Persists all vaults to disk atomically
 */
export async function saveServerGalleries(galleries: ClientGallery[]): Promise<void> {
  memoryCache = galleries;
  ensureDataDir();

  try {
    const serialized = JSON.stringify(galleries, null, 2);
    // Write to temporary file first then atomic rename
    await fs.promises.writeFile(TEMP_FILE, serialized, 'utf-8');
    await fs.promises.rename(TEMP_FILE, DATA_FILE);
  } catch (err) {
    console.error('Failed to write server vaults atomically, falling back to direct write:', err);
    try {
      await fs.promises.writeFile(DATA_FILE, JSON.stringify(galleries, null, 2), 'utf-8');
    } catch (writeErr) {
      console.error('Direct write to server vaults failed:', writeErr);
    }
  }
}

/**
 * Resolves a single vault by ID, vanitySlug, or title slug
 */
export async function getServerGallery(idOrSlug: string): Promise<ClientGallery | null> {
  if (!idOrSlug) return null;
  const galleries = await getAllServerGalleries();
  const normalized = idOrSlug.trim().toLowerCase();

  // 1. Exact ID match
  const directId = galleries.find((g) => g.id.toLowerCase() === normalized);
  if (directId) return directId;

  // 2. Exact vanitySlug match
  const directSlug = galleries.find(
    (g) => g.vanitySlug && g.vanitySlug.trim().toLowerCase() === normalized
  );
  if (directSlug) return directSlug;

  // 3. Normalized stripped match (ignoring vault_ or gallery_ prefix and dashes/underscores)
  const stripped = normalized.replace(/^(gallery|vault)_/, '').replace(/[_-]/g, '');
  const prefixMatch = galleries.find((g) => {
    const gStripped = g.id.toLowerCase().replace(/^(gallery|vault)_/, '').replace(/[_-]/g, '');
    if (gStripped === stripped) return true;
    if (g.vanitySlug && g.vanitySlug.toLowerCase().replace(/[_-]/g, '') === stripped) return true;
    return false;
  });
  if (prefixMatch) return prefixMatch;

  // 4. Title or client slug matching (e.g. 'fashion-shoot-0825' from 'Fashion shoot 08/25')
  const slugMatch = galleries.find((g) => {
    const titleSlug = slugify(g.title);
    const clientSlug = slugify(g.clientName);
    return (
      titleSlug === normalized ||
      clientSlug === normalized ||
      titleSlug.includes(normalized) ||
      normalized.includes(titleSlug)
    );
  });
  if (slugMatch) return slugMatch;

  return null;
}

/**
 * Upserts a vault on the server (adds or replaces)
 */
export async function upsertServerGallery(gallery: ClientGallery): Promise<ClientGallery> {
  const galleries = await getAllServerGalleries();
  const index = galleries.findIndex((g) => g.id === gallery.id);
  const updatedList = [...galleries];

  const prepared: ClientGallery = {
    ...gallery,
    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    updatedList[index] = prepared;
  } else {
    updatedList.unshift(prepared);
  }

  await saveServerGalleries(updatedList);
  return prepared;
}

/**
 * Deletes a vault on the server
 */
export async function deleteServerGallery(id: string): Promise<boolean> {
  const galleries = await getAllServerGalleries();
  const filtered = galleries.filter((g) => g.id !== id);
  if (filtered.length === galleries.length) {
    return false;
  }
  await saveServerGalleries(filtered);
  return true;
}
