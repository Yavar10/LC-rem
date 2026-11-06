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
import { getDeviceFingerprint, HardwareProfile } from '@/lib/fingerprint';

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
        setSuccessMessage(`Device bound successfully to @${cleanUsername}! Opening profile...`);
        setTimeout(() => {
          router.push(`/u/${cleanUsername}`);
        }, 800);
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
              DEVICE BINDING
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
              <span>MY ID</span>
            </div>
          </nav>
        </div>
      </header>

      {/* ── Main Container: Two-Column Swiss Grid ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
        
        {/* ── Editorial Page Hero ── */}
        <section className="border-b border-[#303030] pb-6 sm:pb-8 mb-8">
          <div 
            className="flex flex-wrap items-center gap-2 text-xs text-[#88847E] mb-3 uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            <span className="text-[#FF7417] font-bold">
              PROTOCOL LEVEL 01
            </span>
            <span>·</span>
            <span>HARDWARE-AUTHENTICATED ACCESS</span>
            <span>·</span>
            <span className="text-[#39B96F] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#39B96F]" /> PERSISTENT BINDING
            </span>
          </div>

          <h1 
            className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-[#F2EEE6] leading-[0.92]"
            style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
          >
            LINK YOUR<br />
            LEETCODE ID
          </h1>

          <p 
            className="mt-4 text-xs sm:text-sm text-[#88847E] max-w-xl leading-relaxed"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            Connect your LeetCode handle to this physical workstation. No login required: 
            your hardware fingerprint locks in your identity across normal, private, and cross-browser sessions.
          </p>
        </section>

        {/* ── Notification Banners ── */}
        {errorMessage && (
          <div 
            className="bg-[#191919] border-l-4 border-l-[#E05A5A] border border-[#303030] p-4 mb-6 flex items-start gap-3 text-xs"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            <AlertCircle className="w-4 h-4 text-[#E05A5A] shrink-0 mt-0.5" />
            <div>
              <span className="text-[#E05A5A] font-bold block uppercase tracking-wide">REGISTRATION ERROR</span>
              <span className="text-[#F2EEE6] mt-0.5 block">{errorMessage}</span>
            </div>
          </div>
        )}

        {successMessage && (
          <div 
            className="bg-[#191919] border-l-4 border-l-[#39B96F] border border-[#303030] p-4 mb-6 flex items-start gap-3 text-xs"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            <CheckCircle2 className="w-4 h-4 text-[#39B96F] shrink-0 mt-0.5" />
            <div>
              <span className="text-[#39B96F] font-bold block uppercase tracking-wide">AUTHENTICATION SUCCESS</span>
              <span className="text-[#F2EEE6] mt-0.5 block">{successMessage}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* ═══════════════════════════════════════════ */}
          {/* LEFT: Hardware Fingerprint Diagnostics */}
          {/* ═══════════════════════════════════════════ */}
          <div className="md:col-span-5 space-y-5">
            <div className="border border-[#303030] bg-[#191919] p-4 sm:p-5">
              
              <div 
                className="flex items-center justify-between border-b border-[#303030] pb-2.5 mb-3.5 text-[10px] uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <span className="text-[#88847E]">HARDWARE DIAGNOSTIC</span>
                <span className="text-[#39B96F] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#39B96F] animate-pulse" /> ONLINE
                </span>
              </div>

              {/* Machine Hash Display */}
              <div className="bg-[#101010] p-3 border border-[#303030] mb-4">
                <span 
                  className="text-[9px] text-[#88847E] uppercase block mb-1"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  PHYSICAL DEVICE HASH
                </span>
                <span 
                  className="text-xs text-[#FF7417] font-mono break-all font-semibold block"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  {loadingDevice ? 'GENERATING HARDWARE MATRIX...' : (deviceId || 'NOT_DETECTED')}
                </span>
              </div>

              {/* Diagnostic Parameters */}
              <div 
                className="space-y-2 text-xs"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <div className="flex items-center justify-between py-1.5 border-b border-[#222222]">
                  <div className="flex items-center gap-2 text-[#88847E]">
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>OPERATING SYSTEM</span>
                  </div>
                  <span className="text-[#F2EEE6] font-semibold">{hardwareInfo?.os || 'DETECTING...'}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-[#222222]">
                  <div className="flex items-center gap-2 text-[#88847E]">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>LOGICAL CORES</span>
                  </div>
                  <span className="text-[#F2EEE6] font-semibold">{hardwareInfo?.cores ? `${hardwareInfo.cores} CORES` : 'DETECTING...'}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-[#222222]">
                  <div className="flex items-center gap-2 text-[#88847E]">
                    <Monitor className="w-3.5 h-3.5" />
                    <span>SCREEN RESOLUTION</span>
                  </div>
                  <span className="text-[#F2EEE6] font-semibold">{hardwareInfo?.screen.split('x').slice(0, 2).join('×') || 'DETECTING...'}</span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2 text-[#88847E]">
                    <Globe className="w-3.5 h-3.5" />
                    <span>GPU CHIPSET</span>
                  </div>
                  <span className="text-[#F2EEE6] font-semibold truncate max-w-[140px]" title={hardwareInfo?.gpu}>
                    {hardwareInfo?.gpu?.replace(/ANGLE \(|Direct3D11|\)/g, '').trim() || 'DETECTING...'}
                  </span>
                </div>
              </div>

              <div 
                className="mt-4 pt-3 border-t border-[#303030] text-[10px] text-[#88847E]"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                PERSISTS ACROSS CHROME, EDGE, FIREFOX & INCOGNITO WINDOWS.
              </div>
            </div>

            {/* Protocol Rules */}
            <div 
              className="border border-[#303030] bg-[#141414] p-4 text-[11px] text-[#88847E] space-y-2"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              <span className="text-[#F2EEE6] font-bold block uppercase text-xs">REGISTRATION RULES</span>
              <p>1. Only one LeetCode account may be associated with this machine at a time.</p>
              <p>2. To switch accounts, remove your existing binding from your profile page.</p>
              <p>3. Your score and weekly ranking update automatically as you solve problems.</p>
            </div>
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* RIGHT: Registration Form or Bound Status */}
          {/* ═══════════════════════════════════════════ */}
          <div className="md:col-span-7">
            {loadingDevice ? (
              <div className="border border-[#303030] bg-[#191919] p-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF7417] mx-auto mb-3" />
                <p 
                  className="text-xs uppercase text-[#88847E]"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  VERIFYING HARDWARE CREDENTIALS...
                </p>
              </div>
            ) : registeredUser ? (
              /* ALREADY BOUND STATE */
              <div className="border border-[#303030] bg-[#191919] p-6 sm:p-8 space-y-6">
                <div>
                  <div 
                    className="flex items-center gap-2 text-xs text-[#39B96F] font-bold uppercase mb-2"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>DEVICE SUCCESSFULLY BOUND</span>
                  </div>
                  <h2 
                    className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#F2EEE6]"
                    style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                  >
                    @{registeredUser}
                  </h2>
                  <p 
                    className="text-xs text-[#88847E] mt-1"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    This physical workstation is already linked to this LeetCode account.
                  </p>
                </div>

                {/* Quick Action Navigation Grid */}
                <div 
                  className="space-y-2.5 pt-2"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  <Link
                    href={`/u/${registeredUser}`}
                    className="flex items-center justify-between bg-[#FF7417] text-[#101010] p-3.5 font-bold text-xs uppercase hover:bg-[#FF7417]/90 transition-colors group"
                  >
                    <span>OPEN YOUR PROFILE DASHBOARD (/u/{registeredUser})</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>

                  <Link
                    href="/weekly-leaders"
                    className="flex items-center justify-between border border-[#303030] bg-[#101010] text-[#F2EEE6] p-3 text-xs uppercase hover:bg-[#222222] transition-colors"
                  >
                    <span>VIEW LIVE WEEKLY STANDINGS</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#88847E]" />
                  </Link>

                  <Link
                    href="/"
                    className="flex items-center justify-between border border-[#303030] bg-[#101010] text-[#88847E] hover:text-[#F2EEE6] p-3 text-xs uppercase hover:bg-[#222222] transition-colors"
                  >
                    <span>VIEW ALL-TIME OVERALL LEADERBOARD</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div 
                  className="pt-4 border-t border-[#303030] text-[10px] text-[#88847E]"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  WANT TO UNLINK OR CHANGE YOUR ID? VISIT YOUR PROFILE DASHBOARD AT{' '}
                  <Link href={`/u/${registeredUser}`} className="text-[#FF7417] hover:underline">
                    /u/{registeredUser}
                  </Link>{' '}
                  AND CLICK &quot;UNLINK THIS DEVICE&quot;.
                </div>
              </div>
            ) : (
              /* REGISTRATION FORM STATE */
              <div className="border border-[#303030] bg-[#191919] p-6 sm:p-8">
                
                <div className="border-b border-[#303030] pb-4 mb-6">
                  <span 
                    className="text-[10px] uppercase tracking-widest text-[#FF7417] block mb-1 font-semibold"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    STEP 01 OF 01
                  </span>
                  <h2 
                    className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-[#F2EEE6]"
                    style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                  >
                    REGISTER LEETCODE ACCOUNT
                  </h2>
                  <p 
                    className="text-xs text-[#88847E] mt-1"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    Enter your public LeetCode handle. We will verify your stats against LeetCode before generating your profile.
                  </p>
                </div>

                <form onSubmit={handleAddUser} className="space-y-5">
                  <div>
                    <label 
                      htmlFor="username" 
                      className="block text-xs uppercase tracking-wider text-[#88847E] mb-2 font-semibold"
                      style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                    >
                      LEETCODE USERNAME
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555555] font-mono text-sm">
                        @
                      </span>
                      <input
                        id="username"
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        placeholder="e.g. zuri10"
                        disabled={submitting}
                        autoFocus
                        className="w-full bg-[#101010] border border-[#303030] pl-8 pr-4 py-3 text-sm text-[#F2EEE6] placeholder-[#555555] focus:outline-none focus:border-[#FF7417] transition-colors disabled:opacity-50 font-mono"
                        style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !usernameInput.trim()}
                    className="w-full bg-[#FF7417] text-[#101010] py-3.5 text-xs font-black uppercase tracking-wider hover:bg-[#FF7417]/90 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>VERIFYING ON LEETCODE...</span>
                      </>
                    ) : (
                      <>
                        <span>BIND DEVICE & CREATE PROFILE</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div 
                  className="mt-6 pt-5 border-t border-[#303030] text-[11px] text-[#88847E] space-y-1.5"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  <p>· Profile generated instantly at <span className="text-[#F2EEE6]">/u/{usernameInput || 'username'}</span>.</p>
                  <p>· Immediate inclusion in Weekly Cup and Overall Leaderboard.</p>
                  <p>· Verified live with LeetCode GraphQL API.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
