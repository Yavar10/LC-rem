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
      const [profileRes, solvedRes] = await Promise.all([
        axios.get(`https://kinkdin.onrender.com/${cleanUsername}`).catch(() => ({ data: { errors: true } })),
        axios.get(`https://kinkdin.onrender.com/${cleanUsername}/solved`).catch(() => ({ data: { errors: true } }))
      ]);

      if (profileRes.data?.errors || solvedRes.data?.errors) {
        setErrorMessage('LeetCode username not found. Please verify the handle exists on leetcode.com.');
        setSubmitting(false);
        return;
      }

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
    <div className="min-h-screen bg-black text-[#F1EEE8] selection:bg-[var(--accent)] selection:text-black font-sans antialiased relative">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[480px] pointer-events-none overflow-hidden -z-10">
        <div className="w-full h-full ambient-orange opacity-70" />
      </div>

      {/* Shared Masthead Navigation */}
      <Navbar />

      {/* ── Architectural Hero ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-6 border-b border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#AAA59D] mb-3 uppercase tracking-wider">
          <span className="text-[#FF7417] font-bold bg-[#FF7417]/10 px-2 py-0.5 border border-[#FF7417]/25">
            Workstation Protocol
          </span>
          <span className="text-white/20">/</span>
          <span className="text-[#39BB75] flex items-center gap-1.5 font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#39BB75] inline-block animate-pulse" />
            Hardware Signature Recognition
          </span>
        </div>

        <h1 
          className="text-[12vw] sm:text-[10vw] lg:text-[7.8rem] xl:text-[9.2rem] font-black uppercase tracking-tight text-[#F1EEE8] leading-[0.80] select-none my-2 -ml-0.5 sm:-ml-1"
          style={{ fontFamily: 'var(--font-display), sans-serif' }}
        >
          LINK WORKSTATION
        </h1>

        <p className="mt-4 text-xs sm:text-sm text-[#AAA59D] max-w-2xl leading-relaxed">
          Link your LeetCode handle to this physical machine. Zero passwords required: your hardware fingerprint 
          locks in your identity across normal, private, and cross-browser sessions.
        </p>
      </section>

      {/* ── Main Fluid Body ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Notification Banners */}
        {errorMessage && (
          <div className="border-l-2 border-l-[#E45B55] bg-[#141414] p-4 mb-6 flex items-start gap-3 text-xs font-mono">
            <AlertCircle className="w-4 h-4 text-[#E45B55] shrink-0 mt-0.5" />
            <div>
              <span className="text-[#E45B55] font-bold block uppercase tracking-wide">Authentication Error</span>
              <span className="text-[#F1EEE8] mt-0.5 block">{errorMessage}</span>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="border-l-2 border-l-[#39BB75] bg-[#141414] p-4 mb-6 flex items-start gap-3 text-xs font-mono">
            <CheckCircle2 className="w-4 h-4 text-[#39BB75] shrink-0 mt-0.5" />
            <div>
              <span className="text-[#39BB75] font-bold block uppercase tracking-wide">Workstation Linked</span>
              <span className="text-[#F1EEE8] mt-0.5 block">{successMessage}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* ═══════════════════════════════════════════ */}
          {/* LEFT: Hardware Diagnostic Matrix            */}
          {/* ═══════════════════════════════════════════ */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 text-xs">
                <span className="text-[#AAA59D] font-medium">Diagnostic Matrix</span>
                <span className="text-[#39BB75] font-mono text-[11px] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#39BB75] animate-pulse" />
                  Online
                </span>
              </div>

              {/* Machine Hash Display */}
              <div className="py-2">
                <span className="text-[10px] text-[#77736D] uppercase font-mono block mb-1">
                  Physical Hardware Hash (SHA-256)
                </span>
                <span className="text-xs text-[#FF7417] break-all font-mono font-bold block">
                  {loadingDevice ? 'Calculating hardware matrix...' : (deviceId || 'NOT_DETECTED')}
                </span>
              </div>

              {/* Diagnostic Parameters */}
              <div className="space-y-2.5 text-xs font-mono border-t border-white/[0.06] pt-3">
                <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2 text-[#AAA59D]">
                    <HardDrive className="w-3.5 h-3.5 text-[#77736D]" />
                    <span>Operating System</span>
                  </div>
                  <span className="text-[#F1EEE8] font-bold">{hardwareInfo?.os || 'Detecting...'}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2 text-[#AAA59D]">
                    <Cpu className="w-3.5 h-3.5 text-[#77736D]" />
                    <span>Logical CPU Cores</span>
                  </div>
                  <span className="text-[#F1EEE8] font-bold">{hardwareInfo?.cores ? `${hardwareInfo.cores} Cores` : 'Detecting...'}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2 text-[#AAA59D]">
                    <Monitor className="w-3.5 h-3.5 text-[#77736D]" />
                    <span>Screen Resolution</span>
                  </div>
                  <span className="text-[#F1EEE8] font-bold">{hardwareInfo?.screen?.split('x')?.slice(0, 2)?.join('×') || 'Detecting...'}</span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2 text-[#AAA59D]">
                    <Globe className="w-3.5 h-3.5 text-[#77736D]" />
                    <span>GPU Chipset</span>
                  </div>
                  <span className="text-[#F1EEE8] font-bold truncate max-w-[170px]" title={hardwareInfo?.gpu}>
                    {hardwareInfo?.gpu?.replace(/ANGLE \(|Direct3D11|\)/g, '')?.trim() || 'Detecting...'}
                  </span>
                </div>
              </div>
            </div>

            {/* Protocol Rules */}
            <div className="border-t border-white/[0.08] pt-4 text-xs text-[#77736D] space-y-2">
              <span className="text-[#AAA59D] font-bold block uppercase text-[11px]">
                Workstation Guidelines
              </span>
              <p className="leading-relaxed">1. One LeetCode account is bound per machine.</p>
              <p className="leading-relaxed">2. Scores and weekly ranks sync automatically from LeetCode.</p>
              <p className="leading-relaxed">3. To unbind or switch accounts, use the controls on your profile dossier.</p>
            </div>
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* RIGHT: Pass or Registration Input          */}
          {/* ═══════════════════════════════════════════ */}
          <div className="lg:col-span-7">
            {loadingDevice ? (
              <div className="py-16 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF7417] mx-auto mb-3" />
                <p className="text-xs uppercase font-mono text-[#AAA59D]">
                  Reading hardware matrix...
                </p>
              </div>
            ) : registeredUser ? (
              /* ALREADY BOUND PASS (Liquid Glass) */
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="floating-glass p-6 sm:p-8 space-y-6 relative border border-white/[0.12]"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#39BB75] font-bold uppercase mb-2">
                    <ShieldCheck className="w-4 h-4 text-[#39BB75]" />
                    <span>Active Workstation Pass</span>
                  </div>
                  <h2 
                    className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-[#F1EEE8]"
                    style={{ fontFamily: 'var(--font-display), sans-serif' }}
                  >
                    @{registeredUser}
                  </h2>
                  <p className="text-xs text-[#AAA59D] mt-1.5">
                    This physical workstation is bound to this LeetCode profile.
                  </p>
                </div>

                {/* Quick Action Navigation Grid */}
                <div className="space-y-3 pt-2 text-xs">
                  <Link
                    href={`/u/${registeredUser}`}
                    className="flex items-center justify-between bg-[#FF7417] text-black p-4 font-bold text-xs uppercase hover:bg-[#FF7417]/90 transition-colors group"
                  >
                    <span>Open Your Profile Dossier (/u/{registeredUser})</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>

                  <Link
                    href="/weekly-leaders"
                    className="flex items-center justify-between border border-white/[0.08] bg-white/[0.02] text-[#F1EEE8] p-3.5 hover:bg-white/[0.05] transition-colors"
                  >
                    <span>View Live Weekly Cup</span>
                    <ArrowUpRight className="w-4 h-4 text-[#77736D]" />
                  </Link>

                  <Link
                    href="/"
                    className="flex items-center justify-between border border-white/[0.08] bg-white/[0.02] text-[#AAA59D] hover:text-[#F1EEE8] p-3.5 hover:bg-white/[0.05] transition-colors"
                  >
                    <span>View Overall Standings</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="pt-4 border-t border-white/[0.08] text-[11px] text-[#77736D]">
                  To change or unbind this device, visit{' '}
                  <Link href={`/u/${registeredUser}`} className="text-[#FF7417] hover:underline font-semibold">
                    /u/{registeredUser}
                  </Link>{' '}
                  and select &ldquo;Unlink this workstation&rdquo;.
                </div>
              </motion.div>
            ) : (
              /* REGISTRATION FORM (Open & Focused) */
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="floating-glass p-6 sm:p-8 border border-white/[0.12]"
              >
                <div className="border-b border-white/[0.08] pb-4 mb-6">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF7417] block mb-1 font-bold">
                    Enrollment
                  </span>
                  <h2 
                    className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#F1EEE8]"
                    style={{ fontFamily: 'var(--font-display), sans-serif' }}
                  >
                    Link LeetCode Account
                  </h2>
                  <p className="text-xs text-[#AAA59D] mt-1.5 leading-relaxed">
                    Enter your public LeetCode handle. We verify your profile and solve history live with LeetCode.
                  </p>
                </div>

                <form onSubmit={handleAddUser} className="space-y-5">
                  <div>
                    <label 
                      htmlFor="username" 
                      className="block text-xs uppercase tracking-wider text-[#AAA59D] mb-2 font-mono font-bold"
                    >
                      LeetCode Handle
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
                        className="w-full bg-black border border-white/[0.12] pl-8 pr-4 py-3 text-sm text-[#F1EEE8] placeholder-[#55524E] focus:outline-none focus:border-[#FF7417] transition-colors disabled:opacity-50 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !usernameInput.trim()}
                    className="w-full bg-[#FF7417] text-black py-3.5 text-xs font-mono font-bold uppercase tracking-wider hover:bg-[#FF7417]/90 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying LeetCode Handle...</span>
                      </>
                    ) : (
                      <>
                        <span>Bind Workstation & Enter League</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-white/[0.08] text-xs text-[#77736D] space-y-1">
                  <p>· Profile generated instantly at <span className="text-[#F1EEE8]">/u/{usernameInput || 'username'}</span>.</p>
                  <p>· Immediate inclusion in Weekly Cup and Overall Standings.</p>
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
