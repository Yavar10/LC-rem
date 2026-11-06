'use client';

import { useMemo } from 'react';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useLeaderboard } from './context/LeaderboardContext';

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

function getRankLabel(index: number): string {
  if (index === 0) return '1st';
  if (index === 1) return '2nd';
  if (index === 2) return '3rd';
  return `${index + 1}th`;
}

// ─────────────────────────────────────
// Main App / Leaderboard
// ─────────────────────────────────────

export default function App() {
  const { users, sortedUsers, loading } = useLeaderboard();

  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  return (
    <div className="min-h-screen px-4 py-8 md:px-6 md:py-12">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <header className="mb-10 md:mb-14">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#6b6963] text-xs font-mono tracking-wide">
              {todayStr} · {getTimeOfDayGreeting()}
            </p>
            <div className="flex items-center gap-2">
              <Link 
                href="/weekly-leaders" 
                className="text-xs font-mono text-[#FF7417] hover:text-[#FF7417]/80 bg-[#FF7417]/10 hover:bg-[#FF7417]/15 px-2.5 py-1 rounded-md border border-[#FF7417]/25 transition-all flex items-center gap-1.5"
              >
                <span>Weekly Leaders</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
              <Link 
                href="/user" 
                className="text-xs font-mono text-[#e07a3a] hover:text-[#e07a3a]/80 bg-[#e07a3a]/10 hover:bg-[#e07a3a]/15 px-2.5 py-1 rounded-md border border-[#e07a3a]/20 transition-all flex items-center gap-1.5"
              >
                <span>My ID</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
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
            const score = user.score;

            return (
              <Link
                key={user.name}
                href={`/u/${user.name}`}
                className={`
                  block w-full text-left group relative
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
                        className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-[#3db86a]' : 'bg-[#2a2926]'}`}
                      />
                    ))}
                  </div>

                  {/* Arrow */}
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#2a2926] group-hover:text-[#6b6963] transition-colors shrink-0" />
                </div>
              </Link>
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
