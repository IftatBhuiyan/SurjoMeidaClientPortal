'use client';

import React, { useState, useEffect } from 'react';
import { ClientGallery, GeneratedConcept, PhotoItem } from '@/lib/types';
import { createDriveFolder } from '@/lib/google-drive';
import { createDefaultAccessKeys, getStudioOwnerConfig, subscribeStudioOwnerConfig } from '@/lib/security';
import { GalleryEditor } from './GalleryEditor';
import { StudioAiLab } from './StudioAiLab';
import { ShareGalleryModal } from './ShareGalleryModal';
import { GoogleDrivePickerModal } from './GoogleDrivePickerModal';
import {
  FolderPlus,
  Layers,
  Sparkles,
  Camera,
  Share2,
  Calendar,
  Lock,
  HardDrive,
  Star,
  CheckCircle2,
  Plus,
  ArrowRight,
  Shield,
  Search,
  Upload,
  KeyRound,
  X,
} from 'lucide-react';

interface PhotographerDashboardProps {
  galleries: ClientGallery[];
  concepts: GeneratedConcept[];
  onUpdateGalleries: (galleries: ClientGallery[]) => void;
  onSelectGalleryForClientView: (galleryId: string) => void;
  hasDriveAuth: boolean;
  accessToken: string | null;
  onOpenSecurityModal?: () => void;
  onLockStudioDesk?: () => void;
}

export const PhotographerDashboard: React.FC<PhotographerDashboardProps> = ({
  galleries,
  concepts,
  onUpdateGalleries,
  onSelectGalleryForClientView,
  hasDriveAuth,
  accessToken,
  onOpenSecurityModal,
  onLockStudioDesk,
}) => {
  const [activeTab, setActiveTab] = useState<'galleries' | 'workspace' | 'ai-studio'>('galleries');
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>(galleries[0]?.id || '');
  const [showNewGalleryModal, setShowNewGalleryModal] = useState(false);
  const [showDrivePickerModal, setShowDrivePickerModal] = useState(false);
  const [drivePickerTargetGalleryId, setDrivePickerTargetGalleryId] = useState<string>(galleries[0]?.id || '');
  const [shareModalGallery, setShareModalGallery] = useState<ClientGallery | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerConfig, setOwnerConfig] = useState(() => getStudioOwnerConfig());
  const [dismissedTempBanner, setDismissedTempBanner] = useState(false);

  useEffect(() => {
    const unsub = subscribeStudioOwnerConfig(() => {
      setOwnerConfig(getStudioOwnerConfig());
    });
    return unsub;
  }, []);

  // New gallery form state
  const [newTitle, setNewTitle] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newShootType, setNewShootType] = useState<ClientGallery['shootType']>('Wedding');
  const [newLocation, setNewLocation] = useState('');
  const [newShootDate, setNewShootDate] = useState('2026-06-15');
  const [newAccessPin, setNewAccessPin] = useState('4829');
  const [newPasscode, setNewPasscode] = useState('SURJO890');
  const [createDriveFolderFlag, setCreateDriveFolderFlag] = useState(true);
  const [openDrivePickerAfterCreation, setOpenDrivePickerAfterCreation] = useState(true);
  const [isCreatingGallery, setIsCreatingGallery] = useState(false);

  const activeGallery = galleries.find((g) => g.id === selectedGalleryId) || galleries[0];

  const handleCreateNewGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newClientName) return;

    try {
      setIsCreatingGallery(true);
      let driveFolderId: string | undefined = undefined;

      if (hasDriveAuth && accessToken && createDriveFolderFlag) {
        try {
          const folder = await createDriveFolder(accessToken, `Surjo Media — ${newClientName} (${newShootType})`);
          driveFolderId = folder.id;
        } catch (driveErr) {
          console.warn('Drive folder creation skipped or errored:', driveErr);
        }
      }

      const newGallery: ClientGallery = {
        id: `gallery_${Date.now()}`,
        title: newTitle,
        clientName: newClientName,
        clientEmail: newClientEmail || `${newClientName.toLowerCase().replace(/\s+/g, '.')}@client.com`,
        coverPhotoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=90',
        shootDate: newShootDate,
        location: newLocation || 'Buffalo, NY',
        shootType: newShootType,
        accessPin: newAccessPin,
        securityPasscode: newPasscode,
        driveFolderId,
        isWatermarkActive: false,
        watermarkText: `© SURJO MEDIA — ${newClientName.toUpperCase()}`,
        allowHighResDownloads: true,
        allowProofingNotes: true,
        allowFavorites: true,
        status: 'active',
        welcomeMessage: `Welcome ${newClientName}! Here are your master photographs and films crafted with warmth, clarity, and precision. Star your favorite frames and submit notes for retouching.`,
        photos: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      newGallery.accessKeys = createDefaultAccessKeys(newGallery);

      const updated = [newGallery, ...galleries];
      onUpdateGalleries(updated);
      setSelectedGalleryId(newGallery.id);
      setShowNewGalleryModal(false);

      if (openDrivePickerAfterCreation) {
        setDrivePickerTargetGalleryId(newGallery.id);
        setShowDrivePickerModal(true);
      } else {
        setActiveTab('workspace');
      }

      // Reset form
      setNewTitle('');
      setNewClientName('');
      setNewClientEmail('');
      setNewLocation('');
      setNewAccessPin(Math.floor(1000 + Math.random() * 9000).toString());
      setNewPasscode('SURJO' + Math.floor(100 + Math.random() * 900));
    } catch (err) {
      console.error('Error creating gallery:', err);
    } finally {
      setIsCreatingGallery(false);
    }
  };

  const handleUpdateGallery = (updated: ClientGallery) => {
    const updatedGalleries = galleries.map((g) => (g.id === updated.id ? updated : g));
    onUpdateGalleries(updatedGalleries);
  };

  const handleImportDriveMediaToGallery = (
    selectedItems: PhotoItem[],
    linkedFolderId?: string,
    linkedFolderName?: string
  ) => {
    const targetId = drivePickerTargetGalleryId || selectedGalleryId || galleries[0]?.id;
    const target = galleries.find((g) => g.id === targetId);
    if (!target) return;

    const updatedTarget: ClientGallery = {
      ...target,
      photos: [...selectedItems, ...target.photos],
      coverPhotoUrl: target.coverPhotoUrl || (selectedItems[0]?.thumbnailUrl ?? ''),
      driveFolderId: linkedFolderId || target.driveFolderId,
      driveFolderName: linkedFolderName || target.driveFolderName,
      updatedAt: new Date().toISOString(),
    };

    handleUpdateGallery(updatedTarget);
    setSelectedGalleryId(targetId);
    setActiveTab('workspace');
  };

  const handleDeleteGallery = (galleryId: string) => {
    const remaining = galleries.filter((g) => g.id !== galleryId);
    onUpdateGalleries(remaining);
    if (selectedGalleryId === galleryId && remaining.length > 0) {
      setSelectedGalleryId(remaining[0].id);
    }
    setActiveTab('galleries');
  };

  const handleAddPhotoToGallery = (galleryId: string, photo: PhotoItem) => {
    const target = galleries.find((g) => g.id === galleryId);
    if (!target) return;
    const updatedTarget: ClientGallery = {
      ...target,
      photos: [photo, ...target.photos],
      updatedAt: new Date().toISOString(),
    };
    handleUpdateGallery(updatedTarget);
  };

  const filteredGalleries = galleries.filter(
    (g) =>
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.shootType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Temporary Passcode / Initial Setup Banner */}
      {(ownerConfig.masterPasscode === '123456' || !ownerConfig.ownerEmail) && !dismissedTempBanner && (
        <div className="bg-[#FAF7F0] dark:bg-[#151311] border border-[#C88E3E]/40 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#C88E3E]/15 border border-[#C88E3E]/40 flex items-center justify-center shrink-0 text-[#C88E3E]">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#1C1917] dark:text-[#F7F3EC] flex items-center gap-2">
                <span>Initial Studio Setup Required</span>
              </p>
              <p className="text-[11px] text-[#70665A] dark:text-[#A39886] mt-0.5">
                Set your personal master passcode and specify your authorized studio email for client archives and delivery notifications.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onOpenSecurityModal && (
              <button
                onClick={onOpenSecurityModal}
                className="px-3.5 py-2 bg-[#C88E3E] hover:bg-[#B77D2F] text-white text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-sm flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Configure Passcode & Email</span>
              </button>
            )}
            <button
              onClick={() => setDismissedTempBanner(true)}
              className="p-1.5 text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC]"
              title="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6DFD3] dark:border-[#2D261E] pb-4">
        <div className="flex items-center gap-2">
          <button
            id="tab-btn-galleries"
            onClick={() => setActiveTab('galleries')}
            className={`flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest transition-all ${
              activeTab === 'galleries'
                ? 'bg-[#C88E3E] text-white font-medium shadow-sm'
                : 'text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC] border border-[#E6DFD3] dark:border-[#2D261E] bg-white dark:bg-[#151311]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Master Archives ({galleries.length})</span>
          </button>

          {activeGallery && (
            <button
              id="tab-btn-workspace"
              onClick={() => setActiveTab('workspace')}
              className={`flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest transition-all ${
                activeTab === 'workspace'
                  ? 'bg-[#C88E3E] text-white font-medium shadow-sm'
                  : 'text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC] border border-[#E6DFD3] dark:border-[#2D261E] bg-white dark:bg-[#151311]'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>
                Darkroom Workspace{' '}
                <span className="text-[10px] opacity-70 font-mono lowercase">({activeGallery.clientName})</span>
              </span>
            </button>
          )}

          <button
            id="tab-btn-ai-studio"
            onClick={() => setActiveTab('ai-studio')}
            className={`flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest transition-all ${
              activeTab === 'ai-studio'
                ? 'bg-[#C88E3E] text-white font-medium shadow-sm'
                : 'text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC] border border-[#E6DFD3] dark:border-[#2D261E] bg-white dark:bg-[#151311]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Studio AI Pre-Viz</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSecurityModal && (
            <button
              id="btn-studio-security-key"
              onClick={onOpenSecurityModal}
              className="px-3 py-2 text-[10px] uppercase font-mono tracking-wider text-[#1C1917] dark:text-[#F7F3EC] hover:text-[#C88E3E] dark:hover:text-[#D49A3D] border border-[#C88E3E]/60 hover:border-[#C88E3E] bg-white dark:bg-[#151311] transition-colors flex items-center gap-1.5 shadow-sm"
              title="Configure Studio Master Passcode & Authorized Email"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#C88E3E]" />
              <span className="font-semibold">
                {ownerConfig.masterPasscode === '123456' || !ownerConfig.ownerEmail
                  ? 'Setup Passcode & Email'
                  : 'Change Passcode'}
              </span>
              {(ownerConfig.masterPasscode === '123456' || !ownerConfig.ownerEmail) && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#C88E3E] animate-ping ml-0.5" title="Initial setup required" />
              )}
            </button>
          )}

          <button
            id="btn-create-new-gallery"
            onClick={() => setShowNewGalleryModal(true)}
            className="px-5 py-2.5 bg-[#C88E3E] hover:bg-[#B77D2F] text-white text-xs uppercase tracking-widest font-medium transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Client Archive</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Galleries Overview */}
      {activeTab === 'galleries' && (
        <div className="space-y-6 animate-fade-in">
          {/* Studio Statistics & Storage Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="border border-[#E6DFD3] dark:border-[#2D261E] p-4 text-center bg-white dark:bg-[#151311] flex flex-col justify-center shadow-sm">
              <span className="block text-3xl font-light text-[#C88E3E] dark:text-[#D49A3D] font-serif">
                {galleries.length}
              </span>
              <span className="block text-[9px] uppercase tracking-widest text-[#70665A] dark:text-[#A39886] font-mono mt-1">
                Client Vaults
              </span>
            </div>

            <div className="border border-[#E6DFD3] dark:border-[#2D261E] p-4 text-center bg-white dark:bg-[#151311] flex flex-col justify-center shadow-sm">
              <span className="block text-3xl font-light text-[#C88E3E] dark:text-[#D49A3D] font-serif">
                {galleries.reduce((acc, g) => acc + g.photos.length, 0)}
              </span>
              <span className="block text-[9px] uppercase tracking-widest text-[#70665A] dark:text-[#A39886] font-mono mt-1">
                Master Frames
              </span>
            </div>

            <div className="border border-[#E6DFD3] dark:border-[#2D261E] p-4 text-center bg-white dark:bg-[#151311] flex flex-col justify-center shadow-sm">
              <span className="block text-3xl font-light text-[#C88E3E] dark:text-[#D49A3D] font-serif">
                {galleries.reduce((acc, g) => acc + g.photos.filter((p) => p.isFavorite).length, 0)}
              </span>
              <span className="block text-[9px] uppercase tracking-widest text-[#70665A] dark:text-[#A39886] font-mono mt-1">
                Client Starred
              </span>
            </div>

            <div className="border border-[#E6DFD3] dark:border-[#2D261E] p-4 text-center bg-white dark:bg-[#151311] flex flex-col justify-center shadow-sm">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full ${hasDriveAuth ? 'bg-emerald-500' : 'bg-[#C88E3E]'}`} />
                <span className="text-sm font-light text-[#1C1917] dark:text-[#F7F3EC] font-serif">
                  {hasDriveAuth ? 'Connected' : 'Local Storage'}
                </span>
              </div>
              <span className="block text-[9px] uppercase tracking-widest text-[#70665A] dark:text-[#A39886] font-mono mt-0.5">
                {hasDriveAuth ? 'Google Drive Active' : 'Cloud Sync Standby'}
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#70665A] dark:text-[#A39886] absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search archives by client or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] pl-10 pr-4 py-2.5 text-xs tracking-wider text-[#1C1917] dark:text-[#F7F3EC] placeholder-[#70665A]/50 dark:placeholder-[#A39886]/50 focus:outline-none focus:border-[#C88E3E] font-mono placeholder:truncate shadow-sm"
            />
          </div>

          {/* Gallery Cards Grid or Empty Slate */}
          {filteredGalleries.length === 0 ? (
            <div className="bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] p-10 sm:p-14 text-center space-y-4 max-w-xl mx-auto shadow-sm my-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF7F0] dark:bg-[#1E1B17] border border-[#E6DFD3] dark:border-[#2D261E] flex items-center justify-center text-[#C88E3E]">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif text-[#1C1917] dark:text-[#F7F3EC]">
                {searchQuery ? 'No Matching Archives Found' : 'Clean Studio Slate — Ready for Client Archives'}
              </h3>
              <p className="text-xs text-[#70665A] dark:text-[#A39886] max-w-md mx-auto leading-relaxed font-sans">
                {searchQuery
                  ? `No photography collections matched "${searchQuery}". Try clearing your search query.`
                  : 'Your studio darkroom is ready for production. Initialize your first client archive to synchronize master photographs from Google Drive or Google Photos.'}
              </p>
              <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewGalleryModal(true)}
                  className="px-5 py-2.5 bg-[#C88E3E] hover:bg-[#B77D2F] text-white text-xs uppercase tracking-widest font-mono font-medium transition-all flex items-center gap-2 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Client Archive</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGalleries.map((gallery) => {
                const favs = gallery.photos.filter((p) => p.isFavorite).length;
                return (
                  <div
                    key={gallery.id}
                    className="bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] hover:border-[#C88E3E] dark:hover:border-[#D49A3D] transition-all flex flex-col group shadow-sm overflow-hidden"
                  >
                    {/* Cover Image */}
                    <div
                      onClick={() => {
                        setSelectedGalleryId(gallery.id);
                        setActiveTab('workspace');
                      }}
                      className="aspect-[16/10] bg-[#111] relative overflow-hidden cursor-pointer flex items-center justify-center border-b border-[#E6DFD3] dark:border-[#2D261E]"
                    >
                      <img
                        src={gallery.coverPhotoUrl || gallery.photos[0]?.thumbnailUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'}
                        alt={gallery.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-95 group-hover:opacity-100"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest bg-[#C88E3E] text-white font-medium shadow-sm">
                          {gallery.shootType}
                        </span>
                      </div>

                      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/75 px-2 py-0.5 border border-white/20 text-[10px] font-mono text-white/90 tracking-wider">
                        <Lock className="w-3 h-3 text-[#C88E3E]" />
                        <span>PIN: {gallery.accessPin}</span>
                      </div>

                      <div className="absolute bottom-3 left-4 right-4 text-left">
                        <span className="text-[9px] text-white/70 uppercase tracking-[0.25em] font-mono block">
                          {gallery.clientName}
                        </span>
                        <h3 className="text-xl font-light leading-snug text-white font-serif line-clamp-1 mt-0.5">
                          {gallery.title}
                        </h3>
                      </div>
                    </div>

                    {/* Card Content & Action Buttons */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[#70665A] dark:text-[#A39886]">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-[#C88E3E]" />
                          {gallery.shootDate}
                        </span>
                        <span>{gallery.photos.length} frames</span>
                        {favs > 0 && (
                          <span className="text-[#C88E3E] dark:text-[#D49A3D] font-medium flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" /> {favs} picks
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 pt-3 border-t border-[#E6DFD3] dark:border-[#2D261E]">
                        <button
                          onClick={() => {
                            setSelectedGalleryId(gallery.id);
                            setActiveTab('workspace');
                          }}
                          className="flex-1 py-2 px-2.5 bg-[#FAF7F0] dark:bg-[#1E1B17] hover:bg-[#C88E3E] hover:text-white dark:hover:bg-[#C88E3E] text-[#1C1917] dark:text-[#F7F3EC] text-[10px] uppercase tracking-widest font-mono transition-colors flex items-center justify-center gap-1.5 border border-[#E6DFD3] dark:border-[#2D261E]"
                        >
                          <Camera className="w-3 h-3" />
                          <span>Darkroom</span>
                        </button>

                        <button
                          onClick={() => {
                            setDrivePickerTargetGalleryId(gallery.id);
                            setShowDrivePickerModal(true);
                          }}
                          className="p-2 bg-[#FAF7F0] dark:bg-[#1E1B17] hover:bg-[#C88E3E] hover:text-white dark:hover:bg-[#C88E3E] text-[#C88E3E] dark:text-[#D49A3D] border border-[#E6DFD3] dark:border-[#2D261E] transition-colors"
                          title="Ingest Media from Google Drive"
                        >
                          <HardDrive className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setShareModalGallery(gallery)}
                          className="p-2 bg-[#FAF7F0] dark:bg-[#1E1B17] hover:bg-[#C88E3E] hover:text-white dark:hover:bg-[#C88E3E] text-[#70665A] dark:text-[#A39886] border border-[#E6DFD3] dark:border-[#2D261E] transition-colors"
                          title="Share Client Link"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onSelectGalleryForClientView(gallery.id)}
                          className="p-2 bg-[#C88E3E] text-white hover:bg-[#B77D2F] transition-all shadow-sm"
                          title="Preview as Client"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Active Gallery Shoot Workspace */}
      {activeTab === 'workspace' && (
        activeGallery ? (
          <GalleryEditor
            gallery={activeGallery}
            onUpdateGallery={handleUpdateGallery}
            onDeleteGallery={handleDeleteGallery}
            hasDriveAuth={hasDriveAuth}
            accessToken={accessToken}
            onOpenShareModal={() => setShareModalGallery(activeGallery)}
          />
        ) : (
          <div className="bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] p-12 text-center space-y-4 max-w-xl mx-auto shadow-sm my-6">
            <h3 className="text-lg font-serif text-[#1C1917] dark:text-[#F7F3EC]">
              No Client Archive Selected
            </h3>
            <p className="text-xs text-[#70665A] dark:text-[#A39886] font-sans">
              Create a new client vault or select one from the Archives tab to enter the darkroom.
            </p>
            <button
              onClick={() => setActiveTab('galleries')}
              className="px-5 py-2.5 bg-[#C88E3E] text-white text-xs uppercase tracking-widest font-mono"
            >
              Browse Archives
            </button>
          </div>
        )
      )}

      {/* Tab 3: Studio AI Lab & Aspect Ratios */}
      {activeTab === 'ai-studio' && (
        <StudioAiLab
          concepts={concepts}
          onConceptGenerated={(concept) => {
            // Handled
          }}
          galleries={galleries}
          onAddPhotoToGallery={handleAddPhotoToGallery}
        />
      )}

      {/* New Client Gallery Modal */}
      {showNewGalleryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FAF7F2] dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2 text-[#C88E3E]">
                <FolderPlus className="w-4 h-4" />
                <span className="text-[10px] uppercase font-mono tracking-[0.25em]">
                  Master Delivery Setup
                </span>
              </div>
              <h2 className="text-3xl font-light text-[#1C1917] dark:text-[#F7F3EC] font-serif">
                New Client Archive
              </h2>
              <p className="text-xs text-[#70665A] dark:text-[#A39886] leading-relaxed font-sans">
                Initializes an encrypted private client portal with zero compression and master Google Photos / Drive synchronization.
              </p>
            </div>

            <form onSubmit={handleCreateNewGallery} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-[#70665A] dark:text-[#A39886]">
                  Shoot Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Aria & Elias — Villa Balbiano"
                  className="w-full bg-white dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] px-3.5 py-2.5 text-xs text-[#1C1917] dark:text-[#F7F3EC] placeholder-[#70665A]/40 dark:placeholder-[#A39886]/40 focus:outline-none focus:border-[#C88E3E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-[#70665A] dark:text-[#A39886]">
                    Client Name(s)
                  </label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Aria & Elias"
                    className="w-full bg-white dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] px-3.5 py-2.5 text-xs text-[#1C1917] dark:text-[#F7F3EC] placeholder-[#70665A]/40 dark:placeholder-[#A39886]/40 focus:outline-none focus:border-[#C88E3E]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-[#70665A] dark:text-[#A39886]">
                    Client Email
                  </label>
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="client@surjomedia.com"
                    className="w-full bg-white dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] px-3.5 py-2.5 text-xs text-[#1C1917] dark:text-[#F7F3EC] placeholder-[#70665A]/40 dark:placeholder-[#A39886]/40 focus:outline-none focus:border-[#C88E3E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-[#70665A] dark:text-[#A39886]">
                    Shoot Type
                  </label>
                  <select
                    value={newShootType}
                    onChange={(e) => setNewShootType(e.target.value as any)}
                    className="w-full bg-white dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] px-3 py-2.5 text-xs text-[#1C1917] dark:text-[#F7F3EC] focus:outline-none"
                  >
                    <option value="Wedding">Wedding</option>
                    <option value="Editorial">Editorial</option>
                    <option value="Portrait">Portrait</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Event">Event</option>
                    <option value="Landscape">Landscape</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-[#70665A] dark:text-[#A39886]">
                    Shoot Date
                  </label>
                  <input
                    type="date"
                    value={newShootDate}
                    onChange={(e) => setNewShootDate(e.target.value)}
                    className="w-full bg-white dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] px-3 py-2.5 text-xs text-[#1C1917] dark:text-[#F7F3EC] focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-[#70665A] dark:text-[#A39886]">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Buffalo, NY"
                    className="w-full bg-white dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] px-3.5 py-2.5 text-xs text-[#1C1917] dark:text-[#F7F3EC] focus:outline-none"
                  />
                </div>
              </div>

              {/* Security Credentials Setup */}
              <div className="p-4 bg-white dark:bg-[#1E1B17] border border-[#E6DFD3] dark:border-[#2D261E] space-y-3">
                <span className="text-[10px] text-[#C88E3E] uppercase font-mono tracking-[0.2em] flex items-center gap-1.5 font-medium">
                  <Shield className="w-3.5 h-3.5 text-[#C88E3E]" /> Encryption & Gate Credentials
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-[#70665A] dark:text-[#A39886] font-mono">
                      Access PIN (4 Digits)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={newAccessPin}
                      onChange={(e) => setNewAccessPin(e.target.value)}
                      className="w-full bg-[#FAF7F0] dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] px-3 py-2 text-xs font-mono text-[#1C1917] dark:text-[#F7F3EC] tracking-widest focus:outline-none focus:border-[#C88E3E]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-[#70665A] dark:text-[#A39886] font-mono">
                      Passcode
                    </label>
                    <input
                      type="text"
                      value={newPasscode}
                      onChange={(e) => setNewPasscode(e.target.value)}
                      className="w-full bg-[#FAF7F0] dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] px-3 py-2 text-xs font-mono text-[#1C1917] dark:text-[#F7F3EC] tracking-wider focus:outline-none focus:border-[#C88E3E]"
                    />
                  </div>
                </div>

                {hasDriveAuth && (
                  <div className="space-y-2 pt-1 border-t border-[#E6DFD3] dark:border-[#2D261E]">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="drive-folder-cb"
                        checked={createDriveFolderFlag}
                        onChange={(e) => setCreateDriveFolderFlag(e.target.checked)}
                        className="w-3.5 h-3.5 accent-[#C88E3E] cursor-pointer"
                      />
                      <label htmlFor="drive-folder-cb" className="text-[11px] text-[#70665A] dark:text-[#A39886] cursor-pointer">
                        Synchronize dedicated master folder on Google Drive
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="open-drive-picker-cb"
                        checked={openDrivePickerAfterCreation}
                        onChange={(e) => setOpenDrivePickerAfterCreation(e.target.checked)}
                        className="w-3.5 h-3.5 accent-[#C88E3E] cursor-pointer"
                      />
                      <label htmlFor="open-drive-picker-cb" className="text-[11px] text-[#1C1917] dark:text-[#F7F3EC] font-mono cursor-pointer font-medium">
                        Open Google Drive Ingest immediately after setup to pick client assets
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DFD3] dark:border-[#2D261E]">
                <button
                  type="button"
                  onClick={() => setShowNewGalleryModal(false)}
                  className="px-4 py-2 text-xs uppercase tracking-widest font-mono text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingGallery}
                  className="px-6 py-2.5 bg-[#C88E3E] text-white hover:bg-[#B77D2F] text-xs uppercase tracking-widest font-medium transition-all shadow-sm"
                >
                  {isCreatingGallery ? 'Initializing Archive...' : 'Provision Archive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Drive Master Media Ingest Modal */}
      <GoogleDrivePickerModal
        isOpen={showDrivePickerModal}
        onClose={() => setShowDrivePickerModal(false)}
        onImportDrivePhotos={handleImportDriveMediaToGallery}
        accessToken={accessToken}
        hasDriveAuth={hasDriveAuth}
        targetGalleryTitle={galleries.find((g) => g.id === drivePickerTargetGalleryId)?.title || activeGallery?.title || 'Client Archive'}
        galleries={galleries}
        selectedGalleryId={drivePickerTargetGalleryId}
        onSelectTargetGallery={setDrivePickerTargetGalleryId}
      />

      {/* Share Modal */}
      {shareModalGallery && (
        <ShareGalleryModal
          gallery={shareModalGallery}
          isOpen={!!shareModalGallery}
          onClose={() => setShareModalGallery(null)}
          onUpdateGallery={(updated) => {
            const next = galleries.map((g) => (g.id === updated.id ? updated : g));
            onUpdateGalleries(next);
            setShareModalGallery(updated);
          }}
        />
      )}
    </div>
  );
};
