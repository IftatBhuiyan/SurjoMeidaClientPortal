import { ClientGallery, GeneratedConcept, PhotoItem, GalleryAccessKey, SecurityAuditLog } from './types';
import { createDefaultAccessKeys } from './security';

const GALLERIES_STORAGE_KEY = 'aperture_photographer_galleries_v3';
const CONCEPTS_STORAGE_KEY = 'aperture_studio_concepts_v3';
const ACTIVE_ROLE_SESSION_KEY = 'aperture_active_role_session_v3';
export const DEMO_PURGED_FLAG_KEY = 'aperture_demo_purged_v3';

// High-end sample photography collections with RBAC keys & audit trail
export const INITIAL_DEMO_GALLERIES: ClientGallery[] = [
  {
    id: 'gallery_lake_como_2026',
    title: 'Sophia & Julian — Villa Balbianello Wedding',
    clientName: 'Sophia & Julian Vance',
    clientEmail: 'sophia.vance@example.com',
    vanitySlug: 'lake-como-wedding',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=95',
    shootDate: '2026-06-18',
    location: 'Villa Balbianello, Lake Como, Italy',
    shootType: 'Wedding',
    accessPin: '4829',
    securityPasscode: 'COMO2026',
    passwordHash: '8b9c8b74681b317e4d82f9d8e5ff9f75b7b9e075e5b6bb65e06fba11b8ef5192',
    encryptionSalt: 'APERTURE_COMO_SALT_2026',
    isWatermarkActive: false,
    watermarkText: '© SURJO MEDIA — PROOF ONLY',
    watermarkStyle: 'diagonal_grid',
    antiRipProtection: true,
    qualityTier: 'lossless_master',
    allowHighResDownloads: true,
    allowProofingNotes: true,
    allowFavorites: true,
    status: 'delivered',
    welcomeMessage: 'Dearest Sophia & Julian, here is your complete curated wedding collection captured in ultra-high lossless resolution. Please star your favorite selects for the fine art album print book.',
    createdAt: '2026-06-20T10:00:00Z',
    updatedAt: '2026-06-22T14:30:00Z',
    accessKeys: [
      {
        id: 'key_como_primary',
        role: 'primary_client',
        label: 'Sophia & Julian (Full Client Rights)',
        pin: '4829',
        passcode: 'COMO2026',
        canDownload: true,
        watermarkForced: false,
        accessCount: 14,
        isActive: true,
        lastAccessedAt: '2026-06-22T14:30:00Z',
      },
      {
        id: 'key_como_guest',
        role: 'guest_viewer',
        label: 'Wedding Family & VIP Guests',
        pin: '1942',
        passcode: 'BALBIANELLO-GUEST',
        canDownload: false,
        watermarkForced: true,
        accessCount: 38,
        isActive: true,
        lastAccessedAt: '2026-06-23T09:15:00Z',
      },
      {
        id: 'key_como_retouch',
        role: 'retoucher',
        label: 'Studio Master Colorist',
        pin: '7722',
        passcode: 'RETOUCH-COLOR',
        canDownload: true,
        watermarkForced: false,
        accessCount: 4,
        isActive: true,
        lastAccessedAt: '2026-06-21T18:00:00Z',
      },
    ],
    auditLogs: [
      {
        id: 'log_01',
        galleryId: 'gallery_lake_como_2026',
        timestamp: '2026-06-22T14:30:00Z',
        eventType: 'selects_submitted',
        role: 'primary_client',
        userIdentifier: 'sophia.vance@example.com',
        details: 'Submitted 4 official favorites for fine art album printing',
      },
      {
        id: 'log_02',
        galleryId: 'gallery_lake_como_2026',
        timestamp: '2026-06-21T16:10:00Z',
        eventType: 'download_zip',
        role: 'primary_client',
        userIdentifier: 'Julian Vance',
        details: 'Generated uncompressed high-resolution ZIP archive (6 files, 308MB)',
      },
      {
        id: 'log_03',
        galleryId: 'gallery_lake_como_2026',
        timestamp: '2026-06-20T10:05:00Z',
        eventType: 'login_success',
        role: 'primary_client',
        userIdentifier: 'Sophia & Julian',
        details: 'Authenticated successfully via encrypted PIN 4829',
      },
    ],
    photos: [
      {
        id: 'p_como_01',
        name: 'The Terrace Arrival at Golden Hour',
        originalFileName: 'DSC09241_RAW_LOSSLESS.ARW',
        source: 'google_photos',
        thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=90',
        highResUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=3840&q=100',
        rawComparisonUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2400&sat=-40&con=-20',
        colorSpace: 'P3 Wide Color',
        bitDepth: '14-Bit Lossless Sensor RAW',
        fileSizeBytes: 48200000,
        mimeType: 'image/jpeg',
        width: 6000,
        height: 4000,
        isFavorite: true,
        selectedForRetouch: true,
        colorTag: 'green',
        exif: {
          cameraMake: 'Sony',
          cameraModel: 'ILCE-7RM5 (A7R V)',
          lens: 'FE 50mm F1.2 GM',
          focalLength: '50mm',
          aperture: 'f/1.4',
          shutterSpeed: '1/2500s',
          iso: 'ISO 100',
          capturedAt: '2026-06-18 18:42:15',
        },
        comments: [
          {
            id: 'c1',
            author: 'Sophia Vance',
            text: 'We absolutely adore the lighting in this one! Please use this for the 24x36 canvas print.',
            createdAt: '2026-06-21T11:15:00Z',
          },
        ],
        uploadedAt: '2026-06-20T10:10:00Z',
      },
      {
        id: 'p_como_02',
        name: 'The Vows Under Cypress Arches',
        originalFileName: 'DSC09312_RAW_LOSSLESS.ARW',
        source: 'google_photos',
        thumbnailUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=90',
        highResUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=3840&q=100',
        rawComparisonUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=2400&sat=-40&con=-20',
        colorSpace: 'P3 Wide Color',
        bitDepth: '14-Bit Lossless Sensor RAW',
        fileSizeBytes: 52100000,
        mimeType: 'image/jpeg',
        width: 6000,
        height: 4000,
        isFavorite: true,
        colorTag: 'purple',
        exif: {
          cameraMake: 'Sony',
          cameraModel: 'ILCE-7RM5 (A7R V)',
          lens: 'FE 85mm F1.4 GM II',
          focalLength: '85mm',
          aperture: 'f/1.6',
          shutterSpeed: '1/3200s',
          iso: 'ISO 100',
          capturedAt: '2026-06-18 19:05:32',
        },
        comments: [],
        uploadedAt: '2026-06-20T10:12:00Z',
      },
      {
        id: 'p_como_03',
        name: 'Bridal Gown & Lake Reflection',
        originalFileName: 'DSC09440_RAW_LOSSLESS.ARW',
        source: 'google_photos',
        thumbnailUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=90',
        highResUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=3840&q=100',
        fileSizeBytes: 49800000,
        mimeType: 'image/jpeg',
        width: 4000,
        height: 6000,
        isFavorite: false,
        exif: {
          cameraMake: 'Sony',
          cameraModel: 'ILCE-7RM5 (A7R V)',
          lens: 'FE 35mm F1.4 GM',
          focalLength: '35mm',
          aperture: 'f/2.0',
          shutterSpeed: '1/1600s',
          iso: 'ISO 125',
          capturedAt: '2026-06-18 19:22:04',
        },
        comments: [],
        uploadedAt: '2026-06-20T10:15:00Z',
      },
      {
        id: 'p_como_04',
        name: 'Classic Wooden Riva Boat Departure',
        originalFileName: 'DSC09588_RAW_LOSSLESS.ARW',
        source: 'google_photos',
        thumbnailUrl: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=90',
        highResUrl: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=3840&q=100',
        fileSizeBytes: 54300000,
        mimeType: 'image/jpeg',
        width: 6000,
        height: 4000,
        isFavorite: true,
        selectedForRetouch: true,
        colorTag: 'blue',
        exif: {
          cameraMake: 'Sony',
          cameraModel: 'ILCE-7RM5 (A7R V)',
          lens: 'FE 70-200mm F2.8 GM OSS II',
          focalLength: '135mm',
          aperture: 'f/2.8',
          shutterSpeed: '1/2000s',
          iso: 'ISO 100',
          capturedAt: '2026-06-18 20:10:18',
        },
        comments: [
          {
            id: 'c2',
            author: 'Julian Vance',
            text: 'Movie poster quality! Perfect frame.',
            createdAt: '2026-06-21T14:20:00Z',
          },
        ],
        uploadedAt: '2026-06-20T10:18:00Z',
      },
      {
        id: 'p_como_05',
        name: 'Candlelit Reception Villa Courtyard',
        originalFileName: 'DSC09710_RAW_LOSSLESS.ARW',
        source: 'google_photos',
        thumbnailUrl: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1200&q=90',
        highResUrl: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=3840&q=100',
        fileSizeBytes: 46100000,
        mimeType: 'image/jpeg',
        width: 6000,
        height: 4000,
        isFavorite: false,
        exif: {
          cameraMake: 'Sony',
          cameraModel: 'ILCE-7RM5 (A7R V)',
          lens: 'FE 24mm F1.4 GM',
          focalLength: '24mm',
          aperture: 'f/1.4',
          shutterSpeed: '1/250s',
          iso: 'ISO 1600',
          capturedAt: '2026-06-18 22:35:40',
        },
        comments: [],
        uploadedAt: '2026-06-20T10:20:00Z',
      },
      {
        id: 'p_como_06',
        name: 'First Dance Under Tuscan Fairylights',
        originalFileName: 'DSC09830_RAW_LOSSLESS.ARW',
        source: 'google_photos',
        thumbnailUrl: 'https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=1200&q=90',
        highResUrl: 'https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=3840&q=100',
        fileSizeBytes: 47900000,
        mimeType: 'image/jpeg',
        width: 6000,
        height: 4000,
        isFavorite: true,
        exif: {
          cameraMake: 'Sony',
          cameraModel: 'ILCE-7RM5 (A7R V)',
          lens: 'FE 50mm F1.2 GM',
          focalLength: '50mm',
          aperture: 'f/1.2',
          shutterSpeed: '1/320s',
          iso: 'ISO 2000',
          capturedAt: '2026-06-18 23:14:10',
        },
        comments: [],
        uploadedAt: '2026-06-20T10:22:00Z',
      },
    ],
  },
  {
    id: 'gallery_vogue_editorial_2026',
    title: 'Aria Sterling — Haute Couture Autumn Editorial',
    clientName: 'Aria Sterling / Maison Velour',
    clientEmail: 'aria.sterling@velourparis.com',
    vanitySlug: 'vogue-editorial-2026',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=2000&q=95',
    shootDate: '2026-07-04',
    location: 'Studio 7A, Manhattan, NY',
    shootType: 'Fashion',
    accessPin: '7391',
    securityPasscode: 'VELOUR26',
    isWatermarkActive: true,
    watermarkText: '© SURJO MEDIA — EDITORIAL PROOF',
    allowHighResDownloads: false,
    allowProofingNotes: true,
    allowFavorites: true,
    status: 'proofing',
    welcomeMessage: 'Editorial proofing review: please review the studio lookbook frames and tag any images requiring magazine-spec skin retouching.',
    createdAt: '2026-07-05T09:00:00Z',
    updatedAt: '2026-07-05T16:00:00Z',
    accessKeys: [
      {
        id: 'key_vogue_primary',
        role: 'primary_client',
        label: 'Aria Sterling (Creative Director)',
        pin: '7391',
        passcode: 'VELOUR26',
        canDownload: false,
        watermarkForced: true,
        accessCount: 8,
        isActive: true,
      },
      {
        id: 'key_vogue_guest',
        role: 'guest_viewer',
        label: 'PR & Media Press Preview',
        pin: '5020',
        passcode: 'PRESS-VELOUR',
        canDownload: false,
        watermarkForced: true,
        accessCount: 19,
        isActive: true,
      },
    ],
    auditLogs: [
      {
        id: 'log_vogue_01',
        galleryId: 'gallery_vogue_editorial_2026',
        timestamp: '2026-07-05T11:00:00Z',
        eventType: 'note_added',
        role: 'primary_client',
        userIdentifier: 'Aria Sterling',
        details: 'Added retouching note on Frame HBL_100C_0491: Cover option 1',
      },
    ],
    photos: [
      {
        id: 'p_vogue_01',
        name: 'Velour Silhouette & Chiaroscuro Light',
        originalFileName: 'HBL_100C_0491.FFF',
        source: 'google_photos',
        thumbnailUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=90',
        highResUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=3840&q=100',
        fileSizeBytes: 112000000,
        mimeType: 'image/jpeg',
        width: 11656,
        height: 8742,
        isFavorite: true,
        selectedForRetouch: true,
        colorTag: 'amber',
        exif: {
          cameraMake: 'Hasselblad',
          cameraModel: 'X2D 100C Medium Format',
          lens: 'XCD 2,5/90V',
          focalLength: '90mm',
          aperture: 'f/4.0',
          shutterSpeed: '1/500s',
          iso: 'ISO 64',
          capturedAt: '2026-07-04 14:15:20',
        },
        comments: [
          {
            id: 'cv1',
            author: 'Aria Sterling',
            text: 'Stunning medium-format detail! Cover option 1.',
            createdAt: '2026-07-05T11:00:00Z',
          },
        ],
        uploadedAt: '2026-07-05T09:10:00Z',
      },
      {
        id: 'p_vogue_02',
        name: 'Monochrome High-Fashion Profile',
        originalFileName: 'HBL_100C_0512.FFF',
        source: 'google_photos',
        thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=90',
        highResUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=3840&q=100',
        fileSizeBytes: 108000000,
        mimeType: 'image/jpeg',
        width: 8742,
        height: 11656,
        isFavorite: true,
        colorTag: 'green',
        exif: {
          cameraMake: 'Hasselblad',
          cameraModel: 'X2D 100C Medium Format',
          lens: 'XCD 1,9/80',
          focalLength: '80mm',
          aperture: 'f/2.8',
          shutterSpeed: '1/400s',
          iso: 'ISO 64',
          capturedAt: '2026-07-04 15:02:44',
        },
        comments: [],
        uploadedAt: '2026-07-05T09:15:00Z',
      },
      {
        id: 'p_vogue_03',
        name: 'Editorial Movement & Silk Drape',
        originalFileName: 'HBL_100C_0538.FFF',
        source: 'google_photos',
        thumbnailUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=90',
        highResUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=3840&q=100',
        fileSizeBytes: 115000000,
        mimeType: 'image/jpeg',
        width: 11656,
        height: 8742,
        isFavorite: false,
        exif: {
          cameraMake: 'Hasselblad',
          cameraModel: 'X2D 100C Medium Format',
          lens: 'XCD 2,5/55V',
          focalLength: '55mm',
          aperture: 'f/5.6',
          shutterSpeed: '1/800s',
          iso: 'ISO 100',
          capturedAt: '2026-07-04 15:45:11',
        },
        comments: [],
        uploadedAt: '2026-07-05T09:20:00Z',
      },
    ],
  },
];

export const INITIAL_CONCEPTS: GeneratedConcept[] = [
  {
    id: 'concept_01',
    prompt: 'Cinematic sunset editorial portrait on Santorini cliffside, warm golden hour backlighting, 85mm f/1.4 soft bokeh, 35mm film grain aesthetic, high-end Vogue fashion styling',
    aspectRatio: '3:2',
    model: 'gemini-3.1-flash-image',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1600&q=90',
    createdAt: '2026-08-20T12:00:00Z',
    lightingStyle: 'Golden Hour Rim Light',
    toneStyle: 'Cinematic Warmth',
  },
  {
    id: 'concept_02',
    prompt: 'Minimalist studio portrait with sculptural softbox shadows, elegant black turtleneck, editorial sharp catchlights in eyes, neutral warm gray studio seamless paper background',
    aspectRatio: '4:3',
    model: 'gemini-3.1-flash-image',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1600&q=90',
    createdAt: '2026-08-22T15:30:00Z',
    lightingStyle: 'Sculptural Softbox',
    toneStyle: 'Minimalist Monotone',
  },
];

type StorageListener = () => void;
const galleryListeners = new Set<StorageListener>();
const conceptListeners = new Set<StorageListener>();

let cachedGalleries: ClientGallery[] = INITIAL_DEMO_GALLERIES;
let lastGalleriesRaw: string | null = null;

let cachedConcepts: GeneratedConcept[] = INITIAL_CONCEPTS;
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

export function getGalleries(): ClientGallery[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_GALLERIES;
  try {
    const raw = localStorage.getItem(GALLERIES_STORAGE_KEY);
    const isPurged = localStorage.getItem(DEMO_PURGED_FLAG_KEY) === 'true';

    if (!raw) {
      const initial = isPurged ? [] : INITIAL_DEMO_GALLERIES;
      if (!lastGalleriesRaw) {
        localStorage.setItem(GALLERIES_STORAGE_KEY, JSON.stringify(initial));
        cachedGalleries = initial;
        lastGalleriesRaw = JSON.stringify(initial);
      }
      return cachedGalleries;
    }
    if (raw === lastGalleriesRaw) {
      return cachedGalleries;
    }
    const parsed: ClientGallery[] = JSON.parse(raw);
    // Ensure all galleries have default RBAC access keys
    const enriched = parsed.map((g) => {
      if (!g.accessKeys || g.accessKeys.length === 0) {
        return { ...g, accessKeys: createDefaultAccessKeys(g) };
      }
      return g;
    });
    cachedGalleries = enriched;
    lastGalleriesRaw = raw;
    return cachedGalleries;
  } catch {
    return INITIAL_DEMO_GALLERIES;
  }
}

export function purgeAllDemoData(): void {
  if (typeof window === 'undefined') return;
  const current = getGalleries();
  const demoIds = new Set(INITIAL_DEMO_GALLERIES.map((g) => g.id));
  const userGalleries = current.filter((g) => !demoIds.has(g.id));
  localStorage.setItem(DEMO_PURGED_FLAG_KEY, 'true');
  saveGalleries(userGalleries);
}

export function restoreDemoData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DEMO_PURGED_FLAG_KEY);
  const current = getGalleries();
  const demoIds = new Set(INITIAL_DEMO_GALLERIES.map((g) => g.id));
  const userGalleries = current.filter((g) => !demoIds.has(g.id));
  saveGalleries([...INITIAL_DEMO_GALLERIES, ...userGalleries]);
}

export function hasDemoData(): boolean {
  const current = getGalleries();
  const demoIds = new Set(INITIAL_DEMO_GALLERIES.map((g) => g.id));
  return current.some((g) => demoIds.has(g.id));
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
        localStorage.setItem(CONCEPTS_STORAGE_KEY, JSON.stringify(INITIAL_CONCEPTS));
        cachedConcepts = INITIAL_CONCEPTS;
        lastConceptsRaw = JSON.stringify(INITIAL_CONCEPTS);
      }
      return cachedConcepts;
    }
    if (raw === lastConceptsRaw) {
      return cachedConcepts;
    }
    cachedConcepts = JSON.parse(raw);
    lastConceptsRaw = raw;
    return cachedConcepts;
  } catch {
    return INITIAL_CONCEPTS;
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
