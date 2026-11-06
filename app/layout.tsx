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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var c = localStorage.getItem('leetrem_accent');
                  if (c) {
                    document.documentElement.style.setProperty('--accent', c);
                    var clean = c.replace('#', '');
                    var r = parseInt(clean.substring(0, 2), 16) || 255;
                    var g = parseInt(clean.substring(2, 4), 16) || 116;
                    var b = parseInt(clean.substring(4, 6), 16) || 23;
                    document.documentElement.style.setProperty('--accent-rgb', r + ', ' + g + ', ' + b);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${anton.variable} ${manrope.variable} ${ibmPlexMono.variable} font-sans antialiased bg-black text-[#F1EEE8] min-h-screen selection:bg-[var(--accent)] selection:text-black`}
      >
        <LeaderboardProvider>
          {children}
        </LeaderboardProvider>
      </body>
    </html>
  );
}
