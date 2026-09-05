import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

/**
 * Ensures the uploads storage directory exists
 */
export function ensureUploadDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to ensure upload directory:', err);
  }
}

export interface SavedMediaFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  storedPath: string;
  url: string;
  downloadUrl: string;
  createdAt: string;
}

/**
 * Sanitizes a filename to prevent path traversal
 */
function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Saves a file buffer to disk and returns its metadata
 */
export async function saveMediaFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<SavedMediaFile> {
  ensureUploadDir();

  const cleanName = sanitizeFileName(originalName || 'photo.jpg');
  const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanName}`;
  const filePath = path.join(UPLOAD_DIR, fileId);

  await fs.promises.writeFile(filePath, buffer);

  return {
    id: fileId,
    originalName,
    mimeType: mimeType || 'image/jpeg',
    size: buffer.length,
    storedPath: filePath,
    url: `/api/media/${fileId}`,
    downloadUrl: `/api/media/${fileId}?download=true`,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Retrieves a file buffer and metadata by ID
 */
export async function getMediaFile(
  fileId: string
): Promise<{ buffer: Buffer; mimeType: string; originalName: string } | null> {
  ensureUploadDir();

  // Prevent path traversal
  const safeId = path.basename(fileId);
  const filePath = path.join(UPLOAD_DIR, safeId);

  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const buffer = await fs.promises.readFile(filePath);

    // Extract original filename from fileId (format: timestamp_random_originalName)
    const parts = safeId.split('_');
    const originalName = parts.length >= 3 ? parts.slice(2).join('_') : safeId;

    // Detect MIME type based on extension
    const ext = path.extname(safeId).toLowerCase();
    let mimeType = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.avif') mimeType = 'image/avif';
    else if (ext === '.svg') mimeType = 'image/svg+xml';
    else if (ext === '.mp4') mimeType = 'video/mp4';
    else if (ext === '.mov') mimeType = 'video/quicktime';
    else if (ext === '.dng' || ext === '.arw' || ext === '.cr2' || ext === '.cr3' || ext === '.nef') {
      mimeType = 'image/x-raw';
    }

    return {
      buffer,
      mimeType,
      originalName,
    };
  } catch (err) {
    console.error(`Failed to read media file ${fileId}:`, err);
    return null;
  }
}
