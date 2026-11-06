'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft } from 'lucide-react';
import Navbar from './components/Navbar';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#F1EEE8] selection:bg-[#FF7417] selection:text-[#0B0B0B] font-sans antialiased relative">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[480px] pointer-events-none overflow-hidden -z-10">
        <div className="w-full h-full ambient-orange opacity-60" />
      </div>

      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-24 sm:py-32 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-[#FF7417] bg-[#FF7417]/10 px-3 py-1 border border-[#FF7417]/25 uppercase tracking-widest mb-6">
          <span>HTTP 404 · NODE UNRESOLVED</span>
        </div>

        <h1 
          className="text-8xl sm:text-9xl font-black uppercase tracking-tight text-[#F1EEE8] leading-none select-none mb-4"
          style={{ fontFamily: 'var(--font-display), sans-serif' }}
        >
          404
        </h1>

        <p 
          className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#AAA59D] mb-4"
          style={{ fontFamily: 'var(--font-display), sans-serif' }}
        >
          PAGE NOT FOUND IN LEAGUE ARCHIVE
        </p>

        <p className="max-w-md mx-auto text-xs font-mono text-[#77736D] mb-8 leading-relaxed">
          The requested coordinate does not exist or has been relocated. Return to the live roster or inspect the weekly standings.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-xs">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#FF7417] text-[#0B0B0B] font-bold uppercase px-5 py-3 hover:bg-[#FF7417]/90 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>OVERALL STANDINGS</span>
          </Link>
          <Link
            href="/weekly-leaders"
            className="inline-flex items-center gap-2 border border-white/10 bg-[#111111] text-[#F1EEE8] uppercase px-5 py-3 hover:bg-[#191919] transition-colors"
          >
            <span>WEEKLY CUP</span>
            <ArrowUpRight className="w-4 h-4 text-[#77736D]" />
          </Link>
        </div>
      </main>
    </div>
  );
}

