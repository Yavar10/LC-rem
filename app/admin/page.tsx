'use client';

import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { 
  ArrowUpRight, 
  Trash2, 
  Plus, 
  ShieldAlert, 
  Loader2, 
  Lock, 
  Users, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import Link from 'next/link';
import { useLeaderboard } from '../context/LeaderboardContext';

function formatIndex(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

export default function AdminPanel() {
  const { refresh } = useLeaderboard();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);

  const [users, setUsers] = useState<string[]>([]);
  const [newUser, setNewUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get('/api/users');
      setUsers(res.data.usernames || []);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'loogied') {
      setIsAuthenticated(true);
      setAuthError(false);
      fetchUsers();
    } else {
      setAuthError(true);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const cleanUser = newUser.trim();
    if (!cleanUser) return;
    setLoading(true);
    
    // Verify valid LeetCode account before enrolling
    try {
      const [profileRes, solvedRes] = await Promise.all([
        axios.get(`https://kinkdin.onrender.com/${cleanUser}`).catch(() => ({ data: { errors: true } })),
        axios.get(`https://kinkdin.onrender.com/${cleanUser}/solved`).catch(() => ({ data: { errors: true } }))
      ]);

      if (profileRes.data?.errors || solvedRes.data?.errors) {
        setFormError('Account not found on LeetCode. Please check spelling.');
        setLoading(false);
        return;
      }

      const res = await axios.post('/api/users', { username: cleanUser });
      if (res.data?.success) {
        setFormSuccess(`Successfully enrolled @${cleanUser} into the league!`);
        setNewUser('');
        await fetchUsers();
        await refresh();
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setFormError(err.response?.data?.error || 'Error enrolling user into database.');
      } else {
        setFormError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (username: string) => {
    if (!confirm(`Are you sure you want to permanently remove @${username} from the roster?`)) return;
    setLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      await axios.delete(`/api/users?username=${username}`);
      setFormSuccess(`Removed @${username} from roster.`);
      await fetchUsers();
      await refresh();
    } catch {
      setFormError(`Failed to remove @${username}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#101010] text-[#F2EEE6] selection:bg-[#FF7417] selection:text-[#101010] font-sans antialiased">
      
      {/* ── Compact Swiss Header ── */}
      <header className="border-b border-[#303030] bg-[#101010]/95 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-13 flex items-center justify-between">
          
          {/* Logo & Section Identification */}
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
              ADMIN CONSOLE
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
              OVERALL STANDINGS
            </Link>
            <Link 
              href="/weekly-leaders" 
              className="text-[#88847E] hover:text-[#F2EEE6] transition-colors"
            >
              WEEKLY LEADERS
            </Link>
            <div className="flex items-center gap-1 text-[#FF7417] font-semibold border-b border-[#FF7417] pb-0.5">
              <span>ADMIN</span>
            </div>
          </nav>
        </div>
      </header>

      {/* ── Authentication Gate (When Not Authenticated) ── */}
      {!isAuthenticated ? (
        <main className="max-w-md mx-auto px-4 py-20 sm:py-28">
          <div className="border border-[#303030] bg-[#191919] p-6 sm:p-8">
            
            <div className="border-b border-[#303030] pb-4 mb-6">
              <div 
                className="flex items-center gap-2 text-xs text-[#FF7417] font-bold uppercase mb-2"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>RESTRICTED ACCESS</span>
              </div>
              <h1 
                className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#F2EEE6]"
                style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
              >
                MENTOR GATE
              </h1>
              <p 
                className="text-xs text-[#88847E] mt-1"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                Enter administrative passkey to manage mentees and roster membership.
              </p>
            </div>

            {authError && (
              <div 
                className="bg-[#101010] border-l-2 border-l-[#E05A5A] border border-[#303030] p-3 mb-5 text-xs text-[#E05A5A] flex items-center gap-2"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>INCORRECT PASSKEY. ACCESS DENIED.</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label 
                  htmlFor="passkey" 
                  className="block text-xs uppercase tracking-wider text-[#88847E] mb-2 font-semibold"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  ADMINISTRATIVE PASSKEY
                </label>
                <input 
                  id="passkey"
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter mentor password..."
                  autoFocus
                  className="w-full bg-[#101010] border border-[#303030] px-4 py-3 text-sm text-[#F2EEE6] placeholder-[#555555] focus:outline-none focus:border-[#FF7417] transition-colors font-mono"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-[#FF7417] text-[#101010] py-3 text-xs font-black uppercase tracking-wider hover:bg-[#FF7417]/90 transition-all flex items-center justify-center gap-2"
                style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
              >
                <span>AUTHENTICATE ROSTER</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </main>
      ) : (
        /* ── Authenticated Admin Console ── */
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          
          {/* Editorial Hero */}
          <section className="border-b border-[#303030] pb-6 sm:pb-8 mb-8">
            <div 
              className="flex flex-wrap items-center gap-2 text-xs text-[#88847E] mb-3 uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              <span className="text-[#FF7417] font-bold">
                OPERATIONAL ACCESS LEVEL
              </span>
              <span>·</span>
              <span>DIRECT MONGODB PROPAGATION</span>
              <span>·</span>
              <span className="text-[#39B96F] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#39B96F]" /> ROSTER LIVE
              </span>
            </div>

            <h1 
              className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-[#F2EEE6] leading-[0.92]"
              style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
            >
              ADMIN<br />
              CONSOLE
            </h1>

            <p 
              className="mt-4 text-xs sm:text-sm text-[#88847E] max-w-xl leading-relaxed"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              Manage mentorship roster. Add or remove accounts; changes propagate immediately to 
              the public standings and weekly league cup.
            </p>
          </section>

          {/* Feedback Banners */}
          {formError && (
            <div 
              className="bg-[#191919] border-l-4 border-l-[#E05A5A] border border-[#303030] p-4 mb-6 flex items-start gap-3 text-xs"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              <AlertCircle className="w-4 h-4 text-[#E05A5A] shrink-0 mt-0.5" />
              <div>
                <span className="text-[#E05A5A] font-bold block uppercase tracking-wide">OPERATION FAILED</span>
                <span className="text-[#F2EEE6] mt-0.5 block">{formError}</span>
              </div>
            </div>
          )}

          {formSuccess && (
            <div 
              className="bg-[#191919] border-l-4 border-l-[#39B96F] border border-[#303030] p-4 mb-6 flex items-start gap-3 text-xs"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              <CheckCircle2 className="w-4 h-4 text-[#39B96F] shrink-0 mt-0.5" />
              <div>
                <span className="text-[#39B96F] font-bold block uppercase tracking-wide">SUCCESS</span>
                <span className="text-[#F2EEE6] mt-0.5 block">{formSuccess}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* ═══════════════════════════════════════════ */}
            {/* LEFT: Manual Enrollment Form */}
            {/* ═══════════════════════════════════════════ */}
            <div className="md:col-span-5 space-y-6">
              <div className="border border-[#303030] bg-[#191919] p-5 sm:p-6">
                
                <div className="border-b border-[#303030] pb-3 mb-5">
                  <span 
                    className="text-[10px] uppercase tracking-widest text-[#FF7417] block mb-1 font-semibold"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    MANUAL OVERRIDE
                  </span>
                  <h2 
                    className="text-lg font-bold uppercase tracking-tight text-[#F2EEE6]"
                    style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                  >
                    ENROLL MENTEE
                  </h2>
                  <p 
                    className="text-xs text-[#88847E] mt-1"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    Bypasses device binding. Enrolls the LeetCode ID directly into MongoDB.
                  </p>
                </div>

                <form onSubmit={handleAdd} className="space-y-4">
                  <div>
                    <label 
                      htmlFor="new-user" 
                      className="block text-xs uppercase tracking-wider text-[#88847E] mb-2 font-semibold"
                      style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                    >
                      LEETCODE HANDLE
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555555] font-mono text-sm">
                        @
                      </span>
                      <input 
                        id="new-user"
                        type="text" 
                        value={newUser}
                        onChange={e => setNewUser(e.target.value)}
                        placeholder="e.g. tourist"
                        disabled={loading}
                        className="w-full bg-[#101010] border border-[#303030] pl-8 pr-4 py-2.5 text-sm text-[#F2EEE6] placeholder-[#555555] focus:outline-none focus:border-[#FF7417] transition-colors font-mono disabled:opacity-50"
                        style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || !newUser.trim()}
                    className="w-full bg-[#FF7417] text-[#101010] py-2.5 text-xs font-black uppercase tracking-wider hover:bg-[#FF7417]/90 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>VALIDATING LEETCODE...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>ENROLL INTO ROSTER</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Roster Summary Card */}
              <div 
                className="border border-[#303030] bg-[#141414] p-4 text-xs space-y-2.5"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[#88847E] uppercase">TOTAL ENROLLED MENTEES</span>
                  <span className="text-[#F2EEE6] font-bold text-sm">{users.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#88847E] uppercase">DATABASE CLUSTER</span>
                  <span className="text-[#39B96F] font-semibold">TodoDB / MentorshipIDs</span>
                </div>
                <div className="pt-2 border-t border-[#222222] text-[10px] text-[#88847E]">
                  DELETING A MENTEE CLEARS THEIR DEVICE BINDING RECORD AND PROFILE ROUTE.
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════ */}
            {/* RIGHT: Active Mentees Table */}
            {/* ═══════════════════════════════════════════ */}
            <div className="md:col-span-7">
              <div className="border border-[#303030] bg-[#191919]">
                
                {/* Table Header Bar */}
                <div 
                  className="px-5 py-3.5 border-b border-[#303030] bg-[#141414] flex items-center justify-between"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-[#FF7417]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F2EEE6]">
                      ACTIVE LEAGUE ROSTER
                    </span>
                  </div>
                  <span className="text-[10px] text-[#88847E]">
                    {users.length} TOTAL
                  </span>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-[#222222]">
                  {users.map((username, idx) => (
                    <div 
                      key={username} 
                      className="px-5 py-3 flex items-center justify-between hover:bg-[#161616] transition-colors group"
                      style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs text-[#555555] font-semibold w-6 shrink-0">
                          {formatIndex(idx + 1)}
                        </span>
                        <div className="min-w-0">
                          <span className="text-sm font-semibold text-[#F2EEE6] group-hover:text-[#FF7417] transition-colors truncate block">
                            @{username}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <Link
                          href={`/u/${username}`}
                          className="text-[10px] uppercase text-[#88847E] hover:text-[#F2EEE6] flex items-center gap-1 transition-colors px-2 py-1 border border-[#303030] hover:border-[#88847E]"
                          title={`View profile /u/${username}`}
                        >
                          <span>VIEW</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>

                        <button 
                          onClick={() => handleDelete(username)}
                          disabled={loading}
                          className="text-[#88847E] hover:text-[#E05A5A] p-1.5 transition-colors disabled:opacity-40 hover:bg-[#E05A5A]/10"
                          title={`Permanently delete @${username}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {users.length === 0 && (
                    <div 
                      className="px-6 py-12 text-center text-xs text-[#88847E]"
                      style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                    >
                      NO MENTEES FOUND IN DATABASE.
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </main>
      )}
    </div>
  );
}
