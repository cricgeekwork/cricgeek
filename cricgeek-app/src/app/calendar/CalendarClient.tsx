"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Mic, FileText, Radio, PenSquare } from "lucide-react";
import { cn, getMatchTypeColor } from "@/lib/utils";
import type { CalendarMatch } from "@/types/cricket";

interface LinkedCommentarySession {
  id: string;
  matchId: string;
  matchName: string;
  matchType: string;
  status: string;
  createdAt: string;
  moderator: { id: string; name: string };
  _count: { entries: number };
}

interface LinkedBlog {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
  matchTag: string | null;
  author: { id: string; name: string };
}

interface CalendarMatchWithLinks extends CalendarMatch {
  commentarySessions: LinkedCommentarySession[];
  blogs: LinkedBlog[];
}

interface CalendarClientProps {
  matches: CalendarMatchWithLinks[];
  source: "sportmonks" | "mock" | "none";
}

export default function CalendarClient({ matches, source }: CalendarClientProps) {
  const today = new Date().toISOString().split("T")[0];
  const getInitialSelectedDate = () => {
    if (matches.some((match) => match.date === today)) return today;

    const nextUpcoming = [...matches]
      .filter((match) => match.date >= today && !match.matchEnded)
      .sort((left, right) => left.dateTimeGMT.localeCompare(right.dateTimeGMT))[0];

    if (nextUpcoming) return nextUpcoming.date;

    const mostRecentCompleted = [...matches]
      .filter((match) => match.matchEnded ?? match.date <= today)
      .sort((left, right) => right.dateTimeGMT.localeCompare(left.dateTimeGMT))[0];

    return mostRecentCompleted?.date ?? today;
  };
  const initialSelectedDate = getInitialSelectedDate();
  const [currentDate, setCurrentDate] = useState(() => new Date(`${initialSelectedDate}T00:00:00`));
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const matchesByDate = useMemo(() => {
    const map = new Map<string, CalendarMatchWithLinks[]>();
    matches.forEach((match) => {
      const dateKey = match.date;
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(match);
    });
    return map;
  }, [matches]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const selectedMatches = matchesByDate.get(selectedDate) ?? [];

  const getPrimaryCommentary = (match: CalendarMatchWithLinks) =>
    match.commentarySessions.find((session) => ["live", "paused", "scheduled"].includes(session.status)) ??
    match.commentarySessions[0];

  const getCommentaryLabel = (status: string) => {
    if (status === "scheduled") return "Scheduled Commentary";
    if (status === "ended") return "Archived Commentary";
    return "Live Commentary";
  };

  const upcomingMatches = matches
    .filter((match) => !match.matchStarted && !match.matchEnded)
    .slice(0, 10);

  const recentMatches = [...matches]
    .filter((match) => Boolean(match.matchEnded))
    .sort((left, right) => right.dateTimeGMT.localeCompare(left.dateTimeGMT))
    .slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="text-3xl font-black text-[var(--text-primary)] mb-2">Cricket Calendar</h1>
      <p className="text-[var(--text-secondary)] text-sm mb-8">
        Upcoming fixtures, live games, and recent results in one timeline.
      </p>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg border border-[var(--border-color)] bg-[var(--btn-secondary-bg)] hover:bg-[var(--bg-hover-2)] text-[var(--text-primary)] transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">{monthName}</h2>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg border border-[var(--border-color)] bg-[var(--btn-secondary-bg)] hover:bg-[var(--bg-hover-2)] text-[var(--text-primary)] transition-all"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {matches.length === 0 && (
        <div className="mb-8 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">No calendar matches available right now.</p>
          <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-200/80">
            {source === "sportmonks"
              ? "SportMonks returned no fixtures for the current calendar window. This usually means there are no fixtures or results in the requested range, or the API quota has been exhausted."
              : source === "mock"
                ? "Live fixture providers are not configured on this environment, so CricGeek is waiting on mock calendar data."
                : "The configured cricket fixture provider did not return any matches for this request."}
          </p>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-[var(--border-color)] bg-[var(--bg-surface-2)]">
          {days.map((day) => (
            <div
              key={day}
              className="px-0 py-2 sm:px-2 sm:py-3 text-center text-[9px] sm:text-xs font-semibold text-[var(--text-secondary)] uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {/* Empty cells for first week offset */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="min-h-12 sm:min-h-[120px] border-b border-r border-[var(--border-color)] bg-[var(--bg-surface-2)]/40"
            />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayMatches = matchesByDate.get(dateStr) || [];
            const isToday = dateStr === today;

            return (
              <div
                key={day}
                onClick={() => dayMatches.length > 0 && setSelectedDate(dateStr)}
                className={cn(
                  "min-h-12 cursor-default sm:min-h-[120px] border-b border-r border-[var(--border-color)] p-0.5 sm:p-1.5 transition-all",
                  dayMatches.length > 0 && "cursor-pointer hover:bg-[var(--bg-hover)]",
                  isToday && "bg-cg-green/5",
                  selectedDate === dateStr && "ring-1 ring-inset ring-cg-green/40"
                )}
              >
                <span
                  className={cn(
                    "text-[10px] sm:text-xs font-medium inline-block w-5 h-5 sm:w-6 sm:h-6 rounded-full text-center leading-5 sm:leading-6",
                    isToday
                      ? "bg-[var(--accent)] text-[var(--text-on-accent)] font-bold"
                      : "text-[var(--text-secondary)]"
                  )}
                >
                  {day}
                </span>
                <div className="hidden sm:block space-y-1 mt-1">
                  {dayMatches.slice(0, 2).map((match) => (
                    <div key={match.id} className="space-y-1">
                      <Link href={`/matches/${match.id}`} className="block">
                        <div
                          className={cn(
                            "text-[10px] sm:text-xs px-1.5 py-0.5 rounded truncate text-white font-medium",
                            getMatchTypeColor(match.matchType)
                          )}
                          title={match.name}
                        >
                          {match.teamInfo?.[0]?.shortname || match.teams[0]?.slice(0, 3)} v{" "}
                          {match.teamInfo?.[1]?.shortname || match.teams[1]?.slice(0, 3)}
                        </div>
                      </Link>
                      <div className="flex flex-wrap gap-1">
                        {match.commentarySessions.length > 0 && (
                          <span className="inline-flex items-center gap-1 rounded bg-cg-green/10 px-1.5 py-0.5 text-[9px] text-cg-green">
                            <Mic size={10} />
                            {match.commentarySessions.length}
                          </span>
                        )}
                        {match.blogs.length > 0 && (
                          <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] text-blue-300">
                            <FileText size={10} />
                            {match.blogs.length}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {dayMatches.length > 2 && (
                    <span className="text-[10px] text-gray-500">
                      +{dayMatches.length - 2} more
                    </span>
                  )}
                </div>
                {dayMatches.length > 0 && (
                  <span className="mx-auto mt-1 block h-1.5 w-1.5 rounded-full bg-cg-green sm:hidden" aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 sm:mt-8 rounded-xl sm:rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-3 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Match Board</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              {selectedMatches.length > 0
                ? `Fixtures, results, and linked coverage for ${selectedDate}`
                : `No matches found for ${selectedDate}`}
            </p>
          </div>
          {selectedMatches.length > 0 && (
            <span className="rounded-full border border-cg-green/20 bg-cg-green/10 px-3 py-1 text-xs font-semibold text-cg-green">
              {selectedMatches.length} match{selectedMatches.length === 1 ? "" : "es"}
            </span>
          )}
        </div>

        {selectedMatches.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-surface-2)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
            Pick another date in the calendar to preview upcoming, live, or completed matches.
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {selectedMatches.map((match) => (
              <div key={match.id} className="rounded-lg sm:rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface-2)] p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold text-white",
                        getMatchTypeColor(match.matchType)
                      )}
                    >
                      {match.matchType}
                    </span>
                    <h4 className="mt-3 text-lg font-bold text-[var(--text-primary)]">{match.name}</h4>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{match.venue}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[var(--text-muted)]">{match.date}</span>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-cg-green">
                      {match.matchEnded ? "Completed" : match.matchStarted ? "Live" : "Upcoming"}
                    </p>
                  </div>
                </div>

                {match.score && match.score.length > 0 && (
                  <div className="mt-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Score Snapshot</p>
                    <div className="mt-2 space-y-1">
                      {match.score.map((score) => (
                        <p key={`${match.id}-${score.inning}`} className="text-sm text-[var(--text-secondary)]">
                          <span className="font-medium text-[var(--text-primary)]">{score.inning}</span>: {score.r}/{score.w} ({score.o} ov)
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/matches/${match.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--tag-bg)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover-2)]"
                  >
                    Match Centre
                  </Link>
                  {match.matchEnded ? (
                    <Link
                      href={`/matches/${match.id}/post-match`}
                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--tag-bg)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover-2)]"
                    >
                      Analysis
                    </Link>
                  ) : (
                    <Link
                      href={`/matches/${match.id}?tab=squads`}
                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--tag-bg)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover-2)]"
                    >
                      Squad Preview
                    </Link>
                  )}
                  {getPrimaryCommentary(match) ? (
                    <Link
                      href={`/commentary/${getPrimaryCommentary(match)!.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-cg-green/30 bg-cg-green/10 px-3 py-2 text-xs font-semibold text-cg-green hover:bg-cg-green/20"
                    >
                      <Radio size={12} />
                      {getCommentaryLabel(getPrimaryCommentary(match)!.status)}
                    </Link>
                  ) : !match.matchEnded ? (
                    <Link
                      href={`/commentary?matchId=${encodeURIComponent(match.id)}&matchName=${encodeURIComponent(match.name)}&matchType=${encodeURIComponent(match.matchType)}&status=scheduled`}
                      className="inline-flex items-center gap-1 rounded-lg border border-cg-green/30 bg-cg-green/10 px-3 py-2 text-xs font-semibold text-cg-green hover:bg-cg-green/20"
                    >
                      <Mic size={12} />
                      Schedule Commentary
                    </Link>
                  ) : null}
                  {match.matchEnded && (
                    <Link
                      href={`/blog/write?matchId=${encodeURIComponent(match.id)}&matchName=${encodeURIComponent(match.name)}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-500/20"
                    >
                      <PenSquare size={12} />
                      Write Recap
                    </Link>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Commentary</p>
                    {match.commentarySessions.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        {match.commentarySessions.slice(0, 2).map((session) => (
                          <Link
                            key={session.id}
                            href={`/commentary/${session.id}`}
                            className="block text-sm text-cg-green hover:text-cg-green-dark"
                          >
                            {session.status === "ended" ? "ARCHIVED" : session.status.toUpperCase()} by {session.moderator.name}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">No commentary sessions linked yet.</p>
                    )}
                  </div>
                  <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Blogs</p>
                    {match.blogs.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        {match.blogs.slice(0, 2).map((blog) => (
                          <Link
                            key={blog.id}
                            href={`/blog/${blog.slug}`}
                            className="block text-sm text-blue-600 dark:text-blue-300 hover:text-blue-700"
                          >
                            {blog.title}
                          </Link>
                        ))}
                        <Link
                          href={`/blog?matchId=${encodeURIComponent(match.id)}`}
                          className="inline-flex items-center gap-1 pt-1 text-xs font-semibold text-blue-600 dark:text-blue-300 hover:text-blue-700"
                        >
                          <FileText size={12} />
                          View all linked blogs
                        </Link>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <p className="text-sm text-[var(--text-secondary)]">No match blogs yet.</p>
                        <Link
                          href={`/blog/write?matchId=${encodeURIComponent(match.id)}&matchName=${encodeURIComponent(match.name)}`}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-300 hover:text-blue-700"
                        >
                          <PenSquare size={12} />
                          {match.matchEnded ? "Write the recap" : "Write the preview"}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Upcoming Matches</h3>
          <div className="min-w-0 space-y-2">
            {upcomingMatches.map((match) => (
              <div key={match.id} className="min-w-0 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-3 hover:border-cg-green/50 transition-all flex items-center gap-3">
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded text-white shrink-0",
                      getMatchTypeColor(match.matchType)
                    )}
                  >
                    {match.matchType}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-primary)] text-sm font-medium truncate">
                      {match.name}
                    </p>
                    <p className="text-[var(--text-muted)] text-xs truncate">{match.venue}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link
                        href={`/matches/${match.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--tag-bg)] px-2 py-1 text-[11px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover-2)]"
                      >
                        View Match
                      </Link>
                      <Link
                        href={`/matches/${match.id}?tab=squads`}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--tag-bg)] px-2 py-1 text-[11px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover-2)]"
                      >
                        Squads
                      </Link>
                      {getPrimaryCommentary(match) ? (
                        <Link
                          href={`/commentary/${getPrimaryCommentary(match)!.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-cg-green/30 bg-cg-green/10 px-2 py-1 text-[11px] font-medium text-cg-green hover:bg-cg-green/20"
                        >
                          <Radio size={12} />
                          {getCommentaryLabel(getPrimaryCommentary(match)!.status)}
                        </Link>
                      ) : (
                        <Link
                          href={`/commentary?matchId=${encodeURIComponent(match.id)}&matchName=${encodeURIComponent(match.name)}&matchType=${encodeURIComponent(match.matchType)}&status=scheduled`}
                          className="inline-flex items-center gap-1 rounded-lg border border-cg-green/30 bg-cg-green/10 px-2 py-1 text-[11px] font-medium text-cg-green hover:bg-cg-green/20"
                        >
                          <Mic size={12} />
                          Schedule Commentary
                        </Link>
                      )}
                      <Link
                        href={`/blog/write?matchId=${encodeURIComponent(match.id)}&matchName=${encodeURIComponent(match.name)}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[11px] font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-500/20"
                      >
                        <PenSquare size={12} />
                        Write Expression
                      </Link>
                      {match.blogs.length > 0 && (
                        <Link
                          href={`/blog?matchId=${encodeURIComponent(match.id)}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--tag-bg)] px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover-2)]"
                        >
                          <FileText size={12} />
                          {match.blogs.length} Expression{match.blogs.length === 1 ? "" : "s"}
                        </Link>
                      )}
                    </div>
                    {(match.commentarySessions.length > 0 || match.blogs.length > 0) && (
                      <div className="mt-2 space-y-1">
                        {match.commentarySessions.slice(0, 1).map((session) => (
                          <p key={session.id} className="text-[11px] text-[var(--text-muted)] truncate">
                            Commentary: {session.status === "ended" ? "ARCHIVED" : session.status.toUpperCase()} by {session.moderator.name}
                          </p>
                        ))}
                        {match.blogs.slice(0, 2).map((blog) => (
                          <Link
                            key={blog.id}
                            href={`/blog/${blog.slug}`}
                            className="block text-[11px] text-blue-600 dark:text-blue-300 truncate hover:text-blue-700"
                          >
                            {blog.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[var(--text-muted)] text-xs shrink-0">{match.date}</span>
                </div>
            ))}
            {upcomingMatches.length === 0 && (
              <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-4 text-sm text-[var(--text-muted)]">
                No upcoming matches are available from the current API response.
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Recent Results</h3>
          <div className="space-y-2">
            {recentMatches.map((match) => (
              <div key={match.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-3 hover:border-cg-green/50 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[var(--text-primary)] text-sm font-medium">{match.name}</p>
                      <p className="text-[var(--text-muted)] text-xs mt-1">{match.venue}</p>
                    </div>
                    <span className="rounded-full border border-[var(--border-color)] bg-[var(--tag-bg)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                      Result
                    </span>
                  </div>
                  {match.score && match.score.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {match.score.map((score) => (
                        <p key={`${match.id}-${score.inning}`} className="text-[12px] text-[var(--text-secondary)]">
                          <span className="font-medium text-[var(--text-primary)]">{score.inning}</span>: {score.r}/{score.w} ({score.o} ov)
                        </p>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/matches/${match.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--tag-bg)] px-2 py-1 text-[11px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover-2)]"
                    >
                      Match Centre
                    </Link>
                    <Link
                      href={`/matches/${match.id}/post-match`}
                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--tag-bg)] px-2 py-1 text-[11px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover-2)]"
                    >
                      Analysis
                    </Link>
                    {getPrimaryCommentary(match) && (
                      <Link
                        href={`/commentary/${getPrimaryCommentary(match)!.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-cg-green/30 bg-cg-green/10 px-2 py-1 text-[11px] font-medium text-cg-green hover:bg-cg-green/20"
                      >
                        <Radio size={12} />
                        {getCommentaryLabel(getPrimaryCommentary(match)!.status)}
                      </Link>
                    )}
                  </div>
                  <p className="mt-3 text-[11px] text-[var(--text-muted)]">{match.status}</p>
                </div>
            ))}
            {recentMatches.length === 0 && (
              <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-4 text-sm text-[var(--text-muted)]">
                No completed matches are available from the current API response.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
