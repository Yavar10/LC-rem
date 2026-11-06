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
      `Are you sure you want to unbind @${username} from this workstation?\n\nThis will free up your machine to link another LeetCode handle.`
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
    <div className="min-h-screen bg-black text-[#F1EEE8] selection:bg-[var(--accent)] selection:text-black font-sans antialiased relative">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[480px] pointer-events-none overflow-hidden -z-10">
        <div className="w-full h-full ambient-orange opacity-70" />
      </div>

      {/* Shared Masthead Navigation */}
      <Navbar />

      {/* ── Main Container: Open Editorial Flow ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between text-xs">
          <Link 
            href="/" 
            className="group inline-flex items-center gap-1.5 text-[#AAA59D] hover:text-[#F1EEE8] transition-colors"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Standings</span>
          </Link>

          {isOwner && (
            <span className="text-[11px] text-[#39BB75] bg-[#39BB75]/10 border border-[#39BB75]/30 px-3 py-1 font-mono font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#39BB75]" />
              Authenticated Workstation
            </span>
          )}
        </div>

        {deleteError && (
          <div className="border-l-2 border-l-[#E45B55] bg-[#141414] p-4 mb-6 flex items-start gap-3 text-xs font-mono">
            <AlertCircle className="w-4 h-4 text-[#E45B55] shrink-0 mt-0.5" />
            <div>
              <span className="text-[#E45B55] font-bold block uppercase tracking-wide">Error</span>
              <span className="text-[#F1EEE8] mt-0.5 block">{deleteError}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#FF7417] mx-auto mb-3" />
            <p className="text-xs uppercase font-mono text-[#AAA59D]">
              Retrieving @{username} dossier from LeetCode...
            </p>
          </div>
        ) : notFound || !stats ? (
          <div className="py-20 text-center border-t border-b border-white/[0.08]">
            <AlertCircle className="w-8 h-8 text-[#E45B55] mx-auto mb-3" />
            <h2 
              className="text-2xl font-black uppercase text-[#F1EEE8] mb-1 tracking-tight"
              style={{ fontFamily: 'var(--font-display), sans-serif' }}
            >
              Competitor Not Found
            </h2>
            <p className="text-xs text-[#AAA59D] mb-6">
              The LeetCode username &ldquo;{username}&rdquo; could not be retrieved from the public API.
            </p>
            <Link
              href="/"
              className="inline-block bg-[#FF7417] text-black text-xs font-mono font-bold uppercase px-4 py-2 hover:bg-[#FF7417]/90 transition-colors"
            >
              Return to Standings
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* ── Architectural Competitor Header (No Heavy Box) ── */}
            <section className="border-b border-white/[0.08] pb-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                
                <div className="space-y-3 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[#FF7417] uppercase tracking-wider bg-[#FF7417]/10 px-2 py-0.5 border border-[#FF7417]/25">
                      Competitor Dossier
                    </span>
                    {stats.ranking && (
                      <span className="text-xs font-mono text-[#AAA59D] flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-[#FF7417]" />
                        <span>LeetCode #{stats.ranking.toLocaleString()}</span>
                      </span>
                    )}
                  </div>

                  {/* Giant Competitor Name */}
                  <div className="flex items-center gap-3">
                    <h1 
                      className="text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tight text-[#F1EEE8] leading-none truncate"
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
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>

                  <p className="text-sm font-mono text-[#AAA59D]">
                    @{stats.name}
                  </p>
                </div>

                {/* Big Headline Stat: Total Solved */}
                <div className="md:text-right border-t md:border-t-0 border-white/[0.08] pt-4 md:pt-0 shrink-0">
                  <span 
                    className="text-6xl sm:text-7xl font-black text-[#FF7417] leading-none block tracking-tight"
                    style={{ fontFamily: 'var(--font-display), sans-serif' }}
                  >
                    {stats.totalSolved}
                  </span>
                  <span className="text-xs text-[#AAA59D] uppercase tracking-wider font-mono mt-1 block">
                    Problems Solved
                  </span>
                </div>

              </div>
            </section>

            {/* ── Open Editorial Stat Strip (Varied Scale, No Repetitive Boxes) ── */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 border-b border-white/[0.08] pb-10">
              <div>
                <span 
                  className="text-4xl sm:text-5xl font-black text-[#F1EEE8] block leading-none"
                  style={{ fontFamily: 'var(--font-display), sans-serif' }}
                >
                  {stats.currentStreak}
                </span>
                <span className="text-xs text-[#AAA59D] mt-1.5 block">
                  Active daily streak
                </span>
              </div>

              <div>
                <span 
                  className="text-4xl sm:text-5xl font-black text-[#39BB75] block leading-none"
                  style={{ fontFamily: 'var(--font-display), sans-serif' }}
                >
                  {stats.activeDays}<span className="text-xl text-[#77736D] font-normal">/7</span>
                </span>
                <span className="text-xs text-[#AAA59D] mt-1.5 block">
                  Active days this week
                </span>
              </div>

              <div>
                <span 
                  className="text-4xl sm:text-5xl font-black text-[#FF7417] block leading-none"
                  style={{ fontFamily: 'var(--font-display), sans-serif' }}
                >
                  {stats.mediumSolved}
                </span>
                <span className="text-xs text-[#AAA59D] mt-1.5 block">
                  Medium solves
                </span>
              </div>

              <div>
                <span 
                  className="text-4xl sm:text-5xl font-black text-[#E45B55] block leading-none"
                  style={{ fontFamily: 'var(--font-display), sans-serif' }}
                >
                  {stats.hardSolved}
                </span>
                <span className="text-xs text-[#AAA59D] mt-1.5 block">
                  Hard solves
                </span>
              </div>
            </section>

            {/* ── Problem Difficulty Breakdown (Open Layout) ── */}
            <section className="space-y-6 border-b border-white/[0.08] pb-10">
              <div className="flex items-baseline justify-between">
                <h2 
                  className="text-base font-black uppercase tracking-wider text-[#F1EEE8]"
                  style={{ fontFamily: 'var(--font-display), sans-serif' }}
                >
                  Difficulty Distribution
                </h2>
                <span className="text-xs font-mono text-[#AAA59D]">
                  Easy · Medium · Hard
                </span>
              </div>

              <div className="space-y-4">
                {/* Easy */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#39BB75] font-semibold">Easy Problems (50 pts)</span>
                    <span className="text-[#AAA59D] font-mono">{stats.easySolved} / {maxEasy}</span>
                  </div>
                  <div className="w-full h-2 bg-white/[0.04]">
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
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#FF7417] font-semibold">Medium Problems (100 pts)</span>
                    <span className="text-[#AAA59D] font-mono">{stats.mediumSolved} / {maxMed}</span>
                  </div>
                  <div className="w-full h-2 bg-white/[0.04]">
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
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#E45B55] font-semibold">Hard Problems (200 pts)</span>
                    <span className="text-[#AAA59D] font-mono">{stats.hardSolved} / {maxHard}</span>
                  </div>
                  <div className="w-full h-2 bg-white/[0.04]">
                    <motion.div 
                      className="h-full bg-[#E45B55]"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((stats.hardSolved / maxHard) * 100, 100)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ── Two-Column Attendance & Timeline ── */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-white/[0.08] pb-10">
              
              {/* This Week 7-Day Activity Matrix */}
              <div className="space-y-4">
                <div className="flex items-baseline justify-between text-xs">
                  <h3 
                    className="font-black uppercase tracking-wider text-[#F1EEE8]"
                    style={{ fontFamily: 'var(--font-display), sans-serif' }}
                  >
                    Week Attendance Matrix
                  </h3>
                  <span className="text-[#39BB75] font-mono font-semibold">
                    {stats.activeDays}/7 active days
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {DAY_LABELS.map((day, i) => {
                    const isToday = i === currentDayIndex;
                    const done = stats.weekDays[i];

                    return (
                      <div key={i} className="flex flex-col items-center">
                        <div 
                          className={`
                            w-full aspect-square flex items-center justify-center text-xs font-mono font-bold border transition-colors
                            ${done 
                              ? 'bg-[#39BB75] text-black border-[#39BB75]' 
                              : i <= currentDayIndex
                              ? 'bg-[#161616] text-[#77736D] border-white/5'
                              : 'bg-transparent text-[#444444] border-dashed border-white/10'}
                            ${isToday ? 'ring-1 ring-[#FF7417]' : ''}
                          `}
                          title={`${DAY_FULL_NAMES[i]}: ${done ? 'Solved' : 'No activity'}`}
                        >
                          {done ? <Check className="w-4 h-4 stroke-[2.5]" /> : '·'}
                        </div>
                        <p className={`text-[10px] mt-1.5 font-mono ${isToday ? 'text-[#FF7417] font-bold' : 'text-[#77736D]'}`}>
                          {day}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent 8-Day Rolling Timeline */}
              <div className="space-y-4">
                <div className="flex items-baseline justify-between text-xs">
                  <h3 
                    className="font-black uppercase tracking-wider text-[#F1EEE8] flex items-center gap-1.5"
                    style={{ fontFamily: 'var(--font-display), sans-serif' }}
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#FF7417]" />
                    <span>8-Day Rolling Timeline</span>
                  </h3>
                  <span className="text-[#AAA59D] font-mono text-[11px]">
                    Recent submissions
                  </span>
                </div>

                <div className="grid grid-cols-8 gap-1.5">
                  {stats.streak.map((active, i) => (
                    <div 
                      key={i} 
                      className={`
                        h-10 flex items-center justify-center border font-mono text-xs font-bold transition-colors
                        ${active 
                          ? 'bg-[#39BB75] text-black border-[#39BB75]' 
                          : 'bg-[#161616] text-[#444444] border-white/5'}
                        ${i === stats.streak.length - 1 ? 'ring-1 ring-[#FF7417]' : ''}
                      `}
                      title={active ? 'Submissions recorded' : 'No submissions'}
                    >
                      {active ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : '·'}
                    </div>
                  ))}
                </div>
              </div>

            </section>

            {/* ── Owner Workstation Controls (Floating Glass) ── */}
            {isOwner && (
              <section className="floating-glass p-6 space-y-4 border border-white/[0.12]">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-white/[0.04] text-[#FF7417]">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 
                      className="text-base font-black uppercase text-[#F1EEE8] tracking-tight"
                      style={{ fontFamily: 'var(--font-display), sans-serif' }}
                    >
                      Workstation Binding Controls
                    </h3>
                    <p className="text-xs text-[#AAA59D] mt-1 leading-relaxed">
                      This machine is currently bound to <span className="text-[#F1EEE8] font-bold">@{stats.name}</span>. 
                      To switch accounts or unbind this device, confirm removal below.
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full bg-white/[0.03] text-[#E45B55] border border-[#E45B55]/30 hover:bg-[#E45B55]/10 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deleting ? 'Unlinking device...' : 'Unlink LeetCode ID from this workstation'}</span>
                  </button>
                </div>
              </section>
            )}

            {/* Link back to overall */}
            <div className="text-center pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-mono text-[#AAA59D] hover:text-[#FF7417] transition-colors"
              >
                <span>View Complete League Standings</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
