'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Cpu,
  Monitor,
  HardDrive,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getDeviceFingerprint, HardwareProfile } from '@/lib/fingerprint';
import Navbar from '../components/Navbar';

export default function UserRegistrationPortal() {
  const router = useRouter();

  const [deviceId, setDeviceId] = useState<string>('');
  const [hardwareInfo, setHardwareInfo] = useState<HardwareProfile | null>(null);

  const [loadingDevice, setLoadingDevice] = useState(true);
  const [registeredUser, setRegisteredUser] = useState<string | null>(null);

  // Form states
  const [usernameInput, setUsernameInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check device registration status
  const checkDeviceStatus = useCallback(async (currentDeviceId: string, hardware: HardwareProfile) => {
    try {
      const params = new URLSearchParams({
        deviceId: currentDeviceId,
        gpu: hardware.gpu,
        screen: hardware.screen,
        cores: String(hardware.cores),
        os: hardware.os
      });

      const res = await axios.get(`/api/users?${params.toString()}`);
      if (res.data?.registered && res.data?.user?.username) {
        const username = res.data.user.username;
        setRegisteredUser(username);
      } else {
        setRegisteredUser(null);
      }
    } catch (err) {
      console.error('Failed to query device status:', err);
    }
  }, []);

  // Initialize device fingerprint on mount
  useEffect(() => {
    async function initDevice() {
      try {
        setLoadingDevice(true);
        const { deviceId: hash, hardwareSummary } = await getDeviceFingerprint();
        setDeviceId(hash);
        setHardwareInfo(hardwareSummary);

        // Fetch current registration status using both hash and hardware signals
        await checkDeviceStatus(hash, hardwareSummary);
      } catch (err) {
        console.error('Device fingerprinting error:', err);
        setErrorMessage('Failed to detect device hardware signature. Please ensure scripts are enabled.');
      } finally {
        setLoadingDevice(false);
      }
    }

    initDevice();
  }, [checkDeviceStatus]);

  // Handle adding user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanUsername = usernameInput.trim();
    if (!cleanUsername) {
      setErrorMessage('Please enter a valid LeetCode username.');
      return;
    }

    if (registeredUser) {
      setErrorMessage(`This physical workstation is already bound to @${registeredUser}.`);
      return;
    }

    setSubmitting(true);

    try {
      // 1. Verify username on LeetCode API
      const [profileRes, solvedRes] = await Promise.all([
        axios.get(`https://kinkdin.onrender.com/${cleanUsername}`).catch(() => ({ data: { errors: true } })),
        axios.get(`https://kinkdin.onrender.com/${cleanUsername}/solved`).catch(() => ({ data: { errors: true } }))
      ]);

      if (profileRes.data?.errors || solvedRes.data?.errors) {
        setErrorMessage('LeetCode username not found. Please verify the handle exists on leetcode.com.');
        setSubmitting(false);
        return;
      }

      // 2. Register with deviceId and hardware profile in backend
      const res = await axios.post('/api/users', {
        username: cleanUsername,
        deviceId,
        hardware: hardwareInfo
      });

      if (res.data?.success) {
        setSuccessMessage(`Workstation bound successfully to @${cleanUsername}! Loading dossier...`);
        setTimeout(() => {
          router.push(`/u/${cleanUsername}`);
        }, 700);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setErrorMessage(err.response?.data?.error || 'Registration failed. Please check inputs and retry.');
      } else {
        setErrorMessage('An unexpected error occurred during device registration.');
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#F1EEE8] selection:bg-[#FF7417] selection:text-[#0B0B0B] font-sans antialiased relative">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[480px] pointer-events-none overflow-hidden -z-10">
        <div className="w-full h-full ambient-orange opacity-60" />
      </div>

      {/* Shared Masthead Navigation */}
      <Navbar />

      {/* ── Main Container ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
        
        {/* ── Editorial Hero ── */}
        <section className="border-b border-white/10 pb-8 mb-8 sm:mb-10">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#AAA59D] mb-4 uppercase tracking-wider">
            <span className="text-[#FF7417] font-bold bg-[#FF7417]/10 px-2 py-0.5 border border-[#FF7417]/25">
              WORKSTATION PROTOCOL
            </span>
            <span className="text-white/20">/</span>
            <span className="text-[#39BB75] flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#39BB75] inline-block animate-pulse" />
              HARDWARE SIGNATURE RECOGNITION
            </span>
          </div>

          <h1 
            className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-[#F1EEE8] leading-[0.90] select-none"
            style={{ fontFamily: 'var(--font-display), sans-serif' }}
          >
            WORKSTATION<br />
            IDENTITY
          </h1>

          <p className="mt-4 text-xs sm:text-sm font-mono text-[#AAA59D] max-w-2xl leading-relaxed">
            Link your LeetCode handle to this physical workstation. No passwords required: 
            your hardware fingerprint locks in your identity across normal, private, and cross-browser sessions.
          </p>
        </section>

        {/* ── Notification Banners ── */}
        {errorMessage && (
          <div className="bg-[#111111] border-l-4 border-l-[#E45B55] border border-white/10 p-4 mb-6 flex items-start gap-3 text-xs font-mono">
            <AlertCircle className="w-4 h-4 text-[#E45B55] shrink-0 mt-0.5" />
            <div>
              <span className="text-[#E45B55] font-bold block uppercase tracking-wide">AUTHENTICATION ERROR</span>
              <span className="text-[#F1EEE8] mt-0.5 block">{errorMessage}</span>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-[#111111] border-l-4 border-l-[#39BB75] border border-white/10 p-4 mb-6 flex items-start gap-3 text-xs font-mono">
            <CheckCircle2 className="w-4 h-4 text-[#39BB75] shrink-0 mt-0.5" />
            <div>
              <span className="text-[#39BB75] font-bold block uppercase tracking-wide">WORKSTATION LINKED</span>
              <span className="text-[#F1EEE8] mt-0.5 block">{successMessage}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* ═══════════════════════════════════════════ */}
          {/* LEFT: Hardware Fingerprint Diagnostics      */}
          {/* ═══════════════════════════════════════════ */}
          <div className="lg:col-span-5 space-y-6">
            <div className="border border-white/10 bg-[#111111] p-5 sm:p-6">
              
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 text-[10px] font-mono uppercase tracking-widest">
                <span className="text-[#AAA59D]">DIAGNOSTIC MATRIX</span>
                <span className="text-[#39BB75] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#39BB75] animate-pulse" />
                  AUTHENTICATED
                </span>
              </div>

              {/* Machine Hash Display */}
              <div className="bg-[#0B0B0B] p-3.5 border border-white/10 mb-4 font-mono">
                <span className="text-[9px] text-[#77736D] uppercase block mb-1">
                  PHYSICAL HARDWARE HASH (SHA-256)
                </span>
                <span className="text-xs text-[#FF7417] break-all font-bold block">
                  {loadingDevice ? 'CALCULATING HARDWARE MATRIX...' : (deviceId || 'NOT_DETECTED')}
                </span>
              </div>

              {/* Diagnostic Parameters */}
              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div className="flex items-center gap-2.5 text-[#AAA59D]">
                    <HardDrive className="w-3.5 h-3.5 text-[#77736D]" />
                    <span>OPERATING SYSTEM</span>
                  </div>
                  <span className="text-[#F1EEE8] font-bold">{hardwareInfo?.os || 'DETECTING...'}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div className="flex items-center gap-2.5 text-[#AAA59D]">
                    <Cpu className="w-3.5 h-3.5 text-[#77736D]" />
                    <span>LOGICAL CORES</span>
                  </div>
                  <span className="text-[#F1EEE8] font-bold">{hardwareInfo?.cores ? `${hardwareInfo.cores} CORES` : 'DETECTING...'}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div className="flex items-center gap-2.5 text-[#AAA59D]">
                    <Monitor className="w-3.5 h-3.5 text-[#77736D]" />
                    <span>RESOLUTION</span>
                  </div>
                  <span className="text-[#F1EEE8] font-bold">{hardwareInfo?.screen?.split('x')?.slice(0, 2)?.join('×') || 'DETECTING...'}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2.5 text-[#AAA59D]">
                    <Globe className="w-3.5 h-3.5 text-[#77736D]" />
                    <span>GPU RENDERER</span>
                  </div>
                  <span className="text-[#F1EEE8] font-bold truncate max-w-[150px]" title={hardwareInfo?.gpu}>
                    {hardwareInfo?.gpu?.replace(/ANGLE \(|Direct3D11|\)/g, '')?.trim() || 'DETECTING...'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-white/10 text-[10px] font-mono text-[#77736D]">
                PERSISTS ACROSS CHROME, BRAVE, EDGE, FIREFOX & PRIVATE TABS.
              </div>
            </div>

            {/* Protocol Rules */}
            <div className="border border-white/10 bg-[#111111] p-5 text-xs font-mono text-[#AAA59D] space-y-2.5">
              <span className="text-[#F1EEE8] font-bold block uppercase text-[11px]">
                WORKSTATION BINDING RULES
              </span>
              <p className="text-[11px] leading-relaxed">
                1. One LeetCode handle is bound per physical device.
              </p>
              <p className="text-[11px] leading-relaxed">
                2. Rankings, streaks, and solve metrics sync automatically in the background.
              </p>
              <p className="text-[11px] leading-relaxed">
                3. To change accounts, unbind this device from your profile dossier.
              </p>
            </div>
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* RIGHT: Registration Form or Bound Pass      */}
          {/* ═══════════════════════════════════════════ */}
          <div className="lg:col-span-7">
            {loadingDevice ? (
              <div className="border border-white/10 bg-[#111111] p-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF7417] mx-auto mb-3" />
                <p className="text-xs uppercase font-mono text-[#AAA59D]">
                  READING HARDWARE SIGNATURE...
                </p>
              </div>
            ) : registeredUser ? (
              /* ALREADY BOUND STATE */
              <motion.div 
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="border border-[#FF7417]/50 bg-[#141210] p-6 sm:p-8 space-y-6 relative"
              >
                {/* Top highlight */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF7417] via-[#FF7417]/80 to-transparent" />

                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#39BB75] font-bold uppercase mb-2">
                    <ShieldCheck className="w-4 h-4 text-[#39BB75]" />
                    <span>WORKSTATION PASS ACTIVE</span>
                  </div>
                  <h2 
                    className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-[#F1EEE8]"
                    style={{ fontFamily: 'var(--font-display), sans-serif' }}
                  >
                    @{registeredUser}
                  </h2>
                  <p className="text-xs font-mono text-[#AAA59D] mt-1.5">
                    This physical machine is actively bound to this LeetCode profile.
                  </p>
                </div>

                {/* Quick Action Navigation Grid */}
                <div className="space-y-3 pt-2 font-mono text-xs">
                  <Link
                    href={`/u/${registeredUser}`}
                    className="flex items-center justify-between bg-[#FF7417] text-[#0B0B0B] p-4 font-bold text-xs uppercase hover:bg-[#FF7417]/90 transition-colors group"
                  >
                    <span>OPEN YOUR PROFILE DOSSIER (/u/{registeredUser})</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>

                  <Link
                    href="/weekly-leaders"
                    className="flex items-center justify-between border border-white/10 bg-[#111111] text-[#F1EEE8] p-3.5 uppercase hover:bg-[#191919] transition-colors"
                  >
                    <span>VIEW LIVE WEEKLY CUP</span>
                    <ArrowUpRight className="w-4 h-4 text-[#77736D]" />
                  </Link>

                  <Link
                    href="/"
                    className="flex items-center justify-between border border-white/10 bg-[#111111] text-[#AAA59D] hover:text-[#F1EEE8] p-3.5 uppercase hover:bg-[#191919] transition-colors"
                  >
                    <span>VIEW ALL-TIME OVERALL STANDINGS</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="pt-4 border-t border-white/10 text-[10px] font-mono text-[#77736D]">
                  WANT TO UNLINK OR CHANGE YOUR ID? OPEN YOUR DOSSIER AT{' '}
                  <Link href={`/u/${registeredUser}`} className="text-[#FF7417] hover:underline font-bold">
                    /u/{registeredUser}
                  </Link>{' '}
                  AND CLICK &ldquo;UNLINK LEETCODE ID FROM THIS DEVICE&rdquo;.
                </div>
              </motion.div>
            ) : (
              /* REGISTRATION FORM STATE */
              <motion.div 
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="border border-white/10 bg-[#111111] p-6 sm:p-8"
              >
                <div className="border-b border-white/10 pb-4 mb-6">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF7417] block mb-1 font-bold">
                    ENROLLMENT STEP 01
                  </span>
                  <h2 
                    className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#F1EEE8]"
                    style={{ fontFamily: 'var(--font-display), sans-serif' }}
                  >
                    LINK LEETCODE ACCOUNT
                  </h2>
                  <p className="text-xs font-mono text-[#AAA59D] mt-1.5">
                    Enter your public LeetCode handle. We verify your profile and solve history live with LeetCode.
                  </p>
                </div>

                <form onSubmit={handleAddUser} className="space-y-5">
                  <div>
                    <label 
                      htmlFor="username" 
                      className="block text-xs uppercase tracking-wider text-[#AAA59D] mb-2 font-mono font-bold"
                    >
                      LEETCODE HANDLE
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77736D] font-mono text-sm">
                        @
                      </span>
                      <input
                        id="username"
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        placeholder="e.g. neetcode"
                        disabled={submitting}
                        autoFocus
                        className="w-full bg-[#0B0B0B] border border-white/10 pl-8 pr-4 py-3 text-sm text-[#F1EEE8] placeholder-[#55524E] focus:outline-none focus:border-[#FF7417] transition-colors disabled:opacity-50 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !usernameInput.trim()}
                    className="w-full bg-[#FF7417] text-[#0B0B0B] py-3.5 text-xs font-mono font-bold uppercase tracking-wider hover:bg-[#FF7417]/90 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>VERIFYING PROFILE ON LEETCODE...</span>
                      </>
                    ) : (
                      <>
                        <span>BIND WORKSTATION & ENTER LEAGUE</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-white/10 text-[11px] font-mono text-[#77736D] space-y-1.5">
                  <p>· Profile generated instantly at <span className="text-[#F1EEE8]">/u/{usernameInput || 'username'}</span>.</p>
                  <p>· Immediate inclusion in Weekly Cup and Overall Leaderboard.</p>
                  <p>· Verified live with LeetCode GraphQL API.</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
