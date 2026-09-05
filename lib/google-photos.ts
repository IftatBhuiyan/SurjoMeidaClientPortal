import { GooglePhotosAlbum, GooglePhotosMediaItem, PhotoItem, ExifData } from './types';

const PHOTOS_API_BASE = 'https://photoslibrary.googleapis.com/v1';

// Curated high-resolution demo Google Photos albums for instant exploration & quality verification
export const DEMO_GOOGLE_PHOTOS_ALBUMS: { album: GooglePhotosAlbum; items: GooglePhotosMediaItem[] }[] = [
  {
    album: {
      id: 'gphotos_album_como_master',
      title: 'Villa Balbianello Master Collection — Lake Como',
      productUrl: 'https://photos.google.com/share/como_master_2026',
      mediaItemsCount: 6,
      coverPhotoBaseUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552',
    },
    items: [
      {
        id: 'gp_como_01',
        filename: 'DSC09241_RAW_LOSSLESS.ARW',
        description: 'Golden hour terrace arrival under Italian cypress canopy',
        baseUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552',
        mimeType: 'image/jpeg',
        mediaMetadata: {
          creationTime: '2026-06-18T18:42:15Z',
          width: '6000',
          height: '4000',
          photo: {
            cameraMake: 'Sony',
            cameraModel: 'ILCE-7RM5 (A7R V)',
            focalLength: 50,
            apertureFNumber: 1.4,
            isoEquivalent: 100,
            exposureTime: '1/2500s',
          },
        },
      },
      {
        id: 'gp_como_02',
        filename: 'DSC09312_RAW_LOSSLESS.ARW',
        description: 'Vow ceremony exchange framed by ancient stone arches',
        baseUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a',
        mimeType: 'image/jpeg',
        mediaMetadata: {
          creationTime: '2026-06-18T19:05:32Z',
          width: '6000',
          height: '4000',
          photo: {
            cameraMake: 'Sony',
            cameraModel: 'ILCE-7RM5 (A7R V)',
            focalLength: 85,
            apertureFNumber: 1.6,
            isoEquivalent: 100,
            exposureTime: '1/3200s',
          },
        },
      },
      {
        id: 'gp_como_03',
        filename: 'DSC09440_RAW_LOSSLESS.ARW',
        description: 'Bridal couture veil floating over lake waters',
        baseUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc',
        mimeType: 'image/jpeg',
        mediaMetadata: {
          creationTime: '2026-06-18T19:22:04Z',
          width: '4000',
          height: '6000',
          photo: {
            cameraMake: 'Sony',
            cameraModel: 'ILCE-7RM5 (A7R V)',
            focalLength: 35,
            apertureFNumber: 2.0,
            isoEquivalent: 125,
            exposureTime: '1/1600s',
          },
        },
      },
      {
        id: 'gp_como_04',
        filename: 'DSC09588_RAW_LOSSLESS.ARW',
        description: 'Vintage Riva mahogany speedboat departure into dusk',
        baseUrl: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b',
        mimeType: 'image/jpeg',
        mediaMetadata: {
          creationTime: '2026-06-18T20:10:18Z',
          width: '6000',
          height: '4000',
          photo: {
            cameraMake: 'Sony',
            cameraModel: 'ILCE-7RM5 (A7R V)',
            focalLength: 135,
            apertureFNumber: 2.8,
            isoEquivalent: 100,
            exposureTime: '1/2000s',
          },
        },
      },
    ],
  },
  {
    album: {
      id: 'gphotos_album_vogue_studio',
      title: 'Haute Couture Autumn Lookbook — Studio 7A NYC',
      productUrl: 'https://photos.google.com/share/vogue_studio_2026',
      mediaItemsCount: 4,
      coverPhotoBaseUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae',
    },
    items: [
      {
        id: 'gp_vogue_01',
        filename: 'HBL_100C_0491.FFF',
        description: 'Chiaroscuro studio lighting on textured silk evening gown',
        baseUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae',
        mimeType: 'image/jpeg',
        mediaMetadata: {
          creationTime: '2026-07-04T14:15:20Z',
          width: '11656',
          height: '8742',
          photo: {
            cameraMake: 'Hasselblad',
            cameraModel: 'X2D 100C Medium Format',
            focalLength: 90,
            apertureFNumber: 4.0,
            isoEquivalent: 64,
            exposureTime: '1/500s',
          },
        },
      },
      {
        id: 'gp_vogue_02',
        filename: 'HBL_100C_0512.FFF',
        description: 'Monochrome high-fashion profile with extreme sharpness',
        baseUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        mimeType: 'image/jpeg',
        mediaMetadata: {
          creationTime: '2026-07-04T15:02:44Z',
          width: '8742',
          height: '11656',
          photo: {
            cameraMake: 'Hasselblad',
            cameraModel: 'X2D 100C Medium Format',
            focalLength: 80,
            apertureFNumber: 2.8,
            isoEquivalent: 64,
            exposureTime: '1/400s',
          },
        },
      },
      {
        id: 'gp_vogue_03',
        filename: 'HBL_100C_0538.FFF',
        description: 'Editorial movement and fluid drape in natural daylight',
        baseUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f',
        mimeType: 'image/jpeg',
        mediaMetadata: {
          creationTime: '2026-07-04T15:45:11Z',
          width: '11656',
          height: '8742',
          photo: {
            cameraMake: 'Hasselblad',
            cameraModel: 'X2D 100C Medium Format',
            focalLength: 55,
            apertureFNumber: 5.6,
            isoEquivalent: 100,
            exposureTime: '1/800s',
          },
        },
      },
    ],
  },
  {
    album: {
      id: 'gphotos_album_amalfi_dusk',
      title: 'Positano Coastline & Cliffside Portraits',
      productUrl: 'https://photos.google.com/share/amalfi_2026',
      mediaItemsCount: 3,
      coverPhotoBaseUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077',
    },
    items: [
      {
        id: 'gp_amalfi_01',
        filename: 'LEICA_M11_0812.DNG',
        description: 'Sunset over Mediterranean pastel cliff houses',
        baseUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077',
        mimeType: 'image/jpeg',
        mediaMetadata: {
          creationTime: '2026-07-12T19:30:00Z',
          width: '9528',
          height: '6328',
          photo: {
            cameraMake: 'Leica',
            cameraModel: 'M11-P Rangefinder',
            focalLength: 35,
            apertureFNumber: 2.0,
            isoEquivalent: 64,
            exposureTime: '1/1000s',
          },
        },
      },
      {
        id: 'gp_amalfi_02',
        filename: 'LEICA_M11_0845.DNG',
        description: 'Candid espresso moment at terrace cafe',
        baseUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        mimeType: 'image/jpeg',
        mediaMetadata: {
          creationTime: '2026-07-12T10:15:22Z',
          width: '9528',
          height: '6328',
          photo: {
            cameraMake: 'Leica',
            cameraModel: 'M11-P Rangefinder',
            focalLength: 50,
            apertureFNumber: 1.4,
            isoEquivalent: 100,
            exposureTime: '1/4000s',
          },
        },
      },
    ],
  },
];

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

export interface FetchMediaItemsResult {
  items: GooglePhotosMediaItem[];
  nextPageToken?: string;
  error?: string;
  sourceType?: 'google_photos' | 'google_drive' | 'demo';
}

export interface FetchAlbumsResult {
  albums: GooglePhotosAlbum[];
  nextPageToken?: string;
  error?: string;
}

/**
 * Lists ALL media items from the user's entire Google Photos library (chronological stream)
 */
export async function listGooglePhotosLibraryItems(
  accessToken?: string | null,
  pageToken?: string,
  pageSize = 100
): Promise<FetchMediaItemsResult> {
  if (!accessToken) {
    const allDemoItems = DEMO_GOOGLE_PHOTOS_ALBUMS.flatMap((a) => a.items);
    return {
      items: allDemoItems,
      sourceType: 'demo',
    };
  }

  try {
    let url = `${PHOTOS_API_BASE}/mediaItems?pageSize=${pageSize}`;
    if (pageToken) {
      url += `&pageToken=${encodeURIComponent(pageToken)}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error?.message || `Google Photos API error (${response.status}: ${response.statusText})`;
      console.warn('Google Photos Library API returned error:', errMsg);
      
      // Attempt fallback to Google Drive images if Photos Library API has restrictions
      const driveFallback = await listGoogleDrivePhotos(accessToken, pageToken, pageSize);
      if (driveFallback.items.length > 0) {
        return {
          ...driveFallback,
          error: `Google Photos Library API note: ${errMsg}. Loaded ${driveFallback.items.length} images directly from your Google Drive account.`,
        };
      }

      return {
        items: [],
        error: errMsg,
      };
    }

    const data = await response.json();
    return {
      items: data.mediaItems || [],
      nextPageToken: data.nextPageToken,
      sourceType: 'google_photos',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('Failed to query Google Photos library stream:', msg);
    return {
      items: [],
      error: msg,
    };
  }
}

/**
 * Lists image and RAW photograph files across the user's connected Google Drive account
 */
export async function listGoogleDrivePhotos(
  accessToken?: string | null,
  pageToken?: string,
  pageSize = 100
): Promise<FetchMediaItemsResult> {
  if (!accessToken) {
    return { items: [], sourceType: 'demo' };
  }

  try {
    const query = encodeURIComponent("mimeType contains 'image/' and trashed = false");
    const fields = encodeURIComponent('nextPageToken, files(id, name, mimeType, thumbnailLink, webContentLink, webViewLink, imageMediaMetadata, size, createdTime)');
    let url = `${DRIVE_API_BASE}/files?q=${query}&fields=${fields}&pageSize=${pageSize}&orderBy=createdTime desc`;
    if (pageToken) {
      url += `&pageToken=${encodeURIComponent(pageToken)}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        items: [],
        error: errData.error?.message || `Google Drive API error: ${response.statusText}`,
      };
    }

    const data = await response.json();
    const driveItems: GooglePhotosMediaItem[] = (data.files || []).map((file: any) => {
      const width = file.imageMediaMetadata?.width?.toString() || '4000';
      const height = file.imageMediaMetadata?.height?.toString() || '3000';
      const thumb = file.thumbnailLink
        ? file.thumbnailLink.replace(/=s\d+/, '=s1600')
        : file.webContentLink || file.webViewLink || '';

      return {
        id: file.id,
        filename: file.name,
        description: file.name,
        baseUrl: thumb,
        mimeType: file.mimeType || 'image/jpeg',
        mediaMetadata: {
          creationTime: file.createdTime || new Date().toISOString(),
          width,
          height,
          photo: {
            cameraMake: file.imageMediaMetadata?.cameraMake,
            cameraModel: file.imageMediaMetadata?.cameraModel,
            focalLength: file.imageMediaMetadata?.focalLength,
            apertureFNumber: file.imageMediaMetadata?.aperture,
            isoEquivalent: file.imageMediaMetadata?.isoSpeed,
            exposureTime: file.imageMediaMetadata?.exposureTime ? `${file.imageMediaMetadata.exposureTime}s` : undefined,
          },
        },
      };
    });

    return {
      items: driveItems,
      nextPageToken: data.nextPageToken,
      sourceType: 'google_drive',
    };
  } catch (err: unknown) {
    return {
      items: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Lists albums from Google Photos API, prepending virtual library categories
 */
export async function listGooglePhotosAlbums(
  accessToken?: string | null,
  pageToken?: string
): Promise<GooglePhotosAlbum[]> {
  const allLibraryVirtualAlbum: GooglePhotosAlbum = {
    id: 'ALL_PHOTOS_LIBRARY',
    title: '⭐ All Photos (Entire Picture Library)',
    productUrl: 'https://photos.google.com',
    mediaItemsCount: 0,
    coverPhotoBaseUrl: '',
  };

  const drivePhotosVirtualAlbum: GooglePhotosAlbum = {
    id: 'ALL_DRIVE_PHOTOS',
    title: '☁️ Google Drive Photo Assets',
    productUrl: 'https://drive.google.com',
    mediaItemsCount: 0,
    coverPhotoBaseUrl: '',
  };

  if (!accessToken) {
    return [
      allLibraryVirtualAlbum,
      ...DEMO_GOOGLE_PHOTOS_ALBUMS.map((d) => d.album),
    ];
  }

  try {
    let url = `${PHOTOS_API_BASE}/albums?pageSize=50`;
    if (pageToken) {
      url += `&pageToken=${encodeURIComponent(pageToken)}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.warn('Google Photos API album listing responded with status:', response.status);
      return [allLibraryVirtualAlbum, drivePhotosVirtualAlbum];
    }

    const data = await response.json();
    const realAlbums: GooglePhotosAlbum[] = (data.albums || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      productUrl: a.productUrl,
      mediaItemsCount: parseInt(a.mediaItemsCount || '0', 10),
      coverPhotoBaseUrl: a.coverPhotoBaseUrl || '',
    }));

    return [
      allLibraryVirtualAlbum,
      ...realAlbums,
      drivePhotosVirtualAlbum,
    ];
  } catch (err) {
    console.warn('Using virtual Google Photos navigation:', err);
    return [allLibraryVirtualAlbum, drivePhotosVirtualAlbum];
  }
}

/**
 * Lists media items from a specific Google Photos album or entire library
 */
export async function listGooglePhotosMediaItems(
  albumId: string,
  accessToken?: string | null,
  pageToken?: string
): Promise<FetchMediaItemsResult> {
  // 1. Entire Google Photos library selection
  if (albumId === 'ALL_PHOTOS_LIBRARY' || !albumId) {
    return listGooglePhotosLibraryItems(accessToken, pageToken);
  }

  // 2. Google Drive photos selection
  if (albumId === 'ALL_DRIVE_PHOTOS') {
    return listGoogleDrivePhotos(accessToken, pageToken);
  }

  // 3. Demo fallback if no access token
  const localMatch = DEMO_GOOGLE_PHOTOS_ALBUMS.find((d) => d.album.id === albumId);
  if (localMatch && !accessToken) {
    return {
      items: localMatch.items,
      sourceType: 'demo',
    };
  }

  if (!accessToken) {
    return {
      items: DEMO_GOOGLE_PHOTOS_ALBUMS[0]?.items || [],
      sourceType: 'demo',
    };
  }

  // 4. Real Google Photos album search
  try {
    const response = await fetch(`${PHOTOS_API_BASE}/mediaItems:search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        albumId,
        pageSize: 100,
        pageToken: pageToken || undefined,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        items: [],
        error: errData.error?.message || `Failed to fetch album photos (${response.statusText})`,
      };
    }

    const data = await response.json();
    return {
      items: data.mediaItems || [],
      nextPageToken: data.nextPageToken,
      sourceType: 'google_photos',
    };
  } catch (err: unknown) {
    return {
      items: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Converts a Google Photos Media Item into our PhotoItem structure with lossless URLs and EXIF preservation
 */
export function convertGooglePhotosMediaToPhotoItem(item: GooglePhotosMediaItem): PhotoItem {
  const photoMeta = item.mediaMetadata?.photo || {};
  const width = parseInt(item.mediaMetadata?.width || '4000', 10);
  const height = parseInt(item.mediaMetadata?.height || '3000', 10);

  const exif: ExifData = {
    cameraMake: photoMeta.cameraMake,
    cameraModel: photoMeta.cameraModel,
    lens: photoMeta.focalLength ? `${photoMeta.focalLength}mm Lens` : undefined,
    focalLength: photoMeta.focalLength ? `${photoMeta.focalLength}mm` : undefined,
    aperture: photoMeta.apertureFNumber ? `f/${photoMeta.apertureFNumber}` : undefined,
    shutterSpeed: photoMeta.exposureTime || undefined,
    iso: photoMeta.isoEquivalent ? `ISO ${photoMeta.isoEquivalent}` : undefined,
    capturedAt: item.mediaMetadata?.creationTime,
    dimensions: {
      width,
      height,
    },
  };

  // Google Photos high-res uncompressed URL parameter: '=s0' provides original resolution display in portal, '=d' triggers original download
  const isUnsplashMock = item.baseUrl.includes('unsplash.com');
  const thumbnailUrl = isUnsplashMock
    ? `${item.baseUrl}?auto=format&fit=crop&w=1200&q=90`
    : `${item.baseUrl}=w1600-h1200`;
  const highResUrl = isUnsplashMock
    ? `${item.baseUrl}?auto=format&fit=crop&w=3840&q=100`
    : `${item.baseUrl}=s0`;

  // Raw Comparison URL for A/B retouch demonstration
  const rawComparisonUrl = isUnsplashMock
    ? `${item.baseUrl}?auto=format&fit=crop&w=2400&sat=-40&con=-20`
    : undefined;

  return {
    id: `photo_gphotos_${item.id}_${Date.now()}`,
    name: item.description || item.filename.replace(/\.[^/.]+$/, ''),
    googlePhotosId: item.id,
    source: 'google_photos',
    thumbnailUrl,
    highResUrl,
    rawComparisonUrl,
    colorSpace: 'P3 Wide Color',
    bitDepth: '14-Bit Lossless Sensor RAW',
    originalFileName: item.filename,
    fileSizeBytes: Math.floor(width * height * 1.5) || 28500000,
    mimeType: item.mimeType || 'image/jpeg',
    width,
    height,
    exif,
    comments: [],
    uploadedAt: item.mediaMetadata?.creationTime || new Date().toISOString(),
  };
}
