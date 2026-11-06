"use client";

import { useState, useEffect, useCallback, use } from "react";
import axios from "axios";
import { 
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
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDeviceFingerprint, HardwareProfile } from "@/lib/fingerprint";

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
  if (streak >= 30) return "machine mode — don't stop.";
  if (streak >= 14) return "two weeks strong. keep building.";
  if (streak >= 7) return "a full week. momentum is real.";
  if (streak >= 3) return "getting into rhythm.";
  if (streak >= 1) return "every day counts.";
  return "start today. no excuses.";
}

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = use(params);
  const username = decodeURIComponent(resolvedParams.username);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LeetCodeStats | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Device ownership state
  const [deviceId, setDeviceId] = useState<string>("");
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
        avatar: profile.avatar || profile.userAvatar || "",
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
    } catch (err) {
      console.error("Error loading user profile:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [username]);

  // Check device identity and ownership
  const verifyDeviceOwnership = useCallback(async () => {
    try {
      const { deviceId: hash, hardwareSummary } = await getDeviceFingerprint();
      setDeviceId(hash);
      setHardwareInfo(hardwareSummary);

      const params = new URLSearchParams({
        deviceId: hash,
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
      console.error("Device check error:", err);
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
      router.push("/user");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setDeleteError(err.response?.data?.error || "Failed to remove ID from device.");
      } else {
        setDeleteError("Failed to remove ID from device.");
      }
      setDeleting(false);
    }
  };

  const maxEasy = 800;
  const maxMed = 1700;
  const maxHard = 700;
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="min-h-screen px-4 py-8 md:px-6 md:py-12 max-w-2xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-8">
        <Link 
          href="/" 
          className="group flex items-center gap-1.5 text-[#6b6963] hover:text-[#e8e6e3] transition-colors w-fit"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-xs font-mono">leaderboard</span>
        </Link>

        {isOwner ? (
          <span className="inline-flex items-center gap-1 text-[11px] bg-[#3db86a]/10 text-[#3db86a] border border-[#3db86a]/20 px-2.5 py-1 rounded-full font-mono">
            <ShieldCheck className="w-3.5 h-3.5" /> Your Device Profile
          </span>
        ) : (
          <Link 
            href="/user" 
            className="text-xs font-mono text-[#6b6963] hover:text-[#e8e6e3] bg-[#1a1917] hover:bg-[#2a2926] px-3 py-1 rounded-md border border-[#2a2926] transition-colors"
          >
            Manage My Device ID
          </Link>
        )}
      </div>

      {deleteError && (
        <div className="bg-[#e05a5a]/10 border border-[#e05a5a]/30 text-[#e05a5a] text-xs px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-[#1a1917] rounded-xl border border-[#2a2926] p-16 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#e07a3a] mx-auto mb-3" />
          <p className="text-sm text-[#6b6963] font-mono">Loading /u/{username} stats...</p>
        </div>
      ) : notFound || !stats ? (
        <div className="bg-[#1a1917] rounded-xl border border-[#2a2926] p-12 text-center">
          <AlertCircle className="w-8 h-8 text-[#e05a5a] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#e8e6e3] mb-1">User Not Found</h2>
          <p className="text-xs text-[#6b6963] mb-6">
            The LeetCode username &ldquo;{username}&rdquo; could not be retrieved from the API.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono bg-[#2a2926] hover:bg-[#33312e] text-[#e8e6e3] px-4 py-2 rounded-lg transition-colors"
          >
            Back to Leaderboard
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Profile Header Card */}
          <div className="bg-[#1a1917] rounded-xl border border-[#2a2926] p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {stats.avatar ? (
                  <img 
                    src={stats.avatar} 
                    alt={stats.name} 
                    className="w-16 h-16 rounded-full border border-[#2a2926] object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#2a2926] flex items-center justify-center font-bold text-2xl text-[#e8e6e3]">
                    {stats.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-[#e8e6e3]">{stats.name}</h1>
                    <a 
                      href={`https://leetcode.com/u/${stats.name}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#6b6963] hover:text-[#e07a3a] transition-colors"
                      title="Open LeetCode Profile"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  {stats.realName && stats.realName !== stats.name && (
                    <p className="text-xs text-[#6b6963] mt-0.5">{stats.realName}</p>
                  )}
                  {stats.ranking && (
                    <p className="text-[11px] font-mono text-[#a0998e] mt-1 flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-[#e07a3a]" /> Rank #{stats.ranking.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="text-3xl font-bold font-mono text-[#e07a3a]">
                  {stats.totalSolved}
                </div>
                <div className="text-[11px] text-[#6b6963] uppercase tracking-wider font-mono">
                  Solved Total
                </div>
              </div>
            </div>

            {/* Streak & Motivation Banner */}
            <div className="mt-6 pt-5 border-t border-[#2a2926]/70 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Flame className={`w-4 h-4 ${stats.currentStreak > 0 ? 'text-[#e07a3a]' : 'text-[#6b6963]'}`} />
                <span className="text-xs font-mono font-bold text-[#e8e6e3]">
                  {stats.currentStreak} day streak
                </span>
                <span className="text-xs text-[#6b6963] font-mono">
                  — {getMotivation(stats.currentStreak)}
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#6b6963]">
                {stats.activeDays}/7 this week
              </span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-4 gap-3 bg-[#1a1917] p-4 rounded-xl border border-[#2a2926]">
            <div className="text-center">
              <p className="text-xl md:text-2xl font-bold font-mono text-[#e8e6e3]">{stats.currentStreak}</p>
              <p className="text-[#6b6963] text-[10px] font-mono uppercase mt-0.5">streak</p>
            </div>
            <div className="text-center">
              <p className="text-xl md:text-2xl font-bold font-mono text-[#e8e6e3]">{stats.totalSolved}</p>
              <p className="text-[#6b6963] text-[10px] font-mono uppercase mt-0.5">solved</p>
            </div>
            <div className="text-center">
              <p className="text-xl md:text-2xl font-bold font-mono text-[#e8e6e3]">{stats.activeDays}<span className="text-[#6b6963] text-sm">/7</span></p>
              <p className="text-[#6b6963] text-[10px] font-mono uppercase mt-0.5">this week</p>
            </div>
            <div className="text-center">
              <p className="text-xl md:text-2xl font-bold font-mono text-[#e8e6e3]">{stats.completion}<span className="text-[#6b6963] text-sm">%</span></p>
              <p className="text-[#6b6963] text-[10px] font-mono uppercase mt-0.5">complete</p>
            </div>
          </div>

          {/* This Week Mon-Sun Grid */}
          <div className="bg-[#1a1917] rounded-xl border border-[#2a2926] p-6">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-xs font-semibold text-[#6b6963] uppercase tracking-wider font-mono">
                This week
              </h2>
              <span className="text-[11px] text-[#a0998e] font-mono">
                {stats.activeDays === 7 ? 'perfect week 🎯' : 
                 stats.activeDays >= 5 ? 'strong week' : 
                 stats.activeDays >= 3 ? 'decent' : 
                 stats.activeDays > 0 ? 'warming up' : 'no submissions yet'}
              </span>
            </div>

            <div className="flex gap-2">
              {dayNames.map((day, i) => {
                const isToday = i === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
                const done = stats.weekDays[i];

                return (
                  <div key={i} className="flex-1 text-center">
                    <div className={`
                      aspect-square rounded-lg flex items-center justify-center text-xs font-medium
                      transition-colors relative
                      ${done 
                        ? 'bg-[#3db86a]/15 text-[#3db86a] border border-[#3db86a]/30' 
                        : 'bg-[#111110] text-[#2a2926] border border-[#2a2926]'}
                      ${isToday ? 'ring-1 ring-[#e07a3a]/60' : ''}
                    `}>
                      {done ? '✓' : '·'}
                    </div>
                    <p className={`
                      text-[10px] mt-1.5 font-mono
                      ${isToday ? 'text-[#e8e6e3] font-semibold' : 'text-[#6b6963]'}
                    `}>
                      {day}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Problem Difficulty Breakdown */}
          <div className="bg-[#1a1917] rounded-xl border border-[#2a2926] p-6 space-y-4">
            <h2 className="text-xs font-semibold text-[#6b6963] uppercase tracking-wider font-mono">
              Problem Distribution
            </h2>

            {/* Easy */}
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-mono">
                <span className="text-[#3db86a]">Easy</span>
                <span className="text-[#e8e6e3]">{stats.easySolved} <span className="text-[#6b6963]">/ {maxEasy}</span></span>
              </div>
              <div className="w-full h-2 bg-[#111110] rounded-full overflow-hidden border border-[#2a2926]">
                <div 
                  className="h-full bg-[#3db86a] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((stats.easySolved / maxEasy) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Medium */}
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-mono">
                <span className="text-[#d4a53a]">Medium</span>
                <span className="text-[#e8e6e3]">{stats.mediumSolved} <span className="text-[#6b6963]">/ {maxMed}</span></span>
              </div>
              <div className="w-full h-2 bg-[#111110] rounded-full overflow-hidden border border-[#2a2926]">
                <div 
                  className="h-full bg-[#d4a53a] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((stats.mediumSolved / maxMed) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Hard */}
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-mono">
                <span className="text-[#e05a5a]">Hard</span>
                <span className="text-[#e8e6e3]">{stats.hardSolved} <span className="text-[#6b6963]">/ {maxHard}</span></span>
              </div>
              <div className="w-full h-2 bg-[#111110] rounded-full overflow-hidden border border-[#2a2926]">
                <div 
                  className="h-full bg-[#e05a5a] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((stats.hardSolved / maxHard) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Last 8 Days Streak Visualizer */}
          <div className="bg-[#1a1917] rounded-xl border border-[#2a2926] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-[#6b6963] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Recent Activity
              </h2>
              <span className="text-[11px] font-mono text-[#6b6963]">Last 8 days</span>
            </div>

            <div className="flex items-center gap-2">
              {stats.streak.map((active, i) => (
                <div key={i} className="flex-1">
                  <div className={`
                    h-8 rounded-md flex items-center justify-center transition-colors
                    ${active ? 'bg-[#3db86a]/15 text-[#3db86a] border border-[#3db86a]/30' : 'bg-[#111110] border border-[#2a2926]'}
                  `}>
                    <div className={`
                      w-2 h-2 rounded-full
                      ${active ? 'bg-[#3db86a]' : 'bg-[#2a2926]'}
                    `} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Owner Management Section */}
          {isOwner && (
            <div className="bg-[#1a1917] rounded-xl border border-[#2a2926] p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#2a2926] text-[#e07a3a]">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#e8e6e3]">Device Management</h3>
                  <p className="text-xs text-[#6b6963] mt-0.5">
                    This physical device is bound to <span className="text-[#e8e6e3] font-mono">/u/{stats.name}</span>. You can only register another LeetCode ID by deleting this one first.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full bg-[#e05a5a]/15 text-[#e05a5a] border border-[#e05a5a]/30 hover:bg-[#e05a5a]/25 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? "Deleting ID from device..." : "Delete ID from this Device"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
