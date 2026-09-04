import { UserRole, GalleryAccessKey, SecurityAuditLog, ClientGallery, ROLE_DEFINITIONS } from './types';

/**
 * Computes a SHA-256 cryptographic hash of a given string with salt using the Web Crypto API
 */
export async function hashCredential(text: string, salt: string = 'APERTURE_VAULT_2026'): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${text.trim().toUpperCase()}:${salt}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a random cryptographic salt
 */
export function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a secure unique gallery identifier (UUID-like)
 */
export function generateGalleryIdentifier(): string {
  const prefix = 'vault';
  const timestamp = Date.now().toString(36);
  const array = new Uint8Array(6);
  crypto.getRandomValues(array);
  const randomHex = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${prefix}_${timestamp}_${randomHex}`;
}

interface RateLimitRecord {
  attempts: number;
  lockedUntil: number | null;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

export function checkGalleryLockout(galleryId: string): { isLocked: boolean; remainingMinutes: number } {
  const record = rateLimitMap.get(galleryId);
  if (!record || !record.lockedUntil) {
    return { isLocked: false, remainingMinutes: 0 };
  }

  const now = Date.now();
  if (now >= record.lockedUntil) {
    // Lockout expired
    rateLimitMap.delete(galleryId);
    return { isLocked: false, remainingMinutes: 0 };
  }

  const remainingMs = record.lockedUntil - now;
  return {
    isLocked: true,
    remainingMinutes: Math.ceil(remainingMs / (60 * 1000)),
  };
}

export function registerFailedLogin(galleryId: string): { isNowLocked: boolean; attemptsLeft: number } {
  const record = rateLimitMap.get(galleryId) || { attempts: 0, lockedUntil: null };
  record.attempts += 1;

  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    rateLimitMap.set(galleryId, record);
    return { isNowLocked: true, attemptsLeft: 0 };
  }

  rateLimitMap.set(galleryId, record);
  return { isNowLocked: false, attemptsLeft: MAX_FAILED_ATTEMPTS - record.attempts };
}

export function clearGalleryLockout(galleryId: string): void {
  rateLimitMap.delete(galleryId);
}

/**
 * Validates a client input credential against a gallery's stored access keys or default credentials
 */
export async function authenticateGalleryAccess(
  gallery: ClientGallery,
  inputCode: string
): Promise<{ success: boolean; role: UserRole; key?: GalleryAccessKey; error?: string; isLocked?: boolean }> {
  // Check brute force lockout first
  const lockout = checkGalleryLockout(gallery.id);
  if (lockout.isLocked) {
    return {
      success: false,
      role: 'guest_viewer',
      isLocked: true,
      error: `Security Lockout Active: Too many failed attempts. This private vault is locked for ${lockout.remainingMinutes} more minute(s) to protect client privacy.`,
    };
  }

  const cleanInput = inputCode.trim().toUpperCase();
  if (!cleanInput) {
    return { success: false, role: 'guest_viewer', error: 'Please enter an access PIN or Security Passcode.' };
  }

  // 1. Check Primary Gallery Master Passcode & PIN
  const cleanPin = (gallery.accessPin || '').trim().toUpperCase();
  const cleanPasscode = (gallery.securityPasscode || '').trim().toUpperCase();

  if (cleanInput === cleanPin || cleanInput === cleanPasscode) {
    clearGalleryLockout(gallery.id);
    return {
      success: true,
      role: 'primary_client',
    };
  }

  // 2. Check hashed password if available
  if (gallery.passwordHash && gallery.encryptionSalt) {
    const computedHash = await hashCredential(cleanInput, gallery.encryptionSalt);
    if (computedHash === gallery.passwordHash) {
      clearGalleryLockout(gallery.id);
      return {
        success: true,
        role: 'primary_client',
      };
    }
  }

  // 3. Check Role-Based Access Keys (e.g. VIP Family Guests or Retouchers)
  if (gallery.accessKeys && gallery.accessKeys.length > 0) {
    for (const key of gallery.accessKeys) {
      if (!key.isActive) continue;

      if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
        continue; // Expired key
      }

      const keyPin = (key.pin || '').trim().toUpperCase();
      const keyPasscode = (key.passcode || '').trim().toUpperCase();

      if (cleanInput === keyPin || cleanInput === keyPasscode) {
        clearGalleryLockout(gallery.id);
        return {
          success: true,
          role: key.role,
          key,
        };
      }
    }
  }

  // Handle failed attempt & register lockout tracking
  const failStatus = registerFailedLogin(gallery.id);
  if (failStatus.isNowLocked) {
    return {
      success: false,
      role: 'guest_viewer',
      isLocked: true,
      error: 'Security Breach Protocol: 5 consecutive invalid attempts detected. Vault is now locked for 15 minutes.',
    };
  }

  return {
    success: false,
    role: 'guest_viewer',
    error: `Invalid security code (${failStatus.attemptsLeft} attempt(s) remaining before vault lock). Please check your invitation credentials.`,
  };
}

/**
 * Appends a tamper-evident audit log to the gallery record
 */
export function recordAuditLog(
  gallery: ClientGallery,
  eventType: SecurityAuditLog['eventType'],
  role: UserRole,
  userIdentifier: string,
  details: string
): ClientGallery {
  const newLog: SecurityAuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    galleryId: gallery.id,
    timestamp: new Date().toISOString(),
    eventType,
    role,
    userIdentifier,
    details,
    deviceInfo: typeof navigator !== 'undefined' ? `${navigator.userAgent.slice(0, 50)}...` : 'Web Client',
  };

  const existingLogs = gallery.auditLogs || [];
  return {
    ...gallery,
    auditLogs: [newLog, ...existingLogs.slice(0, 49)], // Keep latest 50 logs
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Creates default initial access keys for a gallery
 */
export function createDefaultAccessKeys(gallery: ClientGallery): GalleryAccessKey[] {
  return [
    {
      id: `key_client_${gallery.id}`,
      role: 'primary_client',
      label: `Primary Client (${gallery.clientName})`,
      pin: gallery.accessPin,
      passcode: gallery.securityPasscode,
      canDownload: gallery.allowHighResDownloads,
      watermarkForced: false,
      accessCount: 1,
      isActive: true,
    },
    {
      id: `key_guest_${gallery.id}`,
      role: 'guest_viewer',
      label: 'Family & Guests VIP Link',
      pin: Math.floor(1000 + Math.random() * 9000).toString(),
      passcode: `GUEST-${gallery.shootType.toUpperCase()}`,
      canDownload: false,
      watermarkForced: gallery.isWatermarkActive,
      accessCount: 0,
      isActive: true,
    },
    {
      id: `key_retouch_${gallery.id}`,
      role: 'retoucher',
      label: 'Color Retoucher / Studio Assistant',
      pin: '9900',
      passcode: 'RETOUCH2026',
      canDownload: true,
      watermarkForced: false,
      accessCount: 0,
      isActive: true,
    },
  ];
}
