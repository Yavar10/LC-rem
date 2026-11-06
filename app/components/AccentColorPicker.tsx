'use client';

import React, { useState, useRef, useEffect, useSyncExternalStore } from 'react';
import { Pipette, Check } from 'lucide-react';

export const ACCENT_PRESETS = [
  { id: 'orange', name: 'Electric Orange', hex: '#FF7417' },
  { id: 'cyan', name: 'Hyper Cyan', hex: '#00E5FF' },
  { id: 'emerald', name: 'Cyber Emerald', hex: '#10B981' },
  { id: 'amber', name: 'Solar Amber', hex: '#F59E0B' },
  { id: 'violet', name: 'Neon Violet', hex: '#A855F7' },
  { id: 'crimson', name: 'Crimson Red', hex: '#EF4444' },
  { id: 'magenta', name: 'Hot Magenta', hex: '#EC4899' },
];

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 255;
  const g = parseInt(clean.substring(2, 4), 16) || 116;
  const b = parseInt(clean.substring(4, 6), 16) || 23;
  return `${r}, ${g}, ${b}`;
}

export function applyAccentColor(hex: string) {
  if (typeof document === 'undefined') return;
  const rgb = hexToRgb(hex);
  document.documentElement.style.setProperty('--accent', hex);
  document.documentElement.style.setProperty('--accent-rgb', rgb);
  try {
    localStorage.setItem('leetrem_accent', hex);
  } catch {}
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('accent-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('accent-change', callback);
  };
}

function getSnapshot(): string {
  try {
    return localStorage.getItem('leetrem_accent') || '#FF7417';
  } catch {
    return '#FF7417';
  }
}

function getServerSnapshot(): string {
  return '#FF7417';
}

export default function AccentColorPicker() {
  const [isOpen, setIsOpen] = useState(false);
  const selectedHex = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const containerRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside or escape
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectColor = (hex: string) => {
    applyAccentColor(hex);
    window.dispatchEvent(new Event('accent-change'));
  };

  return (
    <div className="relative inline-flex items-center" ref={containerRef}>
      {/* Trigger: Zero hydration mismatch */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-7 h-7 rounded-full flex items-center justify-center p-1 border border-white/15 hover:border-white/40 hover:scale-105 transition-all cursor-pointer bg-black/40"
        title="Customise accent colour"
        aria-label="Customise accent colour"
      >
        <span
          className="w-full h-full rounded-full transition-colors shadow-sm"
          style={{ backgroundColor: 'var(--accent)' }}
        />
      </button>

      {/* Minimal popover rendered only when open (client-only interaction) */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 p-3 bg-black border border-white/20 shadow-2xl rounded-xl min-w-[200px] flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#AAA59D]">
            <span>Accent Highlight</span>
            <span className="text-[10px] text-[#77736D]">{selectedHex}</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {ACCENT_PRESETS.map((preset) => {
              const isActive = selectedHex.toLowerCase() === preset.hex.toLowerCase();
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => selectColor(preset.hex)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer relative hover:scale-110 ${
                    isActive ? 'ring-2 ring-white/90 ring-offset-2 ring-offset-black' : 'hover:opacity-90'
                  }`}
                  style={{ backgroundColor: preset.hex }}
                  title={preset.name}
                >
                  {isActive && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                </button>
              );
            })}

            {/* Custom Pipette Color Picker */}
            <button
              type="button"
              onClick={() => colorInputRef.current?.click()}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer relative border border-dashed border-white/30 hover:border-white hover:scale-110 bg-black/60"
              title="Custom hex color"
            >
              <Pipette className="w-3.5 h-3.5 text-[#AAA59D]" />
              <input
                ref={colorInputRef}
                type="color"
                value={selectedHex}
                onChange={(e) => selectColor(e.target.value)}
                className="sr-only"
              />
            </button>
          </div>

          <div className="text-[10px] font-mono text-[#77736D] pt-1 border-t border-white/[0.06] text-center">
            Background remains black.
          </div>
        </div>
      )}
    </div>
  );
}
