'use client';

import React from 'react';
import { Camera, HardDrive, Lock, Sparkles, UserCheck, LogIn, LogOut, CheckCircle2, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { googleSignIn, logout } from '@/lib/firebase';
import { User } from 'firebase/auth';
import { UserRole, ROLE_DEFINITIONS } from '@/lib/types';
import { PulseThemeToggle } from './PulseThemeToggle';

interface NavbarProps {
  activeView: 'photographer' | 'client';
  onViewChange: (view: 'photographer' | 'client') => void;
  currentUser: User | null;
  hasDriveAuth: boolean;
  onDriveConnected: (user: User, token: string) => void;
  onDriveDisconnected: () => void;
  selectedGalleryTitle?: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  currentRole?: UserRole;
  onOpenGooglePhotos?: () => void;
  isStandaloneClient?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onViewChange,
  currentUser,
  hasDriveAuth,
  onDriveConnected,
  onDriveDisconnected,
  selectedGalleryTitle,
  isDarkMode,
  onToggleTheme,
  currentRole = 'admin',
  onOpenGooglePhotos,
  isStandaloneClient = false,
}) => {
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  const handleGoogleAuth = async () => {
    try {
      setIsLoggingIn(true);
      const res = await googleSignIn();
      if (res) {
        onDriveConnected(res.user, res.accessToken);
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onDriveDisconnected();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const roleInfo = ROLE_DEFINITIONS[currentRole] || ROLE_DEFINITIONS.admin;

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 dark:bg-[#0C0B0A]/95 backdrop-blur-md border-b border-[#E6DFD3] dark:border-[#2D261E] px-4 lg:px-8 py-3.5 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
        {/* Surjo Media Brand & Identity */}
        <div className="flex items-center gap-3">
          {/* Surjo Sun Emblem */}
          <div className="w-8 h-8 rounded-full border border-[#C88E3E] bg-[#C88E3E]/10 dark:bg-[#C88E3E]/20 flex items-center justify-center shrink-0 shadow-sm relative group">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 text-[#C88E3E]">
              <circle cx="12" cy="12" r="4" strokeWidth="1.5" stroke="currentColor" fill="currentColor" fillOpacity="0.3" />
              <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="tracking-[0.25em] font-light text-sm uppercase text-[#1C1917] dark:text-[#F7F3EC] font-sans font-semibold">
                SURJO MEDIA
              </span>
              <span className="text-[9px] uppercase font-mono tracking-[0.2em] px-1.5 py-0.5 bg-[#C88E3E]/15 text-[#C88E3E] dark:text-[#D49A3D] border border-[#C88E3E]/30 font-medium">
                VAULT
              </span>
            </div>
            <p className="text-[10px] text-[#70665A] dark:text-[#A39886] font-mono tracking-wider uppercase hidden sm:block">
              {selectedGalleryTitle ? (
                <span className="truncate max-w-xs inline-block align-bottom">
                  {isStandaloneClient ? `Client Vault: ${selectedGalleryTitle}` : `Active Archive: ${selectedGalleryTitle}`}
                </span>
              ) : (
                'Photography & Film • Client Portal'
              )}
            </p>
          </div>
        </div>

        {/* Center Role Navigation Switcher (Hidden in Standalone Client Mode) */}
        {!isStandaloneClient ? (
          <div className="flex items-center bg-[#F3EDE2] dark:bg-[#151311] p-1 border border-[#E6DFD3] dark:border-[#2D261E]">
            <button
              id="nav-photographer-tab"
              onClick={() => onViewChange('photographer')}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 text-xs uppercase tracking-widest transition-all ${
                activeView === 'photographer'
                  ? 'bg-[#C88E3E] text-white font-medium shadow-sm'
                  : 'text-[#6E6659] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC]'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Studio Desk</span>
            </button>
            <button
              id="nav-client-portal-tab"
              onClick={() => onViewChange('client')}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 text-xs uppercase tracking-widest transition-all ${
                activeView === 'client'
                  ? 'bg-[#C88E3E] text-white font-medium shadow-sm'
                  : 'text-[#6E6659] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Client Vault</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FAF7F0] dark:bg-[#151311] border border-[#C88E3E]/40 text-xs font-mono text-[#C88E3E] dark:text-[#D49A3D] shadow-sm">
            <Lock className="w-3.5 h-3.5" />
            <span className="uppercase tracking-widest font-semibold text-[10px]">
              Private Client Vault
            </span>
          </div>
        )}

        {/* Right Section: Pulse Spatial Toggle, Google Photos Quick Sync & Account */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Pulse Spatial Theme Toggle */}
          <PulseThemeToggle isDarkMode={isDarkMode} onToggleTheme={onToggleTheme} />

          {/* Direct Google Photos Quick Ingest Trigger (Studio only) */}
          {!isStandaloneClient && onOpenGooglePhotos && activeView === 'photographer' && (
            <button
              onClick={onOpenGooglePhotos}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-[#151311] hover:bg-[#F3EDE2] dark:hover:bg-[#1E1B17] border border-[#E6DFD3] dark:border-[#2D261E] text-[#1C1917] dark:text-[#F7F3EC] text-xs font-mono uppercase tracking-wider transition-all"
              title="Import photos directly from Google Photos"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#C88E3E]" />
              <span className="text-[10px]">Google Photos</span>
            </button>
          )}

          {!isStandaloneClient && <div className="hidden lg:block w-px h-6 bg-[#E6DFD3] dark:bg-[#2D261E]"></div>}

          {!isStandaloneClient && (
            hasDriveAuth && currentUser ? (
              <div className="flex items-center gap-2 bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] px-2.5 sm:px-3 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C88E3E] shadow-[0_0_6px_#C88E3E]"></span>
                  <HardDrive className="w-3.5 h-3.5 text-[#C88E3E]" />
                  <span className="text-[11px] font-mono tracking-wider text-[#1C1917] dark:text-[#F7F3EC] hidden md:inline uppercase">
                    Drive Synced
                  </span>
                </div>
                {currentUser.photoURL && (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-5 h-5 border border-[#C88E3E]/40 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                )}
                <button
                  id="btn-drive-logout"
                  onClick={handleLogout}
                  title="Disconnect Google Drive"
                  className="text-[#70665A] hover:text-[#1C1917] dark:text-[#A39886] dark:hover:text-[#F7F3EC] p-1 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="btn-google-drive-connect"
                onClick={handleGoogleAuth}
                disabled={isLoggingIn}
                className="flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-[#FAF7F0] dark:bg-[#151311] hover:bg-[#C88E3E] hover:text-white text-[#1C1917] dark:text-[#F7F3EC] border border-[#E6DFD3] dark:border-[#2D261E] hover:border-[#C88E3E] text-xs uppercase tracking-widest font-light transition-all shadow-sm group"
              >
                <HardDrive className="w-3.5 h-3.5 text-[#C88E3E] group-hover:text-white" />
                <span className="hidden sm:inline">
                  {isLoggingIn ? 'Syncing...' : 'Link Drive'}
                </span>
                <span className="sm:hidden">Link</span>
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
};
