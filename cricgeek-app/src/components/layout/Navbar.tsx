"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import NotificationBell from "@/components/layout/NotificationBell";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { useCricGeekSession } from "@/hooks/useCricGeekSession";
import { signOutLocalUser } from "@/lib/communities/local-community-service";
import {
  Zap,
  Radio,
  Calendar,
  PenSquare,
  Shield,
  Search,
  User,
  Trophy,
  LogOut,
  ChevronDown,
  ChevronLeft,
  Users,
  MoreHorizontal,
} from "lucide-react";

const navLinks = [
  { href: "/matches", label: "Live Matches", icon: Zap },
  { href: "/communities", label: "Communities", icon: Users },
  { href: "/commentary", label: "Commentary", icon: Radio },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/blog", label: "Expressions", icon: PenSquare },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export default function Navbar() {
  const { user, status, isLocalUser } = useCricGeekSession();
  const pathname = usePathname();
  const [openMorePath, setOpenMorePath] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const mobileAccountRef = useRef<HTMLDivElement>(null);
  const mobileNavSwipeRef = useRef<{ x: number; y: number } | null>(null);
  const suppressNavClickRef = useRef(false);
  const previousShowMoreRef = useRef(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const firstSecondaryLinkRef = useRef<HTMLAnchorElement>(null);
  const authLoading = status === "loading";
  const showMore = openMorePath === pathname;

  const isActivePath = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  const moreActive =
    ["/calendar", "/leaderboard", "/admin"].some(isActivePath) ||
    pathname.startsWith("/writer/") ||
    pathname.startsWith("/auth/");

  useEffect(() => {
    if (!showMore) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMorePath(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showMore]);

  useEffect(() => {
    if (previousShowMoreRef.current === showMore) return;
    previousShowMoreRef.current = showMore;
    (showMore ? firstSecondaryLinkRef.current : moreButtonRef.current)?.focus({
      preventScroll: true,
    });
  }, [showMore]);

  useEffect(() => {
    if (!showDropdown) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !mobileAccountRef.current?.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowDropdown(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showDropdown]);

  const handleSignOut = () => {
    setShowDropdown(false);
    setOpenMorePath(null);
    if (isLocalUser) {
      signOutLocalUser();
    }
    void signOut({ redirectTo: "/" });
  };

  const visibleNavLinks =
    user?.role === "admin"
      ? [...navLinks, { href: "/admin", label: "Admin", icon: Shield }]
      : navLinks;

  const handleMobileNavPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    suppressNavClickRef.current = false;
    mobileNavSwipeRef.current = event.pointerType === "touch"
      ? { x: event.clientX, y: event.clientY }
      : null;
    if (event.pointerType === "touch") {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handleMobileNavPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const start = mobileNavSwipeRef.current;
    if (!start) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) > 24 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
      suppressNavClickRef.current = true;
    }
  };

  const handleMobileNavPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    const start = mobileNavSwipeRef.current;
    mobileNavSwipeRef.current = null;
    if (!start) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;

    if (deltaX < 0 && !showMore) {
      setShowDropdown(false);
      setOpenMorePath(pathname);
    } else if (deltaX > 0 && showMore) {
      setOpenMorePath(null);
    }
  };

  const handleMobileNavClickCapture = (event: React.MouseEvent<HTMLElement>) => {
    if (!suppressNavClickRef.current) return;
    suppressNavClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <>
    <nav className="bg-[var(--bg-surface)] border-b border-[var(--border-color)] sticky top-0 z-50 cg-nav-enter transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-cg-green rounded-lg flex items-center justify-center">
              <span className="text-black font-black text-lg">CG</span>
            </div>
            <span className="text-[var(--text-primary)] font-bold text-xl hidden sm:block">
              CricGeek
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {visibleNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[var(--text-secondary)] hover:text-cg-green hover:bg-[var(--bg-hover)] px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
              >
                <link.icon size={16} />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <button className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-all">
              <Search size={18} />
            </button>

            {/* Theme toggle — always visible, in place of Join Free */}
            <ThemeToggle />

            {authLoading ? (
              <div className="h-10 w-28 animate-pulse rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]" />
            ) : user ? (
              /* Logged in — User Dropdown */
              <div className="relative flex items-center gap-2">
                <NotificationBell />
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-muted)] rounded-xl px-3 py-1.5 hover:border-[var(--border-strong)] transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-cg-green/20 flex items-center justify-center text-xs font-bold text-cg-green">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[var(--text-primary)] text-sm font-medium max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-[var(--text-muted)] transition-transform ${showDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {showDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-[var(--dropdown-bg)] border border-[var(--dropdown-border)] rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-[var(--border-color)]">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {user.name}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] truncate">
                          {user.email}
                        </p>
                      </div>
                      <div className="py-1">
                        <Link
                          href={`/writer/${user.id}`}
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--dropdown-hover)] hover:text-[var(--text-primary)] transition-all"
                        >
                          <User size={14} /> My Profile
                        </Link>
                        <Link
                          href="/blog/write"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--dropdown-hover)] hover:text-[var(--text-primary)] transition-all"
                        >
                          <PenSquare size={14} /> Write Expression
                        </Link>
                        <Link
                          href="/leaderboard"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--dropdown-hover)] hover:text-[var(--text-primary)] transition-all"
                        >
                          <Trophy size={14} /> Leaderboard
                        </Link>
                        {user.role === "admin" && (
                          <Link
                            href="/admin"
                            onClick={() => setShowDropdown(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-cg-green hover:bg-[var(--dropdown-hover)] transition-all"
                          >
                            <Shield size={14} /> Admin Dashboard
                          </Link>
                        )}
                      </div>
                      <div className="border-t border-[var(--border-color)] py-1">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 w-full transition-all"
                        >
                          <LogOut size={14} /> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Not logged in */
              <Link
                href="/auth/login"
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
              >
                <User size={16} />
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile account controls */}
          <div className="flex md:hidden items-center gap-1">
            <button
              type="button"
              aria-label="Search"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            >
              <Search size={18} />
            </button>
            <ThemeToggle />
            {user && <NotificationBell />}

            <div className="relative" ref={mobileAccountRef}>
              {authLoading ? (
                <div className="h-9 w-9 animate-pulse rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface-2)]" />
              ) : user ? (
                <>
                  <button
                    type="button"
                    aria-label={`Account: ${user.name}`}
                    aria-expanded={showDropdown}
                    aria-haspopup="true"
                    aria-controls="cg-mobile-account-menu"
                    onClick={() => {
                      setOpenMorePath(null);
                      setShowDropdown((isOpen) => !isOpen);
                    }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border-muted)] bg-[var(--bg-surface)] p-1 text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cg-green/20 text-xs font-bold text-cg-green">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </button>
                  {showDropdown && (
                    <div id="cg-mobile-account-menu" className="cg-mobile-account-menu absolute right-0 top-full z-[70] mt-2 w-56 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-[var(--dropdown-border)] bg-[var(--dropdown-bg)] shadow-xl">
                      <p className="border-b border-[var(--border-color)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                        {user.name}
                      </p>
                      <Link
                        href={`/writer/${user.id}`}
                        onClick={() => setShowDropdown(false)}
                        className="flex min-h-11 items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--dropdown-hover)] hover:text-[var(--text-primary)]"
                      >
                        <User size={16} aria-hidden="true" /> My Profile
                      </Link>
                      <Link
                        href="/blog/write"
                        onClick={() => setShowDropdown(false)}
                        className="flex min-h-11 items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--dropdown-hover)] hover:text-[var(--text-primary)]"
                      >
                        <PenSquare size={16} aria-hidden="true" /> Write Expression
                      </Link>
                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setShowDropdown(false)}
                          className="flex min-h-11 items-center gap-2 px-4 py-2.5 text-sm text-cg-green hover:bg-[var(--dropdown-hover)]"
                        >
                          <Shield size={16} aria-hidden="true" /> Admin Dashboard
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex min-h-11 w-full items-center gap-2 border-t border-[var(--border-color)] px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10"
                      >
                        <LogOut size={16} aria-hidden="true" /> Sign Out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex h-9 shrink-0 items-center justify-center gap-1 rounded-lg bg-cg-green px-2.5 text-xs font-bold text-black hover:bg-cg-green-dark min-[375px]:px-3"
                >
                  <User size={15} aria-hidden="true" />
                  Sign In
                </Link>
              )}
            </div>
          </div>

        </div>
      </div>
    </nav>
      <div className="cg-mobile-bottom-nav md:hidden">
        <nav
          aria-label="Mobile navigation"
          className="cg-mobile-bottom-nav__viewport"
          onPointerDown={handleMobileNavPointerDown}
          onPointerMove={handleMobileNavPointerMove}
          onPointerUp={handleMobileNavPointerUp}
          onPointerCancel={() => { mobileNavSwipeRef.current = null; }}
          onClickCapture={handleMobileNavClickCapture}
        >
          {showMore && (
            <button
              type="button"
              aria-label="Return to primary navigation"
              onClick={() => setOpenMorePath(null)}
              className="cg-mobile-bottom-nav__back"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
          )}
          <div
            id="cg-mobile-bottom-nav-track"
            className={`cg-mobile-bottom-nav__track ${showMore ? "is-secondary" : ""}`}
          >
          {[
            { href: "/matches", label: "Live", icon: Zap },
            { href: "/communities", label: "Community", icon: Users },
            { href: "/commentary", label: "Commentary", icon: Radio },
            { href: "/blog", label: "Expressions", icon: PenSquare },
          ].map((item) => {
            const active =
              isActivePath(item.href) ||
              (item.href === "/matches" && pathname === "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                aria-hidden={showMore && item.href === "/matches"}
                tabIndex={showMore && item.href === "/matches" ? -1 : 0}
                className={`cg-mobile-bottom-nav__item ${item.href === "/matches" ? "cg-mobile-bottom-nav__item--live" : ""} ${active ? "is-active" : ""}`}
              >
                <item.icon size={20} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            aria-label="More navigation options"
            aria-expanded={showMore}
            aria-controls="cg-mobile-bottom-nav-track"
            aria-hidden={showMore}
            tabIndex={showMore ? -1 : 0}
            ref={moreButtonRef}
            onClick={() => {
              setShowDropdown(false);
              setOpenMorePath(showMore ? null : pathname);
            }}
            className={`cg-mobile-bottom-nav__item cg-mobile-bottom-nav__item--more ${showMore || moreActive ? "is-active" : ""}`}
          >
            <MoreHorizontal size={20} strokeWidth={showMore || moreActive ? 2.5 : 2} aria-hidden="true" />
            <span>More</span>
          </button>
          {[
            { href: "/calendar", label: "Calendar", icon: Calendar },
            { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
          ].map((item) => {
            const active = isActivePath(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-hidden={!showMore}
                tabIndex={showMore ? 0 : -1}
                ref={item.href === "/calendar" ? firstSecondaryLinkRef : undefined}
                onClick={() => setOpenMorePath(null)}
                className={`cg-mobile-bottom-nav__item cg-mobile-bottom-nav__item--secondary ${active ? "is-active" : ""}`}
              >
                <item.icon size={20} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          </div>
        </nav>
      </div>
    </>
  );
}
