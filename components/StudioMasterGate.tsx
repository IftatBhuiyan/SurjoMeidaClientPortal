'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  LogIn,
  Check,
  Mail,
} from 'lucide-react';
import {
  verifyStudioOwnerCredentials,
  activateStudioOwnerSession,
  getStudioOwnerConfig,
  subscribeStudioOwnerConfig,
  getStudioOwnerConfigSnapshot,
  getStudioOwnerConfigServerSnapshot,
} from '@/lib/security';
import { googleSignIn, isGoogleVerificationError, firebaseProjectId } from '@/lib/firebase';
import { User } from 'firebase/auth';

interface StudioMasterGateProps {
  onAuthenticated: (user: User | null, isFirstLoginWithTemp?: boolean) => void;
  onSwitchToClient: () => void;
  currentUser: User | null;
}

export const StudioMasterGate: React.FC<StudioMasterGateProps> = ({
  onAuthenticated,
  onSwitchToClient,
  currentUser,
}) => {
  const ownerConfig = useSyncExternalStore(
    subscribeStudioOwnerConfig,
    getStudioOwnerConfigSnapshot,
    getStudioOwnerConfigServerSnapshot
  );

  const [customEmail, setCustomEmail] = useState<string | null>(null);
  const emailInput = customEmail !== null ? customEmail : (ownerConfig.ownerEmail || '');

  const [credentialInput, setCredentialInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberWorkstation, setRememberWorkstation] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showGoogleHelp, setShowGoogleHelp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const config = getStudioOwnerConfig();
    if (config.ownerEmail) {
      passwordInputRef.current?.focus();
    } else {
      emailInputRef.current?.focus();
    }
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await verifyStudioOwnerCredentials(emailInput, credentialInput);
      if (result.success) {
        activateStudioOwnerSession(rememberWorkstation);
        const isUsingTemp = credentialInput.trim() === '123456' || ownerConfig.masterPasscode === '123456' || !ownerConfig.ownerEmail;
        onAuthenticated(currentUser, isUsingTemp);
      } else {
        setErrorMessage(result.error || 'Invalid credentials. Access denied.');
      }
    } catch {
      setErrorMessage('Security verification error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsGoogleSigningIn(true);
    setErrorMessage(null);
    setShowGoogleHelp(false);
    try {
      // Basic sign in (does not request sensitive drive scopes)
      const res = await googleSignIn({ withDrive: false });
      if (res && res.user) {
        activateStudioOwnerSession(rememberWorkstation);
        const isUsingTemp = ownerConfig.masterPasscode === '123456' || !ownerConfig.ownerEmail;
        onAuthenticated(res.user, isUsingTemp);
      }
    } catch (err: unknown) {
      console.error('Owner Google Sign-in error:', err);
      const errCode = (err as { code?: string })?.code;
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errCode === 'auth/popup-closed-by-user' || errMsg.includes('popup-closed-by-user')) {
        return;
      }
      if (errCode === 'auth/unauthorized-domain' || errMsg.toLowerCase().includes('unauthorized-domain')) {
        const domain = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'clients.surjomedia.com';
        setErrorMessage(
          `Domain "${domain}" is not authorized for Google Sign-In. Please add "${domain}" to your Firebase Console under Authentication -> Settings -> Authorized domains.`
        );
      } else if (isGoogleVerificationError(err) || errMsg.includes('403') || errMsg.includes('access_denied')) {
        setShowGoogleHelp(true);
        setErrorMessage(
          'Google blocked sign-in (Error 403: access_denied). Your Google Cloud OAuth is in "Testing" mode and requires adding tester emails.'
        );
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : 'Google authentication failed. Please try again or use the Master Passcode.'
        );
      }
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] max-w-md w-full p-8 sm:p-10 shadow-2xl space-y-6 text-center backdrop-blur-xl relative overflow-hidden">
        {/* Subtle background golden aura */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#C88E3E]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Surjo Sun & Shield Emblem */}
        <div className="relative inline-block">
          <div className="w-14 h-14 rounded-full border border-[#C88E3E] bg-[#C88E3E]/10 dark:bg-[#C88E3E]/20 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-6 h-6 text-[#C88E3E]" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#1C1917] dark:bg-black border border-[#C88E3E] flex items-center justify-center">
            <ShieldCheck className="w-3 h-3 text-[#C88E3E]" />
          </div>
        </div>

        {/* Header Branding */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#FAF7F0] dark:bg-[#1E1B17] border border-[#E6DFD3] dark:border-[#2D261E] text-[9px] uppercase font-mono tracking-[0.25em] text-[#C88E3E] dark:text-[#D49A3D] font-medium">
            Owner & Director Desk
          </div>
          <h1 className="text-2xl sm:text-3xl font-light text-[#1C1917] dark:text-[#F7F3EC] font-serif leading-tight">
            Studio Master Gate
          </h1>
          <p className="text-xs text-[#70665A] dark:text-[#A39886] leading-relaxed font-sans max-w-xs mx-auto">
            Access to client vaults, proof delivery, color darkroom, and cloud drive sync is restricted to authorized studio personnel.
          </p>
        </div>

        {/* Credentials Requirement Notice */}
        <div className="bg-[#FAF7F0] dark:bg-[#1E1B17] p-3.5 border border-[#E6DFD3] dark:border-[#2D261E] text-left">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider mb-1">
            <span className="text-[#1C1917] dark:text-[#F7F3EC] font-medium">Director Authorization</span>
            <span className="text-[#C88E3E] font-medium">Email + Passcode</span>
          </div>
          <p className="text-[10px] text-[#70665A] dark:text-[#A39886] font-mono leading-relaxed">
            Enter your studio director email and master passcode (default: 123456) to unlock the production desk.
          </p>
        </div>

        {/* Master Passcode Form */}
        <form onSubmit={handlePasswordSubmit} className="space-y-4 text-left">
          {/* Studio Director Email (Required) */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#70665A] dark:text-[#A39886] uppercase font-mono tracking-widest flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-[#C88E3E]" />
                Studio Director Email
              </span>
              <span className="text-[9px] text-[#C88E3E] font-mono font-medium tracking-normal lowercase">required</span>
            </label>
            <input
              ref={emailInputRef}
              type="email"
              placeholder="e.g. director@surjomedia.com"
              value={emailInput}
              onChange={(e) => {
                setCustomEmail(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              required
              className="w-full bg-[#FAF7F0] dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] px-3.5 py-2.5 text-xs text-[#1C1917] dark:text-[#F7F3EC] focus:outline-none focus:border-[#C88E3E] font-mono tracking-wider placeholder-[#70665A]/40"
              autoComplete="email"
              suppressHydrationWarning
            />
          </div>

          {/* Master Key or Studio PIN (Required) */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#70665A] dark:text-[#A39886] uppercase font-mono tracking-widest flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3 h-3 text-[#C88E3E]" />
                Master Passcode or PIN
              </span>
              <span className="text-[9px] text-[#C88E3E] font-mono font-medium tracking-normal lowercase">required</span>
            </label>
            <div className="relative">
              <input
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter passcode (default: 123456)"
                value={credentialInput}
                onChange={(e) => {
                  setCredentialInput(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                required
                className="w-full bg-[#FAF7F0] dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] px-3.5 py-2.5 text-xs text-[#1C1917] dark:text-[#F7F3EC] focus:outline-none focus:border-[#C88E3E] font-mono tracking-wider placeholder-[#70665A]/40"
                autoComplete="current-password"
                suppressHydrationWarning
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC] p-1"
                title={showPassword ? 'Hide Key' : 'Show Key'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember workstation option */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-[#70665A] dark:text-[#A39886] font-mono">
              <input
                type="checkbox"
                checked={rememberWorkstation}
                onChange={(e) => setRememberWorkstation(e.target.checked)}
                className="accent-[#C88E3E] w-3.5 h-3.5 rounded"
              />
              <span>Remember workstation (24h)</span>
            </label>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/30 p-3 text-red-600 dark:text-red-400 text-xs flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !emailInput.trim() || !credentialInput.trim()}
            className="w-full py-3 bg-[#C88E3E] hover:bg-[#B77D2F] disabled:opacity-50 text-white text-xs uppercase font-mono tracking-widest font-semibold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span>Verifying Credentials...</span>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Unlock Studio Desk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-3">
          <div className="border-t border-[#E6DFD3] dark:border-[#2D261E] w-full" />
          <span className="bg-white dark:bg-[#151311] px-3 text-[10px] uppercase font-mono tracking-widest text-[#70665A] dark:text-[#A39886] absolute">
            or single sign-on
          </span>
        </div>

        {/* Google Single Sign-On Button */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isGoogleSigningIn}
            className="w-full py-2.5 bg-white dark:bg-[#0C0B0A] hover:bg-[#FAF7F0] dark:hover:bg-[#1E1B17] text-[#1C1917] dark:text-[#F7F3EC] border border-[#E6DFD3] dark:border-[#2D261E] text-xs font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <LogIn className="w-3.5 h-3.5 text-[#C88E3E]" />
            <span>
              {isGoogleSigningIn ? 'Connecting to Google...' : 'Sign In with Studio Google Account'}
            </span>
          </button>
          <p className="text-[9px] text-[#70665A] dark:text-[#A39886] font-mono">
            Directly authenticates via Firebase Auth & connects Google Drive master folder
          </p>
        </div>

        {/* Bottom Switch to Client */}
        {onSwitchToClient && (
          <div className="pt-2 border-t border-[#E6DFD3] dark:border-[#2D261E]">
            <button
              type="button"
              onClick={onSwitchToClient}
              className="text-xs text-[#70665A] dark:text-[#A39886] hover:text-[#C88E3E] dark:hover:text-[#D49A3D] font-mono uppercase tracking-wider transition-colors"
            >
              Switch to Client Portal View →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
