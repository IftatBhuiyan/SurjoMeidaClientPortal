'use client';

import React, { useSyncExternalStore, useState, useEffect } from 'react';
import { ClientPortalView } from '@/components/ClientPortalView';
import { Navbar } from '@/components/Navbar';
import { ClientGallery } from '@/lib/types';
import {
  getGalleries,
  saveGalleries,
  subscribeGalleries,
  INITIAL_DEMO_GALLERIES,
} from '@/lib/storage';
import { resolveGalleryFromMasterList } from '@/lib/vault-resolver';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Theme synchronization
function getThemeSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('surjo_theme_mode') === 'dark';
}
function getThemeServerSnapshot(): boolean {
  return false;
}
const themeListeners = new Set<() => void>();
function subscribeTheme(listener: () => void) {
  themeListeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    themeListeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

interface VaultClientPageProps {
  initialIdOrSlug: string;
  initialPin?: string;
  initialPasscode?: string;
  initialRole?: string;
  initialGallery?: ClientGallery;
}

export default function VaultClientPage({
  initialIdOrSlug,
  initialPin,
  initialPasscode,
  initialGallery,
}: VaultClientPageProps) {
  const galleries = useSyncExternalStore(
    subscribeGalleries,
    getGalleries,
    () => INITIAL_DEMO_GALLERIES
  );

  const localMatch =
    resolveGalleryFromMasterList(initialIdOrSlug, galleries) ||
    galleries.find((g) => g.id === initialIdOrSlug);

  const [remoteGallery, setRemoteGallery] = useState<ClientGallery | null>(initialGallery ?? null);
  const [isLoadingRemote, setIsLoadingRemote] = useState<boolean>(!initialGallery && !localMatch);

  const isDarkMode = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot
  );

  // Resolve matching gallery from remote fetch, local storage, or server props
  const resolvedGallery = remoteGallery || localMatch || initialGallery;

  // Fetch gallery from server if not already available
  useEffect(() => {
    if (resolvedGallery) return;

    let isCancelled = false;

    async function fetchFromApi() {
      try {
        const res = await fetch(`/api/vaults/${encodeURIComponent(initialIdOrSlug)}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.gallery && !isCancelled) {
            setRemoteGallery(data.gallery);
            // Save to local cache so offline and subcomponents have it
            try {
              const { upsertGallery } = await import('@/lib/storage');
              upsertGallery(data.gallery);
            } catch {
              // ignore
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch vault from server API:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingRemote(false);
        }
      }
    }

    fetchFromApi();

    return () => {
      isCancelled = true;
    };
  }, [initialIdOrSlug, resolvedGallery]);

  const handleToggleTheme = () => {
    const current = getThemeSnapshot();
    const next = !current;
    if (typeof window !== 'undefined') {
      localStorage.setItem('surjo_theme_mode', next ? 'dark' : 'light');
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    themeListeners.forEach((l) => l());
  };

  const handleUpdateGallery = async (updated: ClientGallery) => {
    setRemoteGallery(updated);
    const next = galleries.map((g) => (g.id === updated.id ? updated : g));
    saveGalleries(next);

    // Persist changes to server
    try {
      await fetch(`/api/vaults/${encodeURIComponent(updated.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error('Failed to sync gallery update to server:', err);
    }
  };

  if (isLoadingRemote && !resolvedGallery) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FAF7F2] dark:bg-[#0C0B0A] text-[#1C1917] dark:text-[#F7F3EC] text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#EAE3D2] dark:bg-[#25201A] flex items-center justify-center text-[#C88E3E] animate-pulse">
          <Shield className="w-6 h-6 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <h1 className="text-xl font-serif">Locating Private Vault...</h1>
        <p className="text-xs font-mono text-[#70665A] dark:text-[#A39886]">
          Establishing secure connection to Surjo Media archive
        </p>
      </div>
    );
  }

  if (!resolvedGallery) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FAF7F2] dark:bg-[#0C0B0A] text-[#1C1917] dark:text-[#F7F3EC] text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#EAE3D2] dark:bg-[#25201A] flex items-center justify-center text-[#C88E3E]">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-serif">Vault Not Found</h1>
        <p className="text-xs text-[#70665A] dark:text-[#A39886] max-w-sm">
          The requested private client vault could not be located. Please verify your custom access link or contact the studio.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C88E3E] text-white text-xs font-mono uppercase tracking-widest hover:bg-[#B77D2F] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Studio Desk</span>
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        isDarkMode ? 'bg-[#0C0B0A] text-[#F7F3EC]' : 'bg-[#FAF7F2] text-[#1C1917]'
      }`}
    >
      <Navbar
        activeView="client"
        onViewChange={() => {}}
        currentUser={null}
        hasDriveAuth={false}
        selectedGalleryTitle={resolvedGallery.title}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        isStandaloneClient={true}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8">
        <ClientPortalView
          key={`${resolvedGallery.id}_${initialPin || ''}_${initialPasscode || ''}`}
          galleries={[resolvedGallery]}
          initialGalleryId={resolvedGallery.id}
          initialPin={initialPin}
          initialPasscode={initialPasscode}
          isStandaloneClient={true}
          onUpdateGallery={handleUpdateGallery}
          onSwitchToPhotographer={() => {}}
        />
      </main>

      <footer
        className={`border-t py-8 px-4 text-center text-xs font-mono transition-colors ${
          isDarkMode
            ? 'border-[#2D261E] bg-[#0C0B0A] text-[#A39886]'
            : 'border-[#E6DFD3] bg-[#FAF7F2] text-[#70665A]'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="tracking-wider">SURJO MEDIA VAULT • ENCRYPTED CLIENT PORTAL</span>
          <span className="text-[#C88E3E] font-medium tracking-widest">
            {resolvedGallery.clientName.toUpperCase()} • PRIVATE ARCHIVE
          </span>
        </div>
      </footer>
    </div>
  );
}
