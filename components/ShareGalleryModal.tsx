'use client';

import React, { useState, useEffect, useId } from 'react';
import { ClientGallery } from '@/lib/types';
import { buildVaultUrl, slugify, VaultLinkFormat } from '@/lib/vault-resolver';
import {
  Copy,
  Check,
  X,
  Mail,
  Lock,
  KeyRound,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Eye,
  Edit3,
  Share2,
} from 'lucide-react';
import Image from 'next/image';

interface ShareGalleryModalProps {
  gallery: ClientGallery;
  isOpen: boolean;
  onClose: () => void;
  onUpdateGallery?: (updated: ClientGallery) => void;
}

export const ShareGalleryModal: React.FC<ShareGalleryModalProps> = ({
  gallery,
  isOpen,
  onClose,
  onUpdateGallery,
}) => {
  const [linkFormat, setLinkFormat] = useState<VaultLinkFormat>('short');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPasscode, setCopiedPasscode] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedSms, setCopiedSms] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Vanity slug customization
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const defaultSlug = gallery.vanitySlug || slugify(gallery.title) || gallery.id;
  const [editedSlug, setEditedSlug] = useState<string>('');
  const activeSlug = editedSlug || defaultSlug;

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Ensure the shared gallery is synced to the server when the share modal is viewed
  useEffect(() => {
    if (isOpen && gallery) {
      fetch('/api/vaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gallery),
      }).catch((err) => console.warn('Share modal vault sync error:', err));
    }
  }, [isOpen, gallery]);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const currentVaultUrl = buildVaultUrl(
    { ...gallery, vanitySlug: activeSlug },
    currentOrigin,
    linkFormat
  );

  const cleanShortUrl = buildVaultUrl(
    { ...gallery, vanitySlug: activeSlug },
    currentOrigin,
    'short'
  );

  const handleSaveSlug = () => {
    const clean = slugify(editedSlug || defaultSlug);
    if (!clean) return;
    setEditedSlug(clean);
    setIsEditingSlug(false);
    if (onUpdateGallery) {
      onUpdateGallery({
        ...gallery,
        vanitySlug: clean,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const smsText = `✨ Your private photography vault is ready!\n"${gallery.title}"\n\n🔒 Access Vault: ${cleanShortUrl}\n• 4-Digit PIN: ${gallery.accessPin}\n• Passcode: ${gallery.securityPasscode}\n\n— Surjo Media Studio`;

  const emailDraft = `Dear ${gallery.clientName},

Your private online photo & film archive "${gallery.title}" is now ready for viewing in original lossless master resolution!

✨ Private Client Vault: ${cleanShortUrl}
• 4-Digit Access PIN: ${gallery.accessPin}
• Security Passcode: ${gallery.securityPasscode}

Instructions for Accessing Your Vault (Two-Layer Security):
1. Open your private vault link above (locked exclusively to your archive).
2. Enter both your 4-digit PIN (${gallery.accessPin}) and Security Passcode (${gallery.securityPasscode}) on the secure client gate.
3. Browse, star (⭐) your favorite frames for final album production, leave retouching notes, and download original master files.

Warm regards,
Surjo Media Photography & Film Studio`;

  const copyToClipboard = (
    text: string,
    type: 'link' | 'passcode' | 'pin' | 'sms' | 'email'
  ) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else if (type === 'passcode') {
        setCopiedPasscode(true);
        setTimeout(() => setCopiedPasscode(false), 2000);
      } else if (type === 'pin') {
        setCopiedPin(true);
        setTimeout(() => setCopiedPin(false), 2000);
      } else if (type === 'sms') {
        setCopiedSms(true);
        setTimeout(() => setCopiedSms(false), 2000);
      } else if (type === 'email') {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      }
    }
  };

  const handleShareWhatsApp = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(smsText)}`;
    window.open(waUrl, '_blank');
  };

  const previewCoverUrl =
    gallery.coverPhotoUrl ||
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=90';

  if (!isOpen) return null;

  return (
    <div
      id="share-gallery-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in text-left"
    >
      <div
        id="share-gallery-modal-container"
        className="bg-[#FAF7F2] dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[92vh] overflow-y-auto"
      >
        <button
          id="btn-close-share-modal"
          onClick={onClose}
          className="absolute top-5 right-5 text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-white p-1.5 hover:bg-[#FAF7F0] dark:hover:bg-[#1E1B17] transition-colors"
          aria-label="Close Share Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[#C88E3E]">
            <ShieldCheck className="w-4 h-4 text-[#C88E3E]" />
            <span className="text-[10px] uppercase font-mono tracking-widest font-semibold text-[#C88E3E] dark:text-[#D49A3D]">
              Encrypted Client Access Pass
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-light text-[#1C1917] dark:text-[#F7F3EC] font-serif">
            Share {gallery.clientName}&apos;s Vault
          </h2>
          <p className="text-xs text-[#70665A] dark:text-[#A39886] font-sans">
            Client-isolated URL with automated rich social previews and two-factor passkey gate.
          </p>
        </div>

        {/* 1. Primary Clean Link with Format Selector */}
        <div className="space-y-2.5 bg-white dark:bg-[#0C0B0A] p-4 border border-[#E6DFD3] dark:border-[#2D261E]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-[10px] uppercase tracking-widest font-mono font-semibold text-[#1C1917] dark:text-[#F7F3EC] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C88E3E]" />
              <span>Client Share Link</span>
            </label>

            {/* Link Format Switcher */}
            <div className="flex items-center gap-1 bg-[#FAF7F0] dark:bg-[#1E1B17] p-0.5 border border-[#E6DFD3] dark:border-[#2D261E] text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setLinkFormat('short')}
                className={`px-2.5 py-1 transition-colors ${
                  linkFormat === 'short'
                    ? 'bg-[#C88E3E] text-white font-semibold'
                    : 'text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-white'
                }`}
              >
                /v/ Short Link
              </button>
              <button
                type="button"
                onClick={() => setLinkFormat('clean')}
                className={`px-2.5 py-1 transition-colors ${
                  linkFormat === 'clean'
                    ? 'bg-[#C88E3E] text-white font-semibold'
                    : 'text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-white'
                }`}
              >
                /vault/ Path
              </button>
              <button
                type="button"
                onClick={() => setLinkFormat('classic')}
                className={`px-2.5 py-1 transition-colors ${
                  linkFormat === 'classic'
                    ? 'bg-[#C88E3E] text-white font-semibold'
                    : 'text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-white'
                }`}
              >
                ?vault= Query
              </button>
            </div>
          </div>

          {/* Clean URL Input & Copy Button */}
          <div className="flex items-center gap-2">
            <input
              id="input-vault-share-url"
              type="text"
              readOnly
              value={currentVaultUrl}
              className="w-full bg-[#FAF7F0] dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] px-3.5 py-2.5 text-xs font-mono text-[#1C1917] dark:text-[#F7F3EC] focus:outline-none select-all"
            />
            <button
              id="btn-copy-vault-link"
              type="button"
              onClick={() => copyToClipboard(currentVaultUrl, 'link')}
              className="px-4 py-2.5 bg-[#C88E3E] hover:bg-[#B77D2F] text-white font-medium text-xs uppercase tracking-widest font-mono shrink-0 transition-all flex items-center gap-1.5 shadow-sm"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          {/* Vanity Slug Customizer */}
          <div className="pt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono border-t border-[#E6DFD3]/60 dark:border-[#2D261E]/60">
            <div className="flex items-center gap-1.5 text-[#70665A] dark:text-[#A39886]">
              <span>Slug:</span>
              {isEditingSlug ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[#C88E3E]">/v/</span>
                  <input
                    type="text"
                    value={editedSlug}
                    onChange={(e) => setEditedSlug(e.target.value)}
                    className="px-2 py-0.5 bg-[#FAF7F0] dark:bg-[#1E1B17] border border-[#C88E3E] text-[#1C1917] dark:text-[#F7F3EC] text-xs font-mono focus:outline-none w-44"
                    placeholder={defaultSlug}
                  />
                  <button
                    type="button"
                    onClick={handleSaveSlug}
                    className="px-2 py-0.5 bg-[#C88E3E] text-white text-[10px] uppercase tracking-wider font-semibold hover:bg-[#B77D2F]"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditedSlug('');
                      setIsEditingSlug(false);
                    }}
                    className="px-1.5 py-0.5 text-[#70665A] dark:text-[#A39886] text-[10px] hover:text-[#1C1917] dark:hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <span className="font-semibold text-[#1C1917] dark:text-[#F7F3EC]">
                  {activeSlug}
                </span>
              )}
            </div>

            {!isEditingSlug && (
              <button
                type="button"
                onClick={() => {
                  setEditedSlug(activeSlug);
                  setIsEditingSlug(true);
                }}
                className="inline-flex items-center gap-1 text-[#C88E3E] dark:text-[#D49A3D] hover:underline text-[10px] uppercase tracking-wider font-semibold"
              >
                <Edit3 className="w-3 h-3" />
                <span>Customize Slug</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Rich Social Link Preview Card (The requested Preview feature) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-widest font-mono text-[#70665A] dark:text-[#A39886] flex items-center gap-1.5 font-semibold">
              <Eye className="w-3.5 h-3.5 text-[#C88E3E]" />
              <span>Live Social Link Preview (iMessage, WhatsApp & Slack)</span>
            </label>
            <span className="text-[9px] font-mono text-[#C88E3E] dark:text-[#D49A3D]">
              OpenGraph 1200×630 Embed
            </span>
          </div>

          <div className="bg-[#0C0B0A] border border-[#2D261E] overflow-hidden shadow-md max-w-md mx-auto sm:max-w-none">
            <div className="relative h-44 sm:h-52 w-full bg-[#151311] overflow-hidden">
              <Image
                src={previewCoverUrl}
                alt={gallery.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0C0B0A] via-black/40 to-transparent" />

              {/* Floating badges on preview */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#C88E3E] text-white text-[9px] font-mono uppercase tracking-widest font-semibold shadow-sm">
                  Surjo Media Studio
                </span>
                <span className="px-2 py-0.5 bg-black/70 backdrop-blur-sm border border-white/20 text-white text-[9px] font-mono uppercase tracking-widest">
                  🔒 Encrypted Vault
                </span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 text-left">
                <p className="text-[10px] font-mono text-[#C88E3E] uppercase tracking-wider">
                  {gallery.clientName} • {gallery.shootType}
                </p>
                <h4 className="text-base sm:text-lg font-serif text-[#F7F3EC] leading-tight drop-shadow-md">
                  {gallery.title}
                </h4>
              </div>
            </div>

            <div className="p-3 bg-[#151311] border-t border-[#2D261E] flex items-center justify-between text-[11px] font-mono">
              <div className="space-y-0.5 text-left">
                <div className="text-[#A39886] truncate max-w-xs sm:max-w-sm">
                  Private Lossless Master Photo & Film Vault
                </div>
                <div className="text-[#70665A] text-[10px] truncate">
                  {currentOrigin.replace(/^https?:\/\//, '')}/v/{activeSlug}
                </div>
              </div>
              <span className="text-[10px] text-[#C88E3E] font-semibold tracking-wider shrink-0 uppercase">
                Passkey Gate
              </span>
            </div>
          </div>
        </div>

        {/* 3. Credentials Card (Two-Factor Passkey) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-white dark:bg-[#0C0B0A] p-4 border border-[#E6DFD3] dark:border-[#2D261E] shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-[#70665A] dark:text-[#A39886] uppercase tracking-widest font-mono flex items-center gap-1.5 font-medium">
              <Lock className="w-3 h-3 text-[#C88E3E]" />
              Security Passcode
            </span>
            <div className="flex items-center justify-between bg-[#FAF7F0] dark:bg-[#1E1B17] px-3 py-2 border border-[#E6DFD3] dark:border-[#2D261E]">
              <span className="font-mono text-sm font-bold text-[#C88E3E] dark:text-[#D49A3D] tracking-wider">
                {gallery.securityPasscode}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(gallery.securityPasscode, 'passcode')}
                className="text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-white text-xs p-1 transition-colors"
                title="Copy Passcode"
              >
                {copiedPasscode ? (
                  <Check className="w-3.5 h-3.5 text-[#C88E3E]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-[#70665A] dark:text-[#A39886] uppercase tracking-widest font-mono flex items-center gap-1.5 font-medium">
              <KeyRound className="w-3 h-3 text-[#C88E3E]" />
              Client Access PIN
            </span>
            <div className="flex items-center justify-between bg-[#FAF7F0] dark:bg-[#1E1B17] px-3 py-2 border border-[#E6DFD3] dark:border-[#2D261E]">
              <span className="font-mono text-base font-bold text-[#1C1917] dark:text-[#F7F3EC] tracking-widest">
                {gallery.accessPin}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(gallery.accessPin, 'pin')}
                className="text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-white text-xs p-1 transition-colors"
                title="Copy PIN"
              >
                {copiedPin ? (
                  <Check className="w-3.5 h-3.5 text-[#C88E3E]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 4. One-Click Quick Share Text & WhatsApp */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-widest font-mono text-[#70665A] dark:text-[#A39886] flex items-center gap-1.5 font-semibold">
              <Smartphone className="w-3 h-3 text-[#C88E3E]" />
              <span>Quick Share Message (SMS / WhatsApp / iMessage)</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-2.5 py-1 bg-[#25D366] text-white hover:bg-[#1EBE5D] text-[10px] uppercase tracking-wider font-mono font-semibold flex items-center gap-1 transition-colors"
              >
                <Share2 className="w-3 h-3" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(smsText, 'sms')}
                className="text-xs text-[#C88E3E] dark:text-[#D49A3D] hover:underline font-mono uppercase tracking-widest flex items-center gap-1 font-semibold"
              >
                {copiedSms ? (
                  <Check className="w-3 h-3 text-[#C88E3E]" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedSms ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>
          </div>

          <textarea
            readOnly
            rows={4}
            value={smsText}
            className="w-full bg-white dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] p-3 text-xs font-mono text-[#70665A] dark:text-[#A39886] leading-relaxed focus:outline-none resize-none shadow-sm"
          />
        </div>

        {/* 5. Role-Based Sub-Access Keys (if present) */}
        {gallery.accessKeys && gallery.accessKeys.length > 0 && (
          <div className="space-y-2 pt-1">
            <label className="text-[10px] uppercase tracking-widest font-mono text-[#70665A] dark:text-[#A39886] flex items-center justify-between font-semibold">
              <span>Sub-Access Roles & VIP Keys ({gallery.accessKeys.length})</span>
              <span className="text-[#C88E3E]">Multi-Tier Gate</span>
            </label>
            <div className="space-y-2">
              {gallery.accessKeys.map((key) => {
                const subUrl = buildVaultUrl(
                  { ...gallery, vanitySlug: activeSlug },
                  currentOrigin,
                  'short',
                  { role: key.role, pin: key.pin }
                );
                return (
                  <div
                    key={key.id}
                    className="p-3 bg-white dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#1C1917] dark:text-[#F7F3EC]">
                          {key.label}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 text-[8px] uppercase tracking-wider ${
                            key.role === 'primary_client'
                              ? 'bg-[#C88E3E] text-white'
                              : key.role === 'guest_viewer'
                              ? 'bg-blue-600 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {key.role.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#70665A] dark:text-[#A39886]">
                        PIN: <span className="font-bold text-[#1C1917] dark:text-[#F7F3EC]">{key.pin}</span> | Passcode: <span className="text-[#C88E3E] font-bold">{key.passcode}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        copyToClipboard(
                          `Access Link: ${subUrl}\nPIN: ${key.pin}\nPasscode: ${key.passcode}`,
                          'link'
                        );
                      }}
                      className="px-3 py-1.5 bg-[#FAF7F0] dark:bg-[#1E1B17] hover:bg-[#C88E3E] hover:text-white dark:hover:bg-[#C88E3E] border border-[#E6DFD3] dark:border-[#2D261E] text-[10px] uppercase tracking-wider font-medium transition-colors self-start sm:self-auto shrink-0 flex items-center gap-1.5"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Key Link</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. Formal Email Invitation Text */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-widest font-mono text-[#70665A] dark:text-[#A39886] flex items-center gap-1.5 font-semibold">
              <Mail className="w-3 h-3 text-[#C88E3E]" />
              <span>Formal Studio Email Invitation</span>
            </label>
            <button
              type="button"
              onClick={() => copyToClipboard(emailDraft, 'email')}
              className="text-xs text-[#C88E3E] dark:text-[#D49A3D] hover:underline font-mono uppercase tracking-widest flex items-center gap-1 font-semibold"
            >
              {copiedEmail ? (
                <Check className="w-3 h-3 text-[#C88E3E]" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span>{copiedEmail ? 'Copied' : 'Copy Full Invite'}</span>
            </button>
          </div>
          <textarea
            readOnly
            rows={4}
            value={emailDraft}
            className="w-full bg-white dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] p-3 text-xs font-mono text-[#70665A] dark:text-[#A39886] leading-relaxed focus:outline-none resize-none shadow-sm"
          />
        </div>

        {/* Modal Bottom Actions */}
        <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <span className="text-[10px] font-mono text-[#70665A] dark:text-[#A39886]">
            Strict client vault isolation active • PIN & Passcode required
          </span>
          <a
            id="link-test-vault-new-tab"
            href={currentVaultUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1E1B17] hover:bg-[#C88E3E] hover:text-white dark:hover:bg-[#C88E3E] border border-[#E6DFD3] dark:border-[#2D261E] text-[#1C1917] dark:text-[#F7F3EC] text-xs uppercase tracking-widest font-mono transition-all shadow-sm"
          >
            <span>Test Client Link in New Tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
