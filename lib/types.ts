export type AspectRatioType = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';

export type UserRole = 'admin' | 'primary_client' | 'guest_viewer' | 'retoucher';

export interface RolePermission {
  role: UserRole;
  label: string;
  badge: string;
  description: string;
  canViewOriginalHighRes: boolean;
  canDownloadZip: boolean;
  canDownloadSingle: boolean;
  canFavorite: boolean;
  canSubmitOfficialSelects: boolean;
  canAddNotes: boolean;
  canViewUnwatermarked: boolean;
  canAccessAuditLogs: boolean;
  canAccessAiLab: boolean;
}

export const ROLE_DEFINITIONS: Record<UserRole, RolePermission> = {
  admin: {
    role: 'admin',
    label: 'Studio Master / Photographer',
    badge: 'ADMIN',
    description: 'Full administrative control over all master archives, access keys, watermark settings, and AI lab.',
    canViewOriginalHighRes: true,
    canDownloadZip: true,
    canDownloadSingle: true,
    canFavorite: true,
    canSubmitOfficialSelects: true,
    canAddNotes: true,
    canViewUnwatermarked: true,
    canAccessAuditLogs: true,
    canAccessAiLab: true,
  },
  primary_client: {
    role: 'primary_client',
    label: 'Primary Client (Full Access)',
    badge: 'CLIENT',
    description: 'Designated client with rights to select official favorites, submit final proofing list, leave notes, and export high-res files.',
    canViewOriginalHighRes: true,
    canDownloadZip: true,
    canDownloadSingle: true,
    canFavorite: true,
    canSubmitOfficialSelects: true,
    canAddNotes: true,
    canViewUnwatermarked: true,
    canAccessAuditLogs: false,
    canAccessAiLab: false,
  },
  guest_viewer: {
    role: 'guest_viewer',
    label: 'Family & Guest VIP',
    badge: 'GUEST',
    description: 'Read-only or restricted viewer. Can browse photos and star personal favorites without submitting official retouch orders.',
    canViewOriginalHighRes: false,
    canDownloadZip: false,
    canDownloadSingle: true,
    canFavorite: true,
    canSubmitOfficialSelects: false,
    canAddNotes: false,
    canViewUnwatermarked: false,
    canAccessAuditLogs: false,
    canAccessAiLab: false,
  },
  retoucher: {
    role: 'retoucher',
    label: 'Assistant / Color Retoucher',
    badge: 'RETOUCH',
    description: 'Collaborator access to view client-tagged selects, inspect optical EXIF data, and export raw color notes.',
    canViewOriginalHighRes: true,
    canDownloadZip: true,
    canDownloadSingle: true,
    canFavorite: true,
    canSubmitOfficialSelects: false,
    canAddNotes: true,
    canViewUnwatermarked: true,
    canAccessAuditLogs: false,
    canAccessAiLab: true,
  },
};

export interface GalleryAccessKey {
  id: string;
  role: UserRole;
  label: string;
  pin: string;
  passcode: string;
  passwordHash?: string;
  canDownload: boolean;
  watermarkForced: boolean;
  expiresAt?: string;
  lastAccessedAt?: string;
  accessCount: number;
  isActive: boolean;
}

export interface SecurityAuditLog {
  id: string;
  galleryId: string;
  timestamp: string;
  eventType: 'login_success' | 'login_failed' | 'download_zip' | 'download_single' | 'selects_submitted' | 'note_added' | 'key_created' | 'settings_changed';
  role: UserRole;
  userIdentifier: string;
  details: string;
  ipAddress?: string;
  deviceInfo?: string;
}

export interface ExifData {
  cameraMake?: string;
  cameraModel?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
  capturedAt?: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface PhotoComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  isPhotographer?: boolean;
}

export interface PhotoItem {
  id: string;
  name: string;
  driveFileId?: string;
  googlePhotosId?: string;
  source?: 'google_photos' | 'google_drive' | 'local_raw';
  webViewLink?: string;
  thumbnailUrl: string;
  highResUrl: string;
  videoUrl?: string;
  mediaType?: 'photo' | 'video' | 'raw';
  duration?: string;
  originalFileName: string;
  fileSizeBytes: number;
  mimeType: string;
  width: number;
  height: number;
  exif?: ExifData;
  isFavorite?: boolean;
  selectedForRetouch?: boolean;
  rawComparisonUrl?: string; // For A/B RAW vs Retouched slider
  colorSpace?: 'P3 Wide Color' | 'AdobeRGB' | 'sRGB' | 'ProPhoto RGB';
  bitDepth?: string; // e.g. "14-bit Uncompressed RAW", "16-bit TIFF", "Lossless JPEG"
  clientRating?: number;
  comments: PhotoComment[];
  colorTag?: 'green' | 'amber' | 'blue' | 'purple' | 'red';
  uploadedAt: string;
}

export type WatermarkStyle = 'diagonal_grid' | 'center_crest' | 'corner_signature' | 'forensic_client_stamp';
export type QualityTier = 'lossless_master' | '4k_retina' | 'web_standard';

export interface ClientGallery {
  id: string;
  title: string;
  clientName: string;
  clientEmail: string;
  coverPhotoUrl: string;
  vanitySlug?: string; // Custom elegant short URL slug (e.g. 'vogue-editorial-2026')
  shootDate: string;
  location?: string;
  shootType: 'Wedding' | 'Editorial' | 'Portrait' | 'Fashion' | 'Commercial' | 'Event' | 'Landscape';
  accessPin: string; // 4 to 6 digit security PIN
  securityPasscode: string; // alphanumeric secret password
  passwordHash?: string; // SHA-256 encrypted verification hash
  encryptionSalt?: string;
  accessKeys?: GalleryAccessKey[]; // Multiple RBAC keys (Primary client, Guests, Retoucher)
  auditLogs?: SecurityAuditLog[]; // Timestamped access and action logs
  driveFolderId?: string;
  driveFolderName?: string;
  driveFolderLink?: string;
  googlePhotosAlbumId?: string;
  isWatermarkActive: boolean;
  watermarkText?: string;
  watermarkStyle?: WatermarkStyle;
  watermarkOpacity?: number; // 0.1 to 0.9
  antiRipProtection?: boolean; // Right-click, screenshot, and drag protection
  qualityTier?: QualityTier;
  allowHighResDownloads: boolean;
  allowProofingNotes: boolean;
  allowFavorites: boolean;
  status: 'active' | 'proofing' | 'delivered' | 'archived';
  welcomeMessage?: string;
  photos: PhotoItem[];
  createdAt: string;
  updatedAt: string;
  clientSelectionSubmitted?: boolean;
  clientSelectionSubmittedAt?: string;
}

export interface GeneratedConcept {
  id: string;
  prompt: string;
  aspectRatio: AspectRatioType;
  model: 'gemini-3.1-flash-image' | 'gemini-3-pro-image';
  imageUrl: string;
  createdAt: string;
  lightingStyle?: string;
  toneStyle?: string;
}

export interface ClientSession {
  galleryId: string;
  role: UserRole;
  clientName: string;
  clientEmail: string;
  authenticatedAt: string;
  sessionToken?: string;
  permissions: {
    canDownload: boolean;
    canProof: boolean;
    canStar: boolean;
    canViewOriginalHighRes: boolean;
    canViewUnwatermarked: boolean;
  };
}

export interface GooglePhotosAlbum {
  id: string;
  title: string;
  productUrl?: string;
  mediaItemsCount?: string | number;
  coverPhotoBaseUrl: string;
}

export interface GooglePhotosMediaItem {
  id: string;
  description?: string;
  baseUrl: string;
  filename: string;
  mimeType: string;
  mediaMetadata: {
    creationTime: string;
    width: string;
    height: string;
    photo?: {
      cameraMake?: string;
      cameraModel?: string;
      focalLength?: number;
      apertureFNumber?: number;
      isoEquivalent?: number;
      exposureTime?: string;
    };
  };
}
