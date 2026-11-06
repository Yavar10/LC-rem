'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronRight, Flame, Trophy, Zap } from 'lucide-react';
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

export default function WeeklyLeadersPage() {
  const { 
    weeklySortedUsers, 
    loading, 
    weeklyCurrentUser, 
    weeklyCurrentUserRank, 
    registeredUsername 
  } = useLeaderboard();

  const { weekNumber, year } = useMemo(() => getISOWeekData(), []);

  // Today index (0 = Monday, ..., 6 = Sunday in UTC)
  const currentDayIndex = useMemo(() => {
    const day = new Date().getUTCDay();
    return day === 0 ? 6 : day - 1;
  }, []);

  // Calculate gap to participant above on the WEEKLY leaderboard
  const gapToNext = useMemo(() => {
    if (!weeklyCurrentUser || !weeklyCurrentUserRank || weeklyCurrentUserRank <= 1) return null;
    const aheadUser = weeklySortedUsers[weeklyCurrentUserRank - 2];
    if (!aheadUser) return null;
    const diff = aheadUser.weeklyScore - weeklyCurrentUser.weeklyScore;
    return {
      points: diff,
      targetRank: weeklyCurrentUserRank - 1,
      targetUser: aheadUser.sname || aheadUser.name
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

  const maxEasy = 800;
  const maxMed = 1700;
  const maxHard = 700;

  return (
    <div className="min-h-screen bg-[#101010] text-[#F2EEE6] selection:bg-[#FF7417] selection:text-[#101010] font-sans antialiased">
      
      {/* ── A. Compact Swiss Header ── */}
      <header className="border-b border-[#303030] bg-[#101010]/95 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-13 flex items-center justify-between">
          
          {/* Logo & League Identification */}
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="w-2.5 h-2.5 bg-[#FF7417] inline-block shrink-0" />
              <span 
                className="text-sm font-black tracking-widest uppercase text-[#F2EEE6] group-hover:text-[#FF7417] transition-colors"
                style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
              >
                LEETREM
              </span>
            </Link>
            <span className="text-[#303030] text-xs font-mono">/</span>
            <span 
              className="text-[10px] uppercase tracking-widest text-[#88847E]"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              WEEKLY CUP 26
            </span>
          </div>

          {/* Navigation Controls */}
          <nav 
            className="flex items-center gap-4 sm:gap-6 text-xs"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            <Link 
              href="/" 
              className="text-[#88847E] hover:text-[#F2EEE6] transition-colors hidden sm:inline"
            >
              OVERALL STANDINGS
            </Link>
            <div className="flex items-center gap-1 text-[#FF7417] font-semibold border-b border-[#FF7417] pb-0.5">
              <span>WEEKLY LEADERS</span>
            </div>
            <Link 
              href="/user" 
              className="text-[#88847E] hover:text-[#F2EEE6] transition-colors flex items-center gap-1"
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
            <section className="border-b border-[#303030] pb-6 sm:pb-8">
              
              {/* Overline Metadata */}
              <div 
                className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-[#88847E] mb-3 uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <span className="text-[#FF7417] font-bold">
                  WEEK {weekNumber} / {year}
                </span>
                <span>·</span>
                <span>CURRENT ROUND: MON 00:00 — SUN 23:59 UTC</span>
                <span>·</span>
                <span className="text-[#39B96F] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#39B96F] animate-pulse" /> LIVE
                </span>
              </div>

              {/* Giant Editorial Headline */}
              <h1 
                className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-[#F2EEE6] leading-[0.92]"
                style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
              >
                WEEKLY<br />
                LEADERS
              </h1>

              {/* Editorial Subline Bar */}
              <div 
                className="mt-5 pt-3.5 border-t border-[#303030] flex flex-wrap items-center justify-between gap-2 text-xs text-[#88847E]"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <p className="uppercase tracking-wider">
                  <span className="text-[#F2EEE6] font-bold">{weeklySortedUsers.length}</span> PARTICIPANTS · SCORED ON THIS WEEK&apos;S SUBMISSIONS
                </p>
                <p className="text-[10px] text-[#88847E]">
                  FORMULA: WEIGHTED PTS THIS WEEK
                </p>
              </div>
            </section>

            {/* ── MOBILE-ONLY QUICK POSITION BANNER (390px Mobile Usability) ── */}
            {weeklyCurrentUser && weeklyCurrentUserRank && (
              <div 
                className="lg:hidden border border-[#303030] bg-[#191919] p-3.5 flex items-center justify-between text-xs"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#88847E] uppercase">WEEKLY RANK</span>
                  <span className="font-bold text-[#FF7417] text-sm">#{formatRank(weeklyCurrentUserRank)}</span>
                  <span className="text-[#F2EEE6] font-semibold">{weeklyCurrentUser.weeklyScore.toLocaleString()} PTS</span>
                  <span className="text-[10px] text-[#88847E]">({weeklyCurrentUser.weeklySolved} solved)</span>
                </div>
                {weeklyCurrentUserRank > 1 && gapToNext ? (
                  <span className="text-[10px] text-[#88847E]">
                    <span className="text-[#FF7417]">+{gapToNext.points}</span> TO #{formatRank(gapToNext.targetRank)}
                  </span>
                ) : (
                  <span className="text-[10px] text-[#39B96F] font-bold">#1 WEEK LEADER</span>
                )}
              </div>
            )}

            {/* ── C. The Main Event: Weekly Leaderboard ── */}
            <section aria-label="Weekly Standings">
              
              <div 
                className="flex items-baseline justify-between mb-3 border-b border-[#303030] pb-2"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#F2EEE6]">
                  CURRENT WEEK STANDINGS
                </h2>
                <span className="text-[10px] text-[#88847E] uppercase">
                  SORTED BY WEEKLY POINTS
                </span>
              </div>

              {/* Loading State */}
              {loading && weeklySortedUsers.length === 0 && (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="h-16 bg-[#191919] border border-[#303030] animate-pulse" 
                    />
                  ))}
                  <p 
                    className="text-center text-xs text-[#88847E] py-4"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    CALCULATING WEEK {weekNumber} STANDINGS...
                  </p>
                </div>
              )}

              {/* Leaderboard Rows */}
              <div className="divide-y divide-[#222222] border-t border-b border-[#303030]">
                {weeklySortedUsers.map((user, idx) => {
                  const rank = idx + 1;
                  const isFirst = rank === 1;
                  const isSecond = rank === 2;
                  const isThird = rank === 3;
                  const isUser = weeklyCurrentUser && user.name.toLowerCase() === weeklyCurrentUser.name.toLowerCase();

                  return (
                    <Link
                      key={user.name}
                      href={`/u/${user.name}`}
                      className={`
                        group block transition-all duration-100 relative
                        ${isFirst 
                          ? 'bg-[#191919] border-l-4 border-l-[#FF7417] p-3.5 sm:p-4 my-2' 
                          : isSecond || isThird
                          ? 'bg-[#141414] hover:bg-[#1a1a1a] p-3 sm:p-3.5 my-1'
                          : 'hover:bg-[#161616] py-3 px-2 sm:px-3'}
                        ${isUser && !isFirst ? 'bg-[#181816] ring-1 ring-[#FF7417]/40' : ''}
                      `}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-4">
                        
                        {/* ── Position Numeral ── */}
                        <div className="shrink-0 w-7 sm:w-9 text-center">
                          {isFirst ? (
                            <span 
                              className="text-2xl sm:text-3xl font-black text-[#FF7417] leading-none block"
                              style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                            >
                              01
                            </span>
                          ) : isSecond ? (
                            <span 
                              className="text-lg sm:text-xl font-bold text-[#F2EEE6] leading-none block"
                              style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                            >
                              02
                            </span>
                          ) : isThird ? (
                            <span 
                              className="text-lg sm:text-xl font-bold text-[#88847E] leading-none block"
                              style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                            >
                              03
                            </span>
                          ) : (
                            <span 
                              className="text-xs text-[#88847E] font-medium"
                              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                            >
                              {formatRank(rank)}
                            </span>
                          )}
                        </div>

                        {/* ── Square Avatar ── */}
                        <div className="shrink-0 relative">
                          <div className={`
                            w-9 h-9 sm:w-11 sm:h-11 rounded-none overflow-hidden bg-[#222222] border
                            ${isFirst 
                              ? 'border-[#FF7417] ring-1 ring-[#FF7417]' 
                              : isSecond || isThird 
                              ? 'border-[#444444]' 
                              : 'border-[#303030]'}
                          `}>
                            {user.img ? (
                              <img 
                                src={user.img} 
                                alt={user.name} 
                                className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 transition-all duration-150" 
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

                        {/* ── Participant Name & Metadata ── */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5 sm:gap-2">
                            <span 
                              className={`
                                font-bold truncate tracking-tight text-sm sm:text-base
                                ${isFirst ? 'text-[#F2EEE6]' : 'text-[#F2EEE6] group-hover:text-[#FF7417]'}
                                transition-colors
                              `}
                              style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                            >
                              {user.sname || user.name}
                            </span>
                            {user.sname && user.sname !== user.name && (
                              <span 
                                className="text-[10px] text-[#88847E] truncate hidden sm:inline"
                                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                              >
                                @{user.name}
                              </span>
                            )}
                            {isFirst && (
                              <span 
                                className="text-[9px] uppercase tracking-wider bg-[#FF7417] text-[#101010] font-black px-1.5 py-0.2 shrink-0"
                                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                              >
                                WEEK LEADER
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

                          {/* Sub-info row: THIS WEEK's solved problems & streak */}
                          <div 
                            className="flex items-center gap-2 sm:gap-3 mt-0.5 text-[10px] text-[#88847E]"
                            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                          >
                            <span className="text-[#39B96F] font-semibold">
                              {user.weeklySolved} SOLVED THIS WEEK
                            </span>
                            <span>·</span>
                            <span>{user.thisWeek}/7 DAYS</span>
                            <span className="hidden sm:inline">·</span>
                            <span className="hidden sm:inline text-[#666666]">{user.solved} TOTAL</span>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <Flame className={`w-3 h-3 ${user.currentStreak > 0 ? 'text-[#FF7417]' : 'text-[#88847E]'}`} />
                              <span>{user.currentStreak}D</span>
                            </span>
                          </div>
                        </div>

                        {/* ── 7-Day Activity Sparkline (Desktop) ── */}
                        <div className="hidden md:flex items-center gap-1 shrink-0 px-2">
                          {user.weekDays.map((active, dayIdx) => (
                            <div 
                              key={dayIdx} 
                              className={`
                                w-1.5 h-4 transition-colors
                                ${active ? 'bg-[#39B96F]' : 'bg-[#222222]'}
                                ${dayIdx === currentDayIndex ? 'ring-1 ring-[#FF7417]' : ''}
                              `}
                              title={active ? 'Active this day' : 'No submissions'}
                            />
                          ))}
                        </div>

                        {/* ── Weekly Points ── */}
                        <div 
                          className="shrink-0 text-right"
                          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                        >
                          <div className={`
                            font-bold text-sm sm:text-base tabular-nums
                            ${isFirst ? 'text-[#FF7417]' : 'text-[#F2EEE6]'}
                          `}>
                            {user.weeklyScore.toLocaleString()}
                          </div>
                          <div className="text-[8px] text-[#88847E] tracking-widest uppercase">
                            WEEK PTS
                          </div>
                        </div>

                        {/* Row Navigation Arrow */}
                        <ChevronRight className="w-3.5 h-3.5 text-[#444444] group-hover:text-[#F2EEE6] transition-colors shrink-0 hidden sm:block" />
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Empty state */}
              {!loading && weeklySortedUsers.length === 0 && (
                <div className="border border-[#303030] p-10 text-center">
                  <p 
                    className="text-base uppercase text-[#F2EEE6] mb-1 font-bold"
                    style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                  >
                    NO LEAGUE PARTICIPANTS
                  </p>
                  <p 
                    className="text-xs text-[#88847E] mb-5"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    Connect LeetCode accounts to begin tracking weekly intensity.
                  </p>
                  <Link
                    href="/user"
                    className="inline-block bg-[#FF7417] text-[#101010] text-xs font-bold uppercase px-4 py-2 hover:bg-[#FF7417]/90 transition-colors"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    REGISTER LEETCODE ID
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* RIGHT COLUMN: My Position, Progress & Highlights */}
          {/* ═══════════════════════════════════════════ */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 sm:space-y-7">
            
            {/* ── D. MY POSITION CARD ── */}
            <section className="border border-[#303030] bg-[#191919] p-4 sm:p-5 relative">
              <div 
                className="flex items-center justify-between border-b border-[#303030] pb-2.5 mb-3.5 text-[10px] uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <span className="text-[#88847E]">WEEKLY POSITION</span>
                <span className="text-[#FF7417] font-semibold">
                  {weeklyCurrentUser ? 'LIVE SYNCED' : 'UNREGISTERED'}
                </span>
              </div>

              {weeklyCurrentUser && weeklyCurrentUserRank ? (
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span 
                      className="text-xs text-[#88847E] uppercase"
                      style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                    >
                      YOUR WEEKLY POSITION
                    </span>
                    <span 
                      className="text-3xl font-black text-[#F2EEE6]"
                      style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                    >
                      #{formatRank(weeklyCurrentUserRank)}
                    </span>
                  </div>

                  <div className="bg-[#101010] p-3.5 border border-[#303030] mb-3.5">
                    <div 
                      className="flex justify-between items-baseline"
                      style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                    >
                      <span className="text-[10px] text-[#88847E] uppercase">THIS WEEK&apos;S POINTS</span>
                      <span className="text-lg font-bold text-[#FF7417]">
                        {weeklyCurrentUser.weeklyScore.toLocaleString()} PTS
                      </span>
                    </div>

                    <div 
                      className="flex justify-between items-baseline mt-1 text-[11px]"
                      style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                    >
                      <span className="text-[#88847E]">PROBLEMS THIS WEEK</span>
                      <span className="text-[#39B96F] font-bold">
                        {weeklyCurrentUser.weeklySolved} SOLVED
                      </span>
                    </div>

                    {/* Gap calculation */}
                    <div 
                      className="mt-2.5 pt-2.5 border-t border-[#222222] text-xs"
                      style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                    >
                      {weeklyCurrentUserRank === 1 ? (
                        <p className="text-[#39B96F] font-semibold flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5" /> YOU LEAD THIS WEEK&apos;S LEAGUE
                        </p>
                      ) : gapToNext ? (
                        <p className="text-[#F2EEE6]">
                          <span className="text-[#FF7417] font-bold">+{gapToNext.points.toLocaleString()} PTS</span> TO #{formatRank(gapToNext.targetRank)}
                          <span className="text-[#88847E] block text-[10px] mt-0.5 truncate uppercase">
                            OVERTAKE {gapToNext.targetUser}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <Link
                    href={`/u/${weeklyCurrentUser.name}`}
                    className="flex items-center justify-between text-xs text-[#F2EEE6] hover:text-[#FF7417] transition-colors group"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    <span>VIEW PROFILE DASHBOARD</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>
              ) : (
                <div className="py-2 text-left">
                  <p 
                    className="text-sm font-bold uppercase text-[#F2EEE6] mb-1"
                    style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                  >
                    DEVICE UNLINKED
                  </p>
                  <p 
                    className="text-xs text-[#88847E] mb-4 leading-relaxed"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    Bind this machine to your LeetCode handle to track your live weekly position and distance metrics.
                  </p>
                  <Link
                    href="/user"
                    className="block w-full text-center bg-[#FF7417] text-[#101010] text-xs font-bold uppercase py-2 hover:bg-[#FF7417]/90 transition-colors"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    LINK LEETCODE ID
                  </Link>
                </div>
              )}
            </section>

            {/* ── E. MY PROGRESS & 7-DAY GRID ── */}
            {weeklyCurrentUser && (
              <section className="border border-[#303030] bg-[#191919] p-4 sm:p-5 space-y-5">
                <div 
                  className="flex items-center justify-between border-b border-[#303030] pb-2.5"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  <h3 
                    className="text-xs font-bold uppercase tracking-wider text-[#F2EEE6]"
                    style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                  >
                    7-DAY ACTIVITY GRID
                  </h3>
                  <span className="text-[10px] text-[#39B96F]">
                    {weeklyCurrentUser.thisWeek}/7 DAYS ACTIVE
                  </span>
                </div>

                {/* 7-Day Activity Grid */}
                <div>
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
                                : 'bg-[#101010] text-[#444444] border-[#303030]'}
                              ${isToday ? 'ring-2 ring-[#FF7417]' : ''}
                            `}
                            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                          >
                            {isDone ? '✓' : '·'}
                          </div>
                          <span 
                            className={`text-[9px] mt-1.5 ${isToday ? 'text-[#FF7417] font-bold' : 'text-[#88847E]'}`}
                            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                          >
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p 
                    className="text-[9px] text-[#88847E] mt-2.5 text-right uppercase"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    ORANGE BORDER = TODAY
                  </p>
                </div>

                {/* Numerical Overview */}
                <div 
                  className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#303030] text-xs"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  <div className="bg-[#101010] p-2.5 border border-[#303030]">
                    <span className="text-[#88847E] block text-[9px] uppercase">WEEKLY SOLVED</span>
                    <span className="text-sm font-bold text-[#39B96F]">{weeklyCurrentUser.weeklySolved} PROBLEMS</span>
                  </div>
                  <div className="bg-[#101010] p-2.5 border border-[#303030]">
                    <span className="text-[#88847E] block text-[9px] uppercase">ACTIVE STREAK</span>
                    <span className="text-sm font-bold text-[#FF7417]">{weeklyCurrentUser.currentStreak} DAYS</span>
                  </div>
                </div>

                {/* ── F. Problem Distribution ── */}
                <div className="space-y-2.5 pt-1">
                  <span 
                    className="text-[10px] uppercase tracking-widest text-[#88847E] block"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    ALL-TIME PROBLEM BREAKDOWN
                  </span>

                  {/* Easy */}
                  <div>
                    <div 
                      className="flex justify-between text-xs mb-1"
                      style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                    >
                      <span className="text-[#39B96F]">EASY</span>
                      <span className="text-[#88847E]">{weeklyCurrentUser.easy} <span className="text-[#444444]">/ {maxEasy}</span></span>
                    </div>
                    <div className="w-full h-1.5 bg-[#101010] border border-[#303030]">
                      <div 
                        className="h-full bg-[#39B96F]" 
                        style={{ width: `${Math.min((weeklyCurrentUser.easy / maxEasy) * 100, 100)}%` }} 
                      />
                    </div>
                  </div>

                  {/* Medium */}
                  <div>
                    <div 
                      className="flex justify-between text-xs mb-1"
                      style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                    >
                      <span className="text-[#FF7417]">MEDIUM</span>
                      <span className="text-[#88847E]">{weeklyCurrentUser.medium} <span className="text-[#444444]">/ {maxMed}</span></span>
                    </div>
                    <div className="w-full h-1.5 bg-[#101010] border border-[#303030]">
                      <div 
                        className="h-full bg-[#FF7417]" 
                        style={{ width: `${Math.min((weeklyCurrentUser.medium / maxMed) * 100, 100)}%` }} 
                      />
                    </div>
                  </div>

                  {/* Hard */}
                  <div>
                    <div 
                      className="flex justify-between text-xs mb-1"
                      style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                    >
                      <span className="text-[#E05A5A]">HARD</span>
                      <span className="text-[#88847E]">{weeklyCurrentUser.hard} <span className="text-[#444444]">/ {maxHard}</span></span>
                    </div>
                    <div className="w-full h-1.5 bg-[#101010] border border-[#303030]">
                      <div 
                        className="h-full bg-[#E05A5A]" 
                        style={{ width: `${Math.min((weeklyCurrentUser.hard / maxHard) * 100, 100)}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── G. Weekly Highlights (League Editorial Records) ── */}
            {highlights && (
              <section className="border border-[#303030] bg-[#191919] p-4 sm:p-5 space-y-3.5">
                <div className="border-b border-[#303030] pb-2.5">
                  <h3 
                    className="text-xs font-bold uppercase tracking-wider text-[#F2EEE6]"
                    style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                  >
                    WEEK {weekNumber} LEAGUE HIGHLIGHTS
                  </h3>
                  <span 
                    className="text-[9px] text-[#88847E] uppercase"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    TOP METRICS FOR THE CURRENT WEEK
                  </span>
                </div>

                <div 
                  className="space-y-2 text-xs"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  {/* Highest Scorer */}
                  <div className="flex items-center justify-between p-2 bg-[#101010] border border-[#303030]">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-3.5 h-3.5 text-[#FF7417]" />
                      <span className="text-[#88847E] text-[10px] uppercase">WEEK PACER</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#F2EEE6] font-bold block">{highlights.highestScorer.sname}</span>
                      <span className="text-[10px] text-[#FF7417]">{highlights.highestScorer.weeklyScore.toLocaleString()} PTS ({highlights.highestScorer.weeklySolved} solved)</span>
                    </div>
                  </div>

                  {/* Longest Streak */}
                  <div className="flex items-center justify-between p-2 bg-[#101010] border border-[#303030]">
                    <div className="flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 text-[#FF7417]" />
                      <span className="text-[#88847E] text-[10px] uppercase">ACTIVE STREAK</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#F2EEE6] font-bold block">{highlights.streakTitan.sname}</span>
                      <span className="text-[10px] text-[#39B96F]">{highlights.streakTitan.currentStreak} DAYS</span>
                    </div>
                  </div>

                  {/* Most consistent this week */}
                  <div className="flex items-center justify-between p-2 bg-[#101010] border border-[#303030]">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-[#FF7417]" />
                      <span className="text-[#88847E] text-[10px] uppercase">WEEK DAYS ACTIVE</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#F2EEE6] font-bold block">{highlights.mostConsistent.sname}</span>
                      <span className="text-[10px] text-[#FF7417]">{highlights.mostConsistent.thisWeek}/7 DAYS</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* League Note */}
            <div 
              className="border-t border-[#303030] pt-3 text-[10px] text-[#88847E] space-y-1"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              <p>· Weekly leaderboards reset Sundays at 23:59 UTC.</p>
              <p>· Individual participant data synced directly via LeetCode.</p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
