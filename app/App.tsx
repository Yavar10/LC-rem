'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowUpRight, 
  ChevronRight, 
  Flame, 
  Trophy, 
  Sparkles, 
  Activity, 
  Search, 
  X,
  Target
} from 'lucide-react';
import { useLeaderboard } from './context/LeaderboardContext';
import Navbar from './components/Navbar';

function formatRank(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

export default function App() {
  const { 
    users, 
    overallSortedUsers, 
    loading, 
    currentUser, 
    currentUserRank
  } = useLeaderboard();

  const [filterMode, setFilterMode] = useState<'all' | 'veterans'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Gap to competitor above on the OVERALL leaderboard
  const gapToNext = useMemo(() => {
    if (!currentUser || !currentUserRank || currentUserRank <= 1) return null;
    const aheadUser = overallSortedUsers[currentUserRank - 2];
    if (!aheadUser) return null;
    const diff = aheadUser.score - currentUser.score;
    const problemsNeeded = Math.max(1, Math.ceil(diff / 100)); // estimated 100 pts per medium
    return {
      points: diff,
      targetRank: currentUserRank - 1,
      targetUser: aheadUser.sname || aheadUser.name,
      problemsNeeded
    };
  }, [currentUser, currentUserRank, overallSortedUsers]);

  // Aggregate league statistics across all mentees
  const leagueStats = useMemo(() => {
    if (users.length === 0) return null;

    let totalSolved = 0;
    let totalEasy = 0;
    let totalMed = 0;
    let totalHard = 0;
    let totalScore = 0;

    users.forEach(u => {
      totalSolved += u.solved;
      totalEasy += u.easy;
      totalMed += u.medium;
      totalHard += u.hard;
      totalScore += u.score;
    });

    const topHardSolver = [...users].sort((a, b) => b.hard - a.hard)[0];
    const streakTitan = [...users].sort((a, b) => b.currentStreak - a.currentStreak)[0];
    const topVolume = [...users].sort((a, b) => b.solved - a.solved)[0];
    const avgScore = Math.round(totalScore / users.length);
    const veteransCount = users.filter(u => u.solved >= 100).length;

    return {
      totalSolved,
      totalEasy,
      totalMed,
      totalHard,
      totalScore,
      avgScore,
      veteransCount,
      topHardSolver,
      streakTitan,
      topVolume
    };
  }, [users]);

  // Filtered and searched rows
  const displayedUsers = useMemo(() => {
    let list = overallSortedUsers;
    if (filterMode === 'veterans') {
      list = list.filter(u => u.solved >= 100);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(u => 
        u.name.toLowerCase().includes(q) || 
        (u.sname && u.sname.toLowerCase().includes(q))
      );
    }
    return list;
  }, [overallSortedUsers, filterMode, searchQuery]);

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#F1EEE8] selection:bg-[#FF7417] selection:text-[#0B0B0B] font-sans antialiased relative">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[480px] pointer-events-none overflow-hidden -z-10">
        <div className="w-full h-full ambient-orange opacity-60" />
      </div>

      {/* Shared Masthead Navigation */}
      <Navbar />

      {/* ── Main Container ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* ═══════════════════════════════════════════ */}
          {/* LEFT COLUMN: Hero + The Main Event Table    */}
          {/* ═══════════════════════════════════════════ */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            
            {/* ── Editorial Hero Section ── */}
            <section className="border-b border-white/10 pb-8">
              
              {/* Overline Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#AAA59D] mb-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[#FF7417] font-bold text-[11px] uppercase tracking-wider bg-[#FF7417]/10 px-2.5 py-0.5 border border-[#FF7417]/25">
                    LIFETIME ARCHIVE
                  </span>
                  <span className="text-white/20">/</span>
                  <span className="text-[11px] uppercase tracking-wider text-[#77736D] hidden sm:inline">
                    EASY×50 · MED×100 · HARD×200
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-[#39BB75]">
                  <span className="w-2 h-2 rounded-full bg-[#39BB75] inline-block animate-pulse" />
                  <span className="uppercase tracking-wider">LIVE LEETCODE SYNC</span>
                </div>
              </div>

              {/* Giant Editorial Headline */}
              <h1 
                className="text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-tight text-[#F1EEE8] leading-[0.88] select-none"
                style={{ fontFamily: 'var(--font-display), sans-serif' }}
              >
                OVERALL<br />
                STANDINGS
              </h1>

              {/* Editorial Subline Data Strip */}
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#AAA59D]">
                <div className="flex items-center gap-2">
                  <span className="text-[#F1EEE8] font-bold">{overallSortedUsers.length}</span>
                  <span className="uppercase">COMPETITORS</span>
                  <span className="text-white/20">·</span>
                  <span className="text-[#39BB75] font-semibold">
                    {leagueStats?.totalSolved.toLocaleString() || '0'} TOTAL SOLVES
                  </span>
                </div>

                <div className="text-[10px] uppercase tracking-widest text-[#77736D]">
                  SORTED BY ALL-TIME SCORE
                </div>
              </div>
            </section>

            {/* ── Mobile Position Quick Bar (390px polish) ── */}
            {currentUser && currentUserRank && (
              <div className="lg:hidden border border-[#FF7417]/30 bg-[#161512] p-4 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 bg-[#FF7417]" />
                  <div>
                    <span className="text-[10px] text-[#77736D] uppercase block">YOUR STANDING</span>
                    <span 
                      className="text-lg font-bold text-[#F1EEE8] leading-none"
                      style={{ fontFamily: 'var(--font-display), sans-serif' }}
                    >
                      #{formatRank(currentUserRank)}
                    </span>
                    <span className="text-[#FF7417] ml-2 text-xs font-mono font-bold">
                      {currentUser.score.toLocaleString()} PTS
                    </span>
                  </div>
                </div>

                {currentUserRank > 1 && gapToNext ? (
                  <div className="text-right">
                    <span className="text-xs text-[#FF7417] font-bold block">
                      +{gapToNext.points.toLocaleString()} PTS
                    </span>
                    <span className="text-[9px] text-[#AAA59D] uppercase">
                      TO #{formatRank(gapToNext.targetRank)}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-[#39BB75] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#39BB75]/10 border border-[#39BB75]/30">
                    GLOBAL #01
                  </span>
                )}
              </div>
            )}

            {/* ── Controls: Search and Filter Tabs ── */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              
              {/* Search Bar */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-[#77736D] absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Filter competitor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111111] border border-white/10 text-xs font-mono pl-9 pr-8 py-2 text-[#F1EEE8] placeholder-[#77736D] focus:outline-none focus:border-[#FF7417]/60 transition-colors"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#77736D] hover:text-[#F1EEE8]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Segmented Filter Toggle with Framer Motion sliding pill */}
              <div className="flex items-center gap-1 bg-[#111111] p-1 border border-white/10 text-xs font-mono">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`relative px-3 py-1.5 uppercase transition-colors z-10 ${
                    filterMode === 'all' ? 'text-[#0B0B0B] font-bold' : 'text-[#AAA59D] hover:text-[#F1EEE8]'
                  }`}
                >
                  {filterMode === 'all' && (
                    <motion.div 
                      layoutId="overallFilterIndicator"
                      className="absolute inset-0 bg-[#F1EEE8] -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  ALL ({overallSortedUsers.length})
                </button>

                <button
                  onClick={() => setFilterMode('veterans')}
                  className={`relative px-3 py-1.5 uppercase transition-colors z-10 ${
                    filterMode === 'veterans' ? 'text-[#0B0B0B] font-bold' : 'text-[#AAA59D] hover:text-[#F1EEE8]'
                  }`}
                >
                  {filterMode === 'veterans' && (
                    <motion.div 
                      layoutId="overallFilterIndicator"
                      className="absolute inset-0 bg-[#FF7417] -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  100+ SOLVED ({leagueStats?.veteransCount || 0})
                </button>
              </div>

            </div>

            {/* ── Loading Skeleton State ── */}
            {loading && overallSortedUsers.length === 0 && (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="h-20 bg-[#111111] border border-white/10 animate-pulse" 
                  />
                ))}
                <p className="text-center text-xs font-mono text-[#77736D] py-4">
                  SYNCING LEAGUE DATA DIRECTLY FROM LEETCODE...
                </p>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────── */}
            {/* SPOTLIGHT LEADER (#01) — HERO COMPOSITION                  */}
            {/* ─────────────────────────────────────────────────────────── */}
            {displayedUsers.length > 0 && !searchQuery && (
              (() => {
                const titan = displayedUsers[0];
                const isTitanUser = currentUser && titan.name.toLowerCase() === currentUser.name.toLowerCase();

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Link
                      href={`/u/${titan.name}`}
                      className="block group relative border border-[#FF7417]/50 bg-[#141210] hover:bg-[#181512] transition-colors p-5 sm:p-6"
                    >
                      {/* Top Accent Strip */}
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF7417] via-[#FF7417]/80 to-transparent" />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                        
                        {/* Left: Rank, Avatar & Competitor Info */}
                        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                          
                          {/* Numeral 01 with Leader Marker */}
                          <div className="shrink-0 text-center w-10 sm:w-12">
                            <span 
                              className="text-4xl sm:text-5xl font-black text-[#FF7417] leading-none block tracking-tight"
                              style={{ fontFamily: 'var(--font-display), sans-serif' }}
                            >
                              01
                            </span>
                            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#FF7417] block mt-0.5">
                              LEADER
                            </span>
                          </div>

                          {/* Square Avatar */}
                          <div className="relative shrink-0">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#191919] border-2 border-[#FF7417] overflow-hidden">
                              {titan.img ? (
                                <img 
                                  src={titan.img} 
                                  alt={titan.name} 
                                  className="w-full h-full object-cover contrast-110 group-hover:scale-105 transition-transform duration-200" 
                                />
                              ) : (
                                <div 
                                  className="w-full h-full flex items-center justify-center font-bold text-sm text-[#F1EEE8]"
                                  style={{ fontFamily: 'var(--font-display), sans-serif' }}
                                >
                                  {titan.sname?.slice(0, 2).toUpperCase() || titan.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            {isTitanUser && (
                              <span 
                                className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF7417]" 
                                title="Your Profile"
                              />
                            )}
                          </div>

                          {/* Name & Technical Breakdown */}
                          <div className="min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg sm:text-xl font-bold text-[#F1EEE8] group-hover:text-[#FF7417] transition-colors truncate">
                                {titan.sname || titan.name}
                              </span>
                              <span className="text-[9px] font-mono uppercase tracking-wider bg-[#FF7417] text-[#0B0B0B] font-bold px-1.5 py-0.2 shrink-0">
                                ALL-TIME #1
                              </span>
                              {isTitanUser && (
                                <span className="text-[9px] font-mono uppercase tracking-wider border border-[#FF7417] text-[#FF7417] font-semibold px-1 py-0.2 shrink-0">
                                  YOU
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#AAA59D] mt-1.5">
                              <span className="text-[#F1EEE8] font-bold">
                                {titan.solved} SOLVED
                              </span>
                              <span className="text-white/20">·</span>
                              <span className="text-[#39BB75]">{titan.easy}E</span>
                              <span className="text-[#FF7417]">{titan.medium}M</span>
                              <span className="text-[#E45B55] font-bold">{titan.hard}H</span>
                              <span className="text-white/20">·</span>
                              <span className="flex items-center gap-1 text-[#FF7417]">
                                <Flame className="w-3.5 h-3.5 fill-[#FF7417]" />
                                <span>{titan.currentStreak}D STREAK</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Points & 8-day sparkline */}
                        <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0 shrink-0">
                          <div className="sm:text-right font-mono">
                            <div 
                              className="text-3xl sm:text-4xl font-black text-[#FF7417] tabular-nums tracking-tight leading-none"
                              style={{ fontFamily: 'var(--font-display), sans-serif' }}
                            >
                              {titan.score.toLocaleString()}
                            </div>
                            <div className="text-[9px] text-[#77736D] uppercase tracking-widest mt-1">
                              LIFETIME POINTS
                            </div>
                          </div>

                          {/* 8-day sparkline */}
                          <div className="flex items-center gap-1 mt-3">
                            {titan.streak.map((active, dotIdx) => (
                              <div 
                                key={dotIdx} 
                                className={`
                                  w-2 h-2 transition-colors
                                  ${active ? 'bg-[#39BB75]' : 'bg-[#191919] border border-white/10'}
                                  ${dotIdx === titan.streak.length - 1 ? 'ring-1 ring-[#FF7417]' : ''}
                                `}
                                title={active ? 'Recent submission' : 'No submission'}
                              />
                            ))}
                          </div>
                        </div>

                      </div>
                    </Link>
                  </motion.div>
                );
              })()
            )}

            {/* ─────────────────────────────────────────────────────────── */}
            {/* CHASE PACK TABLE (#02+ or searched rows)                   */}
            {/* ─────────────────────────────────────────────────────────── */}
            <div className="border border-white/10 divide-y divide-white/5 bg-[#111111]">
              {(searchQuery ? displayedUsers : displayedUsers.slice(1)).map((user, idx) => {
                const actualRank = searchQuery 
                  ? overallSortedUsers.findIndex(u => u.name === user.name) + 1 
                  : idx + 2;
                const isSecond = actualRank === 2;
                const isThird = actualRank === 3;
                const isUser = currentUser && user.name.toLowerCase() === currentUser.name.toLowerCase();

                return (
                  <motion.div
                    key={user.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15, delay: Math.min(idx * 0.02, 0.3) }}
                  >
                    <Link
                      href={`/u/${user.name}`}
                      className={`
                        group flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 transition-colors
                        ${isSecond 
                          ? 'bg-[#141414] hover:bg-[#181818]' 
                          : isThird 
                          ? 'bg-[#121212] hover:bg-[#161616]' 
                          : 'hover:bg-[#151515]'}
                        ${isUser ? 'ring-1 ring-[#FF7417]/60 bg-[#191714]' : ''}
                      `}
                    >
                      {/* Numeral Rank */}
                      <div className="shrink-0 w-8 sm:w-10 text-center">
                        {isSecond ? (
                          <span 
                            className="text-2xl sm:text-3xl font-black text-[#F1EEE8] leading-none block"
                            style={{ fontFamily: 'var(--font-display), sans-serif' }}
                          >
                            02
                          </span>
                        ) : isThird ? (
                          <span 
                            className="text-2xl sm:text-3xl font-black text-[#C9A066] leading-none block"
                            style={{ fontFamily: 'var(--font-display), sans-serif' }}
                          >
                            03
                          </span>
                        ) : (
                          <span className="text-xs font-mono text-[#77736D] font-bold">
                            {formatRank(actualRank)}
                          </span>
                        )}
                      </div>

                      {/* Square Avatar */}
                      <div className="shrink-0 relative">
                        <div className={`
                          w-9 h-9 sm:w-10 sm:h-10 bg-[#191919] border overflow-hidden
                          ${isSecond ? 'border-white/40' : isThird ? 'border-[#C9A066]/40' : 'border-white/10'}
                        `}>
                          {user.img ? (
                            <img 
                              src={user.img} 
                              alt={user.name} 
                              className="w-full h-full object-cover contrast-110 group-hover:scale-105 transition-transform" 
                            />
                          ) : (
                            <div 
                              className="w-full h-full flex items-center justify-center font-bold text-xs text-[#AAA59D]"
                              style={{ fontFamily: 'var(--font-display), sans-serif' }}
                            >
                              {user.sname?.slice(0, 2).toUpperCase() || user.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        {isUser && (
                          <span 
                            className="absolute -top-1 -right-1 w-2 h-2 bg-[#FF7417]" 
                            title="Your Profile"
                          />
                        )}
                      </div>

                      {/* Competitor Name & Breakdown */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold truncate tracking-tight text-sm sm:text-base text-[#F1EEE8] group-hover:text-[#FF7417] transition-colors">
                            {user.sname || user.name}
                          </span>
                          {user.sname && user.sname !== user.name && (
                            <span className="text-[10px] font-mono text-[#77736D] truncate hidden sm:inline">
                              @{user.name}
                            </span>
                          )}
                          {isUser && (
                            <span className="text-[9px] font-mono uppercase tracking-wider border border-[#FF7417] text-[#FF7417] font-semibold px-1 py-0.2 shrink-0">
                              YOU
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-[#AAA59D]">
                          <span className="text-[#F1EEE8] font-semibold">
                            {user.solved} SOLVED
                          </span>
                          <span className="text-white/20">·</span>
                          <span className="text-[#39BB75]">{user.easy}E</span>
                          <span className="text-[#FF7417]">{user.medium}M</span>
                          <span className="text-[#E45B55]">{user.hard}H</span>
                          <span className="text-white/20">·</span>
                          <span className="flex items-center gap-1">
                            <Flame className={`w-3 h-3 ${user.currentStreak > 0 ? 'text-[#FF7417] fill-[#FF7417]' : 'text-[#444444]'}`} />
                            <span>{user.currentStreak}D</span>
                          </span>
                        </div>
                      </div>

                      {/* 8-Day Dot Sparkline (Desktop) */}
                      <div className="hidden md:flex items-center gap-1 shrink-0 px-2">
                        {user.streak.map((active, dotIdx) => (
                          <div 
                            key={dotIdx} 
                            className={`
                              w-1.5 h-1.5 transition-colors
                              ${active ? 'bg-[#39BB75]' : 'bg-[#191919] border border-white/5'}
                              ${dotIdx === user.streak.length - 1 ? 'ring-1 ring-[#FF7417]' : ''}
                            `}
                            title={active ? 'Solved' : 'Inactive'}
                          />
                        ))}
                      </div>

                      {/* Points */}
                      <div className="shrink-0 text-right min-w-[70px] font-mono">
                        <div className="font-bold text-sm sm:text-base tabular-nums text-[#F1EEE8] group-hover:text-[#FF7417] transition-colors">
                          {user.score.toLocaleString()}
                        </div>
                        <div className="text-[8px] text-[#77736D] tracking-widest uppercase">
                          POINTS
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="w-3.5 h-3.5 text-[#444444] group-hover:text-[#F1EEE8] transition-colors shrink-0 hidden sm:block" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Empty state */}
            {!loading && displayedUsers.length === 0 && (
              <div className="border border-white/10 p-10 text-center bg-[#111111]">
                <p 
                  className="text-lg uppercase text-[#F1EEE8] mb-1 font-bold tracking-tight"
                  style={{ fontFamily: 'var(--font-display), sans-serif' }}
                >
                  NO COMPETITORS FOUND
                </p>
                <p className="text-xs font-mono text-[#77736D] mb-4">
                  No participants matched query &ldquo;{searchQuery}&rdquo;.
                </p>
                <button
                  onClick={() => { setFilterMode('all'); setSearchQuery(''); }}
                  className="inline-block bg-[#FF7417] text-[#0B0B0B] text-xs font-mono font-bold uppercase px-4 py-2 hover:bg-[#FF7417]/90 transition-colors"
                >
                  RESET SEARCH
                </button>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* RIGHT COLUMN: Asymmetrical Editorial Sidebar */}
          {/* ═══════════════════════════════════════════ */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            
            {/* ── MODULE 1: PERSONAL STANDING DOSSIER ── */}
            <section className="border border-white/10 bg-[#111111] p-5 sm:p-6 relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 text-[10px] font-mono uppercase tracking-widest">
                <span className="text-[#AAA59D]">PERSONAL STANDING</span>
                <span className="text-[#FF7417] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF7417]" />
                  {currentUser ? 'AUTHENTICATED' : 'UNREGISTERED'}
                </span>
              </div>

              {currentUser && currentUserRank ? (
                <div>
                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <span className="text-[10px] font-mono text-[#77736D] uppercase block">
                        ALL-TIME RANK
                      </span>
                      <span 
                        className="text-5xl font-black text-[#F1EEE8] tracking-tight leading-none"
                        style={{ fontFamily: 'var(--font-display), sans-serif' }}
                      >
                        #{formatRank(currentUserRank)}
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-2xl font-bold text-[#FF7417] block leading-none">
                        {currentUser.score.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-[#77736D] uppercase mt-1 block">
                        TOTAL POINTS
                      </span>
                    </div>
                  </div>

                  {/* Overtake Distance Progress Bar */}
                  <div className="bg-[#0B0B0B] p-4 border border-white/10 mb-4 font-mono">
                    {currentUserRank === 1 ? (
                      <div className="text-xs text-[#39BB75] font-semibold flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-[#FF7417]" />
                        <span>GLOBAL LEADER — YOU HOLD #1 ON ALL-TIME</span>
                      </div>
                    ) : gapToNext ? (
                      <div>
                        <div className="flex justify-between items-baseline text-xs mb-1.5">
                          <span className="text-[#AAA59D] flex items-center gap-1">
                            <Target className="w-3 h-3 text-[#FF7417]" />
                            <span>GAP TO #{formatRank(gapToNext.targetRank)}</span>
                          </span>
                          <span className="text-[#FF7417] font-bold">+{gapToNext.points.toLocaleString()} PTS</span>
                        </div>

                        {/* Progress Bar towards overtaking the competitor above */}
                        <div className="w-full h-2 bg-[#191919] border border-white/5 overflow-hidden my-2.5">
                          <motion.div 
                            className="h-full bg-[#FF7417]" 
                            initial={{ width: 0 }}
                            animate={{ 
                              width: `${Math.min(Math.max((currentUser.score / (currentUser.score + gapToNext.points)) * 100, 15), 92)}%` 
                            }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                        </div>

                        <p className="text-[11px] text-[#77736D] mt-2 leading-relaxed">
                          Solve ~{gapToNext.problemsNeeded} medium problem{gapToNext.problemsNeeded > 1 ? 's' : ''} (or ~{Math.max(1, Math.ceil(gapToNext.points / 200))} hard) to overtake <span className="text-[#F1EEE8] font-bold">@{gapToNext.targetUser}</span>.
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-white/10 font-mono">
                    <Link
                      href={`/u/${currentUser.name}`}
                      className="text-[#F1EEE8] hover:text-[#FF7417] transition-colors flex items-center gap-1 group font-bold"
                    >
                      <span>VIEW DOSSIER</span>
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                    <Link
                      href="/weekly-leaders"
                      className="text-[#AAA59D] hover:text-[#F1EEE8] transition-colors flex items-center gap-1"
                    >
                      <span>WEEKLY CUP</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="py-2 text-left">
                  <h3 
                    className="text-xl font-black uppercase text-[#F1EEE8] mb-1.5"
                    style={{ fontFamily: 'var(--font-display), sans-serif' }}
                  >
                    WORKSTATION UNBOUND
                  </h3>
                  <p className="text-xs font-mono text-[#AAA59D] mb-4 leading-relaxed">
                    Bind this machine to your LeetCode handle to unlock personal rank tracking, overtake alerts, and streak monitoring.
                  </p>
                  <Link
                    href="/user"
                    className="block w-full text-center bg-[#FF7417] text-[#0B0B0B] text-xs font-mono font-bold uppercase py-2.5 hover:bg-[#FF7417]/90 transition-colors"
                  >
                    LINK LEETCODE HANDLE →
                  </Link>
                </div>
              )}
            </section>

            {/* ── MODULE 2: LEAGUE PROBLEM DISTRIBUTION ── */}
            {leagueStats && (
              <section className="border border-white/10 bg-[#111111] p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 font-mono">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-[#FF7417]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1EEE8]">
                      PROBLEM DISTRIBUTION
                    </h3>
                  </div>
                  <span className="text-[10px] text-[#39BB75] font-semibold">
                    {leagueStats.totalSolved.toLocaleString()} SOLVES
                  </span>
                </div>

                {/* Difficulty Bars */}
                <div className="space-y-3.5 text-xs font-mono">
                  <div>
                    <div className="flex justify-between mb-1 text-[11px]">
                      <span className="text-[#39BB75] font-semibold">EASY PROBLEMS (50 PTS)</span>
                      <span className="text-[#AAA59D]">
                        {leagueStats.totalEasy.toLocaleString()} ({Math.round((leagueStats.totalEasy / leagueStats.totalSolved) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#191919] border border-white/5">
                      <div 
                        className="h-full bg-[#39BB75]" 
                        style={{ width: `${(leagueStats.totalEasy / leagueStats.totalSolved) * 100}%` }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 text-[11px]">
                      <span className="text-[#FF7417] font-semibold">MEDIUM PROBLEMS (100 PTS)</span>
                      <span className="text-[#AAA59D]">
                        {leagueStats.totalMed.toLocaleString()} ({Math.round((leagueStats.totalMed / leagueStats.totalSolved) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#191919] border border-white/5">
                      <div 
                        className="h-full bg-[#FF7417]" 
                        style={{ width: `${(leagueStats.totalMed / leagueStats.totalSolved) * 100}%` }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 text-[11px]">
                      <span className="text-[#E45B55] font-semibold">HARD PROBLEMS (200 PTS)</span>
                      <span className="text-[#AAA59D]">
                        {leagueStats.totalHard.toLocaleString()} ({Math.round((leagueStats.totalHard / leagueStats.totalSolved) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#191919] border border-white/5">
                      <div 
                        className="h-full bg-[#E45B55]" 
                        style={{ width: `${(leagueStats.totalHard / leagueStats.totalSolved) * 100}%` }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Metrics 2-column strip */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 font-mono text-xs">
                  <div className="bg-[#0B0B0B] p-3 border border-white/10">
                    <span className="text-[#77736D] block text-[9px] uppercase">AVG MENTEE SCORE</span>
                    <span className="text-base font-bold text-[#F1EEE8]">{leagueStats.avgScore.toLocaleString()}</span>
                  </div>
                  <div className="bg-[#0B0B0B] p-3 border border-white/10">
                    <span className="text-[#77736D] block text-[9px] uppercase">POINTS MINTED</span>
                    <span className="text-base font-bold text-[#FF7417]">{(leagueStats.totalScore / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              </section>
            )}

            {/* ── MODULE 3: HALL OF FAME TITANS ── */}
            {leagueStats && (
              <section className="border border-white/10 bg-[#111111] p-5 sm:p-6 space-y-3.5">
                <div className="border-b border-white/10 pb-3 flex items-baseline justify-between font-mono">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1EEE8]">
                    HALL OF FAME
                  </h3>
                  <span className="text-[9px] text-[#77736D] uppercase">
                    ALL-TIME RECORDS
                  </span>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  {/* Top Volume */}
                  <Link 
                    href={`/u/${leagueStats.topVolume.name}`}
                    className="p-3 bg-[#0B0B0B] border border-white/10 flex items-center justify-between hover:border-[#FF7417]/50 transition-colors block"
                  >
                    <div className="flex items-center gap-2.5">
                      <Trophy className="w-3.5 h-3.5 text-[#FF7417]" />
                      <span className="text-[#AAA59D] text-[10px] uppercase">VOLUME LEADER</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#F1EEE8] font-bold block">{leagueStats.topVolume.sname || leagueStats.topVolume.name}</span>
                      <span className="text-[10px] text-[#39BB75]">{leagueStats.topVolume.solved} SOLVED</span>
                    </div>
                  </Link>

                  {/* Hard Titan */}
                  <Link 
                    href={`/u/${leagueStats.topHardSolver.name}`}
                    className="p-3 bg-[#0B0B0B] border border-white/10 flex items-center justify-between hover:border-[#E45B55]/50 transition-colors block"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#E45B55]" />
                      <span className="text-[#AAA59D] text-[10px] uppercase">HARD SOLVER</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#F1EEE8] font-bold block">{leagueStats.topHardSolver.sname || leagueStats.topHardSolver.name}</span>
                      <span className="text-[10px] text-[#E45B55] font-bold">{leagueStats.topHardSolver.hard} HARDS</span>
                    </div>
                  </Link>

                  {/* Longest Active Streak */}
                  <Link 
                    href={`/u/${leagueStats.streakTitan.name}`}
                    className="p-3 bg-[#0B0B0B] border border-white/10 flex items-center justify-between hover:border-[#FF7417]/50 transition-colors block"
                  >
                    <div className="flex items-center gap-2.5">
                      <Flame className="w-3.5 h-3.5 text-[#FF7417] fill-[#FF7417]" />
                      <span className="text-[#AAA59D] text-[10px] uppercase">STREAK TITAN</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#F1EEE8] font-bold block">{leagueStats.streakTitan.sname || leagueStats.streakTitan.name}</span>
                      <span className="text-[10px] text-[#FF7417] font-bold">{leagueStats.streakTitan.currentStreak} DAYS</span>
                    </div>
                  </Link>
                </div>
              </section>
            )}

            {/* Protocol Spec */}
            <div className="border border-white/10 bg-[#111111] p-4 text-[10px] font-mono text-[#77736D] space-y-1.5">
              <div className="flex items-center justify-between text-[#AAA59D] font-bold">
                <span>SCORING PROTOCOL</span>
                <span className="text-[#F1EEE8]">EASY×50 · MED×100 · HARD×200</span>
              </div>
              <p>· Rankings derived from verified LeetCode profile submissions.</p>
              <p>· Click any competitor row to inspect their 8-day timeline and problem breakdown.</p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
