'use client';

import React, { useState, useEffect } from 'react';
import { PhotoItem, ClientGallery } from '@/lib/types';
import { listDriveFolders, listDriveMediaFiles, DriveFolder } from '@/lib/google-drive';
import { googleSignIn } from '@/lib/firebase';
import {
  HardDrive,
  Folder,
  FolderOpen,
  Image as ImageIcon,
  Film,
  Check,
  CheckSquare,
  Square,
  Search,
  RefreshCw,
  X,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sliders,
  ChevronRight,
  Info,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

interface GoogleDrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportDrivePhotos: (selectedItems: PhotoItem[], linkedFolderId?: string, linkedFolderName?: string) => void;
  accessToken: string | null;
  hasDriveAuth: boolean;
  onConnectDrive?: () => void;
  targetGalleryTitle?: string;
  galleries?: ClientGallery[];
  selectedGalleryId?: string;
  onSelectTargetGallery?: (id: string) => void;
}

export const GoogleDrivePickerModal: React.FC<GoogleDrivePickerModalProps> = ({
  isOpen,
  onClose,
  onImportDrivePhotos,
  accessToken,
  hasDriveAuth,
  onConnectDrive,
  targetGalleryTitle = 'Active Client Archive',
  galleries,
  selectedGalleryId,
  onSelectTargetGallery,
}) => {
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [folderPath, setFolderPath] = useState<{ id?: string; name: string }[]>([
    { id: undefined, name: 'My Google Drive' },
  ]);
  const [mediaItems, setMediaItems] = useState<PhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'raw' | 'video' | 'photo'>('all');
  const [previewItem, setPreviewItem] = useState<PhotoItem | null>(null);
  const [linkAsMasterFolder, setLinkAsMasterFolder] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch folders and media items when folder changes or modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadDriveData = async () => {
      setIsLoading(true);
      try {
        const [fetchedFolders, fetchedMedia] = await Promise.all([
          listDriveFolders(accessToken, currentFolderId),
          listDriveMediaFiles(accessToken, currentFolderId),
        ]);
        setFolders(fetchedFolders);
        setMediaItems(fetchedMedia);
        // Pre-select all by default for easy one-click import
        setSelectedIds(new Set(fetchedMedia.map((m) => m.id)));
      } catch (err) {
        console.error('Error loading Google Drive contents:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDriveData();
  }, [isOpen, currentFolderId, accessToken]);

  if (!isOpen) return null;

  const handleFolderClick = (folder: DriveFolder) => {
    setCurrentFolderId(folder.id);
    setFolderPath((prev) => [...prev, { id: folder.id, name: folder.name.replace(/^📁\s*/, '') }]);
    setSelectedIds(new Set());
  };

  const handleBreadcrumbClick = (index: number) => {
    const target = folderPath[index];
    setFolderPath(folderPath.slice(0, index + 1));
    setCurrentFolderId(target.id);
    setSelectedIds(new Set());
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredMedia.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMedia.map((m) => m.id)));
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      if (onConnectDrive) {
        onConnectDrive();
      } else {
        await googleSignIn();
      }
    } catch (err) {
      console.error('Drive connect error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleImport = () => {
    const chosen = mediaItems.filter((item) => selectedIds.has(item.id));
    if (chosen.length === 0) return;

    const currentFolderName = folderPath[folderPath.length - 1]?.name;
    onImportDrivePhotos(
      chosen,
      linkAsMasterFolder ? currentFolderId : undefined,
      linkAsMasterFolder ? currentFolderName : undefined
    );
    onClose();
  };

  // Filter media items
  const filteredMedia = mediaItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.originalFileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.exif?.cameraModel && item.exif.cameraModel.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (typeFilter === 'video') return item.mediaType === 'video';
    if (typeFilter === 'raw') return item.mediaType === 'raw' || item.originalFileName.match(/\.(arw|cr2|cr3|nef|dng|raf)$/i);
    if (typeFilter === 'photo') return item.mediaType === 'photo' || !item.mediaType;

    return true;
  });

  const totalSelectedBytes = mediaItems
    .filter((m) => selectedIds.has(m.id))
    .reduce((acc, curr) => acc + (curr.fileSizeBytes || 0), 0);

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in text-left">
      <div className="bg-[#FAF7F2] dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] max-w-5xl w-full h-[90vh] max-h-[850px] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#E6DFD3] dark:border-[#2D261E] bg-[#F5EFE6] dark:bg-[#1A1714] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-[#C88E3E] bg-[#C88E3E]/10 dark:bg-[#C88E3E]/20 flex items-center justify-center text-[#C88E3E] shrink-0 shadow-sm">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-serif text-[#1C1917] dark:text-[#F7F3EC] font-light">
                  Google Drive Master Ingest
                </h2>
                <span className="text-[9px] uppercase font-mono tracking-widest px-2 py-0.5 bg-[#C88E3E]/15 text-[#C88E3E] dark:text-[#D49A3D] border border-[#C88E3E]/30 font-medium">
                  Lossless Master Stream
                </span>
              </div>
              <p className="text-xs text-[#70665A] dark:text-[#A39886] font-mono mt-0.5">
                Target: <span className="text-[#1C1917] dark:text-[#F7F3EC] font-semibold">{targetGalleryTitle}</span> • Zero Compression / Maximum Original Fidelity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!hasDriveAuth && (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-3 py-1.5 bg-[#C88E3E] hover:bg-[#B77D2F] text-white text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isConnecting ? 'Connecting...' : 'Live Drive Sign-In'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Target Gallery Switcher (if provided) */}
        {galleries && galleries.length > 1 && onSelectTargetGallery && (
          <div className="px-6 py-2.5 bg-[#EFE9DE] dark:bg-[#1C1916] border-b border-[#E6DFD3] dark:border-[#2D261E] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-[#70665A] dark:text-[#A39886] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#C88E3E]" /> Ingest Into Client Archive:
            </span>
            <select
              value={selectedGalleryId}
              onChange={(e) => onSelectTargetGallery(e.target.value)}
              className="bg-white dark:bg-[#12100E] border border-[#E6DFD3] dark:border-[#2D261E] px-3 py-1 text-xs text-[#1C1917] dark:text-[#F7F3EC] focus:outline-none focus:border-[#C88E3E]"
            >
              {galleries.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.clientName} — {g.title} ({g.photos.length} frames)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Drive Breadcrumb & Filter Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-[#E6DFD3] dark:border-[#2D261E] bg-[#FAF7F2] dark:bg-[#151311] flex flex-wrap items-center justify-between gap-3">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#70665A] dark:text-[#A39886] overflow-x-auto py-1">
            <HardDrive className="w-3.5 h-3.5 text-[#C88E3E] shrink-0" />
            {folderPath.map((crumb, idx) => (
              <React.Fragment key={crumb.id || 'root'}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-[#70665A]/40 shrink-0" />}
                <button
                  onClick={() => handleBreadcrumbClick(idx)}
                  className={`hover:text-[#C88E3E] transition-colors whitespace-nowrap ${
                    idx === folderPath.length - 1
                      ? 'text-[#1C1917] dark:text-[#F7F3EC] font-semibold'
                      : 'text-[#70665A] dark:text-[#A39886]'
                  }`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Quick Filter Tabs & Search */}
          <div className="flex items-center gap-2">
            <div className="flex bg-[#EFE8DC] dark:bg-[#1C1916] p-0.5 border border-[#E6DFD3] dark:border-[#2D261E] text-[10px] font-mono uppercase">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 transition-all ${
                  typeFilter === 'all' ? 'bg-[#C88E3E] text-white font-semibold' : 'text-[#70665A] dark:text-[#A39886]'
                }`}
              >
                All Media
              </button>
              <button
                onClick={() => setTypeFilter('raw')}
                className={`px-2.5 py-1 transition-all ${
                  typeFilter === 'raw' ? 'bg-[#C88E3E] text-white font-semibold' : 'text-[#70665A] dark:text-[#A39886]'
                }`}
              >
                RAW Sensors
              </button>
              <button
                onClick={() => setTypeFilter('video')}
                className={`px-2.5 py-1 transition-all ${
                  typeFilter === 'video' ? 'bg-[#C88E3E] text-white font-semibold' : 'text-[#70665A] dark:text-[#A39886]'
                }`}
              >
                4K Cinema
              </button>
              <button
                onClick={() => setTypeFilter('photo')}
                className={`px-2.5 py-1 transition-all ${
                  typeFilter === 'photo' ? 'bg-[#C88E3E] text-white font-semibold' : 'text-[#70665A] dark:text-[#A39886]'
                }`}
              >
                Photos
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#70665A] dark:text-[#A39886] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="SEARCH DRIVE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white dark:bg-[#12100E] border border-[#E6DFD3] dark:border-[#2D261E] pl-8 pr-3 py-1 text-[11px] font-mono text-[#1C1917] dark:text-[#F7F3EC] focus:outline-none focus:border-[#C88E3E] w-32 sm:w-44 uppercase"
              />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Subfolders Grid */}
          {folders.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#70665A] dark:text-[#A39886] block">
                Google Drive Folders ({folders.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => handleFolderClick(folder)}
                    className="p-3 bg-white dark:bg-[#181613] border border-[#E6DFD3] dark:border-[#2D261E] hover:border-[#C88E3E] dark:hover:border-[#D49A3D] text-left transition-all group flex items-center gap-2.5 shadow-sm"
                  >
                    <Folder className="w-5 h-5 text-[#C88E3E] group-hover:scale-110 transition-transform shrink-0" />
                    <span className="text-xs font-mono text-[#1C1917] dark:text-[#F7F3EC] truncate font-medium">
                      {folder.name.replace(/^📁\s*/, '')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Media Files Selection Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#70665A] dark:text-[#A39886]">
                  Master Media Files ({filteredMedia.length})
                </span>
                {filteredMedia.length > 0 && (
                  <button
                    onClick={handleSelectAll}
                    className="text-[11px] font-mono text-[#C88E3E] hover:underline flex items-center gap-1"
                  >
                    {selectedIds.size === filteredMedia.length ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5" /> Deselect All
                      </>
                    ) : (
                      <>
                        <Square className="w-3.5 h-3.5" /> Select All ({filteredMedia.length})
                      </>
                    )}
                  </button>
                )}
              </div>

              {selectedIds.size > 0 && (
                <span className="text-[11px] font-mono text-[#C88E3E] dark:text-[#D49A3D] font-semibold">
                  {selectedIds.size} Selected ({formatFileSize(totalSelectedBytes)} Lossless)
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="p-16 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-[#C88E3E] animate-spin mx-auto" />
                <p className="text-xs font-mono text-[#70665A] dark:text-[#A39886] uppercase tracking-widest">
                  Scanning Google Drive Lossless Stream...
                </p>
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-[#181613] border border-[#E6DFD3] dark:border-[#2D261E] space-y-2">
                <ImageIcon className="w-8 h-8 text-[#70665A]/40 mx-auto" />
                <p className="text-xs font-serif text-[#1C1917] dark:text-[#F7F3EC]">No matching media in this folder</p>
                <p className="text-[10px] font-mono text-[#70665A] dark:text-[#A39886]">
                  Click on one of the folders above or adjust your search filter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredMedia.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  const isVideo = item.mediaType === 'video';
                  const isRaw = item.mediaType === 'raw';

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleSelect(item.id)}
                      className={`relative bg-white dark:bg-[#181613] border transition-all cursor-pointer group flex flex-col shadow-sm overflow-hidden ${
                        isSelected
                          ? 'border-[#C88E3E] ring-2 ring-[#C88E3E]/40 dark:ring-[#C88E3E]/60'
                          : 'border-[#E6DFD3] dark:border-[#2D261E] hover:border-[#C88E3E]/60'
                      }`}
                    >
                      {/* Thumbnail Container */}
                      <div className="relative aspect-[3/2] bg-black/90 overflow-hidden">
                        <img
                          src={item.thumbnailUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />

                        {/* Top Badges */}
                        <div className="absolute top-2 inset-x-2 flex items-center justify-between z-10 pointer-events-none">
                          <span
                            className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 font-bold shadow-sm ${
                              isVideo
                                ? 'bg-rose-600 text-white'
                                : isRaw
                                ? 'bg-amber-600 text-white'
                                : 'bg-black/70 text-white'
                            }`}
                          >
                            {isVideo ? `4K FILM ${item.duration || ''}` : isRaw ? 'RAW MASTER' : 'LOSSLESS'}
                          </span>

                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                              isSelected
                                ? 'bg-[#C88E3E] border-[#C88E3E] text-white shadow'
                                : 'bg-black/60 border-white/40 text-transparent group-hover:border-white'
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        </div>

                        {isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
                            <div className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center border border-white/40">
                              <Film className="w-4 h-4" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* File Details */}
                      <div className="p-3 bg-[#FAF7F0] dark:bg-[#1E1B17] border-t border-[#E6DFD3] dark:border-[#2D261E] space-y-1">
                        <p className="text-xs font-serif text-[#1C1917] dark:text-[#F7F3EC] truncate font-medium">
                          {item.name}
                        </p>
                        <div className="flex items-center justify-between text-[9px] font-mono text-[#70665A] dark:text-[#A39886]">
                          <span className="truncate max-w-[110px]">{item.originalFileName}</span>
                          <span className="font-semibold text-[#C88E3E] dark:text-[#D49A3D]">
                            {formatFileSize(item.fileSizeBytes)}
                          </span>
                        </div>
                        {item.exif?.cameraModel && (
                          <p className="text-[8px] font-mono text-[#70665A]/80 dark:text-[#A39886]/80 truncate">
                            {item.exif.cameraModel} • {item.exif.lens || 'Prime'}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-[#E6DFD3] dark:border-[#2D261E] bg-[#F5EFE6] dark:bg-[#1A1714] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="link-master-folder-cb"
              checked={linkAsMasterFolder}
              onChange={(e) => setLinkAsMasterFolder(e.target.checked)}
              className="w-4 h-4 accent-[#C88E3E] cursor-pointer"
            />
            <label htmlFor="link-master-folder-cb" className="text-xs text-[#1C1917] dark:text-[#F7F3EC] font-mono cursor-pointer">
              Link this Drive directory as the client&apos;s active cloud delivery folder
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs uppercase tracking-widest font-mono text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC]"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={selectedIds.size === 0}
              className="px-6 py-2.5 bg-[#C88E3E] hover:bg-[#B77D2F] disabled:opacity-50 disabled:pointer-events-none text-white text-xs uppercase tracking-widest font-medium transition-all shadow-sm flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>
                Import {selectedIds.size} Master Items ({formatFileSize(totalSelectedBytes)})
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
