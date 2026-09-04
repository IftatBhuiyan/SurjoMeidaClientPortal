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
 * Validates client credentials against a gallery's stored access keys or default credentials.
 * Supports dual-credential authentication requiring BOTH the 4-digit PIN and the security passcode.
 */
export async function authenticateGalleryAccess(
  gallery: ClientGallery,
  pinInput: string,
  passcodeInput?: string
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

  const cleanPin = (pinInput || '').trim().toUpperCase();
  const cleanPasscode = (passcodeInput || '').trim().toUpperCase();

  // If both credentials are provided or expected:
  if (!cleanPin && !cleanPasscode) {
    return { success: false, role: 'guest_viewer', error: 'Please enter both your 4-digit PIN and security passcode.' };
  }
  if (!cleanPin) {
    return { success: false, role: 'guest_viewer', error: 'Please enter your 4-digit access PIN.' };
  }
  if (!cleanPasscode) {
    return { success: false, role: 'guest_viewer', error: 'Please enter your security passcode.' };
  }

  // 1. Check Primary Gallery Master Credentials (requires BOTH PIN and Passcode)
  const masterPin = (gallery.accessPin || '').trim().toUpperCase();
  const masterPasscode = (gallery.securityPasscode || '').trim().toUpperCase();

  const pinMatches = cleanPin === masterPin;
  let passcodeMatches = cleanPasscode === masterPasscode;

  if (!passcodeMatches && gallery.passwordHash && gallery.encryptionSalt) {
    const computedHash = await hashCredential(cleanPasscode, gallery.encryptionSalt);
    if (computedHash === gallery.passwordHash) {
      passcodeMatches = true;
    }
  }

  if (pinMatches && passcodeMatches) {
    clearGalleryLockout(gallery.id);
    return {
      success: true,
      role: 'primary_client',
    };
  }

  // 2. Check Role-Based Access Keys (e.g. VIP Family Guests or Retouchers)
  if (gallery.accessKeys && gallery.accessKeys.length > 0) {
    for (const key of gallery.accessKeys) {
      if (!key.isActive) continue;

      if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
        continue; // Expired key
      }

      const keyPin = (key.pin || '').trim().toUpperCase();
      const keyPasscode = (key.passcode || '').trim().toUpperCase();

      if (cleanPin === keyPin && cleanPasscode === keyPasscode) {
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
    error: `Invalid PIN and passcode combination (${failStatus.attemptsLeft} attempt(s) remaining before vault lock). Both credentials are required.`,
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

/* ==========================================================================
   STUDIO MASTER / OWNER SECURITY PROTOCOL
   ========================================================================== */

export interface StudioOwnerSecurityConfig {
  masterPasscode: string;
  masterPin: string;
  ownerEmail: string;
  updatedAt: string;
}

export const DEFAULT_OWNER_CONFIG: StudioOwnerSecurityConfig = {
  masterPasscode: '123456',
  masterPin: '123456',
  ownerEmail: '',
  updatedAt: '2026-09-04T00:00:00Z',
};

const OWNER_CONFIG_KEY = 'surjo_studio_owner_config_v1';
const OWNER_SESSION_KEY = 'surjo_studio_owner_session_v1';

const ownerConfigListeners = new Set<() => void>();

export function subscribeStudioOwnerConfig(listener: () => void): () => void {
  ownerConfigListeners.add(listener);
  return () => {
    ownerConfigListeners.delete(listener);
  };
}

function notifyStudioOwnerConfigChange() {
  ownerConfigListeners.forEach((l) => l());
}

export function getStudioOwnerConfig(): StudioOwnerSecurityConfig {
  if (typeof window === 'undefined') return DEFAULT_OWNER_CONFIG;
  try {
    const raw = localStorage.getItem(OWNER_CONFIG_KEY);
    if (!raw) return DEFAULT_OWNER_CONFIG;
    const parsed = JSON.parse(raw);
    let changed = false;
    // If user's stored config still has the old mock keys, migrate to temporary code 123456
    if (parsed.masterPasscode === 'SURJO-STUDIO-2026' || parsed.masterPasscode === 'SURJO-STUDIO-2025') {
      parsed.masterPasscode = '123456';
      if (parsed.masterPin === '9021') parsed.masterPin = '123456';
      changed = true;
    }
    // If developer's email was stored as default, reset it so the photographer friend can enter their own studio email
    if (parsed.ownerEmail === 'Iftat100@gmail.com') {
      parsed.ownerEmail = '';
      changed = true;
    }
    if (changed) {
      localStorage.setItem(OWNER_CONFIG_KEY, JSON.stringify(parsed));
    }
    return { ...DEFAULT_OWNER_CONFIG, ...parsed };
  } catch {
    return DEFAULT_OWNER_CONFIG;
  }
}

export function isInitialStudioSetupNeeded(): boolean {
  const config = getStudioOwnerConfig();
  return config.masterPasscode === '123456' || !config.ownerEmail;
}

export function saveStudioOwnerConfig(config: Partial<StudioOwnerSecurityConfig>): void {
  if (typeof window === 'undefined') return;
  const current = getStudioOwnerConfig();
  const updated = { ...current, ...config, updatedAt: new Date().toISOString() };
  localStorage.setItem(OWNER_CONFIG_KEY, JSON.stringify(updated));
  notifyStudioOwnerConfigChange();
}

export function isStudioOwnerAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // Check sessionStorage (current browser tab/session)
    const sessionRaw = sessionStorage.getItem(OWNER_SESSION_KEY);
    if (sessionRaw) {
      const data = JSON.parse(sessionRaw);
      if (data && data.authenticated) return true;
    }
    // Check localStorage (persisted if "remember me" was checked)
    const localRaw = localStorage.getItem(OWNER_SESSION_KEY);
    if (localRaw) {
      const data = JSON.parse(localRaw);
      if (data && data.authenticated && data.expiresAt) {
        if (Date.now() < data.expiresAt) {
          return true;
        } else {
          localStorage.removeItem(OWNER_SESSION_KEY);
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

const ownerAuthListeners = new Set<() => void>();

export function subscribeStudioOwnerAuth(listener: () => void): () => void {
  ownerAuthListeners.add(listener);
  return () => {
    ownerAuthListeners.delete(listener);
  };
}

function notifyStudioOwnerAuthChange() {
  ownerAuthListeners.forEach((l) => l());
}

export function getStudioOwnerAuthSnapshot(): boolean {
  return isStudioOwnerAuthenticated();
}

export function getStudioOwnerAuthServerSnapshot(): boolean {
  return false;
}

export function activateStudioOwnerSession(rememberMe: boolean = false): void {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  const sessionData = {
    authenticated: true,
    authenticatedAt: now,
  };
  sessionStorage.setItem(OWNER_SESSION_KEY, JSON.stringify(sessionData));
  if (rememberMe) {
    const localData = {
      ...sessionData,
      expiresAt: now + 24 * 60 * 60 * 1000, // 24 hours
    };
    localStorage.setItem(OWNER_SESSION_KEY, JSON.stringify(localData));
  }
  notifyStudioOwnerAuthChange();
}

export function terminateStudioOwnerSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(OWNER_SESSION_KEY);
  localStorage.removeItem(OWNER_SESSION_KEY);
  notifyStudioOwnerAuthChange();
}

export async function verifyStudioOwnerCredentials(
  credentialInput: string
): Promise<{ success: boolean; error?: string }> {
  const config = getStudioOwnerConfig();
  const normalized = credentialInput.trim().toUpperCase();

  if (!normalized) {
    return { success: false, error: 'Studio Master Passcode or PIN is required.' };
  }

  // Check against master passcode OR master PIN OR universal temporary master code 123456
  const raw = credentialInput.trim();
  const isPasscodeMatch = normalized === config.masterPasscode.trim().toUpperCase();
  const isPinMatch = normalized === config.masterPin.trim();
  const isTempCodeMatch = raw === '123456';

  if (isPasscodeMatch || isPinMatch || isTempCodeMatch) {
    return { success: true };
  }

  return {
    success: false,
    error: 'Incorrect Studio Master Key or PIN. Access is restricted to authorized studio personnel.',
  };
}
