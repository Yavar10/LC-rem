'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import axios from 'axios';
import { 
  ArrowUpRight,
  ChevronLeft, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  Laptop, 
  ShieldCheck, 
  Flame, 
  Trophy, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getDeviceFingerprint, HardwareProfile } from '@/lib/fingerprint';

interface LeetCodeStats {
  name: string;
  realName: string;
  avatar: string;
  ranking?: number;
  reputation?: number;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  submissionCalendar: Record<string, number>;
  streak: number[];
  currentStreak: number;
  weekDays: boolean[];
  activeDays: number;
  completion: number;
}

function getMotivation(streak: number): string {
  if (streak >= 30) return 'machine mode — do not stop.';
  if (streak >= 14) return 'two weeks strong. keep building.';
  if (streak >= 7) return 'a full week. momentum is real.';
  if (streak >= 3) return 'getting into rhythm.';
  if (streak >= 1) return 'every day counts.';
  return 'start today. no excuses.';
}

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = use(params);
  const username = decodeURIComponent(resolvedParams.username);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LeetCodeStats | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Device ownership state
  const [deviceId, setDeviceId] = useState<string>('');
  const [hardwareInfo, setHardwareInfo] = useState<HardwareProfile | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch LeetCode details
  const fetchUserData = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const [profileRes, solvedRes, calendarRes] = await Promise.all([
        axios.get(`https://kinkdin.onrender.com/${username}`),
        axios.get(`https://kinkdin.onrender.com/${username}/solved`),
        axios.get(`https://kinkdin.onrender.com/${username}/calendar`).catch(() => ({ data: {} }))
      ]);

      if (profileRes.data?.errors || solvedRes.data?.errors) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const profile = profileRes.data || {};
      const solved = solvedRes.data || {};
      const calendarData = calendarRes.data || {};
      const submissionCalendar: Record<string, number> = calendarData.submissionCalendar 
        ? JSON.parse(calendarData.submissionCalendar) 
        : {};

      // Normalize to UTC midnight timestamps (LeetCode calendar format is UTC midnight in seconds)
      const now = new Date();
      const todayUtcMidnightSec = Math.floor(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 1000
      );
      const yesterdayUtcMidnightSec = todayUtcMidnightSec - 86400;

      // 1. Compute 8-day streak timeline
      const last8Days = Array.from({ length: 8 }, (_, i) => todayUtcMidnightSec - (7 - i) * 86400);
      const streak = last8Days.map(ts => (submissionCalendar[ts] ? 1 : 0));

      // 2. Compute current calendar week (Monday to Sunday in UTC)
      const utcDayOfWeek = now.getUTCDay();
      const mondayOffset = utcDayOfWeek === 0 ? 6 : utcDayOfWeek - 1;
      const mondaySec = todayUtcMidnightSec - (mondayOffset * 86400);
      const weekDays = Array.from({ length: 7 }, (_, i) => Boolean(submissionCalendar[mondaySec + (i * 86400)]));
      const activeDays = weekDays.filter(Boolean).length;

      // 3. Accurate all-time current streak calculation
      const sortedTimestamps = Object.keys(submissionCalendar)
        .map(Number)
        .sort((a, b) => b - a);

      let currentStreak = 0;
      if (sortedTimestamps.length > 0) {
        let checkDate = sortedTimestamps[0] >= todayUtcMidnightSec ? todayUtcMidnightSec : yesterdayUtcMidnightSec;

        for (const ts of sortedTimestamps) {
          if (ts <= checkDate) {
            if (ts === checkDate) {
              currentStreak++;
              checkDate -= 86400;
            } else {
              const daysDiff = Math.floor((checkDate - ts) / 86400);
              if (daysDiff > 1) break;
            }
          }
        }
      }

      const totalSolved = solved.solvedProblem ?? profile.totalSolved ?? 0;
      const completion = Math.min(Math.round((totalSolved / 3000) * 100), 100);

      setStats({
        name: username,
        realName: profile.name || profile.realName || username,
        avatar: profile.avatar || profile.userAvatar || '',
        ranking: profile.ranking,
        reputation: profile.reputation,
        totalSolved,
        easySolved: solved.easySolved ?? 0,
        mediumSolved: solved.mediumSolved ?? 0,
        hardSolved: solved.hardSolved ?? 0,
        submissionCalendar,
        streak,
        currentStreak,
        weekDays,
        activeDays,
        completion
      });
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [username]);

  // Check if current visitor owns this profile via hardware signature
  const verifyDeviceOwnership = useCallback(async () => {
    try {
      const { deviceId: id, hardwareSummary } = await getDeviceFingerprint();
      setDeviceId(id);
      setHardwareInfo(hardwareSummary);

      const params = new URLSearchParams({
        deviceId: id,
        gpu: hardwareSummary.gpu,
        screen: hardwareSummary.screen,
        cores: String(hardwareSummary.cores),
        os: hardwareSummary.os
      });

      const res = await axios.get(`/api/users?${params.toString()}`);
      if (res.data?.registered && res.data?.user?.username) {
        if (res.data.user.username.toLowerCase() === username.toLowerCase()) {
          setIsOwner(true);
        }
      }
    } catch (err) {
      console.error('Device check error:', err);
    }
  }, [username]);

  useEffect(() => {
    fetchUserData();
    verifyDeviceOwnership();
  }, [fetchUserData, verifyDeviceOwnership]);

  // Handle owner deleting their ID from this device
  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${username} from this device?\n\nThis will free up your device so you can register a new LeetCode ID.`
    );
    if (!confirmDelete) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const params = new URLSearchParams({
        deviceId,
        username,
        gpu: hardwareInfo?.gpu || '',
        screen: hardwareInfo?.screen || '',
        cores: String(hardwareInfo?.cores || ''),
        os: hardwareInfo?.os || ''
      });

      await axios.delete(`/api/users?${params.toString()}`);
      router.push('/user');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setDeleteError(err.response?.data?.error || 'Failed to remove ID from device.');
      } else {
        setDeleteError('Failed to remove ID from device.');
      }
      setDeleting(false);
    }
  };

  const maxEasy = 800;
  const maxMed = 1700;
  const maxHard = 700;
  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Current day index in UTC
  const currentDayIndex = new Date().getUTCDay() === 0 ? 6 : new Date().getUTCDay() - 1;

  return (
    <div className="min-h-screen bg-[#101010] text-[#F2EEE6] selection:bg-[#FF7417] selection:text-[#101010] font-sans antialiased">
      
      {/* ── Compact Swiss Header ── */}
      <header className="border-b border-[#303030] bg-[#101010]/95 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-13 flex items-center justify-between">
          
          {/* Logo & Profile Identity */}
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
              MENTEE PROFILE
            </span>
          </div>

          {/* Navigation Controls */}
          <nav 
            className="flex items-center gap-4 sm:gap-6 text-xs"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            <Link 
              href="/" 
              className="text-[#88847E] hover:text-[#F2EEE6] transition-colors"
            >
              OVERALL
            </Link>
            <Link 
              href="/weekly-leaders" 
              className="text-[#88847E] hover:text-[#F2EEE6] transition-colors"
            >
              WEEKLY
            </Link>
            <Link 
              href="/user" 
              className="text-[#88847E] hover:text-[#F2EEE6] transition-colors flex items-center gap-1"
            >
              <span>{isOwner ? 'YOUR DEVICE' : 'MY ID'}</span>
              <ArrowUpRight className="w-3 h-3 text-[#88847E]" />
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link 
            href="/" 
            className="group inline-flex items-center gap-1.5 text-xs text-[#88847E] hover:text-[#F2EEE6] transition-colors"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>BACK TO STANDINGS</span>
          </Link>

          {isOwner && (
            <span 
              className="text-[10px] uppercase tracking-wider text-[#39B96F] border border-[#39B96F]/40 bg-[#39B96F]/10 px-2 py-0.5 font-bold flex items-center gap-1"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#39B96F]" />
              AUTHENTICATED WORKSTATION
            </span>
          )}
        </div>

        {deleteError && (
          <div 
            className="bg-[#191919] border-l-4 border-l-[#E05A5A] border border-[#303030] p-4 mb-6 flex items-start gap-3 text-xs"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            <AlertCircle className="w-4 h-4 text-[#E05A5A] shrink-0 mt-0.5" />
            <div>
              <span className="text-[#E05A5A] font-bold block uppercase tracking-wide">ERROR</span>
              <span className="text-[#F2EEE6] mt-0.5 block">{deleteError}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="border border-[#303030] bg-[#191919] p-16 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#FF7417] mx-auto mb-3" />
            <p 
              className="text-xs uppercase text-[#88847E]"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              SYNCING /u/{username} STATS FROM LEETCODE...
            </p>
          </div>
        ) : notFound || !stats ? (
          <div className="border border-[#303030] bg-[#191919] p-12 text-center">
            <AlertCircle className="w-8 h-8 text-[#E05A5A] mx-auto mb-3" />
            <h2 
              className="text-lg font-bold uppercase text-[#F2EEE6] mb-1"
              style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
            >
              USER NOT FOUND
            </h2>
            <p 
              className="text-xs text-[#88847E] mb-6"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              The LeetCode username &ldquo;{username}&rdquo; could not be retrieved from the API.
            </p>
            <Link
              href="/"
              className="inline-block bg-[#FF7417] text-[#101010] text-xs font-bold uppercase px-4 py-2 hover:bg-[#FF7417]/90 transition-colors"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              BACK TO STANDINGS
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* ── Main Profile Header Card ── */}
            <div className="border border-[#303030] bg-[#191919] p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                
                <div className="flex items-center gap-4">
                  {/* Square Avatar */}
                  <div className="w-16 h-16 shrink-0 bg-[#222222] border border-[#303030] overflow-hidden">
                    {stats.avatar ? (
                      <img 
                        src={stats.avatar} 
                        alt={stats.name} 
                        className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-150"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center font-bold text-2xl text-[#88847E]"
                        style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                      >
                        {stats.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h1 
                        className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#F2EEE6]"
                        style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                      >
                        {stats.realName || stats.name}
                      </h1>
                      <a 
                        href={`https://leetcode.com/u/${stats.name}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#88847E] hover:text-[#FF7417] transition-colors"
                        title="Open LeetCode Profile"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    
                    <p 
                      className="text-xs text-[#88847E] mt-0.5"
                      style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                    >
                      @{stats.name}
                    </p>

                    {stats.ranking && (
                      <p 
                        className="text-[11px] text-[#FF7417] mt-1.5 flex items-center gap-1 font-semibold"
                        style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                      >
                        <Trophy className="w-3 h-3 text-[#FF7417]" /> GLOBAL RANK #{stats.ranking.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div 
                  className="sm:text-right border-t sm:border-t-0 border-[#303030] pt-4 sm:pt-0"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  <div 
                    className="text-3xl sm:text-4xl font-black text-[#FF7417]"
                    style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                  >
                    {stats.totalSolved}
                  </div>
                  <div className="text-[10px] text-[#88847E] uppercase tracking-widest">
                    TOTAL SOLVED
                  </div>
                </div>
              </div>

              {/* Motivation & Streak Subline */}
              <div 
                className="mt-6 pt-5 border-t border-[#303030] flex flex-wrap items-center justify-between gap-2 text-xs"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <div className="flex items-center gap-2">
                  <Flame className={`w-4 h-4 ${stats.currentStreak > 0 ? 'text-[#FF7417]' : 'text-[#88847E]'}`} />
                  <span className="font-bold text-[#F2EEE6]">
                    {stats.currentStreak} DAY STREAK
                  </span>
                  <span className="text-[#88847E] hidden sm:inline">
                    — {getMotivation(stats.currentStreak)}
                  </span>
                </div>
                <span className="text-[#39B96F] font-semibold">
                  {stats.activeDays}/7 DAYS ACTIVE THIS WEEK
                </span>
              </div>
            </div>

            {/* ── 4-Stat Swiss Metric Grid ── */}
            <div 
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              <div className="bg-[#191919] border border-[#303030] p-4">
                <p 
                  className="text-2xl sm:text-3xl font-black text-[#F2EEE6]"
                  style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                >
                  {stats.currentStreak}
                </p>
                <p className="text-[#88847E] text-[10px] uppercase mt-1">ACTIVE STREAK</p>
              </div>

              <div className="bg-[#191919] border border-[#303030] p-4">
                <p 
                  className="text-2xl sm:text-3xl font-black text-[#39B96F]"
                  style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                >
                  {stats.totalSolved}
                </p>
                <p className="text-[#88847E] text-[10px] uppercase mt-1">SOLVED PROBLEMS</p>
              </div>

              <div className="bg-[#191919] border border-[#303030] p-4">
                <p 
                  className="text-2xl sm:text-3xl font-black text-[#FF7417]"
                  style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                >
                  {stats.activeDays}<span className="text-[#88847E] text-base font-normal">/7</span>
                </p>
                <p className="text-[#88847E] text-[10px] uppercase mt-1">DAYS THIS WEEK</p>
              </div>

              <div className="bg-[#191919] border border-[#303030] p-4">
                <p 
                  className="text-2xl sm:text-3xl font-black text-[#F2EEE6]"
                  style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                >
                  {stats.completion}<span className="text-[#88847E] text-base font-normal">%</span>
                </p>
                <p className="text-[#88847E] text-[10px] uppercase mt-1">COMPLETION RATE</p>
              </div>
            </div>

            {/* ── This Week 7-Day Activity Grid ── */}
            <div className="border border-[#303030] bg-[#191919] p-5 sm:p-6">
              <div 
                className="flex items-baseline justify-between mb-4 border-b border-[#303030] pb-2.5 text-xs"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <h2 
                  className="font-bold uppercase tracking-wider text-[#F2EEE6]"
                  style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                >
                  THIS WEEK&apos;S ACTIVITY (MON — SUN UTC)
                </h2>
                <span className="text-[10px] text-[#39B96F]">
                  {stats.activeDays === 7 ? 'PERFECT WEEK' : `${stats.activeDays}/7 DAYS ACTIVE`}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center">
                {dayNames.map((day, i) => {
                  const isToday = i === currentDayIndex;
                  const done = stats.weekDays[i];

                  return (
                    <div key={i} className="flex flex-col items-center">
                      <div 
                        className={`
                          w-full aspect-square flex items-center justify-center text-xs font-bold border transition-colors
                          ${done 
                            ? 'bg-[#39B96F] text-[#101010] border-[#39B96F]' 
                            : 'bg-[#101010] text-[#444444] border-[#303030]'}
                          ${isToday ? 'ring-2 ring-[#FF7417]' : ''}
                        `}
                        style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                      >
                        {done ? '✓' : '·'}
                      </div>
                      <p 
                        className={`text-[10px] mt-2 font-mono ${isToday ? 'text-[#FF7417] font-bold' : 'text-[#88847E]'}`}
                        style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                      >
                        {day}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Problem Distribution Bars ── */}
            <div className="border border-[#303030] bg-[#191919] p-5 sm:p-6 space-y-4">
              <div 
                className="border-b border-[#303030] pb-2.5 flex items-center justify-between"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <h2 
                  className="text-xs font-bold uppercase tracking-wider text-[#F2EEE6]"
                  style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                >
                  PROBLEM BREAKDOWN
                </h2>
                <span className="text-[10px] text-[#88847E]">
                  EASY · MEDIUM · HARD
                </span>
              </div>

              {/* Easy */}
              <div>
                <div 
                  className="flex justify-between text-xs mb-1"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  <span className="text-[#39B96F] font-semibold">EASY</span>
                  <span className="text-[#88847E]">{stats.easySolved} <span className="text-[#444444]">/ {maxEasy}</span></span>
                </div>
                <div className="w-full h-1.5 bg-[#101010] border border-[#303030]">
                  <div 
                    className="h-full bg-[#39B96F]"
                    style={{ width: `${Math.min((stats.easySolved / maxEasy) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Medium */}
              <div>
                <div 
                  className="flex justify-between text-xs mb-1"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  <span className="text-[#FF7417] font-semibold">MEDIUM</span>
                  <span className="text-[#88847E]">{stats.mediumSolved} <span className="text-[#444444]">/ {maxMed}</span></span>
                </div>
                <div className="w-full h-1.5 bg-[#101010] border border-[#303030]">
                  <div 
                    className="h-full bg-[#FF7417]"
                    style={{ width: `${Math.min((stats.mediumSolved / maxMed) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Hard */}
              <div>
                <div 
                  className="flex justify-between text-xs mb-1"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  <span className="text-[#E05A5A] font-semibold">HARD</span>
                  <span className="text-[#88847E]">{stats.hardSolved} <span className="text-[#444444]">/ {maxHard}</span></span>
                </div>
                <div className="w-full h-1.5 bg-[#101010] border border-[#303030]">
                  <div 
                    className="h-full bg-[#E05A5A]"
                    style={{ width: `${Math.min((stats.hardSolved / maxHard) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* ── Recent 8-Day Activity Timeline ── */}
            <div className="border border-[#303030] bg-[#191919] p-5 sm:p-6">
              <div 
                className="flex items-center justify-between mb-4 border-b border-[#303030] pb-2.5 text-xs"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <h2 
                  className="font-bold uppercase tracking-wider text-[#F2EEE6] flex items-center gap-1.5"
                  style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                >
                  <Calendar className="w-3.5 h-3.5" /> RECENT 8-DAY TIMELINE
                </h2>
                <span className="text-[10px] text-[#88847E]">ROLLING WINDOW</span>
              </div>

              <div className="grid grid-cols-8 gap-2">
                {stats.streak.map((active, i) => (
                  <div 
                    key={i} 
                    className={`
                      h-8 flex items-center justify-center border transition-colors
                      ${active 
                        ? 'bg-[#39B96F] text-[#101010] border-[#39B96F]' 
                        : 'bg-[#101010] text-[#333333] border-[#303030]'}
                      ${i === stats.streak.length - 1 ? 'ring-1 ring-[#FF7417]' : ''}
                    `}
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                    title={active ? 'Submissions recorded' : 'No submissions'}
                  >
                    <span className="text-xs font-bold">{active ? '✓' : '·'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Owner Device Management ── */}
            {isOwner && (
              <div className="border border-[#303030] bg-[#141414] p-5 sm:p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[#222222] border border-[#303030] text-[#FF7417]">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 
                      className="text-sm font-bold uppercase text-[#F2EEE6]"
                      style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                    >
                      WORKSTATION BINDING CONTROLS
                    </h3>
                    <p 
                      className="text-xs text-[#88847E] mt-1"
                      style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                    >
                      This physical machine is bound to <span className="text-[#F2EEE6] font-semibold">@{stats.name}</span>. 
                      To switch accounts or unbind this device, confirm removal below.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full bg-[#101010] text-[#E05A5A] border border-[#E05A5A]/40 hover:bg-[#E05A5A]/10 py-3 text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                    style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deleting ? 'UNLINKING WORKSTATION...' : 'UNLINK LEETCODE ID FROM THIS DEVICE'}</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
