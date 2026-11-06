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
  AlertCircle,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getDeviceFingerprint, HardwareProfile } from '@/lib/fingerprint';
import Navbar from '@/app/components/Navbar';

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

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_FULL_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

      // Normalize to UTC midnight timestamps
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

      // 3. Accurate current streak calculation
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
      `Are you sure you want to unbind @${username} from this physical workstation?\n\nThis will free up your machine so you can link another LeetCode handle.`
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

  const maxEasy = 850;
  const maxMed = 1750;
  const maxHard = 750;

  // Current day index in UTC
  const currentDayIndex = new Date().getUTCDay() === 0 ? 6 : new Date().getUTCDay() - 1;

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#F1EEE8] selection:bg-[#FF7417] selection:text-[#0B0B0B] font-sans antialiased relative">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[480px] pointer-events-none overflow-hidden -z-10">
        <div className="w-full h-full ambient-orange opacity-60" />
      </div>

      {/* Shared Masthead Navigation */}
      <Navbar />

      {/* ── Main Container ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between font-mono text-xs">
          <Link 
            href="/" 
            className="group inline-flex items-center gap-1.5 text-[#AAA59D] hover:text-[#F1EEE8] transition-colors"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>BACK TO STANDINGS</span>
          </Link>

          {isOwner && (
            <span className="text-[10px] uppercase tracking-wider text-[#39BB75] border border-[#39BB75]/40 bg-[#39BB75]/10 px-2.5 py-1 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#39BB75]" />
              AUTHENTICATED WORKSTATION
            </span>
          )}
        </div>

        {deleteError && (
          <div className="bg-[#111111] border-l-4 border-l-[#E45B55] border border-white/10 p-4 mb-6 flex items-start gap-3 text-xs font-mono">
            <AlertCircle className="w-4 h-4 text-[#E45B55] shrink-0 mt-0.5" />
            <div>
              <span className="text-[#E45B55] font-bold block uppercase tracking-wide">SYSTEM ERROR</span>
              <span className="text-[#F1EEE8] mt-0.5 block">{deleteError}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="border border-white/10 bg-[#111111] p-16 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#FF7417] mx-auto mb-3" />
            <p className="text-xs uppercase font-mono text-[#AAA59D]">
              SYNCING @{username} DOSSIER FROM LEETCODE...
            </p>
          </div>
        ) : notFound || !stats ? (
          <div className="border border-white/10 bg-[#111111] p-12 text-center">
            <AlertCircle className="w-8 h-8 text-[#E45B55] mx-auto mb-3" />
            <h2 
              className="text-2xl font-black uppercase text-[#F1EEE8] mb-1 tracking-tight"
              style={{ fontFamily: 'var(--font-display), sans-serif' }}
            >
              COMPETITOR NOT FOUND
            </h2>
            <p className="text-xs font-mono text-[#AAA59D] mb-6">
              The LeetCode username &ldquo;{username}&rdquo; could not be retrieved from the public API.
            </p>
            <Link
              href="/"
              className="inline-block bg-[#FF7417] text-[#0B0B0B] text-xs font-mono font-bold uppercase px-4 py-2 hover:bg-[#FF7417]/90 transition-colors"
            >
              RETURN TO ROSTER
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* ── Main Profile Header Card ── */}
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="border border-white/10 bg-[#111111] p-6 sm:p-8 relative"
            >
              {/* Subtle top orange highlight */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF7417] via-[#FF7417]/80 to-transparent" />

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                
                <div className="flex items-center gap-5 min-w-0">
                  {/* Square Avatar */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-[#191919] border-2 border-[#FF7417] overflow-hidden">
                    {stats.avatar ? (
                      <img 
                        src={stats.avatar} 
                        alt={stats.name} 
                        className="w-full h-full object-cover contrast-110 hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center font-bold text-2xl text-[#F1EEE8]"
                        style={{ fontFamily: 'var(--font-display), sans-serif' }}
                      >
                        {stats.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h1 
                        className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#F1EEE8] truncate"
                        style={{ fontFamily: 'var(--font-display), sans-serif' }}
                      >
                        {stats.realName || stats.name}
                      </h1>
                      <a 
                        href={`https://leetcode.com/u/${stats.name}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#77736D] hover:text-[#FF7417] transition-colors shrink-0"
                        title="Open LeetCode Profile"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    
                    <p className="text-xs font-mono text-[#AAA59D] mt-1">
                      @{stats.name}
                    </p>

                    {stats.ranking && (
                      <div className="text-[11px] font-mono text-[#FF7417] mt-2 flex items-center gap-1.5 font-bold">
                        <Trophy className="w-3.5 h-3.5 text-[#FF7417]" />
                        <span>GLOBAL LEETCODE #{stats.ranking.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Big Solve Stat */}
                <div className="sm:text-right border-t sm:border-t-0 border-white/10 pt-4 sm:pt-0 shrink-0 font-mono">
                  <div 
                    className="text-4xl sm:text-5xl font-black text-[#FF7417] leading-none tracking-tight"
                    style={{ fontFamily: 'var(--font-display), sans-serif' }}
                  >
                    {stats.totalSolved}
                  </div>
                  <div className="text-[10px] text-[#77736D] uppercase tracking-widest mt-1">
                    TOTAL SOLVED PROBLEMS
                  </div>
                </div>
              </div>

              {/* Subline Data Strip */}
              <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Flame className={`w-4 h-4 ${stats.currentStreak > 0 ? 'text-[#FF7417] fill-[#FF7417]' : 'text-[#77736D]'}`} />
                  <span className="font-bold text-[#F1EEE8]">
                    {stats.currentStreak} DAY ACTIVE STREAK
                  </span>
                </div>
                <span className="text-[#39BB75] font-semibold">
                  {stats.activeDays}/7 DAYS ACTIVE THIS WEEK
                </span>
              </div>
            </motion.div>

            {/* ── 4-Metric Dossier Strip ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
              <div className="bg-[#111111] border border-white/10 p-4">
                <p 
                  className="text-3xl sm:text-4xl font-black text-[#F1EEE8] leading-none"
                  style={{ fontFamily: 'var(--font-display), sans-serif' }}
                >
                  {stats.currentStreak}
                </p>
                <p className="text-[#77736D] text-[10px] uppercase tracking-wider mt-1.5">ACTIVE STREAK</p>
              </div>

              <div className="bg-[#111111] border border-white/10 p-4">
                <p 
                  className="text-3xl sm:text-4xl font-black text-[#39BB75] leading-none"
                  style={{ fontFamily: 'var(--font-display), sans-serif' }}
                >
                  {stats.totalSolved}
                </p>
                <p className="text-[#77736D] text-[10px] uppercase tracking-wider mt-1.5">SOLVED PROBLEMS</p>
              </div>

              <div className="bg-[#111111] border border-white/10 p-4">
                <p 
                  className="text-3xl sm:text-4xl font-black text-[#FF7417] leading-none"
                  style={{ fontFamily: 'var(--font-display), sans-serif' }}
                >
                  {stats.activeDays}<span className="text-[#77736D] text-lg font-normal">/7</span>
                </p>
                <p className="text-[#77736D] text-[10px] uppercase tracking-wider mt-1.5">DAYS THIS WEEK</p>
              </div>

              <div className="bg-[#111111] border border-white/10 p-4">
                <p 
                  className="text-3xl sm:text-4xl font-black text-[#F1EEE8] leading-none"
                  style={{ fontFamily: 'var(--font-display), sans-serif' }}
                >
                  {stats.completion}<span className="text-[#77736D] text-lg font-normal">%</span>
                </p>
                <p className="text-[#77736D] text-[10px] uppercase tracking-wider mt-1.5">CURRICULUM PACE</p>
              </div>
            </div>

            {/* ── Problem Difficulty Breakdown ── */}
            <div className="border border-white/10 bg-[#111111] p-5 sm:p-6 space-y-4">
              <div className="border-b border-white/10 pb-3 flex items-center justify-between font-mono">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#F1EEE8]">
                  PROBLEM DIFFICULTY SPLIT
                </h2>
                <span className="text-[10px] text-[#AAA59D]">
                  LEETCODE VERIFIED
                </span>
              </div>

              {/* Easy */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-[#39BB75] font-bold">EASY PROBLEMS (50 PTS)</span>
                  <span className="text-[#AAA59D]">{stats.easySolved} <span className="text-[#55524E]">/ {maxEasy}</span></span>
                </div>
                <div className="w-full h-2 bg-[#191919] border border-white/5">
                  <motion.div 
                    className="h-full bg-[#39BB75]"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((stats.easySolved / maxEasy) * 100, 100)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Medium */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-[#FF7417] font-bold">MEDIUM PROBLEMS (100 PTS)</span>
                  <span className="text-[#AAA59D]">{stats.mediumSolved} <span className="text-[#55524E]">/ {maxMed}</span></span>
                </div>
                <div className="w-full h-2 bg-[#191919] border border-white/5">
                  <motion.div 
                    className="h-full bg-[#FF7417]"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((stats.mediumSolved / maxMed) * 100, 100)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Hard */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-[#E45B55] font-bold">HARD PROBLEMS (200 PTS)</span>
                  <span className="text-[#AAA59D]">{stats.hardSolved} <span className="text-[#55524E]">/ {maxHard}</span></span>
                </div>
                <div className="w-full h-2 bg-[#191919] border border-white/5">
                  <motion.div 
                    className="h-full bg-[#E45B55]"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((stats.hardSolved / maxHard) * 100, 100)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>

            {/* ── This Week 7-Day Activity Matrix ── */}
            <div className="border border-white/10 bg-[#111111] p-5 sm:p-6">
              <div className="flex items-baseline justify-between mb-4 border-b border-white/10 pb-3 text-xs font-mono">
                <h2 className="font-bold uppercase tracking-wider text-[#F1EEE8]">
                  THIS WEEK&apos;S ATTENDANCE MATRIX (MON — SUN UTC)
                </h2>
                <span className="text-[10px] text-[#39BB75] font-semibold">
                  {stats.activeDays === 7 ? 'PERFECT ATTENDANCE' : `${stats.activeDays}/7 DAYS ACTIVE`}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center">
                {DAY_LABELS.map((day, i) => {
                  const isToday = i === currentDayIndex;
                  const done = stats.weekDays[i];

                  return (
                    <div key={i} className="flex flex-col items-center">
                      <div 
                        className={`
                          w-full aspect-square flex items-center justify-center text-xs font-mono font-bold border transition-colors
                          ${done 
                            ? 'bg-[#39BB75] text-[#0B0B0B] border-[#39BB75]' 
                            : i <= currentDayIndex
                            ? 'bg-[#191919] text-[#77736D] border-white/5'
                            : 'bg-transparent text-[#444444] border-dashed border-white/10'}
                          ${isToday ? 'ring-2 ring-[#FF7417]' : ''}
                        `}
                        title={`${DAY_FULL_NAMES[i]}: ${done ? 'Solved' : 'No activity'}`}
                      >
                        {done ? <Check className="w-4 h-4 stroke-[2.5]" /> : '·'}
                      </div>
                      <p className={`text-[10px] mt-2 font-mono ${isToday ? 'text-[#FF7417] font-bold' : 'text-[#77736D]'}`}>
                        {day}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Recent 8-Day Activity Timeline ── */}
            <div className="border border-white/10 bg-[#111111] p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3 text-xs font-mono">
                <h2 className="font-bold uppercase tracking-wider text-[#F1EEE8] flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#FF7417]" />
                  <span>RECENT 8-DAY TIMELINE</span>
                </h2>
                <span className="text-[10px] text-[#77736D]">ROLLING ACTIVITY WINDOW</span>
              </div>

              <div className="grid grid-cols-8 gap-2">
                {stats.streak.map((active, i) => (
                  <div 
                    key={i} 
                    className={`
                      h-9 flex items-center justify-center border font-mono text-xs font-bold transition-colors
                      ${active 
                        ? 'bg-[#39BB75] text-[#0B0B0B] border-[#39BB75]' 
                        : 'bg-[#191919] text-[#444444] border-white/5'}
                      ${i === stats.streak.length - 1 ? 'ring-1 ring-[#FF7417]' : ''}
                    `}
                    title={active ? 'Submissions recorded' : 'No submissions'}
                  >
                    {active ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : '·'}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Owner Workstation Controls ── */}
            {isOwner && (
              <div className="border border-white/10 bg-[#111111] p-5 sm:p-6 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-[#191919] border border-white/10 text-[#FF7417]">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 
                      className="text-base font-black uppercase text-[#F1EEE8] tracking-tight"
                      style={{ fontFamily: 'var(--font-display), sans-serif' }}
                    >
                      WORKSTATION BINDING CONTROLS
                    </h3>
                    <p className="text-xs font-mono text-[#AAA59D] mt-1 leading-relaxed">
                      This physical hardware is currently bound to <span className="text-[#F1EEE8] font-bold">@{stats.name}</span>. 
                      To switch accounts or free this machine, unbind below.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full bg-[#191919] text-[#E45B55] border border-[#E45B55]/40 hover:bg-[#E45B55]/15 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deleting ? 'UNLINKING WORKSTATION...' : 'UNLINK LEETCODE ID FROM THIS DEVICE'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Link back to overall */}
            <div className="text-center pt-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-mono text-[#AAA59D] hover:text-[#FF7417] transition-colors"
              >
                <span>VIEW COMPLETE LEAGUE STANDINGS</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
