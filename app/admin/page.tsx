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
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLeaderboard } from '../context/LeaderboardContext';
import Navbar from '../components/Navbar';

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
  const [refreshing, setRefreshing] = useState(false);
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
        setFormError('Account not found on LeetCode. Please verify handle spelling.');
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

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    await refresh();
    setRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#F1EEE8] selection:bg-[#FF7417] selection:text-[#0B0B0B] font-sans antialiased relative">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[480px] pointer-events-none overflow-hidden -z-10">
        <div className="w-full h-full ambient-orange opacity-60" />
      </div>

      {/* Shared Masthead Navigation */}
      <Navbar />

      {/* ── Authentication Gate (When Not Authenticated) ── */}
      {!isAuthenticated ? (
        <main className="max-w-md mx-auto px-4 py-20 sm:py-28">
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="border border-white/10 bg-[#111111] p-6 sm:p-8 relative"
          >
            {/* Top orange highlight */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF7417] via-[#FF7417]/80 to-transparent" />

            <div className="border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-2 text-xs font-mono text-[#FF7417] font-bold uppercase mb-2">
                <Lock className="w-3.5 h-3.5 text-[#FF7417]" />
                <span>RESTRICTED ACCESS</span>
              </div>
              <h1 
                className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#F1EEE8]"
                style={{ fontFamily: 'var(--font-display), sans-serif' }}
              >
                MENTOR GATE
              </h1>
              <p className="text-xs font-mono text-[#AAA59D] mt-1.5 leading-relaxed">
                Enter administrative passkey to manage league membership and mentee roster records.
              </p>
            </div>

            {authError && (
              <div className="bg-[#0B0B0B] border-l-2 border-l-[#E45B55] border border-white/10 p-3 mb-5 text-xs font-mono text-[#E45B55] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>INCORRECT PASSKEY. ACCESS DENIED.</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label 
                  htmlFor="passkey" 
                  className="block text-xs uppercase tracking-wider text-[#AAA59D] mb-2 font-mono font-bold"
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
                  className="w-full bg-[#0B0B0B] border border-white/10 px-4 py-3 text-sm text-[#F1EEE8] placeholder-[#55524E] focus:outline-none focus:border-[#FF7417] transition-colors font-mono"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-[#FF7417] text-[#0B0B0B] py-3 text-xs font-mono font-bold uppercase tracking-wider hover:bg-[#FF7417]/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>AUTHENTICATE ROSTER</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        </main>
      ) : (
        /* ── Authenticated Admin Console ── */
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          
          {/* Editorial Hero */}
          <section className="border-b border-white/10 pb-8 mb-8 sm:mb-10">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#AAA59D] mb-4 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span className="text-[#FF7417] font-bold bg-[#FF7417]/10 px-2 py-0.5 border border-[#FF7417]/25">
                  OPERATIONAL CONTROL
                </span>
                <span className="text-white/20">/</span>
                <span className="text-[#39BB75] flex items-center gap-1.5 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#39BB75] inline-block animate-pulse" />
                  MONGODB CLUSTER CONNECTED
                </span>
              </div>

              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 text-xs text-[#AAA59D] hover:text-[#F1EEE8] px-2.5 py-1 border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#FF7417]' : ''}`} />
                <span>REFRESH CACHE</span>
              </button>
            </div>

            <h1 
              className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-[#F1EEE8] leading-[0.90] select-none"
              style={{ fontFamily: 'var(--font-display), sans-serif' }}
            >
              ROSTER<br />
              MANAGEMENT
            </h1>

            <p className="mt-4 text-xs sm:text-sm font-mono text-[#AAA59D] max-w-xl leading-relaxed">
              Manage league mentorship roster. Add or remove accounts; changes propagate immediately to 
              the public standings and weekly league cup.
            </p>
          </section>

          {/* Feedback Banners */}
          {formError && (
            <div className="bg-[#111111] border-l-4 border-l-[#E45B55] border border-white/10 p-4 mb-6 flex items-start gap-3 text-xs font-mono">
              <AlertCircle className="w-4 h-4 text-[#E45B55] shrink-0 mt-0.5" />
              <div>
                <span className="text-[#E45B55] font-bold block uppercase tracking-wide">OPERATION FAILED</span>
                <span className="text-[#F1EEE8] mt-0.5 block">{formError}</span>
              </div>
            </div>
          )}

          {formSuccess && (
            <div className="bg-[#111111] border-l-4 border-l-[#39BB75] border border-white/10 p-4 mb-6 flex items-start gap-3 text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 text-[#39BB75] shrink-0 mt-0.5" />
              <div>
                <span className="text-[#39BB75] font-bold block uppercase tracking-wide">OPERATION SUCCESS</span>
                <span className="text-[#F1EEE8] mt-0.5 block">{formSuccess}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            
            {/* ═══════════════════════════════════════════ */}
            {/* LEFT: Manual Enrollment Form               */}
            {/* ═══════════════════════════════════════════ */}
            <div className="lg:col-span-5 space-y-6">
              <div className="border border-white/10 bg-[#111111] p-5 sm:p-6">
                
                <div className="border-b border-white/10 pb-4 mb-5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF7417] block mb-1 font-bold">
                    ADMIN OVERRIDE
                  </span>
                  <h2 
                    className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#F1EEE8]"
                    style={{ fontFamily: 'var(--font-display), sans-serif' }}
                  >
                    ENROLL COMPETITOR
                  </h2>
                  <p className="text-xs font-mono text-[#AAA59D] mt-1.5 leading-relaxed">
                    Bypasses device binding. Enrolls the LeetCode handle directly into MongoDB.
                  </p>
                </div>

                <form onSubmit={handleAdd} className="space-y-4">
                  <div>
                    <label 
                      htmlFor="new-user" 
                      className="block text-xs uppercase tracking-wider text-[#AAA59D] mb-2 font-mono font-bold"
                    >
                      LEETCODE HANDLE
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77736D] font-mono text-sm">
                        @
                      </span>
                      <input 
                        id="new-user"
                        type="text" 
                        value={newUser}
                        onChange={e => setNewUser(e.target.value)}
                        placeholder="e.g. neetcode"
                        disabled={loading}
                        className="w-full bg-[#0B0B0B] border border-white/10 pl-8 pr-4 py-2.5 text-sm text-[#F1EEE8] placeholder-[#55524E] focus:outline-none focus:border-[#FF7417] transition-colors font-mono disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || !newUser.trim()}
                    className="w-full bg-[#FF7417] text-[#0B0B0B] py-2.5 text-xs font-mono font-bold uppercase tracking-wider hover:bg-[#FF7417]/90 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
              <div className="border border-white/10 bg-[#111111] p-5 text-xs font-mono space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#AAA59D] uppercase">ENROLLED COMPETITORS</span>
                  <span className="text-[#F1EEE8] font-bold text-base">{users.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#AAA59D] uppercase">DATABASE COLLECTION</span>
                  <span className="text-[#39BB75] font-semibold">TodoDB / MentorshipIDs</span>
                </div>
                <div className="pt-2 border-t border-white/10 text-[10px] text-[#77736D] leading-relaxed">
                  DELETING A COMPETITOR CLEARS THEIR ENROLLMENT RECORD AND PROFILE ROUTE INSTANTLY.
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════ */}
            {/* RIGHT: Active Mentees Table                 */}
            {/* ═══════════════════════════════════════════ */}
            <div className="lg:col-span-7">
              <div className="border border-white/10 bg-[#111111]">
                
                {/* Table Header Bar */}
                <div className="px-5 py-4 border-b border-white/10 bg-[#0B0B0B] flex items-center justify-between font-mono">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-[#FF7417]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F1EEE8]">
                      ACTIVE LEAGUE ROSTER
                    </span>
                  </div>
                  <span className="text-[10px] text-[#AAA59D]">
                    {users.length} ENROLLED
                  </span>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-white/5 font-mono">
                  {users.map((username, idx) => (
                    <div 
                      key={username} 
                      className="px-5 py-3.5 flex items-center justify-between hover:bg-[#151515] transition-colors group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="text-xs text-[#77736D] font-bold w-6 shrink-0">
                          {formatIndex(idx + 1)}
                        </span>
                        <div className="min-w-0">
                          <span className="text-sm font-semibold text-[#F1EEE8] group-hover:text-[#FF7417] transition-colors truncate block">
                            @{username}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <Link
                          href={`/u/${username}`}
                          className="text-[10px] uppercase text-[#AAA59D] hover:text-[#F1EEE8] flex items-center gap-1 transition-colors px-2.5 py-1 border border-white/10 hover:border-white/25"
                          title={`View profile /u/${username}`}
                        >
                          <span>VIEW</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>

                        <button 
                          onClick={() => handleDelete(username)}
                          disabled={loading}
                          className="text-[#77736D] hover:text-[#E45B55] p-1.5 transition-colors disabled:opacity-40 hover:bg-[#E45B55]/10 cursor-pointer"
                          title={`Permanently delete @${username}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {users.length === 0 && (
                    <div className="px-6 py-12 text-center text-xs text-[#77736D]">
                      NO COMPETITORS FOUND IN DATABASE.
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
