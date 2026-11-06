"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { 
  ChevronLeft, 
  Trash2, 
  Plus, 
  Laptop, 
  ShieldCheck, 
  AlertCircle, 
  ExternalLink, 
  Loader2,
  CheckCircle2,
  Lock
} from "lucide-react";
import Link from "next/link";
import { getDeviceFingerprint, HardwareProfile } from "@/lib/fingerprint";

interface LeetCodeProfile {
  name?: string;
  avatar?: string;
  totalSolved?: number;
  easySolved?: number;
  mediumSolved?: number;
  hardSolved?: number;
  ranking?: number;
}

export default function UserPortal() {
  const [deviceId, setDeviceId] = useState<string>("");
  const [hardwareInfo, setHardwareInfo] = useState<HardwareProfile | null>(null);

  const [loadingDevice, setLoadingDevice] = useState(true);
  const [registeredUser, setRegisteredUser] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<LeetCodeProfile | null>(null);
  const [fetchingProfile, setFetchingProfile] = useState(false);

  // Form states
  const [usernameInput, setUsernameInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Preview user from LeetCode API
  const fetchLeetCodePreview = useCallback(async (username: string) => {
    setFetchingProfile(true);
    try {
      const [profileRes, solvedRes] = await Promise.allSettled([
        axios.get(`https://kinkdin.onrender.com/${username}`),
        axios.get(`https://kinkdin.onrender.com/${username}/solved`)
      ]);

      const profileData = profileRes.status === "fulfilled" ? profileRes.value.data : {};
      const solvedData = solvedRes.status === "fulfilled" ? solvedRes.value.data : {};

      setUserProfile({
        name: profileData.name || profileData.realName || username,
        avatar: profileData.avatar || profileData.userAvatar,
        totalSolved: solvedData.solvedProblem ?? profileData.totalSolved ?? 0,
        easySolved: solvedData.easySolved ?? 0,
        mediumSolved: solvedData.mediumSolved ?? 0,
        hardSolved: solvedData.hardSolved ?? 0,
        ranking: profileData.ranking
      });
    } catch {
      // Ignore preview errors
    } finally {
      setFetchingProfile(false);
    }
  }, []);

  // Fetch current registration status for this device
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
        fetchLeetCodePreview(username);
      } else {
        setRegisteredUser(null);
        setUserProfile(null);
      }
    } catch (err) {
      console.error("Failed to query device status:", err);
    }
  }, [fetchLeetCodePreview]);

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
        console.error("Device fingerprinting error:", err);
        setErrorMessage("Failed to detect device hardware signature. Please ensure scripts are allowed.");
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
      setErrorMessage("Please enter a valid LeetCode username.");
      return;
    }

    if (registeredUser) {
      setErrorMessage("This device already has a registered ID. You must delete it first to register another.");
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
        setErrorMessage("Invalid LeetCode username or account not found.");
        setSubmitting(false);
        return;
      }

      // 2. Register with deviceId and hardware profile in backend
      const res = await axios.post("/api/users", {
        username: cleanUsername,
        deviceId,
        hardware: hardwareInfo
      });

      if (res.data?.success) {
        setRegisteredUser(cleanUsername);
        setUsernameInput("");
        setSuccessMessage(`Successfully registered ${cleanUsername} to this device!`);
        fetchLeetCodePreview(cleanUsername);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setErrorMessage(err.response?.data?.error || "Error registering user. Please try again.");
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle deleting registered user
  const handleDeleteUser = async () => {
    if (!registeredUser) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to remove ${registeredUser} from this device?\n\nThis will free up this device so you can register a new LeetCode ID.`
    );
    if (!confirmDelete) return;

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const params = new URLSearchParams({
        deviceId,
        username: registeredUser,
        gpu: hardwareInfo?.gpu || '',
        screen: hardwareInfo?.screen || '',
        cores: String(hardwareInfo?.cores || ''),
        os: hardwareInfo?.os || ''
      });

      await axios.delete(`/api/users?${params.toString()}`);
      setRegisteredUser(null);
      setUserProfile(null);
      setSuccessMessage("Your LeetCode ID has been removed. You can now register a new one.");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setErrorMessage(err.response?.data?.error || "Failed to remove user from device.");
      } else {
        setErrorMessage("Failed to remove user from device.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 md:px-6 md:py-12 max-w-2xl mx-auto">
      {/* Navigation */}
      <Link 
        href="/" 
        className="group flex items-center gap-1.5 text-[#6b6963] hover:text-[#e8e6e3] transition-colors mb-8 w-fit"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span className="text-xs font-mono">back to leaderboard</span>
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-[#e8e6e3]">
          Mentee Device Portal
        </h1>
        <p className="text-[#6b6963] text-sm">
          Register your LeetCode ID. Each device is permitted one active ID at a time.
        </p>
      </div>

      {/* Device Verification Status Card */}
      <div className="bg-[#1a1917] p-4 rounded-xl border border-[#2a2926] mb-6 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-[#2a2926]/50 text-[#e07a3a] mt-0.5">
          <Laptop className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#e8e6e3]">Physical Device Bound</span>
            <span className="inline-flex items-center gap-1 text-[10px] bg-[#3db86a]/10 text-[#3db86a] px-2 py-0.5 rounded-full font-mono">
              <ShieldCheck className="w-3 h-3" /> persistant credentials
            </span>
          </div>
          <p className="text-[11px] text-[#6b6963] font-mono mt-1 break-all">
            {loadingDevice ? "Reading device hardware..." : `ID: ${deviceId.slice(0, 24)}...`}
          </p>
          {hardwareInfo && (
            <p className="text-[10px] text-[#6b6963]/70 font-mono mt-0.5">
              {hardwareInfo.cores} Cores • {hardwareInfo.screen.split('x').slice(0,2).join('x')} • {hardwareInfo.gpu} • {hardwareInfo.os}
            </p>
          )}
        </div>
      </div>

      {/* Notification Banners */}
      {errorMessage && (
        <div className="bg-[#e05a5a]/10 border border-[#e05a5a]/30 text-[#e05a5a] text-xs px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-[#3db86a]/10 border border-[#3db86a]/30 text-[#3db86a] text-xs px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      {loadingDevice ? (
        <div className="bg-[#1a1917] rounded-xl border border-[#2a2926] p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#e07a3a] mx-auto mb-3" />
          <p className="text-sm text-[#6b6963] font-mono">Detecting device signature...</p>
        </div>
      ) : registeredUser ? (
        /* State 1: User has an active ID registered on this device */
        <div className="space-y-6">
          <div className="bg-[#1a1917] rounded-xl border border-[#2a2926] overflow-hidden">
            {/* Header banner */}
            <div className="px-6 py-4 border-b border-[#2a2926] bg-[#1a1917]/70 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3db86a] animate-pulse"></span>
                <h2 className="text-sm font-semibold text-[#e8e6e3]">Registered LeetCode Account</h2>
              </div>
              <span className="text-xs font-mono text-[#6b6963] bg-[#111110] px-2.5 py-1 rounded-md border border-[#2a2926]">
                1/1 Limit Active
              </span>
            </div>

            {/* Profile Information */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {userProfile?.avatar ? (
                    <img 
                      src={userProfile.avatar} 
                      alt={registeredUser} 
                      className="w-12 h-12 rounded-full border border-[#2a2926] object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#2a2926] flex items-center justify-center font-bold text-lg text-[#e8e6e3]">
                      {registeredUser.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-[#e8e6e3]">{registeredUser}</h3>
                      <a 
                        href={`https://leetcode.com/u/${registeredUser}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#6b6963] hover:text-[#e07a3a] transition-colors"
                        title="View LeetCode Profile"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    {userProfile?.name && userProfile.name !== registeredUser && (
                      <p className="text-xs text-[#6b6963]">{userProfile.name}</p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold font-mono text-[#e07a3a]">
                    {fetchingProfile ? "..." : userProfile?.totalSolved ?? "—"}
                  </div>
                  <div className="text-[11px] text-[#6b6963] uppercase tracking-wider font-mono">
                    Problems Solved
                  </div>
                </div>
              </div>

              {/* Solved Breakdown Pills */}
              {userProfile && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-[#111110] p-3 rounded-lg border border-[#2a2926] text-center">
                    <span className="text-xs text-[#3db86a] font-medium block">Easy</span>
                    <span className="text-sm font-mono font-bold text-[#e8e6e3]">{userProfile.easySolved}</span>
                  </div>
                  <div className="bg-[#111110] p-3 rounded-lg border border-[#2a2926] text-center">
                    <span className="text-xs text-[#d4a53a] font-medium block">Medium</span>
                    <span className="text-sm font-mono font-bold text-[#e8e6e3]">{userProfile.mediumSolved}</span>
                  </div>
                  <div className="bg-[#111110] p-3 rounded-lg border border-[#2a2926] text-center">
                    <span className="text-xs text-[#e05a5a] font-medium block">Hard</span>
                    <span className="text-sm font-mono font-bold text-[#e8e6e3]">{userProfile.hardSolved}</span>
                  </div>
                </div>
              )}

              {/* Device constraint explanation */}
              <div className="bg-[#111110] p-4 rounded-xl border border-[#2a2926] text-xs text-[#6b6963] leading-relaxed mb-6">
                <div className="flex items-center gap-1.5 font-medium text-[#e8e6e3] mb-1">
                  <Lock className="w-3.5 h-3.5 text-[#e07a3a]" />
                  <span>Single-Account Device Restriction</span>
                </div>
                This physical device is bound to this LeetCode ID across all browsers. If you made a mistake or want to replace this account, you must delete it first.
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={submitting}
                  className="w-full bg-[#e05a5a]/15 text-[#e05a5a] border border-[#e05a5a]/30 hover:bg-[#e05a5a]/25 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
                >
                  <Trash2 className="w-4 h-4" />
                  {submitting ? "Removing ID..." : "Delete Current ID"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* State 2: No ID registered yet on this device */
        <div className="bg-[#1a1917] p-6 rounded-xl border border-[#2a2926]">
          <h2 className="text-sm font-semibold mb-2 text-[#e8e6e3]">Register Your LeetCode ID</h2>
          <p className="text-xs text-[#6b6963] mb-6">
            Enter your LeetCode username below. You can only register one ID per physical device.
          </p>

          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-mono text-[#6b6963] mb-2">
                LeetCode Username
              </label>
              <input
                id="username"
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="e.g. tour_de_force"
                disabled={submitting}
                className="w-full bg-[#111110] border border-[#2a2926] rounded-lg px-4 py-3 text-sm text-[#e8e6e3] placeholder-[#6b6963] focus:outline-none focus:border-[#e07a3a] transition-colors disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !usernameInput.trim()}
              className="w-full bg-[#3db86a] text-[#111110] py-3 rounded-lg text-sm font-semibold hover:bg-[#3db86a]/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying on LeetCode...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Register ID for this Device
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#2a2926]/60 text-[11px] text-[#6b6963] space-y-1">
            <p>• Verified directly against LeetCode before adding.</p>
            <p>• Instantly appears on the mentorship leaderboard.</p>
            <p>• Enforced across Incognito tabs.</p>
            <p>• Only 1 ID allowed per device (can be deleted and swapped anytime).</p>
          </div>
        </div>
      )}
    </div>
  );
}
