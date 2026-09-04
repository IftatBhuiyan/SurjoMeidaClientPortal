'use client';

import React, { useState } from 'react';
import { ClientGallery } from '@/lib/types';
import { Copy, Check, X, Mail, Lock, KeyRound, ExternalLink, ShieldCheck } from 'lucide-react';

interface ShareGalleryModalProps {
  gallery: ClientGallery;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareGalleryModal: React.FC<ShareGalleryModalProps> = ({ gallery, isOpen, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPasscode, setCopiedPasscode] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const customVaultUrl = `${currentOrigin}?vault=${gallery.id}`;

  const emailDraft = `Dear ${gallery.clientName},

Your private online photo & film vault "${gallery.title}" is now ready for viewing in original lossless master resolution!

Custom Private Vault Link: ${customVaultUrl}
Security Passcode: ${gallery.securityPasscode}
4-Digit PIN: ${gallery.accessPin}

Instructions for Accessing Your Vault:
1. Click your custom vault link above (locked exclusively to your archive).
2. Enter your Security Passcode (${gallery.securityPasscode}) or 4-digit PIN (${gallery.accessPin}) on the secure client gate.
3. Browse, star (⭐) your favorite frames for final album production, leave retouching notes, and download original master files.

Best regards,
Surjo Media Photography & Film Studio`;

  const copyToClipboard = (text: string, type: 'link' | 'passcode' | 'pin' | 'email') => {
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
    } else if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-left">
      <div className="bg-[#FAF7F2] dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-white p-1.5 hover:bg-[#FAF7F0] dark:hover:bg-[#1E1B17] transition-colors"
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
            Strictly isolated private link. The client can only access their specific archive and must enter their passcode.
          </p>
        </div>

        {/* Strict Isolation Notice */}
        <div className="bg-[#FAF7F0] dark:bg-[#0C0B0A] border border-[#C88E3E]/40 p-3.5 flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-[#C88E3E] shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed text-[#70665A] dark:text-[#A39886]">
            <span className="font-semibold text-[#1C1917] dark:text-[#F7F3EC] block">Strict Vault Isolation Active:</span>
            When {gallery.clientName} opens this link, they are directly locked to their own vault. They cannot see or switch to other client archives, nor can they access the Studio Desk.
          </div>
        </div>

        {/* Credentials Card */}
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
                onClick={() => copyToClipboard(gallery.securityPasscode, 'passcode')}
                className="text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-white text-xs p-1 transition-colors"
                title="Copy Passcode"
              >
                {copiedPasscode ? <Check className="w-3.5 h-3.5 text-[#C88E3E]" /> : <Copy className="w-3.5 h-3.5" />}
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
                onClick={() => copyToClipboard(gallery.accessPin, 'pin')}
                className="text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-white text-xs p-1 transition-colors"
                title="Copy PIN"
              >
                {copiedPin ? <Check className="w-3.5 h-3.5 text-[#C88E3E]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Dedicated Custom Link */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[#1C1917] dark:text-[#F7F3EC] flex items-center justify-between font-mono">
            <span className="text-[10px] uppercase tracking-widest font-semibold">Primary Client Vault URL</span>
            <span className="text-[9px] text-[#C88E3E] dark:text-[#D49A3D] font-mono">Isolated for {gallery.clientName}</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={customVaultUrl}
              className="w-full bg-white dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] px-3.5 py-2.5 text-xs font-mono text-[#1C1917] dark:text-[#F7F3EC] focus:outline-none shadow-sm"
            />
            <button
              onClick={() => copyToClipboard(customVaultUrl, 'link')}
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
        </div>

        {/* Issued Sub-Keys (Family VIPs & Retouchers) */}
        {gallery.accessKeys && gallery.accessKeys.length > 0 && (
          <div className="space-y-2.5 pt-1">
            <label className="text-[10px] uppercase tracking-widest font-mono text-[#70665A] dark:text-[#A39886] flex items-center justify-between">
              <span>Role-Based Sub-Access Keys ({gallery.accessKeys.length})</span>
              <span className="text-[#C88E3E]">Multi-Tier Access</span>
            </label>
            <div className="space-y-2">
              {gallery.accessKeys.map((key) => {
                const keyUrl = `${currentOrigin}?vault=${gallery.id}&role=${key.role}&pin=${key.pin}`;
                return (
                  <div
                    key={key.id}
                    className="p-3 bg-white dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#1C1917] dark:text-[#F7F3EC]">{key.label}</span>
                        <span className={`px-1.5 py-0.2 text-[8px] uppercase tracking-wider ${
                          key.role === 'primary_client'
                            ? 'bg-[#C88E3E] text-white'
                            : key.role === 'guest_viewer'
                            ? 'bg-blue-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}>
                          {key.role.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#70665A] dark:text-[#A39886]">
                        PIN: <span className="font-bold text-[#1C1917] dark:text-[#F7F3EC]">{key.pin}</span> | Passcode: <span className="text-[#C88E3E] font-bold">{key.passcode}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`Access Link: ${keyUrl}\nPIN: ${key.pin}\nPasscode: ${key.passcode}`);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="px-3 py-1.5 bg-[#FAF7F0] dark:bg-[#1E1B17] hover:bg-[#C88E3E] hover:text-white dark:hover:bg-[#C88E3E] border border-[#E6DFD3] dark:border-[#2D261E] text-[10px] uppercase tracking-wider font-medium transition-colors self-start sm:self-auto shrink-0 flex items-center gap-1.5"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Credentials</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Personalized Email Draft */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-widest font-mono text-[#70665A] dark:text-[#A39886] flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-[#C88E3E]" />
              Client Delivery Invitation Text
            </label>
            <button
              onClick={() => copyToClipboard(emailDraft, 'email')}
              className="text-xs text-[#C88E3E] dark:text-[#D49A3D] hover:underline font-mono uppercase tracking-widest flex items-center gap-1 font-semibold"
            >
              {copiedEmail ? <Check className="w-3 h-3 text-[#C88E3E]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedEmail ? 'Copied' : 'Copy Full Invite'}</span>
            </button>
          </div>
          <textarea
            readOnly
            rows={5}
            value={emailDraft}
            className="w-full bg-white dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] p-3 text-xs font-mono text-[#70665A] dark:text-[#A39886] leading-relaxed focus:outline-none resize-none shadow-sm"
          />
        </div>

        {/* Direct Test Portal Button */}
        <div className="pt-2 flex justify-between items-center">
          <span className="text-[10px] font-mono text-[#70665A] dark:text-[#A39886]">
            Passcode required on entry
          </span>
          <a
            href={customVaultUrl}
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
