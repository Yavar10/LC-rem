
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback
} from 'react';

import axios from 'axios';
import { getDeviceFingerprint } from '@/lib/fingerprint';

const API_BASE = 'https://kinkdin.onrender.com';

const DAY_SECONDS = 86400;
const ACCEPTED_SUBMISSION_LIMIT = 1000;
const CACHE_TTL_MS = 3 * 60 * 1000;

// --------------------------------------------------
// TYPES
// --------------------------------------------------

export interface LeaderboardUser {
  sname: string;
  name: string;
  img: string;

  easy: number;
  medium: number;
  hard: number;

  solved: number;
  score: number;

  weeklySolved: number;
  weeklyScore: number;
  weeklySolvedComplete: boolean;

  rolling7Solved: number;
  rolling7Score: number;
  rolling7SolvedComplete: boolean;

  streak: number[];
  currentStreak: number;

  thisWeek: number;
  completion: number;
  weekDays: boolean[];
}

interface AcceptedSubmission {
  titleSlug?: string;
  questionSlug?: string;
  timestamp?: string | number;
}

interface LeaderboardContextType {
  users: LeaderboardUser[];

  sortedUsers: LeaderboardUser[];
  overallSortedUsers: LeaderboardUser[];
  weeklySortedUsers: LeaderboardUser[];

  loading: boolean;
  error: string | null;

  registeredUsername: string | null;

  currentUser: LeaderboardUser | null;
  currentUserRank: number | null;

  weeklyCurrentUser: LeaderboardUser | null;
  weeklyCurrentUserRank: number | null;

  refresh: () => Promise<void>;
}

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function parseSubmissionCalendar(
  raw: unknown
): Record<string, number> {

  try {
    const parsed =
      typeof raw === 'string'
        ? JSON.parse(raw)
        : raw;

    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, number>;
    }
  } catch (error) {
    console.error('Failed to parse submission calendar:', error);
  }

  return {};
}

// Supports common response shapes from LeetCode REST wrappers.
function extractAcceptedSubmissions(
  payload: unknown
): AcceptedSubmission[] | null {

  if (Array.isArray(payload)) {
    return payload as AcceptedSubmission[];
  }

  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;

  const data =
    record.data && typeof record.data === 'object'
      ? record.data as Record<string, unknown>
      : null;

  const nestedData =
    data?.data && typeof data.data === 'object'
      ? data.data as Record<string, unknown>
      : null;

  const submissionList =
    data?.submissionList &&
    typeof data.submissionList === 'object'
      ? data.submissionList as Record<string, unknown>
      : null;

  const candidates: unknown[] = [
    record.submission,
    record.submissions,
    record.acceptedSubmission,
    record.acceptedSubmissions,
    record.recentAcSubmissionList,

    data?.submission,
    data?.submissions,
    data?.acceptedSubmission,
    data?.acceptedSubmissions,
    data?.recentAcSubmissionList,

    nestedData?.submission,
    nestedData?.submissions,
    nestedData?.recentAcSubmissionList,

    submissionList?.submissions
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as AcceptedSubmission[];
    }
  }

  return null;
}

function normalizeAcceptedSubmissions(
  submissions: AcceptedSubmission[]
) {
  return submissions
    .map(sub => {
      const titleSlug = (
        sub.titleSlug || sub.questionSlug || ''
      ).trim().toLowerCase();

      let timestamp = Number(sub.timestamp);

      // Support both seconds and milliseconds.
      if (timestamp > 10_000_000_000) {
        timestamp = Math.floor(timestamp / 1000);
      }

      return {
        titleSlug,
        timestamp
      };
    })
    .filter(sub =>
      sub.titleSlug.length > 0 &&
      Number.isFinite(sub.timestamp) &&
      sub.timestamp > 0
    );
}

function getWindowSolvedCount(
  submissions: ReturnType<typeof normalizeAcceptedSubmissions>,
  rawSubmissionCount: number,
  responseValid: boolean,
  windowStart: number,
  windowEnd: number
) {
  const uniqueProblems = new Set<string>();

  submissions.forEach(sub => {
    if (
      sub.timestamp >= windowStart &&
      sub.timestamp < windowEnd
    ) {
      uniqueProblems.add(sub.titleSlug);
    }
  });

  const timestamps = submissions.map(sub => sub.timestamp);

  const oldestTimestamp =
    timestamps.length > 0
      ? Math.min(...timestamps)
      : null;

  // If the API returned fewer records than requested,
  // assume the requested result set was not truncated.
  //
  // If it reached the limit, we can only confirm completeness
  // when the oldest returned submission is older than the
  // start of the requested window.

  const reachedLimit =
    rawSubmissionCount >= ACCEPTED_SUBMISSION_LIMIT;

  const coverageConfirmed =
    !reachedLimit ||
    (
      oldestTimestamp !== null &&
      oldestTimestamp <= windowStart
    );

  return {
    count: uniqueProblems.size,

    complete:
      responseValid &&
      submissions.length === rawSubmissionCount &&
      coverageConfirmed
  };
}

// --------------------------------------------------
// SHARED CACHE
// --------------------------------------------------

let memoryCachedUsers: LeaderboardUser[] = [];

let memoryFetchPromise:
  Promise<LeaderboardUser[]> | null = null;

let memoryLastFetched = 0;

// --------------------------------------------------
// CONTEXT
// --------------------------------------------------

const LeaderboardContext =
  createContext<LeaderboardContextType | undefined>(
    undefined
  );

// --------------------------------------------------
// PROVIDER
// --------------------------------------------------

export function LeaderboardProvider({
  children
}: {
  children: React.ReactNode;
}) {

  const [users, setUsers] = useState<LeaderboardUser[]>(
    memoryCachedUsers
  );

  const [loading, setLoading] = useState(
    memoryCachedUsers.length === 0
  );

  const [error, setError] = useState<string | null>(null);

  const [registeredUsername, setRegisteredUsername] =
    useState<string | null>(null);

  // ------------------------------------------------
  // FETCH SINGLE USER
  // ------------------------------------------------

  const fetchSingleUser = async (
    username: string
  ): Promise<LeaderboardUser | null> => {

    try {

      const [
        solvedRes,
        profileRes,
        calendarRes,
        acceptedRes
      ] = await Promise.all([

        // Existing endpoints.
        axios.get(
          `${API_BASE}/${encodeURIComponent(username)}/solved`
        ),

        axios.get(
          `${API_BASE}/${encodeURIComponent(username)}`
        ),

        axios.get(
          `${API_BASE}/${encodeURIComponent(username)}/calendar`
        ).catch(() => ({ data: {} })),

        // Accepted submissions, needed to count unique problems.
        //
        // This is fetched once inside the shared provider,
        // NOT independently by the weekly leaderboard route.
        axios.get(
          `${API_BASE}/${encodeURIComponent(username)}/acSubmission`,
          {
            params: {
              limit: ACCEPTED_SUBMISSION_LIMIT
            },
            timeout: 20000
          }
        ).catch(() => null)

      ]);

      if (
        profileRes.data?.errors ||
        solvedRes.data?.errors
      ) {
        return null;
      }

      // ------------------------------------------------
      // CALENDAR
      // ------------------------------------------------

      const calendarData = calendarRes.data || {};

      const submissionCalendar = parseSubmissionCalendar(
        calendarData.submissionCalendar ??
        calendarData.data?.submissionCalendar
      );

      const now = new Date();

      const todayUtcMidnightSec = Math.floor(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate()
        ) / 1000
      );

      const yesterdayUtcMidnightSec =
        todayUtcMidnightSec - DAY_SECONDS;

      // ------------------------------------------------
      // LAST 8 DAYS ACTIVITY
      // ------------------------------------------------

      const last8Days = Array.from(
        { length: 8 },
        (_, i) =>
          todayUtcMidnightSec - (7 - i) * DAY_SECONDS
      );

      const streak = last8Days.map(timestamp =>
        Number(submissionCalendar[timestamp] || 0) > 0
          ? 1
          : 0
      );

      // ------------------------------------------------
      // CURRENT WEEK (MONDAY - SUNDAY UTC)
      // ------------------------------------------------

      const utcDayOfWeek = now.getUTCDay();

      const mondayOffset =
        utcDayOfWeek === 0
          ? 6
          : utcDayOfWeek - 1;

      const mondayUtcMidnightSec =
        todayUtcMidnightSec -
        mondayOffset * DAY_SECONDS;

      const nextMondayUtcMidnightSec =
        mondayUtcMidnightSec + 7 * DAY_SECONDS;

      const currentWeekTimestamps = Array.from(
        { length: 7 },
        (_, i) =>
          mondayUtcMidnightSec + i * DAY_SECONDS
      );

      // Active days are still calculated from the calendar.
      // Calendar activity is NOT used for weekly solved count.

      const weekDays = currentWeekTimestamps.map(ts =>
        Number(submissionCalendar[ts] || 0) > 0
      );

      const thisWeekCount =
        weekDays.filter(Boolean).length;

      // ------------------------------------------------
      // ACCEPTED SUBMISSIONS
      // ------------------------------------------------

      const rawAcceptedSubmissions =
        acceptedRes
          ? extractAcceptedSubmissions(acceptedRes.data)
          : null;

      const acceptedResponseValid =
        Array.isArray(rawAcceptedSubmissions);

      const rawSubmissionCount =
        rawAcceptedSubmissions?.length ?? 0;

      const acceptedSubmissions =
        normalizeAcceptedSubmissions(
          rawAcceptedSubmissions || []
        );

      // ------------------------------------------------
      // WEEKLY UNIQUE PROBLEMS SOLVED
      // ------------------------------------------------

      const weeklyResult = getWindowSolvedCount(
        acceptedSubmissions,
        rawSubmissionCount,
        acceptedResponseValid,
        mondayUtcMidnightSec,
        nextMondayUtcMidnightSec
      );

      const weeklySolved = weeklyResult.count;

      // ------------------------------------------------
      // ROLLING LAST 7 DAYS
      // ------------------------------------------------

      const rolling7Start =
        todayUtcMidnightSec - 6 * DAY_SECONDS;

      const rolling7End =
        todayUtcMidnightSec + DAY_SECONDS;

      const rolling7Result = getWindowSolvedCount(
        acceptedSubmissions,
        rawSubmissionCount,
        acceptedResponseValid,
        rolling7Start,
        rolling7End
      );

      const rolling7Solved = rolling7Result.count;

      // ------------------------------------------------
      // CURRENT STREAK
      // ------------------------------------------------

      const activeTimestampSet = new Set(
        Object.keys(submissionCalendar).map(Number)
      );

      let currentStreak = 0;

      let checkDate =
        activeTimestampSet.has(todayUtcMidnightSec)
          ? todayUtcMidnightSec
          : yesterdayUtcMidnightSec;

      while (activeTimestampSet.has(checkDate)) {
        currentStreak++;
        checkDate -= DAY_SECONDS;
      }

      // ------------------------------------------------
      // DIFFICULTY STATISTICS
      // ------------------------------------------------

      const easy =
        solvedRes.data.easySolved || 0;

      const medium =
        solvedRes.data.mediumSolved || 0;

      const hard =
        solvedRes.data.hardSolved || 0;

      const solved =
        solvedRes.data.solvedProblem || 0;

      // ------------------------------------------------
      // OVERALL SCORE
      // ------------------------------------------------

      // Easy = 50
      // Medium = 100
      // Hard = 200

      const score =
        (easy * 50) +
        (medium * 100) +
        (hard * 200);

      // ------------------------------------------------
      // WEEKLY SCORE
      // ------------------------------------------------

      const avgWeight =
        solved > 0
          ? score / solved
          : 100;

      // Do not award weekly points based on an
      // incomplete accepted-submission result.

      const weeklyScore =
        weeklyResult.complete
          ? Math.round(weeklySolved * avgWeight)
          : 0;

      const rolling7Score =
        rolling7Result.complete
          ? Math.round(rolling7Solved * avgWeight)
          : 0;

      // ------------------------------------------------
      // COMPLETION
      // ------------------------------------------------

      const totalProblems = 3000;

      const completion = Math.round(
        (solved / totalProblems) * 100
      );

      // ------------------------------------------------
      // RETURN USER
      // ------------------------------------------------

      return {

        name: username,

        sname:
          profileRes.data.name || username,

        img:
          profileRes.data.avatar ||
          profileRes.data.profile?.userAvatar ||
          '',

        easy,
        medium,
        hard,

        solved,
        score,

        weeklySolved,
        weeklyScore,
        weeklySolvedComplete: weeklyResult.complete,

        rolling7Solved,
        rolling7Score,
        rolling7SolvedComplete: rolling7Result.complete,

        streak,
        currentStreak,

        thisWeek: thisWeekCount,

        completion,

        weekDays

      };

    } catch (err) {

      console.error(
        `Failed to fetch LeetCode user: ${username}`,
        err
      );

      return null;
    }
  };

  // ------------------------------------------------
  // MASTER FETCH FUNCTION
  // ONE SHARED PROMISE + IN-MEMORY CACHE
  // ------------------------------------------------

  const loadLeaderboardData = useCallback(
    async (
      force = false
    ): Promise<LeaderboardUser[]> => {

      const now = Date.now();

      // Use cached data when still valid.
      if (
        !force &&
        memoryCachedUsers.length > 0 &&
        now - memoryLastFetched < CACHE_TTL_MS
      ) {

        setUsers(memoryCachedUsers);
        setLoading(false);

        return memoryCachedUsers;
      }

      // Avoid duplicate simultaneous fetches.
      if (memoryFetchPromise && !force) {
        return memoryFetchPromise;
      }

      memoryFetchPromise = (async () => {

        setLoading(true);
        setError(null);

        try {

          const res = await axios.get('/api/users');

          let usernames: string[] =
            res.data.usernames || [];

          if (usernames.length === 0) {

            usernames = [
              'vamp_z',
              'Ayush_0129',
              'the_d_coder',
              'loogied'
            ];

            usernames.forEach(username => {
              axios.post('/api/users', {
                username
              }).catch(() => {});
            });
          }

          // Each user is fetched once.
          // All pages consume the same context data.

          const userPromises = usernames.map(username =>
            fetchSingleUser(username)
          );

          const results = await Promise.all(userPromises);

          const validUsers = results.filter(
            (user): user is LeaderboardUser =>
              user !== null
          );

          memoryCachedUsers = validUsers;

          memoryLastFetched = Date.now();

          setUsers(validUsers);
          setLoading(false);

          return validUsers;

        } catch (err: unknown) {

          console.error(
            'Failed to load leaderboard data:',
            err
          );

          setError(
            'Failed to fetch leaderboard data.'
          );

          setLoading(false);

          return memoryCachedUsers;

        } finally {

          memoryFetchPromise = null;

        }

      })();

      return memoryFetchPromise;

    },
    []
  );

  // ------------------------------------------------
  // DEVICE REGISTRATION
  // ------------------------------------------------

  useEffect(() => {

    async function checkCurrentDevice() {

      try {

        const {
          deviceId,
          hardwareSummary
        } = await getDeviceFingerprint();

        const params = new URLSearchParams({

          deviceId,

          gpu: hardwareSummary.gpu,

          screen: hardwareSummary.screen,

          cores: String(hardwareSummary.cores),

          os: hardwareSummary.os

        });

        const res = await axios.get(
          `/api/users?${params.toString()}`
        );

        if (
          res.data?.registered &&
          res.data?.user?.username
        ) {

          setRegisteredUsername(
            res.data.user.username
          );

        } else {

          setRegisteredUsername(null);

        }

      } catch {

        // Quiet fail: device registration is optional.

      }

    }

    checkCurrentDevice();

  }, []);

  // ------------------------------------------------
  // INITIAL DATA LOAD
  // ------------------------------------------------

  useEffect(() => {

    loadLeaderboardData();

  }, [loadLeaderboardData]);

  // ------------------------------------------------
  // OVERALL RANKING
  // ------------------------------------------------

  const overallSortedUsers = useMemo(() => {

    return [...users].sort(
      (a, b) => b.score - a.score
    );

  }, [users]);

  // ------------------------------------------------
  // WEEKLY RANKING
  // ------------------------------------------------

  const weeklySortedUsers = useMemo(() => {

    return [...users].sort((a, b) => {

      // Complete weekly data always ranks ahead
      // of users whose accepted-submission history
      // could not be fully verified.

      if (
        a.weeklySolvedComplete !==
        b.weeklySolvedComplete
      ) {
        return a.weeklySolvedComplete ? -1 : 1;
      }

      // If both results are incomplete,
      // avoid claiming an accurate weekly ranking.

      if (
        !a.weeklySolvedComplete &&
        !b.weeklySolvedComplete
      ) {
        return b.score - a.score;
      }

      // 1. Primary: weekly score

      if (b.weeklyScore !== a.weeklyScore) {
        return b.weeklyScore - a.weeklyScore;
      }

      // 2. Secondary: weekly unique problems solved

      if (b.weeklySolved !== a.weeklySolved) {
        return b.weeklySolved - a.weeklySolved;
      }

      // 3. Tertiary: active days

      if (b.thisWeek !== a.thisWeek) {
        return b.thisWeek - a.thisWeek;
      }

      // 4. Quaternary: current streak

      if (b.currentStreak !== a.currentStreak) {
        return b.currentStreak - a.currentStreak;
      }

      // 5. Fallback: all-time score

      return b.score - a.score;

    });

  }, [users]);

  // ------------------------------------------------
  // CURRENT USER — OVERALL
  // ------------------------------------------------

  const {
    currentUser: overallCurrentUser,
    currentUserRank: overallCurrentUserRank
  } = useMemo(() => {

    if (
      !registeredUsername ||
      overallSortedUsers.length === 0
    ) {

      return {
        currentUser: null,
        currentUserRank: null
      };

    }

    const index = overallSortedUsers.findIndex(
      user =>
        user.name.toLowerCase() ===
        registeredUsername.toLowerCase()
    );

    if (index === -1) {

      return {
        currentUser: null,
        currentUserRank: null
      };

    }

    return {

      currentUser: overallSortedUsers[index],

      currentUserRank: index + 1

    };

  }, [
    registeredUsername,
    overallSortedUsers
  ]);

  // ------------------------------------------------
  // CURRENT USER — WEEKLY
  // ------------------------------------------------

  const {
    weeklyCurrentUser,
    weeklyCurrentUserRank
  } = useMemo(() => {

    if (
      !registeredUsername ||
      weeklySortedUsers.length === 0
    ) {

      return {
        weeklyCurrentUser: null,
        weeklyCurrentUserRank: null
      };

    }

    const index = weeklySortedUsers.findIndex(
      user =>
        user.name.toLowerCase() ===
        registeredUsername.toLowerCase()
    );

    if (index === -1) {

      return {
        weeklyCurrentUser: null,
        weeklyCurrentUserRank: null
      };

    }

    return {

      weeklyCurrentUser: weeklySortedUsers[index],

      weeklyCurrentUserRank: index + 1

    };

  }, [
    registeredUsername,
    weeklySortedUsers
  ]);

  // ------------------------------------------------
  // FORCE REFRESH
  // ------------------------------------------------

  const refresh = useCallback(async () => {

    await loadLeaderboardData(true);

  }, [loadLeaderboardData]);

  // ------------------------------------------------
  // CONTEXT VALUE
  // ------------------------------------------------

  const contextValue = useMemo(() => ({

    users,

    sortedUsers: overallSortedUsers,

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

// --------------------------------------------------
// HOOK
// --------------------------------------------------

export function useLeaderboard() {

  const context = useContext(LeaderboardContext);

  if (!context) {

    throw new Error(
      'useLeaderboard must be used within a LeaderboardProvider'
    );

  }

  return context;

}
