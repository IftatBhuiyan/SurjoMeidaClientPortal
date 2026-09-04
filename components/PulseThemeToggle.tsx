'use client';

import React, { useState } from 'react';
import { Moon, Sun, Sparkles } from 'lucide-react';

interface PulseThemeToggleProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const PulseThemeToggle: React.FC<PulseThemeToggleProps> = ({
  isDarkMode,
  onToggleTheme,
}) => {
  const [wavePos, setWavePos] = useState<{ x: number; y: number; id: number } | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX || rect.left + rect.width / 2;
    const y = e.clientY || rect.top + rect.height / 2;

    // Trigger visual spatial wave ripple
    setWavePos({ x, y, id: Date.now() });
    setTimeout(() => {
      setWavePos(null);
    }, 750);

    // If browser supports View Transitions API, execute native spatial clip-path reveal
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      const maxRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      // @ts-ignore
      const transition = document.startViewTransition(() => {
        onToggleTheme();
      });

      transition.ready.then(() => {
        const isNextDark = !isDarkMode;
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${maxRadius * 1.05}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 550,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      });
    } else {
      // Fallback
      onToggleTheme();
    }
  };

  return (
    <>
      {/* Spatial Wave Reveal Overlay */}
      {wavePos && (
        <div
          className="fixed pointer-events-none z-[99999] overflow-hidden inset-0"
          aria-hidden="true"
        >
          <div
            className="absolute rounded-full border-2 border-[#c88e3e]/40 bg-[#c88e3e]/10 animate-spatial-wave backdrop-blur-[1px]"
            style={{
              left: `${wavePos.x}px`,
              top: `${wavePos.y}px`,
              width: '120px',
              height: '120px',
              marginLeft: '-60px',
              marginTop: '-60px',
            }}
          />
        </div>
      )}

      <button
        id="pulse-theme-toggle-btn"
        type="button"
        onClick={handleClick}
        aria-label="Toggle Surjo Warm Linen / Noir Theme"
        className="relative group px-2 sm:px-3 py-1.5 flex items-center gap-1.5 sm:gap-2 border border-[#e6dfd3] dark:border-[#2d261e] bg-white dark:bg-[#151311] hover:border-[#c88e3e] dark:hover:border-[#d49a3d] transition-all overflow-hidden focus:outline-none shadow-sm cursor-pointer shrink-0"
        title={`Theme: Currently ${isDarkMode ? 'Noir Studio' : 'Sunlit Alabaster'} (Click for spatial transition)`}
      >
        <div className="relative z-10 flex items-center gap-1.5 sm:gap-2">
          <div className="w-4 h-4 flex items-center justify-center shrink-0">
            {isDarkMode ? (
              <Moon className="w-3.5 h-3.5 text-[#d49a3d] transition-transform duration-300 group-hover:-rotate-12" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-[#c88e3e] transition-transform duration-300 group-hover:rotate-45" />
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 pr-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c88e3e] shadow-[0_0_6px_#c88e3e]" />
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#1c1917] dark:text-[#f7f3ec] font-medium">
              {isDarkMode ? 'Noir' : 'Alabaster'}
            </span>
          </div>
        </div>
      </button>
    </>
  );
};
