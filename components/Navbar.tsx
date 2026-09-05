'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, HardDrive, Lock, Sparkles, UserCheck, LogIn, LogOut, CheckCircle2, ShieldCheck, Image as ImageIcon, ChevronDown, Cloud, KeyRound, AlertTriangle, Copy, Check, ExternalLink, X, HelpCircle } from 'lucide-react';
import { googleSignIn, logout, firebaseProjectId, isGoogleVerificationError } from '@/lib/firebase';
import { User } from 'firebase/auth';
import { UserRole, ROLE_DEFINITIONS } from '@/lib/types';
import { PulseThemeToggle } from './PulseThemeToggle';

interface NavbarProps {
  activeView: 'photographer' | 'client';
  onViewChange: (view: 'photographer' | 'client') => void;
  currentUser: User | null;
  hasDriveAuth: boolean;
  onDriveConnected?: (user: User, token: string) => void;
  onDriveDisconnected?: () => void;
  selectedGalleryTitle?: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  currentRole?: UserRole;
  onOpenGooglePhotos?: () => void;
  isStandaloneClient?: boolean;
  isStudioOwnerAuthenticated?: boolean;
  onLockStudioDesk?: () => void;
  onOpenStudioSecurity?: () => void;
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
  isStudioOwnerAuthenticated = false,
  onLockStudioDesk,
  onOpenStudioSecurity,
}) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authErrorModal, setAuthErrorModal] = useState<{
    type: 'unauthorized_domain' | 'google_verification' | 'general';
    domain: string;
    message: string;
  } | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleGoogleAuth = async () => {
    try {
      setIsLoggingIn(true);
      const res = await googleSignIn({ withDrive: true });
      if (res && res.accessToken) {
        onDriveConnected?.(res.user, res.accessToken);
      }
    } catch (err: unknown) {
      console.error('Google sign-in error:', err);
      const errCode = (err as { code?: string })?.code;
      const errMsg = err instanceof Error ? err.message : String(err);
      
      const domain =
        typeof window !== 'undefined' && window.location.hostname
          ? window.location.hostname
          : 'clients.surjomedia.com';

      const isUnauthorized =
        errCode === 'auth/unauthorized-domain' ||
        errMsg.toLowerCase().includes('unauthorized-domain');
      const isVerificationIssue =
        isGoogleVerificationError(err) ||
        errMsg.includes('403') ||
        errMsg.includes('access_denied');

      if (isUnauthorized) {
        setAuthErrorModal({
          type: 'unauthorized_domain',
          domain,
          message: `The domain "${domain}" is not authorized for Google OAuth in your Firebase project.`,
        });
      } else if (isVerificationIssue) {
        setAuthErrorModal({
          type: 'google_verification',
          domain,
          message: errMsg,
        });
      } else if (errCode !== 'auth/popup-closed-by-user' && !errMsg.includes('popup-closed-by-user')) {
        setAuthErrorModal({
          type: 'general',
          domain,
          message: errMsg || 'Failed to authenticate with Google.',
        });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onDriveDisconnected?.();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const roleInfo = ROLE_DEFINITIONS[currentRole] || ROLE_DEFINITIONS.admin;

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 dark:bg-[#0C0B0A]/95 backdrop-blur-md border-b border-[#E6DFD3] dark:border-[#2D261E] px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 transition-colors duration-300 w-full max-w-full">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 w-full">
        {/* Surjo Media Brand & Identity */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          {/* Surjo Sun Emblem */}
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#C88E3E] bg-[#C88E3E]/10 dark:bg-[#C88E3E]/20 flex items-center justify-center shrink-0 shadow-sm relative group">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C88E3E]">
              <circle cx="12" cy="12" r="4" strokeWidth="1.5" stroke="currentColor" fill="currentColor" fillOpacity="0.3" />
              <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="tracking-[0.18em] sm:tracking-[0.25em] font-semibold text-xs sm:text-sm uppercase text-[#1C1917] dark:text-[#F7F3EC] font-sans truncate">
                SURJO<span className="hidden sm:inline"> MEDIA</span>
              </span>
              <span className="text-[8px] sm:text-[9px] uppercase font-mono tracking-[0.15em] sm:tracking-[0.2em] px-1 sm:px-1.5 py-0.5 bg-[#C88E3E]/15 text-[#C88E3E] dark:text-[#D49A3D] border border-[#C88E3E]/30 font-medium shrink-0">
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

        {/* Center Role Navigation Switcher (Desktop md+) */}
        {!isStandaloneClient ? (
          <div className="hidden md:flex items-center bg-[#F3EDE2] dark:bg-[#151311] p-1 border border-[#E6DFD3] dark:border-[#2D261E] shrink-0">
            <button
              id="nav-photographer-tab"
              onClick={() => onViewChange('photographer')}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 text-xs uppercase tracking-widest transition-all ${
                activeView === 'photographer'
                  ? 'bg-[#C88E3E] text-white font-medium shadow-sm'
                  : 'text-[#6E6659] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC]'
              }`}
            >
              {isStudioOwnerAuthenticated ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-[#C88E3E]" />
              )}
              <span>Studio Desk</span>
              {isStudioOwnerAuthenticated && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
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
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#FAF7F0] dark:bg-[#151311] border border-[#C88E3E]/40 text-xs font-mono text-[#C88E3E] dark:text-[#D49A3D] shadow-sm">
            <Lock className="w-3.5 h-3.5" />
            <span className="uppercase tracking-widest font-semibold text-[10px]">
              Private Client Vault
            </span>
          </div>
        )}

        {/* Right Section: Lock, Theme Toggle, Google Photos Quick Sync & Account */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Global Lock Studio Desk (Photographer View only when authenticated) */}
          {!isStandaloneClient && activeView === 'photographer' && isStudioOwnerAuthenticated && onLockStudioDesk && (
            <button
              id="btn-quick-lock-desk"
              onClick={onLockStudioDesk}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#70665A] dark:text-[#A39886] hover:text-red-600 dark:hover:text-red-400 border border-[#E6DFD3] dark:border-[#2D261E] bg-white dark:bg-[#151311] transition-colors shadow-sm cursor-pointer"
              title="Lock Studio Desk immediately"
            >
              <Lock className="w-3 h-3 text-red-500/80 shrink-0" />
              <span className="hidden sm:inline">Lock Desk</span>
            </button>
          )}

          {/* Pulse Spatial Theme Toggle */}
          <PulseThemeToggle isDarkMode={isDarkMode} onToggleTheme={onToggleTheme} />

          {/* Unified Google Cloud Hub (Studio Desk Only) */}
          {!isStandaloneClient && activeView === 'photographer' && (
            hasDriveAuth && currentUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  id="btn-google-cloud-hub"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] hover:border-[#C88E3E] px-2 sm:px-3 py-1.5 transition-all shadow-sm cursor-pointer group"
                  title="Google Cloud Workspace Hub (Drive & Photos Active)"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10B981]"></span>
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Google User'}
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-[#C88E3E]/50"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Cloud className="w-3.5 h-3.5 text-[#C88E3E]" />
                  )}
                  <span className="text-[11px] font-mono tracking-wider text-[#1C1917] dark:text-[#F7F3EC] hidden lg:inline uppercase">
                    Google Synced
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 text-[#70665A] dark:text-[#A39886] transition-transform duration-200 ${
                      dropdownOpen ? 'rotate-180 text-[#C88E3E]' : 'group-hover:text-[#1C1917] dark:group-hover:text-[#F7F3EC]'
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-[#FAF7F2] dark:bg-[#171412] border border-[#E6DFD3] dark:border-[#2D261E] shadow-2xl p-3 space-y-3 z-50 animate-fade-in text-left">
                    {/* User Identity & Active Status */}
                    <div className="pb-2.5 border-b border-[#E6DFD3] dark:border-[#2D261E] space-y-2">
                      <div className="flex items-center gap-2.5">
                        {currentUser.photoURL ? (
                          <img
                            src={currentUser.photoURL}
                            alt=""
                            className="w-8 h-8 rounded-full border border-[#C88E3E]/60 shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#EAE3D2] dark:bg-[#25201A] flex items-center justify-center text-[#C88E3E] font-mono text-xs font-semibold">
                            G
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-[#1C1917] dark:text-[#F7F3EC] truncate">
                            {currentUser.displayName || 'Google Account'}
                          </p>
                          <p className="text-[10px] text-[#70665A] dark:text-[#A39886] truncate font-mono">
                            {currentUser.email || 'Connected'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span>Drive & Photos Synced</span>
                      </div>
                    </div>

                    {/* Ingest Triggers */}
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-widest text-[#70665A] dark:text-[#A39886] font-mono px-1">
                        Cloud Ingest Triggers
                      </span>

                      {onOpenGooglePhotos && (
                        <button
                          id="btn-dropdown-google-photos"
                          onClick={() => {
                            setDropdownOpen(false);
                            onOpenGooglePhotos();
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 hover:bg-[#EAE4D9] dark:hover:bg-[#231E19] text-[#1C1917] dark:text-[#F7F3EC] transition-colors group cursor-pointer text-left"
                        >
                          <ImageIcon className="w-4 h-4 text-[#C88E3E] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="block text-xs font-mono tracking-wide">
                              Browse Google Photos
                            </span>
                            <span className="block text-[10px] text-[#70665A] dark:text-[#A39886] font-sans">
                              Import curated albums & client rolls
                            </span>
                          </div>
                        </button>
                      )}

                      {/* Studio Master Security Settings */}
                      {onOpenStudioSecurity && (
                        <button
                          id="btn-dropdown-studio-security"
                          onClick={() => {
                            setDropdownOpen(false);
                            onOpenStudioSecurity();
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 hover:bg-[#EAE4D9] dark:hover:bg-[#231E19] text-[#1C1917] dark:text-[#F7F3EC] transition-colors group cursor-pointer text-left"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="block text-xs font-mono tracking-wide">
                              Studio Owner Security
                            </span>
                            <span className="block text-[10px] text-[#70665A] dark:text-[#A39886] font-sans">
                              Manage Master Passcode & PIN
                            </span>
                          </div>
                        </button>
                      )}

                      {/* Lock Studio Desk */}
                      {onLockStudioDesk && (
                        <button
                          id="btn-dropdown-lock-desk"
                          onClick={() => {
                            setDropdownOpen(false);
                            onLockStudioDesk();
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 hover:bg-[#EAE4D9] dark:hover:bg-[#231E19] text-[#1C1917] dark:text-[#F7F3EC] transition-colors group cursor-pointer text-left"
                        >
                          <Lock className="w-4 h-4 text-[#C88E3E] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="block text-xs font-mono tracking-wide">
                              Lock Studio Desk
                            </span>
                            <span className="block text-[10px] text-[#70665A] dark:text-[#A39886] font-sans">
                              Return to Master Gate
                            </span>
                          </div>
                        </button>
                      )}
                    </div>

                    {/* Disconnect Google Account */}
                    <div className="pt-2 border-t border-[#E6DFD3] dark:border-[#2D261E]">
                      <button
                        id="btn-google-disconnect"
                        onClick={() => {
                          setDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center justify-between px-2 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        <span className="text-[10px]">Disconnect Google Account</span>
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  id="btn-google-cloud-connect"
                  onClick={() => handleGoogleAuth()}
                  disabled={isLoggingIn}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 bg-[#FAF7F0] dark:bg-[#151311] hover:bg-[#C88E3E] hover:text-white text-[#1C1917] dark:text-[#F7F3EC] border border-[#E6DFD3] dark:border-[#2D261E] hover:border-[#C88E3E] text-xs uppercase tracking-widest font-light transition-all shadow-sm group cursor-pointer"
                  title="Connect Google Workspace (Drive & Photos in one click)"
                >
                  <div className="flex items-center -space-x-1">
                    <HardDrive className="w-3.5 h-3.5 text-[#C88E3E] group-hover:text-white transition-colors" />
                    <ImageIcon className="w-3 h-3 text-[#C88E3E] group-hover:text-white transition-colors" />
                  </div>
                  <span className="hidden sm:inline">
                    {isLoggingIn ? 'Connecting...' : 'Connect Google'}
                  </span>
                  <span className="sm:hidden text-[10px] font-mono">
                    {isLoggingIn ? 'Syncing...' : 'Sync'}
                  </span>
                </button>
                <button
                  onClick={() =>
                    setAuthErrorModal({
                      type: 'google_verification',
                      domain: typeof window !== 'undefined' ? window.location.hostname : 'clients.surjomedia.com',
                      message: '',
                    })
                  }
                  className="p-1.5 text-[#70665A] dark:text-[#A39886] hover:text-[#C88E3E] dark:hover:text-[#C88E3E] border border-transparent hover:border-[#E6DFD3] dark:hover:border-[#2D261E] transition-colors cursor-pointer"
                  title="Google Sign-In & Tester Setup Guide"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Mobile Sub-bar: Segmented Role Switcher (< md) */}
      {!isStandaloneClient ? (
        <div className="md:hidden mt-2 pt-2 border-t border-[#E6DFD3]/70 dark:border-[#2D261E]/70 w-full max-w-sm mx-auto">
          <div className="grid grid-cols-2 bg-[#F3EDE2] dark:bg-[#151311] p-1 border border-[#E6DFD3] dark:border-[#2D261E]">
            <button
              id="nav-photographer-tab-mobile"
              onClick={() => onViewChange('photographer')}
              className={`flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activeView === 'photographer'
                  ? 'bg-[#C88E3E] text-white font-medium shadow-sm'
                  : 'text-[#6E6659] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC]'
              }`}
            >
              {isStudioOwnerAuthenticated ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-[#C88E3E] shrink-0" />
              )}
              <span>Studio Desk</span>
              {isStudioOwnerAuthenticated && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
              )}
            </button>
            <button
              id="nav-client-portal-tab-mobile"
              onClick={() => onViewChange('client')}
              className={`flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activeView === 'client'
                  ? 'bg-[#C88E3E] text-white font-medium shadow-sm'
                  : 'text-[#6E6659] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC]'
              }`}
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Client Vault</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="md:hidden mt-2 pt-1.5 border-t border-[#E6DFD3]/70 dark:border-[#2D261E]/70 flex items-center justify-center">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FAF7F0] dark:bg-[#151311] border border-[#C88E3E]/40 text-[10px] font-mono text-[#C88E3E] dark:text-[#D49A3D]">
            <Lock className="w-3 h-3" />
            <span className="uppercase tracking-widest font-semibold">Private Client Vault</span>
          </div>
        </div>
      )}

      {/* OAuth Domain Authorization Help Modal */}
      {authErrorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] dark:bg-[#141210] border border-[#C88E3E]/60 max-w-lg w-full p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setAuthErrorModal(null)}
              className="absolute top-4 right-4 text-[#70665A] hover:text-[#1C1917] dark:hover:text-[#F7F3EC] p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#C88E3E]/15 border border-[#C88E3E]/40 flex items-center justify-center shrink-0 text-[#C88E3E]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-[#1C1917] dark:text-[#F7F3EC] tracking-tight">
                  {authErrorModal.type === 'unauthorized_domain'
                    ? 'Google OAuth Domain Authorization Required'
                    : authErrorModal.type === 'google_verification'
                    ? 'Google Cloud Verification & Tester Setup Required'
                    : 'Google Sign-In Notice'}
                </h3>
                <p className="text-xs text-[#70665A] dark:text-[#A39886] font-mono mt-0.5">
                  Google Cloud / Firebase Project: {firebaseProjectId}
                </p>
              </div>
            </div>

            {authErrorModal.type === 'unauthorized_domain' ? (
              <div className="space-y-4 text-xs text-[#443E37] dark:text-[#D1C7BA]">
                <p>
                  Google and Firebase strictly block OAuth popups from custom domains until they are added to your project&apos;s authorized domains whitelist.
                </p>

                <div className="p-3 bg-white dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] rounded-none space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#70665A] dark:text-[#A39886]">
                    Step 1 &bull; Copy your live domain
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2 bg-[#FAF7F2] dark:bg-[#1A1816] border border-[#E6DFD3] dark:border-[#2D261E] font-mono text-xs text-[#1C1917] dark:text-[#F7F3EC]">
                    <span className="font-semibold select-all">{authErrorModal.domain}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(authErrorModal.domain);
                        setCopiedDomain(true);
                        setTimeout(() => setCopiedDomain(false), 2500);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-[#C88E3E] hover:bg-[#B37B2E] text-white text-[11px] font-mono uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      {copiedDomain ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedDomain ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] rounded-none space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#70665A] dark:text-[#A39886]">
                    Step 2 &bull; Add to Firebase Console
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-[#524B43] dark:text-[#BDB2A3]">
                    <li>Open your Firebase Authentication Settings.</li>
                    <li>Under the <strong>&quot;Authorized domains&quot;</strong> section, click <strong>&quot;Add domain&quot;</strong>.</li>
                    <li>Paste <code className="px-1.5 py-0.5 bg-black/10 dark:bg-white/10 font-mono text-[11px] text-[#C88E3E]">{authErrorModal.domain}</code> and click <strong>Save</strong>.</li>
                  </ol>
                  <div className="pt-2">
                    <a
                      href={`https://console.firebase.google.com/project/${firebaseProjectId}/authentication/settings`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#1C1917] dark:bg-[#F7F3EC] text-white dark:text-[#1C1917] hover:bg-[#C88E3E] dark:hover:bg-[#C88E3E] dark:hover:text-white text-xs font-mono tracking-wider uppercase transition-colors"
                    >
                      <span>Open Firebase Auth Settings</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <p className="text-[11px] text-[#70665A] dark:text-[#A39886] italic">
                  Note: Changes in Firebase take effect in ~10 seconds. Once saved, click &quot;Connect Google&quot; again.
                </p>
              </div>
            ) : authErrorModal.type === 'google_verification' ? (
              <div className="space-y-4 text-xs text-[#443E37] dark:text-[#D1C7BA]">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
                  <p className="font-semibold mb-1">
                    Google Error: &quot;Access blocked &bull; Error 403: access_denied&quot;
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    This occurs because your Google Cloud project is in <strong>Testing mode</strong>. Google strictly blocks any account from signing in unless that email is added to the <strong>Test Users</strong> list in your Google Cloud Console.
                  </p>
                </div>

                {/* Option 1: Add Test Users */}
                <div className="p-3 bg-white dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] rounded-none space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-[#C88E3E] font-semibold">
                      Option A &bull; Add Collaborator Email as Test User (30 Seconds)
                    </div>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-[#524B43] dark:text-[#BDB2A3]">
                    <li>Click the link below to open your Google Cloud OAuth Consent Screen.</li>
                    <li>Scroll down to the <strong>&quot;Test users&quot;</strong> section and click <strong>&quot;+ ADD USERS&quot;</strong>.</li>
                    <li>Add the email address of the person trying to log in (e.g. your friend&apos;s email):</li>
                  </ol>

                  <div className="flex items-center justify-between gap-2 p-2 bg-[#FAF7F2] dark:bg-[#1A1816] border border-[#E6DFD3] dark:border-[#2D261E] font-mono text-xs text-[#1C1917] dark:text-[#F7F3EC]">
                    <span className="font-semibold select-all">safi00alam@gmail.com</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('safi00alam@gmail.com');
                        setCopiedEmail(true);
                        setTimeout(() => setCopiedEmail(false), 2500);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-[#C88E3E] hover:bg-[#B37B2E] text-white text-[11px] font-mono uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      {copiedEmail ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedEmail ? 'Copied' : 'Copy Email'}</span>
                    </button>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2">
                    <a
                      href={`https://console.cloud.google.com/apis/credentials/consent?project=${firebaseProjectId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#C88E3E] text-white hover:bg-[#B37B2E] text-xs font-mono tracking-wider uppercase transition-colors"
                    >
                      <span>Open Google Cloud Consent Screen</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Option 2: Publish App */}
                <div className="p-3 bg-white dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] rounded-none space-y-1.5">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#70665A] dark:text-[#A39886]">
                    Option B &bull; Publish App to Production (Allows Any User)
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#524B43] dark:text-[#BDB2A3]">
                    On that same Google Cloud Consent Screen page, look under <strong>&quot;Publishing status&quot;</strong> and click <strong>&quot;PUBLISH APP&quot;</strong>. Once published, any client or team member can log in with Google without being manually added to the test list.
                  </p>
                </div>

                {/* Passcode Reminder */}
                <div className="p-2.5 bg-[#FAF7F0] dark:bg-[#1A1816] border border-[#E6DFD3] dark:border-[#2D261E] text-[11px] text-[#524B43] dark:text-[#BDB2A3]">
                  <strong>Studio Workstation Access:</strong> Remember you do not need Google Sign-In to unlock the studio dashboard! You can always enter instantly with the <strong>Master Passcode (default: 123456)</strong>.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 font-mono">
                  {authErrorModal.message}
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setAuthErrorModal({ ...authErrorModal, type: 'google_verification' })}
                    className="text-xs text-[#C88E3E] hover:underline font-mono"
                  >
                    Seeing a Google 403 / Access Blocked error? View Setup Guide &rarr;
                  </button>
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setAuthErrorModal(null)}
                className="px-4 py-2 bg-[#FAF7F2] dark:bg-[#1F1C19] border border-[#E6DFD3] dark:border-[#2D261E] hover:bg-[#EAE4D9] dark:hover:bg-[#2A2622] text-xs font-mono uppercase tracking-wider text-[#1C1917] dark:text-[#F7F3EC] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
