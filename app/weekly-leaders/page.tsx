'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowUpRight, 
  ChevronRight, 
  Flame, 
  Trophy, 
  Clock, 
  Check, 
  Search,
  X,
  Target,
  Zap
} from 'lucide-react';
import { useLeaderboard } from '../context/LeaderboardContext';
import Navbar from '../components/Navbar';

function getISOWeekData(): { weekNumber: number; year: number } {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { weekNumber, year: d.getUTCFullYear() };
}

function formatRank(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_FULL_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function WeeklyLeadersPage() {
  const { 
    weeklySortedUsers, 
    loading, 
    weeklyCurrentUser, 
    weeklyCurrentUserRank
  } = useLeaderboard();

  const [filterMode, setFilterMode] = useState<'all' | 'active'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { weekNumber, year } = useMemo(() => getISOWeekData(), []);

  // Current UTC day (0 = Monday, ..., 6 = Sunday)
  const currentDayIndex = useMemo(() => {
    const day = new Date().getUTCDay();
    return day === 0 ? 6 : day - 1;
  }, []);

  // Time remaining in current week (until Sunday 23:59:59 UTC)
  const roundCountdown = useMemo(() => {
    const now = new Date();
    const utcDay = now.getUTCDay();
    const daysLeft = utcDay === 0 ? 0 : 7 - utcDay;
    const hoursLeft = 23 - now.getUTCHours();
    return {
      daysLeft,
      hoursLeft,
      isFinalDay: daysLeft === 0,
      label: daysLeft === 0 
        ? `Final Day · ${hoursLeft}h left` 
        : `${daysLeft}d ${hoursLeft}h remaining`
    };
  }, []);

  // Round statistics
  const roundStats = useMemo(() => {
    const totalWeeklySolved = weeklySortedUsers.reduce((sum, u) => sum + u.weeklySolved, 0);
    const activeParticipants = weeklySortedUsers.filter(u => u.weeklySolved > 0);
    const activeCount = activeParticipants.length;
    const totalCount = weeklySortedUsers.length;
    const totalWeeklyScore = weeklySortedUsers.reduce((sum, u) => sum + u.weeklyScore, 0);

    return {
      totalWeeklySolved,
      activeCount,
      totalCount,
      totalWeeklyScore
    };
  }, [weeklySortedUsers]);

  // Filtered and searched rows
  const displayedUsers = useMemo(() => {
    let list = weeklySortedUsers;
    if (filterMode === 'active') {
      list = list.filter(u => u.weeklySolved > 0);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(u => 
        u.name.toLowerCase().includes(q) || 
        (u.sname && u.sname.toLowerCase().includes(q))
      );
    }
    return list;
  }, [weeklySortedUsers, filterMode, searchQuery]);

  // Gap to competitor directly above on weekly standings
  const gapToNext = useMemo(() => {
    if (!weeklyCurrentUser || !weeklyCurrentUserRank || weeklyCurrentUserRank <= 1) return null;
    const aheadUser = weeklySortedUsers[weeklyCurrentUserRank - 2];
    if (!aheadUser) return null;
    const diff = aheadUser.weeklyScore - weeklyCurrentUser.weeklyScore;
    const problemsNeeded = Math.max(1, Math.ceil(diff / 100)); // ~100 pts per medium
    return {
      points: diff,
      targetRank: weeklyCurrentUserRank - 1,
      targetUser: aheadUser.sname || aheadUser.name,
      problemsNeeded
    };
  }, [weeklyCurrentUser, weeklyCurrentUserRank, weeklySortedUsers]);

  // Weekly standouts
  const highlights = useMemo(() => {
    if (weeklySortedUsers.length === 0) return null;

    const highestScorer = weeklySortedUsers[0];
    const streakTitan = [...weeklySortedUsers].sort((a, b) => b.currentStreak - a.currentStreak)[0];
    const mostConsistent = [...weeklySortedUsers].sort((a, b) => b.thisWeek - a.thisWeek)[0];

    return {
      highestScorer,
      streakTitan,
      mostConsistent
    };
  }, [weeklySortedUsers]);

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#F1EEE8] selection:bg-[#FF7417] selection:text-[#0B0B0B] font-sans antialiased relative">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[520px] pointer-events-none overflow-hidden -z-10">
        <div className="w-full h-full ambient-orange opacity-75" />
      </div>

      {/* Shared Masthead Navigation */}
      <Navbar />

      {/* ── Architectural Hero: Spans across the viewport ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-6 border-b border-white/[0.08]">
        
        {/* Overline Metadata Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-3 text-[#AAA59D]">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-[#FF7417] font-bold text-[11px] uppercase tracking-wider bg-[#FF7417]/10 px-2 py-0.5 border border-[#FF7417]/25">
              ROUND {weekNumber} / {year}
            </span>
            <span className="text-white/20">/</span>
            <span className="text-[#AAA59D] font-sans text-xs">
              Monday 00:00 → Sunday 23:59 UTC
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#FF7417]">
            <Clock className="w-3.5 h-3.5 text-[#FF7417]" />
            <span className="font-semibold">{roundCountdown.label}</span>
          </div>
        </div>

        {/* Ultra-massive Architectural Display Headline */}
        <h1 
          className="text-[12vw] sm:text-[10vw] lg:text-[7.8rem] xl:text-[9.2rem] font-black uppercase tracking-tight text-[#F1EEE8] leading-[0.80] select-none my-2 -ml-0.5 sm:-ml-1"
          style={{ fontFamily: 'var(--font-display), sans-serif' }}
        >
          WEEKLY LEADERS
        </h1>

        {/* Editorial Subline Data Bar — Open and Fluid */}
        <div className="mt-5 pt-3.5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-[#AAA59D]">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-[#F1EEE8] font-mono">{roundStats.activeCount}</span>
              <span className="text-xs text-[#AAA59D]">active of {roundStats.totalCount} mentees</span>
            </div>
            <span className="text-white/20 hidden sm:inline">·</span>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-[#39BB75] font-mono">{roundStats.totalWeeklySolved}</span>
              <span className="text-xs text-[#AAA59D]">problems solved this round</span>
            </div>
            <span className="text-white/20 hidden sm:inline">·</span>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-[#FF7417] font-mono">{roundStats.totalWeeklyScore.toLocaleString()}</span>
              <span className="text-xs text-[#AAA59D]">points minted</span>
            </div>
          </div>

          <div className="text-[11px] text-[#77736D] font-mono hidden md:block">
            Easy × 50 · Medium × 100 · Hard × 200
          </div>
        </div>
      </section>

      {/* ── Main Fluid Body ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* ═══════════════════════════════════════════ */}
          {/* LEFT: CONTINUOUS SCOREBOARD                 */}
          {/* ═══════════════════════════════════════════ */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Controls Ribbon: Search + Framer Motion Filter Tab */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
              
              {/* Search Bar */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-[#77736D] absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Find competitor by name or handle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111111]/80 border border-white/[0.08] text-xs font-mono pl-9 pr-8 py-2 text-[#F1EEE8] placeholder-[#77736D] focus:outline-none focus:border-[#FF7417]/60 transition-colors"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#77736D] hover:text-[#F1EEE8] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Segmented Filter Toggle with Framer Motion sliding pill */}
              <div className="flex items-center gap-1 bg-[#121212] p-1 border border-white/[0.08] text-xs">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`relative px-3 py-1.5 uppercase font-mono tracking-wider transition-colors z-10 cursor-pointer ${
                    filterMode === 'all' ? 'text-[#0B0B0B] font-bold' : 'text-[#AAA59D] hover:text-[#F1EEE8]'
                  }`}
                >
                  {filterMode === 'all' && (
                    <motion.div 
                      layoutId="weeklyFilterIndicator"
                      className="absolute inset-0 bg-[#F1EEE8] -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  All ({weeklySortedUsers.length})
                </button>

                <button
                  onClick={() => setFilterMode('active')}
                  className={`relative px-3 py-1.5 uppercase font-mono tracking-wider transition-colors z-10 cursor-pointer ${
                    filterMode === 'active' ? 'text-[#0B0B0B] font-bold' : 'text-[#AAA59D] hover:text-[#F1EEE8]'
                  }`}
                >
                  {filterMode === 'active' && (
                    <motion.div 
                      layoutId="weeklyFilterIndicator"
                      className="absolute inset-0 bg-[#FF7417] -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  Active ({roundStats.activeCount})
                </button>
              </div>

            </div>

            {/* Loading Skeleton */}
            {loading && weeklySortedUsers.length === 0 && (
              <div className="space-y-4 py-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-white/[0.02] border-b border-white/[0.06] animate-pulse" />
                ))}
                <p className="text-center text-xs font-mono text-[#77736D] py-4">
                  Computing round standings from LeetCode...
                </p>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────── */}
            {/* #01 WEEK LEADER — UNDERSTATED AMBIENT HIGHLIGHT             */}
            {/* ─────────────────────────────────────────────────────────── */}
            {displayedUsers.length > 0 && !searchQuery && (
              (() => {
                const leader = displayedUsers[0];
                const isLeaderUser = weeklyCurrentUser && leader.name.toLowerCase() === weeklyCurrentUser.name.toLowerCase();

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                  >
                    <Link
                      href={`/u/${leader.name}`}
                      className="group block relative p-4 sm:p-5 rounded-none transition-all duration-200 border-b border-white/[0.12] bg-gradient-to-r from-[#FF7417]/[0.08] via-[#FF7417]/[0.02] to-transparent hover:from-[#FF7417]/[0.12]"
                    >
                      {/* Left glowing marker */}
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#FF7417]" />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        
                        {/* Rank, Avatar & Competitor Info */}
                        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                          
                          {/* Numeral 01 */}
                          <div className="shrink-0 text-center w-10 sm:w-12">
                            <span 
                              className="text-4xl sm:text-5xl font-black text-[#FF7417] leading-none block tracking-tight"
                              style={{ fontFamily: 'var(--font-display), sans-serif' }}
                            >
                              01
                            </span>
                            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#FF7417] block mt-0.5">
                              Leader
                            </span>
                          </div>

                          {/* Square Avatar */}
                          <div className="relative shrink-0">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#161616] border border-[#FF7417]/60 overflow-hidden">
                              {leader.img ? (
                                <img 
                                  src={leader.img} 
                                  alt={leader.name} 
                                  className="w-full h-full object-cover contrast-110 group-hover:scale-105 transition-transform duration-200" 
                                />
                              ) : (
                                <div 
                                  className="w-full h-full flex items-center justify-center font-bold text-sm text-[#F1EEE8]"
                                  style={{ fontFamily: 'var(--font-display), sans-serif' }}
                                >
                                  {leader.sname?.slice(0, 2).toUpperCase() || leader.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            {isLeaderUser && (
                              <span 
                                className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF7417]" 
                                title="Your Profile"
                              />
                            )}
                          </div>

                          {/* Name & Breakdown */}
                          <div className="min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg sm:text-xl font-bold text-[#F1EEE8] group-hover:text-[#FF7417] transition-colors truncate">
                                {leader.sname || leader.name}
                              </span>
                              <span className="text-[10px] font-mono text-[#77736D] truncate hidden sm:inline">
                                @{leader.name}
                              </span>
                              {isLeaderUser && (
                                <span className="text-[9px] font-mono uppercase tracking-wider border border-[#FF7417] text-[#FF7417] font-semibold px-1 py-0.2 shrink-0">
                                  You
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-[#AAA59D] mt-1">
                              <span className="text-[#39BB75] font-semibold">
                                {leader.weeklySolved} solved this week
                              </span>
                              <span className="text-white/20">·</span>
                              <span>{leader.thisWeek}/7 active days</span>
                              <span className="text-white/20">·</span>
                              <span className="flex items-center gap-1 text-[#FF7417] font-mono">
                                <Flame className="w-3.5 h-3.5 fill-[#FF7417]" />
                                <span>{leader.currentStreak}d</span>
                              </span>
                            </div>

                            {/* 7-Day Attendance Matrix */}
                            <div className="flex items-center gap-1.5 mt-2.5">
                              {leader.weekDays.map((active, dayIdx) => (
                                <div 
                                  key={dayIdx} 
                                  className={`
                                    w-5 h-5 flex items-center justify-center text-[9px] font-mono font-bold transition-colors
                                    ${active 
                                      ? 'bg-[#39BB75] text-[#0B0B0B]' 
                                      : dayIdx <= currentDayIndex 
                                      ? 'bg-[#191919] text-[#77736D]' 
                                      : 'bg-transparent text-[#444444] border border-dashed border-white/10'}
                                    ${dayIdx === currentDayIndex ? 'ring-1 ring-[#FF7417]' : ''}
                                  `}
                                  title={`${DAY_FULL_NAMES[dayIdx]}: ${active ? 'Active' : 'No solves'}`}
                                >
                                  {DAY_LABELS[dayIdx]}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right: Weekly Points */}
                        <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-white/[0.08] pt-3 sm:pt-0 shrink-0">
                          <div className="sm:text-right font-mono">
                            <div 
                              className="text-3xl sm:text-4xl font-black text-[#FF7417] tabular-nums tracking-tight leading-none"
                              style={{ fontFamily: 'var(--font-display), sans-serif' }}
                            >
                              {leader.weeklyScore.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-[#77736D] uppercase tracking-wider mt-1">
                              week points
                            </div>
                          </div>
                          <div className="text-xs text-[#AAA59D] mt-1.5 sm:text-right font-mono">
                            <span className="text-[#F1EEE8] font-bold">{leader.solved}</span> total
                          </div>
                        </div>

                      </div>
                    </Link>
                  </motion.div>
                );
              })()
            )}

            {/* ─────────────────────────────────────────────────────────── */}
            {/* CHASE PACK SCOREBOARD (#02+) — CONTINUOUS OPEN LIST        */}
            {/* ─────────────────────────────────────────────────────────── */}
            <div className="divide-y divide-white/[0.06]">
              {(searchQuery ? displayedUsers : displayedUsers.slice(1)).map((user, idx) => {
                const actualRank = searchQuery 
                  ? weeklySortedUsers.findIndex(u => u.name === user.name) + 1 
                  : idx + 2;
                const isSecond = actualRank === 2;
                const isThird = actualRank === 3;
                const isUser = weeklyCurrentUser && user.name.toLowerCase() === weeklyCurrentUser.name.toLowerCase();

                return (
                  <motion.div
                    key={user.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15, delay: Math.min(idx * 0.015, 0.25) }}
                  >
                    <Link
                      href={`/u/${user.name}`}
                      className={`
                        group flex items-center gap-3.5 sm:gap-5 py-4 px-2 sm:px-3 transition-colors duration-150
                        hover:bg-white/[0.025]
                        ${isUser ? 'bg-[#FF7417]/[0.05] border-l-2 border-l-[#FF7417]' : ''}
                      `}
                    >
                      {/* Numeral Rank in Anton */}
                      <div className="shrink-0 w-8 sm:w-11 text-center">
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
                          <span 
                            className="text-xl sm:text-2xl font-black text-[#666666] leading-none block group-hover:text-[#AAA59D] transition-colors"
                            style={{ fontFamily: 'var(--font-display), sans-serif' }}
                          >
                            {formatRank(actualRank)}
                          </span>
                        )}
                      </div>

                      {/* Square Avatar */}
                      <div className="shrink-0 relative">
                        <div className={`
                          w-9 h-9 sm:w-10 sm:h-10 bg-[#161616] border overflow-hidden
                          ${isSecond ? 'border-white/30' : isThird ? 'border-[#C9A066]/30' : 'border-white/[0.08]'}
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
                            <span className="text-xs text-[#77736D] font-mono truncate hidden sm:inline">
                              @{user.name}
                            </span>
                          )}
                          {isUser && (
                            <span className="text-[9px] font-mono uppercase tracking-wider border border-[#FF7417] text-[#FF7417] font-semibold px-1 py-0.2 shrink-0">
                              You
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-xs text-[#AAA59D]">
                          <span className={`${user.weeklySolved > 0 ? 'text-[#39BB75] font-semibold' : 'text-[#77736D]'}`}>
                            {user.weeklySolved} solved
                          </span>
                          <span className="text-white/20">·</span>
                          <span>{user.thisWeek}/7 days</span>
                          <span className="text-white/20">·</span>
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Flame className={`w-3 h-3 ${user.currentStreak > 0 ? 'text-[#FF7417] fill-[#FF7417]' : 'text-[#444444]'}`} />
                            <span>{user.currentStreak}d</span>
                          </span>
                        </div>
                      </div>

                      {/* 7-Day Attendance Matrix (Desktop) */}
                      <div className="hidden md:flex items-center gap-1 shrink-0 px-2">
                        {user.weekDays.map((active, dayIdx) => (
                          <div 
                            key={dayIdx} 
                            className={`
                              w-4 h-4 flex items-center justify-center text-[8px] font-mono font-bold transition-colors
                              ${active 
                                ? 'bg-[#39BB75] text-[#0B0B0B]' 
                                : dayIdx <= currentDayIndex 
                                ? 'bg-[#191919] text-[#77736D]' 
                                : 'bg-transparent text-[#333333] border border-dashed border-white/5'}
                              ${dayIdx === currentDayIndex ? 'ring-1 ring-[#FF7417]' : ''}
                            `}
                            title={`${DAY_FULL_NAMES[dayIdx]}: ${active ? 'Active' : 'No solves'}`}
                          >
                            {DAY_LABELS[dayIdx]}
                          </div>
                        ))}
                      </div>

                      {/* Points */}
                      <div className="shrink-0 text-right min-w-[75px] font-mono">
                        <div className={`
                          font-bold text-sm sm:text-base tabular-nums transition-colors
                          ${user.weeklyScore > 0 ? 'text-[#F1EEE8] group-hover:text-[#FF7417]' : 'text-[#666666]'}
                        `}>
                          {user.weeklyScore.toLocaleString()}
                        </div>
                        <div className="text-[9px] text-[#77736D] uppercase tracking-wider">
                          pts
                        </div>
                      </div>

                      {/* Subtle Arrow */}
                      <ChevronRight className="w-4 h-4 text-[#444444] group-hover:text-[#F1EEE8] group-hover:translate-x-0.5 transition-all shrink-0 hidden sm:block" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Empty state */}
            {!loading && displayedUsers.length === 0 && (
              <div className="py-16 text-center border-t border-b border-white/[0.08]">
                <p 
                  className="text-xl uppercase text-[#F1EEE8] mb-1 font-black tracking-tight"
                  style={{ fontFamily: 'var(--font-display), sans-serif' }}
                >
                  No Competitors Found
                </p>
                <p className="text-xs text-[#AAA59D] mb-4">
                  No weekly participants matched &ldquo;{searchQuery}&rdquo;.
                </p>
                <button
                  onClick={() => { setFilterMode('all'); setSearchQuery(''); }}
                  className="inline-block bg-[#FF7417] text-[#0B0B0B] text-xs font-mono font-bold uppercase px-4 py-2 hover:bg-[#FF7417]/90 transition-colors cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* RIGHT: OPEN EDITORIAL HIGHLIGHTS & HUD     */}
          {/* ═══════════════════════════════════════════ */}
          <div className="lg:col-span-4 space-y-10 lg:sticky lg:top-24">
            
            {/* ── FLOATING USER POSITION HUD ── */}
            {weeklyCurrentUser && weeklyCurrentUserRank ? (
              <div className="floating-glass p-5 relative border border-white/[0.12]">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4 text-xs">
                  <span className="text-[#AAA59D] font-medium">Your Standing</span>
                  <span className="text-[#39BB75] font-mono text-[11px] font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#39BB75] animate-pulse" />
                    Authenticated
                  </span>
                </div>

                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#77736D] block">
                      Weekly Rank
                    </span>
                    <span 
                      className="text-5xl font-black text-[#F1EEE8] leading-none"
                      style={{ fontFamily: 'var(--font-display), sans-serif' }}
                    >
                      #{formatRank(weeklyCurrentUserRank)}
                    </span>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-2xl font-bold text-[#FF7417] block leading-none">
                      {weeklyCurrentUser.weeklyScore.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#77736D] uppercase mt-1 block">
                      pts this round
                    </span>
                  </div>
                </div>

                {/* 7-Day Attendance Matrix */}
                <div className="pt-2 pb-3">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-[#AAA59D]">Week Attendance</span>
                    <span className="text-[#39BB75] font-mono font-bold">
                      {weeklyCurrentUser.thisWeek} / 7 days
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {weeklyCurrentUser.weekDays.map((active, dayIdx) => (
                      <div 
                        key={dayIdx} 
                        className={`
                          py-1.5 flex flex-col items-center justify-center border text-[9px] font-mono font-bold
                          ${active 
                            ? 'bg-[#39BB75]/20 border-[#39BB75] text-[#39BB75]' 
                            : dayIdx <= currentDayIndex 
                            ? 'bg-white/[0.02] border-white/5 text-[#77736D]' 
                            : 'bg-transparent border-dashed border-white/10 text-[#444444]'}
                          ${dayIdx === currentDayIndex ? 'ring-1 ring-[#FF7417]' : ''}
                        `}
                      >
                        <span className="text-[8px] text-[#77736D]">{DAY_LABELS[dayIdx]}</span>
                        {active ? <Check className="w-2.5 h-2.5 text-[#39BB75] mt-0.5" /> : <span className="text-xs leading-none mt-0.5">·</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Overtake Progress */}
                {weeklyCurrentUserRank === 1 ? (
                  <div className="text-xs text-[#39BB75] font-medium flex items-center gap-2 pt-2 border-t border-white/[0.08]">
                    <Trophy className="w-4 h-4 text-[#FF7417]" />
                    <span>Round Leader — holding #1 this week</span>
                  </div>
                ) : gapToNext ? (
                  <div className="pt-2 border-t border-white/[0.08]">
                    <div className="flex justify-between items-baseline text-xs mb-1">
                      <span className="text-[#AAA59D] flex items-center gap-1 font-mono text-[11px]">
                        <Target className="w-3 h-3 text-[#FF7417]" />
                        <span>Gap to #{formatRank(gapToNext.targetRank)}</span>
                      </span>
                      <span className="text-[#FF7417] font-mono font-bold">+{gapToNext.points.toLocaleString()} pts</span>
                    </div>

                    <div className="w-full h-1.5 bg-white/[0.06] overflow-hidden my-2">
                      <motion.div 
                        className="h-full bg-[#FF7417]" 
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${Math.min(Math.max((weeklyCurrentUser.weeklyScore / (weeklyCurrentUser.weeklyScore + gapToNext.points)) * 100, 15), 92)}%` 
                        }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>

                    <p className="text-[11px] text-[#77736D] leading-relaxed">
                      Solve ~{gapToNext.problemsNeeded} medium problem{gapToNext.problemsNeeded > 1 ? 's' : ''} to overtake <span className="text-[#F1EEE8] font-semibold">@{gapToNext.targetUser}</span>.
                    </p>
                  </div>
                ) : null}

                <div className="flex items-center justify-between text-xs pt-3 mt-3 border-t border-white/[0.08]">
                  <Link
                    href={`/u/${weeklyCurrentUser.name}`}
                    className="text-[#F1EEE8] hover:text-[#FF7417] transition-colors flex items-center gap-1 group font-semibold"
                  >
                    <span>View Dossier</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                  <Link
                    href="/"
                    className="text-[#AAA59D] hover:text-[#F1EEE8] transition-colors"
                  >
                    <span>Overall Standings →</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="floating-glass p-5 border border-white/[0.12]">
                <h3 
                  className="text-xl font-black uppercase text-[#F1EEE8] mb-1 tracking-tight"
                  style={{ fontFamily: 'var(--font-display), sans-serif' }}
                >
                  Workstation Unbound
                </h3>
                <p className="text-xs text-[#AAA59D] mb-4 leading-relaxed">
                  Link this machine to your LeetCode handle to track your weekly standing and overtake distance in real time.
                </p>
                <Link
                  href="/user"
                  className="block w-full text-center bg-[#FF7417] text-[#0B0B0B] text-xs font-mono font-bold uppercase py-2.5 hover:bg-[#FF7417]/90 transition-colors"
                >
                  Link LeetCode Handle →
                </Link>
              </div>
            )}

            {/* ── OPEN EDITORIAL HIGHLIGHTS (NOT REPETITIVE BOXES) ── */}
            <div className="space-y-8 pt-2">
              
              {/* Section 1: Round Standouts */}
              {highlights && (
                <div className="border-t border-white/[0.08] pt-5">
                  <div className="flex items-baseline justify-between mb-4">
                    <h2 
                      className="text-sm font-black uppercase tracking-wider text-[#F1EEE8]"
                      style={{ fontFamily: 'var(--font-display), sans-serif' }}
                    >
                      Round Standouts
                    </h2>
                    <span className="text-[10px] font-mono text-[#77736D] uppercase">
                      Week {weekNumber}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Pace Setter */}
                    <Link 
                      href={`/u/${highlights.highestScorer.name}`}
                      className="group flex items-baseline justify-between py-1.5 border-b border-white/[0.04] hover:border-white/[0.12] transition-colors"
                    >
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#77736D] block">
                          Pace Setter
                        </span>
                        <span className="text-sm font-bold text-[#F1EEE8] group-hover:text-[#FF7417] transition-colors">
                          {highlights.highestScorer.sname || highlights.highestScorer.name}
                        </span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-sm font-bold text-[#39BB75]">{highlights.highestScorer.weeklyScore}</span>
                        <span className="text-[10px] text-[#77736D] ml-1">pts</span>
                      </div>
                    </Link>

                    {/* Most Consistent */}
                    <Link 
                      href={`/u/${highlights.mostConsistent.name}`}
                      className="group flex items-baseline justify-between py-1.5 border-b border-white/[0.04] hover:border-white/[0.12] transition-colors"
                    >
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#77736D] block">
                          Attendance Leader
                        </span>
                        <span className="text-sm font-bold text-[#F1EEE8] group-hover:text-[#FF7417] transition-colors">
                          {highlights.mostConsistent.sname || highlights.mostConsistent.name}
                        </span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-sm font-bold text-[#39BB75]">{highlights.mostConsistent.thisWeek}/7</span>
                        <span className="text-[10px] text-[#77736D] ml-1">days</span>
                      </div>
                    </Link>

                    {/* Active Streak */}
                    <Link 
                      href={`/u/${highlights.streakTitan.name}`}
                      className="group flex items-baseline justify-between py-1.5 border-b border-white/[0.04] hover:border-white/[0.12] transition-colors"
                    >
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#77736D] block">
                          Daily Streak
                        </span>
                        <span className="text-sm font-bold text-[#F1EEE8] group-hover:text-[#FF7417] transition-colors">
                          {highlights.streakTitan.sname || highlights.streakTitan.name}
                        </span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-sm font-bold text-[#FF7417]">{highlights.streakTitan.currentStreak}</span>
                        <span className="text-[10px] text-[#77736D] ml-1">days</span>
                      </div>
                    </Link>
                  </div>
                </div>
              )}

              {/* Section 2: Open Round Velocity Stats */}
              <div className="border-t border-white/[0.08] pt-5">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-3.5 h-3.5 text-[#FF7417]" />
                  <h2 
                    className="text-sm font-black uppercase tracking-wider text-[#F1EEE8]"
                    style={{ fontFamily: 'var(--font-display), sans-serif' }}
                  >
                    Cohort Velocity
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <span 
                      className="text-3xl font-black text-[#F1EEE8] block leading-none"
                      style={{ fontFamily: 'var(--font-display), sans-serif' }}
                    >
                      {roundStats.totalCount > 0 ? Math.round((roundStats.activeCount / roundStats.totalCount) * 100) : 0}%
                    </span>
                    <span className="text-[11px] text-[#AAA59D] mt-1 block">
                      Weekly participation
                    </span>
                  </div>

                  <div>
                    <span 
                      className="text-3xl font-black text-[#39BB75] block leading-none"
                      style={{ fontFamily: 'var(--font-display), sans-serif' }}
                    >
                      {roundStats.activeCount > 0 ? (roundStats.totalWeeklySolved / roundStats.activeCount).toFixed(1) : 0}
                    </span>
                    <span className="text-[11px] text-[#AAA59D] mt-1 block">
                      Solves / active solver
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Editorial Rules Note */}
              <div className="border-t border-white/[0.08] pt-4 text-xs text-[#77736D] space-y-1">
                <div className="flex justify-between items-baseline font-mono text-[11px] text-[#AAA59D] mb-1">
                  <span>Weekly Rules</span>
                  <span>Resets Sun 23:59 UTC</span>
                </div>
                <p className="leading-relaxed">
                  Weekly scores reflect problems solved strictly in the current calendar week.
                  Difficulty points: Easy 50, Medium 100, Hard 200.
                </p>
              </div>

            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
