import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App instance safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firebaseProjectId = firebaseConfig.projectId;

// Base provider for standard Google Authentication (profile & email only - non-sensitive)
const baseProvider = new GoogleAuthProvider();
baseProvider.setCustomParameters({
  prompt: 'select_account',
});

// Workspace & Cloud scopes (Drive + Google Photos Library)
export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/photoslibrary.readonly',
];

const driveProvider = new GoogleAuthProvider();
DRIVE_SCOPES.forEach((scope) => {
  driveProvider.addScope(scope);
});
driveProvider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline',
});

// Flag to indicate if we are in the middle of a sign-in flow
let isSigningIn = false;
// Cache access token in memory
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If user is logged in but memory token is lost (e.g. page refresh),
        // we can prompt or re-fetch token via popup on interaction
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export interface GoogleSignInOptions {
  withDrive?: boolean;
}

export const googleSignIn = async (
  options?: GoogleSignInOptions
): Promise<{ user: User; accessToken?: string } | null> => {
  try {
    isSigningIn = true;
    const provider = options?.withDrive ? driveProvider : baseProvider;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }

    return { user: result.user, accessToken: cachedAccessToken ?? undefined };
  } catch (error: unknown) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const connectGoogleDrive = async (): Promise<{ user: User; accessToken: string } | null> => {
  const res = await googleSignIn({ withDrive: true });
  if (res && res.accessToken) {
    return { user: res.user, accessToken: res.accessToken };
  }
  return null;
};

export const isGoogleVerificationError = (err: unknown): boolean => {
  if (!err) return false;
  const str = (err instanceof Error ? err.message : String(err)).toLowerCase();
  const code = ((err as { code?: string })?.code || '').toLowerCase();
  return (
    str.includes('verification process') ||
    str.includes('access_denied') ||
    str.includes('403') ||
    str.includes('developer-approved') ||
    code.includes('access-denied') ||
    code.includes('admin-restricted-operation')
  );
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
