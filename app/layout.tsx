import type { Metadata } from "next";
import { Anton, Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { LeaderboardProvider } from "./context/LeaderboardContext";

const anton = Anton({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LeetRem — Competitive DSA Mentorship & Weekly Leaders",
  description: "Track LeetCode rankings, streaks, and problem intensity for the competitive mentorship league.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${anton.variable} ${manrope.variable} ${ibmPlexMono.variable} font-sans antialiased bg-[#0B0B0B] text-[#F1EEE8] min-h-screen selection:bg-[#FF7417] selection:text-[#0B0B0B]`}
      >
        <LeaderboardProvider>
          {children}
        </LeaderboardProvider>
      </body>
    </html>
  );
}
