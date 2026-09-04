'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm Action',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-left">
      <div className="bg-[#FAF7F2] dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 flex items-center justify-center shrink-0 border ${
              isDestructive
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300'
                : 'bg-[#C88E3E]/10 border-[#C88E3E]/30 text-[#C88E3E]'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-light text-[#1C1917] dark:text-[#F7F3EC] font-serif">{title}</h3>
            <p className="text-xs text-[#70665A] dark:text-[#A39886] leading-relaxed font-sans">{description}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DFD3] dark:border-[#2D261E]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs uppercase tracking-widest font-mono text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-white hover:bg-[#FAF7F0] dark:hover:bg-[#1E1B17] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs uppercase tracking-widest font-mono font-medium transition-all flex items-center gap-2 shadow-sm ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-[#C88E3E] hover:bg-[#B77D2F] text-white'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
