'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { getDeviceFingerprint } from '@/lib/fingerprint';

export interface LeaderboardUser {
  sname: string;
  name: string;
  img: string;
  easy: number;
  medium: number;
  hard: number;
  solved: number;
  score: number; // all-time overall score
  weeklySolved: number; // problems solved this week (Mon to Sun)
  weeklyScore: number; // points earned this week
  rolling7Solved: number; // problems solved in the last 7 rolling days
  rolling7Score: number; // points earned in the last 7 rolling days
  streak: number[];
  currentStreak: number;
  thisWeek: number; // active days count this week (0-7)
  completion: number;
  weekDays: boolean[];
}

interface LeaderboardContextType {
  users: LeaderboardUser[];
  sortedUsers: LeaderboardUser[]; // alias for overallSortedUsers (backward compatibility)
  overallSortedUsers: LeaderboardUser[]; // ranked by all-time score
  weeklySortedUsers: LeaderboardUser[]; // ranked strictly by THIS WEEK's points & problems
  loading: boolean;
  error: string | null;
  registeredUsername: string | null;
  currentUser: LeaderboardUser | null;
  currentUserRank: number | null; // overall rank
  weeklyCurrentUser: LeaderboardUser | null;
  weeklyCurrentUserRank: number | null; // weekly rank
  refresh: () => Promise<void>;
}

const LeaderboardContext = createContext<LeaderboardContextType | undefined>(undefined);

// In-memory module cache to guarantee zero duplicate network requests across route navigations
let memoryCachedUsers: LeaderboardUser[] = [];
let memoryFetchPromise: Promise<LeaderboardUser[]> | null = null;
let memoryLastFetched = 0;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

export function LeaderboardProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<LeaderboardUser[]>(memoryCachedUsers);
  const [loading, setLoading] = useState<boolean>(memoryCachedUsers.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [registeredUsername, setRegisteredUsername] = useState<string | null>(null);

  // Fetch individual user stats from LeetCode GraphQL wrapper
  const fetchSingleUser = async (username: string): Promise<LeaderboardUser | null> => {
    try {
      const [solvedRes, profileRes, calendarRes] = await Promise.all([
        axios.get(`https://kinkdin.onrender.com/${username}/solved`),
        axios.get(`https://kinkdin.onrender.com/${username}`),
        axios.get(`https://kinkdin.onrender.com/${username}/calendar`).catch(() => ({ data: {} }))
      ]);

      if (profileRes.data?.errors || solvedRes.data?.errors) {
        return null;
      }

      const calendarData = calendarRes.data || {};
      const submissionCalendar = calendarData.submissionCalendar 
        ? JSON.parse(calendarData.submissionCalendar) 
        : {};

      // Normalize to UTC midnight timestamps (LeetCode calendar format is UTC midnight in seconds)
      const now = new Date();
      const todayUtcMidnightSec = Math.floor(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 1000
      );
      const yesterdayUtcMidnightSec = todayUtcMidnightSec - 86400;

      // Last 8 days timeline for dot visualizations
      const last8Days = Array.from({ length: 8 }, (_, i) => todayUtcMidnightSec - (7 - i) * 86400);
      const streak = last8Days.map(timestamp => (submissionCalendar[timestamp] ? 1 : 0));

      // Current calendar week (Monday 00:00 UTC through Sunday 23:59 UTC)
      const utcDayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const mondayOffset = utcDayOfWeek === 0 ? 6 : utcDayOfWeek - 1;
      const mondayUtcMidnightSec = todayUtcMidnightSec - (mondayOffset * 86400);

      const currentWeekTimestamps = Array.from({ length: 7 }, (_, i) => mondayUtcMidnightSec + (i * 86400));

      // Active day flags this week (Mon-Sun)
      const weekDays = currentWeekTimestamps.map(ts => Boolean(submissionCalendar[ts]));
      const thisWeekCount = weekDays.filter(Boolean).length;

      // Problems actually solved THIS week (Monday 00:00 UTC to Sunday 23:59 UTC)
      let weeklySolved = 0;
      currentWeekTimestamps.forEach(ts => {
        if (submissionCalendar[ts]) {
          weeklySolved += Number(submissionCalendar[ts]);
        }
      });

      // Rolling last 7 days problem count
      const last7DaysTimestamps = Array.from({ length: 7 }, (_, i) => todayUtcMidnightSec - (6 - i) * 86400);
      let rolling7Solved = 0;
      last7DaysTimestamps.forEach(ts => {
        if (submissionCalendar[ts]) {
          rolling7Solved += Number(submissionCalendar[ts]);
        }
      });

      // All-time active streak
      let currentStreak = 0;
      const sortedTimestamps = Object.keys(submissionCalendar)
        .map(Number)
        .sort((a, b) => b - a);

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

      const easy = solvedRes.data.easySolved || 0;
      const medium = solvedRes.data.mediumSolved || 0;
      const hard = solvedRes.data.hardSolved || 0;
      const solved = solvedRes.data.solvedProblem || 0;

      // All-time weighted score formula: E*50 + M*100 + H*200
      const score = (easy * 50) + (medium * 100) + (hard * 200);

      // Average weight per problem for this user based on their difficulty profile
      const avgWeight = solved > 0 ? score / solved : 100;

      // Weekly points earned THIS WEEK
      const weeklyScore = Math.round(weeklySolved * avgWeight);
      const rolling7Score = Math.round(rolling7Solved * avgWeight);

      const totalProblems = 3000;
      const completion = Math.round((solved / totalProblems) * 100);

      return {
        name: username,
        sname: profileRes.data.name || username,
        img: profileRes.data.avatar || profileRes.data.profile?.userAvatar || '',
        easy,
        medium,
        hard,
        solved,
        score,
        weeklySolved,
        weeklyScore,
        rolling7Solved,
        rolling7Score,
        streak,
        currentStreak,
        thisWeek: thisWeekCount,
        completion,
        weekDays
      };
    } catch {
      return null;
    }
  };

  // Master fetch function sharing one single promise
  const loadLeaderboardData = useCallback(async (force = false): Promise<LeaderboardUser[]> => {
    const now = Date.now();
    if (!force && memoryCachedUsers.length > 0 && (now - memoryLastFetched < CACHE_TTL_MS)) {
      setUsers(memoryCachedUsers);
      setLoading(false);
      return memoryCachedUsers;
    }

    if (memoryFetchPromise && !force) {
      return memoryFetchPromise;
    }

    memoryFetchPromise = (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get('/api/users');
        let usernames: string[] = res.data.usernames || [];

        if (usernames.length === 0) {
          usernames = ['vamp_z', 'Ayush_0129', 'the_d_coder', 'loogied'];
          usernames.forEach(username => {
            axios.post('/api/users', { username }).catch(() => {});
          });
        }

        const userPromises = usernames.map(u => fetchSingleUser(u));
        const results = await Promise.all(userPromises);
        const validUsers = results.filter((u): u is LeaderboardUser => u !== null);

        memoryCachedUsers = validUsers;
        memoryLastFetched = Date.now();
        setUsers(validUsers);
        setLoading(false);
        return validUsers;
      } catch (err: unknown) {
        console.error('Failed to load leaderboard data:', err);
        setError('Failed to fetch leaderboard data.');
        setLoading(false);
        return memoryCachedUsers;
      } finally {
        memoryFetchPromise = null;
      }
    })();

    return memoryFetchPromise;
  }, []);

  // Check device registration to identify current user
  useEffect(() => {
    async function checkCurrentDevice() {
      try {
        const { deviceId, hardwareSummary } = await getDeviceFingerprint();
        const params = new URLSearchParams({
          deviceId,
          gpu: hardwareSummary.gpu,
          screen: hardwareSummary.screen,
          cores: String(hardwareSummary.cores),
          os: hardwareSummary.os
        });
        const res = await axios.get(`/api/users?${params.toString()}`);
        if (res.data?.registered && res.data?.user?.username) {
          setRegisteredUsername(res.data.user.username);
        } else {
          setRegisteredUsername(null);
        }
      } catch {
        // Quiet fail
      }
    }
    checkCurrentDevice();
  }, []);

  useEffect(() => {
    loadLeaderboardData();
  }, [loadLeaderboardData]);

  // Overall sorted users (all-time score) - for home page
  const overallSortedUsers = useMemo(() => {
    return [...users].sort((a, b) => b.score - a.score);
  }, [users]);

  // Weekly sorted users (THIS WEEK's score and solved problems) - for /weekly-leaders
  const weeklySortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      // 1. Primary: weekly score
      if (b.weeklyScore !== a.weeklyScore) {
        return b.weeklyScore - a.weeklyScore;
      }
      // 2. Secondary: weekly problems solved
      if (b.weeklySolved !== a.weeklySolved) {
        return b.weeklySolved - a.weeklySolved;
      }
      // 3. Tertiary: active days this week
      if (b.thisWeek !== a.thisWeek) {
        return b.thisWeek - a.thisWeek;
      }
      // 4. Quaternary: active streak
      if (b.currentStreak !== a.currentStreak) {
        return b.currentStreak - a.currentStreak;
      }
      // 5. Fallback: all-time score
      return b.score - a.score;
    });
  }, [users]);

  // Current user in overall ranking
  const { currentUser: overallCurrentUser, currentUserRank: overallCurrentUserRank } = useMemo(() => {
    if (!registeredUsername || overallSortedUsers.length === 0) {
      return { currentUser: null, currentUserRank: null };
    }
    const index = overallSortedUsers.findIndex(
      u => u.name.toLowerCase() === registeredUsername.toLowerCase()
    );
    if (index === -1) {
      return { currentUser: null, currentUserRank: null };
    }
    return {
      currentUser: overallSortedUsers[index],
      currentUserRank: index + 1
    };
  }, [registeredUsername, overallSortedUsers]);

  // Current user in weekly ranking
  const { weeklyCurrentUser, weeklyCurrentUserRank } = useMemo(() => {
    if (!registeredUsername || weeklySortedUsers.length === 0) {
      return { weeklyCurrentUser: null, weeklyCurrentUserRank: null };
    }
    const index = weeklySortedUsers.findIndex(
      u => u.name.toLowerCase() === registeredUsername.toLowerCase()
    );
    if (index === -1) {
      return { weeklyCurrentUser: null, weeklyCurrentUserRank: null };
    }
    return {
      weeklyCurrentUser: weeklySortedUsers[index],
      weeklyCurrentUserRank: index + 1
    };
  }, [registeredUsername, weeklySortedUsers]);

  const refresh = useCallback(async () => {
    await loadLeaderboardData(true);
  }, [loadLeaderboardData]);

  const contextValue = useMemo(() => ({
    users,
    sortedUsers: overallSortedUsers, // for backward compatibility with App.tsx
    overallSortedUsers,
    weeklySortedUsers,
    loading,
    error,
    registeredUsername,
    currentUser: overallCurrentUser,
    currentUserRank: overallCurrentUserRank,
    weeklyCurrentUser,
    weeklyCurrentUserRank,
    refresh
  }), [
    users,
    overallSortedUsers,
    weeklySortedUsers,
    loading,
    error,
    registeredUsername,
    overallCurrentUser,
    overallCurrentUserRank,
    weeklyCurrentUser,
    weeklyCurrentUserRank,
    refresh
  ]);

  return (
    <LeaderboardContext.Provider value={contextValue}>
      {children}
    </LeaderboardContext.Provider>
  );
}

export function useLeaderboard() {
  const context = useContext(LeaderboardContext);
  if (!context) {
    throw new Error('useLeaderboard must be used within a LeaderboardProvider');
  }
  return context;
}
