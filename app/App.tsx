'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronRight, Flame, Trophy, Sparkles } from 'lucide-react';
import { useLeaderboard } from './context/LeaderboardContext';

// ─────────────────────────────────────
// Helpers
// ─────────────────────────────────────

function formatRank(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

export default function App() {
  const { 
    users, 
    overallSortedUsers, 
    loading, 
    currentUser, 
    currentUserRank, 
    registeredUsername 
  } = useLeaderboard();

  // Gap to participant above on the OVERALL leaderboard
  const gapToNext = useMemo(() => {
    if (!currentUser || !currentUserRank || currentUserRank <= 1) return null;
    const aheadUser = overallSortedUsers[currentUserRank - 2];
    if (!aheadUser) return null;
    const diff = aheadUser.score - currentUser.score;
    return {
      points: diff,
      targetRank: currentUserRank - 1,
      targetUser: aheadUser.sname || aheadUser.name
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

    return {
      totalSolved,
      totalEasy,
      totalMed,
      totalHard,
      totalScore,
      avgScore,
      topHardSolver,
      streakTitan,
      topVolume
    };
  }, [users]);

  return (
    <div className="min-h-screen bg-[#101010] text-[#F2EEE6] selection:bg-[#FF7417] selection:text-[#101010] font-sans antialiased">
      
      {/* ── Compact Swiss Header ── */}
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
              ALL-TIME STANDINGS
            </span>
          </div>

          {/* Navigation Controls */}
          <nav 
            className="flex items-center gap-4 sm:gap-6 text-xs"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            <div className="flex items-center gap-1 text-[#FF7417] font-semibold border-b border-[#FF7417] pb-0.5">
              <span>OVERALL STANDINGS</span>
            </div>
            <Link 
              href="/weekly-leaders" 
              className="text-[#88847E] hover:text-[#F2EEE6] transition-colors flex items-center gap-1"
            >
              <span>WEEKLY LEADERS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#39B96F] inline-block" />
            </Link>
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
            
            {/* ── Editorial Hero ── */}
            <section className="border-b border-[#303030] pb-6 sm:pb-8">
              
              {/* Overline Metadata */}
              <div 
                className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-[#88847E] mb-3 uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <span className="text-[#FF7417] font-bold">
                  MENTORSHIP LEAGUE
                </span>
                <span>·</span>
                <span>WEIGHTED FORMULA: E×50 · M×100 · H×200</span>
                <span>·</span>
                <span className="text-[#39B96F] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#39B96F]" /> GLOBAL ROSTER
                </span>
              </div>

              {/* Giant Editorial Headline */}
              <h1 
                className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-[#F2EEE6] leading-[0.92]"
                style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
              >
                OVERALL<br />
                LEADERS
              </h1>

              {/* Editorial Subline Bar */}
              <div 
                className="mt-5 pt-3.5 border-t border-[#303030] flex flex-wrap items-center justify-between gap-2 text-xs text-[#88847E]"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <p className="uppercase tracking-wider">
                  <span className="text-[#F2EEE6] font-bold">{overallSortedUsers.length}</span> PARTICIPANTS · {leagueStats?.totalSolved.toLocaleString() || '0'} COMBINED SOLVED
                </p>
                <p className="text-[10px] text-[#88847E]">
                  HARDS HIT DIFFERENT
                </p>
              </div>
            </section>

            {/* ── MOBILE-ONLY QUICK POSITION BANNER (390px Mobile Usability) ── */}
            {currentUser && currentUserRank && (
              <div 
                className="lg:hidden border border-[#303030] bg-[#191919] p-3.5 flex items-center justify-between text-xs"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#88847E] uppercase">OVERALL RANK</span>
                  <span className="font-bold text-[#FF7417] text-sm">#{formatRank(currentUserRank)}</span>
                  <span className="text-[#F2EEE6] font-semibold">{currentUser.score.toLocaleString()} PTS</span>
                  <span className="text-[10px] text-[#88847E]">({currentUser.solved} solved)</span>
                </div>
                {currentUserRank > 1 && gapToNext ? (
                  <span className="text-[10px] text-[#88847E]">
                    <span className="text-[#FF7417]">+{gapToNext.points.toLocaleString()}</span> TO #{formatRank(gapToNext.targetRank)}
                  </span>
                ) : (
                  <span className="text-[10px] text-[#39B96F] font-bold">#1 OVERALL LEADER</span>
                )}
              </div>
            )}

            {/* ── The Main Event: Overall Leaderboard ── */}
            <section aria-label="Overall Standings">
              
              <div 
                className="flex items-baseline justify-between mb-3 border-b border-[#303030] pb-2"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#F2EEE6]">
                  ALL-TIME STANDINGS
                </h2>
                <span className="text-[10px] text-[#88847E] uppercase">
                  SORTED BY WEIGHTED SCORE
                </span>
              </div>

              {/* Loading State */}
              {loading && overallSortedUsers.length === 0 && (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="h-16 bg-[#191919] border border-[#303030] animate-pulse" 
                    />
                  ))}
                  <p 
                    className="text-center text-xs text-[#88847E] py-4"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    SYNCING LEAGUE DATA DIRECTLY FROM LEETCODE...
                  </p>
                </div>
              )}

              {/* Leaderboard Rows */}
              <div className="divide-y divide-[#222222] border-t border-b border-[#303030]">
                {overallSortedUsers.map((user, idx) => {
                  const rank = idx + 1;
                  const isFirst = rank === 1;
                  const isSecond = rank === 2;
                  const isThird = rank === 3;
                  const isUser = currentUser && user.name.toLowerCase() === currentUser.name.toLowerCase();

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
                              title="Your Account"
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
                                LEAGUE TITAN
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

                          {/* Sub-info row: difficulty breakdown & streak */}
                          <div 
                            className="flex items-center gap-2 sm:gap-3 mt-0.5 text-[10px] text-[#88847E]"
                            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                          >
                            <span className="text-[#F2EEE6] font-semibold">
                              {user.solved} SOLVED
                            </span>
                            <span>·</span>
                            <span className="text-[#39B96F]">{user.easy}E</span>
                            <span className="text-[#FF7417]">{user.medium}M</span>
                            <span className="text-[#E05A5A]">{user.hard}H</span>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <Flame className={`w-3 h-3 ${user.currentStreak > 0 ? 'text-[#FF7417]' : 'text-[#88847E]'}`} />
                              <span>{user.currentStreak}D STREAK</span>
                            </span>
                          </div>
                        </div>

                        {/* ── 8-Day Dot Sparkline (Desktop) ── */}
                        <div className="hidden md:flex items-center gap-1 shrink-0 px-2">
                          {user.streak.map((active, dotIdx) => (
                            <div 
                              key={dotIdx} 
                              className={`
                                w-1.5 h-1.5 transition-colors
                                ${active ? 'bg-[#39B96F]' : 'bg-[#222222]'}
                                ${dotIdx === user.streak.length - 1 ? 'ring-1 ring-[#FF7417]' : ''}
                              `}
                              title={active ? 'Solved problems' : 'Inactive'}
                            />
                          ))}
                        </div>

                        {/* ── All-Time Points ── */}
                        <div 
                          className="shrink-0 text-right"
                          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                        >
                          <div className={`
                            font-bold text-sm sm:text-base tabular-nums
                            ${isFirst ? 'text-[#FF7417]' : 'text-[#F2EEE6]'}
                          `}>
                            {user.score.toLocaleString()}
                          </div>
                          <div className="text-[8px] text-[#88847E] tracking-widest uppercase">
                            POINTS
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
              {!loading && overallSortedUsers.length === 0 && (
                <div className="border border-[#303030] p-10 text-center">
                  <p 
                    className="text-base uppercase text-[#F2EEE6] mb-1 font-bold"
                    style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                  >
                    NO PARTICIPANTS DETECTED
                  </p>
                  <p 
                    className="text-xs text-[#88847E] mb-5"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    Connect LeetCode accounts to generate the mentorship leaderboard.
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
          {/* RIGHT COLUMN: My Position, League Stats & Titans */}
          {/* ═══════════════════════════════════════════ */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 sm:space-y-7">
            
            {/* ── MY POSITION CARD ── */}
            <section className="border border-[#303030] bg-[#191919] p-4 sm:p-5 relative">
              <div 
                className="flex items-center justify-between border-b border-[#303030] pb-2.5 mb-3.5 text-[10px] uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <span className="text-[#88847E]">PERSONAL STANDING</span>
                <span className="text-[#FF7417] font-semibold">
                  {currentUser ? 'LIVE SYNCED' : 'UNREGISTERED'}
                </span>
              </div>

              {currentUser && currentUserRank ? (
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span 
                      className="text-xs text-[#88847E] uppercase"
                      style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                    >
                      YOUR OVERALL RANK
                    </span>
                    <span 
                      className="text-3xl font-black text-[#F2EEE6]"
                      style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                    >
                      #{formatRank(currentUserRank)}
                    </span>
                  </div>

                  <div className="bg-[#101010] p-3.5 border border-[#303030] mb-3.5">
                    <div 
                      className="flex justify-between items-baseline"
                      style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                    >
                      <span className="text-[10px] text-[#88847E] uppercase">TOTAL WEIGHTED SCORE</span>
                      <span className="text-lg font-bold text-[#FF7417]">
                        {currentUser.score.toLocaleString()} PTS
                      </span>
                    </div>

                    <div 
                      className="flex justify-between items-baseline mt-1 text-[11px]"
                      style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                    >
                      <span className="text-[#88847E]">TOTAL SOLVED PROBLEMS</span>
                      <span className="text-[#39B96F] font-bold">
                        {currentUser.solved} SOLVED
                      </span>
                    </div>

                    {/* Gap calculation */}
                    <div 
                      className="mt-2.5 pt-2.5 border-t border-[#222222] text-xs"
                      style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                    >
                      {currentUserRank === 1 ? (
                        <p className="text-[#39B96F] font-semibold flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5" /> YOU HOLD #1 ON THE OVERALL BOARD
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

                  <div className="flex items-center justify-between text-xs pt-1">
                    <Link
                      href={`/u/${currentUser.name}`}
                      className="text-[#F2EEE6] hover:text-[#FF7417] transition-colors flex items-center gap-1 group"
                      style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                    >
                      <span>VIEW PROFILE</span>
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                    <Link
                      href="/weekly-leaders"
                      className="text-[#88847E] hover:text-[#F2EEE6] transition-colors flex items-center gap-1"
                      style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                    >
                      <span>WEEKLY CUP</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
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
                    Bind this machine to your LeetCode handle to track your live personal standing and overtake gaps.
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

            {/* ── LEAGUE ACCUMULATOR ── */}
            {leagueStats && (
              <section className="border border-[#303030] bg-[#191919] p-4 sm:p-5 space-y-4">
                <div 
                  className="flex items-center justify-between border-b border-[#303030] pb-2.5"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  <h3 
                    className="text-xs font-bold uppercase tracking-wider text-[#F2EEE6]"
                    style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                  >
                    LEAGUE ACCUMULATOR
                  </h3>
                  <span className="text-[10px] text-[#39B96F]">
                    {leagueStats.totalSolved.toLocaleString()} PROBLEMS
                  </span>
                </div>

                {/* Combined Difficulty Distribution */}
                <div className="space-y-3">
                  <div>
                    <div 
                      className="flex justify-between text-xs mb-1"
                      style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                    >
                      <span className="text-[#39B96F]">EASY PROBLEMS</span>
                      <span className="text-[#88847E]">
                        {leagueStats.totalEasy.toLocaleString()} <span className="text-[#555555]">({Math.round((leagueStats.totalEasy / leagueStats.totalSolved) * 100)}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#101010] border border-[#303030]">
                      <div 
                        className="h-full bg-[#39B96F]" 
                        style={{ width: `${(leagueStats.totalEasy / leagueStats.totalSolved) * 100}%` }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div 
                      className="flex justify-between text-xs mb-1"
                      style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                    >
                      <span className="text-[#FF7417]">MEDIUM PROBLEMS</span>
                      <span className="text-[#88847E]">
                        {leagueStats.totalMed.toLocaleString()} <span className="text-[#555555]">({Math.round((leagueStats.totalMed / leagueStats.totalSolved) * 100)}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#101010] border border-[#303030]">
                      <div 
                        className="h-full bg-[#FF7417]" 
                        style={{ width: `${(leagueStats.totalMed / leagueStats.totalSolved) * 100}%` }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div 
                      className="flex justify-between text-xs mb-1"
                      style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                    >
                      <span className="text-[#E05A5A]">HARD PROBLEMS</span>
                      <span className="text-[#88847E]">
                        {leagueStats.totalHard.toLocaleString()} <span className="text-[#555555]">({Math.round((leagueStats.totalHard / leagueStats.totalSolved) * 100)}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#101010] border border-[#303030]">
                      <div 
                        className="h-full bg-[#E05A5A]" 
                        style={{ width: `${(leagueStats.totalHard / leagueStats.totalSolved) * 100}%` }} 
                      />
                    </div>
                  </div>
                </div>

                <div 
                  className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#303030] text-xs"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  <div className="bg-[#101010] p-2.5 border border-[#303030]">
                    <span className="text-[#88847E] block text-[9px] uppercase">AVERAGE MENTEE SCORE</span>
                    <span className="text-sm font-bold text-[#F2EEE6]">{leagueStats.avgScore.toLocaleString()}</span>
                  </div>
                  <div className="bg-[#101010] p-2.5 border border-[#303030]">
                    <span className="text-[#88847E] block text-[9px] uppercase">TOTAL POINTS MINTED</span>
                    <span className="text-sm font-bold text-[#FF7417]">{(leagueStats.totalScore / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              </section>
            )}

            {/* ── ALL-TIME TITANS (HALL OF FAME) ── */}
            {leagueStats && (
              <section className="border border-[#303030] bg-[#191919] p-4 sm:p-5 space-y-3.5">
                <div className="border-b border-[#303030] pb-2.5">
                  <h3 
                    className="text-xs font-bold uppercase tracking-wider text-[#F2EEE6]"
                    style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                  >
                    ALL-TIME TITANS
                  </h3>
                  <span 
                    className="text-[9px] text-[#88847E] uppercase"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    STANDOUT RECORDS ACROSS THE GROUP
                  </span>
                </div>

                <div 
                  className="space-y-2 text-xs"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  {/* Top Volume */}
                  <div className="flex items-center justify-between p-2 bg-[#101010] border border-[#303030]">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-3.5 h-3.5 text-[#FF7417]" />
                      <span className="text-[#88847E] text-[10px] uppercase">VOLUME TITAN</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#F2EEE6] font-bold block">{leagueStats.topVolume.sname}</span>
                      <span className="text-[10px] text-[#39B96F]">{leagueStats.topVolume.solved} PROBLEMS</span>
                    </div>
                  </div>

                  {/* Hard Titan */}
                  <div className="flex items-center justify-between p-2 bg-[#101010] border border-[#303030]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#E05A5A]" />
                      <span className="text-[#88847E] text-[10px] uppercase">HARD SOLVER</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#F2EEE6] font-bold block">{leagueStats.topHardSolver.sname}</span>
                      <span className="text-[10px] text-[#E05A5A]">{leagueStats.topHardSolver.hard} HARDS</span>
                    </div>
                  </div>

                  {/* Longest Active Streak */}
                  <div className="flex items-center justify-between p-2 bg-[#101010] border border-[#303030]">
                    <div className="flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 text-[#FF7417]" />
                      <span className="text-[#88847E] text-[10px] uppercase">STREAK TITAN</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#F2EEE6] font-bold block">{leagueStats.streakTitan.sname}</span>
                      <span className="text-[10px] text-[#FF7417]">{leagueStats.streakTitan.currentStreak} DAYS</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* League Note & Scoring Legend */}
            <div 
              className="border-t border-[#303030] pt-3 text-[10px] text-[#88847E] space-y-1.5"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              <div className="flex items-center justify-between text-[#88847E]">
                <span>SCORING FORMULA</span>
                <span className="text-[#F2EEE6]">EASY×50 · MED×100 · HARD×200</span>
              </div>
              <p>· Rankings reflect all-time cumulative performance synced from LeetCode.</p>
              <p>· Click any mentee to inspect their full activity timeline & difficulty grid.</p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
