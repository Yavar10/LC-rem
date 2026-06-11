'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ArrowUpRight, ExternalLink } from 'lucide-react';
import axios from 'axios';

interface User {
  sname:string,
  name: string;
  img: string;
  easy: number;
  medium: number;
  hard: number;
  solved: number;
  streak: number[];
  currentStreak: number;
  thisWeek: number;
  completion: number;
  weekDays: boolean[];
}

type PageType = 'leaderboard' | 'dashboard';

// ─────────────────────────────────────
// Helpers
// ─────────────────────────────────────

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning grind';
  if (hour < 17) return 'afternoon push';
  if (hour < 21) return 'evening session';
  return 'late night hustle';
}

function getMotivation(streak: number): string {
  if (streak >= 30) return "machine mode — don't stop.";
  if (streak >= 14) return "two weeks strong. keep building.";
  if (streak >= 7) return "a full week. momentum is real.";
  if (streak >= 3) return "getting into rhythm.";
  if (streak >= 1) return "every day counts.";
  return "start today. no excuses.";
}

function getRankLabel(index: number): string {
  if (index === 0) return '1st';
  if (index === 1) return '2nd';
  if (index === 2) return '3rd';
  return `${index + 1}th`;
}

// ─────────────────────────────────────
// Main App
// ─────────────────────────────────────

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('leaderboard');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUser = async (username: string) => {
    try {
      const [solvedRes, profileRes, calendarRes] = await Promise.all([
        axios.get(`https://kinkdin.onrender.com/${username}/solved`),
        axios.get(`https://kinkdin.onrender.com/${username}`),
        axios.get(`https://kinkdin.onrender.com/${username}/calendar`)
      ]);

     
      if (profileRes.data.errors || solvedRes.data.errors || calendarRes.data.errors) {
        throw new Error("User does not exist on LeetCode");
      }

      const calendarData = calendarRes.data;
      const submissionCalendar = calendarData.submissionCalendar ? JSON.parse(calendarData.submissionCalendar) : {};
      
      const getDateTimestamp = (date: Date): number => {
        const d = new Date(date);
        const utcDate = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
        return Math.floor(utcDate / 1000);
      };
      
      const today = new Date();
      
      const last8Days = Array.from({ length: 8 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (7 - i));
        return getDateTimestamp(date);
      });
      
      const streak = last8Days.map(timestamp => {
        return submissionCalendar[timestamp] ? 1 : 0;
      });

      const dayOfWeek = today.getDay();
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - mondayOffset + i);
        const timestamp = getDateTimestamp(date);
        return submissionCalendar[timestamp] ? true : false;
      });

      let currentStreak = 0;
      const sortedTimestamps = Object.keys(submissionCalendar)
        .map(Number)
        .sort((a, b) => b - a);
      
      const todayTimestamp = getDateTimestamp(today);
      const yesterdayTimestamp = getDateTimestamp(new Date(today.getTime() - 86400000));
      
      let checkDate = sortedTimestamps[0] >= todayTimestamp ? todayTimestamp : yesterdayTimestamp;
      
      for (let ts of sortedTimestamps) {
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

      const thisWeekCount = weekDays.filter(day => day).length;
      const totalProblems = 3000;
      const completion = Math.round((solvedRes.data.solvedProblem / totalProblems) * 100);

      const newUser: User = {
        name: username,
        sname:profileRes.data.name,
        img: profileRes.data.avatar || profileRes.data.profile?.userAvatar || '',
        easy: solvedRes.data.easySolved || 0,
        medium: solvedRes.data.mediumSolved || 0,
        hard: solvedRes.data.hardSolved || 0,
        solved: solvedRes.data.solvedProblem || 0,
        streak: streak,
        currentStreak: currentStreak,
        thisWeek: thisWeekCount,
        completion: completion,
        weekDays: weekDays
      };

      setUsers(prev => {
        if (prev.some(u => u.name.toLowerCase() === username.toLowerCase())) {
          return prev;
        }
        return [...prev, newUser];
      });
      setLoading(false);
      return true;
    } catch (error) {
      console.log("Error fetching user:", error instanceof Error ? error.message : 'Unknown error');
      setLoading(false);
      return false;
    }
  }; 

  useEffect(() => {
    const initUsers = async () => {
      try {
        const res = await axios.get('/api/users');
        const usernames = res.data.usernames || [];
        
        if (usernames.length === 0) {
          // If DB is empty, fallback to the default list and populate DB
          const defaultUsers = ["divyanshi_dhangar2005","suryansh_yadav02", "Syed_Ali_Raza786", "IdPoTqX4HA", "Aditi_singh16", "Kratikajaiswal_25","leonish_Gudrak", "Niharika_107","Noor_Alam08"];
          defaultUsers.forEach(username => {
             axios.post('/api/users', { username }).catch(() => {});
             fetchUser(username);
          });
        } else {
          usernames.forEach((username: string) => fetchUser(username));
        }
      } catch (e) {
        console.error("Failed to fetch from DB, using fallback:", e);
        const defaultUsers = ["divyanshi_dhangar2005","suryansh_yadav02", "Syed_Ali_Raza786", "IdPoTqX4HA", "Aditi_singh16", "Kratikajaiswal_25","leonish_Gudrak", "Niharika_107","Noor_Alam08"];
        defaultUsers.forEach(username => fetchUser(username));
      }
    };
    initUsers();
  }, []);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const locksB = (b.easy * 50) + (b.medium * 100) + (b.hard * 200);
      const locksA = (a.easy * 50) + (a.medium * 100) + (a.hard * 200);
      return locksB - locksA;
    });
  }, [users]);

  const openDashboard = (user: User) => {
    setSelectedUser(user);
    setCurrentPage('dashboard');
  };

  const backToLeaderboard = () => {
    setCurrentPage('leaderboard');
    setSelectedUser(null);
  };

  // ═════════════════════════════════
  //  LEADERBOARD
  // ═════════════════════════════════
  if (currentPage === 'leaderboard') {
    const todayStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

    return (
      <div className="min-h-screen px-4 py-8 md:px-6 md:py-12">
        <div className="max-w-xl mx-auto">

          {/* Header — not a card, just type */}
          <header className="mb-10 md:mb-14">
            <p className="text-[#6b6963] text-xs font-mono tracking-wide mb-3">
              {todayStr} · {getTimeOfDayGreeting()}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              Who&apos;s putting in<br />
              <span className="text-[#e07a3a]">the work</span> this week?
            </h1>
            <p className="text-[#6b6963] text-sm mt-3 max-w-sm leading-relaxed">
              {users.length} people in the ring. Sorted by weighted score — 
              hards hit different.
            </p>
          </header>

          {/* Loading state */}
          {loading && users.length === 0 && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-[72px] rounded-lg bg-[#1a1917] animate-pulse" />
              ))}
              <p className="text-[#6b6963] text-xs text-center mt-6 font-mono">
                waking up the API... cold starts are fun
              </p>
            </div>
          )}

          {/* User list */}
          <div className="space-y-1">
            {sortedUsers.map((user, index) => {
              const isTop3 = index < 3;
              const score = (user.easy * 50) + (user.medium * 100) + (user.hard * 200);

              return (
                <button
                  key={user.name}
                  onClick={() => openDashboard(user)}
                  className={`
                    w-full text-left group relative
                    rounded-lg px-4 py-3.5
                    transition-all duration-200
                    hover:bg-[#1a1917]
                    active:scale-[0.995]
                    ${isTop3 ? 'bg-[#16150f]' : ''}
                  `}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Rank */}
                    <span className={`
                      font-mono text-xs w-7 text-right shrink-0 tabular-nums
                      ${index === 0 ? 'text-[#e07a3a] font-bold' : 
                        index === 1 ? 'text-[#a0998e]' :
                        index === 2 ? 'text-[#8b7355]' :
                        'text-[#3a3832]'}
                    `}>
                      {getRankLabel(index)}
                    </span>

                    {/* Avatar */}
                    <div className={`
                      w-9 h-9 rounded-full overflow-hidden shrink-0 
                      ${index === 0 ? 'ring-2 ring-[#e07a3a]/30 ring-offset-1 ring-offset-[#111110]' : ''}
                    `}>
                      {user.img ? (
                        <img src={user.img} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#2a2926] flex items-center justify-center text-[#6b6963] text-sm font-medium">
                          {user.sname?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-sm font-medium truncate ${isTop3 ? 'text-[#e8e6e3]' : 'text-[#a5a19b]'}`}>
                          {user.sname}
                        </span>
                        {user.currentStreak >= 7 && (
                          <span className="text-[10px] text-[#e07a3a] font-mono shrink-0">
                            {user.currentStreak}d streak
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#4a4740] font-mono">
                        {user.solved} solved · {Math.round(score / 1000)}k pts
                      </span>
                    </div>

                    {/* Streak dots */}
                    <div className="hidden sm:flex items-center gap-[3px] shrink-0">
                      {user.streak.map((active, i) => (
                        <div
                          key={i}
                          className={`
                            w-[6px] h-[6px] rounded-full
                            ${active ? 'bg-[#3db86a]' : 'bg-[#2a2926]'}
                          `}
                        />
                      ))}
                    </div>

                    {/* Arrow */}
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#2a2926] group-hover:text-[#6b6963] transition-colors shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <footer className="mt-12 pt-6 border-t border-[#1a1917]">
            <div className="flex items-center justify-between text-[#3a3832] text-[10px] font-mono">
              <span>scores: easy×50 · med×100 · hard×200</span>
              <a 
                href="https://leetcode.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-[#6b6963] transition-colors"
              >
                leetcode <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════
  //  DASHBOARD
  // ═════════════════════════════════
  if (!selectedUser) return null;

  const user = selectedUser;
  const score = (user.easy * 50) + (user.medium * 100) + (user.hard * 200);
  const maxEasy = 800, maxMed = 1700, maxHard = 700;
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const activeDays = user.weekDays.filter(Boolean).length;
  
  return (
    <div className="min-h-screen px-4 py-8 md:px-6 md:py-12">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <button
          onClick={backToLeaderboard}
          className="group flex items-center gap-1.5 text-[#6b6963] hover:text-[#e8e6e3] transition-colors mb-8"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-xs font-mono">back</span>
        </button>

        {/* Profile */}
        <div className="flex items-start gap-4 mb-10 md:mb-14">
          <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 ring-2 ring-[#2a2926] ring-offset-2 ring-offset-[#111110]">
            {user.img ? (
              <img src={user.img} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#2a2926] flex items-center justify-center text-[#6b6963] text-xl font-medium">
                {user.sname?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{user.sname}</h1>
            <p className="text-[#6b6963] text-sm mt-0.5">
              {user.solved} problems · {Math.round(score / 1000)}k points
            </p>
            {user.currentStreak > 0 && (
              <p className="text-[#e07a3a] text-xs font-mono mt-1.5">
                {user.currentStreak} day streak — {getMotivation(user.currentStreak)}
              </p>
            )}
          </div>
        </div>

        {/* Stats — not cards, just clean numbers */}
        <div className="grid grid-cols-4 gap-6 mb-12 md:mb-16">
          <div>
            <p className="text-2xl md:text-3xl font-bold tabular-nums">{user.currentStreak}</p>
            <p className="text-[#4a4740] text-[11px] font-mono mt-0.5">streak</p>
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-bold tabular-nums">{user.solved}</p>
            <p className="text-[#4a4740] text-[11px] font-mono mt-0.5">solved</p>
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-bold tabular-nums">{activeDays}<span className="text-[#4a4740] text-lg">/7</span></p>
            <p className="text-[#4a4740] text-[11px] font-mono mt-0.5">this week</p>
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-bold tabular-nums">{user.completion}<span className="text-[#4a4740] text-lg">%</span></p>
            <p className="text-[#4a4740] text-[11px] font-mono mt-0.5">complete</p>
          </div>
        </div>

        {/* This Week */}
        <section className="mb-12 md:mb-16">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-sm font-semibold">This week</h2>
            <span className="text-[11px] text-[#4a4740] font-mono">
              {activeDays === 7 ? 'perfect week 🎯' : 
               activeDays >= 5 ? 'strong week' : 
               activeDays >= 3 ? 'decent' : 
               activeDays > 0 ? 'warming up' : 'cmon now'}
            </span>
          </div>

          <div className="flex gap-2">
            {dayNames.map((day, i) => {
              const isToday = i === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
              const done = user.weekDays[i];

              return (
                <div key={i} className="flex-1 text-center">
                  <div className={`
                    aspect-square rounded-lg flex items-center justify-center text-xs font-medium
                    transition-colors relative
                    ${done 
                      ? 'bg-[#3db86a]/15 text-[#3db86a]' 
                      : 'bg-[#1a1917] text-[#2a2926]'}
                    ${isToday ? 'ring-1 ring-[#4a4740]' : ''}
                  `}>
                    {done ? '✓' : '·'}
                  </div>
                  <p className={`
                    text-[10px] mt-1.5 font-mono
                    ${isToday ? 'text-[#e8e6e3]' : 'text-[#3a3832]'}
                  `}>
                    {day}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Difficulty Breakdown */}
        <section className="mb-12 md:mb-16">
          <h2 className="text-sm font-semibold mb-5">By difficulty</h2>

          <div className="space-y-4">
            {/* Easy */}
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs text-[#6b6963]">Easy</span>
                <span className="text-xs font-mono tabular-nums">
                  <span className="text-[#3db86a] font-medium">{user.easy}</span>
                  <span className="text-[#3a3832]"> / {maxEasy}</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#1a1917] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#3db86a] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min((user.easy / maxEasy) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Medium */}
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs text-[#6b6963]">Medium</span>
                <span className="text-xs font-mono tabular-nums">
                  <span className="text-[#e07a3a] font-medium">{user.medium}</span>
                  <span className="text-[#3a3832]"> / {maxMed}</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#1a1917] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#e07a3a] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min((user.medium / maxMed) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Hard */}
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs text-[#6b6963]">Hard</span>
                <span className="text-xs font-mono tabular-nums">
                  <span className="text-[#e05a5a] font-medium">{user.hard}</span>
                  <span className="text-[#3a3832]"> / {maxHard}</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#1a1917] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#e05a5a] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min((user.hard / maxHard) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 8-day streak timeline */}
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-sm font-semibold">Last 8 days</h2>
            <span className="text-[11px] text-[#4a4740] font-mono">
              {user.streak.filter(s => s === 1).length}/8 active
            </span>
          </div>

          <div className="flex items-center gap-2">
            {user.streak.map((active, i) => (
              <div key={i} className="flex-1">
                <div className={`
                  h-8 rounded-md flex items-center justify-center
                  ${active ? 'bg-[#3db86a]/12' : 'bg-[#1a1917]'}
                `}>
                  <div className={`
                    w-2 h-2 rounded-full
                    ${active ? 'bg-[#3db86a]' : 'bg-[#2a2926]'}
                  `} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-6 border-t border-[#1a1917]">
          <div className="flex items-center justify-between text-[#3a3832] text-[10px] font-mono">
            <span>mentorship tracker · 2025</span>
            <a 
              href={`https://leetcode.com/u/${user.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-[#6b6963] transition-colors"
            >
              view on leetcode <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}