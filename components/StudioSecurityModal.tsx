'use client';

import React, { useState } from 'react';
import {
  Shield,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  Save,
  CheckCircle2,
} from 'lucide-react';
import {
  getStudioOwnerConfig,
  saveStudioOwnerConfig,
} from '@/lib/security';

interface StudioSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLockDeskNow: () => void;
}

const StudioSecurityModalInner: React.FC<{
  onClose: () => void;
  onLockDeskNow: () => void;
}> = ({ onClose, onLockDeskNow }) => {
  const initialConfig = getStudioOwnerConfig();
  const [currentConfig, setCurrentConfig] = useState(initialConfig);
  const isTemporary = currentConfig.masterPasscode === '123456';
  
  // Clear temporary/developer defaults so friend has clean inputs for initial setup
  const [newPasscode, setNewPasscode] = useState(isTemporary ? '' : initialConfig.masterPasscode);
  const [confirmPasscode, setConfirmPasscode] = useState(isTemporary ? '' : initialConfig.masterPasscode);
  const [masterPin, setMasterPin] = useState(initialConfig.masterPin === '123456' ? '' : initialConfig.masterPin);
  const [ownerEmail, setOwnerEmail] = useState(
    initialConfig.ownerEmail === 'Iftat100@gmail.com' ? '' : initialConfig.ownerEmail
  );
  const [showPasscode, setShowPasscode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPasscode = newPasscode.trim();
    const cleanConfirm = confirmPasscode.trim();
    const cleanPin = masterPin.trim();
    const cleanEmail = ownerEmail.trim();

    if (!cleanPasscode) {
      setErrorMessage('Please enter a new Studio Master Passcode.');
      return;
    }

    if (cleanPasscode.length < 4) {
      setErrorMessage('Passcode should be at least 4 characters long.');
      return;
    }

    if (isTemporary && cleanPasscode === '123456') {
      setErrorMessage('Please choose a personalized passcode different from the temporary 123456 code.');
      return;
    }

    if (cleanPasscode !== cleanConfirm) {
      setErrorMessage('New passcode and confirmation do not match.');
      return;
    }

    // Require email on initial setup or if temporary code was used
    if (isTemporary || !currentConfig.ownerEmail) {
      if (!cleanEmail) {
        setErrorMessage('Please enter the authorized studio email address.');
        return;
      }
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. hello@yourstudio.com).');
      return;
    }

    if (cleanPin && !/^\d{4,6}$/.test(cleanPin)) {
      setErrorMessage('Studio PIN must be 4 to 6 numeric digits.');
      return;
    }

    saveStudioOwnerConfig({
      masterPasscode: cleanPasscode,
      masterPin: cleanPin || cleanPasscode,
      ownerEmail: cleanEmail,
    });

    const updated = getStudioOwnerConfig();
    setCurrentConfig(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#E6DFD3] dark:border-[#2D261E] flex items-center justify-between bg-[#FAF7F0] dark:bg-[#1A1714]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#C88E3E]/10 border border-[#C88E3E] flex items-center justify-center text-[#C88E3E]">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-base text-[#1C1917] dark:text-[#F7F3EC]">
                {isTemporary ? 'Initial Studio Setup' : 'Studio Passcode & Security'}
              </h2>
              <p className="text-[10px] text-[#70665A] dark:text-[#A39886] font-mono uppercase tracking-wider">
                {isTemporary ? 'Set Permanent Passcode & Studio Email' : 'Owner Security & Master Desk Access'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Active Passcode Status Card */}
          <div className={`p-3 border text-xs font-mono space-y-1.5 ${
            isTemporary
              ? 'bg-[#C88E3E]/10 border-[#C88E3E]/40 text-[#9E6618] dark:text-[#E4B160]'
              : 'bg-[#FAF7F0] dark:bg-[#1E1B17] border-[#E6DFD3] dark:border-[#2D261E] text-[#70665A] dark:text-[#A39886]'
          }`}>
            <div className="flex justify-between items-center text-[10px] uppercase font-semibold">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-[#C88E3E]" />
                {isTemporary ? 'Temporary Setup Mode' : 'Current Status:'}
              </span>
              <span className="font-mono px-1.5 py-0.5 bg-white/70 dark:bg-black/40 border border-current/20">
                {isTemporary ? 'Passcode: 123456' : 'Configured'}
              </span>
            </div>
            {isTemporary ? (
              <p className="text-[10px] leading-tight opacity-90">
                Logged in with temporary setup key. Please establish your custom permanent passcode and authorized studio email below.
              </p>
            ) : (
              <p className="text-[10px] leading-tight opacity-80">
                Update your studio director passcode or recovery email anytime.
              </p>
            )}
          </div>

          {/* New Passcode Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-widest text-[#70665A] dark:text-[#A39886] flex items-center justify-between">
              <span>New Master Passcode</span>
              <span className="text-[9px] text-[#C88E3E] lowercase font-semibold">required</span>
            </label>
            <div className="relative">
              <input
                type={showPasscode ? 'text' : 'password'}
                value={newPasscode}
                onChange={(e) => {
                  setNewPasscode(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="w-full bg-[#FAF7F0] dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] px-3.5 py-2.5 text-xs font-mono text-[#1C1917] dark:text-[#F7F3EC] focus:outline-none focus:border-[#C88E3E]"
                placeholder="Enter personal studio passcode"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC] p-1"
                title={showPasscode ? 'Hide Passcode' : 'Show Passcode'}
              >
                {showPasscode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Confirm New Passcode Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-widest text-[#70665A] dark:text-[#A39886] flex items-center justify-between">
              <span>Confirm New Passcode</span>
              {confirmPasscode && confirmPasscode === newPasscode ? (
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" /> match
                </span>
              ) : confirmPasscode ? (
                <span className="text-[9px] text-red-500 font-mono">does not match</span>
              ) : null}
            </label>
            <input
              type={showPasscode ? 'text' : 'password'}
              value={confirmPasscode}
              onChange={(e) => {
                setConfirmPasscode(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              className="w-full bg-[#FAF7F0] dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] px-3.5 py-2.5 text-xs font-mono text-[#1C1917] dark:text-[#F7F3EC] focus:outline-none focus:border-[#C88E3E]"
              placeholder="Confirm new studio passcode"
            />
          </div>

          {/* Authorized Studio Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-widest text-[#70665A] dark:text-[#A39886] flex items-center justify-between">
              <span>Authorized Studio Email</span>
              <span className="text-[9px] text-[#C88E3E] lowercase font-semibold">
                {isTemporary || !currentConfig.ownerEmail ? 'required for setup' : 'optional'}
              </span>
            </label>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => {
                setOwnerEmail(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              className="w-full bg-[#FAF7F0] dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] px-3.5 py-2.5 text-xs font-mono text-[#1C1917] dark:text-[#F7F3EC] focus:outline-none focus:border-[#C88E3E]"
              placeholder="e.g. photographer@surjostudio.com"
            />
            <p className="text-[9px] text-[#70665A] dark:text-[#A39886] font-mono leading-tight">
              Client deliveries, proofs, and recovery notifications will be linked to this email address.
            </p>
          </div>

          {/* Master PIN Input (Optional 4-6 digits) */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-widest text-[#70665A] dark:text-[#A39886] flex items-center justify-between">
              <span>Quick Studio PIN (Optional)</span>
              <span className="text-[9px] opacity-70 lowercase">4-6 numeric digits</span>
            </label>
            <input
              type="text"
              maxLength={6}
              value={masterPin}
              onChange={(e) => setMasterPin(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-[#FAF7F0] dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] px-3.5 py-2 text-xs font-mono text-[#1C1917] dark:text-[#F7F3EC] focus:outline-none focus:border-[#C88E3E] tracking-widest"
              placeholder="e.g. 9021 (for fast PIN entry)"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/30 p-2.5 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {saveSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Studio credentials configured successfully!</p>
                <p className="text-[10px] opacity-80 mt-0.5">Use your new passcode and studio email to access the director desk.</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 flex items-center justify-between gap-3 border-t border-[#E6DFD3] dark:border-[#2D261E]">
            <button
              type="button"
              onClick={() => {
                onClose();
                onLockDeskNow();
              }}
              className="px-3 py-2 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-[10px] uppercase font-mono tracking-wider transition-colors flex items-center gap-1.5"
              title="Immediately lock workstation to test your new passcode"
            >
              <Lock className="w-3 h-3" />
              <span>Lock & Test</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-mono uppercase tracking-wider text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#C88E3E] hover:bg-[#B77D2F] text-white text-xs font-mono uppercase tracking-widest font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Credentials</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export const StudioSecurityModal: React.FC<StudioSecurityModalProps> = ({
  isOpen,
  onClose,
  onLockDeskNow,
}) => {
  if (!isOpen) return null;
  return <StudioSecurityModalInner onClose={onClose} onLockDeskNow={onLockDeskNow} />;
};
