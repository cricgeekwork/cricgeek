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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-cg-dark text-white min-h-screen antialiased">
        <Providers>
          <IntroOverlay />
          <Navbar />

          <div className="border-b border-cg-green/30 bg-gradient-to-r from-[#0b1f13] via-[#0f2d1d] to-[#0b1f13]">
            <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-center gap-2 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-cg-gray-200 sm:text-[11px]">
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

