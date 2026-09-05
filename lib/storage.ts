import { ClientGallery, GeneratedConcept, PhotoItem } from './types';
import { createDefaultAccessKeys } from './security';

const GALLERIES_STORAGE_KEY = 'aperture_photographer_galleries_v3';
const CONCEPTS_STORAGE_KEY = 'aperture_studio_concepts_v3';
export const DEMO_PURGED_FLAG_KEY = 'aperture_demo_purged_v3';

// Clean production initial collections (zero sample/test data)
export const INITIAL_DEMO_GALLERIES: ClientGallery[] = [];
export const INITIAL_CONCEPTS: GeneratedConcept[] = [];

type StorageListener = () => void;
const galleryListeners = new Set<StorageListener>();
const conceptListeners = new Set<StorageListener>();

let cachedGalleries: ClientGallery[] = [];
let lastGalleriesRaw: string | null = null;

let cachedConcepts: GeneratedConcept[] = [];
let lastConceptsRaw: string | null = null;

export function subscribeGalleries(listener: StorageListener): () => void {
  galleryListeners.add(listener);
  return () => galleryListeners.delete(listener);
}

export function subscribeConcepts(listener: StorageListener): () => void {
  conceptListeners.add(listener);
  return () => conceptListeners.delete(listener);
}

function notifyGalleries() {
  galleryListeners.forEach((l) => l());
}

function notifyConcepts() {
  conceptListeners.forEach((l) => l());
}

const LEGACY_DEMO_IDS = new Set(['gallery_lake_como_2026', 'gallery_vogue_editorial_2026']);
const LEGACY_CONCEPT_IDS = new Set(['concept_01', 'concept_02']);

export function getGalleries(): ClientGallery[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_GALLERIES;
  try {
    const raw = localStorage.getItem(GALLERIES_STORAGE_KEY);

    if (!raw) {
      if (!lastGalleriesRaw) {
        localStorage.setItem(GALLERIES_STORAGE_KEY, JSON.stringify([]));
        cachedGalleries = [];
        lastGalleriesRaw = JSON.stringify([]);
      }
      return cachedGalleries;
    }
    if (raw === lastGalleriesRaw) {
      return cachedGalleries;
    }
    const parsed: ClientGallery[] = JSON.parse(raw);

    // Strip legacy demo/sample records from prior test runs
    const cleanGalleries = parsed.filter((g) => !LEGACY_DEMO_IDS.has(g.id));

    // Ensure all user galleries have default RBAC access keys
    const enriched = cleanGalleries.map((g) => {
      if (!g.accessKeys || g.accessKeys.length === 0) {
        return { ...g, accessKeys: createDefaultAccessKeys(g) };
      }
      return g;
    });

    if (cleanGalleries.length !== parsed.length) {
      const updatedRaw = JSON.stringify(enriched);
      localStorage.setItem(GALLERIES_STORAGE_KEY, updatedRaw);
      lastGalleriesRaw = updatedRaw;
    } else {
      lastGalleriesRaw = raw;
    }

    cachedGalleries = enriched;
    return cachedGalleries;
  } catch {
    return [];
  }
}

export function purgeAllDemoData(): void {
  if (typeof window === 'undefined') return;
  const current = getGalleries();
  const cleanGalleries = current.filter((g) => !LEGACY_DEMO_IDS.has(g.id));
  localStorage.setItem(DEMO_PURGED_FLAG_KEY, 'true');
  saveGalleries(cleanGalleries);
}

export function restoreDemoData(): void {
  // Production environment: test data disabled
}

export function hasDemoData(): boolean {
  return false;
}

let batchSyncTimeout: any = null;
function triggerBatchSync(galleries: ClientGallery[]): void {
  if (typeof window === 'undefined') return;
  if (batchSyncTimeout) clearTimeout(batchSyncTimeout);
  batchSyncTimeout = setTimeout(() => {
    fetch('/api/vaults', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(galleries),
    }).catch((err) => {
      console.warn('Failed to sync galleries batch to server:', err);
    });
  }, 100);
}

export function saveGalleries(galleries: ClientGallery[]): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = JSON.stringify(galleries);
    localStorage.setItem(GALLERIES_STORAGE_KEY, raw);
    cachedGalleries = galleries;
    lastGalleriesRaw = raw;
    notifyGalleries();
    triggerBatchSync(galleries);
  } catch (err) {
    console.error('Failed to save galleries to localStorage:', err);
  }
}

export function getGalleryById(id: string): ClientGallery | undefined {
  const galleries = getGalleries();
  return galleries.find((g) => g.id === id);
}

/**
 * Asynchronously persists a gallery to the server
 */
function syncGalleryToServer(gallery: ClientGallery): void {
  if (typeof window === 'undefined') return;
  fetch('/api/vaults', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(gallery),
  }).catch((err) => {
    console.warn('Background sync to server failed:', err);
  });
}

/**
 * Asynchronously deletes a gallery from the server
 */
function deleteGalleryFromServer(id: string): void {
  if (typeof window === 'undefined') return;
  fetch(`/api/vaults/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }).catch((err) => {
    console.warn('Background delete from server failed:', err);
  });
}

export function upsertGallery(gallery: ClientGallery): void {
  const galleries = [...getGalleries()];
  const index = galleries.findIndex((g) => g.id === gallery.id);
  
  // Guarantee accessKeys exist
  const ensuredGallery: ClientGallery = {
    ...gallery,
    accessKeys: gallery.accessKeys && gallery.accessKeys.length > 0 ? gallery.accessKeys : createDefaultAccessKeys(gallery),
    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    galleries[index] = ensuredGallery;
  } else {
    galleries.unshift(ensuredGallery);
  }
  saveGalleries(galleries);
  syncGalleryToServer(ensuredGallery);
}

export function deleteGallery(id: string): void {
  const galleries = getGalleries().filter((g) => g.id !== id);
  saveGalleries(galleries);
  deleteGalleryFromServer(id);
}

export function updatePhotoInGallery(galleryId: string, photoId: string, updates: Partial<PhotoItem>): void {
  const galleries = [...getGalleries()];
  const galleryIndex = galleries.findIndex((g) => g.id === galleryId);
  if (galleryIndex < 0) return;

  const gallery = { ...galleries[galleryIndex] };
  const photoIndex = gallery.photos.findIndex((p) => p.id === photoId);
  if (photoIndex >= 0) {
    const updatedPhotos = [...gallery.photos];
    updatedPhotos[photoIndex] = { ...updatedPhotos[photoIndex], ...updates };
    gallery.photos = updatedPhotos;
    gallery.updatedAt = new Date().toISOString();
    galleries[galleryIndex] = gallery;
    saveGalleries(galleries);
    syncGalleryToServer(gallery);
  }
}

export function addPhotoToGallery(galleryId: string, photo: PhotoItem): void {
  const galleries = [...getGalleries()];
  const galleryIndex = galleries.findIndex((g) => g.id === galleryId);
  if (galleryIndex < 0) return;

  const gallery = { ...galleries[galleryIndex] };
  gallery.photos = [photo, ...gallery.photos];
  if (!gallery.coverPhotoUrl) {
    gallery.coverPhotoUrl = photo.thumbnailUrl;
  }
  gallery.updatedAt = new Date().toISOString();
  galleries[galleryIndex] = gallery;
  saveGalleries(galleries);
  syncGalleryToServer(gallery);
}

/**
 * Bidirectionally synchronizes local storage galleries with the server.
 * Uploads any locally created galleries (e.g. created on creator's machine) to the server,
 * and downloads any server galleries into local storage.
 */
export async function syncGalleriesWithServer(): Promise<ClientGallery[]> {
  if (typeof window === 'undefined') return [];

  try {
    const localGalleries = getGalleries();
    const res = await fetch('/api/vaults', { cache: 'no-store' });
    if (!res.ok) return localGalleries;

    const data = await res.json();
    const serverGalleries: ClientGallery[] = Array.isArray(data.galleries) ? data.galleries : [];

    const map = new Map<string, ClientGallery>();

    // 1. Put server galleries in map
    for (const g of serverGalleries) {
      if (g && g.id) map.set(g.id, g);
    }

    // 2. Compare local galleries
    const localOnlyToUpload: ClientGallery[] = [];
    for (const localG of localGalleries) {
      if (!localG || !localG.id) continue;
      const remoteG = map.get(localG.id);
      if (!remoteG) {
        // Local gallery not yet on server -> upload it!
        map.set(localG.id, localG);
        localOnlyToUpload.push(localG);
      } else {
        // Both have it, compare updatedAt
        const localTime = localG.updatedAt ? new Date(localG.updatedAt).getTime() : 0;
        const remoteTime = remoteG.updatedAt ? new Date(remoteG.updatedAt).getTime() : 0;
        if (localTime > remoteTime) {
          map.set(localG.id, localG);
          localOnlyToUpload.push(localG);
        }
      }
    }

    // If local has galleries missing on server, push them in batch
    if (localOnlyToUpload.length > 0) {
      fetch('/api/vaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localOnlyToUpload),
      }).catch((err) => console.warn('Failed to batch upload local galleries:', err));
    }

    const merged = Array.from(map.values());
    // Only write to storage and notify if different
    if (JSON.stringify(merged) !== JSON.stringify(localGalleries)) {
      saveGalleries(merged);
    }

    return merged;
  } catch (err) {
    console.warn('syncGalleriesWithServer error:', err);
    return getGalleries();
  }
}

export function getStudioConcepts(): GeneratedConcept[] {
  if (typeof window === 'undefined') return INITIAL_CONCEPTS;
  try {
    const raw = localStorage.getItem(CONCEPTS_STORAGE_KEY);
    if (!raw) {
      if (!lastConceptsRaw) {
        localStorage.setItem(CONCEPTS_STORAGE_KEY, JSON.stringify([]));
        cachedConcepts = [];
        lastConceptsRaw = JSON.stringify([]);
      }
      return cachedConcepts;
    }
    if (raw === lastConceptsRaw) {
      return cachedConcepts;
    }
    const parsed: GeneratedConcept[] = JSON.parse(raw);
    const clean = parsed.filter((c) => !LEGACY_CONCEPT_IDS.has(c.id));
    if (clean.length !== parsed.length) {
      const updatedRaw = JSON.stringify(clean);
      localStorage.setItem(CONCEPTS_STORAGE_KEY, updatedRaw);
      lastConceptsRaw = updatedRaw;
    } else {
      lastConceptsRaw = raw;
    }
    cachedConcepts = clean;
    return cachedConcepts;
  } catch {
    return [];
  }
}

export function saveStudioConcept(concept: GeneratedConcept): void {
  if (typeof window === 'undefined') return;
  const concepts = [concept, ...getStudioConcepts().filter((c) => c.id !== concept.id)];
  const raw = JSON.stringify(concepts);
  localStorage.setItem(CONCEPTS_STORAGE_KEY, raw);
  cachedConcepts = concepts;
  lastConceptsRaw = raw;
  notifyConcepts();
}

export function deleteStudioConcept(id: string): void {
  if (typeof window === 'undefined') return;
  const concepts = getStudioConcepts().filter((c) => c.id !== id);
  const raw = JSON.stringify(concepts);
  localStorage.setItem(CONCEPTS_STORAGE_KEY, raw);
  cachedConcepts = concepts;
  lastConceptsRaw = raw;
  notifyConcepts();
}
