'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronRight, Flame, Trophy, Zap, Clock, ShieldCheck, Check, Activity } from 'lucide-react';
import { useLeaderboard } from '../context/LeaderboardContext';

// ─────────────────────────────────────
// Helpers
// ─────────────────────────────────────

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
    weeklyCurrentUserRank, 
    registeredUsername 
  } = useLeaderboard();

  const [filterMode, setFilterMode] = useState<'all' | 'active'>('all');

  const { weekNumber, year } = useMemo(() => getISOWeekData(), []);

  // Current UTC day (0 = Monday, ..., 6 = Sunday)
  const currentDayIndex = useMemo(() => {
    const day = new Date().getUTCDay();
    return day === 0 ? 6 : day - 1;
  }, []);

  // Time remaining in current weekly round (until Sunday 23:59:59 UTC)
  const roundCountdown = useMemo(() => {
    const now = new Date();
    const utcDay = now.getUTCDay(); // 0 = Sun, 1 = Mon ...
    const daysLeft = utcDay === 0 ? 0 : 7 - utcDay;
    const hoursLeft = 23 - now.getUTCHours();
    return {
      daysLeft,
      hoursLeft,
      isFinalDay: daysLeft === 0,
      label: daysLeft === 0 
        ? `FINAL DAY · ${hoursLeft}H LEFT` 
        : `${daysLeft}D ${hoursLeft}H REMAINING`
    };
  }, []);

  // Aggregate round statistics
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

  // Filtered leaderboard rows based on toggle
  const displayedUsers = useMemo(() => {
    if (filterMode === 'active') {
      return weeklySortedUsers.filter(u => u.weeklySolved > 0);
    }
    return weeklySortedUsers;
  }, [weeklySortedUsers, filterMode]);

  // Gap to participant above on the WEEKLY leaderboard
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

  // Editorial League Highlights derived strictly from THIS WEEK's performance
  const highlights = useMemo(() => {
    if (weeklySortedUsers.length === 0) return null;

    const highestScorer = weeklySortedUsers[0];
    const streakTitan = [...weeklySortedUsers].sort((a, b) => b.currentStreak - a.currentStreak)[0];
    const mostConsistent = [...weeklySortedUsers].sort((a, b) => b.thisWeek - a.thisWeek)[0];
    const topHardSolver = [...weeklySortedUsers].sort((a, b) => b.hard - a.hard)[0];

    return {
      highestScorer,
      streakTitan,
      mostConsistent,
      topHardSolver
    };
  }, [weeklySortedUsers]);


  return (
    <div className="min-h-screen bg-[#101010] text-[#F2EEE6] selection:bg-[#FF7417] selection:text-[#101010] font-sans antialiased">
      
      {/* ── A. Compact Swiss Editorial Header ── */}
      <header className="border-b border-[#2a2a2a] bg-[#101010]/95 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          
          {/* Logo & League Identification */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="w-2.5 h-2.5 bg-[#FF7417] inline-block shrink-0 transition-transform group-hover:scale-110" />
              <span 
                className="text-sm font-black tracking-widest uppercase text-[#F2EEE6] group-hover:text-[#FF7417] transition-colors"
                style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
              >
                LEETREM
              </span>
            </Link>
            <span className="text-[#3a3a3a] text-xs font-mono">/</span>
            <div className="flex items-center gap-1.5">
              <span 
                className="text-[11px] font-bold uppercase tracking-wider text-[#F2EEE6]"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                WEEK {weekNumber}
              </span>
              <span className="text-[10px] text-[#88847E] uppercase hidden sm:inline">
                · {year} SEASON
              </span>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav 
            className="flex items-center gap-5 sm:gap-7 text-xs"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            <Link 
              href="/" 
              className="text-[#88847E] hover:text-[#F2EEE6] transition-colors hidden sm:inline"
            >
              OVERALL STANDINGS
            </Link>
            <div className="flex items-center gap-1.5 text-[#FF7417] font-semibold border-b-2 border-[#FF7417] pb-1">
              <span>WEEKLY CUP</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF7417] animate-pulse" />
            </div>
            <Link 
              href="/user" 
              className="text-[#88847E] hover:text-[#F2EEE6] transition-colors flex items-center gap-1.5 border border-[#303030] px-2.5 py-1 hover:border-[#88847E]"
            >
              <span>{registeredUsername ? `@${registeredUsername}` : 'MY ID'}</span>
              <ArrowUpRight className="w-3 h-3 text-[#88847E]" />
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Main Container: Two-Column Swiss Grid ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* ═══════════════════════════════════════════ */}
          {/* LEFT COLUMN: Hero + The Main Event Leaderboard */}
          {/* ═══════════════════════════════════════════ */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6 sm:space-y-8">
            
            {/* ── B. Editorial Hero ── */}
            <section className="border-b border-[#2a2a2a] pb-6 sm:pb-8">
              
              {/* Overline Metadata Bar */}
              <div 
                className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#88847E] mb-4"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1 text-[#FF7417] font-bold text-[11px] uppercase tracking-wider bg-[#FF7417]/10 px-2 py-0.5 border border-[#FF7417]/25">
                    ROUND {weekNumber}
                  </span>
                  <span className="text-[#444444]">·</span>
                  <span className="text-[#F2EEE6] text-[11px] uppercase tracking-wider">
                    MON 00:00 — SUN 23:59 UTC
                  </span>
                </div>

                {/* Live Countdown Badge */}
                <div className="flex items-center gap-1.5 text-[11px] text-[#39B96F] font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{roundCountdown.label}</span>
                </div>
              </div>

              {/* Giant Editorial Headline */}
              <h1 
                className="text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-tighter text-[#F2EEE6] leading-[0.88]"
                style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
              >
                WEEKLY<br />
                LEADERS
              </h1>

              {/* Editorial Subline & League Pulse */}
              <div className="mt-5 pt-4 border-t border-[#262626] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div 
                  className="flex items-center gap-2 text-[#88847E]"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  <span className="text-[#F2EEE6] font-bold">
                    {roundStats.activeCount}
                  </span>
                  <span>OF</span>
                  <span className="text-[#F2EEE6] font-bold">
                    {roundStats.totalCount}
                  </span>
                  <span>PARTICIPANTS ACTIVE THIS ROUND</span>
                  <span>·</span>
                  <span className="text-[#39B96F] font-semibold">
                    {roundStats.totalWeeklySolved} PROBLEMS SOLVED
                  </span>
                </div>

                <div 
                  className="text-[10px] uppercase tracking-widest text-[#666666]"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  POINTS = E×50 · M×100 · H×200
                </div>
              </div>
            </section>

            {/* ── MOBILE-ONLY QUICK POSITION BANNER (390px Mobile Usability) ── */}
            {weeklyCurrentUser && weeklyCurrentUserRank && (
              <div 
                className="lg:hidden border border-[#FF7417]/30 bg-[#161512] p-3.5 flex items-center justify-between text-xs"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 bg-[#FF7417]" />
                  <div>
                    <span className="text-[10px] text-[#88847E] uppercase block">YOUR WEEKLY STANDING</span>
                    <span className="font-bold text-[#F2EEE6] text-sm">
                      #{formatRank(weeklyCurrentUserRank)}{' '}
                      <span className="text-[#FF7417] ml-1">{weeklyCurrentUser.weeklyScore.toLocaleString()} PTS</span>
                    </span>
                  </div>
                </div>

                {weeklyCurrentUserRank > 1 && gapToNext ? (
                  <div className="text-right">
                    <span className="text-[10px] text-[#FF7417] font-bold block">
                      +{gapToNext.points.toLocaleString()} PTS
                    </span>
                    <span className="text-[9px] text-[#88847E] uppercase">
                      TO #{formatRank(gapToNext.targetRank)}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-[#39B96F] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#39B96F]/10 border border-[#39B96F]/30">
                    ROUND LEADER
                  </span>
                )}
              </div>
            )}

            {/* ── C. The Main Event: Weekly Leaderboard ── */}
            <section aria-label="Weekly Standings">
              
              {/* Leaderboard Table Controls Bar */}
              <div 
                className="flex items-center justify-between mb-4 border-b border-[#2a2a2a] pb-2.5"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#FF7417]" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#F2EEE6]">
                    ROUND {weekNumber} STANDINGS
                  </h2>
                </div>

                {/* Filter Toggle: All vs Active Only */}
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`px-2.5 py-0.5 uppercase transition-colors ${
                      filterMode === 'all'
                        ? 'bg-[#262626] text-[#F2EEE6] font-bold border border-[#444444]'
                        : 'text-[#77746F] hover:text-[#F2EEE6]'
                    }`}
                  >
                    ALL ({roundStats.totalCount})
                  </button>
                  <button
                    onClick={() => setFilterMode('active')}
                    className={`px-2.5 py-0.5 uppercase transition-colors ${
                      filterMode === 'active'
                        ? 'bg-[#FF7417] text-[#101010] font-bold'
                        : 'text-[#77746F] hover:text-[#F2EEE6]'
                    }`}
                  >
                    ACTIVE ({roundStats.activeCount})
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {loading && weeklySortedUsers.length === 0 && (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="h-20 bg-[#151515] border border-[#2a2a2a] animate-pulse" 
                    />
                  ))}
                  <p 
                    className="text-center text-xs text-[#88847E] py-4"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    CALCULATING ROUND {weekNumber} LEAGUE PERFORMANCE...
                  </p>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────── */}
              {/* PODIUM LEADER (#01) — HERO COMPOSITION                     */}
              {/* ─────────────────────────────────────────────────────────── */}
              {displayedUsers.length > 0 && (() => {
                const leader = displayedUsers[0];
                const isLeaderUser = weeklyCurrentUser && leader.name.toLowerCase() === weeklyCurrentUser.name.toLowerCase();

                return (
                  <Link
                    href={`/u/${leader.name}`}
                    className="block group relative mb-4 border border-[#FF7417]/50 bg-[#161513] hover:bg-[#1a1815] transition-all p-4 sm:p-5"
                  >
                    {/* Top Accent Strip */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF7417] via-[#FF7417]/80 to-transparent" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      {/* Left: Rank, Avatar & Participant Info */}
                      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                        
                        {/* Numeral 01 with Champion Marker */}
                        <div className="shrink-0 text-center w-9 sm:w-11">
                          <span 
                            className="text-3xl sm:text-4xl font-black text-[#FF7417] leading-none block tracking-tight"
                            style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                          >
                            01
                          </span>
                          <span 
                            className="text-[8px] font-bold uppercase tracking-widest text-[#FF7417] block mt-0.5"
                            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                          >
                            PACE
                          </span>
                        </div>

                        {/* Square Avatar with Orange Border */}
                        <div className="relative shrink-0">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#222222] border-2 border-[#FF7417] overflow-hidden">
                            {leader.img ? (
                              <img 
                                src={leader.img} 
                                alt={leader.name} 
                                className="w-full h-full object-cover contrast-125 group-hover:scale-105 transition-transform duration-200" 
                              />
                            ) : (
                              <div 
                                className="w-full h-full flex items-center justify-center font-black text-sm text-[#F2EEE6]"
                                style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
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

                        {/* Name & Pace Metadata */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span 
                              className="text-base sm:text-lg font-bold text-[#F2EEE6] group-hover:text-[#FF7417] transition-colors truncate"
                              style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                            >
                              {leader.sname || leader.name}
                            </span>
                            <span 
                              className="text-[9px] uppercase tracking-wider bg-[#FF7417] text-[#101010] font-black px-1.5 py-0.2 shrink-0"
                              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                            >
                              PACING THE LEAGUE
                            </span>
                            {isLeaderUser && (
                              <span 
                                className="text-[9px] uppercase tracking-wider border border-[#FF7417] text-[#FF7417] font-semibold px-1 py-0.2 shrink-0"
                                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                              >
                                YOU
                              </span>
                            )}
                          </div>

                          <div 
                            className="flex flex-wrap items-center gap-2 text-xs text-[#88847E] mt-1"
                            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                          >
                            <span className="text-[#39B96F] font-semibold">
                              {leader.weeklySolved} PROBLEMS SOLVED
                            </span>
                            <span>·</span>
                            <span>{leader.thisWeek}/7 DAYS ACTIVE</span>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <Flame className="w-3.5 h-3.5 text-[#FF7417]" />
                              <span>{leader.currentStreak}D STREAK</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Points & Activity Sparkline */}
                      <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-[#2a2a2a] pt-3 sm:pt-0 shrink-0">
                        <div 
                          className="sm:text-right"
                          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                        >
                          <div 
                            className="text-2xl sm:text-3xl font-black text-[#FF7417] tabular-nums tracking-tight leading-none"
                            style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                          >
                            {leader.weeklyScore.toLocaleString()}
                          </div>
                          <div className="text-[9px] text-[#88847E] uppercase tracking-widest mt-1">
                            POINTS THIS ROUND
                          </div>
                        </div>

                        {/* 7-Day Mini Attendance Matrix */}
                        <div className="flex items-center gap-1 mt-2.5">
                          {leader.weekDays.map((active, dayIdx) => (
                            <div 
                              key={dayIdx} 
                              className="flex flex-col items-center"
                              title={`${DAY_FULL_NAMES[dayIdx]}: ${active ? 'Active (Submissions)' : 'Rest'}`}
                            >
                              <div 
                                className={`
                                  w-3 h-3 flex items-center justify-center text-[7px] font-bold border transition-colors
                                  ${active 
                                    ? 'bg-[#39B96F] text-[#101010] border-[#39B96F]' 
                                    : 'bg-[#191919] text-[#444444] border-[#303030]'}
                                  ${dayIdx === currentDayIndex ? 'ring-1 ring-[#FF7417]' : ''}
                                `}
                              >
                                {active ? '✓' : ''}
                              </div>
                              <span className="text-[7px] text-[#666666] font-mono mt-0.5">
                                {DAY_LABELS[dayIdx]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </Link>
                );
              })()}

              {/* ─────────────────────────────────────────────────────────── */}
              {/* CHASE PACK (#02+) — RHYTHMIC SWISS TABLE                   */}
              {/* ─────────────────────────────────────────────────────────── */}
              <div className="border border-[#262626] divide-y divide-[#202020] bg-[#121212]">
                {displayedUsers.slice(1).map((user, idx) => {
                  const actualRank = idx + 2;
                  const isSecond = actualRank === 2;
                  const isThird = actualRank === 3;
                  const isUser = weeklyCurrentUser && user.name.toLowerCase() === weeklyCurrentUser.name.toLowerCase();
                  const isInactive = user.weeklySolved === 0;

                  return (
                    <Link
                      key={user.name}
                      href={`/u/${user.name}`}
                      className={`
                        group block transition-colors duration-100 p-3 sm:p-3.5
                        ${isSecond 
                          ? 'bg-[#151515] hover:bg-[#1a1a1a]' 
                          : isThird 
                          ? 'bg-[#131313] hover:bg-[#181818]' 
                          : 'hover:bg-[#161616]'}
                        ${isUser ? 'ring-1 ring-[#FF7417]/50 bg-[#171614]' : ''}
                        ${isInactive ? 'opacity-70 hover:opacity-100' : ''}
                      `}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        
                        {/* ── Position Numeral ── */}
                        <div className="shrink-0 w-8 sm:w-9 text-center">
                          {isSecond ? (
                            <span 
                              className="text-xl sm:text-2xl font-bold text-[#F2EEE6] leading-none block"
                              style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                            >
                              02
                            </span>
                          ) : isThird ? (
                            <span 
                              className="text-xl sm:text-2xl font-bold text-[#b59a7a] leading-none block"
                              style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                            >
                              03
                            </span>
                          ) : (
                            <span 
                              className="text-xs text-[#77746F] font-semibold"
                              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                            >
                              {formatRank(actualRank)}
                            </span>
                          )}
                        </div>

                        {/* ── Square Avatar ── */}
                        <div className="shrink-0 relative">
                          <div className={`
                            w-9 h-9 sm:w-10 sm:h-10 bg-[#222222] border overflow-hidden
                            ${isSecond ? 'border-[#666666]' : isThird ? 'border-[#554737]' : 'border-[#2a2a2a]'}
                          `}>
                            {user.img ? (
                              <img 
                                src={user.img} 
                                alt={user.name} 
                                className="w-full h-full object-cover contrast-125 group-hover:scale-105 transition-transform" 
                              />
                            ) : (
                              <div 
                                className="w-full h-full flex items-center justify-center font-bold text-xs text-[#88847E]"
                                style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
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

                        {/* ── Participant Name & Stats ── */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span 
                              className={`
                                font-bold truncate tracking-tight text-sm sm:text-base transition-colors
                                ${isSecond ? 'text-[#F2EEE6] group-hover:text-[#FF7417]' : 'text-[#E0DDD5] group-hover:text-[#FF7417]'}
                              `}
                              style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                            >
                              {user.sname || user.name}
                            </span>
                            {user.sname && user.sname !== user.name && (
                              <span 
                                className="text-[10px] text-[#77746F] truncate hidden sm:inline"
                                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                              >
                                @{user.name}
                              </span>
                            )}
                            {isUser && (
                              <span 
                                className="text-[9px] uppercase tracking-wider border border-[#FF7417] text-[#FF7417] font-semibold px-1 py-0.2 shrink-0"
                                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                              >
                                YOU
                              </span>
                            )}
                          </div>

                          {/* Weekly Problem Count & Consistency */}
                          <div 
                            className="flex items-center gap-2 mt-0.5 text-[10px] text-[#88847E]"
                            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                          >
                            {isInactive ? (
                              <span className="text-[#666666]">NO SUBMISSIONS YET THIS ROUND</span>
                            ) : (
                              <>
                                <span className="text-[#39B96F] font-semibold">
                                  {user.weeklySolved} SOLVED THIS ROUND
                                </span>
                                <span>·</span>
                                <span>{user.thisWeek}/7 DAYS</span>
                              </>
                            )}
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <Flame className={`w-3 h-3 ${user.currentStreak > 0 ? 'text-[#FF7417]' : 'text-[#666666]'}`} />
                              <span>{user.currentStreak}D</span>
                            </span>
                          </div>
                        </div>

                        {/* ── Mini 7-Day Day Strip (Desktop) ── */}
                        <div className="hidden md:flex items-center gap-1 shrink-0 px-2">
                          {user.weekDays.map((active, dayIdx) => (
                            <div 
                              key={dayIdx} 
                              className="flex flex-col items-center"
                              title={`${DAY_FULL_NAMES[dayIdx]}: ${active ? 'Active' : 'Rest'}`}
                            >
                              <div 
                                className={`
                                  w-2 h-3.5 transition-colors
                                  ${active ? 'bg-[#39B96F]' : 'bg-[#222222]'}
                                  ${dayIdx === currentDayIndex ? 'ring-1 ring-[#FF7417]' : ''}
                                `}
                              />
                            </div>
                          ))}
                        </div>

                        {/* ── Weekly Points ── */}
                        <div 
                          className="shrink-0 text-right min-w-[70px]"
                          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                        >
                          <div className={`
                            font-bold text-sm sm:text-base tabular-nums
                            ${isInactive ? 'text-[#555555]' : isSecond ? 'text-[#F2EEE6]' : 'text-[#DCD7CE]'}
                          `}>
                            {user.weeklyScore.toLocaleString()}
                          </div>
                          <div className="text-[8px] text-[#77746F] tracking-widest uppercase">
                            ROUND PTS
                          </div>
                        </div>

                        {/* Chevron Indicator */}
                        <ChevronRight className="w-3.5 h-3.5 text-[#3a3a3a] group-hover:text-[#F2EEE6] transition-colors shrink-0 hidden sm:block" />
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Empty state */}
              {!loading && displayedUsers.length === 0 && (
                <div className="border border-[#2a2a2a] p-10 text-center bg-[#141414]">
                  <p 
                    className="text-base uppercase text-[#F2EEE6] mb-1 font-bold"
                    style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                  >
                    NO ACTIVE PARTICIPANTS THIS ROUND
                  </p>
                  <p 
                    className="text-xs text-[#88847E] mb-5"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    Switch the filter to &quot;ALL&quot; or solve problems on LeetCode to appear here.
                  </p>
                  <button
                    onClick={() => setFilterMode('all')}
                    className="inline-block bg-[#FF7417] text-[#101010] text-xs font-bold uppercase px-4 py-2 hover:bg-[#FF7417]/90 transition-colors font-mono"
                  >
                    SHOW ALL PARTICIPANTS
                  </button>
                </div>
              )}
            </section>
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* RIGHT COLUMN: Asymmetrical Editorial Sidebar */}
          {/* ═══════════════════════════════════════════ */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            
            {/* ── MODULE 1: YOUR POSITION (PERSONAL PERFORMANCE) ── */}
            <section className="border border-[#2a2a2a] bg-[#141414] p-5 relative">
              <div 
                className="flex items-center justify-between border-b border-[#262626] pb-3 mb-4 text-[10px] uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <span className="text-[#88847E]">PERSONAL STANDING</span>
                <span className="text-[#FF7417] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF7417]" />
                  {weeklyCurrentUser ? 'AUTHENTICATED' : 'UNREGISTERED'}
                </span>
              </div>

              {weeklyCurrentUser && weeklyCurrentUserRank ? (
                <div>
                  {/* Huge Position Display */}
                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <span 
                        className="text-[10px] text-[#88847E] uppercase block"
                        style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                      >
                        ROUND {weekNumber} RANK
                      </span>
                      <span 
                        className="text-4xl font-black text-[#F2EEE6] tracking-tight leading-none"
                        style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                      >
                        #{formatRank(weeklyCurrentUserRank)}
                      </span>
                    </div>

                    <div 
                      className="text-right"
                      style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                    >
                      <span className="text-xl font-bold text-[#FF7417] block leading-none">
                        {weeklyCurrentUser.weeklyScore.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-[#88847E] uppercase mt-0.5 block">
                        PTS THIS ROUND
                      </span>
                    </div>
                  </div>

                  {/* Competitive Overtake Gap Bar */}
                  <div className="bg-[#101010] p-3.5 border border-[#262626] mb-4">
                    {weeklyCurrentUserRank === 1 ? (
                      <div 
                        className="text-xs text-[#39B96F] font-semibold flex items-center gap-1.5"
                        style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                      >
                        <Trophy className="w-4 h-4 text-[#FF7417]" />
                        <span>PACING ROUND {weekNumber} — MAINTAIN THE LEAD</span>
                      </div>
                    ) : gapToNext ? (
                      <div style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
                        <div className="flex justify-between items-baseline text-xs mb-1">
                          <span className="text-[#88847E]">DISTANCE TO #{formatRank(gapToNext.targetRank)}</span>
                          <span className="text-[#FF7417] font-bold">+{gapToNext.points.toLocaleString()} PTS</span>
                        </div>
                        
                        {/* Progress Bar towards next rank */}
                        <div className="w-full h-1.5 bg-[#202020] overflow-hidden my-2">
                          <div 
                            className="h-full bg-[#FF7417]" 
                            style={{ 
                              width: `${Math.min(Math.max((weeklyCurrentUser.weeklyScore / (weeklyCurrentUser.weeklyScore + gapToNext.points)) * 100, 15), 90)}%` 
                            }} 
                          />
                        </div>

                        <p className="text-[10px] text-[#88847E] mt-1">
                          Crack ~{gapToNext.problemsNeeded} medium problem{gapToNext.problemsNeeded > 1 ? 's' : ''} to overtake <span className="text-[#F2EEE6]">@{gapToNext.targetUser}</span>.
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {/* 7-Day Personal Attendance Grid */}
                  <div className="mb-4">
                    <span 
                      className="text-[9px] uppercase tracking-widest text-[#88847E] block mb-2"
                      style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                    >
                      YOUR WEEKLY ATTENDANCE ({weeklyCurrentUser.thisWeek}/7 DAYS)
                    </span>
                    <div className="grid grid-cols-7 gap-1.5 text-center">
                      {DAY_LABELS.map((label, i) => {
                        const isToday = i === currentDayIndex;
                        const isDone = weeklyCurrentUser.weekDays[i];

                        return (
                          <div key={i} className="flex flex-col items-center">
                            <div 
                              className={`
                                w-full aspect-square flex items-center justify-center text-xs font-bold border transition-colors
                                ${isDone 
                                  ? 'bg-[#39B96F] text-[#101010] border-[#39B96F]' 
                                  : 'bg-[#101010] text-[#3a3a3a] border-[#262626]'}
                                ${isToday ? 'ring-2 ring-[#FF7417]' : ''}
                              `}
                              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                            >
                              {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : '·'}
                            </div>
                            <span 
                              className={`text-[8px] mt-1 ${isToday ? 'text-[#FF7417] font-bold' : 'text-[#666666]'}`}
                              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                            >
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Link
                    href={`/u/${weeklyCurrentUser.name}`}
                    className="flex items-center justify-between text-xs text-[#F2EEE6] hover:text-[#FF7417] transition-colors pt-2 border-t border-[#262626] group"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    <span>OPEN FULL PROFILE DASHBOARD</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>
              ) : (
                /* Unlinked Device Prompt */
                <div className="py-2 text-left">
                  <div 
                    className="text-xs uppercase text-[#FF7417] font-bold mb-1 flex items-center gap-1.5"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    <ShieldCheck className="w-4 h-4 text-[#FF7417]" />
                    <span>CLAIM YOUR STANDING</span>
                  </div>
                  <h3 
                    className="text-lg font-bold uppercase text-[#F2EEE6] mb-1"
                    style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                  >
                    WORKSTATION UNBOUND
                  </h3>
                  <p 
                    className="text-xs text-[#88847E] mb-4 leading-relaxed"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    Bind this machine to your LeetCode handle. Your hardware signature persists across tabs and browsers without passwords.
                  </p>
                  <Link
                    href="/user"
                    className="block w-full text-center bg-[#FF7417] text-[#101010] text-xs font-bold uppercase py-2.5 hover:bg-[#FF7417]/90 transition-colors font-mono"
                  >
                    LINK LEETCODE HANDLE →
                  </Link>
                </div>
              )}
            </section>

            {/* ── MODULE 2: ROUND HIGHLIGHTS (EDITORIAL RECORDS) ── */}
            {highlights && (
              <section className="border border-[#2a2a2a] bg-[#141414] p-5 space-y-4">
                <div className="border-b border-[#262626] pb-2.5 flex items-baseline justify-between">
                  <h3 
                    className="text-xs font-bold uppercase tracking-wider text-[#F2EEE6]"
                    style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                  >
                    ROUND {weekNumber} LEAD RECORDS
                  </h3>
                  <span 
                    className="text-[9px] text-[#88847E] uppercase"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    TOP PERFORMERS
                  </span>
                </div>

                <div 
                  className="space-y-2.5 text-xs"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  {/* Pacesetter */}
                  <div className="p-3 bg-[#101010] border border-[#262626] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-[#FF7417]/10 text-[#FF7417] border border-[#FF7417]/25">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] text-[#88847E] uppercase block">TOP PACESETTER</span>
                        <span className="text-[#F2EEE6] font-bold text-sm">{highlights.highestScorer.sname}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[#FF7417] font-bold block">{highlights.highestScorer.weeklyScore.toLocaleString()} PTS</span>
                      <span className="text-[10px] text-[#88847E]">{highlights.highestScorer.weeklySolved} solved</span>
                    </div>
                  </div>

                  {/* Active Streak */}
                  <div className="p-3 bg-[#101010] border border-[#262626] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-[#FF7417]/10 text-[#FF7417] border border-[#FF7417]/25">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] text-[#88847E] uppercase block">ACTIVE STREAK TITAN</span>
                        <span className="text-[#F2EEE6] font-bold">{highlights.streakTitan.sname}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[#39B96F] font-bold text-sm block">{highlights.streakTitan.currentStreak} DAYS</span>
                      <span className="text-[10px] text-[#88847E]">consecutive</span>
                    </div>
                  </div>

                  {/* Most Days Active */}
                  <div className="p-3 bg-[#101010] border border-[#262626] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-[#39B96F]/10 text-[#39B96F] border border-[#39B96F]/25">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] text-[#88847E] uppercase block">MOST ACTIVE THIS ROUND</span>
                        <span className="text-[#F2EEE6] font-bold">{highlights.mostConsistent.sname}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[#FF7417] font-bold text-sm block">{highlights.mostConsistent.thisWeek} / 7 DAYS</span>
                      <span className="text-[10px] text-[#88847E]">participation</span>
                    </div>
                  </div>

                  {/* League Volume Total */}
                  <div className="p-3 bg-[#101010] border border-[#262626] flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-[#88847E] uppercase block">COLLECTIVE LEAGUE VOLUME</span>
                      <span className="text-[#F2EEE6] font-bold">{roundStats.totalWeeklySolved} PROBLEMS SOLVED</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#39B96F] font-bold text-sm block">{(roundStats.totalWeeklyScore / 1000).toFixed(1)}k PTS</span>
                      <span className="text-[10px] text-[#88847E]">minted this week</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── MODULE 3: ROUND PROTOCOL & RULES ── */}
            <div 
              className="border border-[#262626] bg-[#141414] p-4 text-[10px] text-[#88847E] space-y-2"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              <div className="flex items-center justify-between text-[#F2EEE6] font-bold border-b border-[#262626] pb-2">
                <span>ROUND PROTOCOL</span>
                <span className="text-[#FF7417]">{roundCountdown.label}</span>
              </div>
              <p>· Rounds reset every Sunday at 23:59:59 UTC.</p>
              <p>· Solved submissions sync from LeetCode&apos;s activity calendar.</p>
              <p>· Scoring formula: Easy × 50 · Medium × 100 · Hard × 200.</p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
