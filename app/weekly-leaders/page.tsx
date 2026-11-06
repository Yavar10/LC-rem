'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowUpRight, 
  ChevronRight, 
  Flame, 
  Trophy, 
  Zap, 
  Clock, 
  Check, 
  Search,
  X,
  Target,
  Sparkles
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
        ? `FINAL DAY · ${hoursLeft}H LEFT` 
        : `${daysLeft}D ${hoursLeft}H LEFT`
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
    const problemsNeeded = Math.max(1, Math.ceil(diff / 100)); // estimated 100 pts per medium
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
      
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[480px] pointer-events-none overflow-hidden -z-10">
        <div className="w-full h-full ambient-orange opacity-60" />
      </div>

      {/* Shared Masthead Navigation */}
      <Navbar />

      {/* ── Main Container ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* ═══════════════════════════════════════════ */}
          {/* LEFT COLUMN: Hero + Weekly Leaderboard      */}
          {/* ═══════════════════════════════════════════ */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            
            {/* ── Editorial Hero Section ── */}
            <section className="border-b border-white/10 pb-8">
              
              {/* Overline Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#AAA59D] mb-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[#FF7417] font-bold text-[11px] uppercase tracking-wider bg-[#FF7417]/10 px-2.5 py-0.5 border border-[#FF7417]/25">
                    WEEK {weekNumber} / {year}
                  </span>
                  <span className="text-white/20">/</span>
                  <span className="text-[11px] uppercase tracking-wider text-[#77736D] hidden sm:inline">
                    MON 00:00 → SUN 23:59 UTC
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-[#FF7417]">
                  <Clock className="w-3.5 h-3.5 text-[#FF7417]" />
                  <span className="uppercase tracking-wider font-bold">{roundCountdown.label}</span>
                </div>
              </div>

              {/* Giant Editorial Headline */}
              <h1 
                className="text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-tight text-[#F1EEE8] leading-[0.88] select-none"
                style={{ fontFamily: 'var(--font-display), sans-serif' }}
              >
                WEEKLY<br />
                LEADERS
              </h1>

              {/* Editorial Subline Data Strip */}
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#AAA59D]">
                <div className="flex items-center gap-2">
                  <span className="text-[#F1EEE8] font-bold">{roundStats.activeCount}</span>
                  <span className="uppercase">ACTIVE OF {roundStats.totalCount}</span>
                  <span className="text-white/20">·</span>
                  <span className="text-[#39BB75] font-semibold">
                    {roundStats.totalWeeklySolved} SOLVED THIS WEEK
                  </span>
                </div>

                <div className="text-[10px] uppercase tracking-widest text-[#77736D]">
                  WEEKLY CUP ROUND
                </div>
              </div>
            </section>

            {/* ── Mobile Position Quick Bar (390px polish) ── */}
            {weeklyCurrentUser && weeklyCurrentUserRank && (
              <div className="lg:hidden border border-[#FF7417]/30 bg-[#161512] p-4 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 bg-[#FF7417]" />
                  <div>
                    <span className="text-[10px] text-[#77736D] uppercase block">YOUR WEEKLY STANDING</span>
                    <span 
                      className="text-lg font-bold text-[#F1EEE8] leading-none"
                      style={{ fontFamily: 'var(--font-display), sans-serif' }}
                    >
                      #{formatRank(weeklyCurrentUserRank)}
                    </span>
                    <span className="text-[#FF7417] ml-2 text-xs font-mono font-bold">
                      {weeklyCurrentUser.weeklyScore.toLocaleString()} PTS
                    </span>
                  </div>
                </div>

                {weeklyCurrentUserRank > 1 && gapToNext ? (
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
                    WEEK #01
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
                  placeholder="Filter weekly contender..."
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
                      layoutId="weeklyFilterIndicator"
                      className="absolute inset-0 bg-[#F1EEE8] -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  ALL ({weeklySortedUsers.length})
                </button>

                <button
                  onClick={() => setFilterMode('active')}
                  className={`relative px-3 py-1.5 uppercase transition-colors z-10 ${
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
                  ACTIVE THIS WEEK ({roundStats.activeCount})
                </button>
              </div>

            </div>

            {/* ── Loading Skeleton State ── */}
            {loading && weeklySortedUsers.length === 0 && (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="h-20 bg-[#111111] border border-white/10 animate-pulse" 
                  />
                ))}
                <p className="text-center text-xs font-mono text-[#77736D] py-4">
                  COMPUTING WEEKLY LEAGUE SCORES...
                </p>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────── */}
            {/* WEEKLY #01 SPOTLIGHT LEADER                                 */}
            {/* ─────────────────────────────────────────────────────────── */}
            {displayedUsers.length > 0 && !searchQuery && (
              (() => {
                const leader = displayedUsers[0];
                const isLeaderUser = weeklyCurrentUser && leader.name.toLowerCase() === weeklyCurrentUser.name.toLowerCase();

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Link
                      href={`/u/${leader.name}`}
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
                              WEEK LEADER
                            </span>
                          </div>

                          {/* Square Avatar */}
                          <div className="relative shrink-0">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#191919] border-2 border-[#FF7417] overflow-hidden">
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

                          {/* Name & Technical Breakdown */}
                          <div className="min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg sm:text-xl font-bold text-[#F1EEE8] group-hover:text-[#FF7417] transition-colors truncate">
                                {leader.sname || leader.name}
                              </span>
                              <span className="text-[9px] font-mono uppercase tracking-wider bg-[#FF7417] text-[#0B0B0B] font-bold px-1.5 py-0.2 shrink-0">
                                W{weekNumber} #1
                              </span>
                              {isLeaderUser && (
                                <span className="text-[9px] font-mono uppercase tracking-wider border border-[#FF7417] text-[#FF7417] font-semibold px-1 py-0.2 shrink-0">
                                  YOU
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#AAA59D] mt-1.5">
                              <span className="text-[#39BB75] font-bold">
                                {leader.weeklySolved} SOLVED THIS WEEK
                              </span>
                              <span className="text-white/20">·</span>
                              <span className="text-[#F1EEE8]">{leader.thisWeek}/7 DAYS ACTIVE</span>
                              <span className="text-white/20">·</span>
                              <span className="flex items-center gap-1 text-[#FF7417]">
                                <Flame className="w-3.5 h-3.5 fill-[#FF7417]" />
                                <span>{leader.currentStreak}D STREAK</span>
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
                                      ? 'bg-[#191919] text-[#77736D] border border-white/5' 
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
                        <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0 shrink-0">
                          <div className="sm:text-right font-mono">
                            <div 
                              className="text-3xl sm:text-4xl font-black text-[#FF7417] tabular-nums tracking-tight leading-none"
                              style={{ fontFamily: 'var(--font-display), sans-serif' }}
                            >
                              {leader.weeklyScore.toLocaleString()}
                            </div>
                            <div className="text-[9px] text-[#77736D] uppercase tracking-widest mt-1">
                              WEEKLY POINTS
                            </div>
                          </div>

                          <div className="text-xs font-mono text-[#AAA59D] mt-2 sm:text-right">
                            <span className="text-[#F1EEE8] font-bold">{leader.solved}</span> lifetime solves
                          </div>
                        </div>

                      </div>
                    </Link>
                  </motion.div>
                );
              })()
            )}

            {/* ─────────────────────────────────────────────────────────── */}
            {/* WEEKLY CHASE PACK TABLE (#02+ or searched rows)            */}
            {/* ─────────────────────────────────────────────────────────── */}
            <div className="border border-white/10 divide-y divide-white/5 bg-[#111111]">
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
                          <span className={`${user.weeklySolved > 0 ? 'text-[#39BB75] font-bold' : 'text-[#77736D]'}`}>
                            {user.weeklySolved} SOLVED
                          </span>
                          <span className="text-white/20">·</span>
                          <span>{user.thisWeek}/7 DAYS</span>
                          <span className="text-white/20">·</span>
                          <span className="flex items-center gap-1">
                            <Flame className={`w-3 h-3 ${user.currentStreak > 0 ? 'text-[#FF7417] fill-[#FF7417]' : 'text-[#444444]'}`} />
                            <span>{user.currentStreak}D</span>
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
                      <div className="shrink-0 text-right min-w-[70px] font-mono">
                        <div className={`
                          font-bold text-sm sm:text-base tabular-nums transition-colors
                          ${user.weeklyScore > 0 ? 'text-[#F1EEE8] group-hover:text-[#FF7417]' : 'text-[#666666]'}
                        `}>
                          {user.weeklyScore.toLocaleString()}
                        </div>
                        <div className="text-[8px] text-[#77736D] tracking-widest uppercase">
                          WEEK PTS
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
                  NO WEEKLY COMPETITORS FOUND
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
            
            {/* ── MODULE 1: WEEKLY CONTENDER DOSSIER ── */}
            <section className="border border-white/10 bg-[#111111] p-5 sm:p-6 relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 text-[10px] font-mono uppercase tracking-widest">
                <span className="text-[#AAA59D]">WEEKLY DOSSIER</span>
                <span className="text-[#FF7417] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF7417]" />
                  {weeklyCurrentUser ? 'AUTHENTICATED' : 'UNREGISTERED'}
                </span>
              </div>

              {weeklyCurrentUser && weeklyCurrentUserRank ? (
                <div>
                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <span className="text-[10px] font-mono text-[#77736D] uppercase block">
                        WEEKLY RANK
                      </span>
                      <span 
                        className="text-5xl font-black text-[#F1EEE8] tracking-tight leading-none"
                        style={{ fontFamily: 'var(--font-display), sans-serif' }}
                      >
                        #{formatRank(weeklyCurrentUserRank)}
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-2xl font-bold text-[#FF7417] block leading-none">
                        {weeklyCurrentUser.weeklyScore.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-[#77736D] uppercase mt-1 block">
                        WEEK PTS
                      </span>
                    </div>
                  </div>

                  {/* 7-Day Attendance Matrix for current user */}
                  <div className="bg-[#0B0B0B] p-4 border border-white/10 mb-4 font-mono">
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="text-[#AAA59D]">WEEK ATTENDANCE</span>
                      <span className="text-[#39BB75] font-bold">
                        {weeklyCurrentUser.thisWeek} OF 7 DAYS
                      </span>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5 my-2">
                      {weeklyCurrentUser.weekDays.map((active, dayIdx) => (
                        <div 
                          key={dayIdx} 
                          className={`
                            py-2 flex flex-col items-center justify-center border text-[10px] font-mono font-bold
                            ${active 
                              ? 'bg-[#39BB75]/20 border-[#39BB75] text-[#39BB75]' 
                              : dayIdx <= currentDayIndex 
                              ? 'bg-[#191919] border-white/5 text-[#77736D]' 
                              : 'bg-transparent border-dashed border-white/10 text-[#444444]'}
                            ${dayIdx === currentDayIndex ? 'ring-1 ring-[#FF7417]' : ''}
                          `}
                        >
                          <span className="text-[8px] text-[#77736D]">{DAY_LABELS[dayIdx]}</span>
                          {active ? <Check className="w-3 h-3 text-[#39BB75] mt-0.5" /> : <span className="text-xs leading-none mt-0.5">·</span>}
                        </div>
                      ))}
                    </div>

                    {/* Overtake Progress */}
                    {weeklyCurrentUserRank === 1 ? (
                      <div className="text-xs text-[#39BB75] font-semibold flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                        <Trophy className="w-4 h-4 text-[#FF7417]" />
                        <span>ROUND LEADER — YOU HOLD #1 THIS WEEK</span>
                      </div>
                    ) : gapToNext ? (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <div className="flex justify-between items-baseline text-xs mb-1">
                          <span className="text-[#AAA59D] flex items-center gap-1">
                            <Target className="w-3 h-3 text-[#FF7417]" />
                            <span>GAP TO #{formatRank(gapToNext.targetRank)}</span>
                          </span>
                          <span className="text-[#FF7417] font-bold">+{gapToNext.points.toLocaleString()} PTS</span>
                        </div>

                        <div className="w-full h-2 bg-[#191919] border border-white/5 overflow-hidden my-2">
                          <motion.div 
                            className="h-full bg-[#FF7417]" 
                            initial={{ width: 0 }}
                            animate={{ 
                              width: `${Math.min(Math.max((weeklyCurrentUser.weeklyScore / (weeklyCurrentUser.weeklyScore + gapToNext.points)) * 100, 15), 92)}%` 
                            }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                        </div>

                        <p className="text-[11px] text-[#77736D] mt-1.5 leading-relaxed">
                          Solve ~{gapToNext.problemsNeeded} medium problem{gapToNext.problemsNeeded > 1 ? 's' : ''} to overtake <span className="text-[#F1EEE8] font-bold">@{gapToNext.targetUser}</span> before the round resets.
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-white/10 font-mono">
                    <Link
                      href={`/u/${weeklyCurrentUser.name}`}
                      className="text-[#F1EEE8] hover:text-[#FF7417] transition-colors flex items-center gap-1 group font-bold"
                    >
                      <span>VIEW DOSSIER</span>
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                    <Link
                      href="/"
                      className="text-[#AAA59D] hover:text-[#F1EEE8] transition-colors flex items-center gap-1"
                    >
                      <span>OVERALL ROSTER</span>
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
                    Bind this machine to your LeetCode handle to track your weekly cup standings, overtake distance, and attendance matrix.
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

            {/* ── MODULE 2: WEEKLY ROUND VELOCITY ── */}
            <section className="border border-white/10 bg-[#111111] p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 font-mono">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-[#FF7417]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1EEE8]">
                    ROUND VELOCITY
                  </h3>
                </div>
                <span className="text-[10px] text-[#FF7417] font-semibold">
                  {roundCountdown.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="bg-[#0B0B0B] p-3 border border-white/10">
                  <span className="text-[#77736D] block text-[9px] uppercase">WEEK SOLVES</span>
                  <span className="text-xl font-black text-[#39BB75]">{roundStats.totalWeeklySolved}</span>
                </div>
                <div className="bg-[#0B0B0B] p-3 border border-white/10">
                  <span className="text-[#77736D] block text-[9px] uppercase">POINTS MINTED</span>
                  <span className="text-xl font-black text-[#FF7417]">{roundStats.totalWeeklyScore.toLocaleString()}</span>
                </div>
                <div className="bg-[#0B0B0B] p-3 border border-white/10">
                  <span className="text-[#77736D] block text-[9px] uppercase">PARTICIPATION RATE</span>
                  <span className="text-xl font-black text-[#F1EEE8]">
                    {roundStats.totalCount > 0 ? Math.round((roundStats.activeCount / roundStats.totalCount) * 100) : 0}%
                  </span>
                </div>
                <div className="bg-[#0B0B0B] p-3 border border-white/10">
                  <span className="text-[#77736D] block text-[9px] uppercase">AVG SOLVE / ACTIVE</span>
                  <span className="text-xl font-black text-[#F1EEE8]">
                    {roundStats.activeCount > 0 ? (roundStats.totalWeeklySolved / roundStats.activeCount).toFixed(1) : 0}
                  </span>
                </div>
              </div>
            </section>

            {/* ── MODULE 3: WEEKLY STANDOUTS ── */}
            {highlights && (
              <section className="border border-white/10 bg-[#111111] p-5 sm:p-6 space-y-3.5">
                <div className="border-b border-white/10 pb-3 flex items-baseline justify-between font-mono">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1EEE8]">
                    ROUND STANDOUTS
                  </h3>
                  <span className="text-[9px] text-[#77736D] uppercase">
                    WEEK {weekNumber}
                  </span>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  {/* Weekly Pace Setter */}
                  <Link 
                    href={`/u/${highlights.highestScorer.name}`}
                    className="p-3 bg-[#0B0B0B] border border-white/10 flex items-center justify-between hover:border-[#FF7417]/50 transition-colors block"
                  >
                    <div className="flex items-center gap-2.5">
                      <Trophy className="w-3.5 h-3.5 text-[#FF7417]" />
                      <span className="text-[#AAA59D] text-[10px] uppercase">PACE SETTER</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#F1EEE8] font-bold block">{highlights.highestScorer.sname || highlights.highestScorer.name}</span>
                      <span className="text-[10px] text-[#39BB75]">{highlights.highestScorer.weeklyScore} PTS</span>
                    </div>
                  </Link>

                  {/* Most Consistent */}
                  <Link 
                    href={`/u/${highlights.mostConsistent.name}`}
                    className="p-3 bg-[#0B0B0B] border border-white/10 flex items-center justify-between hover:border-[#39BB75]/50 transition-colors block"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#39BB75]" />
                      <span className="text-[#AAA59D] text-[10px] uppercase">MOST CONSISTENT</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#F1EEE8] font-bold block">{highlights.mostConsistent.sname || highlights.mostConsistent.name}</span>
                      <span className="text-[10px] text-[#39BB75]">{highlights.mostConsistent.thisWeek}/7 DAYS</span>
                    </div>
                  </Link>

                  {/* Active Streak */}
                  <Link 
                    href={`/u/${highlights.streakTitan.name}`}
                    className="p-3 bg-[#0B0B0B] border border-white/10 flex items-center justify-between hover:border-[#FF7417]/50 transition-colors block"
                  >
                    <div className="flex items-center gap-2.5">
                      <Flame className="w-3.5 h-3.5 text-[#FF7417] fill-[#FF7417]" />
                      <span className="text-[#AAA59D] text-[10px] uppercase">STREAK LEADER</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#F1EEE8] font-bold block">{highlights.streakTitan.sname || highlights.streakTitan.name}</span>
                      <span className="text-[10px] text-[#FF7417] font-bold">{highlights.streakTitan.currentStreak} DAYS</span>
                    </div>
                  </Link>
                </div>
              </section>
            )}

            {/* Protocol Spec */}
            <div className="border border-white/10 bg-[#111111] p-4 text-[10px] font-mono text-[#77736D] space-y-1.5">
              <div className="flex items-center justify-between text-[#AAA59D] font-bold">
                <span>WEEKLY PROTOCOL</span>
                <span className="text-[#F1EEE8]">RESETS SUNDAY 23:59 UTC</span>
              </div>
              <p>· Weekly scores reflect problems solved strictly in the current calendar week.</p>
              <p>· Formula: Easy × 50, Medium × 100, Hard × 200.</p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
