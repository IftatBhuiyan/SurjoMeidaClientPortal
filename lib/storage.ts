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

export function saveGalleries(galleries: ClientGallery[]): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = JSON.stringify(galleries);
    localStorage.setItem(GALLERIES_STORAGE_KEY, raw);
    cachedGalleries = galleries;
    lastGalleriesRaw = raw;
    notifyGalleries();
  } catch (err) {
    console.error('Failed to save galleries to localStorage:', err);
  }
}

export function getGalleryById(id: string): ClientGallery | undefined {
  const galleries = getGalleries();
  return galleries.find((g) => g.id === id);
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
}

export function deleteGallery(id: string): void {
  const galleries = getGalleries().filter((g) => g.id !== id);
  saveGalleries(galleries);
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
