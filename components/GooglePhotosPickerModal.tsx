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
} from '@/lib/google-photos';
import {
  X,
  Image as ImageIcon,
  CheckCircle2,
  Layers,
  Sparkles,
  Download,
  Info,
  Calendar,
  Camera,
  Check,
  RefreshCw,
  FolderOpen,
  ArrowLeft,
  ShieldCheck,
  Zap,
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
  accessToken,
  targetGalleryTitle,
}) => {
  const [albums, setAlbums] = useState<GooglePhotosAlbum[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [mediaItems, setMediaItems] = useState<GooglePhotosMediaItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [qualityMode, setQualityMode] = useState<'lossless' | 'high_res'>('lossless');

  const selectAlbum = async (albumId: string) => {
    setSelectedAlbumId(albumId);
    setSelectedItemIds(new Set());
    try {
      setIsLoading(true);
      const items = await listGooglePhotosMediaItems(albumId, accessToken);
      setMediaItems(items);
      // Auto-select all by default for easy batch ingestion
      setSelectedItemIds(new Set(items.map((i) => i.id)));
    } catch (err) {
      console.error('Failed to load Google Photos media items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlbums = async () => {
    try {
      setIsLoading(true);
      const list = await listGooglePhotosAlbums(accessToken);
      setAlbums(list);
      if (list.length > 0) {
        const firstAlbumId = list[0].id;
        setSelectedAlbumId(firstAlbumId);
        const items = await listGooglePhotosMediaItems(firstAlbumId, accessToken);
        setMediaItems(items);
        setSelectedItemIds(new Set(items.map((i) => i.id)));
      }
    } catch (err) {
      console.error('Failed to load Google Photos albums:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    if (!isOpen) return;

    const fetchAlbums = async () => {
      setIsLoading(true);
      try {
        const list = await listGooglePhotosAlbums(accessToken);
        if (!isCancelled) {
          setAlbums(list);
          if (list.length > 0) {
            const firstAlbumId = list[0].id;
            setSelectedAlbumId(firstAlbumId);
            const items = await listGooglePhotosMediaItems(firstAlbumId, accessToken);
            if (!isCancelled) {
              setMediaItems(items);
              setSelectedItemIds(new Set(items.map((i) => i.id)));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load Google Photos albums:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchAlbums();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, accessToken]);

  const toggleItemSelection = (id: string) => {
    const next = new Set(selectedItemIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedItemIds(next);
  };

  const selectAll = () => {
    if (selectedItemIds.size === mediaItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(mediaItems.map((i) => i.id)));
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

  const currentAlbum = albums.find((a) => a.id === selectedAlbumId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in text-left">
      <div className="bg-[#FAF7F2] dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#E6DFD3] dark:border-[#2D261E] flex items-center justify-between bg-white dark:bg-[#0C0B0A]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 border border-[#C88E3E]/30 bg-[#C88E3E]/10 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-[#C88E3E]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-light text-[#1C1917] dark:text-[#F7F3EC] font-serif tracking-wide">
                  Direct Google Photos Master Importer
                </h2>
                <span className="text-[9px] uppercase font-mono tracking-widest px-2 py-0.5 bg-[#C88E3E]/15 text-[#C88E3E] dark:text-[#D49A3D] border border-[#C88E3E]/30 font-semibold">
                  Lossless Stream
                </span>
              </div>
              <p className="text-xs text-[#70665A] dark:text-[#A39886] font-sans">
                Direct ingest into &ldquo;<span className="text-[#1C1917] dark:text-[#F7F3EC] font-medium">{targetGalleryTitle}</span>&rdquo; with 100% original RAW/JPEG EXIF optics preservation.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-white p-2 hover:bg-[#FAF7F0] dark:hover:bg-[#1E1B17] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quality & Security Banner */}
        <div className="bg-[#FAF7F0] dark:bg-[#1E1B17] px-6 py-2.5 border-b border-[#E6DFD3] dark:border-[#2D261E] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#70665A] dark:text-[#A39886] font-mono text-[11px]">
            <ShieldCheck className="w-4 h-4 text-[#C88E3E]" />
            <span>Zero-Compression Protocol: Google Photos Original =d Parameter Active</span>
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

        {/* Content Body: Sidebar Albums + Media Grid */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[420px]">
          {/* Albums Sidebar */}
          <div className="w-full md:w-72 border-r border-[#E6DFD3] dark:border-[#2D261E] p-4 space-y-3 bg-white dark:bg-[#0C0B0A] overflow-y-auto shrink-0">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6DFD3] dark:border-[#2D261E]">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#70665A] dark:text-[#A39886] flex items-center gap-1.5 font-medium">
                <FolderOpen className="w-3.5 h-3.5 text-[#C88E3E]" />
                Google Photos Albums
              </span>
              <button
                onClick={loadAlbums}
                className="text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-white p-1"
                title="Refresh albums"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-1.5">
              {albums.map((album) => {
                const isSelected = album.id === selectedAlbumId;
                return (
                  <button
                    key={album.id}
                    onClick={() => selectAlbum(album.id)}
                    className={`w-full p-2.5 text-left border transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'bg-[#C88E3E] text-white border-[#C88E3E] shadow-sm'
                        : 'bg-[#FAF7F0] dark:bg-[#151311] border-[#E6DFD3] dark:border-[#2D261E] text-[#1C1917] dark:text-[#F7F3EC] hover:border-[#C88E3E]'
                    }`}
                  >
                    <div className="w-10 h-10 bg-[#151515] overflow-hidden shrink-0 border border-black/10">
                      {album.coverPhotoBaseUrl ? (
                        <img
                          src={`${album.coverPhotoBaseUrl}?auto=format&fit=crop&w=120&q=80`}
                          alt={album.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/40">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-serif truncate font-normal leading-tight">
                        {album.title}
                      </p>
                      <p className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-white/80' : 'text-[#70665A] dark:text-[#A39886]'}`}>
                        {album.mediaItemsCount} photos
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photos Selection Grid */}
          <div className="flex-1 p-5 overflow-y-auto bg-[#FAF7F2] dark:bg-[#151311] flex flex-col space-y-4">
            {currentAlbum && (
              <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD3] dark:border-[#2D261E]">
                <div className="space-y-0.5">
                  <h3 className="text-base font-light text-[#1C1917] dark:text-[#F7F3EC] font-serif">
                    {currentAlbum.title}
                  </h3>
                  <p className="text-[11px] text-[#70665A] dark:text-[#A39886] font-mono">
                    Showing {mediaItems.length} photos • {selectedItemIds.size} selected for gallery ingest
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAll}
                    className="px-3 py-1.5 border border-[#E6DFD3] dark:border-[#2D261E] hover:border-[#C88E3E] text-[#1C1917] dark:text-[#F7F3EC] text-xs font-mono uppercase tracking-widest transition-colors bg-white dark:bg-[#0C0B0A] shadow-sm"
                  >
                    {selectedItemIds.size === mediaItems.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-[#70665A] dark:text-[#A39886] space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-[#C88E3E]" />
                <span className="text-xs font-mono uppercase tracking-widest">
                  Querying Google Photos High-Bitrate Index...
                </span>
              </div>
            ) : mediaItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-[#70665A] dark:text-[#A39886] space-y-2">
                <ImageIcon className="w-10 h-10 text-[#C88E3E]/40" />
                <span className="text-xs font-mono uppercase tracking-widest">
                  No images found in this Google Photos album.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {mediaItems.map((item) => {
                  const isSelected = selectedItemIds.has(item.id);
                  const isUnsplash = item.baseUrl.includes('unsplash.com');
                  const thumb = isUnsplash
                    ? `${item.baseUrl}?auto=format&fit=crop&w=600&q=85`
                    : `${item.baseUrl}=w600-h400`;
                  const photoMeta = item.mediaMetadata?.photo || {};

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleItemSelection(item.id)}
                      className={`group relative aspect-[4/3] bg-[#111] border overflow-hidden cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#C88E3E] ring-2 ring-[#C88E3E]/50'
                          : 'border-[#E6DFD3] dark:border-[#2D261E] hover:border-[#C88E3E]'
                      }`}
                    >
                      <img
                        src={thumb}
                        alt={item.filename}
                        className={`w-full h-full object-cover transition-all duration-300 ${
                          isSelected ? 'opacity-95 scale-[1.02]' : 'opacity-80 group-hover:opacity-100'
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
                            {item.mediaMetadata.width}×{item.mediaMetadata.height}
                          </span>
                          {photoMeta.cameraModel && <span>{photoMeta.cameraModel}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-[#E6DFD3] dark:border-[#2D261E] bg-white dark:bg-[#0C0B0A] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#70665A] dark:text-[#A39886]">
            <Zap className="w-4 h-4 text-[#C88E3E]" />
            <span>
              {selectedItemIds.size} of {mediaItems.length} photos ready for uncompressed ingestion
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
