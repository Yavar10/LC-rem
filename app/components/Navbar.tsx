'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { useLeaderboard } from '../context/LeaderboardContext';
import AccentColorPicker from './AccentColorPicker';

export default function Navbar() {
  const pathname = usePathname();
  const { registeredUsername } = useLeaderboard();

  const isOverall = pathname === '/';
  const isWeekly = pathname === '/weekly-leaders';
  const isUser = pathname === '/user' || pathname.startsWith('/u/');

  return (
    <header className="sticky top-0 z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logotype */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span 
            className="text-2xl font-black tracking-tight text-[#F1EEE8] group-hover:text-[#FF7417] transition-colors leading-none"
            style={{ fontFamily: 'var(--font-display), sans-serif' }}
          >
            LEETREM
          </span>
          <span className="text-white/20 text-xs font-mono ml-1 hidden sm:inline">/</span>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#77736D] hidden sm:inline">
            DSA LEAGUE
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="flex items-center gap-1.5 sm:gap-2.5">
          <Link
            href="/"
            className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase transition-all ${
              isOverall
                ? 'text-[#F1EEE8] font-bold border-b-2 border-[#FF7417]'
                : 'text-[#AAA59D] hover:text-[#F1EEE8]'
            }`}
          >
            OVERALL
          </Link>

          <Link
            href="/weekly-leaders"
            className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase transition-all flex items-center gap-1.5 ${
              isWeekly
                ? 'text-[#FF7417] font-bold border-b-2 border-[#FF7417]'
                : 'text-[#AAA59D] hover:text-[#F1EEE8]'
            }`}
          >
            <span>WEEKLY CUP</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#39BB75] inline-block animate-pulse" />
          </Link>

          <Link
            href="/user"
            className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase transition-all flex items-center gap-1 border ${
              isUser
                ? 'border-[#FF7417]/50 text-[#FF7417] bg-[#FF7417]/5'
                : 'border-white/10 text-[#AAA59D] hover:text-[#F1EEE8] hover:border-white/20'
            }`}
          >
            <span>{registeredUsername ? `@${registeredUsername}` : 'MY ID'}</span>
            <ArrowUpRight className="w-3 h-3 text-[#77736D]" />
          </Link>

          {/* Accent Color Customiser */}
          <div className="ml-1 pl-2 border-l border-white/10 flex items-center">
            <AccentColorPicker />
          </div>
        </nav>

      </div>
    </header>
  );
}
