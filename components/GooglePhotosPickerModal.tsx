'use client';

import React, { useState, useEffect } from 'react';
import {
  GooglePhotosAlbum,
  GooglePhotosMediaItem,
  PhotoItem,
} from '@/lib/types';
import {
  listGooglePhotosAlbums,
  listGooglePhotosMediaItems,
  convertGooglePhotosMediaToPhotoItem,
  FetchMediaItemsResult,
} from '@/lib/google-photos';
import { googleSignIn, setCachedAccessToken } from '@/lib/firebase';
import {
  X,
  Image as ImageIcon,
  CheckCircle2,
  Download,
  Calendar,
  Check,
  RefreshCw,
  FolderOpen,
  ShieldCheck,
  Zap,
  Search,
  Cloud,
  Layers,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface GooglePhotosPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportPhotos: (photos: PhotoItem[]) => void;
  accessToken?: string | null;
  targetGalleryTitle: string;
}

export const GooglePhotosPickerModal: React.FC<GooglePhotosPickerModalProps> = ({
  isOpen,
  onClose,
  onImportPhotos,
  accessToken: initialAccessToken,
  targetGalleryTitle,
}) => {
  const [overrideAccessToken, setOverrideAccessToken] = useState<string | null>(null);
  const activeAccessToken = overrideAccessToken || initialAccessToken || null;
  const [albums, setAlbums] = useState<GooglePhotosAlbum[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('ALL_PHOTOS_LIBRARY');
  const [mediaItems, setMediaItems] = useState<GooglePhotosMediaItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [apiError, setApiError] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<'google_photos' | 'google_drive' | 'demo'>('google_photos');
  const [isImporting, setIsImporting] = useState(false);
  const [qualityMode, setQualityMode] = useState<'lossless' | 'high_res'>('lossless');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  const handleConnectGoogle = async () => {
    try {
      setIsConnectingGoogle(true);
      setApiError(null);
      const res = await googleSignIn({ withDrive: true });
      if (res && res.accessToken) {
        setOverrideAccessToken(res.accessToken);
        setCachedAccessToken(res.accessToken);
        // Refresh albums and library
        await loadLibraryAndAlbums(res.accessToken);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setApiError(`Google connection failed: ${msg}`);
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const loadLibraryAndAlbums = async (token?: string | null) => {
    const activeToken = token !== undefined ? token : activeAccessToken;
    setIsLoading(true);
    setApiError(null);

    try {
      // 1. Fetch albums
      const fetchedAlbums = await listGooglePhotosAlbums(activeToken);
      setAlbums(fetchedAlbums);

      // 2. Fetch default view: All Library Photos
      const result: FetchMediaItemsResult = await listGooglePhotosMediaItems(
        selectedAlbumId || 'ALL_PHOTOS_LIBRARY',
        activeToken
      );

      setMediaItems(result.items);
      setNextPageToken(result.nextPageToken);
      setSourceType(result.sourceType || 'google_photos');
      if (result.error) {
        setApiError(result.error);
      }
      // Auto-select all by default if less than 24 photos
      if (result.items.length <= 24) {
        setSelectedItemIds(new Set(result.items.map((i) => i.id)));
      } else {
        setSelectedItemIds(new Set());
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const selectAlbum = async (albumId: string) => {
    setSelectedAlbumId(albumId);
    setSelectedItemIds(new Set());
    setNextPageToken(undefined);
    setApiError(null);

    try {
      setIsLoading(true);
      const result = await listGooglePhotosMediaItems(albumId, activeAccessToken);
      setMediaItems(result.items);
      setNextPageToken(result.nextPageToken);
      setSourceType(result.sourceType || 'google_photos');
      if (result.error) {
        setApiError(result.error);
      }
      if (result.items.length <= 24) {
        setSelectedItemIds(new Set(result.items.map((i) => i.id)));
      }
    } catch (err: unknown) {
      console.error('Failed to load Google Photos media items:', err);
      setApiError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!nextPageToken || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      const result = await listGooglePhotosMediaItems(
        selectedAlbumId,
        activeAccessToken,
        nextPageToken
      );

      setMediaItems((prev) => [...prev, ...result.items]);
      setNextPageToken(result.nextPageToken);
    } catch (err: unknown) {
      console.error('Failed to load more photos:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLibraryAndAlbums(activeAccessToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeAccessToken]);

  const toggleItemSelection = (id: string) => {
    const next = new Set(selectedItemIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedItemIds(next);
  };

  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return mediaItems;
    const q = searchQuery.toLowerCase().trim();
    return mediaItems.filter(
      (item) =>
        item.filename.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.mediaMetadata?.photo?.cameraModel &&
          item.mediaMetadata.photo.cameraModel.toLowerCase().includes(q))
    );
  }, [mediaItems, searchQuery]);

  const selectAll = () => {
    if (selectedItemIds.size === filteredItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  const handleExecuteImport = () => {
    const chosen = mediaItems.filter((m) => selectedItemIds.has(m.id));
    if (chosen.length === 0) return;

    setIsImporting(true);
    setTimeout(() => {
      const converted: PhotoItem[] = chosen.map((item) =>
        convertGooglePhotosMediaToPhotoItem(item)
      );
      onImportPhotos(converted);
      setIsImporting(false);
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  const currentAlbum = albums.find((a) => a.id === selectedAlbumId) || {
    id: 'ALL_PHOTOS_LIBRARY',
    title: '⭐ All Photos (Entire Picture Library)',
    mediaItemsCount: mediaItems.length,
    coverPhotoBaseUrl: '',
  };

  const realAlbums = albums.filter(
    (a) => a.id !== 'ALL_PHOTOS_LIBRARY' && a.id !== 'ALL_DRIVE_PHOTOS'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in text-left">
      <div className="bg-[#FAF7F2] dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] max-w-6xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#E6DFD3] dark:border-[#2D261E] flex items-center justify-between bg-white dark:bg-[#0C0B0A]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 border border-[#C88E3E]/30 bg-[#C88E3E]/10 flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5 text-[#C88E3E]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-light text-[#1C1917] dark:text-[#F7F3EC] font-serif tracking-wide">
                  Direct Google Photos Master Importer
                </h2>
                <span className="text-[9px] uppercase font-mono tracking-widest px-2 py-0.5 bg-[#C88E3E]/15 text-[#C88E3E] dark:text-[#D49A3D] border border-[#C88E3E]/30 font-semibold">
                  Whole Library Access
                </span>
              </div>
              <p className="text-xs text-[#70665A] dark:text-[#A39886] font-sans">
                Browse your complete Google Photos library & albums for direct ingest into &ldquo;<span className="text-[#1C1917] dark:text-[#F7F3EC] font-medium">{targetGalleryTitle}</span>&rdquo;.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!activeAccessToken && (
              <button
                onClick={handleConnectGoogle}
                disabled={isConnectingGoogle}
                className="px-3 py-1.5 bg-[#C88E3E] hover:bg-[#B77D2F] text-white text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>{isConnectingGoogle ? 'Connecting...' : 'Connect Google'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-white p-2 hover:bg-[#FAF7F0] dark:hover:bg-[#1E1B17] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quality & Notice Banner */}
        <div className="bg-[#FAF7F0] dark:bg-[#1E1B17] px-6 py-2.5 border-b border-[#E6DFD3] dark:border-[#2D261E] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#70665A] dark:text-[#A39886] font-mono text-[11px]">
            <ShieldCheck className="w-4 h-4 text-[#C88E3E]" />
            <span>Lossless EXIF Protocol: Google Photos Original =d Parameter Active</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[#70665A] dark:text-[#A39886] font-mono uppercase tracking-widest">Quality Ingest:</span>
            <div className="flex items-center gap-1 bg-white dark:bg-[#0C0B0A] p-1 border border-[#E6DFD3] dark:border-[#2D261E] text-[10px] font-mono shadow-sm">
              <button
                onClick={() => setQualityMode('lossless')}
                className={`px-2.5 py-0.5 transition-colors ${
                  qualityMode === 'lossless' ? 'bg-[#C88E3E] text-white font-medium shadow-sm' : 'text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC]'
                }`}
              >
                Lossless Original (Full Exif)
              </button>
              <button
                onClick={() => setQualityMode('high_res')}
                className={`px-2.5 py-0.5 transition-colors ${
                  qualityMode === 'high_res' ? 'bg-[#C88E3E] text-white font-medium shadow-sm' : 'text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC]'
                }`}
              >
                Optimized 4K Master
              </button>
            </div>
          </div>
        </div>

        {/* Alert/Error Banner if API returned error or note */}
        {apiError && (
          <div className="bg-[#FFF9F2] dark:bg-[#201A15] border-b border-[#E6DFD3] dark:border-[#2D261E] px-6 py-2 flex items-center justify-between text-xs text-[#8C5D23] dark:text-[#D49A3D]">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#C88E3E]" />
              <span className="font-mono text-[11px]">{apiError}</span>
            </div>
            <button
              onClick={handleConnectGoogle}
              className="text-[10px] uppercase font-mono tracking-wider underline hover:text-[#1C1917] dark:hover:text-white shrink-0 ml-2"
            >
              Re-authenticate Google
            </button>
          </div>
        )}

        {/* Content Body: Sidebar Navigation + Photo Grid */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[440px]">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-80 border-r border-[#E6DFD3] dark:border-[#2D261E] p-4 space-y-4 bg-white dark:bg-[#0C0B0A] overflow-y-auto shrink-0">
            {/* Primary Library Categories */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#70665A] dark:text-[#A39886] flex items-center gap-1.5 font-medium pb-1 border-b border-[#E6DFD3] dark:border-[#2D261E]">
                <Layers className="w-3.5 h-3.5 text-[#C88E3E]" />
                Primary Collections
              </span>

              {/* Button: All Photos (Entire Picture Library) */}
              <button
                onClick={() => selectAlbum('ALL_PHOTOS_LIBRARY')}
                className={`w-full p-2.5 text-left border transition-all flex items-center gap-3 ${
                  selectedAlbumId === 'ALL_PHOTOS_LIBRARY'
                    ? 'bg-[#C88E3E] text-white border-[#C88E3E] shadow-sm'
                    : 'bg-[#FAF7F0] dark:bg-[#151311] border-[#E6DFD3] dark:border-[#2D261E] text-[#1C1917] dark:text-[#F7F3EC] hover:border-[#C88E3E]'
                }`}
              >
                <div className={`w-9 h-9 flex items-center justify-center shrink-0 border ${
                  selectedAlbumId === 'ALL_PHOTOS_LIBRARY'
                    ? 'bg-white/20 border-white/30 text-white'
                    : 'bg-white dark:bg-[#0C0B0A] border-[#E6DFD3] dark:border-[#2D261E] text-[#C88E3E]'
                }`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-serif font-medium truncate">
                    Whole Picture Library
                  </p>
                  <p className={`text-[10px] font-mono mt-0.5 ${
                    selectedAlbumId === 'ALL_PHOTOS_LIBRARY' ? 'text-white/80' : 'text-[#70665A] dark:text-[#A39886]'
                  }`}>
                    All photos in chronological order
                  </p>
                </div>
              </button>

              {/* Button: Google Drive Photo Assets */}
              <button
                onClick={() => selectAlbum('ALL_DRIVE_PHOTOS')}
                className={`w-full p-2.5 text-left border transition-all flex items-center gap-3 ${
                  selectedAlbumId === 'ALL_DRIVE_PHOTOS'
                    ? 'bg-[#C88E3E] text-white border-[#C88E3E] shadow-sm'
                    : 'bg-[#FAF7F0] dark:bg-[#151311] border-[#E6DFD3] dark:border-[#2D261E] text-[#1C1917] dark:text-[#F7F3EC] hover:border-[#C88E3E]'
                }`}
              >
                <div className={`w-9 h-9 flex items-center justify-center shrink-0 border ${
                  selectedAlbumId === 'ALL_DRIVE_PHOTOS'
                    ? 'bg-white/20 border-white/30 text-white'
                    : 'bg-white dark:bg-[#0C0B0A] border-[#E6DFD3] dark:border-[#2D261E] text-[#C88E3E]'
                }`}>
                  <Cloud className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-serif font-medium truncate">
                    Google Drive Photos
                  </p>
                  <p className={`text-[10px] font-mono mt-0.5 ${
                    selectedAlbumId === 'ALL_DRIVE_PHOTOS' ? 'text-white/80' : 'text-[#70665A] dark:text-[#A39886]'
                  }`}>
                    Images & RAWs saved in Drive
                  </p>
                </div>
              </button>
            </div>

            {/* Albums Section */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#E6DFD3] dark:border-[#2D261E]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#70665A] dark:text-[#A39886] flex items-center gap-1.5 font-medium">
                  <FolderOpen className="w-3.5 h-3.5 text-[#C88E3E]" />
                  Google Photos Albums ({realAlbums.length})
                </span>
                <button
                  onClick={() => loadLibraryAndAlbums(activeAccessToken)}
                  className="text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-white p-1"
                  title="Refresh albums"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {realAlbums.length === 0 ? (
                <div className="p-3 bg-[#FAF7F0] dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] text-[11px] text-[#70665A] dark:text-[#A39886] space-y-1">
                  <p className="font-medium text-[#1C1917] dark:text-[#F7F3EC]">No custom albums found</p>
                  <p className="text-[10px]">Your entire library is available under &ldquo;Whole Picture Library&rdquo; above.</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-0.5">
                  {realAlbums.map((album) => {
                    const isSelected = album.id === selectedAlbumId;
                    return (
                      <button
                        key={album.id}
                        onClick={() => selectAlbum(album.id)}
                        className={`w-full p-2 text-left border transition-all flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-[#C88E3E] text-white border-[#C88E3E] shadow-sm'
                            : 'bg-[#FAF7F0] dark:bg-[#151311] border-[#E6DFD3] dark:border-[#2D261E] text-[#1C1917] dark:text-[#F7F3EC] hover:border-[#C88E3E]'
                        }`}
                      >
                        <div className="w-8 h-8 bg-[#151515] overflow-hidden shrink-0 border border-black/10">
                          {album.coverPhotoBaseUrl ? (
                            <img
                              src={`${album.coverPhotoBaseUrl}?auto=format&fit=crop&w=120&q=80`}
                              alt={album.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/40">
                              <ImageIcon className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-serif truncate font-normal leading-tight">
                            {album.title}
                          </p>
                          <p className={`text-[9px] font-mono mt-0.5 ${isSelected ? 'text-white/80' : 'text-[#70665A] dark:text-[#A39886]'}`}>
                            {album.mediaItemsCount} photos
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Photos Selection Grid & Search Bar */}
          <div className="flex-1 p-5 overflow-y-auto bg-[#FAF7F2] dark:bg-[#151311] flex flex-col space-y-4">
            {/* Action Bar: Title, Search, and Select All */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#E6DFD3] dark:border-[#2D261E] gap-3">
              <div className="space-y-0.5">
                <h3 className="text-base font-light text-[#1C1917] dark:text-[#F7F3EC] font-serif flex items-center gap-2">
                  <span>{currentAlbum.title}</span>
                  {sourceType === 'google_drive' && (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 bg-[#C88E3E]/10 text-[#C88E3E] border border-[#C88E3E]/20">
                      Drive Sync
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-[#70665A] dark:text-[#A39886] font-mono">
                  Showing {filteredItems.length} photos • {selectedItemIds.size} selected for gallery ingest
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#70665A] dark:text-[#A39886]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by filename..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] text-xs text-[#1C1917] dark:text-[#F7F3EC] focus:outline-none focus:border-[#C88E3E]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#70665A] hover:text-[#1C1917]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <button
                  onClick={selectAll}
                  className="px-3 py-1.5 border border-[#E6DFD3] dark:border-[#2D261E] hover:border-[#C88E3E] text-[#1C1917] dark:text-[#F7F3EC] text-xs font-mono uppercase tracking-widest transition-colors bg-white dark:bg-[#0C0B0A] shadow-sm shrink-0"
                >
                  {selectedItemIds.size === filteredItems.length && filteredItems.length > 0 ? 'Deselect' : 'Select All'}
                </button>
              </div>
            </div>

            {/* Photo Grid States */}
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-24 text-[#70665A] dark:text-[#A39886] space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-[#C88E3E]" />
                <span className="text-xs font-mono uppercase tracking-widest">
                  Querying Google Photos Full Library Index...
                </span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-[#70665A] dark:text-[#A39886] space-y-3">
                <ImageIcon className="w-12 h-12 text-[#C88E3E]/40" />
                <div className="text-center space-y-1">
                  <p className="text-sm font-serif text-[#1C1917] dark:text-[#F7F3EC]">
                    No photos found in this view
                  </p>
                  <p className="text-xs font-mono text-[#70665A] dark:text-[#A39886]">
                    {searchQuery
                      ? `No files match query "${searchQuery}"`
                      : 'Connect your Google account or switch to "Google Drive Photos" in the sidebar.'}
                  </p>
                </div>
                {!activeAccessToken && (
                  <button
                    onClick={handleConnectGoogle}
                    className="px-4 py-2 bg-[#C88E3E] text-white text-xs font-mono uppercase tracking-widest shadow-sm hover:bg-[#B77D2F] transition-colors"
                  >
                    Connect Google Photos Account
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredItems.map((item) => {
                    const isSelected = selectedItemIds.has(item.id);
                    const isUnsplash = item.baseUrl.includes('unsplash.com');
                    const isDrive = item.baseUrl.includes('google.com') || item.baseUrl.includes('googleusercontent.com');
                    const thumb = isUnsplash
                      ? `${item.baseUrl}?auto=format&fit=crop&w=600&q=85`
                      : isDrive
                      ? (item.baseUrl.includes('=') ? item.baseUrl : `${item.baseUrl}=w600-h400`)
                      : `${item.baseUrl}=w600-h400`;
                    const photoMeta = item.mediaMetadata?.photo || {};

                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleItemSelection(item.id)}
                        className={`group relative aspect-[4/3] bg-[#111] border overflow-hidden cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#C88E3E] ring-2 ring-[#C88E3E]/60'
                            : 'border-[#E6DFD3] dark:border-[#2D261E] hover:border-[#C88E3E]'
                        }`}
                      >
                        <img
                          src={thumb}
                          alt={item.filename}
                          className={`w-full h-full object-cover transition-all duration-300 ${
                            isSelected ? 'opacity-95 scale-[1.02]' : 'opacity-85 group-hover:opacity-100'
                          }`}
                          referrerPolicy="no-referrer"
                        />

                        {/* Selection Checkmark */}
                        <div className="absolute top-2 right-2 z-10">
                          <div
                            className={`w-6 h-6 flex items-center justify-center border transition-all ${
                              isSelected
                                ? 'bg-[#C88E3E] text-white border-[#C88E3E] shadow-sm'
                                : 'bg-black/60 text-white/40 border-white/20 backdrop-blur-sm'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>

                        {/* Bottom EXIF Overlay */}
                        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black via-black/80 to-transparent text-[9px] font-mono text-white space-y-0.5">
                          <p className="truncate font-medium">{item.filename}</p>
                          <div className="flex items-center justify-between text-white/70 text-[8px]">
                            <span>
                              {item.mediaMetadata?.width || '4000'}×{item.mediaMetadata?.height || '3000'}
                            </span>
                            {photoMeta.cameraModel && <span className="truncate max-w-[120px]">{photoMeta.cameraModel}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Load More Pagination */}
                {nextPageToken && (
                  <div className="pt-4 pb-2 text-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="px-6 py-2 bg-white dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] hover:border-[#C88E3E] text-[#1C1917] dark:text-[#F7F3EC] text-xs font-mono uppercase tracking-widest transition-colors shadow-sm inline-flex items-center gap-2"
                    >
                      {isLoadingMore ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C88E3E]" />
                          <span>Fetching More Library Frames...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5 text-[#C88E3E]" />
                          <span>Load Next Page of Photos</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-[#E6DFD3] dark:border-[#2D261E] bg-white dark:bg-[#0C0B0A] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#70665A] dark:text-[#A39886]">
            <Zap className="w-4 h-4 text-[#C88E3E]" />
            <span>
              {selectedItemIds.size} of {filteredItems.length} photos ready for uncompressed ingestion
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#E6DFD3] dark:border-[#2D261E] hover:border-[#C88E3E] text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-white text-xs font-mono uppercase tracking-widest transition-colors bg-[#FAF7F0] dark:bg-[#1E1B17]"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={selectedItemIds.size === 0 || isImporting}
              className="px-6 py-2.5 bg-[#C88E3E] hover:bg-[#B77D2F] disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium text-xs font-mono uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Ingesting Lossless Photos...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Ingest {selectedItemIds.size} Lossless Master Photos</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
