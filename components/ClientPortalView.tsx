'use client';

import React, { useState, useEffect } from 'react';
import { ClientGallery, PhotoItem, PhotoComment, UserRole, ROLE_DEFINITIONS } from '@/lib/types';
import { createLosslessZip, triggerLosslessDownload } from '@/lib/google-drive';
import { authenticateGalleryAccess, recordAuditLog } from '@/lib/security';
import {
  Lock,
  KeyRound,
  ShieldCheck,
  Star,
  Download,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Send,
  Camera,
  Calendar,
  MapPin,
  Eye,
  Info,
  Check,
  Maximize2,
  Heart,
  Sliders,
  Columns,
  Grid,
  Play,
  Pause,
  SplitSquareVertical,
  Shield,
  Layers,
  Sparkle,
  Search,
  Scan,
  Activity,
  AlertTriangle,
  FileCheck,
  SlidersHorizontal,
} from 'lucide-react';

interface ClientPortalViewProps {
  galleries: ClientGallery[];
  initialGalleryId?: string;
  initialPin?: string;
  initialPasscode?: string;
  isStandaloneClient?: boolean;
  onUpdateGallery: (updated: ClientGallery) => void;
  onSwitchToPhotographer?: () => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  galleries,
  initialGalleryId,
  initialPin,
  initialPasscode,
  isStandaloneClient = false,
  onUpdateGallery,
  onSwitchToPhotographer,
}) => {
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>(
    initialGalleryId || galleries[0]?.id || ''
  );
  const [enteredPin, setEnteredPin] = useState(initialPin || '');
  const [enteredPasscode, setEnteredPasscode] = useState(initialPasscode || '');
  const [userRole, setUserRole] = useState<UserRole>('primary_client');

  const targetGallery = galleries.find((g) => g.id === (initialGalleryId || galleries[0]?.id)) || galleries[0];

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Both PIN and Passcode required for initial direct authentication if passed in URL
    if (
      targetGallery &&
      initialPin &&
      initialPasscode &&
      targetGallery.accessPin === initialPin &&
      targetGallery.securityPasscode.toUpperCase() === initialPasscode.toUpperCase()
    ) {
      return true;
    }
    return false;
  });
  const [clientAuthorName, setClientAuthorName] = useState<string>(() => {
    if (
      targetGallery &&
      initialPin &&
      initialPasscode &&
      targetGallery.accessPin === initialPin &&
      targetGallery.securityPasscode.toUpperCase() === initialPasscode.toUpperCase()
    ) {
      return targetGallery.clientName;
    }
    return '';
  });
  const [authError, setAuthError] = useState<string | null>(null);

  // Gallery view state
  const [filterMode, setFilterMode] = useState<'all' | 'favorites' | 'retouch'>('all');
  const [gridColumns, setGridColumns] = useState<'2' | '3' | '4'>('3');
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<PhotoItem | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showExifDrawer, setShowExifDrawer] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isPackagingZip, setIsPackagingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [submittedSelects, setSubmittedSelects] = useState(false);

  // Advanced Master Quality & Pixel Loupe Inspection
  const [qualityTier, setQualityTier] = useState<'lossless_master' | '4k_retina' | 'web_standard'>('lossless_master');
  const [loupeMode, setLoupeMode] = useState<'off' | '100%' | '200%' | '400%'>('off');
  const [loupePos, setLoupePos] = useState<{ x: number; y: number; normX: number; normY: number }>({ x: 0, y: 0, normX: 50, normY: 50 });
  const [isSplitRetouchMode, setIsSplitRetouchMode] = useState(false);
  const [splitSliderPos, setSplitSliderPos] = useState<number>(50);

  // Fortress Anti-Theft Security Shield
  const [securityAlert, setSecurityAlert] = useState<string | null>(null);

  // Compare & Slideshow Modes
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [comparePhotoA, setComparePhotoA] = useState<PhotoItem | null>(null);
  const [comparePhotoB, setComparePhotoB] = useState<PhotoItem | null>(null);
  const [isSlideshowRunning, setIsSlideshowRunning] = useState(false);

  const activeGallery = galleries.find((g) => g.id === selectedGalleryId) || galleries[0];
  const rolePermissions = ROLE_DEFINITIONS[userRole] || ROLE_DEFINITIONS.primary_client;

  const triggerSecurityWarning = (message: string) => {
    setSecurityAlert(message);
    setTimeout(() => {
      setSecurityAlert(null);
    }, 4000);
  };

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!activeGallery) return;

    if (!enteredPin.trim()) {
      setAuthError('4-digit access PIN is required.');
      return;
    }

    if (!enteredPasscode.trim()) {
      setAuthError('Security passcode is required.');
      return;
    }

    const authResult = await authenticateGalleryAccess(activeGallery, enteredPin, enteredPasscode);

    if (authResult.success) {
      setIsAuthenticated(true);
      setUserRole(authResult.role);
      const identifier = authResult.role === 'primary_client' ? activeGallery.clientName : authResult.key?.label || 'VIP Guest';
      setClientAuthorName(identifier);

      // Record cryptographic audit log
      const audited = recordAuditLog(
        activeGallery,
        'login_success',
        authResult.role,
        identifier,
        `Client authenticated successfully with 2-Factor credentials (PIN + Passcode verified)`
      );
      onUpdateGallery(audited);
    } else {
      setAuthError(authResult.error || 'Incorrect access PIN or security passcode. Both credentials are required.');
      const audited = recordAuditLog(
        activeGallery,
        'login_failed',
        'guest_viewer',
        'Anonymous Web Client',
        'Failed authentication attempt: invalid PIN or passcode combination.'
      );
      onUpdateGallery(audited);
    }
  };

  const handleDemoAccess = (asRole: UserRole = 'primary_client') => {
    if (!activeGallery) return;
    setIsAuthenticated(true);
    setUserRole(asRole);
    const identifier = asRole === 'primary_client' ? activeGallery.clientName : 'Family VIP Guest';
    setClientAuthorName(identifier);

    const audited = recordAuditLog(
      activeGallery,
      'login_success',
      asRole,
      identifier,
      `Demo fast access verified with ${asRole} role permissions.`
    );
    onUpdateGallery(audited);
  };

  const handleToggleFavorite = React.useCallback((photoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!activeGallery || !rolePermissions.canFavorite) return;

    const updatedPhotos = activeGallery.photos.map((p) => {
      if (p.id === photoId) {
        return { ...p, isFavorite: !p.isFavorite };
      }
      return p;
    });

    const updatedGallery: ClientGallery = {
      ...activeGallery,
      photos: updatedPhotos,
      updatedAt: new Date().toISOString(),
    };

    onUpdateGallery(updatedGallery);
    if (activeLightboxPhoto && activeLightboxPhoto.id === photoId) {
      setActiveLightboxPhoto({ ...activeLightboxPhoto, isFavorite: !activeLightboxPhoto.isFavorite });
    }
  }, [activeGallery, rolePermissions.canFavorite, onUpdateGallery, activeLightboxPhoto]);

  const handleToggleRetouchSelect = (photoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!activeGallery || !rolePermissions.canSubmitOfficialSelects) return;

    const updatedPhotos = activeGallery.photos.map((p) => {
      if (p.id === photoId) {
        return { ...p, selectedForRetouch: !p.selectedForRetouch };
      }
      return p;
    });

    const updatedGallery: ClientGallery = {
      ...activeGallery,
      photos: updatedPhotos,
      updatedAt: new Date().toISOString(),
    };

    onUpdateGallery(updatedGallery);
    if (activeLightboxPhoto && activeLightboxPhoto.id === photoId) {
      setActiveLightboxPhoto({ ...activeLightboxPhoto, selectedForRetouch: !activeLightboxPhoto.selectedForRetouch });
    }
  };

  const handleAddComment = (photoId: string) => {
    if (!newCommentText.trim() || !activeGallery || !rolePermissions.canAddNotes) return;

    const newComment: PhotoComment = {
      id: `comment_${Date.now()}`,
      author: clientAuthorName || activeGallery.clientName || 'Client',
      text: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedPhotos = activeGallery.photos.map((p) => {
      if (p.id === photoId) {
        return {
          ...p,
          comments: [...p.comments, newComment],
          selectedForRetouch: true,
        };
      }
      return p;
    });

    const updatedGallery: ClientGallery = {
      ...activeGallery,
      photos: updatedPhotos,
      updatedAt: new Date().toISOString(),
    };

    const audited = recordAuditLog(
      updatedGallery,
      'note_added',
      userRole,
      clientAuthorName || 'Client',
      `Added retouch note on photo frame`
    );

    onUpdateGallery(audited);
    setNewCommentText('');

    if (activeLightboxPhoto && activeLightboxPhoto.id === photoId) {
      setActiveLightboxPhoto({
        ...activeLightboxPhoto,
        comments: [...activeLightboxPhoto.comments, newComment],
        selectedForRetouch: true,
      });
    }
  };

  const handleDownloadSinglePhoto = (photo: PhotoItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!rolePermissions.canDownloadSingle) return;

    triggerLosslessDownload(photo);

    if (activeGallery) {
      const audited = recordAuditLog(
        activeGallery,
        'download_single',
        userRole,
        clientAuthorName || 'Client',
        `Downloaded original master file: ${photo.originalFileName}`
      );
      onUpdateGallery(audited);
    }
  };

  const handleBatchZipDownload = async (onlyFavorites = false) => {
    if (!activeGallery || !rolePermissions.canDownloadZip) return;
    try {
      setIsPackagingZip(true);
      const targetPhotos = onlyFavorites
        ? activeGallery.photos.filter((p) => p.isFavorite)
        : activeGallery.photos;

      const blob = await createLosslessZip(
        targetPhotos,
        `${activeGallery.clientName}_Lossless_Selects`,
        undefined,
        (percent) => setZipProgress(percent)
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeGallery.clientName.replace(/\s+/g, '_')}_Master_Lossless.zip`;
      a.click();

      const audited = recordAuditLog(
        activeGallery,
        'download_zip',
        userRole,
        clientAuthorName || 'Client',
        `Exported full lossless ZIP master archive (${targetPhotos.length} photos)`
      );
      onUpdateGallery(audited);
    } catch (err) {
      console.error('Error generating zip:', err);
    } finally {
      setIsPackagingZip(false);
      setZipProgress(0);
    }
  };

  const handleSubmitSelectionsToPhotographer = () => {
    if (!activeGallery || !rolePermissions.canSubmitOfficialSelects) return;
    const count = activeGallery.photos.filter((p) => p.isFavorite || p.selectedForRetouch).length;

    const updated: ClientGallery = {
      ...activeGallery,
      clientSelectionSubmitted: true,
      clientSelectionSubmittedAt: new Date().toISOString(),
      status: 'proofing',
      updatedAt: new Date().toISOString(),
    };

    const audited = recordAuditLog(
      updated,
      'selects_submitted',
      userRole,
      clientAuthorName || 'Client',
      `Submitted ${count} official selects to photographer for final album & print production.`
    );

    onUpdateGallery(audited);
    setSubmittedSelects(true);
    setTimeout(() => setSubmittedSelects(false), 5000);
  };

  const filteredPhotos = (activeGallery?.photos || []).filter((p) => {
    if (filterMode === 'favorites') return p.isFavorite;
    if (filterMode === 'retouch') return p.selectedForRetouch;
    return true;
  });

  const favoritesCount = (activeGallery?.photos || []).filter((p) => p.isFavorite).length;
  const retouchCount = (activeGallery?.photos || []).filter((p) => p.selectedForRetouch).length;

  // Slideshow timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSlideshowRunning && filteredPhotos.length > 0) {
      timer = setInterval(() => {
        setLightboxIndex((prev) => {
          const next = (prev + 1) % filteredPhotos.length;
          setActiveLightboxPhoto(filteredPhotos[next]);
          return next;
        });
      }, 4000);
    }
    return () => clearInterval(timer);
  }, [isSlideshowRunning, filteredPhotos]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeLightboxPhoto) return;
      if (e.key === 'ArrowRight') {
        const nextIdx = (lightboxIndex + 1) % filteredPhotos.length;
        setLightboxIndex(nextIdx);
        setActiveLightboxPhoto(filteredPhotos[nextIdx]);
        setIsZoomed(false);
      } else if (e.key === 'ArrowLeft') {
        const prevIdx = (lightboxIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
        setLightboxIndex(prevIdx);
        setActiveLightboxPhoto(filteredPhotos[prevIdx]);
        setIsZoomed(false);
      } else if (e.key === 'Escape') {
        setActiveLightboxPhoto(null);
        setIsZoomed(false);
      } else if (e.key === 'f' || e.key === 'F') {
        handleToggleFavorite(activeLightboxPhoto.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxPhoto, lightboxIndex, filteredPhotos, handleToggleFavorite]);

  // If No Gallery Exists in the system yet, show Elegant Awaiting Archive state
  if (!activeGallery) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] max-w-md w-full p-8 sm:p-10 shadow-xl space-y-6 text-center backdrop-blur-xl relative overflow-hidden">
          <div className="w-12 h-12 rounded-full border border-[#C88E3E] bg-[#C88E3E]/10 dark:bg-[#C88E3E]/20 flex items-center justify-center mx-auto mb-2 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6 text-[#C88E3E]">
              <circle cx="12" cy="12" r="4" strokeWidth="1.5" stroke="currentColor" fill="currentColor" fillOpacity="0.3" />
              <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-[#C88E3E] dark:text-[#D49A3D] font-semibold block">
              SURJO MEDIA // CLIENT PORTAL
            </span>
            <h1 className="text-2xl sm:text-3xl font-light text-[#1C1917] dark:text-[#F7F3EC] font-serif leading-tight">
              Archive Awaiting Delivery
            </h1>
            <p className="text-xs text-[#70665A] dark:text-[#A39886] leading-relaxed font-sans max-w-xs mx-auto">
              No client photography collections have been published yet. If you are expecting your photo or film delivery, please contact your photographer for your private direct link.
            </p>
          </div>

          {onSwitchToPhotographer && !isStandaloneClient && (
            <button
              onClick={onSwitchToPhotographer}
              className="px-6 py-2.5 bg-[#C88E3E] hover:bg-[#B77D2F] text-white text-xs uppercase tracking-widest font-mono font-medium transition-all shadow-sm"
            >
              Studio Desk Login
            </button>
          )}
        </div>
      </div>
    );
  }

  // If Not Authenticated, show Luxury Surjo Media Security Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] max-w-md w-full p-8 sm:p-10 shadow-2xl space-y-6 text-center backdrop-blur-xl relative overflow-hidden">
          {/* Surjo Sun Emblem */}
          <div className="w-12 h-12 rounded-full border border-[#C88E3E] bg-[#C88E3E]/10 dark:bg-[#C88E3E]/20 flex items-center justify-center mx-auto mb-2 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6 text-[#C88E3E]">
              <circle cx="12" cy="12" r="4" strokeWidth="1.5" stroke="currentColor" fill="currentColor" fillOpacity="0.3" />
              <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-[#C88E3E] dark:text-[#D49A3D] font-semibold block">
              {isStandaloneClient ? 'SURJO MEDIA // PRIVATE CLIENT VAULT' : 'SURJO MEDIA // CLIENT GATE'}
            </span>
            <h1 className="text-3xl sm:text-4xl font-light text-[#1C1917] dark:text-[#F7F3EC] font-serif leading-tight">
              {activeGallery?.title || 'Private Client Vault'}
            </h1>
            <p className="text-xs text-[#70665A] dark:text-[#A39886] leading-relaxed font-sans max-w-xs mx-auto">
              {isStandaloneClient
                ? `Welcome, ${activeGallery?.clientName || 'Client'}. Please enter both your 4-digit PIN and security passcode to unlock your encrypted master vault.`
                : 'Two-factor credential authentication required: enter both the 4-digit PIN and security passcode to unlock uncompressed master files.'}
            </p>
          </div>

          {/* Security Protocol Mini Bar */}
          <div className="bg-[#FAF7F0] dark:bg-[#1E1B17] p-4 border border-[#E6DFD3] dark:border-[#2D261E] text-left">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] uppercase tracking-widest text-[#70665A] dark:text-[#A39886] font-mono">
                {isStandaloneClient ? 'Client Vault Protection' : '2-Factor Vault Protection'}
              </span>
              <span className="text-[9px] text-[#C88E3E] dark:text-[#D49A3D] font-mono font-semibold">
                PIN + PASSCODE REQUIRED
              </span>
            </div>
            <div className="h-[3px] w-full bg-[#E6DFD3] dark:bg-[#2D261E] relative overflow-hidden">
              <div className="absolute top-0 left-0 h-full w-3/4 bg-[#C88E3E]"></div>
            </div>
            <p className="text-[9px] mt-2 uppercase tracking-wider text-[#70665A] dark:text-[#A39886] font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C88E3E]"></span>
              {isStandaloneClient ? `Dual-Layer Security: ${activeGallery?.clientName || 'Private Archive'}` : 'Dual-Layer Security Barrier Active'}
            </p>
          </div>

          {/* Gallery Switcher for Multi-Client Demo (Hidden in Standalone Client Mode) */}
          {!isStandaloneClient && galleries.length > 1 && (
            <div className="text-left space-y-1">
              <label className="text-[9px] text-[#70665A] dark:text-[#A39886] uppercase font-mono tracking-widest">
                Select Archive
              </label>
              <select
                value={selectedGalleryId}
                onChange={(e) => {
                  setSelectedGalleryId(e.target.value);
                  setAuthError(null);
                }}
                className="w-full bg-[#FAF7F0] dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] text-[#1C1917] dark:text-[#F7F3EC] text-xs px-3 py-2.5 focus:outline-none font-mono"
              >
                {galleries.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.clientName} — {g.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <form onSubmit={handleClientLogin} className="space-y-4 text-left">
            <div className="space-y-3">
              {/* Step 1: 4-Digit Access PIN */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-[#70665A] dark:text-[#A39886] flex items-center gap-1.5">
                    <KeyRound className="w-3 h-3 text-[#C88E3E]" />
                    <span>1. Access PIN (4 Digits)</span>
                  </label>
                  <span className="text-[9px] font-mono uppercase text-rose-600 dark:text-rose-400">Required</span>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 4829"
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  className="w-full bg-[#FAF7F0] dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] px-4 py-2.5 text-xs font-mono tracking-[0.25em] text-[#1C1917] dark:text-[#F7F3EC] placeholder-[#70665A]/40 dark:placeholder-[#A39886]/40 focus:outline-none focus:border-[#C88E3E]"
                />
              </div>

              {/* Step 2: Security Passcode */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-[#70665A] dark:text-[#A39886] flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-[#C88E3E]" />
                    <span>2. Security Passcode</span>
                  </label>
                  <span className="text-[9px] font-mono uppercase text-rose-600 dark:text-rose-400">Required</span>
                </div>
                <input
                  type="password"
                  placeholder="e.g. COMO2026"
                  value={enteredPasscode}
                  onChange={(e) => setEnteredPasscode(e.target.value)}
                  className="w-full bg-[#FAF7F0] dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] px-4 py-2.5 text-xs text-[#1C1917] dark:text-[#F7F3EC] placeholder-[#70665A]/40 dark:placeholder-[#A39886]/40 focus:outline-none focus:border-[#C88E3E] font-mono tracking-wider"
                />
              </div>
            </div>

            {authError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-mono p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-[#C88E3E] hover:bg-[#B77D2F] text-white text-xs uppercase tracking-[0.25em] font-medium transition-all shadow-md font-sans flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Both & Enter Vault</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Authenticated View
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Client Vault Hero Header */}
      <div className="relative border border-[#E6DFD3] dark:border-[#2D261E] bg-white dark:bg-[#151311] overflow-hidden shadow-sm">
        {/* Cover Photo Backdrop */}
        {activeGallery.coverPhotoUrl && (
          <div className="absolute inset-0 opacity-10 dark:opacity-15 overflow-hidden">
            <img
              src={activeGallery.coverPhotoUrl}
              alt="Cover"
              className="w-full h-full object-cover scale-105 filter blur-sm"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        <div className="relative p-6 sm:p-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl text-left">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-2.5 py-0.5 text-[9px] uppercase font-mono tracking-widest bg-[#C88E3E] text-white font-semibold shadow-sm">
                  {rolePermissions.badge} ACCESS
                </span>
                <span className="px-2.5 py-0.5 text-[9px] uppercase font-mono tracking-widest bg-[#FAF7F0] dark:bg-[#1E1B17] text-[#1C1917] dark:text-[#F7F3EC] border border-[#E6DFD3] dark:border-[#2D261E]">
                  {activeGallery.shootType}
                </span>
                <span className="text-[10px] font-mono text-[#C88E3E] dark:text-[#D49A3D] flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Authenticated: {clientAuthorName}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-light text-[#1C1917] dark:text-[#F7F3EC] font-serif">
                {activeGallery.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#70665A] dark:text-[#A39886]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#C88E3E]" />
                  {activeGallery.shootDate}
                </span>
                {activeGallery.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#C88E3E]" />
                    {activeGallery.location}
                  </span>
                )}
                <span>• {activeGallery.photos.length} High-Resolution Master Frames</span>
              </div>

              {activeGallery.welcomeMessage && (
                <p className="text-xs text-[#70665A] dark:text-[#A39886] font-serif italic pt-2 max-w-2xl">
                  &ldquo;{activeGallery.welcomeMessage}&rdquo;
                </p>
              )}
            </div>

            {/* Client Action Controls */}
            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
              {rolePermissions.canSubmitOfficialSelects && (
                <button
                  onClick={handleSubmitSelectionsToPhotographer}
                  className="px-5 py-2.5 bg-[#C88E3E] hover:bg-[#B77D2F] text-white text-xs font-mono uppercase tracking-widest font-semibold transition-all flex items-center gap-2 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Selections ({favoritesCount})</span>
                </button>
              )}

              {rolePermissions.canDownloadZip && (
                <button
                  onClick={() => handleBatchZipDownload(false)}
                  disabled={isPackagingZip}
                  className="px-4 py-2.5 bg-[#FAF7F0] dark:bg-[#1E1B17] hover:bg-[#C88E3E] hover:text-white dark:hover:bg-[#C88E3E] border border-[#E6DFD3] dark:border-[#2D261E] text-[#1C1917] dark:text-[#F7F3EC] text-xs font-mono uppercase tracking-widest transition-all flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-[#C88E3E]" />
                  <span>{isPackagingZip ? `Packaging ZIP (${zipProgress}%)...` : 'Download All RAW/ZIP'}</span>
                </button>
              )}

              <button
                onClick={() => setIsCompareMode(!isCompareMode)}
                className={`px-3 py-2.5 border text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  isCompareMode
                    ? 'bg-[#C88E3E] text-white border-[#C88E3E]'
                    : 'bg-[#FAF7F0] dark:bg-[#1E1B17] border-[#E6DFD3] dark:border-[#2D261E] text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC]'
                }`}
                title="Compare Two Photographs Side by Side"
              >
                <SplitSquareVertical className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">A/B Compare</span>
              </button>

              {/* Lock Vault button */}
              <button
                onClick={() => {
                  setIsAuthenticated(false);
                  setEnteredPin('');
                  setEnteredPasscode('');
                  setAuthError(null);
                }}
                className="px-3 py-2.5 bg-[#FAF7F0] dark:bg-[#1E1B17] hover:bg-rose-900/40 hover:text-rose-400 hover:border-rose-800 border border-[#E6DFD3] dark:border-[#2D261E] text-[#70665A] dark:text-[#A39886] text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5"
                title="Securely Lock Client Vault"
              >
                <Lock className="w-3.5 h-3.5 text-[#C88E3E]" />
                <span>Lock Vault</span>
              </button>
            </div>
          </div>

          {/* Submission Success Notice */}
          {submittedSelects && (
            <div className="p-3 bg-[#C88E3E]/10 border border-[#C88E3E]/40 flex items-center gap-2 text-xs font-mono text-[#C88E3E] dark:text-[#D49A3D] animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Official selects have been submitted to the studio. Your photographer will start album retouching!</span>
            </div>
          )}
        </div>
      </div>

      {/* Security Toast Notification */}
      {securityAlert && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-[#151311] border border-[#C88E3E] text-white shadow-2xl flex items-center gap-3 animate-fade-in max-w-md">
          <Shield className="w-5 h-5 text-[#C88E3E] shrink-0 animate-pulse" />
          <div className="text-xs font-mono space-y-0.5 text-left">
            <p className="font-semibold text-[#C88E3E] uppercase tracking-wider">Fortress Protection Active</p>
            <p className="text-[#A39886]">{securityAlert}</p>
          </div>
          <button onClick={() => setSecurityAlert(null)} className="text-white/40 hover:text-white ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Side-by-Side Comparison Drawer if active */}
      {isCompareMode && (
        <div className="bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] p-6 space-y-4 animate-fade-in shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD3] dark:border-[#2D261E]">
            <div className="flex items-center gap-2">
              <SplitSquareVertical className="w-4 h-4 text-[#C88E3E]" />
              <h3 className="text-sm uppercase font-mono tracking-widest text-[#1C1917] dark:text-[#F7F3EC]">
                Synchronized Side-by-Side Frame Comparison
              </h3>
            </div>
            <button
              onClick={() => setIsCompareMode(false)}
              className="text-xs font-mono text-[#70665A] dark:text-[#A39886] hover:text-[#C88E3E]"
            >
              [EXIT COMPARISON]
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Frame A */}
            <div className="space-y-2 bg-[#FAF7F0] dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] p-3">
              <div className="flex items-center justify-between text-xs font-mono text-[#70665A] dark:text-[#A39886]">
                <span>FRAME A (Select below)</span>
                {comparePhotoA && <span className="text-[#C88E3E]">{comparePhotoA.name}</span>}
              </div>
              <div
                className="aspect-[4/3] bg-black/90 flex items-center justify-center overflow-hidden relative select-none"
                onContextMenu={(e) => {
                  e.preventDefault();
                  triggerSecurityWarning('Right-click image extraction is restricted by Studio Vault Protection.');
                }}
              >
                {comparePhotoA ? (
                  <img
                    src={comparePhotoA.highResUrl}
                    alt="Frame A"
                    className="w-full h-full object-contain pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <p className="text-xs font-mono text-white/40">Click a photo in the gallery to set Frame A</p>
                )}
              </div>
            </div>

            {/* Frame B */}
            <div className="space-y-2 bg-[#FAF7F0] dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] p-3">
              <div className="flex items-center justify-between text-xs font-mono text-[#70665A] dark:text-[#A39886]">
                <span>FRAME B (Select below)</span>
                {comparePhotoB && <span className="text-[#C88E3E]">{comparePhotoB.name}</span>}
              </div>
              <div
                className="aspect-[4/3] bg-black/90 flex items-center justify-center overflow-hidden relative select-none"
                onContextMenu={(e) => {
                  e.preventDefault();
                  triggerSecurityWarning('Right-click image extraction is restricted by Studio Vault Protection.');
                }}
              >
                {comparePhotoB ? (
                  <img
                    src={comparePhotoB.highResUrl}
                    alt="Frame B"
                    className="w-full h-full object-contain pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <p className="text-xs font-mono text-white/40">Click a photo in the gallery to set Frame B</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Master Quality Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#E6DFD3] dark:border-[#2D261E]">
        <div className="flex items-center gap-1 bg-white dark:bg-[#151311] p-1 border border-[#E6DFD3] dark:border-[#2D261E] text-xs font-mono shadow-sm">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 uppercase tracking-widest transition-colors ${
              filterMode === 'all'
                ? 'bg-[#C88E3E] text-white font-medium shadow-sm'
                : 'text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC]'
            }`}
          >
            All Frames ({activeGallery.photos.length})
          </button>
          <button
            onClick={() => setFilterMode('favorites')}
            className={`px-3 py-1 uppercase tracking-widest transition-colors flex items-center gap-1.5 ${
              filterMode === 'favorites'
                ? 'bg-[#C88E3E] text-white font-medium shadow-sm'
                : 'text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC]'
            }`}
          >
            <Star className="w-3 h-3" />
            <span>Favorites ({favoritesCount})</span>
          </button>
          <button
            onClick={() => setFilterMode('retouch')}
            className={`px-3 py-1 uppercase tracking-widest transition-colors flex items-center gap-1.5 ${
              filterMode === 'retouch'
                ? 'bg-[#C88E3E] text-white font-medium shadow-sm'
                : 'text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC]'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Proofing Notes ({retouchCount})</span>
          </button>
        </div>

        {/* Quality Tier & Grid Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quality Tier Badge */}
          <div className="hidden sm:flex items-center gap-1 bg-[#FAF7F0] dark:bg-[#1E1B17] px-2.5 py-1 border border-[#E6DFD3] dark:border-[#2D261E] text-[10px] font-mono text-[#C88E3E]">
            <Sparkles className="w-3 h-3 text-[#C88E3E]" />
            <span className="uppercase tracking-wider font-semibold">Lossless Master Source</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#70665A] dark:text-[#A39886] uppercase tracking-widest hidden sm:inline">
              Grid:
            </span>
            <div className="flex items-center bg-white dark:bg-[#151311] p-0.5 border border-[#E6DFD3] dark:border-[#2D261E] text-xs font-mono shadow-sm">
              <button
                onClick={() => setGridColumns('2')}
                className={`px-2 py-0.5 ${gridColumns === '2' ? 'bg-[#C88E3E] text-white' : 'text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC]'}`}
              >
                2-Col
              </button>
              <button
                onClick={() => setGridColumns('3')}
                className={`px-2 py-0.5 ${gridColumns === '3' ? 'bg-[#C88E3E] text-white' : 'text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC]'}`}
              >
                3-Col
              </button>
              <button
                onClick={() => setGridColumns('4')}
                className={`px-2 py-0.5 ${gridColumns === '4' ? 'bg-[#C88E3E] text-white' : 'text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC]'}`}
              >
                4-Col
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Gallery Photographs Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] p-16 text-center space-y-3 shadow-sm">
          <Star className="w-10 h-10 text-[#C88E3E]/40 mx-auto" />
          <h4 className="text-base font-serif text-[#1C1917] dark:text-[#F7F3EC]">No photographs in this filter</h4>
          <p className="text-xs text-[#70665A] dark:text-[#A39886] font-mono">
            Star photos to populate your favorites collection for fine art printing.
          </p>
        </div>
      ) : (
        <div
          className={`grid gap-4 sm:gap-6 ${
            gridColumns === '2'
              ? 'grid-cols-1 sm:grid-cols-2'
              : gridColumns === '4'
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {filteredPhotos.map((photo, index) => {
            const hasWatermark = activeGallery.isWatermarkActive || !rolePermissions.canViewUnwatermarked;
            const watermarkStyle = activeGallery.watermarkStyle || 'diagonal_grid';
            const watermarkTextDisplay = activeGallery.watermarkText || '© SURJO MEDIA — PROOF';

            return (
              <div
                key={photo.id}
                onClick={() => {
                  if (isCompareMode) {
                    if (!comparePhotoA) setComparePhotoA(photo);
                    else setComparePhotoB(photo);
                  } else {
                    setActiveLightboxPhoto(photo);
                    setLightboxIndex(index);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  triggerSecurityWarning('Right-click copy protection active. Use official client download controls.');
                }}
                className="group relative bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] hover:border-[#C88E3E] dark:hover:border-[#D49A3D] overflow-hidden cursor-pointer transition-all flex flex-col shadow-sm select-none"
              >
                {/* Photo Aspect Container */}
                <div className="relative aspect-[3/2] overflow-hidden bg-black/90">
                  <img
                    src={photo.thumbnailUrl}
                    alt={photo.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
                    referrerPolicy="no-referrer"
                  />

                  {/* Dynamic Watermark Engine Overlay */}
                  {hasWatermark && (
                    <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center overflow-hidden">
                      {watermarkStyle === 'diagonal_grid' && (
                        <div className="w-full h-full opacity-35 flex flex-col justify-around rotate-[-18deg] scale-125">
                          <div className="flex justify-around whitespace-nowrap text-[11px] font-mono tracking-[0.3em] text-white">
                            <span>{watermarkTextDisplay}</span>
                            <span>{watermarkTextDisplay}</span>
                          </div>
                          <div className="flex justify-around whitespace-nowrap text-[11px] font-mono tracking-[0.3em] text-white">
                            <span>{watermarkTextDisplay}</span>
                            <span>{watermarkTextDisplay}</span>
                          </div>
                          <div className="flex justify-around whitespace-nowrap text-[11px] font-mono tracking-[0.3em] text-white">
                            <span>{watermarkTextDisplay}</span>
                            <span>{watermarkTextDisplay}</span>
                          </div>
                        </div>
                      )}

                      {watermarkStyle === 'center_crest' && (
                        <div className="opacity-45 p-6 border-2 border-white/40 flex flex-col items-center justify-center rotate-[-8deg] bg-black/20 backdrop-blur-[1px]">
                          <Shield className="w-8 h-8 text-white mb-1" />
                          <span className="text-xs uppercase font-mono tracking-[0.25em] text-white font-bold text-center">
                            {watermarkTextDisplay}
                          </span>
                        </div>
                      )}

                      {watermarkStyle === 'forensic_client_stamp' && (
                        <div className="w-full h-full opacity-30 flex flex-col justify-between p-4 rotate-[-12deg] scale-110 text-[9px] font-mono text-white">
                          <div className="truncate">
                            {`CONFIDENTIAL PROOF // ${clientAuthorName || 'CLIENT VAULT'} // ${activeGallery.id}`}
                          </div>
                          <div className="text-center font-bold tracking-widest">{watermarkTextDisplay}</div>
                          <div className="truncate text-right">ENCRYPTED MASTER TOKEN: SHA-256 VERIFIED</div>
                        </div>
                      )}

                      {watermarkStyle === 'corner_signature' && (
                        <div className="absolute bottom-3 right-3 opacity-60 bg-black/60 px-2.5 py-1 text-[9px] font-mono text-white border border-white/20">
                          {watermarkTextDisplay}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Top Action Overlay Badges */}
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10">
                    {/* Star Favorite Button */}
                    {rolePermissions.canFavorite && (
                      <button
                        onClick={(e) => handleToggleFavorite(photo.id, e)}
                        className={`p-2 transition-all backdrop-blur-md border ${
                          photo.isFavorite
                            ? 'bg-[#C88E3E] text-white border-[#C88E3E] shadow-md'
                            : 'bg-black/60 text-white/80 hover:text-white border-white/20 hover:border-[#C88E3E]'
                        }`}
                        title="Star as official pick"
                      >
                        <Star className={`w-3.5 h-3.5 ${photo.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                    )}

                    {/* Quality badge & Single Download Quick Action */}
                    <div className="flex items-center gap-1.5">
                      {photo.bitDepth && (
                        <span className="hidden sm:inline-block px-1.5 py-0.5 bg-black/60 backdrop-blur-md border border-white/20 text-[8px] font-mono text-[#C88E3E] font-semibold">
                          RAW
                        </span>
                      )}

                      {rolePermissions.canDownloadSingle && (
                        <button
                          onClick={(e) => handleDownloadSinglePhoto(photo, e)}
                          className="p-2 bg-black/60 hover:bg-[#C88E3E] text-white border border-white/20 backdrop-blur-md transition-all"
                          title="Download High-Res Original"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Bottom Meta */}
                <div className="p-3.5 bg-[#FAF7F0] dark:bg-[#1E1B17] border-t border-[#E6DFD3] dark:border-[#2D261E] flex items-center justify-between gap-2 text-xs font-mono">
                  <div className="min-w-0 text-left">
                    <p className="text-[#1C1917] dark:text-[#F7F3EC] font-serif font-normal truncate">{photo.name}</p>
                    <p className="text-[10px] text-[#70665A] dark:text-[#A39886] mt-0.5 truncate">
                      {photo.exif?.cameraModel || photo.originalFileName}
                    </p>
                  </div>

                  {photo.comments.length > 0 && (
                    <span className="px-2 py-0.5 bg-[#C88E3E]/15 text-[#C88E3E] dark:text-[#D49A3D] border border-[#C88E3E]/30 text-[10px] flex items-center gap-1 shrink-0 font-medium">
                      <MessageSquare className="w-3 h-3" />
                      {photo.comments.length}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Master Lightbox with Focus Loupe & Optical HUD */}
      {activeLightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in select-none"
          onContextMenu={(e) => {
            e.preventDefault();
            triggerSecurityWarning('Image context saving is restricted by Studio Master Fortress Security.');
          }}
        >
          {/* Lightbox Top Control Bar */}
          <div className="absolute top-0 inset-x-0 p-4 sm:p-6 flex items-center justify-between bg-gradient-to-b from-black/90 to-transparent z-30">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-[#C88E3E] uppercase tracking-widest font-semibold">
                {lightboxIndex + 1} / {filteredPhotos.length}
              </span>
              <span className="text-white/20">|</span>
              <span className="text-xs font-serif text-white truncate max-w-xs">
                {activeLightboxPhoto.name}
              </span>
              {activeLightboxPhoto.exif?.dimensions && (
                <span className="hidden md:inline-block text-[9px] font-mono px-2 py-0.5 bg-white/10 text-white/80 border border-white/15">
                  {activeLightboxPhoto.exif.dimensions.width} × {activeLightboxPhoto.exif.dimensions.height} px
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Focus Loupe Mode Switcher */}
              <div className="hidden sm:flex items-center bg-black/60 border border-white/20 p-0.5 text-[10px] font-mono text-white">
                <span className="px-2 py-1 text-white/50 flex items-center gap-1">
                  <Scan className="w-3 h-3 text-[#C88E3E]" /> Loupe:
                </span>
                {(['off', '100%', '200%', '400%'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setLoupeMode(mode);
                      setIsZoomed(false);
                    }}
                    className={`px-2 py-0.5 uppercase tracking-wider transition-colors ${
                      loupeMode === mode ? 'bg-[#C88E3E] text-white font-semibold' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* A/B Retouch Split Slider Toggle */}
              {activeLightboxPhoto.rawComparisonUrl && (
                <button
                  onClick={() => setIsSplitRetouchMode(!isSplitRetouchMode)}
                  className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                    isSplitRetouchMode
                      ? 'bg-[#C88E3E] text-white border-[#C88E3E]'
                      : 'bg-black/60 border-white/20 text-white hover:border-[#C88E3E]'
                  }`}
                  title="Toggle A/B Retouch Split Comparison"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">A/B Split</span>
                </button>
              )}

              {rolePermissions.canFavorite && (
                <button
                  onClick={() => handleToggleFavorite(activeLightboxPhoto.id)}
                  className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                    activeLightboxPhoto.isFavorite
                      ? 'bg-[#C88E3E] text-white border-[#C88E3E]'
                      : 'bg-black/60 border-white/20 text-white hover:border-[#C88E3E]'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${activeLightboxPhoto.isFavorite ? 'fill-current' : ''}`} />
                  <span className="hidden sm:inline">Favorite</span>
                </button>
              )}

              {rolePermissions.canDownloadSingle && (
                <button
                  onClick={() => handleDownloadSinglePhoto(activeLightboxPhoto)}
                  className="p-2 bg-black/60 border border-white/20 hover:border-[#C88E3E] text-white transition-all"
                  title="Download Lossless Master File"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => setShowExifDrawer(!showExifDrawer)}
                className={`p-2 border transition-all ${
                  showExifDrawer ? 'bg-[#C88E3E] text-white border-[#C88E3E]' : 'bg-black/60 border-white/20 text-white'
                }`}
                title="View Camera EXIF & Optics"
              >
                <Info className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setActiveLightboxPhoto(null);
                  setIsZoomed(false);
                  setLoupeMode('off');
                }}
                className="p-2 text-white/50 hover:text-white"
                title="Close Lightbox (Esc)"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={() => {
              const prev = (lightboxIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
              setLightboxIndex(prev);
              setActiveLightboxPhoto(filteredPhotos[prev]);
              setIsZoomed(false);
            }}
            className="absolute left-4 z-30 p-3 bg-black/60 hover:bg-[#C88E3E] hover:text-white border border-white/15 text-white transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={() => {
              const next = (lightboxIndex + 1) % filteredPhotos.length;
              setLightboxIndex(next);
              setActiveLightboxPhoto(filteredPhotos[next]);
              setIsZoomed(false);
            }}
            className="absolute right-4 z-30 p-3 bg-black/60 hover:bg-[#C88E3E] hover:text-white border border-white/15 text-white transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Main Photo Centerpiece with Loupe & A/B Split */}
          <div
            className="relative max-w-6xl max-h-[82vh] p-4 flex items-center justify-center overflow-hidden cursor-crosshair"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const normX = Math.max(0, Math.min(100, (x / rect.width) * 100));
              const normY = Math.max(0, Math.min(100, (y / rect.height) * 100));
              setLoupePos({ x, y, normX, normY });
            }}
          >
            {/* Split Comparison View */}
            {isSplitRetouchMode && activeLightboxPhoto.rawComparisonUrl ? (
              <div className="relative max-w-full max-h-[80vh] flex items-center justify-center overflow-hidden select-none">
                {/* Background: Master Retouched */}
                <img
                  src={activeLightboxPhoto.highResUrl}
                  alt="Master Retouched"
                  className="max-w-full max-h-[80vh] object-contain pointer-events-none"
                  referrerPolicy="no-referrer"
                />

                {/* Foreground: RAW SOOC with clip-path */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - splitSliderPos}% 0 0)` }}
                >
                  <img
                    src={activeLightboxPhoto.rawComparisonUrl}
                    alt="RAW SOOC"
                    className="w-full h-full object-contain pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Split Divider Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-[#C88E3E] z-20 pointer-events-none shadow-[0_0_10px_rgba(200,142,62,0.8)]"
                  style={{ left: `${splitSliderPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#C88E3E] text-white flex items-center justify-center text-[10px] font-bold shadow-lg">
                    ↔
                  </div>
                </div>

                {/* Split Badges */}
                <span className="absolute top-4 left-4 z-20 px-2.5 py-1 bg-black/70 text-[9px] font-mono uppercase tracking-widest text-white border border-white/20">
                  RAW SOOC (Straight-out-of-camera)
                </span>
                <span className="absolute top-4 right-4 z-20 px-2.5 py-1 bg-[#C88E3E]/90 text-[9px] font-mono uppercase tracking-widest text-white border border-[#C88E3E] font-semibold">
                  Master Color Grade
                </span>

                {/* Slider Input Bar */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={splitSliderPos}
                  onChange={(e) => setSplitSliderPos(Number(e.target.value))}
                  className="absolute bottom-4 inset-x-8 z-30 accent-[#C88E3E] opacity-70 hover:opacity-100 transition-opacity"
                />
              </div>
            ) : (
              <div className="relative">
                <img
                  src={activeLightboxPhoto.highResUrl}
                  alt={activeLightboxPhoto.name}
                  onClick={() => {
                    if (loupeMode === 'off') {
                      setIsZoomed(!isZoomed);
                    }
                  }}
                  className={`max-w-full max-h-[80vh] object-contain transition-all duration-300 pointer-events-none select-none ${
                    isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                  }`}
                  referrerPolicy="no-referrer"
                />

                {/* Interactive Optical Loupe Glass */}
                {loupeMode !== 'off' && (
                  <div
                    className="absolute pointer-events-none rounded-full border-2 border-[#C88E3E] shadow-2xl overflow-hidden bg-black z-30"
                    style={{
                      width: 180,
                      height: 180,
                      left: loupePos.x - 90,
                      top: loupePos.y - 90,
                      backgroundImage: `url(${activeLightboxPhoto.highResUrl})`,
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: loupeMode === '100%' ? '300%' : loupeMode === '200%' ? '500%' : '800%',
                      backgroundPosition: `${loupePos.normX}% ${loupePos.normY}%`,
                    }}
                  >
                    {/* Crosshair focus indicator */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
                      <div className="w-full h-[1px] bg-[#C88E3E]"></div>
                      <div className="absolute h-full w-[1px] bg-[#C88E3E]"></div>
                    </div>
                    <span className="absolute bottom-1 right-2 text-[8px] font-mono text-[#C88E3E] font-bold bg-black/80 px-1">
                      {loupeMode} FOCUS
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Floating Optical Sensor HUD Bar at Bottom */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-[#151311]/90 border border-white/15 backdrop-blur-md flex items-center gap-4 text-[10px] font-mono text-white/90 shadow-2xl">
            {activeLightboxPhoto.exif?.cameraModel && (
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#C88E3E]" />
                <span className="text-white font-medium">{activeLightboxPhoto.exif.cameraModel}</span>
              </span>
            )}
            {activeLightboxPhoto.exif?.aperture && (
              <span className="text-[#C88E3E]">{activeLightboxPhoto.exif.aperture}</span>
            )}
            {activeLightboxPhoto.exif?.shutterSpeed && <span>{activeLightboxPhoto.exif.shutterSpeed}</span>}
            {activeLightboxPhoto.exif?.iso && <span>{activeLightboxPhoto.exif.iso}</span>}
            <span className="text-white/30 hidden sm:inline">|</span>
            <span className="text-emerald-400 font-semibold hidden sm:inline">
              {activeLightboxPhoto.colorSpace || 'P3 Wide Color'}
            </span>
            <span className="text-white/50 hidden md:inline">
              {activeLightboxPhoto.bitDepth || '14-Bit Lossless'}
            </span>
          </div>

          {/* Side EXIF & Proofing Drawer */}
          {showExifDrawer && (
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#151311]/98 border-l border-white/15 p-6 pt-20 overflow-y-auto space-y-6 z-30 animate-fade-in text-left shadow-2xl">
              <div className="space-y-1 pb-3 border-b border-white/10">
                <h4 className="text-base font-serif text-white">{activeLightboxPhoto.name}</h4>
                <p className="text-[10px] font-mono text-[#C88E3E]">{activeLightboxPhoto.originalFileName}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-2 py-0.5 text-[8px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800 uppercase font-semibold">
                    Master Verified
                  </span>
                  <span className="text-[10px] font-mono text-white/50">
                    {(activeLightboxPhoto.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>
              </div>

              {/* Optical EXIF Details */}
              {activeLightboxPhoto.exif && (
                <div className="space-y-2 text-xs font-mono text-white/80">
                  <span className="text-[10px] uppercase tracking-widest text-[#C88E3E] block font-semibold">
                    Optical Sensor & Capture
                  </span>
                  <div className="p-3 bg-[#1C1916] border border-white/10 space-y-1.5 text-[11px]">
                    {activeLightboxPhoto.exif.cameraModel && <p>Body: <span className="text-white">{activeLightboxPhoto.exif.cameraModel}</span></p>}
                    {activeLightboxPhoto.exif.lens && <p>Lens: <span className="text-white">{activeLightboxPhoto.exif.lens}</span></p>}
                    {activeLightboxPhoto.exif.aperture && <p>Aperture: <span className="text-[#C88E3E] font-semibold">{activeLightboxPhoto.exif.aperture}</span></p>}
                    {activeLightboxPhoto.exif.shutterSpeed && <p>Shutter: <span className="text-white">{activeLightboxPhoto.exif.shutterSpeed}</span></p>}
                    {activeLightboxPhoto.exif.iso && <p>ISO: <span className="text-white">{activeLightboxPhoto.exif.iso}</span></p>}
                    <p>Color Space: <span className="text-emerald-400 font-semibold">{activeLightboxPhoto.colorSpace || 'P3 Wide Gamut'}</span></p>
                    <p>Bit Depth: <span className="text-white/90">{activeLightboxPhoto.bitDepth || '14-bit Uncompressed RAW'}</span></p>
                  </div>
                </div>
              )}

              {/* Proofing Notes section */}
              {rolePermissions.canAddNotes && (
                <div className="space-y-3">
                  <span className="text-[10px] uppercase tracking-widest text-[#C88E3E] block font-semibold">
                    Retouching Notes
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {activeLightboxPhoto.comments.length === 0 ? (
                      <p className="text-[11px] font-mono text-white/40 italic">No notes yet on this frame.</p>
                    ) : (
                      activeLightboxPhoto.comments.map((c) => (
                        <div key={c.id} className="p-2.5 bg-[#1C1916] border border-white/10 text-xs">
                          <p className="font-semibold text-[#C88E3E] text-[11px]">{c.author}:</p>
                          <p className="text-white/80 text-[11px] mt-0.5">{c.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Leave retouch note..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddComment(activeLightboxPhoto.id);
                      }}
                      className="flex-1 bg-[#1C1916] border border-white/15 px-3 py-2 text-xs font-mono text-white placeholder-white/40 focus:outline-none focus:border-[#C88E3E]"
                    />
                    <button
                      onClick={() => handleAddComment(activeLightboxPhoto.id)}
                      className="px-3 py-2 bg-[#C88E3E] text-white text-xs font-mono hover:bg-[#B77D2F]"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
