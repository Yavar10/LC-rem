"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
    ChevronLeft,
    Plus,
    Laptop,
    ShieldCheck,
    AlertCircle,
    Loader2,
    CheckCircle2,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDeviceFingerprint, HardwareProfile } from "@/lib/fingerprint";

export default function UserRegistrationPortal() {
    const router = useRouter();

    const [deviceId, setDeviceId] = useState<string>("");
    const [hardwareInfo, setHardwareInfo] = useState<HardwareProfile | null>(null);

    const [loadingDevice, setLoadingDevice] = useState(true);
    const [registeredUser, setRegisteredUser] = useState<string | null>(null);

    // Form states
    const [usernameInput, setUsernameInput] = useState("");
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
                // Automatically route to user profile /u/[username]
                router.replace(`/u/${username}`);
            } else {
                setRegisteredUser(null);
            }
        } catch (err) {
            console.error("Failed to query device status:", err);
        }
    }, [router]);

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
            setErrorMessage(`This device is already linked to /u/${registeredUser}.`);
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
                setSuccessMessage(`Registered! Redirecting to /u/${cleanUsername}...`);
                // Navigate directly to profile route /u/[username]
                setTimeout(() => {
                    router.push(`/u/${cleanUsername}`);
                }, 600);
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(err.response?.data?.error || "Error registering user. Please try again.");
            } else {
                setErrorMessage("An unexpected error occurred.");
            }
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
                    Mentee Registration
                </h1>
                <p className="text-[#6b6963] text-sm">
                    Link your LeetCode ID to this physical device. One active ID per device.
                </p>
            </div>

            {/* Device Verification Status Card */}
            <div className="bg-[#1a1917] p-4 rounded-xl border border-[#2a2926] mb-6 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#2a2926]/50 text-[#e07a3a] mt-0.5">
                    <Laptop className="w-4 h-4" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#e8e6e3]">Hardware Identity Active</span>
                        <span className="inline-flex items-center gap-1 text-[10px] bg-[#3db86a]/10 text-[#3db86a] px-2 py-0.5 rounded-full font-mono">
                            <ShieldCheck className="w-3 h-3" /> cross-browser
                        </span>
                    </div>
                    <p className="text-[11px] text-[#6b6963] font-mono mt-1 break-all">
                        {loadingDevice ? "Verifying device identity..." : `ID: ${deviceId.slice(0, 24)}...`}
                    </p>
                    {hardwareInfo && (
                        <p className="text-[10px] text-[#6b6963]/70 font-mono mt-0.5">
                            {hardwareInfo.cores} Cores • {hardwareInfo.screen.split('x').slice(0, 2).join('x')} • {hardwareInfo.gpu} • {hardwareInfo.os}
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
            {loadingDevice || registeredUser ? (
                <div className="bg-[#1a1917] rounded-xl border border-[#2a2926] p-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#e07a3a] mx-auto mb-3" />
                    <p className="text-sm text-[#e8e6e3] font-medium mb-1">
                        {registeredUser ? `Redirecting to /u/${registeredUser}...` : "Checking device registration..."}
                    </p>
                    {registeredUser && (
                        <Link
                            href={`/u/${registeredUser}`}
                            className="text-xs text-[#e07a3a] hover:underline font-mono inline-flex items-center gap-1 mt-2"
                        >
                            Click here if not redirected automatically <ArrowRight className="w-3 h-3" />
                        </Link>
                    )}
                </div>
            ) : (
                /* Form for registering new LeetCode ID */
                <div className="bg-[#1a1917] p-6 rounded-xl border border-[#2a2926]">
                    <h2 className="text-sm font-semibold mb-2 text-[#e8e6e3]">Register Your LeetCode ID</h2>
                    <p className="text-xs text-[#6b6963] mb-6">
                        Enter your LeetCode username below. Your profile will be created at <span className="font-mono text-[#e8e6e3]">/u/[username]</span>.
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
                                placeholder="e.g. zuri10"
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
                                    Register ID & Create Profile
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-5 border-t border-[#2a2926]/60 text-[11px] text-[#6b6963] space-y-1">
                        <p>• Creates your public profile route at <span className="text-[#e8e6e3] font-mono">/u/{usernameInput || 'username'}</span></p>
                        <p>• Verified directly against LeetCode before adding.</p>
                        <p>• Instantly appears on the mentorship leaderboard.</p>
                        <p>• Persistent across Chrome, Edge, Firefox, and Incognito tabs.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
