'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { Navbar } from '@/components/Navbar';
import { PhotographerDashboard } from '@/components/PhotographerDashboard';
import { ClientPortalView } from '@/components/ClientPortalView';
import { GooglePhotosPickerModal } from '@/components/GooglePhotosPickerModal';
import { StudioMasterGate } from '@/components/StudioMasterGate';
import { StudioSecurityModal } from '@/components/StudioSecurityModal';
import { ClientGallery, PhotoItem } from '@/lib/types';
import {
  getGalleries,
  saveGalleries,
  upsertGallery,
  getStudioConcepts,
  subscribeGalleries,
  subscribeConcepts,
  syncGalleriesWithServer,
  INITIAL_DEMO_GALLERIES,
  INITIAL_CONCEPTS,
} from '@/lib/storage';
import { initAuth, setCachedAccessToken } from '@/lib/firebase';
import {
  recordAuditLog,
  isStudioOwnerAuthenticated,
  activateStudioOwnerSession,
  terminateStudioOwnerSession,
  subscribeStudioOwnerAuth,
  getStudioOwnerAuthSnapshot,
  getStudioOwnerAuthServerSnapshot,
  isInitialStudioSetupNeeded,
} from '@/lib/security';
import { resolveGalleryFromMasterList } from '@/lib/vault-resolver';
import { User } from 'firebase/auth';

// 1. External Theme Store for zero-mismatch hydration
const themeListeners = new Set<() => void>();
function subscribeTheme(listener: () => void) {
  themeListeners.add(listener);
  return () => themeListeners.delete(listener);
}
function getThemeSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('surjo_theme_mode');
  return saved === 'dark';
}
function getThemeServerSnapshot(): boolean {
  return false;
}

// 2. URL Search Store (primitive string to prevent snapshot reference loops)
function getSearchSnapshot(): string {
  if (typeof window === 'undefined') return '';
  return window.location.search;
}
function getSearchServerSnapshot(): string {
  return '';
}
function subscribeUrl(listener: () => void) {
  window.addEventListener('popstate', listener);
  return () => window.removeEventListener('popstate', listener);
}

interface HomeClientProps {
  initialVaultId?: string;
  initialPin?: string;
  initialPasscode?: string;
}

export default function HomeClient({
  initialVaultId,
  initialPin,
  initialPasscode,
}: HomeClientProps) {
  const galleries = useSyncExternalStore(
    subscribeGalleries,
    getGalleries,
    () => INITIAL_DEMO_GALLERIES
  );

  const concepts = useSyncExternalStore(
    subscribeConcepts,
    getStudioConcepts,
    () => INITIAL_CONCEPTS
  );

  const isDarkMode = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot
  );

  const searchString = useSyncExternalStore(
    subscribeUrl,
    getSearchSnapshot,
    getSearchServerSnapshot
  );

  const urlParams = React.useMemo(() => {
    const params = new URLSearchParams(searchString);
    const vault = params.get('vault') || initialVaultId || '';
    const galleryId = params.get('galleryId') || '';
    const pin = params.get('pin') || initialPin || '';
    const passcode = params.get('passcode') || initialPasscode || '';
    const isClient = !!(vault || galleryId || params.get('view') === 'client');
    const isStandalone = !!(vault || params.get('clientVault') || (params.get('view') === 'client' && galleryId));
    return { vault, galleryId, pin, passcode, isClient, isStandalone };
  }, [searchString, initialVaultId, initialPin, initialPasscode]);

  const [viewOverride, setViewOverride] = useState<'photographer' | 'client' | null>(null);
  const [selectedGalleryOverride, setSelectedGalleryOverride] = useState<string | null>(null);
  const [showGlobalGooglePhotosModal, setShowGlobalGooglePhotosModal] = useState(false);

  const activeView = viewOverride ?? (urlParams.isClient ? 'client' : 'photographer');
  const isStandaloneClient = urlParams.isStandalone;

  // Resolve target gallery (supporting both ID and vanitySlug)
  const targetLookupId = selectedGalleryOverride || urlParams.vault || urlParams.galleryId || '';
  const resolvedTarget = targetLookupId ? resolveGalleryFromMasterList(targetLookupId, galleries) : undefined;
  const selectedGalleryForClient = resolvedTarget?.id || targetLookupId || galleries[0]?.id || '';

  const initialClientPin = urlParams.pin;
  const initialClientPasscode = urlParams.passcode;

  // Google Drive & Firebase Auth
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Studio Owner Security State via external store
  const isStudioOwnerAuth = useSyncExternalStore(
    subscribeStudioOwnerAuth,
    getStudioOwnerAuthSnapshot,
    getStudioOwnerAuthServerSnapshot
  );
  const [showStudioSecurityModal, setShowStudioSecurityModal] = useState(false);

  const handleLockStudioDesk = () => {
    terminateStudioOwnerSession();
  };

  // Toggle Pulse Theme
  const handleToggleTheme = () => {
    const current = getThemeSnapshot();
    const next = !current;
    if (typeof window !== 'undefined') {
      localStorage.setItem('surjo_theme_mode', next ? 'dark' : 'light');
      if (next) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    }
    themeListeners.forEach((l) => l());
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    }
  }, [isDarkMode]);

  // Initialize Firebase Auth listener
  useEffect(() => {
    // Synchronize local galleries with server store so vaults are accessible across all devices
    syncGalleriesWithServer();

    initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
        if (user) {
          activateStudioOwnerSession(true);
        }
      },
      () => {
        // Not authenticated yet
      }
    );
  }, []);

  // If URL has a specific vault requested but not yet in local memory, fetch immediately from server
  useEffect(() => {
    if (targetLookupId && !resolvedTarget) {
      fetch(`/api/vaults/${encodeURIComponent(targetLookupId)}`, { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.gallery) {
            upsertGallery(data.gallery);
          }
        })
        .catch((err) => {
          console.warn('Failed to resolve target vault from server:', err);
        });
    }
  }, [targetLookupId, resolvedTarget]);

  const handleUpdateGalleries = (updatedGalleries: ClientGallery[]) => {
    saveGalleries(updatedGalleries);
  };

  const handleDriveConnected = (user: User, token: string) => {
    setCurrentUser(user);
    setAccessToken(token);
    setCachedAccessToken(token);
    activateStudioOwnerSession(true);
  };

  const handleDriveDisconnected = () => {
    setCurrentUser(null);
    setAccessToken(null);
    setCachedAccessToken(null);
  };

  const handleSelectGalleryForClientView = (galleryId: string) => {
    setSelectedGalleryOverride(galleryId);
    setViewOverride('client');
  };

  const handleGlobalGooglePhotosImport = (importedPhotos: PhotoItem[]) => {
    if (galleries.length === 0) return;
    const target = galleries.find((g) => g.id === selectedGalleryForClient) || galleries[0];
    const updatedTarget: ClientGallery = {
      ...target,
      photos: [...importedPhotos, ...target.photos],
      coverPhotoUrl: target.coverPhotoUrl || (importedPhotos[0]?.thumbnailUrl ?? ''),
      updatedAt: new Date().toISOString(),
    };

    const audited = recordAuditLog(
      updatedTarget,
      'settings_changed',
      'admin',
      'Studio Admin',
      `Imported ${importedPhotos.length} lossless photos from Google Photos.`
    );

    const updatedList = galleries.map((g) => (g.id === audited.id ? audited : g));
    handleUpdateGalleries(updatedList);
  };

  const currentActiveGallery = galleries.find((g) => g.id === selectedGalleryForClient) || galleries[0];

  // In standalone client mode, only expose the client's own gallery
  const clientVisibleGalleries = isStandaloneClient && currentActiveGallery ? [currentActiveGallery] : galleries;

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 w-full max-w-full overflow-x-hidden ${
        isDarkMode ? 'bg-[#0C0B0A] text-[#F7F3EC]' : 'bg-[#FAF7F2] text-[#1C1917]'
      }`}
    >
      {/* Top Application Header & Role Switcher */}
      <Navbar
        activeView={activeView}
        onViewChange={(v) => setViewOverride(v)}
        currentUser={currentUser}
        hasDriveAuth={!!accessToken}
        onDriveConnected={handleDriveConnected}
        onDriveDisconnected={handleDriveDisconnected}
        selectedGalleryTitle={currentActiveGallery?.title}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onOpenGooglePhotos={() => setShowGlobalGooglePhotosModal(true)}
        isStandaloneClient={isStandaloneClient}
        isStudioOwnerAuthenticated={isStudioOwnerAuth}
        onLockStudioDesk={handleLockStudioDesk}
        onOpenStudioSecurity={() => setShowStudioSecurityModal(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8">
        {activeView === 'photographer' && !isStandaloneClient ? (
          !isStudioOwnerAuth ? (
            <StudioMasterGate
              currentUser={currentUser}
              onAuthenticated={(user, isFirstLoginWithTemp) => {
                if (user) {
                  setCurrentUser(user);
                }
                if (isFirstLoginWithTemp || isInitialStudioSetupNeeded()) {
                  setShowStudioSecurityModal(true);
                }
              }}
              onSwitchToClient={() => setViewOverride('client')}
            />
          ) : (
            <PhotographerDashboard
              galleries={galleries}
              concepts={concepts}
              onUpdateGalleries={handleUpdateGalleries}
              onSelectGalleryForClientView={handleSelectGalleryForClientView}
              hasDriveAuth={!!accessToken}
              accessToken={accessToken}
              onOpenSecurityModal={() => setShowStudioSecurityModal(true)}
              onLockStudioDesk={handleLockStudioDesk}
            />
          )
        ) : (
          <ClientPortalView
            key={`${selectedGalleryForClient}_${initialClientPin}_${initialClientPasscode}`}
            galleries={clientVisibleGalleries}
            initialGalleryId={selectedGalleryForClient}
            initialPin={initialClientPin}
            initialPasscode={initialClientPasscode}
            isStandaloneClient={isStandaloneClient}
            onUpdateGallery={(updated) => {
              const updatedGalleries = galleries.map((g) => (g.id === updated.id ? updated : g));
              handleUpdateGalleries(updatedGalleries);
            }}
            onSwitchToPhotographer={() => {
              if (!isStandaloneClient) {
                setViewOverride('photographer');
              }
            }}
          />
        )}
      </main>

      {/* Studio Owner Security Key Modal */}
      <StudioSecurityModal
        isOpen={showStudioSecurityModal}
        onClose={() => setShowStudioSecurityModal(false)}
        onLockDeskNow={handleLockStudioDesk}
      />

      {/* Global Google Photos Importer Modal */}
      {currentActiveGallery && (
        <GooglePhotosPickerModal
          isOpen={showGlobalGooglePhotosModal}
          onClose={() => setShowGlobalGooglePhotosModal(false)}
          onImportPhotos={handleGlobalGooglePhotosImport}
          accessToken={accessToken}
          targetGalleryTitle={currentActiveGallery.title}
        />
      )}

      {/* Footer */}
      <footer
        className={`border-t py-8 px-4 text-center text-xs font-mono transition-colors ${
          isDarkMode
            ? 'border-[#2D261E] bg-[#0C0B0A] text-[#A39886]'
            : 'border-[#E6DFD3] bg-[#FAF7F2] text-[#70665A]'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="tracking-wider">SURJO MEDIA VAULT • GOOGLE PHOTOS & DRIVE LOSSLESS MASTER PORTAL</span>
          <span className="text-[#C88E3E] font-medium tracking-widest">SHA-256 RBAC ENCRYPTION • SPATIAL REVEAL ENGINE</span>
        </div>
      </footer>
    </div>
  );
}
