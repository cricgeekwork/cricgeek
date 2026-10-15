import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Providers from "@/app/providers";
import IntroOverlay from "@/components/layout/IntroOverlay";

export const metadata: Metadata = {
  title: "CricGeek - Live Cricket Scores, Analysis & Community",
  description:
    "Your ultimate cricket companion. Live match scores, ball-by-ball commentary, expert analysis, and community-driven cricket discussion.",
  keywords: ["cricket", "live scores", "IPL", "World Cup", "cricket analysis"],
};

/**
 * Blocking inline script — runs before paint so there is NO flash of the
 * wrong theme.  We intentionally keep it tiny (no external dependency).
 */
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('cricgeek-theme');
    var theme = (t === 'light' || t === 'dark') ? t : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Blocking theme-init script — must be first in <head> */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: intentional FOTWT prevention */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="cg-mobile-page-spacing bg-[var(--bg-base)] text-[var(--text-primary)] min-h-screen antialiased transition-colors duration-300">
        <Providers>
          <IntroOverlay />
          <Navbar />

          <div className="cg-announcement-strip border-b border-[var(--border-color)]">
            <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-center gap-2 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)] sm:text-[11px]">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cg-green cg-live-pulse" />
                  Live coverage
                </span>
                <span className="hidden text-cg-green/70 sm:inline">•</span>
                <span className="hidden sm:inline">match insights • community discussion • stats</span>
              </div>
            </div>
          </div>

          <main className="min-h-[calc(100vh-64px)]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
