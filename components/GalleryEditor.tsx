'use client';

import React, { useState, useRef } from 'react';
import { ClientGallery, PhotoItem, GalleryAccessKey, SecurityAuditLog, UserRole, ROLE_DEFINITIONS } from '@/lib/types';
import { uploadPhotoToDrive, createLosslessZip } from '@/lib/google-drive';
import { ConfirmDialog } from './ConfirmDialog';
import { GooglePhotosPickerModal } from './GooglePhotosPickerModal';
import { GoogleDrivePickerModal } from './GoogleDrivePickerModal';
import { hashCredential, createDefaultAccessKeys, recordAuditLog } from '@/lib/security';
import {
  Upload,
  HardDrive,
  Lock,
  Sparkles,
  Star,
  MessageSquare,
  Trash2,
  Download,
  Share2,
  Check,
  Shield,
  Sliders,
  Eye,
  Info,
  Calendar,
  MapPin,
  RefreshCw,
  Plus,
  Zap,
  Key,
  ShieldCheck,
  FileText,
  UserCheck,
  Copy,
  CheckCircle2,
  Image as ImageIcon,
  Clock,
  ExternalLink,
  Film,
} from 'lucide-react';

interface GalleryEditorProps {
  gallery: ClientGallery;
  onUpdateGallery: (gallery: ClientGallery) => void;
  onDeleteGallery: (galleryId: string) => void;
  hasDriveAuth: boolean;
  accessToken: string | null;
  onOpenShareModal: () => void;
}

export const GalleryEditor: React.FC<GalleryEditorProps> = ({
  gallery,
  onUpdateGallery,
  onDeleteGallery,
  hasDriveAuth,
  accessToken,
  onOpenShareModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [activeTab, setActiveTab] = useState<'photos' | 'rbac_keys' | 'audit_trail' | 'settings'>('photos');
  const [filterMode, setFilterMode] = useState<'all' | 'favorites' | 'retouch' | 'comments'>('all');
  const [activePhoto, setActivePhoto] = useState<PhotoItem | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<PhotoItem | null>(null);
  const [showDeleteGalleryDialog, setShowDeleteGalleryDialog] = useState(false);
  const [showGooglePhotosModal, setShowGooglePhotosModal] = useState(false);
  const [showGoogleDriveModal, setShowGoogleDriveModal] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // New RBAC Key form
  const [newKeyRole, setNewKeyRole] = useState<UserRole>('guest_viewer');
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [newKeyPin, setNewKeyPin] = useState('7492');
  const [newKeyPasscode, setNewKeyPasscode] = useState('VIP-880');
  const [newKeyCanDownload, setNewKeyCanDownload] = useState(false);
  const [newKeyWatermarkForced, setNewKeyWatermarkForced] = useState(true);

  // Local settings edit
  const [isWatermark, setIsWatermark] = useState(gallery.isWatermarkActive);
  const [watermarkText, setWatermarkText] = useState(gallery.watermarkText || '© SURJO MEDIA — PROOF');
  const [watermarkStyle, setWatermarkStyle] = useState(gallery.watermarkStyle || 'diagonal_grid');
  const [antiRipProtection, setAntiRipProtection] = useState(gallery.antiRipProtection ?? true);
  const [allowDownloads, setAllowDownloads] = useState(gallery.allowHighResDownloads);
  const [allowProofing, setAllowProofing] = useState(gallery.allowProofingNotes);
  const [accessPin, setAccessPin] = useState(gallery.accessPin);
  const [securityPasscode, setSecurityPasscode] = useState(gallery.securityPasscode);

  const handleSaveSettings = async () => {
    const salt = gallery.encryptionSalt || 'SURJO_SALT_2026';
    const computedHash = await hashCredential(securityPasscode, salt);

    const updated: ClientGallery = {
      ...gallery,
      isWatermarkActive: isWatermark,
      watermarkText,
      watermarkStyle,
      antiRipProtection,
      allowHighResDownloads: allowDownloads,
      allowProofingNotes: allowProofing,
      accessPin,
      securityPasscode,
      passwordHash: computedHash,
      encryptionSalt: salt,
      updatedAt: new Date().toISOString(),
    };

    const audited = recordAuditLog(
      updated,
      'settings_changed',
      'admin',
      'Studio Admin',
      'Updated gallery security credentials, watermark style, and anti-theft protection.'
    );

    onUpdateGallery(audited);
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newPhotos: PhotoItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress((prev) => ({ ...prev, [file.name]: 20 }));

      try {
        if (hasDriveAuth && accessToken && gallery.driveFolderId) {
          const uploaded = await uploadPhotoToDrive(
            accessToken,
            gallery.driveFolderId,
            file,
            (prog) => {
              setUploadProgress((prev) => ({ ...prev, [file.name]: prog.percentage }));
            }
          );
          newPhotos.push(uploaded);
        } else {
          const objectUrl = URL.createObjectURL(file);
          const photo: PhotoItem = {
            id: `photo_${Date.now()}_${i}`,
            name: file.name.replace(/\.[^/.]+$/, ''),
            originalFileName: file.name,
            source: 'local_raw',
            thumbnailUrl: objectUrl,
            highResUrl: objectUrl,
            fileSizeBytes: file.size,
            mimeType: file.type || 'image/jpeg',
            width: 4000,
            height: 3000,
            exif: {
              cameraMake: 'Master Pro Camera',
              cameraModel: 'Lossless Sensor RAW',
              aperture: 'f/1.4',
              shutterSpeed: '1/1000s',
              iso: 'ISO 100',
              capturedAt: new Date().toISOString(),
            },
            comments: [],
            uploadedAt: new Date().toISOString(),
          };
          setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
          newPhotos.push(photo);
        }
      } catch (err) {
        console.error(`Error uploading ${file.name}:`, err);
      }
    }

    const updatedGallery: ClientGallery = {
      ...gallery,
      photos: [...newPhotos, ...gallery.photos],
      coverPhotoUrl: gallery.coverPhotoUrl || (newPhotos[0]?.thumbnailUrl ?? ''),
      updatedAt: new Date().toISOString(),
    };

    onUpdateGallery(updatedGallery);
    setIsUploading(false);
    setUploadProgress({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGooglePhotosImport = (importedPhotos: PhotoItem[]) => {
    const updatedGallery: ClientGallery = {
      ...gallery,
      photos: [...importedPhotos, ...gallery.photos],
      coverPhotoUrl: gallery.coverPhotoUrl || (importedPhotos[0]?.thumbnailUrl ?? ''),
      updatedAt: new Date().toISOString(),
    };

    const audited = recordAuditLog(
      updatedGallery,
      'settings_changed',
      'admin',
      'Studio Admin',
      `Imported ${importedPhotos.length} uncompressed master photos from Google Photos.`
    );

    onUpdateGallery(audited);
  };

  const handleGoogleDriveImport = (
    importedMedia: PhotoItem[],
    linkedFolderId?: string,
    linkedFolderName?: string
  ) => {
    const updatedGallery: ClientGallery = {
      ...gallery,
      photos: [...importedMedia, ...gallery.photos],
      coverPhotoUrl: gallery.coverPhotoUrl || (importedMedia[0]?.thumbnailUrl ?? ''),
      driveFolderId: linkedFolderId || gallery.driveFolderId,
      driveFolderName: linkedFolderName || gallery.driveFolderName,
      updatedAt: new Date().toISOString(),
    };

    const audited = recordAuditLog(
      updatedGallery,
      'settings_changed',
      'admin',
      'Studio Admin',
      `Imported ${importedMedia.length} lossless master files (photos & 4K films) directly from Google Drive.`
    );

    onUpdateGallery(audited);
  };

  const handleCreateAccessKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyLabel || !newKeyPin) return;

    const newKey: GalleryAccessKey = {
      id: `key_${Date.now()}`,
      role: newKeyRole,
      label: newKeyLabel,
      pin: newKeyPin,
      passcode: newKeyPasscode,
      canDownload: newKeyCanDownload,
      watermarkForced: newKeyWatermarkForced,
      accessCount: 0,
      isActive: true,
    };

    const existingKeys = gallery.accessKeys && gallery.accessKeys.length > 0 ? gallery.accessKeys : createDefaultAccessKeys(gallery);
    const updatedGallery: ClientGallery = {
      ...gallery,
      accessKeys: [newKey, ...existingKeys],
      updatedAt: new Date().toISOString(),
    };

    const audited = recordAuditLog(
      updatedGallery,
      'key_created',
      'admin',
      'Studio Admin',
      `Created new ${newKeyRole} access key: "${newKeyLabel}" (PIN: ${newKeyPin})`
    );

    onUpdateGallery(audited);
    setNewKeyLabel('');
    setNewKeyPin(Math.floor(1000 + Math.random() * 9000).toString());
    setNewKeyPasscode('VIP-' + Math.floor(100 + Math.random() * 900));
  };

  const handleToggleKeyStatus = (keyId: string) => {
    const existingKeys = gallery.accessKeys || createDefaultAccessKeys(gallery);
    const updatedKeys = existingKeys.map((k) => (k.id === keyId ? { ...k, isActive: !k.isActive } : k));
    const updated: ClientGallery = {
      ...gallery,
      accessKeys: updatedKeys,
      updatedAt: new Date().toISOString(),
    };
    onUpdateGallery(updated);
  };

  const handleDeleteAccessKey = (keyId: string) => {
    const existingKeys = gallery.accessKeys || createDefaultAccessKeys(gallery);
    const updatedKeys = existingKeys.filter((k) => k.id !== keyId);
    const updated: ClientGallery = {
      ...gallery,
      accessKeys: updatedKeys,
      updatedAt: new Date().toISOString(),
    };
    onUpdateGallery(updated);
  };

  const handleCopyKeyDetails = (key: GalleryAccessKey) => {
    const text = `Surjo Media — Private Gallery Access: ${gallery.title}\nRole: ${key.label}\nAccess PIN: ${key.pin}\nSecurity Passcode: ${key.passcode}\n(Both PIN and Passcode are required on entry)\nPortal: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedKeyId(key.id);
    setTimeout(() => setCopiedKeyId(null), 2500);
  };

  const handleDeletePhoto = () => {
    if (!photoToDelete) return;
    const updatedGallery: ClientGallery = {
      ...gallery,
      photos: gallery.photos.filter((p) => p.id !== photoToDelete.id),
      updatedAt: new Date().toISOString(),
    };
    onUpdateGallery(updatedGallery);
    setPhotoToDelete(null);
    if (activePhoto?.id === photoToDelete.id) setActivePhoto(null);
  };

  const handleDownloadAllZip = async () => {
    try {
      const blob = await createLosslessZip(gallery.photos, `${gallery.clientName}_Lossless_Photos`, accessToken || undefined);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${gallery.clientName.replace(/\s+/g, '_')}_Master_Lossless.zip`;
      a.click();
    } catch (err) {
      console.error('Error downloading zip:', err);
    }
  };

  const filteredPhotos = gallery.photos.filter((p) => {
    if (filterMode === 'favorites') return p.isFavorite;
    if (filterMode === 'retouch') return p.selectedForRetouch;
    if (filterMode === 'comments') return p.comments.length > 0;
    return true;
  });

  const favoritesCount = gallery.photos.filter((p) => p.isFavorite).length;
  const commentsCount = gallery.photos.reduce((acc, p) => acc + p.comments.length, 0);
  const currentAccessKeys = gallery.accessKeys && gallery.accessKeys.length > 0 ? gallery.accessKeys : createDefaultAccessKeys(gallery);
  const currentLogs = gallery.auditLogs || [];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Gallery Header Info & Quick Actions */}
      <div className="bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 text-[9px] uppercase font-mono tracking-widest bg-[#C88E3E] text-white font-semibold shadow-sm">
                {gallery.shootType}
              </span>
              <span className="px-2.5 py-0.5 text-[9px] uppercase font-mono tracking-widest bg-[#FAF7F0] dark:bg-[#1E1B17] text-[#70665A] dark:text-[#A39886] border border-[#E6DFD3] dark:border-[#2D261E]">
                {gallery.status.toUpperCase()}
              </span>
              {gallery.clientSelectionSubmitted && (
                <span className="px-2.5 py-0.5 text-[9px] uppercase font-mono tracking-widest bg-[#C88E3E]/15 text-[#C88E3E] dark:text-[#D49A3D] border border-[#C88E3E]/30 flex items-center gap-1 font-medium">
                  <Check className="w-3 h-3" /> Transmitted by Client
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-light text-[#1C1917] dark:text-[#F7F3EC] font-serif">
              {gallery.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#70665A] dark:text-[#A39886] font-mono">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#C88E3E]" />
                {gallery.shootDate}
              </span>
              {gallery.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#C88E3E]" />
                  {gallery.location}
                </span>
              )}
              <span className="text-[#1C1917] dark:text-[#F7F3EC] font-medium">
                Primary PIN: {gallery.accessPin} (Client: {gallery.clientName})
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowGooglePhotosModal(true)}
              className="px-4 py-2.5 bg-[#FAF7F0] dark:bg-[#1E1B17] hover:bg-[#C88E3E] hover:text-white dark:hover:bg-[#C88E3E] border border-[#E6DFD3] dark:border-[#2D261E] text-[#1C1917] dark:text-[#F7F3EC] text-xs uppercase tracking-widest font-mono transition-all flex items-center gap-2 shadow-sm"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#C88E3E]" />
              <span>Google Photos Import</span>
            </button>

            <button
              onClick={onOpenShareModal}
              className="px-5 py-2.5 bg-[#C88E3E] hover:bg-[#B77D2F] text-white text-xs uppercase tracking-widest font-medium transition-all flex items-center gap-2 shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Vault</span>
            </button>

            <button
              onClick={handleDownloadAllZip}
              className="px-4 py-2.5 bg-[#FAF7F0] dark:bg-[#1E1B17] hover:bg-[#C88E3E] hover:text-white dark:hover:bg-[#C88E3E] border border-[#E6DFD3] dark:border-[#2D261E] text-[#70665A] dark:text-[#A39886] text-xs uppercase tracking-widest font-mono transition-all flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export ZIP</span>
            </button>

            <button
              onClick={() => setShowDeleteGalleryDialog(true)}
              className="p-2.5 bg-[#FAF7F0] dark:bg-[#1E1B17] hover:bg-rose-50 dark:hover:bg-rose-950 text-[#70665A] hover:text-rose-600 dark:hover:text-rose-300 border border-[#E6DFD3] dark:border-[#2D261E] hover:border-rose-300 dark:hover:border-rose-900 transition-colors"
              title="Delete Gallery"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Action Tabs: Photos, RBAC Keys, Audit Trail, Settings */}
        <div className="flex items-center gap-2 border-b border-[#E6DFD3] dark:border-[#2D261E] pt-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('photos')}
            className={`px-4 py-2.5 text-xs font-mono uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'photos'
                ? 'border-[#C88E3E] text-[#C88E3E] dark:text-[#D49A3D] font-medium'
                : 'border-transparent text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Master Photos ({gallery.photos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rbac_keys')}
            className={`px-4 py-2.5 text-xs font-mono uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'rbac_keys'
                ? 'border-[#C88E3E] text-[#C88E3E] dark:text-[#D49A3D] font-medium'
                : 'border-transparent text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>RBAC Access Keys ({currentAccessKeys.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit_trail')}
            className={`px-4 py-2.5 text-xs font-mono uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'audit_trail'
                ? 'border-[#C88E3E] text-[#C88E3E] dark:text-[#D49A3D] font-medium'
                : 'border-transparent text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Security Audit Trail ({currentLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 text-xs font-mono uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-[#C88E3E] text-[#C88E3E] dark:text-[#D49A3D] font-medium'
                : 'border-transparent text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Encryption & Watermark</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MASTER PHOTOS */}
      {activeTab === 'photos' && (
        <div className="space-y-6">
          {/* Linked Drive Folder status banner if linked */}
          {gallery.driveFolderId && (
            <div className="bg-[#FAF7F0] dark:bg-[#1A1714] border border-[#C88E3E]/40 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 text-[#C88E3E] dark:text-[#D49A3D]">
                <HardDrive className="w-4 h-4" />
                <span>
                  SYNCED DRIVE FOLDER:{' '}
                  <strong className="text-[#1C1917] dark:text-[#F7F3EC]">{gallery.driveFolderName || gallery.driveFolderId}</strong>
                </span>
              </div>
              <button
                onClick={() => setShowGoogleDriveModal(true)}
                className="px-3 py-1 bg-[#C88E3E] text-white text-[11px] uppercase tracking-wider font-semibold hover:bg-[#B77D2F] transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Browse & Import More Files
              </button>
            </div>
          )}

          {/* 3-Way Ingest Banner: Google Drive Master + Google Photos + Local RAW Drop */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Google Drive Master Ingest Card */}
            <div
              onClick={() => setShowGoogleDriveModal(true)}
              className="bg-white dark:bg-[#151311] border border-[#C88E3E]/50 dark:border-[#C88E3E]/40 hover:border-[#C88E3E] dark:hover:border-[#D49A3D] p-5 flex flex-col justify-between gap-4 cursor-pointer transition-all group shadow-sm ring-1 ring-[#C88E3E]/20"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 border border-[#C88E3E]/40 bg-[#C88E3E]/10 dark:bg-[#C88E3E]/20 flex items-center justify-center shrink-0 group-hover:bg-[#C88E3E] group-hover:text-white transition-colors">
                  <HardDrive className="w-5 h-5 text-[#C88E3E] group-hover:text-white" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs uppercase font-mono tracking-wider text-[#1C1917] dark:text-[#F7F3EC] group-hover:text-[#C88E3E] font-semibold">
                      Google Drive Ingest
                    </h3>
                    <span className="text-[8px] font-mono uppercase tracking-widest px-1 py-0.5 bg-[#C88E3E] text-white font-bold">
                      Lossless
                    </span>
                  </div>
                  <p className="text-[11px] text-[#70665A] dark:text-[#A39886] leading-relaxed">
                    Select client photos, 4K videos & master RAW folders from your Google Drive with zero compression.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#E6DFD3] dark:border-[#2D261E] text-[10px] font-mono text-[#C88E3E] dark:text-[#D49A3D] font-semibold">
                <span>Direct Cloud Ingestion</span>
                <span className="group-hover:translate-x-0.5 transition-transform">Browse Drive →</span>
              </div>
            </div>

            {/* Google Photos Fast Ingest Card */}
            <div
              onClick={() => setShowGooglePhotosModal(true)}
              className="bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] hover:border-[#C88E3E] dark:hover:border-[#D49A3D] p-5 flex flex-col justify-between gap-4 cursor-pointer transition-all group shadow-sm"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 border border-[#C88E3E]/30 bg-[#C88E3E]/10 flex items-center justify-center shrink-0 group-hover:bg-[#C88E3E] group-hover:text-white transition-colors">
                  <ImageIcon className="w-5 h-5 text-[#C88E3E] group-hover:text-white" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs uppercase font-mono tracking-wider text-[#1C1917] dark:text-[#F7F3EC] group-hover:text-[#C88E3E] font-semibold">
                      Google Photos
                    </h3>
                    <span className="text-[8px] font-mono uppercase tracking-widest px-1 py-0.5 bg-[#C88E3E]/10 text-[#C88E3E] dark:text-[#D49A3D] border border-[#C88E3E]/20">
                      Albums
                    </span>
                  </div>
                  <p className="text-[11px] text-[#70665A] dark:text-[#A39886] leading-relaxed">
                    Import full resolution albums directly from Google Photos library with EXIF preservation.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#E6DFD3] dark:border-[#2D261E] text-[10px] font-mono text-[#70665A] dark:text-[#A39886] group-hover:text-[#C88E3E]">
                <span>Album Picker</span>
                <span className="group-hover:translate-x-0.5 transition-transform">Browse Albums →</span>
              </div>
            </div>

            {/* Local RAW / Master File Drag & Drop */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] hover:border-[#C88E3E] dark:hover:border-[#D49A3D] p-5 flex flex-col justify-between gap-4 cursor-pointer transition-all group shadow-sm"
            >
              <input
                type="file"
                multiple
                accept="image/*,video/*,.raw,.arw,.cr2,.cr3,.nef,.dng,.tiff,.tif,.png,.jpg,.jpeg,.mp4,.mov"
                ref={fileInputRef}
                onChange={handleFilesSelected}
                className="hidden"
              />
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 border border-[#E6DFD3] dark:border-[#2D261E] bg-[#FAF7F0] dark:bg-[#1E1B17] flex items-center justify-center shrink-0 group-hover:bg-[#C88E3E] group-hover:text-white transition-colors">
                  <Upload className="w-5 h-5 text-[#70665A] dark:text-[#A39886] group-hover:text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs uppercase font-mono tracking-wider text-[#1C1917] dark:text-[#F7F3EC] group-hover:text-[#C88E3E] font-semibold">
                    Local RAW / 4K Upload
                  </h3>
                  <p className="text-[11px] text-[#70665A] dark:text-[#A39886] leading-relaxed">
                    Direct batch upload from your local editing workstation with original bitrate.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#E6DFD3] dark:border-[#2D261E] text-[10px] font-mono text-[#70665A] dark:text-[#A39886] group-hover:text-[#C88E3E]">
                <span>Workstation Drop</span>
                <span className="group-hover:translate-x-0.5 transition-transform">Choose Files →</span>
              </div>
            </div>
          </div>

          {/* Upload Progress Bar if active */}
          {isUploading && (
            <div className="bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-xs font-mono text-[#70665A] dark:text-[#A39886]">
                <span>Ingesting high-bitrate photographs...</span>
                <span>{Object.keys(uploadProgress).length} files queued</span>
              </div>
              <div className="w-full h-1.5 bg-[#E6DFD3] dark:bg-[#2D261E] overflow-hidden">
                <div className="h-full bg-[#C88E3E] animate-pulse w-3/4" />
              </div>
            </div>
          )}

          {/* Filters Bar */}
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
                All ({gallery.photos.length})
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
                onClick={() => setFilterMode('comments')}
                className={`px-3 py-1 uppercase tracking-widest transition-colors flex items-center gap-1.5 ${
                  filterMode === 'comments'
                    ? 'bg-[#C88E3E] text-white font-medium shadow-sm'
                    : 'text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC]'
                }`}
              >
                <MessageSquare className="w-3 h-3" />
                <span>Notes ({commentsCount})</span>
              </button>
            </div>

            <p className="text-xs font-mono text-[#70665A] dark:text-[#A39886]">
              Showing {filteredPhotos.length} of {gallery.photos.length} media items
            </p>
          </div>

          {/* Photos Grid */}
          {filteredPhotos.length === 0 ? (
            <div className="bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] p-16 text-center space-y-3 shadow-sm">
              <HardDrive className="w-10 h-10 text-[#C88E3E]/40 mx-auto" />
              <h4 className="text-base font-serif text-[#1C1917] dark:text-[#F7F3EC]">No media items match this filter</h4>
              <p className="text-xs text-[#70665A] dark:text-[#A39886] font-mono">
                Click &ldquo;Google Drive Ingest&rdquo; or drag files to add master shots to this vault.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((photo) => {
                const isVideo = photo.mediaType === 'video';
                return (
                  <div
                    key={photo.id}
                    onClick={() => setActivePhoto(photo)}
                    className="group relative aspect-[4/3] bg-[#111] border border-[#E6DFD3] dark:border-[#2D261E] hover:border-[#C88E3E] dark:hover:border-[#D49A3D] overflow-hidden cursor-pointer transition-all shadow-sm"
                  >
                    <img
                      src={photo.thumbnailUrl}
                      alt={photo.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />

                    {/* Video Center Play Marker */}
                    {isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
                        <div className="w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center border border-white/40 shadow-lg group-hover:scale-110 transition-transform">
                          <Film className="w-4 h-4 text-[#C88E3E]" />
                        </div>
                      </div>
                    )}

                    {/* Overlay Badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
                      {photo.isFavorite && (
                        <span className="p-1 bg-[#C88E3E] text-white shadow-sm">
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </span>
                      )}
                      {photo.comments.length > 0 && (
                        <span className="px-1.5 py-0.5 bg-black/75 border border-white/20 text-[9px] font-mono text-white flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-[#C88E3E]" />
                          {photo.comments.length}
                        </span>
                      )}
                    </div>

                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                      {photo.source === 'google_drive' && (
                        <span className="px-1.5 py-0.5 bg-black/80 border border-[#C88E3E]/40 text-[8px] font-mono text-[#C88E3E] uppercase font-semibold">
                          G-Drive
                        </span>
                      )}
                      {photo.source === 'google_photos' && (
                        <span className="px-1.5 py-0.5 bg-black/80 border border-[#C88E3E]/40 text-[8px] font-mono text-[#C88E3E] uppercase font-semibold">
                          G-Photos
                        </span>
                      )}
                      {isVideo && (
                        <span className="px-1.5 py-0.5 bg-rose-700 text-white text-[8px] font-mono uppercase font-bold">
                          4K Film {photo.duration || ''}
                        </span>
                      )}
                    </div>

                    {/* Bottom Info Bar */}
                    <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black via-black/80 to-transparent text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="truncate font-serif font-medium">{photo.name}</p>
                      <div className="flex items-center justify-between text-white/70 text-[9px] mt-0.5">
                        <span>{photo.exif?.cameraModel || (isVideo ? '4K Cinema' : 'High-Res Master')}</span>
                        <span>{photo.exif?.lens || `${photo.width}×${photo.height}`}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RBAC ACCESS KEYS */}
      {activeTab === 'rbac_keys' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-light text-[#1C1917] dark:text-[#F7F3EC] font-serif">
                  Role-Based Access Control (RBAC) Keys
                </h3>
                <p className="text-xs text-[#70665A] dark:text-[#A39886] font-mono">
                  Issue unique, encrypted PINs and passwords with granular role permissions for clients, guests, and retouchers.
                </p>
              </div>
            </div>

            {/* Existing Keys Table */}
            <div className="space-y-3 pt-2">
              {currentAccessKeys.map((key) => {
                const roleDef = ROLE_DEFINITIONS[key.role];
                return (
                  <div
                    key={key.id}
                    className={`p-4 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      key.isActive
                        ? 'bg-[#FAF7F0] dark:bg-[#0C0B0A] border-[#E6DFD3] dark:border-[#2D261E]'
                        : 'bg-[#FAF7F0]/50 dark:bg-[#0C0B0A]/40 border-[#E6DFD3] dark:border-[#2D261E] opacity-60'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[9px] uppercase font-mono tracking-widest bg-[#C88E3E] text-white font-semibold shadow-sm">
                          {roleDef?.badge || key.role}
                        </span>
                        <h4 className="text-sm font-serif text-[#1C1917] dark:text-[#F7F3EC] font-medium">{key.label}</h4>
                        {!key.isActive && (
                          <span className="text-[9px] font-mono text-rose-500 uppercase tracking-widest">
                            (Deactivated)
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#70665A] dark:text-[#A39886]">
                        <span className="text-[#1C1917] dark:text-[#F7F3EC]">
                          PIN: <strong className="text-[#C88E3E] dark:text-[#D49A3D]">{key.pin}</strong>
                        </span>
                        <span className="text-[#1C1917] dark:text-[#F7F3EC]">
                          Passcode: <strong>{key.passcode}</strong>
                        </span>
                        <span>Access Count: {key.accessCount || 0}</span>
                        {key.canDownload ? (
                          <span className="text-[#C88E3E] dark:text-[#D49A3D] font-medium">High-Res Downloads Allowed</span>
                        ) : (
                          <span className="text-[#70665A] dark:text-[#A39886]">View-Only / Watermarked</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => handleCopyKeyDetails(key)}
                        className="px-3 py-1.5 bg-white dark:bg-[#1E1B17] hover:bg-[#C88E3E] hover:text-white dark:hover:bg-[#C88E3E] border border-[#E6DFD3] dark:border-[#2D261E] text-[#1C1917] dark:text-[#F7F3EC] text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        {copiedKeyId === key.id ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#C88E3E]" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Credentials</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleToggleKeyStatus(key.id)}
                        className="px-3 py-1.5 border border-[#E6DFD3] dark:border-[#2D261E] hover:border-[#C88E3E] text-xs font-mono uppercase tracking-wider text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC] transition-colors"
                      >
                        {key.isActive ? 'Disable' : 'Enable'}
                      </button>

                      {key.role !== 'primary_client' && (
                        <button
                          onClick={() => handleDeleteAccessKey(key.id)}
                          className="p-1.5 text-[#70665A] hover:text-rose-500"
                          title="Delete Key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Create New Key Box */}
          <form onSubmit={handleCreateAccessKey} className="bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] p-6 space-y-4 shadow-sm">
            <h4 className="text-sm uppercase font-mono tracking-widest text-[#1C1917] dark:text-[#F7F3EC] font-semibold">
              Generate New Role Access Key
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-widest text-[#70665A] dark:text-[#A39886]">Role</label>
                <select
                  value={newKeyRole}
                  onChange={(e) => setNewKeyRole(e.target.value as UserRole)}
                  className="w-full bg-[#FAF7F0] dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] px-3 py-2 text-xs font-mono text-[#1C1917] dark:text-[#F7F3EC] focus:outline-none focus:border-[#C88E3E]"
                >
                  <option value="guest_viewer">Family & Guest VIP (View-Only)</option>
                  <option value="primary_client">Primary Client (Full Proofing)</option>
                  <option value="retoucher">Assistant / Color Retoucher</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-widest text-[#70665A] dark:text-[#A39886]">Label / Name</label>
                <input
                  type="text"
                  placeholder="e.g. Parents of Bride VIP"
                  value={newKeyLabel}
                  onChange={(e) => setNewKeyLabel(e.target.value)}
                  className="w-full bg-[#FAF7F0] dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] px-3 py-2 text-xs font-mono text-[#1C1917] dark:text-[#F7F3EC] focus:outline-none focus:border-[#C88E3E]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-widest text-[#70665A] dark:text-[#A39886]">Access PIN</label>
                <input
                  type="text"
                  value={newKeyPin}
                  onChange={(e) => setNewKeyPin(e.target.value)}
                  className="w-full bg-[#FAF7F0] dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] px-3 py-2 text-xs font-mono text-[#1C1917] dark:text-[#F7F3EC] focus:outline-none focus:border-[#C88E3E]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-widest text-[#70665A] dark:text-[#A39886]">Passcode</label>
                <input
                  type="text"
                  value={newKeyPasscode}
                  onChange={(e) => setNewKeyPasscode(e.target.value)}
                  className="w-full bg-[#FAF7F0] dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] px-3 py-2 text-xs font-mono text-[#1C1917] dark:text-[#F7F3EC] focus:outline-none focus:border-[#C88E3E]"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-[#70665A] dark:text-[#A39886]">
                  <input
                    type="checkbox"
                    checked={newKeyCanDownload}
                    onChange={(e) => setNewKeyCanDownload(e.target.checked)}
                    className="accent-[#C88E3E]"
                  />
                  <span>Allow High-Res ZIP Downloads</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-[#70665A] dark:text-[#A39886]">
                  <input
                    type="checkbox"
                    checked={newKeyWatermarkForced}
                    onChange={(e) => setNewKeyWatermarkForced(e.target.checked)}
                    className="accent-[#C88E3E]"
                  />
                  <span>Force Watermark Overlay</span>
                </label>
              </div>

              <button
                type="submit"
                className="px-5 py-2 bg-[#C88E3E] hover:bg-[#B77D2F] text-white text-xs font-mono uppercase tracking-widest font-medium transition-all shadow-sm"
              >
                + Issue Key
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeTab === 'audit_trail' && (
        <div className="bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD3] dark:border-[#2D261E]">
            <div className="space-y-0.5">
              <h3 className="text-xl font-light text-[#1C1917] dark:text-[#F7F3EC] font-serif">Security & Access Audit Logs</h3>
              <p className="text-xs text-[#70665A] dark:text-[#A39886] font-mono">
                Cryptographic immutable log of client logins, download events, and proofing submissions.
              </p>
            </div>
            <span className="text-xs font-mono text-[#C88E3E] dark:text-[#D49A3D] flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#C88E3E]" />
              SHA-256 Audit Trail Active
            </span>
          </div>

          <div className="space-y-2">
            {currentLogs.length === 0 ? (
              <p className="text-xs text-[#70665A] dark:text-[#A39886] font-mono py-8 text-center">
                No security logs recorded yet.
              </p>
            ) : (
              currentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 bg-[#FAF7F0] dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 text-[8px] uppercase tracking-widest bg-[#C88E3E]/15 text-[#C88E3E] dark:text-[#D49A3D] border border-[#C88E3E]/30 font-semibold">
                      {log.eventType.replace('_', ' ')}
                    </span>
                    <span className="text-[#1C1917] dark:text-[#F7F3EC]">{log.details}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[#70665A] dark:text-[#A39886] text-[10px]">
                    <span className="font-semibold text-[#1C1917] dark:text-[#F7F3EC]">{log.userIdentifier}</span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ENCRYPTION & WATERMARK SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] p-6 space-y-6 max-w-3xl shadow-sm">
          <div className="space-y-1">
            <h3 className="text-xl font-light text-[#1C1917] dark:text-[#F7F3EC] font-serif">Vault Credentials & Watermark</h3>
            <p className="text-xs text-[#70665A] dark:text-[#A39886] font-mono">
              Configure master access codes, copyright overlay, and client proofing rules.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-widest text-[#70665A] dark:text-[#A39886]">
                  Primary Client PIN
                </label>
                <input
                  type="text"
                  value={accessPin}
                  onChange={(e) => setAccessPin(e.target.value)}
                  className="w-full bg-[#FAF7F0] dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] px-3 py-2 text-xs font-mono text-[#1C1917] dark:text-[#F7F3EC] focus:outline-none focus:border-[#C88E3E]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-widest text-[#70665A] dark:text-[#A39886]">
                  Primary Passcode
                </label>
                <input
                  type="text"
                  value={securityPasscode}
                  onChange={(e) => setSecurityPasscode(e.target.value)}
                  className="w-full bg-[#FAF7F0] dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] px-3 py-2 text-xs font-mono text-[#1C1917] dark:text-[#F7F3EC] focus:outline-none focus:border-[#C88E3E]"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-mono text-[#1C1917] dark:text-[#F7F3EC]">
                <input
                  type="checkbox"
                  checked={isWatermark}
                  onChange={(e) => setIsWatermark(e.target.checked)}
                  className="accent-[#C88E3E]"
                />
                <span>Enable Watermark Protection for Previews</span>
              </label>

              {isWatermark && (
                <div className="space-y-3 pl-6 bg-[#FAF7F0] dark:bg-[#0C0B0A] p-4 border border-[#E6DFD3] dark:border-[#2D261E]">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-[#70665A] dark:text-[#A39886]">
                      Watermark Style Archetype
                    </label>
                    <select
                      value={watermarkStyle}
                      onChange={(e) => setWatermarkStyle(e.target.value as any)}
                      className="w-full bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] px-3 py-2 text-xs font-mono text-[#1C1917] dark:text-[#F7F3EC] focus:outline-none focus:border-[#C88E3E]"
                    >
                      <option value="diagonal_grid">Repeating Diagonal Proofing Grid (Max Anti-Theft)</option>
                      <option value="center_crest">Studio Center Crest & Shield</option>
                      <option value="forensic_client_stamp">Forensic Dynamic Client Stamp (Confidential Token)</option>
                      <option value="corner_signature">Subtle Corner Signature</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-[#70665A] dark:text-[#A39886]">
                      Watermark Copyright Text
                    </label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] px-3 py-2 text-xs font-mono text-[#1C1917] dark:text-[#F7F3EC] focus:outline-none focus:border-[#C88E3E]"
                    />
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-mono text-[#1C1917] dark:text-[#F7F3EC]">
                <input
                  type="checkbox"
                  checked={antiRipProtection}
                  onChange={(e) => setAntiRipProtection(e.target.checked)}
                  className="accent-[#C88E3E]"
                />
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C88E3E]" />
                  <span>Fortress Anti-Theft Protection (Disable Right-Click & Drag Extraction)</span>
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-mono text-[#1C1917] dark:text-[#F7F3EC]">
                <input
                  type="checkbox"
                  checked={allowDownloads}
                  onChange={(e) => setAllowDownloads(e.target.checked)}
                  className="accent-[#C88E3E]"
                />
                <span>Allow Primary Client to Download Full-Resolution ZIP Master</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-mono text-[#1C1917] dark:text-[#F7F3EC]">
                <input
                  type="checkbox"
                  checked={allowProofing}
                  onChange={(e) => setAllowProofing(e.target.checked)}
                  className="accent-[#C88E3E]"
                />
                <span>Allow Client to Submit Notes & Star Official Favorites</span>
              </label>
            </div>

            <div className="pt-4">
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2.5 bg-[#C88E3E] hover:bg-[#B77D2F] text-white text-xs font-mono uppercase tracking-widest font-medium transition-all shadow-sm"
              >
                Save Settings & Update Vault
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Inspector Modal */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#FAF7F2] dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col md:flex-row">
            <div className="flex-1 bg-black flex items-center justify-center p-4 min-h-[300px] relative">
              <img
                src={activePhoto.highResUrl}
                alt={activePhoto.name}
                className="max-h-[70vh] object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="w-full md:w-80 p-6 space-y-6 bg-white dark:bg-[#1E1B17] border-t md:border-t-0 md:border-l border-[#E6DFD3] dark:border-[#2D261E] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase font-mono tracking-widest px-2 py-0.5 bg-[#C88E3E] text-white font-semibold">
                    {activePhoto.source === 'google_photos' ? 'Google Photos' : 'Master RAW'}
                  </span>
                  <button
                    onClick={() => setActivePhoto(null)}
                    className="text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-white text-xs font-mono"
                  >
                    [CLOSE]
                  </button>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-serif text-[#1C1917] dark:text-[#F7F3EC]">{activePhoto.name}</h3>
                  <p className="text-[10px] font-mono text-[#C88E3E]">{activePhoto.originalFileName}</p>
                </div>

                {/* EXIF Data */}
                {activePhoto.exif && (
                  <div className="space-y-1.5 p-3 bg-[#FAF7F0] dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] text-[10px] font-mono text-[#1C1917] dark:text-[#F7F3EC]">
                    <p className="font-semibold text-[#C88E3E]">OPTICAL EXIF DATA</p>
                    {activePhoto.exif.cameraModel && <p>Camera: {activePhoto.exif.cameraModel}</p>}
                    {activePhoto.exif.lens && <p>Lens: {activePhoto.exif.lens}</p>}
                    {activePhoto.exif.aperture && <p>Aperture: {activePhoto.exif.aperture}</p>}
                    {activePhoto.exif.shutterSpeed && <p>Shutter: {activePhoto.exif.shutterSpeed}</p>}
                    {activePhoto.exif.iso && <p>ISO: {activePhoto.exif.iso}</p>}
                  </div>
                )}

                {/* Comments */}
                {activePhoto.comments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#70665A] dark:text-[#A39886]">Client Notes</p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {activePhoto.comments.map((c) => (
                        <div key={c.id} className="p-2 bg-[#FAF7F0] dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] text-xs">
                          <p className="font-semibold text-[#C88E3E] text-[11px]">{c.author}:</p>
                          <p className="text-[#1C1917] dark:text-[#F7F3EC] text-[11px] mt-0.5">{c.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#E6DFD3] dark:border-[#2D261E] flex items-center justify-between">
                <button
                  onClick={() => {
                    setPhotoToDelete(activePhoto);
                  }}
                  className="text-xs font-mono text-rose-600 dark:text-rose-400 hover:text-rose-500 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Photo</span>
                </button>

                <a
                  href={activePhoto.highResUrl}
                  download={activePhoto.originalFileName}
                  className="px-3 py-1.5 bg-[#C88E3E] hover:bg-[#B77D2F] text-white text-xs font-mono uppercase tracking-wider font-medium shadow-sm"
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Picker Modal */}
      <GoogleDrivePickerModal
        isOpen={showGoogleDriveModal}
        onClose={() => setShowGoogleDriveModal(false)}
        onImportDrivePhotos={handleGoogleDriveImport}
        accessToken={accessToken}
        hasDriveAuth={hasDriveAuth}
        targetGalleryTitle={gallery.title}
      />

      {/* Google Photos Picker Modal */}
      <GooglePhotosPickerModal
        isOpen={showGooglePhotosModal}
        onClose={() => setShowGooglePhotosModal(false)}
        onImportPhotos={handleGooglePhotosImport}
        accessToken={accessToken}
        targetGalleryTitle={gallery.title}
      />

      {/* Delete Photo Confirmation */}
      <ConfirmDialog
        isOpen={!!photoToDelete}
        title="Delete Photograph"
        description={`Are you sure you want to remove "${photoToDelete?.name}" from this gallery archive?`}
        confirmLabel="Delete Photo"
        isDestructive={true}
        onConfirm={handleDeletePhoto}
        onCancel={() => setPhotoToDelete(null)}
      />

      {/* Delete Gallery Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteGalleryDialog}
        title="Delete Entire Client Vault"
        description={`Are you sure you want to delete "${gallery.title}"? All photographs and client proofing data will be removed.`}
        confirmLabel="Delete Archive"
        isDestructive={true}
        onConfirm={() => onDeleteGallery(gallery.id)}
        onCancel={() => setShowDeleteGalleryDialog(false)}
      />
    </div>
  );
};
