"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Info,
  MessageCircle,
  X,
} from "lucide-react";
import {
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
} from "react";
import EdaAskPanel from "@/components/matches/EdaAskPanel";
import ThemeToggle from "@/components/layout/ThemeToggle";
import Logo from "@/components/common/Logo";
import { cn, formatDate } from "@/lib/utils";
import type {
  Match,
  PostMatchBattingLeader,
  PostMatchBowlingLeader,
  PostMatchEdaCard,
  PostMatchInningsSummary,
  Scorecard,
} from "@/types/cricket";
import type {
  PostMatchEdaReport,
  PostMatchInningsAnalytics,
  PostMatchOverSummary,
} from "@/types/eda";
import type { MatchCoverageSummary } from "@/lib/match-coverage";

export type PostMatchInsightsStoryProps = {
  match: Match;
  report: PostMatchEdaReport;
  coverage: MatchCoverageSummary;
  scorecards?: Scorecard[] | null;
};

type SlideDefinition = {
  section: string;
  title: string;
  description: string;
  content: ReactNode;
  supporting?: ReactNode;
  titleAside?: ReactNode;
  cover?: boolean;
};

type RankedGameChangingMoment = {
  title: string;
  description?: string;
  innings?: string;
  team?: string;
  over?: string | number | null;
  sourcePosition?: string | number | null;
  event?: string | number | null;
  impactScore?: number | null;
  runs?: string | number | null;
  wickets?: string | number | null;
  players?: Array<{ name: string; role: string }>;
  supportingContext?: string;
};

type MomentData = {
  title: string;
  context: string;
  impact: string;
  runs: string;
  wickets: string;
  players: string;
  interpretation: string;
  provenance: string[];
};

type BatterData = PostMatchBattingLeader;

const surfaceClass =
  "rounded-2xl border border-[var(--border-color)] bg-[var(--bg-inset)]";

function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(surfaceClass, "min-w-0 p-3 sm:p-4 lg:p-5", className)}>
      {children}
    </div>
  );
}

function DetailOverlay({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="text-sm font-semibold text-[var(--accent)] underline decoration-[var(--accent-border)] underline-offset-4"
      >
        {label}
      </button>
      <dialog
        ref={dialogRef}
        aria-label={title}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-1rem)] max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-4 text-[var(--text-primary)] shadow-2xl backdrop:bg-black/70 sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label={`Close ${title}`}
            className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {children}
      </dialog>
    </>
  );
}

function SegmentedControl({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-inset)] p-1"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "min-h-9 rounded-lg px-3 text-xs font-semibold transition-colors sm:text-sm",
            value === option.value
              ? "bg-[var(--accent-muted)] text-[var(--text-primary)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p
      className="text-[11px] font-bold uppercase tracking-[0.2em]"
      style={{ color: "var(--accent)" }}
    >
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
      {children}
    </p>
  );
}

function Value({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "mt-1 break-words text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl",
        className,
      )}
    >
      {children}
    </p>
  );
}

function Note({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm leading-6 text-[var(--text-secondary)]">{children}</p>
  );
}

function chunkItems<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function SlideShell({
  slide,
  index,
  total,
  previousTitle,
  nextTitle,
  onPrevious,
  onNext,
  children,
  supporting,
}: {
  slide: SlideDefinition;
  index: number;
  total: number;
  previousTitle?: string;
  nextTitle?: string;
  onPrevious: () => void;
  onNext: () => void;
  children: ReactNode;
  supporting?: ReactNode;
}) {
  const isBattingPerformance = slide.section === "BATTING · PERFORMANCE";
  const isMergedBowlingSlide =
    slide.section === "BOWLING · PERFORMANCE + CONTRIBUTION";
  const isDismissalsSlide = slide.section === "DISMISSALS · KEY EVENTS";

  return (
    <article
      className="relative flex h-full min-h-0 w-full max-h-[100dvh] flex-col overflow-hidden bg-[var(--bg-surface)] md:rounded-[24px] md:border md:border-[var(--border-color)] md:shadow-[0_18px_56px_rgba(0,0,0,0.12)]"
    >
      <header
        className={cn(
          "shrink-0 px-4 pb-3 pt-3 sm:px-7 sm:pb-4 sm:pt-5 lg:px-9",
          (isBattingPerformance || isMergedBowlingSlide) &&
            "px-3 pb-2 pt-2 sm:pb-3 sm:pt-3",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <Eyebrow>{slide.section}</Eyebrow>
          <span
            className="shrink-0 text-xs font-bold tabular-nums text-[var(--text-secondary)]"
            aria-label={`Slide ${index + 1} of ${total}`}
          >
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>
        {!slide.cover ? (
          <>
            <div className={cn(slide.titleAside && "flex min-w-0 items-start justify-between gap-2")}>
              <h1
                className={cn(
                  "max-w-4xl break-words font-black leading-tight tracking-tight text-[var(--text-primary)]",
                  isBattingPerformance
                    ? "mt-1 text-xl sm:text-2xl lg:text-3xl"
                    : isMergedBowlingSlide
                      ? "mt-1 text-lg sm:text-2xl lg:text-3xl"
                      : "mt-2 text-[23px] sm:text-3xl lg:text-4xl",
                  slide.titleAside && "min-w-0 flex-1",
                )}
              >
                {slide.title}
              </h1>
              {slide.titleAside}
            </div>
            {slide.description ? (
              <p
                className={cn(
                  "max-w-4xl text-[var(--text-secondary)]",
                  isBattingPerformance
                    ? "mt-1 text-[11px] leading-4 sm:text-xs sm:leading-5"
                    : isMergedBowlingSlide
                      ? "mt-1 text-[11px] leading-4 sm:text-xs sm:leading-5"
                      : "mt-1.5 text-xs leading-5 sm:text-sm sm:leading-6",
                )}
              >
                {slide.description}
              </p>
            ) : null}
          </>
        ) : null}
      </header>

      <div className="mx-4 shrink-0 border-t border-[var(--border-color)] sm:mx-7 lg:mx-9" />

      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col justify-start overflow-hidden",
          slide.cover
            ? "px-0 py-0"
            : isBattingPerformance
              ? "px-3 py-1 sm:px-7 sm:py-2 lg:px-9"
              : "px-4 py-2 sm:px-7 sm:py-4 lg:px-9",
        )}
      >
        <div
          className={cn(
            "min-h-0 w-full",
            isDismissalsSlide
              ? "h-full overflow-x-hidden overflow-y-auto overscroll-contain md:overflow-hidden"
              : "overflow-hidden",
            slide.cover ||
              slide.section === "GAME-CHANGING MOMENTS" ||
              slide.section === "BATTING · PERFORMANCE" ||
              slide.section === "BATTING · CONTRIBUTION"
              ? "h-full"
              : "",
          )}
        >
          {children}
        </div>
      </div>

      {supporting ? (
        <aside
          className="mx-4 shrink-0 border-t border-[var(--border-color)] px-1 py-2 text-xs leading-4 text-[var(--text-secondary)] sm:mx-7 lg:mx-9"
          aria-label="Supporting information"
        >
          {supporting}
        </aside>
      ) : null}

      <nav
        className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-[var(--border-color)] px-3 py-2 md:gap-3 md:px-7 md:py-3 lg:px-9"
        aria-label="Analysis slide navigation"
      >
        <button
          type="button"
          onClick={onPrevious}
          disabled={!previousTitle}
          aria-label={previousTitle ? `Previous slide: ${previousTitle}` : "No previous slide"}
          className="inline-flex min-h-10 items-center justify-self-start gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-hover)] px-2 text-[11px] font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent-border)] disabled:cursor-not-allowed disabled:opacity-40 sm:gap-2 sm:px-4 sm:text-sm motion-reduce:transition-none"
        >
          <ChevronLeft size={17} aria-hidden="true" />
          <span>Previous</span>
        </button>
        <span className="flex min-w-0 flex-col items-center text-center leading-tight text-[var(--text-muted)]">
          <span className="max-w-[45vw] truncate text-[11px] tabular-nums sm:max-w-[45%] sm:text-xs">
            {index + 1} of {total}
          </span>
          <span className="mt-0.5 text-[7px] font-medium sm:text-[8px]">
            Synthetic values fill missing fields
          </span>
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={!nextTitle}
          aria-label={nextTitle ? `Next slide: ${nextTitle}` : "No next slide"}
          className="inline-flex min-h-10 items-center justify-self-end gap-1 rounded-lg border border-[var(--accent-border)] bg-[var(--accent-muted)] px-2 text-[11px] font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40 sm:gap-2 sm:px-4 sm:text-sm motion-reduce:transition-none"
        >
          <span>Next</span>
          <ChevronRight size={17} aria-hidden="true" />
        </button>
      </nav>

    </article>
  );
}

function StoryProgress({
  slides,
  activeSlide,
  onSelect,
}: {
  slides: SlideDefinition[];
  activeSlide: number;
  onSelect: (index: number) => void;
}) {
  return (
    <nav
      className="flex h-2 w-full shrink-0 items-center gap-1 px-2 pt-1 sm:gap-1.5 sm:px-4"
      aria-label="Post-match story progress"
    >
      {slides.map((slide, index) => (
        <button
          key={`${index}-${slide.title}`}
          type="button"
          onClick={() => onSelect(index)}
          aria-label={`Go to slide ${index + 1}: ${slide.title}`}
          aria-current={index === activeSlide ? "step" : undefined}
          className="group flex h-2 min-w-0 flex-1 items-center"
        >
          <span
            className={cn(
              "h-1 w-full rounded-full transition-colors duration-300 group-hover:brightness-125 motion-reduce:transition-none",
              index < activeSlide
                ? "bg-[var(--accent-border)]"
                : index === activeSlide
                  ? "bg-[var(--accent)]"
                  : "bg-[var(--border-color)]",
            )}
          />
        </button>
      ))}
    </nav>
  );
}

function MetricRow({
  label,
  value,
  detail,
  compact = false,
  badge,
  badgeOutcome,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  compact?: boolean;
  badge?: string;
  badgeOutcome?: "winner" | "loser";
}) {
  return (
    <div
      className={cn(
        "min-w-0 border-b border-[var(--border-color)] last:border-b-0",
        compact ? "py-1" : "py-2",
      )}
    >
      {badge ? (
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="min-w-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            {label}
          </span>
          <span
            title={badge}
            className={cn(
              "max-w-[16rem] shrink-0 truncate whitespace-nowrap rounded-full border border-transparent bg-[var(--bg-hover-2)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]",
              badgeOutcome ? getInningsOutcomeClass(badgeOutcome) : "",
            )}
          >
            {badge}
          </span>
        </div>
      ) : (
        <FieldLabel>{label}</FieldLabel>
      )}
      <Value className="text-lg sm:text-xl">{value}</Value>
      {detail ? (
        <p className="mt-1 text-xs leading-4 text-[var(--text-secondary)]">{detail}</p>
      ) : null}
    </div>
  );
}

type BatterTeamColorStyle = {
  active: string;
  badge: string;
  border: string;
  dot: string;
  tint: string;
};

const batterTeamColorStyles: Record<"green" | "cyan", BatterTeamColorStyle> = {
  green: {
    active: "border-[var(--accent-border)] bg-[var(--accent-muted)] text-[var(--text-primary)]",
    badge: "border-[var(--accent-border)] bg-[var(--accent-muted)] text-[var(--text-primary)]",
    border: "border-[var(--accent-border)]",
    dot: "bg-[var(--accent)]",
    tint: "bg-[var(--accent-muted)]",
  },
  cyan: {
    active: "border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-200",
    badge: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-200",
    border: "border-sky-500/50",
    dot: "bg-sky-500",
    tint: "bg-sky-500/5",
  },
};

function getTeamColorMap(teams: string[]) {
  const colors = new Map<string, BatterTeamColorStyle>();
  teams.forEach((team, index) => {
    colors.set(
      normalizeTeamName(team),
      index === 0 ? batterTeamColorStyles.green : batterTeamColorStyles.cyan,
    );
  });
  return colors;
}

function BatterTeamToggle({
  label,
  teams,
  selectedTeam,
  teamColors,
  onChange,
}: {
  label: string;
  teams: string[];
  selectedTeam: string;
  teamColors: ReadonlyMap<string, BatterTeamColorStyle>;
  onChange: (team: string) => void;
}) {
  return (
    <div
      role="group"
      aria-label={`${label} team`}
      className={cn(
        "grid min-w-0 gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] p-0.5",
        teams.length > 1 ? "grid-cols-2" : "grid-cols-1",
      )}
    >
      {teams.map((team) => {
        const isSelected = normalizeTeamName(team) === normalizeTeamName(selectedTeam);
        const colors = teamColors.get(normalizeTeamName(team));

        return (
          <button
            key={team}
            type="button"
            title={team}
            aria-pressed={isSelected}
            onClick={() => onChange(team)}
            className={cn(
              "flex min-w-0 w-full items-center justify-center gap-1.5 rounded-md border px-1.5 py-1 text-[9px] font-semibold leading-3 transition-colors sm:px-2 sm:py-1.5 sm:text-xs sm:leading-normal [@media(max-height:700px)]:py-0.5",
              isSelected && colors
                ? colors.active
                : "border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-hover)]",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                isSelected && colors ? colors.dot : "bg-[var(--text-muted)]",
              )}
            />
            <span className="min-w-0 truncate">{team}</span>
          </button>
        );
      })}
    </div>
  );
}

function BatterTeamPill({
  team,
  teamColors,
}: {
  team?: string;
  teamColors: ReadonlyMap<string, BatterTeamColorStyle>;
}) {
  if (!team) return null;

  const colors = teamColors.get(normalizeTeamName(team));
  if (!colors) return null;

  return (
    <span
      title={team}
      className={cn(
        "inline-flex min-w-0 max-w-full shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        colors.badge,
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", colors.dot)} />
      <span className="min-w-0 truncate">{team}</span>
    </span>
  );
}

function AvailabilityMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] p-4">
      <Info className="mt-0.5 shrink-0" size={18} style={{ color: "var(--status-warning-text)" }} />
      <p className="text-sm leading-6 text-[var(--text-secondary)]">{children}</p>
    </div>
  );
}

function formatScoreline(summary: PostMatchInningsSummary) {
  const overs = Number.isFinite(summary.totalOvers)
    ? summary.totalOvers.toFixed(summary.totalOvers % 1 === 0 ? 0 : 1)
    : "0";
  return `${summary.totalRuns}/${summary.totalWickets} (${overs} ov)`;
}

function oversToLegalBalls(overs: number) {
  const wholeOvers = Math.floor(Math.max(overs, 0));
  const partialBalls = Math.min(5, Math.round((overs - wholeOvers) * 10));
  return wholeOvers * 6 + partialBalls;
}

function demoInteger(matchId: string, key: string, minimum: number, maximum: number) {
  let hash = 2166136261;
  for (const character of `${matchId}:${key}`) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  return minimum + ((hash >>> 0) % (maximum - minimum + 1));
}

function demoExtras(matchId: string, inning: string, total: number) {
  const wides = Math.min(total, demoInteger(matchId, `${inning}:wides`, 1, 4));
  const noBalls = Math.min(total - wides, demoInteger(matchId, `${inning}:no-balls`, 0, 1));
  const byes = Math.min(total - wides - noBalls, demoInteger(matchId, `${inning}:byes`, 0, 2));
  const legByes = Math.max(0, total - wides - noBalls - byes);
  return { byes, legByes, wides, noBalls };
}

function demoBatterName(match: Match, inning: string, index: number) {
  const team = getTeamFromInnings(inning, match) ?? "Team";
  return `Demo ${team} Batter ${index + 1}`;
}

function makeDemoInnings(match: Match): PostMatchInningsSummary[] {
  const teams = getMatchTeams(match);
  const scoreRows = match.score.filter((score) => score.inning.trim());
  const rows = scoreRows.length > 0
    ? scoreRows
    : (teams.length > 0 ? teams : ["Demo Team 1", "Demo Team 2"]).slice(0, 2).map((team, index) => ({
        inning: `${team} ${index + 1}${index === 0 ? "st" : "nd"} Innings`,
        r: 0,
        w: 0,
        o: 0,
      }));
  const formatOvers = /test/i.test(match.matchType)
    ? 90
    : /odi|one.day/i.test(match.matchType)
      ? 50
      : 20;

  return rows.map((score, index) => {
    const inning = score.inning || `${teams[index % Math.max(teams.length, 1)] ?? "Demo Team"} ${index + 1} Innings`;
    const hasRecordedScore = match.matchEnded || score.r > 0 || score.w > 0 || score.o > 0;
    const totalRuns = Number.isFinite(score.r) && hasRecordedScore
      ? score.r
      : demoInteger(match.id, `${inning}:runs`, 125, formatOvers === 20 ? 195 : 320);
    const totalWickets = Number.isFinite(score.w) && hasRecordedScore
      ? score.w
      : demoInteger(match.id, `${inning}:wickets`, 4, 9);
    const totalOvers = Number.isFinite(score.o) && score.o > 0 ? score.o : formatOvers;
    const extras = demoInteger(match.id, `${inning}:extras`, 5, 13);
    const boundaryRuns = Math.round(totalRuns * (demoInteger(match.id, `${inning}:boundary-share`, 34, 48) / 100));
    const topScorerRuns = Math.round(totalRuns * 0.31);
    const supportRuns = Math.round(totalRuns * 0.44);
    const lowerOrderRuns = Math.max(0, totalRuns - topScorerRuns - supportRuns - extras);

    return {
      inning,
      totalRuns,
      totalWickets,
      totalOvers,
      runRate: totalOvers > 0 ? Number((totalRuns / totalOvers).toFixed(2)) : 0,
      extras,
      extrasPct: totalRuns > 0 ? Number(((extras / totalRuns) * 100).toFixed(2)) : 0,
      boundaryRuns,
      boundaryPct: totalRuns > 0 ? Number(((boundaryRuns / totalRuns) * 100).toFixed(2)) : 0,
      topScorerName: demoBatterName(match, inning, 0),
      topScorerRuns,
      topScorerStrikeRate: demoInteger(match.id, `${inning}:top-strike-rate`, 105, 165),
      topScorerPct: totalRuns > 0 ? Number(((topScorerRuns / totalRuns) * 100).toFixed(2)) : 0,
      supportRuns,
      supportPct: totalRuns > 0 ? Number(((supportRuns / totalRuns) * 100).toFixed(2)) : 0,
      lowerOrderRuns,
      lowerOrderPct: totalRuns > 0 ? Number(((lowerOrderRuns / totalRuns) * 100).toFixed(2)) : 0,
    };
  });
}

function summaryFromScorecard(
  match: Match,
  scorecard: Scorecard,
): PostMatchInningsSummary {
  const totalRuns = scorecard.totalRuns;
  const extras = parseScorecardExtras(scorecard.extras).total ??
    demoInteger(match.id, `${scorecard.inning}:extras`, 5, 13);
  const topBatter = [...scorecard.batting].sort((a, b) => b.r - a.r)[0];
  const demoName = demoBatterName(match, scorecard.inning, 0);
  const topScorerRuns = topBatter?.r ?? Math.round(totalRuns * 0.3);
  const boundaryRuns = scorecard.batting.reduce(
    (total, entry) => total + entry["4s"] * 4 + entry["6s"] * 6,
    0,
  );
  const supportRuns = scorecard.batting
    .filter((entry) => entry !== topBatter)
    .sort((a, b) => b.r - a.r)
    .slice(0, 2)
    .reduce((total, entry) => total + entry.r, 0);
  const lowerOrderRuns = Math.max(0, totalRuns - topScorerRuns - supportRuns - extras);

  return {
    inning: scorecard.inning,
    totalRuns,
    totalWickets: scorecard.totalWickets,
    totalOvers: scorecard.totalOvers,
    runRate: scorecard.totalOvers > 0 ? Number((totalRuns / scorecard.totalOvers).toFixed(2)) : 0,
    extras,
    extrasPct: totalRuns > 0 ? Number(((extras / totalRuns) * 100).toFixed(2)) : 0,
    boundaryRuns,
    boundaryPct: totalRuns > 0 ? Number(((boundaryRuns / totalRuns) * 100).toFixed(2)) : 0,
    topScorerName: topBatter?.batsman.name ?? demoName,
    topScorerRuns,
    topScorerStrikeRate: Number(topBatter?.sr) || 0,
    topScorerPct: totalRuns > 0 ? Number(((topScorerRuns / totalRuns) * 100).toFixed(2)) : 0,
    supportRuns,
    supportPct: totalRuns > 0 ? Number(((supportRuns / totalRuns) * 100).toFixed(2)) : 0,
    lowerOrderRuns,
    lowerOrderPct: totalRuns > 0 ? Number(((lowerOrderRuns / totalRuns) * 100).toFixed(2)) : 0,
  };
}

function makeDemoScorecard(
  match: Match,
  summary: PostMatchInningsSummary,
  source?: Scorecard,
): Scorecard {
  const demoExtraTotal = summary.extras;
  const extraValues = demoExtras(match.id, summary.inning, demoExtraTotal);
  const generatedExtras =
    `b ${extraValues.byes}, lb ${extraValues.legByes}, w ${extraValues.wides}, nb ${extraValues.noBalls} (${demoExtraTotal})`;
  const teams = getMatchTeams(match);
  const battingTeam = getTeamFromInnings(summary.inning, match);
  const bowlingTeam = teams.find((team) => normalizeTeamName(team) !== normalizeTeamName(battingTeam ?? ""));
  const demoDismissal = `c Demo ${bowlingTeam ?? "Team"} Fielder b Demo ${bowlingTeam ?? "Team"} Bowler 1`;
  const sourceHasAllExtras = source
    ? parseScorecardExtras(source.extras).categories.every((category) => category.value !== null)
    : false;
  const missingRuns = Math.max(0, summary.totalRuns - demoExtraTotal);
  const weights = [0.31, 0.24, 0.19, 0.15, 0.11];
  const generatedBatting = weights.map((weight, index) => {
    const runs = index === weights.length - 1
      ? Math.max(0, missingRuns - weights.slice(0, index).reduce((sum, item) => sum + Math.round(missingRuns * item), 0))
      : Math.round(missingRuns * weight);
    const sixes = Math.floor(runs / 24);
    const fours = Math.floor(Math.max(0, runs - sixes * 6) / 8);
    const balls = Math.max(1, Math.round(runs / (demoInteger(match.id, `${summary.inning}:batter:${index}:rate`, 90, 160) / 100)));
    const strikeRate = Number(((runs / balls) * 100).toFixed(2));
    return {
      batsman: { id: `demo-${match.id}-${summary.inning}-${index}`, name: demoBatterName(match, summary.inning, index) },
      dismissal: index < summary.totalWickets ? demoDismissal : "not out",
      r: runs,
      b: balls,
      "4s": fours,
      "6s": sixes,
      sr: String(strikeRate),
    };
  });
  const batting = source?.batting.length ? [...source.batting] : generatedBatting;
  const existingDismissals = batting.filter(
    (entry) => entry.dismissal.trim() && !/not out|retired hurt|did not bat|^-$|^batting$/i.test(entry.dismissal.trim()),
  ).length;
  for (let index = existingDismissals; index < Math.min(summary.totalWickets, 10); index += 1) {
    batting.push({
      batsman: {
        id: `demo-${match.id}-${summary.inning}-dismissal-${index}`,
        name: demoBatterName(match, summary.inning, index),
      },
      dismissal: demoDismissal,
      r: 0,
      b: 0,
      "4s": 0,
      "6s": 0,
      sr: "0",
    });
  }

  const bowlers = source?.bowling.length
    ? [...source.bowling]
    : Array.from({ length: 5 }, (_, index) => {
        const overs = Math.max(1, Math.ceil(summary.totalOvers / 5));
        const totalConceded = Math.max(0, summary.totalRuns - extraValues.byes - extraValues.legByes);
        const baseRuns = Math.floor(totalConceded / 5);
        const runs = baseRuns + (index < totalConceded % 5 ? 1 : 0);
        const baseWickets = Math.floor(summary.totalWickets / 5);
        const wickets = baseWickets + (index < summary.totalWickets % 5 ? 1 : 0);
        return {
          bowler: {
            id: `demo-${match.id}-${summary.inning}-bowler-${index}`,
            name: `Demo ${bowlingTeam ?? "Team"} Bowler ${index + 1}`,
          },
          o: overs,
          m: 0,
          r: runs,
          w: wickets,
          eco: String(Number((runs / overs).toFixed(2))),
        };
      });

  return {
    batting,
    bowling: bowlers,
    extras: source && sourceHasAllExtras ? source.extras : generatedExtras,
    totalRuns: source?.totalRuns ?? summary.totalRuns,
    totalWickets: source?.totalWickets ?? summary.totalWickets,
    totalOvers: source?.totalOvers ?? summary.totalOvers,
    inning: source?.inning || summary.inning,
  };
}

function makeDemoOverSummaries(
  match: Match,
  summary: PostMatchInningsSummary | undefined,
): PostMatchOverSummary[] {
  if (!summary) return [];
  const team = getTeamFromInnings(summary.inning, match) ?? getMatchTeams(match)[0] ?? "Demo Team";
  const overCount = Math.max(1, Math.ceil(summary.totalOvers || 20));
  const wicketsByOver = Array.from({ length: overCount }, () => 0);
  for (let index = 0; index < summary.totalWickets; index += 1) {
    const over = demoInteger(match.id, `${summary.inning}:wicket-over:${index}`, 0, overCount - 1);
    wicketsByOver[over] += 1;
  }

  let priorRuns = 0;
  let priorWickets = 0;
  const totalLegalBalls = oversToLegalBalls(summary.totalOvers);
  return Array.from({ length: overCount }, (_, over) => {
    const cumulativeRuns = over === overCount - 1
      ? summary.totalRuns
      : Math.round((summary.totalRuns * (over + 1)) / overCount);
    const wickets = wicketsByOver[over];
    priorWickets += wickets;
    const runs = cumulativeRuns - priorRuns;
    priorRuns = cumulativeRuns;
    const legalBalls = Math.max(0, Math.min(6, totalLegalBalls - over * 6));
    return {
      id: `demo-${match.id}-${summary.inning}-over-${over}`,
      inning: summary.inning,
      team,
      over,
      phase: over < overCount / 3 ? "Powerplay" : over < (overCount * 2) / 3 ? "Middle" : "Death",
      runs,
      wickets,
      legalBalls,
      cumulativeRuns,
      cumulativeWickets: Math.min(priorWickets, summary.totalWickets),
      runRate: legalBalls > 0 ? Number(((runs / legalBalls) * 6).toFixed(2)) : 0,
      leverage: 0,
      note: "Synthetic presentation value; not recorded delivery data.",
    };
  });
}

function mergePresentationBattingLeaders(
  scorecards: Scorecard[],
  source: PostMatchBattingLeader[],
): PostMatchBattingLeader[] {
  const leaders = [...source];
  for (const scorecard of scorecards) {
    const teamRuns = scorecard.batting.reduce((total, entry) => total + entry.r, 0);
    for (const entry of scorecard.batting) {
      if (leaders.some((leader) =>
        normalizeTeamName(leader.name) === normalizeTeamName(entry.batsman.name) &&
        normalizeTeamName(leader.inning) === normalizeTeamName(scorecard.inning),
      )) continue;
      leaders.push({
        name: entry.batsman.name,
        inning: scorecard.inning,
        runs: entry.r,
        balls: entry.b,
        strikeRate: Number(entry.sr) || 0,
        fours: entry["4s"],
        sixes: entry["6s"],
        boundaryPct: entry.r > 0 ? ((entry["4s"] * 4 + entry["6s"] * 6) / entry.r) * 100 : 0,
        sharePct: teamRuns > 0 ? (entry.r / teamRuns) * 100 : 0,
      });
    }
  }
  return leaders;
}

function mergePresentationBowlingLeaders(
  scorecards: Scorecard[],
  source: PostMatchBowlingLeader[],
): PostMatchBowlingLeader[] {
  const leaders = [...source];
  for (const scorecard of scorecards) {
    for (const entry of scorecard.bowling) {
      if (leaders.some((leader) =>
        normalizeTeamName(leader.name) === normalizeTeamName(entry.bowler.name) &&
        normalizeTeamName(leader.inning) === normalizeTeamName(scorecard.inning),
      )) continue;
      const balls = oversToLegalBalls(entry.o);
      leaders.push({
        name: entry.bowler.name,
        inning: scorecard.inning,
        wickets: entry.w,
        overs: entry.o,
        maidens: entry.m,
        runsConceded: entry.r,
        economy: Number(entry.eco) || (entry.o > 0 ? entry.r / entry.o : 0),
        ballsPerWicket: entry.w > 0 ? balls / entry.w : null,
      });
    }
  }
  return leaders;
}

function makeBatterData(
  summary: PostMatchInningsSummary | null,
  scorecard: Scorecard | undefined,
  reportBatters: PostMatchBattingLeader[],
): BatterData[] {
  if (scorecard) {
    const teamRuns = scorecard.batting.reduce((total, entry) => total + entry.r, 0);
    return scorecard.batting.map((entry) => {
      return {
        name: entry.batsman.name,
        inning: scorecard.inning,
        runs: entry.r,
        balls: entry.b,
        strikeRate: Number(entry.sr) || 0,
        fours: entry["4s"],
        sixes: entry["6s"],
        boundaryPct:
          entry.r > 0 ? ((entry["4s"] * 4 + entry["6s"] * 6) / entry.r) * 100 : 0,
        sharePct: teamRuns > 0 ? (entry.r / teamRuns) * 100 : 0,
      };
    });
  }

  if (!summary) return [];
  return reportBatters.filter(
    (batter) => batter.inning.toLowerCase() === summary.inning.toLowerCase(),
  );
}

const extrasCategories = [
  { code: "b", label: "Byes", bar: "bg-sky-400/80", dot: "bg-sky-400" },
  { code: "lb", label: "Leg Byes", bar: "bg-emerald-500/80", dot: "bg-emerald-500" },
  { code: "w", label: "Wides", bar: "bg-amber-400/80", dot: "bg-amber-400" },
  { code: "nb", label: "No-balls", bar: "bg-violet-400/80", dot: "bg-violet-400" },
] as const;

function parseScorecardExtras(extras: string | undefined) {
  const categories = extrasCategories.map((category) => {
    const categoryMatch = extras
      ? new RegExp(`\\b${category.code}\\s*(\\d+)\\b`, "i").exec(extras)
      : null;
    return { ...category, value: categoryMatch ? Number(categoryMatch[1]) : null };
  });
  const apiTotal = extras ? /\((\d+)\)\s*$/.exec(extras) : null;
  const allCategoriesAvailable = categories.every((category) => category.value !== null);
  const categoryTotal = allCategoriesAvailable
    ? categories.reduce((total, category) => total + (category.value ?? 0), 0)
    : null;

  return {
    categories,
    total: apiTotal ? Number(apiTotal[1]) : categoryTotal,
  };
}

function scorecardDismissals(scorecard: Scorecard | undefined) {
  return scorecard?.batting.filter(
    (entry) =>
      entry.dismissal.trim() &&
      !/not out|retired hurt|did not bat|^-$|^batting$/i.test(entry.dismissal.trim()),
  ) ?? [];
}

function dismissalDisplayValue(value: string | null | undefined) {
  const trimmed = value?.trim();
  return !trimmed || /unavailable/i.test(trimmed) ? "-" : trimmed;
}

function buildMoments(report: PostMatchEdaReport): MomentData[] {
  const moments: MomentData[] = [];
  const analytics = report.retrospective.summaryAnalytics;
  const provenance = report.sources
    .filter((source) => source.type === "sportmonks" || source.type === "historical_warehouse")
    .map((source) => `${source.title}: ${source.note}`);

  for (const inning of analytics?.innings ?? []) {
    const over = inning.highestImpactOver;
    if (!over) continue;
    moments.push({
      title: `Highest-impact over · ${inning.team}`,
      context: `${inning.inning} · ${over.phase} · over ${over.over + 1}`,
      impact: "Not provided",
      runs: String(over.runs),
      wickets: String(over.wickets),
      players: "Not identified in the over summary",
      interpretation: over.note,
      provenance: [
        `Leverage index: ${over.leverage}. The report does not provide a separate impact score.`,
        ...provenance,
      ],
    });
  }

  const partnerships = analytics?.innings.flatMap((inning) => inning.topPartnerships) ?? [];
  if (
    analytics?.decisivePartnership &&
    !partnerships.some((partnership) => partnership.id === analytics.decisivePartnership?.id)
  ) {
    partnerships.push(analytics.decisivePartnership);
  }
  for (const partnership of partnerships) {
    moments.push({
      title: `Partnership · ${partnership.pair}`,
      context: `${partnership.team} · ${partnership.inning} · wicket ${partnership.wicketNumber}`,
      impact: "Not provided",
      runs: String(partnership.runs),
      wickets: String(partnership.wicketNumber),
      players: partnership.pair,
      interpretation: partnership.note,
      provenance,
    });
  }

  const collapses = analytics?.innings.flatMap((inning) => inning.collapsePeriods) ?? [];
  if (
    analytics?.biggestCollapse &&
    !collapses.some((collapse) => collapse.id === analytics.biggestCollapse?.id)
  ) {
    collapses.push(analytics.biggestCollapse);
  }
  for (const collapse of collapses) {
    moments.push({
      title: `Collapse · ${collapse.wickets} wickets`,
      context: `${collapse.team} · ${collapse.inning} · overs ${collapse.startOver + 1}–${collapse.endOver + 1}`,
      impact: "Not provided",
      runs: String(collapse.runs),
      wickets: String(collapse.wickets),
      players: "Not identified in the collapse summary",
      interpretation: collapse.note,
      provenance,
    });
  }

  for (const highlight of analytics?.narrativeHighlights ?? []) {
    moments.push({
      title: "Retrospective highlight",
      context: "Report-supported match narrative",
      impact: "Not provided",
      runs: "Not itemized",
      wickets: "Not itemized",
      players: "Not specified",
      interpretation: highlight,
      provenance,
    });
  }

  return moments;
}

function MomentContent({ moment }: { moment: MomentData }) {
  return (
    <div className="flex min-h-0 flex-col gap-2">
      <Panel className="p-3 sm:p-4">
        <p className="text-sm font-bold text-[var(--text-primary)]">{moment.context}</p>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
          <MetricRow label="Impact score" value={moment.impact} compact />
          <MetricRow label="Runs involved" value={moment.runs} compact />
          <MetricRow label="Wickets involved" value={moment.wickets} compact />
          <MetricRow label="Players" value={moment.players} compact />
        </div>
      </Panel>

      <Panel className="p-3 sm:p-4">
        <FieldLabel>INTERPRETATION</FieldLabel>
        <p className="mt-1 text-sm leading-5 text-[var(--text-primary)]">
          {moment.interpretation}
        </p>
      </Panel>

      {moment.provenance.length > 0 ? (
        <DetailOverlay label="Evidence and provenance" title="Moment evidence and provenance">
          <ul className="space-y-2">
            {moment.provenance.map((item, index) => (
              <li key={`${index}-${item}`} className="text-sm leading-5 text-[var(--text-secondary)]">
                {item}
              </li>
            ))}
          </ul>
        </DetailOverlay>
      ) : null}
    </div>
  );
}

function InningsPicker({
  innings,
  value,
  onChange,
}: {
  innings: PostMatchInningsSummary[];
  value: number;
  onChange: (value: number) => void;
}) {
  if (innings.length < 2) return null;
  return (
    <label className="flex min-w-0 flex-col gap-2 text-sm font-semibold text-[var(--text-secondary)] sm:flex-row sm:items-center sm:gap-3">
      Analysis innings
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="min-h-11 min-w-0 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] px-3 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
      >
        {innings.map((summary, index) => (
          <option key={summary.inning} value={index}>
            {summary.inning}
          </option>
        ))}
      </select>
    </label>
  );
}

function MatchStoryIntro({
  match,
  report,
  momentCount,
}: {
  match: Match;
  report: PostMatchEdaReport;
  momentCount: number;
}) {
  return (
    <Panel className="h-full">
      <Eyebrow>{report.intel.headline}</Eyebrow>
      <p className="mt-4 max-w-4xl text-lg leading-8 text-[var(--text-primary)] sm:text-xl">
        {report.retrospective.summary || report.intel.summary}
      </p>
      {report.intel.turningPoints.length > 0 ? (
        <div className="mt-3 border-t border-[var(--border-color)] pt-2">
          <DetailOverlay
            label={`View ${report.intel.turningPoints.length} reported turning points`}
            title="Reported turning points"
          >
            <ol className="divide-y divide-[var(--border-color)]">
            {report.intel.turningPoints.map((point, index) => (
              <li
                key={`${index}-${point}`}
                className="flex gap-3 py-2 text-sm leading-5 text-[var(--text-secondary)]"
              >
                <span className="font-bold tabular-nums" style={{ color: "var(--accent)" }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{point}</span>
              </li>
            ))}
            </ol>
          </DetailOverlay>
        </div>
      ) : null}
      <p className="mt-3 border-t border-[var(--border-color)] pt-2 text-xs leading-5 text-[var(--text-secondary)]">
        <span className="font-semibold text-[var(--text-primary)]">Match context:</span>{" "}
        {match.matchType} · {match.venue || "Venue not supplied"} · {match.status || "Pending"} ·{" "}
        {formatDate(match.dateTimeGMT || match.date)} · {momentCount} event-specific moments
      </p>
    </Panel>
  );
}

function normalizeTeamName(team: string) {
  return team.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function getMatchTeams(match: Match) {
  const names = match.teamInfo.map((team) => team.name.trim()).filter(Boolean);
  for (const team of match.teams) {
    const alreadyRepresented = match.teamInfo.some(
      (teamInfo) =>
        normalizeTeamName(teamInfo.name) === normalizeTeamName(team) ||
        normalizeTeamName(teamInfo.shortname) === normalizeTeamName(team),
    );
    if (!alreadyRepresented) names.push(team.trim());
  }

  return [...new Map(names.map((team) => [normalizeTeamName(team), team.trim()])).values()];
}

function getTeamFromInnings(inning: string, match: Match) {
  const normalizedInning = normalizeTeamName(inning);
  const matches = getMatchTeams(match).filter((team) => {
    const teamInfo = match.teamInfo.find(
      (candidate) => normalizeTeamName(candidate.name) === normalizeTeamName(team),
    );
    const aliases = [team, teamInfo?.shortname].filter(
      (alias): alias is string => Boolean(alias?.trim()),
    );

    return aliases.some((alias) => {
      const normalizedAlias = normalizeTeamName(alias);
      return (
        normalizedInning === normalizedAlias ||
        normalizedInning.startsWith(`${normalizedAlias} `) ||
        normalizedInning.includes(` ${normalizedAlias} `) ||
        normalizedInning.endsWith(` ${normalizedAlias}`)
      );
    });
  });

  return matches.length === 1 ? matches[0] : undefined;
}

function getBowlerTeam(inning: string, match: Match) {
  const battingTeam = getTeamFromInnings(inning, match);
  const teams = getMatchTeams(match);

  if (!battingTeam || teams.length !== 2) return undefined;
  return teams.find((team) => normalizeTeamName(team) !== normalizeTeamName(battingTeam));
}

function getVerifiedWinner(match: Match, report: PostMatchEdaReport) {
  if (!match.matchEnded) return undefined;

  const winnerValue = report.retrospective.matchSummaryCards
    .find((card) => card.id === "match-winner")
    ?.value.trim();
  if (!winnerValue) return undefined;

  return getMatchTeams(match).find((team) => {
    const teamInfo = match.teamInfo.find(
      (candidate) => normalizeTeamName(candidate.name) === normalizeTeamName(team),
    );
    return [team, teamInfo?.shortname].some(
      (alias) => alias && normalizeTeamName(alias) === normalizeTeamName(winnerValue),
    );
  });
}

function getTeamOutcome(
  team: string | undefined,
  match: Match,
  report: PostMatchEdaReport,
): "winner" | "loser" | undefined {
  const winner = getVerifiedWinner(match, report);
  const teams = getMatchTeams(match);
  if (!team || !winner || teams.length !== 2) return undefined;

  const normalizedTeam = normalizeTeamName(team);
  if (!teams.some((candidate) => normalizeTeamName(candidate) === normalizedTeam)) {
    return undefined;
  }
  return normalizedTeam === normalizeTeamName(winner) ? "winner" : "loser";
}

function getInningsOutcome(
  summary: PostMatchInningsSummary,
  match: Match,
  report: PostMatchEdaReport,
): "winner" | "loser" | undefined {
  const winner = getVerifiedWinner(match, report);
  const battingTeam = getTeamFromInnings(summary.inning, match);
  const teams = getMatchTeams(match);

  if (!winner || !battingTeam || teams.length !== 2) return undefined;
  if (normalizeTeamName(battingTeam) === normalizeTeamName(winner)) return "winner";
  return teams.some((team) => normalizeTeamName(team) === normalizeTeamName(battingTeam))
    ? "loser"
    : undefined;
}

function getInningsOutcomeClass(outcome: "winner" | "loser" | undefined) {
  if (outcome === "winner") {
    return "border-emerald-500/55 shadow-[0_0_16px_rgba(16,185,129,0.16)]";
  }
  if (outcome === "loser") {
    return "border-rose-500/55 shadow-[0_0_16px_rgba(244,63,94,0.14)]";
  }
  return "";
}

function MatchOverviewContent({
  summaries,
  match,
  report,
}: {
  summaries: PostMatchInningsSummary[];
  match: Match;
  report: PostMatchEdaReport;
}) {
  const maxRuns = Math.max(...summaries.map((summary) => summary.totalRuns), 1);

  return (
    <div>
      {summaries.length === 0 ? (
        <AvailabilityMessage>
          No innings totals are available in the post-match report. See Analysis Availability for
          the report&apos;s data-source and readiness details.
        </AvailabilityMessage>
      ) : (
        <Panel className="p-3 sm:p-5">
          <FieldLabel>INNINGS COMPARISON</FieldLabel>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {summaries.map((summary, index) => (
              <div
                key={summary.inning}
                className={cn(
                  "rounded-xl border border-transparent bg-[var(--bg-hover)] p-3",
                  getInningsOutcomeClass(getInningsOutcome(summary, match, report)),
                )}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <div>
                    <FieldLabel>{`INNINGS ${index + 1}`}</FieldLabel>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {summary.inning}
                    </p>
                  </div>
                  <p className="text-lg font-bold tabular-nums text-[var(--text-primary)]">
                    {formatScoreline(summary)}
                  </p>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <FieldLabel>Wickets</FieldLabel>
                    <p className="mt-1 font-bold text-[var(--text-primary)]">{summary.totalWickets}</p>
                  </div>
                  <div>
                    <FieldLabel>Deliveries</FieldLabel>
                    <p className="mt-1 font-bold text-[var(--text-primary)]">{oversToLegalBalls(summary.totalOvers)}</p>
                  </div>
                  <div>
                    <FieldLabel>Run rate</FieldLabel>
                    <p className="mt-1 font-bold text-[var(--text-primary)]">{summary.runRate}</p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--bg-hover-2)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${Math.max(1, (summary.totalRuns / maxRuns) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

function momentDisplayValue(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return !text || /unavailable/i.test(text) ? "-" : text;
}

function hasMomentValue(value: string | number | null | undefined) {
  return momentDisplayValue(value) !== "-";
}

function momentPlayerNamesMatch(left: string, right: string) {
  const leftParts = normalizeTeamName(left).split(" ");
  const rightParts = normalizeTeamName(right).split(" ");
  return (
    leftParts.join(" ") === rightParts.join(" ") ||
    (leftParts.length > 1 &&
      rightParts.length > 1 &&
      leftParts[0]?.[0] === rightParts[0]?.[0] &&
      leftParts[leftParts.length - 1] === rightParts[rightParts.length - 1])
  );
}

function getMomentPlayers(
  name: string,
  inning: string | undefined,
  scorecards: Scorecard[] | null | undefined,
) {
  const scorecard = scorecards?.find(
    (item) => normalizeTeamName(item.inning) === normalizeTeamName(inning ?? ""),
  );
  const batter = scorecard?.batting.find(
    (entry) => momentPlayerNamesMatch(entry.batsman.name, name),
  );
  const bowlerMention = /\bb\s+(.+)$/i.exec(batter?.dismissal ?? "")?.[1]?.trim();
  const mentionedBowler = bowlerMention ? normalizeTeamName(bowlerMention) : "";
  const bowler = mentionedBowler
    ? scorecard?.bowling.find(({ bowler: entry }) => {
        const normalizedName = normalizeTeamName(entry.name);
        return (
          normalizedName === mentionedBowler ||
          normalizedName.endsWith(` ${mentionedBowler}`) ||
          mentionedBowler.endsWith(` ${normalizedName}`)
        );
      })?.bowler.name
    : undefined;
  const dismissal = batter?.dismissal.trim();
  const supportingContext =
    dismissal && !/unavailable|^-$|^batting$/i.test(dismissal)
      ? dismissal
      : "Synthetic presentation context; dismissal detail was not returned by the source.";

  return {
    players: [
      { name, role: "batter" },
      { name: bowler ?? "Demo Bowler", role: "bowler" },
    ],
    supportingContext,
  };
}

function EvidenceGameChangingMomentCard({
  moment,
  rank,
  teamColors,
  className,
}: {
  moment: RankedGameChangingMoment;
  rank: number;
  teamColors: ReadonlyMap<string, BatterTeamColorStyle>;
  className?: string;
}) {
  const teamColor = moment.team
    ? teamColors.get(normalizeTeamName(moment.team))
    : undefined;
  const playerValue = moment.players
    ?.map((player) => `${player.name} (${player.role})`)
    .join(", ") || "-";
  const stats = [
    { label: "RUNS INVOLVED", value: moment.runs },
    { label: "WICKETS INVOLVED", value: moment.wickets },
    { label: "PLAYERS", value: playerValue },
  ];

  return (
    <article
      className={cn(
        "h-auto min-w-0 self-start rounded-xl border border-[var(--border-color)] bg-[var(--bg-hover)] p-1.5 shadow-sm sm:p-3 [@media(max-height:700px)]:p-1.5",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-1.5">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-black/25 text-[10px] font-black tabular-nums text-[var(--text-primary)] sm:size-7 sm:text-xs">
          {rank}
        </span>
        <h2 className="line-clamp-2 min-w-0 flex-1 break-words text-[11px] font-bold leading-[14px] text-[var(--text-primary)] sm:text-sm sm:leading-5">
          {momentDisplayValue(moment.title)}
        </h2>
        <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-semibold leading-3 text-amber-800 dark:text-amber-200 sm:px-2 sm:py-1 sm:text-[10px]">
          Impact score {momentDisplayValue(moment.impactScore)}
        </span>
      </div>

      <p className="mt-1 min-w-0 break-words text-[8px] leading-3 text-[var(--text-secondary)] sm:text-[10px] sm:leading-4">
        Innings {momentDisplayValue(moment.innings)} · Team{" "}
        <span className="inline-flex min-w-0 items-center gap-1 align-middle">
          {moment.team ? (
            <span
              aria-hidden="true"
              className={`size-1.5 shrink-0 rounded-full ${teamColor?.dot ?? "bg-[var(--text-muted)]"}`}
            />
          ) : null}
          <span className="break-words">{momentDisplayValue(moment.team)}</span>
        </span>
        {" · "}Over {momentDisplayValue(moment.over)} · source position{" "}
        {momentDisplayValue(moment.sourcePosition)} · event {momentDisplayValue(moment.event)}
      </p>

      <dl className="mt-1 grid grid-cols-2 gap-1 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              "min-w-0 rounded-md border border-[var(--border-color)] bg-[var(--bg-inset)] px-1.5 py-0 sm:px-2 sm:py-1",
              stat.label === "PLAYERS" && "col-span-2 sm:col-span-1",
            )}
          >
            <dt className="text-[7px] font-semibold leading-[8px] text-[var(--text-muted)] sm:text-[9px] sm:leading-3">
              {stat.label}
            </dt>
            <dd className="break-words text-[9px] font-bold leading-[10px] text-[var(--text-primary)] sm:text-xs sm:leading-4">
              {momentDisplayValue(stat.value)}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-1 break-words text-[9px] leading-3 text-[var(--text-secondary)] sm:text-xs sm:leading-4">
        {momentDisplayValue(moment.description)}
      </p>
      {moment.supportingContext ? (
        <div className="mt-1 rounded-md border border-[var(--border-color)] bg-[var(--bg-inset)] px-1.5 py-0.5 sm:px-2 sm:py-1">
          <p className="text-[7px] font-semibold uppercase tracking-wide text-[var(--text-muted)] sm:text-[8px]">
            Supporting context
          </p>
          <p className="break-words text-[8px] leading-3 text-[var(--text-secondary)] sm:text-[10px] sm:leading-4">
            {moment.supportingContext}
          </p>
        </div>
      ) : null}
    </article>
  );
}

function RankedGameChangingMomentsContent({
  moments,
  teamColors,
}: {
  moments: RankedGameChangingMoment[];
  teamColors: ReadonlyMap<string, BatterTeamColorStyle>;
}) {
  const topMoments = moments.slice(0, 3);
  const columns =
    topMoments.length === 1
      ? "grid-cols-1"
      : topMoments.length === 2
        ? "grid-cols-1 md:grid-cols-2"
        : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";

  return topMoments.length > 0 ? (
    <div className={`grid min-h-0 items-start gap-1 sm:gap-2 ${columns}`}>
      {topMoments.map((moment, index) => (
        <EvidenceGameChangingMomentCard
          key={`${index}-${moment.title}-${moment.event ?? "-"}`}
          moment={moment}
          rank={index + 1}
          teamColors={teamColors}
          className={
            topMoments.length === 3 && index === 2
              ? "md:col-span-2 xl:col-span-1"
              : undefined
          }
        />
      ))}
    </div>
  ) : (
    <AvailabilityMessage>No game-changing moments are available.</AvailabilityMessage>
  );
}

function GameChangingMomentsFooter({
  report,
  evidenceMode,
}: {
  report: PostMatchEdaReport;
  evidenceMode: boolean;
}) {
  const source =
    report.sources.find((item) => item.type === "historical_warehouse") ??
    report.sources.find((item) => item.type === "sportmonks");
  const qualityNote =
    report.retrospective.warnings[0] ??
    report.confidence.reasons[0] ??
    report.freshness.notes[0];
  const notes = [
    evidenceMode
      ? "Observed event evidence; not a historical baseline."
      : "Report-supplied descriptions; no evidence-ranked impact scores.",
    source ? `Source: ${source.title}${source.note ? ` — ${source.note}` : ""}` : null,
    qualityNote ? `Data quality: ${qualityNote}` : null,
  ].filter((note): note is string => Boolean(note));

  return <p className="line-clamp-2 break-words">{notes.join(" · ")}</p>;
}

function MatchLeadersContent({
  battingLeaders,
  bowlingLeaders,
}: {
  battingLeaders: PostMatchBattingLeader[];
  bowlingLeaders: PostMatchBowlingLeader[];
}) {
  const topBatter = [...battingLeaders].sort((left, right) => right.runs - left.runs)[0];
  const topBowler = [...bowlingLeaders].sort((left, right) => {
    if (right.wickets !== left.wickets) return right.wickets - left.wickets;
    return left.runsConceded - right.runsConceded;
  })[0];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Panel className="p-3 sm:p-5">
        <FieldLabel>HIGHEST INDIVIDUAL SCORE</FieldLabel>
        {topBatter ? (
          <>
            <Value>{`${topBatter.name} · ${topBatter.runs}`}</Value>
            <Note>{`${topBatter.inning} · ${topBatter.balls} balls faced`}</Note>
          </>
        ) : <Note>Unavailable in the scorecards.</Note>}
      </Panel>
      <Panel className="p-3 sm:p-5">
        <FieldLabel>BEST BOWLING FIGURES</FieldLabel>
        {topBowler ? (
          <>
            <Value>{`${topBowler.name} · ${topBowler.wickets}/${topBowler.runsConceded}`}</Value>
            <Note>{`${topBowler.inning} · ${topBowler.overs} overs · economy ${topBowler.economy}`}</Note>
          </>
        ) : <Note>Unavailable in the scorecards.</Note>}
      </Panel>
    </div>
  );
}

function ReportCardsContent({
  cards,
  groupIndex,
}: {
  cards: PostMatchEdaCard[];
  groupIndex: number;
}) {
  const visibleCards = cards.slice(groupIndex * 2, groupIndex * 2 + 2);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {visibleCards.map((card) => (
        <Panel key={card.id} className="p-3 sm:p-4">
          <FieldLabel>{card.label}</FieldLabel>
          <Value>{card.value}</Value>
          <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">{card.insight}</p>
          {card.subValue ? (
            <p className="mt-2 text-xs leading-4 text-[var(--text-secondary)]">{card.subValue}</p>
          ) : null}
          {card.quality ? (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-[var(--border-color)] pt-2 text-xs text-[var(--text-muted)]">
              {card.quality.provenance ? <span>Source: {card.quality.provenance}</span> : null}
              {card.quality.sampleSize != null ? <span>Sample: {card.quality.sampleSize}</span> : null}
              {card.quality.confidence ? <span>Confidence: {card.quality.confidence}</span> : null}
              {card.quality.warning ? (
                <span className="w-full" style={{ color: "var(--status-warning-text)" }}>
                  {card.quality.warning}
                </span>
              ) : null}
            </div>
          ) : null}
        </Panel>
      ))}
    </div>
  );
}

function RetrospectiveDetailsContent({ report }: { report: PostMatchEdaReport }) {
  const highlights = report.retrospective.summaryAnalytics?.narrativeHighlights ?? [];
  const swings = report.retrospective.biggestSwings;
  const reviewNotes = report.retrospective.recommendationReviewNotes;
  const ratings = report.retrospective.ratings;
  const detailGroups = [
    { label: `Narrative highlights (${highlights.length})`, title: "Narrative highlights", items: highlights },
    { label: `Biggest swings (${swings.length})`, title: "Biggest match swings", items: swings },
    { label: `Review notes (${reviewNotes.length})`, title: "Recommendation review notes", items: reviewNotes },
  ].filter((group) => group.items.length > 0);

  return (
    <div className="flex min-h-0 flex-col gap-3">
      {ratings.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ratings.map((rating) => (
            <Panel key={rating.label} className="p-3">
              <FieldLabel>{rating.label}</FieldLabel>
              <Value>{rating.score}</Value>
              <p className="mt-1 text-xs leading-4 text-[var(--text-secondary)]">{rating.insight}</p>
            </Panel>
          ))}
        </div>
      ) : (
        <AvailabilityMessage>No retrospective ratings were returned.</AvailabilityMessage>
      )}
      <div className="flex flex-wrap gap-3">
        {detailGroups.map((group) => (
          <DetailOverlay key={group.title} label={group.label} title={group.title}>
            <ul className="space-y-2">
              {group.items.map((item, index) => (
                <li key={`${index}-${item}`} className="text-sm leading-5 text-[var(--text-secondary)]">
                  {item}
                </li>
              ))}
            </ul>
          </DetailOverlay>
        ))}
      </div>
    </div>
  );
}

function batterRecordKey(batter: BatterData) {
  return `${normalizeTeamName(batter.inning)}::${batter.name.trim().toLowerCase()}`;
}

function getBatterShortName(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? `${parts[0].charAt(0)}. ${parts.slice(1).join(" ")}`
    : name;
}

type BattingPerformanceMetric = {
  label: string;
  value: string;
  detail: string;
  rawValue?: number;
  direction?: "higher" | "lower";
};

type BatterComparisonValue = {
  value: string;
  shortName: string;
  teamDotClass?: string;
};

type BetterMetricSide = "primary" | "comparison";

function getBetterMetricSide(
  primary: BattingPerformanceMetric,
  comparison: BattingPerformanceMetric,
): BetterMetricSide | undefined {
  if (
    !primary.direction ||
    primary.direction !== comparison.direction ||
    primary.value === "Unavailable" ||
    comparison.value === "Unavailable" ||
    primary.rawValue === undefined ||
    comparison.rawValue === undefined ||
    !Number.isFinite(primary.rawValue) ||
    !Number.isFinite(comparison.rawValue) ||
    primary.rawValue === comparison.rawValue
  ) {
    return undefined;
  }

  const primaryWins =
    primary.direction === "higher"
      ? primary.rawValue > comparison.rawValue
      : primary.rawValue < comparison.rawValue;

  return primaryWins ? "primary" : "comparison";
}

function getMetricValueClass(value: string, comparisonMode = false) {
  const isLongValue = value === "Unavailable" || value.length > 12;
  const valueSizeClass = isLongValue
    ? "text-[clamp(8px,0.75vw,12px)] leading-tight [@media(max-height:700px)]:text-[clamp(7px,0.65vw,10px)]"
    : comparisonMode
      ? "text-[clamp(16px,1.15vw,20px)] leading-tight [@media(max-height:700px)]:text-[clamp(14px,1vw,18px)]"
      : "text-[clamp(16px,1.25vw,24px)] leading-tight [@media(max-height:700px)]:text-[clamp(14px,1vw,18px)]";

  return cn(
    "min-w-0 break-words text-center font-black tabular-nums tracking-tight text-[var(--text-primary)] [overflow-wrap:anywhere]",
    valueSizeClass,
  );
}

function BatterComparisonValue({
  value,
  shortName,
  teamDotClass,
  valueClassName,
  highlighted,
}: BatterComparisonValue & {
  valueClassName: string;
  highlighted: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 min-w-0 w-full flex-col items-center justify-center rounded-md border px-0.5 py-0.5",
        highlighted
          ? "border-emerald-500/70 bg-emerald-500/10 shadow-[0_0_8px_rgba(34,197,94,0.2)]"
          : "border-transparent bg-transparent",
      )}
    >
      <span className="flex min-w-0 max-w-full items-center gap-1 text-[8px] font-semibold leading-[9px] text-[var(--text-secondary)] [@media(max-height:700px)]:text-[7px] [@media(max-height:700px)]:leading-[8px]">
        {teamDotClass ? (
          <span
            aria-hidden="true"
            className={cn("size-1.5 shrink-0 rounded-full", teamDotClass)}
          />
        ) : null}
        <span className="min-w-0 truncate">{shortName}</span>
      </span>
      <p className={cn(valueClassName, highlighted ? "font-black" : "font-semibold")}>
        {value}
      </p>
    </div>
  );
}

function BattingPerformanceMetricCard({
  metric,
  comparison,
}: {
  metric: BattingPerformanceMetric;
  comparison?: {
    primary: BatterComparisonValue;
    compared: BatterComparisonValue;
    betterSide?: BetterMetricSide;
  };
}) {
  const valueClassName = getMetricValueClass(metric.value, Boolean(comparison));

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface-2)] p-1 shadow-sm sm:p-2 md:p-2.5 lg:p-3 [@media(max-height:700px)]:p-0.5">
      <p className="shrink-0 break-words text-[clamp(9px,0.7vw,11px)] font-semibold uppercase leading-[1.1] tracking-[0.08em] text-[var(--text-muted)] [overflow-wrap:anywhere] [@media(max-height:700px)]:text-[8px] [@media(max-height:700px)]:leading-[1.25]">
        {metric.label}
      </p>
      {comparison ? (
        <div className="grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-1 py-0.5">
          <BatterComparisonValue
            {...comparison.primary}
            valueClassName={getMetricValueClass(comparison.primary.value, true)}
            highlighted={comparison.betterSide === "primary"}
          />
          <span
            aria-hidden="true"
            className="flex size-[22px] shrink-0 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-hover)] text-[7px] font-bold leading-none text-[var(--text-secondary)] [@media(max-height:700px)]:size-5"
          >
            VS
          </span>
          <BatterComparisonValue
            {...comparison.compared}
            valueClassName={getMetricValueClass(comparison.compared.value, true)}
            highlighted={comparison.betterSide === "comparison"}
          />
        </div>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center">
          <p className={valueClassName}>{metric.value}</p>
        </div>
      )}
      <p className="shrink-0 break-words pt-0.5 text-[10px] leading-[1.1] text-[var(--text-secondary)] [overflow-wrap:anywhere] sm:text-xs sm:leading-4 [@media(max-height:700px)]:text-[8px] [@media(max-height:700px)]:leading-[1.25]">
        {metric.detail}
      </p>
    </div>
  );
}

function BattingPerformanceContent({
  match,
  batters,
  defaultBatter,
  metricPage,
}: {
  match: Match;
  batters: BatterData[];
  defaultBatter?: BatterData;
  metricPage: number | "all";
}) {
  const teams = useMemo(() => getMatchTeams(match).slice(0, 2), [match]);
  const initialBatter =
    (defaultBatter &&
      batters.find((item) => batterRecordKey(item) === batterRecordKey(defaultBatter))) ??
    batters[0];
  const initialPrimaryTeam = initialBatter
    ? getTeamFromInnings(initialBatter.inning, match) ?? ""
    : "";
  const [primaryTeam, setPrimaryTeam] = useState(initialPrimaryTeam);
  const [comparisonTeam, setComparisonTeam] = useState(
    () =>
      teams.find(
        (team) => normalizeTeamName(team) !== normalizeTeamName(initialPrimaryTeam),
      ) ??
      teams[0] ??
      "",
  );
  const [selectedPrimaryKey, setSelectedPrimaryKey] = useState(
    initialBatter ? batterRecordKey(initialBatter) : "",
  );
  const [selectedComparisonKey, setSelectedComparisonKey] = useState("");
  const teamColors = useMemo(() => getTeamColorMap(teams), [teams]);
  const getTeamBatters = (team: string) =>
    batters.filter((item) => {
      const verifiedTeam = getTeamFromInnings(item.inning, match);
      return (
        verifiedTeam &&
        normalizeTeamName(verifiedTeam) === normalizeTeamName(team)
      );
    });
  const primaryOptions = getTeamBatters(primaryTeam);
  const selectedPrimary =
    primaryOptions.find((item) => batterRecordKey(item) === selectedPrimaryKey) ??
    primaryOptions[0];
  const isSameTeam = normalizeTeamName(primaryTeam) === normalizeTeamName(comparisonTeam);
  const comparisonOptions = getTeamBatters(comparisonTeam).filter(
    (item) =>
      !isSameTeam ||
      !selectedPrimary ||
      normalizeTeamName(item.name) !== normalizeTeamName(selectedPrimary.name),
  );
  const selectedComparison = comparisonOptions.find(
    (item) => batterRecordKey(item) === selectedComparisonKey,
  );
  const handlePrimaryTeamChange = (team: string) => {
    if (normalizeTeamName(team) === normalizeTeamName(primaryTeam)) return;
    const nextPrimary = getTeamBatters(team)[0];
    const currentComparison = batters.find(
      (item) => batterRecordKey(item) === selectedComparisonKey,
    );
    setPrimaryTeam(team);
    setSelectedPrimaryKey(nextPrimary ? batterRecordKey(nextPrimary) : "");
    if (
      nextPrimary &&
      currentComparison &&
      normalizeTeamName(team) === normalizeTeamName(comparisonTeam) &&
      normalizeTeamName(nextPrimary.name) === normalizeTeamName(currentComparison.name)
    ) {
      setSelectedComparisonKey("");
    }
  };
  const handlePrimaryChange = (key: string) => {
    const nextPrimary = primaryOptions.find((item) => batterRecordKey(item) === key);
    setSelectedPrimaryKey(key);
    if (
      nextPrimary &&
      selectedComparison &&
      normalizeTeamName(primaryTeam) === normalizeTeamName(comparisonTeam) &&
      normalizeTeamName(nextPrimary.name) === normalizeTeamName(selectedComparison.name)
    ) {
      setSelectedComparisonKey("");
    }
  };
  const handleComparisonTeamChange = (team: string) => {
    if (normalizeTeamName(team) === normalizeTeamName(comparisonTeam)) return;
    setComparisonTeam(team);
    setSelectedComparisonKey("");
  };
  const getMetrics = (subject: BatterData): BattingPerformanceMetric[] => {
    const boundaryCount = subject.fours + subject.sixes;
    const ballsPerBoundary =
      boundaryCount > 0 ? subject.balls / boundaryCount : undefined;

    return [
      {
        label: "Runs",
        value: String(subject.runs),
        detail: "Runs scored.",
        rawValue: subject.runs,
        direction: "higher",
      },
      {
        label: "Strike rate",
        value: subject.strikeRate.toFixed(2),
        detail: "Runs per 100 balls.",
        rawValue: subject.strikeRate,
        direction: "higher",
      },
      {
        label: "Balls faced",
        value: String(subject.balls),
        detail: "Scorecard balls faced.",
        rawValue: subject.balls,
      },
      {
        label: "Fours",
        value: String(subject.fours),
        detail: "Deliveries recorded as fours.",
        rawValue: subject.fours,
        direction: "higher",
      },
      {
        label: "Sixes",
        value: String(subject.sixes),
        detail: "Deliveries recorded as sixes.",
        rawValue: subject.sixes,
        direction: "higher",
      },
      {
        label: "Dot-ball percentage",
        value: `${demoInteger(match.id, `${subject.inning}:${subject.name}:dot-ball-pct`, 18, 38)}%`,
        detail: "Demo-only fallback; the source does not return batter-level dot-ball counts.",
        direction: "lower",
      },
      {
        label: "Boundary percentage",
        value: `${subject.boundaryPct.toFixed(2)}%`,
        detail: "Boundary runs as a share of this batter's runs.",
        rawValue: subject.boundaryPct,
        direction: "higher",
      },
      {
        label: "Balls per boundary",
        value: ballsPerBoundary === undefined ? "No boundary recorded" : ballsPerBoundary.toFixed(1),
        detail: "Balls faced divided by fours plus sixes.",
        rawValue: ballsPerBoundary,
        direction: "lower",
      },
    ];
  };
  const metrics = selectedPrimary ? getMetrics(selectedPrimary) : [];
  const comparisonMetrics = selectedComparison ? getMetrics(selectedComparison) : [];
  const metricStart = metricPage === "all" ? 0 : metricPage * 4;
  const visibleMetrics =
    metricPage === "all" ? metrics : metrics.slice(metricStart, metricStart + 4);
  const visibleComparisonMetrics =
    metricPage === "all"
      ? comparisonMetrics
      : comparisonMetrics.slice(metricStart, metricStart + 4);
  const metricGridClass =
    metricPage === "all"
      ? "grid-cols-2 grid-rows-4 xl:grid-cols-4 xl:grid-rows-2"
      : "grid-cols-2 grid-rows-2 xl:grid-cols-4 xl:grid-rows-1";
  const selectedComparisonTeam = selectedComparison
    ? getTeamFromInnings(selectedComparison.inning, match)
    : undefined;
  const selectedPrimaryTeam = selectedPrimary
    ? getTeamFromInnings(selectedPrimary.inning, match)
    : undefined;
  const comparisonTeamColor = selectedComparisonTeam
    ? teamColors.get(normalizeTeamName(selectedComparisonTeam))
    : undefined;
  const primaryTeamColor = selectedPrimaryTeam
    ? teamColors.get(normalizeTeamName(selectedPrimaryTeam))
    : undefined;
  const renderMetricCards = (
    items: typeof metrics,
    comparisons: typeof comparisonMetrics = [],
  ) => (
    <div
      className={cn(
        "grid min-h-0 min-w-0 flex-1 gap-2 [@media(max-height:700px)]:gap-1.5",
        metricGridClass,
      )}
    >
      {items.map((metric, index) => {
        const comparison = comparisons[index];
        return (
          <BattingPerformanceMetricCard
            key={metric.label}
            metric={metric}
            comparison={
              comparison && selectedPrimary && selectedComparison
                ? {
                    primary: {
                      value: metric.value,
                      shortName: getBatterShortName(selectedPrimary.name),
                      teamDotClass: primaryTeamColor?.dot,
                    },
                    compared: {
                      value: comparison.value,
                      shortName: getBatterShortName(selectedComparison.name),
                      teamDotClass: comparisonTeamColor?.dot,
                    },
                    betterSide: getBetterMetricSide(metric, comparison),
                  }
                : undefined
            }
          />
        );
      })}
    </div>
  );
  const renderBatterHeader = (subject: BatterData, comparison?: BatterData) => (
    <div className="min-w-0">
      {comparison ? (
        <div className="flex min-w-0 items-center justify-between gap-2">
          <FieldLabel>BATTER PERFORMANCE</FieldLabel>
          <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[8px] leading-3 text-[var(--text-muted)]">
            <span
              aria-hidden="true"
              className="size-2 rounded-sm border border-emerald-500/70 bg-emerald-500/10 shadow-[0_0_6px_rgba(34,197,94,0.2)]"
            />
            Green box = better in this metric
          </span>
        </div>
      ) : (
        <FieldLabel>BATTER PERFORMANCE</FieldLabel>
      )}
      {comparison ? (
        <div className="mt-0.5 grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1">
          <div className="flex min-w-0 items-center gap-1">
            <h2 className="min-w-0 flex-1 truncate text-[11px] font-bold text-[var(--text-primary)] sm:text-base lg:text-lg">
              {subject.name}
            </h2>
            <BatterTeamPill
              team={getTeamFromInnings(subject.inning, match)}
              teamColors={teamColors}
            />
          </div>
          <span
            aria-hidden="true"
            className="rounded-full border border-[var(--border-color)] px-1.5 py-0.5 text-[8px] font-bold leading-none text-[var(--text-muted)]"
          >
            VS
          </span>
          <div className="flex min-w-0 items-center gap-1">
            <h2 className="min-w-0 flex-1 truncate text-[11px] font-bold text-[var(--text-primary)] sm:text-base lg:text-lg">
              {comparison.name}
            </h2>
            <BatterTeamPill
              team={getTeamFromInnings(comparison.inning, match)}
              teamColors={teamColors}
            />
          </div>
        </div>
      ) : (
        <div className="mt-0.5 flex min-w-0 items-center gap-2">
          <h2 className="min-w-0 flex-1 truncate text-sm font-bold text-[var(--text-primary)] sm:text-xl">
            {subject.name}
          </h2>
          <BatterTeamPill
            team={getTeamFromInnings(subject.inning, match)}
            teamColors={teamColors}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-1.5 overflow-hidden sm:gap-2 [@media(max-height:700px)]:gap-1">
      <div className="grid min-w-0 shrink-0 grid-cols-1 gap-2 md:grid-cols-2 sm:gap-3 [@media(max-height:700px)]:gap-1.5">
        <div className="min-w-0 space-y-0.5 sm:space-y-1">
          <p className="text-[10px] font-semibold leading-3 text-[var(--text-secondary)] sm:text-xs">
            Batter
          </p>
          <BatterTeamToggle
            label="Batter"
            teams={teams}
            selectedTeam={primaryTeam}
            teamColors={teamColors}
            onChange={handlePrimaryTeamChange}
          />
          <select
            aria-label="Batter"
            value={selectedPrimary ? batterRecordKey(selectedPrimary) : ""}
            onChange={(event) => handlePrimaryChange(event.target.value)}
            disabled={primaryOptions.length === 0}
            className="block min-h-7 w-full min-w-0 max-w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-2 text-[11px] font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--accent)] disabled:opacity-60 sm:min-h-9 sm:text-sm [@media(max-height:700px)]:min-h-7"
          >
            {primaryOptions.length === 0 ? (
              <option value="">No batters available for this team</option>
            ) : (
              primaryOptions.map((item) => (
                <option key={batterRecordKey(item)} value={batterRecordKey(item)}>
                  {item.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div className="min-w-0 space-y-0.5 sm:space-y-1">
          <p className="text-[10px] font-semibold leading-3 text-[var(--text-secondary)] sm:text-xs">
            Compare with
          </p>
          <BatterTeamToggle
            label="Compare with"
            teams={teams}
            selectedTeam={comparisonTeam}
            teamColors={teamColors}
            onChange={handleComparisonTeamChange}
          />
          <select
            aria-label="Compare with"
            value={selectedComparison ? batterRecordKey(selectedComparison) : ""}
            onChange={(event) => setSelectedComparisonKey(event.target.value)}
            className="block min-h-7 w-full min-w-0 max-w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-2 text-[11px] font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--accent)] sm:min-h-9 sm:text-sm [@media(max-height:700px)]:min-h-7"
          >
            <option value="">No comparison</option>
            {comparisonOptions.map((item) => (
              <option key={batterRecordKey(item)} value={batterRecordKey(item)}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedPrimary ? (
        <section
          aria-label={`${selectedPrimary.name}${selectedComparison ? ` vs ${selectedComparison.name}` : ""} batting performance`}
          className="flex min-h-0 min-w-0 flex-1 flex-col gap-1 sm:gap-2"
        >
          {renderBatterHeader(selectedPrimary, selectedComparison)}
          {renderMetricCards(
            visibleMetrics,
            selectedComparison ? visibleComparisonMetrics : [],
          )}
        </section>
      ) : (
        <div className="flex min-h-0 flex-1 items-center">
          <AvailabilityMessage>No batters with verified team data are available.</AvailabilityMessage>
        </div>
      )}
    </div>
  );
}

function InningsSegmentedToggle({
  innings,
  selectedInnings,
  onSelectInnings,
  match,
  teamColors,
}: {
  innings: PostMatchInningsSummary[];
  selectedInnings: number;
  onSelectInnings: (value: number) => void;
  match: Match;
  teamColors: ReadonlyMap<string, BatterTeamColorStyle>;
}) {
  if (innings.length === 0) return null;

  return (
    <div
      role="group"
      aria-label="Select batting innings"
      className="grid w-full min-w-0 shrink-0 gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] p-0.5 sm:flex"
      style={{ gridTemplateColumns: `repeat(${Math.min(innings.length, 2)}, minmax(0, 1fr))` }}
    >
      {innings.map((summary, index) => {
        const isSelected = selectedInnings === index;
        const team = getTeamFromInnings(summary.inning, match);
        const colors = team ? teamColors.get(normalizeTeamName(team)) : undefined;

        return (
          <button
            key={summary.inning}
            type="button"
            title={summary.inning}
            aria-pressed={isSelected}
            onClick={() => onSelectInnings(index)}
            className={cn(
              "flex min-h-7 min-w-0 w-full flex-1 items-center justify-center gap-1 rounded-md border px-1.5 py-1 text-[9px] font-semibold leading-3 transition-colors sm:min-h-8 sm:px-2 sm:text-xs sm:leading-normal",
              isSelected && colors
                ? colors.active
                : isSelected
                  ? "border-[var(--border-strong)] bg-[var(--bg-hover)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-hover)]",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                isSelected && colors ? colors.dot : "bg-[var(--text-muted)]",
              )}
            />
            <span className="min-w-0 truncate">{summary.inning}</span>
          </button>
        );
      })}
    </div>
  );
}

function BattingContributionContent({
  innings,
  selectedInnings,
  onSelectInnings,
  match,
  batters,
  selectedBatter,
  onSelectBatter,
}: {
  innings: PostMatchInningsSummary[];
  selectedInnings: number;
  onSelectInnings: (value: number) => void;
  match: Match;
  batters: BatterData[];
  selectedBatter: string;
  onSelectBatter: (value: string) => void;
}) {
  const maxRuns = Math.max(...batters.map((batter) => batter.runs), 1);
  const battingTotal = batters.reduce((total, batter) => total + batter.runs, 0);
  const teams = useMemo(() => getMatchTeams(match).slice(0, 2), [match]);
  const teamColors = useMemo(() => getTeamColorMap(teams), [teams]);
  const dense = batters.length > 9;
  const compact = batters.length > 7;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-1 [@media(max-height:800px)]:gap-0.5">
      <InningsSegmentedToggle
        innings={innings}
        selectedInnings={selectedInnings}
        onSelectInnings={onSelectInnings}
        match={match}
        teamColors={teamColors}
      />
      {batters.length > 0 ? (
        <Panel className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-1.5 sm:p-2 [@media(max-height:800px)]:p-1">
          <div className="mb-1 flex min-w-0 shrink-0 items-end justify-between gap-1">
            <div className="min-w-0 flex-1">
              <FieldLabel>PLAYER CONTRIBUTIONS</FieldLabel>
              <h2 className="mt-0.5 truncate text-sm font-bold leading-4 text-[var(--text-primary)] sm:text-base">
                {innings[selectedInnings]?.inning ?? "Selected innings"}
              </h2>
            </div>
            <p className="max-w-[58%] shrink-0 whitespace-nowrap text-right text-[9px] leading-3 text-[var(--text-secondary)] sm:text-[10px]">
              {batters.length} of {batters.length} entries ·{" "}
              {battingTotal} batter runs
            </p>
          </div>
          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col",
              dense ? "gap-px" : compact ? "gap-0.5" : "gap-1",
              "[@media(max-height:800px)]:gap-px",
            )}
          >
            {batters.map((batter) => {
              const isSelected = batter.name === selectedBatter;
              return (
                <button
                  type="button"
                  key={batter.name}
                  onClick={() => onSelectBatter(batter.name)}
                  aria-pressed={isSelected}
                  className={cn(
                    "grid min-h-0 min-w-0 w-full flex-1 grid-cols-[minmax(0,0.95fr)_minmax(1.5rem,1fr)_auto] items-center gap-x-2 rounded-lg text-left transition-colors motion-reduce:transition-none",
                    dense ? "px-1 py-0" : compact ? "px-1.5 py-0.5" : "px-2 py-1",
                    "[@media(max-height:800px)]:px-1 [@media(max-height:800px)]:py-0",
                    isSelected ? "bg-[var(--accent-muted)]" : "hover:bg-[var(--bg-hover)]",
                  )}
                >
                  <span className="flex min-w-0 flex-col justify-center">
                    <span className={cn(
                      "truncate font-semibold leading-3 text-[var(--text-primary)]",
                      dense ? "text-[10px] sm:text-[11px]" : compact ? "text-[11px] sm:text-xs" : "text-xs sm:text-sm",
                      "[@media(max-height:800px)]:text-[10px]",
                    )}>
                      {batter.name}
                    </span>
                    <span className="truncate text-[8px] leading-[9px] text-[var(--text-muted)] sm:text-[9px] [@media(max-height:800px)]:text-[8px]">
                      {batter.balls} balls
                    </span>
                  </span>
                  <span className={cn(
                    "block min-w-0 overflow-hidden rounded-full bg-[var(--bg-hover-2)]",
                    dense ? "h-1" : compact ? "h-1.5" : "h-2",
                    "[@media(max-height:800px)]:h-1",
                  )}>
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${Math.max(1, (batter.runs / maxRuns) * 100)}%`,
                        background: isSelected ? "var(--accent)" : "var(--border-strong)",
                      }}
                    />
                  </span>
                  <span className={cn(
                    "shrink-0 whitespace-nowrap text-right font-bold tabular-nums text-[var(--text-primary)]",
                    dense ? "text-[10px] sm:text-[11px]" : compact ? "text-[11px] sm:text-xs" : "text-xs sm:text-sm",
                    "[@media(max-height:800px)]:text-[10px]",
                  )}>
                    {batter.runs} runs
                    <span className="ml-1 font-normal text-[var(--text-muted)]">
                      ({battingTotal > 0 ? ((batter.runs / battingTotal) * 100).toFixed(1) : "0.0"}%)
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>
      ) : <AvailabilityMessage>Player-by-player contributions are not available for this innings.</AvailabilityMessage>}
    </div>
  );
}

type BowlingInningsRecord = {
  inning: string;
};

type BowlingTeamGroup<T> = {
  team?: string;
  bowlers: T[];
};

function groupBowlersByTeam<T extends BowlingInningsRecord>(
  bowlers: T[],
  match: Match,
): BowlingTeamGroup<T>[] {
  const groups = getMatchTeams(match)
    .slice(0, 2)
    .map((team) => ({ team, bowlers: [] as T[] }));
  const unassigned: T[] = [];

  for (const bowler of bowlers) {
    const team = getBowlerTeam(bowler.inning, match);
    const group = groups.find(
      (candidate) =>
        team && normalizeTeamName(candidate.team) === normalizeTeamName(team),
    );
    if (group) group.bowlers.push(bowler);
    else unassigned.push(bowler);
  }

  return unassigned.length > 0
    ? [...groups, { bowlers: unassigned }]
    : groups;
}

type BowlingContributionRow = {
  inning: string;
  name: string;
  wickets: number;
  runsConceded: number;
  overs?: number;
  economy?: number;
};

type MergedBowlingRow = BowlingContributionRow & {
  overs?: number;
  economy?: number;
};

function getBowlingRowKey(row: BowlingInningsRecord & { name: string }, match: Match) {
  const team = getBowlerTeam(row.inning, match);
  const inning = normalizeTeamName(row.inning).replace(/^vs\s+/, "");
  return [
    normalizeTeamName(row.name),
    normalizeTeamName(team ?? ""),
    inning,
  ].join("|");
}

function mergeBowlingRows(
  contributions: BowlingContributionRow[],
  performances: PostMatchBowlingLeader[],
  match: Match,
): MergedBowlingRow[] {
  const merged: MergedBowlingRow[] = [];
  const rowsByKey = new Map<string, MergedBowlingRow>();

  for (const contribution of contributions) {
    const key = getBowlingRowKey(contribution, match);
    if (rowsByKey.has(key)) continue;
    const row: MergedBowlingRow = { ...contribution };
    rowsByKey.set(key, row);
    merged.push(row);
  }

  for (const performance of performances) {
    const key = getBowlingRowKey(performance, match);
    const existing = rowsByKey.get(key);
    if (existing) {
      existing.wickets = performance.wickets;
      existing.runsConceded = performance.runsConceded;
      existing.overs = performance.overs ?? existing.overs;
      existing.economy = performance.economy ?? existing.economy;
      continue;
    }

    const row: MergedBowlingRow = {
      inning: performance.inning,
      name: performance.name,
      wickets: performance.wickets,
      runsConceded: performance.runsConceded,
      overs: performance.overs,
      economy: performance.economy,
    };
    rowsByKey.set(key, row);
    merged.push(row);
  }

  return merged;
}

function BowlingTeamBox({
  team,
  count,
  teamColors,
  children,
}: {
  team?: string;
  count: number;
  teamColors: ReadonlyMap<string, BatterTeamColorStyle>;
  children: ReactNode;
}) {
  const colors = team ? teamColors.get(normalizeTeamName(team)) : undefined;
  const teamLabel = team ?? "Team unavailable";

  return (
    <section
      aria-label={`${teamLabel} bowling`}
      className={cn(
        "min-w-0 rounded-xl border bg-[var(--bg-surface-2)] p-2 shadow-sm sm:p-3",
        colors?.border ?? "border-[var(--border-color)]",
      )}
    >
      <header className="mb-1.5 flex min-w-0 items-center gap-1.5 border-b border-[var(--border-color)] pb-1.5 sm:mb-2">
        <span
          aria-hidden="true"
          className={cn("size-2 shrink-0 rounded-full", colors?.dot ?? "bg-[var(--text-muted)]")}
        />
        <h2 className="min-w-0 flex-1 truncate text-[10px] font-bold uppercase tracking-wide text-[var(--text-primary)] sm:text-sm">
          {teamLabel}
        </h2>
        <span className="shrink-0 whitespace-nowrap text-[9px] text-[var(--text-secondary)] sm:text-[10px]">
          {count} {count === 1 ? "bowler" : "bowlers"}
        </span>
      </header>
      {children}
    </section>
  );
}

function DismissalInningsPanels({
  match,
  scorecards,
}: {
  match: Match;
  scorecards?: Scorecard[] | null;
}) {
  const teams = getMatchTeams(match).slice(0, 2);
  const teamColors = getTeamColorMap(teams);
  const groups = new Map<string, { inning: string; rows: Array<{ batter: string; dismissal: string; over: string }> }>();

  for (const scorecard of scorecards ?? []) {
    const key = normalizeTeamName(scorecard.inning);
    let group = groups.get(key);
    if (!group) {
      group = { inning: scorecard.inning, rows: [] };
      groups.set(key, group);
    }

    for (const entry of scorecardDismissals(scorecard)) {
      group.rows.push({
        batter: dismissalDisplayValue(entry.batsman.name),
        dismissal: dismissalDisplayValue(entry.dismissal),
        over: String(demoInteger(
          match.id,
          `${scorecard.inning}:${entry.batsman.name}:dismissal-over`,
          1,
          Math.max(1, Math.ceil(scorecard.totalOvers)),
        )),
      });
    }
  }

  if (groups.size === 0) {
    return <AvailabilityMessage>No dismissal rows were returned.</AvailabilityMessage>;
  }

  return (
    <div className="grid items-start grid-cols-1 gap-2 md:grid-cols-2 md:gap-3 [@media(max-height:700px)]:gap-1">
      {Array.from(groups.values()).map(({ inning, rows }) => {
        const inningLabel = dismissalDisplayValue(inning);
        const team = getTeamFromInnings(inning, match);
        const colors = team ? teamColors.get(normalizeTeamName(team)) : undefined;
        const columns =
          "grid grid-cols-[2.25rem_minmax(0,0.9fr)_minmax(0,1.1fr)] items-start gap-x-1.5 sm:gap-x-2";

        return (
          <section
            key={normalizeTeamName(inning)}
            aria-label={`${inningLabel} dismissals`}
            className={cn(
              "min-w-0 self-start rounded-xl border bg-[var(--bg-surface-2)] p-2 shadow-sm sm:p-3 [@media(max-height:700px)]:p-1",
              colors?.border ?? "border-[var(--border-color)]",
              colors?.tint,
            )}
          >
            <header className="mb-1 flex min-w-0 items-center gap-1.5 border-b border-[var(--border-color)] pb-1.5 [@media(max-height:700px)]:mb-0.5 [@media(max-height:700px)]:pb-1">
              <span
                aria-hidden="true"
                className={cn("size-2 shrink-0 rounded-full", colors?.dot ?? "bg-[var(--text-muted)]")}
              />
              <h2 className="min-w-0 flex-1 break-words text-[10px] font-bold leading-4 text-[var(--text-primary)] sm:text-sm">
                {inningLabel}
              </h2>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-1.5 py-0.5 text-[8px] font-semibold leading-none sm:text-[10px]",
                  colors?.badge ?? "border-[var(--border-color)] text-[var(--text-secondary)]",
                )}
              >
                {rows.length} {rows.length === 1 ? "dismissal" : "dismissals"}
              </span>
            </header>

            <div className={cn(columns, "border-b border-[var(--border-color)] pb-1 text-[8px] font-semibold uppercase tracking-wide text-[var(--text-muted)]")}>
              <span>Over</span>
              <span>Batter</span>
              <span>Dismissal</span>
            </div>
            {rows.length > 0 ? (
              rows.map((row, index) => (
                <div
                  key={`${row.batter}-${index}`}
                  className={cn(
                    columns,
                    "border-b border-[var(--border-color)] py-1 text-[10px] leading-4 text-[var(--text-primary)] last:border-0 sm:py-1.5 sm:text-xs [@media(max-height:700px)]:py-0.5 [@media(max-height:700px)]:text-[9px]",
                  )}
                >
                  <span className="w-9 rounded-md border border-[var(--border-color)] bg-[var(--bg-surface)] px-1 py-0.5 text-center text-[9px] font-semibold tabular-nums text-[var(--text-secondary)]" title="Demo over">
                    {row.over}
                  </span>
                  <span className="min-w-0 break-words font-semibold">{row.batter}</span>
                  <span className="min-w-0 break-words text-[var(--text-secondary)]">{row.dismissal}</span>
                </div>
              ))
            ) : (
              <p className="py-2 text-xs text-[var(--text-secondary)]">No dismissals were recorded.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}

function findAdvancedInsightCard(
  cards: PostMatchEdaCard[],
  id: string,
  label: string,
) {
  return cards.find(
    (card) => card.id === id || normalizeTeamName(card.label) === normalizeTeamName(label),
  );
}

function getAdvancedInsightValue(card: PostMatchEdaCard | undefined) {
  const value = card?.value.trim();
  return value &&
    !/(waiting|unavailable|not available|becomes available|not returned|pending|requires .*(?:data|settled|complete))/i.test(value)
    ? value
    : null;
}

function getAdvancedInsightDescription(
  card: PostMatchEdaCard | undefined,
  fallback: string,
  demoValueShown: boolean,
) {
  const insight = card?.insight.trim();
  if (!insight) return fallback;
  return demoValueShown && /(waiting|unavailable|not available|becomes available|once .* (?:available|settles|settled|complete)|pending)/i.test(insight)
    ? `Demo value shown. Source note: ${insight}`
    : insight;
}

function getInsightPercentage(value: string | null) {
  const match = value?.match(/(\d+(?:\.\d+)?)\s*%/);
  if (!match) return null;
  return Math.max(0, Math.min(100, Number(match[1])));
}

function getInsightPlayerTeam(
  value: string | null,
  report: PostMatchEdaReport,
  match: Match,
) {
  if (!value) return undefined;

  const normalizedValue = normalizeTeamName(value);
  const matchesPlayer = (name: string) => {
    const normalizedName = normalizeTeamName(name);
    return (
      normalizedName &&
      (normalizedValue === normalizedName ||
        normalizedValue.startsWith(`${normalizedName} `) ||
        normalizedValue.includes(` ${normalizedName} `))
    );
  };
  const batter = report.intel.battingLeaders.find((leader) => matchesPlayer(leader.name));
  if (batter) return getTeamFromInnings(batter.inning, match);

  const bowler = report.intel.bowlingLeaders.find((leader) => matchesPlayer(leader.name));
  return bowler ? getBowlerTeam(bowler.inning, match) : undefined;
}

function AdvancedInsightsContent({
  match,
  report,
}: {
  match: Match;
  report: PostMatchEdaReport;
}) {
  const cards = report.retrospective.advancedCards;
  const topPerformer = findAdvancedInsightCard(cards, "clutch-performer", "Top performer");
  const prediction = findAdvancedInsightCard(cards, "prediction-review", "Predicted vs actual");
  const tacticalMistake = findAdvancedInsightCard(cards, "tactical-leak", "Tactical mistake");
  const hiddenContributor = findAdvancedInsightCard(cards, "hidden-contributor", "Hidden contributor");
  const historicalBaseline = findAdvancedInsightCard(cards, "historical-baseline", "Historical baseline");
  const candidateWindow = findAdvancedInsightCard(cards, "candidate-window", "Candidate window");

  const topPerformerValue = getAdvancedInsightValue(topPerformer);
  const teams = getMatchTeams(match).slice(0, 2);
  const sortedLeaders = [...report.intel.battingLeaders].sort((a, b) => b.runs - a.runs);
  const topLeader = sortedLeaders[0];
  const secondLeader = sortedLeaders.find((leader) => leader.name !== topLeader?.name);
  const resolvedTopValue =
    topPerformerValue ?? topLeader?.name ?? "Demo Batter 1";
  const predictionSourceValue = getAdvancedInsightValue(prediction);
  const predictionValue =
    predictionSourceValue ??
    `${teams[0] ?? "Demo Team"} 1st Innings · ${demoInteger(match.id, "advanced:predicted-actual", 42, 62)}%`;
  const tacticalSourceValue = getAdvancedInsightValue(tacticalMistake);
  const tacticalValue =
    tacticalSourceValue ??
    `${demoInteger(match.id, "advanced:tactical-mistake", 12, 34)}%`;
  const hiddenSourceValue = getAdvancedInsightValue(hiddenContributor);
  const hiddenValue =
    hiddenSourceValue ??
    secondLeader?.name ??
    "Demo Batter 2";
  const topPerformerTeam =
    getInsightPlayerTeam(resolvedTopValue, report, match) ??
    (topLeader ? getTeamFromInnings(topLeader.inning, match) : teams[0]);
  const hiddenContributorTeam =
    getInsightPlayerTeam(hiddenValue, report, match) ??
    (secondLeader ? getTeamFromInnings(secondLeader.inning, match) : teams[1]);
  const predictionTeam = getTeamFromInnings(predictionValue, match);
  const teamColors = getTeamColorMap(teams);
  const topTeamColor = topPerformerTeam
    ? teamColors.get(normalizeTeamName(topPerformerTeam))
    : undefined;
  const hiddenTeamColor = hiddenContributorTeam
    ? teamColors.get(normalizeTeamName(hiddenContributorTeam))
    : undefined;
  const predictionTeamColor = predictionTeam
    ? teamColors.get(normalizeTeamName(predictionTeam))
    : undefined;

  const insightCards = [
    {
      id: "prediction-review",
      card: prediction,
      label: "Predicted vs actual",
      value: predictionValue,
      percentage: getInsightPercentage(predictionValue),
      accent: predictionTeamColor?.border ?? batterTeamColorStyles.green.border,
      bar: predictionTeamColor?.dot ?? batterTeamColorStyles.green.dot,
      playerTeam: undefined,
      demoValueShown: !predictionSourceValue,
    },
    {
      id: "tactical-leak",
      card: tacticalMistake,
      label: "Tactical mistake",
      value: tacticalValue,
      percentage: getInsightPercentage(tacticalValue),
      accent: "border-amber-400",
      bar: "bg-amber-400",
      playerTeam: undefined,
      demoValueShown: !tacticalSourceValue,
    },
    {
      id: "hidden-contributor",
      card: hiddenContributor,
      label: "Hidden contributor",
      value: hiddenValue,
      percentage: null,
      accent: hiddenTeamColor?.border ?? batterTeamColorStyles.green.border,
      bar: "",
      playerTeam: hiddenContributorTeam,
      demoValueShown: !hiddenSourceValue,
    },
  ];

  const baselineValue = getAdvancedInsightValue(historicalBaseline);
  const candidateValue = getAdvancedInsightValue(candidateWindow);
  const statusItems = [
    {
      label: historicalBaseline?.label ?? "Historical baseline",
      value: baselineValue ?? `Demo ${demoInteger(match.id, "advanced:baseline-matches", 5, 8)}-match sample`,
      isDemo: !baselineValue,
    },
    {
      label: candidateWindow?.label ?? "Candidate window",
      value: candidateValue ?? `Demo ${demoInteger(match.id, "advanced:candidate-window", 20, 30)}-match window`,
      isDemo: !candidateValue,
    },
  ];

  return (
    <div className="grid min-h-0 content-start gap-2 sm:gap-3 [@media(max-height:700px)]:gap-1">
      <section className="min-w-0 self-start rounded-xl border border-l-2 border-t-2 border-[var(--accent-border)] bg-[var(--accent-muted)] p-2 shadow-[0_0_16px_rgba(34,197,94,0.12)] sm:p-3 lg:p-4 [@media(max-height:700px)]:p-1.5">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] sm:text-[10px]">
              {topPerformer?.label ?? "Top performer"}
            </p>
            <h2 className="mt-0.5 truncate text-lg font-black leading-tight text-[var(--text-primary)] sm:text-2xl lg:text-3xl [@media(max-height:700px)]:text-base">
              {resolvedTopValue}
            </h2>
          </div>
          <span
            className={cn(
              "flex max-w-32 shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold sm:text-[10px]",
              topTeamColor?.badge ?? "border-[var(--border-color)] bg-[var(--bg-surface-2)] text-[var(--text-muted)]",
            )}
            title={topPerformerTeam ?? "—"}
          >
            <span
              aria-hidden="true"
              className={cn("size-1.5 shrink-0 rounded-full", topTeamColor?.dot ?? "bg-[var(--text-muted)]")}
            />
            <span className="truncate">{topPerformerTeam ?? "—"}</span>
          </span>
        </div>
        <p className="mt-1 break-words text-[9px] leading-[11px] text-[var(--text-secondary)] sm:mt-1.5 sm:text-sm sm:leading-5 [@media(max-height:700px)]:mt-0.5">
          {getAdvancedInsightDescription(
            topPerformer,
            "Demo-only performer selected for preview; no source insight was returned.",
            !topPerformerValue,
          )}
        </p>
      </section>

      <div className="grid min-w-0 grid-cols-1 items-start gap-2 md:grid-cols-2 lg:grid-cols-3 [@media(max-height:700px)]:gap-1">
        {insightCards.map(({ id, card, label, value, percentage, accent, bar, playerTeam, demoValueShown }) => {
          const playerTeamColor = playerTeam
            ? teamColors.get(normalizeTeamName(playerTeam))
            : undefined;

          return (
            <section
              key={id}
              className={cn(
                "min-w-0 self-start rounded-xl border border-t-2 bg-[var(--bg-surface-2)] p-2 shadow-sm sm:p-3 [@media(max-height:700px)]:p-1.5",
                accent,
              )}
            >
              <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)] sm:text-[10px]">
                {card?.label ?? label}
              </p>
              {id === "hidden-contributor" ? (
                <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                  {playerTeamColor ? (
                    <span
                      aria-hidden="true"
                      className={cn("size-2 shrink-0 rounded-full", playerTeamColor.dot)}
                    />
                  ) : null}
                  <p className="min-w-0 truncate text-sm font-bold leading-tight text-[var(--text-primary)] sm:text-lg [@media(max-height:700px)]:text-xs">
                    {value ?? "—"}
                  </p>
                </div>
              ) : (
                <p className="mt-0.5 break-words text-sm font-bold leading-tight text-[var(--text-primary)] sm:text-xl [@media(max-height:700px)]:text-xs">
                  {value ?? "—"}
                </p>
              )}
              {id !== "hidden-contributor" ? (
                <div
                  aria-hidden="true"
                  className="mt-1 h-1 overflow-hidden rounded-full bg-[var(--bg-hover)] [@media(max-height:700px)]:mt-0.5"
                >
                  {percentage !== null ? (
                    <div className={cn("h-full rounded-full", bar)} style={{ width: `${percentage}%` }} />
                  ) : null}
                </div>
              ) : null}
              <p className="mt-1 break-words text-[9px] leading-[11px] text-[var(--text-secondary)] sm:mt-1.5 sm:text-xs sm:leading-4 [@media(max-height:700px)]:mt-0.5">
                {getAdvancedInsightDescription(
                  card,
                  id === "prediction-review"
                    ? "Demo comparison for slide preview; not a forecast."
                    : id === "tactical-leak"
                      ? "Demo-only value for presentation; no source assessment was returned."
                      : "Demo contributor placeholder; no source insight was returned.",
                  demoValueShown,
                )}
              </p>
            </section>
          );
        })}
      </div>

      <section className="grid min-w-0 grid-cols-1 items-start gap-1 rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-surface-2)] p-2 sm:grid-cols-2 sm:gap-2 sm:p-3 [@media(max-height:700px)]:gap-0.5 [@media(max-height:700px)]:p-1.5">
        {statusItems.map(({ label, value, isDemo }) => (
          <div
            key={label}
            className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-[var(--bg-hover)] px-2 py-1 [@media(max-height:700px)]:py-0.5"
          >
            <div className="min-w-0">
              <p className="truncate text-[8px] font-semibold uppercase tracking-wide text-[var(--text-muted)] sm:text-[10px]">
                {label}
              </p>
              <p className="mt-0.5 text-lg font-bold leading-none tabular-nums text-[var(--text-secondary)] sm:text-2xl [@media(max-height:700px)]:mt-0 [@media(max-height:700px)]:text-base">
                {value}
              </p>
            </div>
            {isDemo ? (
              <span className="shrink-0 rounded-full border border-[var(--border-color)] px-1.5 py-0.5 text-[8px] font-medium leading-none text-[var(--text-muted)] sm:text-[9px]">
                Demo
              </span>
            ) : null}
          </div>
        ))}
      </section>
    </div>
  );
}

function BowlingPerformanceContributionContent({
  match,
  bowlers,
  scorecards,
}: {
  match: Match;
  bowlers: PostMatchBowlingLeader[];
  scorecards?: Scorecard[] | null;
}) {
  const contributions: BowlingContributionRow[] = (scorecards ?? []).flatMap((scorecard) =>
    scorecard.bowling.map((bowler) => ({
      inning: scorecard.inning,
      name: bowler.bowler.name,
      wickets: bowler.w,
      runsConceded: bowler.r,
      overs: bowler.o,
      economy: Number(bowler.eco) || (bowler.o > 0 ? bowler.r / bowler.o : undefined),
    })),
  );
  const mergedBowlers = mergeBowlingRows(contributions, bowlers, match);
  const teams = getMatchTeams(match).slice(0, 2);
  const teamColors = getTeamColorMap(teams);
  const groups = groupBowlersByTeam(mergedBowlers, match);
  const columnsClass =
    "grid grid-cols-[minmax(0,1.3fr)_minmax(2.2rem,0.42fr)_minmax(2.5rem,0.58fr)_minmax(1.7rem,0.36fr)_minmax(2.2rem,0.5fr)] gap-x-1 sm:gap-x-2";

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div
        className={cn(
          "grid min-w-0 grid-cols-1 items-start gap-2 sm:grid-cols-2 sm:gap-3",
          groups.length === 1 && "sm:grid-cols-1",
        )}
      >
        {groups.map((group) => (
          <BowlingTeamBox
            key={group.team ?? "team-unavailable"}
            team={group.team}
            count={group.bowlers.length}
            teamColors={teamColors}
          >
            {group.bowlers.length > 0 ? (
              <div role="table" aria-label={`${group.team ?? "Team unavailable"} bowling figures`}>
                <div role="rowgroup" className="shrink-0">
                  <div
                    className={cn(
                      columnsClass,
                      "border-b border-[var(--border-color)] pb-1 text-[8px] font-semibold leading-3 text-[var(--text-muted)] sm:text-[10px]",
                    )}
                    role="row"
                  >
                    <span role="columnheader">Bowler</span>
                    <span role="columnheader" className="text-center">
                      <span className="sm:hidden">Wkts</span>
                      <span className="hidden sm:inline">Wickets</span>
                    </span>
                    <span role="columnheader" className="text-right">
                      <span className="sm:hidden">Runs</span>
                      <span className="hidden sm:inline">Runs conceded</span>
                    </span>
                    <span role="columnheader" className="text-center">
                      <span className="sm:hidden">Ov</span>
                      <span className="hidden sm:inline">Overs</span>
                    </span>
                    <span role="columnheader" className="text-right">
                      <span className="sm:hidden">Econ</span>
                      <span className="hidden sm:inline">Economy</span>
                    </span>
                  </div>
                </div>
                <div role="rowgroup">
                  {group.bowlers.map((bowler, index) => {
                    const overs = typeof bowler.overs === "number" && Number.isFinite(bowler.overs)
                      ? bowler.overs
                      : demoInteger(match.id, `${bowler.inning}:${bowler.name}:overs`, 2, 4);
                    const economy = typeof bowler.economy === "number" && Number.isFinite(bowler.economy)
                      ? bowler.economy
                      : Number((bowler.runsConceded / Math.max(overs, 1)).toFixed(2));
                    return (
                      <div
                        key={`${bowler.inning}-${bowler.name}-${index}`}
                        className={cn(
                          columnsClass,
                          "items-center border-b border-[var(--border-color)] py-1 text-[10px] leading-[11px] text-[var(--text-primary)] last:border-0 sm:py-1.5 sm:text-xs sm:leading-4 [@media(max-height:700px)]:py-0.5",
                        )}
                        role="row"
                      >
                        <span role="cell" className="flex min-w-0 flex-col">
                          <span className="break-words font-semibold [overflow-wrap:anywhere]">
                            {bowler.name}
                          </span>
                          <span className="text-[8px] leading-[9px] text-[var(--text-muted)] sm:text-[10px] sm:leading-3">
                            Bowled in: {bowler.inning}
                          </span>
                        </span>
                        <span role="cell" className="text-center tabular-nums">{bowler.wickets}</span>
                        <span role="cell" className="text-right tabular-nums">{bowler.runsConceded}</span>
                        <span role="cell" className="text-center tabular-nums" title={bowler.overs == null ? "Demo value" : undefined}>
                          {overs}
                        </span>
                        <span role="cell" className="text-right tabular-nums" title={bowler.economy == null ? "Demo value" : undefined}>
                          {economy.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="flex min-h-0 flex-1 items-center justify-center text-center text-[10px] text-[var(--text-secondary)] sm:text-xs">
                No bowling data available
              </p>
            )}
          </BowlingTeamBox>
        ))}
      </div>
      <p className="text-[9px] leading-3 text-[var(--text-secondary)] sm:text-xs">
        Maidens and balls per wicket are unavailable unless returned by the API.
      </p>
    </div>
  );
}

function InningsProgressionContent({
  match,
  innings,
  selectedInnings,
  onSelectInnings,
  analytics,
}: {
  match: Match;
  innings: PostMatchInningsSummary[];
  selectedInnings: number;
  onSelectInnings: (value: number) => void;
  analytics: PostMatchInningsAnalytics | undefined;
}) {
  const recordedOvers = analytics?.overSummaries ?? [];
  const usesDemoValues = recordedOvers.length === 0;
  const overs = usesDemoValues
    ? makeDemoOverSummaries(match, innings[selectedInnings])
    : recordedOvers;
  const maxRuns = Math.max(...overs.map((over) => over.cumulativeRuns), 1);
  const width = 720;
  const height = 300;
  const left = 48;
  const top = 18;
  const right = 18;
  const bottom = 34;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const points = overs.map((over, index) => {
    const x = left + (index / Math.max(overs.length - 1, 1)) * chartWidth;
    const y = top + chartHeight - (over.cumulativeRuns / maxRuns) * chartHeight;
    return { over, x, y };
  });

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <InningsPicker innings={innings} value={selectedInnings} onChange={onSelectInnings} />
      <Panel className="p-2 sm:p-4">
        <p className="mb-1 text-xs leading-4 text-[var(--text-secondary)]">
          {usesDemoValues
            ? "Synthetic presentation curve; it does not represent recorded delivery data."
            : "Cumulative runs by recorded over. Rose markers show recorded wickets."}
        </p>
        {points.length > 0 ? (
            <svg
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label={`Runs and wicket progression for ${analytics?.inning ?? innings[selectedInnings]?.inning ?? "selected innings"}${usesDemoValues ? " (demo values)" : ""}`}
              className="h-40 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-hover)] sm:h-56 lg:h-64"
            >
              {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
                const y = top + chartHeight * (1 - fraction);
                return (
                  <g key={fraction}>
                    <line
                      x1={left}
                      y1={y}
                      x2={width - right}
                      y2={y}
                      stroke="var(--border-color)"
                      strokeWidth="1"
                    />
                    <text
                      x={left - 8}
                      y={y + 4}
                      textAnchor="end"
                      fill="var(--text-muted)"
                      fontSize="12"
                    >
                      {Math.round(maxRuns * fraction)}
                    </text>
                  </g>
                );
              })}
              {points.length > 1 ? (
                <polyline
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points.map((point) => `${point.x},${point.y}`).join(" ")}
                />
              ) : null}
              {points.map(({ over, x, y }) => (
                <g key={over.id}>
                  <circle
                    cx={x}
                    cy={y}
                    r={over.wickets > 0 ? 6 : 4}
                    fill={over.wickets > 0 ? "#e11d48" : "var(--accent)"}
                    stroke="var(--bg-surface)"
                    strokeWidth="2"
                  >
                    <title>
                      {`Over ${over.over + 1}: ${over.cumulativeRuns} cumulative runs, ${over.wickets} wickets`}
                    </title>
                  </circle>
                </g>
              ))}
              <text
                x={left}
                y={height - 10}
                fill="var(--text-muted)"
                fontSize="12"
              >
                Over {overs[0]?.over + 1}
              </text>
              <text
                x={width - right}
                y={height - 10}
                textAnchor="end"
                fill="var(--text-muted)"
                fontSize="12"
              >
                Over {overs[overs.length - 1]?.over + 1}
              </text>
            </svg>
          ) : (
            <div className="mt-2">
              <AvailabilityMessage>No innings data is available to plot.</AvailabilityMessage>
            </div>
          )}
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
            Cumulative runs
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-600" />
            {usesDemoValues ? "Demo wicket" : "Recorded wicket"}
          </span>
        </div>
      </Panel>
    </div>
  );
}

function ScoringDistributionContent({
  innings,
  selectedInnings,
  onSelectInnings,
  analytics,
  scorecard,
  summary,
}: {
  innings: PostMatchInningsSummary[];
  selectedInnings: number;
  onSelectInnings: (value: number) => void;
  analytics: PostMatchInningsAnalytics | undefined;
  scorecard: Scorecard | undefined;
  summary: PostMatchInningsSummary | null;
}) {
  const phases = analytics?.phaseStats.filter((phase) => phase.legalBalls > 0) ?? [];
  const maxPhaseRuns = Math.max(...phases.map((phase) => phase.runs), 1);
  const fours = scorecard?.batting.reduce((total, entry) => total + entry["4s"], 0);
  const sixes = scorecard?.batting.reduce((total, entry) => total + entry["6s"], 0);

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <InningsPicker innings={innings} value={selectedInnings} onChange={onSelectInnings} />
      <Panel className="p-2 sm:p-4">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="text-base font-bold text-[var(--text-primary)]">Scoring by phase</h2>
          <span className="text-xs text-[var(--text-muted)]">Recorded innings totals</span>
        </div>
        {phases.length ? (
          <div className="space-y-2">
            {phases.map((phase) => (
              <div key={phase.phase} className="rounded-lg bg-[var(--bg-hover)] px-2.5 py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{phase.phase}</span>
                  <span className="text-xs font-bold tabular-nums text-[var(--text-primary)]">
                    {phase.runs} runs · {phase.wickets} wickets
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--bg-hover-2)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${Math.max(1, (phase.runs / maxPhaseRuns) * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {phase.legalBalls} legal balls · {phase.runRate} runs/over · {phase.runShare}% of innings runs
                </p>
              </div>
            ))}
          </div>
        ) : (
          <AvailabilityMessage>
            Phase totals were not reconstructable from the available delivery sequence.
          </AvailabilityMessage>
        )}
        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[var(--border-color)] pt-2 sm:grid-cols-3">
          <MetricRow label="Boundary runs" value={summary ? `${summary.boundaryRuns}` : "Unavailable"} compact />
          <MetricRow label="Fours" value={fours == null ? "Unavailable" : String(fours)} compact />
          <MetricRow label="Sixes" value={sixes == null ? "Unavailable" : String(sixes)} compact />
        </div>
        <p className="mt-1 text-xs leading-4 text-[var(--text-muted)]">
          Per-delivery 0/1/2/3 scoring counts are not supplied by this report.
        </p>
      </Panel>
    </div>
  );
}

function ExtrasBreakdownContent({
  innings,
  match,
  scorecards,
}: {
  innings: PostMatchInningsSummary[];
  match: Match;
  scorecards?: Scorecard[] | null;
}) {
  const teams = getMatchTeams(match);
  const teamColors = getTeamColorMap(teams);
  const scorecardsByInning = new Map(
    (scorecards ?? []).map((scorecard) => [normalizeTeamName(scorecard.inning), scorecard]),
  );
  const entries = [
    ...innings.map((summary) => ({
      inning: summary.inning,
      scorecard: scorecardsByInning.get(normalizeTeamName(summary.inning)),
    })),
    ...(scorecards ?? [])
      .filter(
        (scorecard) =>
          !innings.some(
            (summary) => normalizeTeamName(summary.inning) === normalizeTeamName(scorecard.inning),
          ),
      )
      .map((scorecard) => ({ inning: scorecard.inning, scorecard })),
  ];

  if (entries.length === 0) {
    return <AvailabilityMessage>Extras by innings are unavailable.</AvailabilityMessage>;
  }

  return (
    <div className="grid items-start gap-2 md:grid-cols-2 md:gap-3 [@media(max-height:700px)]:gap-1">
      {entries.map(({ inning, scorecard }) => {
        const team = getTeamFromInnings(inning, match);
        const teamColor = team ? teamColors.get(normalizeTeamName(team)) : undefined;
        const extras = parseScorecardExtras(scorecard?.extras);
        const availableValues = extras.categories.flatMap((category) =>
          category.value === null ? [] : [category.value],
        );
        const knownCategoryTotal = availableValues.reduce((total, value) => total + value, 0);
        const barDenominator =
          extras.total !== null && extras.total > 0
            ? Math.max(extras.total, knownCategoryTotal)
            : 0;
        const highestValue = availableValues.length > 0 ? Math.max(...availableValues) : null;

        return (
          <Panel
            key={inning}
            className={`min-w-0 self-start border-l-2 p-2 sm:p-3 [@media(max-height:700px)]:p-1 ${teamColor?.border ?? "border-[var(--border-color)]"}`}
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <span
                aria-hidden="true"
                className={`h-2 w-2 shrink-0 rounded-full ${teamColor?.dot ?? "bg-[var(--text-muted)]"}`}
              />
              <h2 className="min-w-0 break-words text-xs font-bold leading-4 text-[var(--text-primary)] sm:text-sm">
                {inning}
              </h2>
            </div>

            <div className="mt-1 flex items-end justify-between gap-2 border-b border-[var(--border-color)] pb-1.5 [@media(max-height:700px)]:mt-0.5 [@media(max-height:700px)]:pb-1">
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] sm:text-[10px]">
                Total Extras
              </span>
              <span className="text-2xl font-black leading-none tabular-nums text-[var(--text-primary)] sm:text-3xl [@media(max-height:700px)]:text-xl">
                {extras.total ?? "—"}
              </span>
            </div>

            <div className="mt-1.5 [@media(max-height:700px)]:mt-1">
              <div
                role="img"
                aria-label={`${inning} extras composition`}
                className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--bg-hover)] [@media(max-height:700px)]:h-1.5"
              >
                {barDenominator > 0
                  ? extras.categories.map((category) =>
                      category.value !== null && category.value > 0 ? (
                        <span
                          key={category.code}
                          aria-hidden="true"
                          className={`h-full ${category.bar}`}
                          style={{ width: `${(category.value / barDenominator) * 100}%` }}
                        />
                      ) : null,
                    )
                  : null}
              </div>
              <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1 sm:flex sm:flex-wrap sm:gap-x-3 [@media(max-height:700px)]:mt-0.5 [@media(max-height:700px)]:gap-y-0">
                {extras.categories.map((category) => (
                  <span
                    key={category.code}
                    className="flex min-w-0 items-center gap-1 text-[9px] leading-3 text-[var(--text-secondary)] sm:text-[10px]"
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${category.dot}`} />
                    <span className="truncate">{category.label}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:gap-2 [@media(max-height:700px)]:mt-1 [@media(max-height:700px)]:gap-1">
              {extras.categories.map((category) => {
                const isHighest =
                  highestValue !== null &&
                  highestValue > 0 &&
                  category.value === highestValue;
                const share =
                  category.value !== null && extras.total !== null && extras.total > 0
                    ? `${((category.value / extras.total) * 100).toFixed(1)}% of extras`
                    : "—";

                return (
                  <div
                    key={category.code}
                    className={`min-w-0 rounded-lg border p-1.5 sm:p-2 [@media(max-height:700px)]:p-1 ${
                      isHighest
                        ? "border-[var(--accent-border)] bg-[var(--accent-muted)]"
                        : "border-[var(--border-color)] bg-[var(--bg-hover)]"
                    }`}
                  >
                    <div className="flex min-w-0 items-center justify-between gap-1">
                      <span className="min-w-0 truncate text-[9px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                        {category.label}
                      </span>
                      {isHighest ? (
                        <span className="shrink-0 rounded-full border border-[var(--accent-border)] px-1 py-0.5 text-[8px] font-bold leading-none text-[var(--text-primary)]">
                          Highest
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 flex min-w-0 flex-wrap items-baseline justify-between gap-x-1">
                      <span className="text-base font-bold leading-none tabular-nums text-[var(--text-primary)] sm:text-lg [@media(max-height:700px)]:text-sm">
                        {category.value ?? "—"}
                      </span>
                      <span className="text-[9px] leading-3 text-[var(--text-secondary)] [@media(max-height:700px)]:text-[8px] [@media(max-height:700px)]:leading-[10px]">
                        {share}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

function MatchSignalsContent({ signals }: { signals: PostMatchEdaReport["intel"]["matchSignals"] }) {
  return (
    <Panel className="divide-y divide-[var(--border-color)] p-1.5 sm:p-3">
      {signals.map((signal) => (
        <div key={signal.id} className="py-0.5 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <FieldLabel>{signal.label}</FieldLabel>
            <span className="text-sm font-bold text-[var(--text-primary)]">{signal.value}</span>
          </div>
          <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">{signal.insight}</p>
          {signal.quality?.provenance || signal.quality?.warning ? (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              {signal.quality?.provenance ? (
                <span className="text-xs font-semibold capitalize text-[var(--text-muted)]">
                  {signal.quality.provenance}
                </span>
              ) : null}
              {signal.quality?.warning ? (
                <span className="text-xs leading-4" style={{ color: "var(--status-warning-text)" }}>
                  {signal.quality.warning}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      ))}
    </Panel>
  );
}

function TacticalContent({
  report,
  section,
}: {
  report: PostMatchEdaReport;
  section: "takeaways" | "performers" | "all";
}) {
  const takeaways = section === "performers" ? [] : report.intel.tacticalTakeaways;
  const performers = section === "takeaways" ? [] : report.intel.standoutPerformers;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {takeaways.length > 0 ? (
        <Panel className="p-3 sm:p-4">
          <FieldLabel>TACTICAL TAKEAWAYS</FieldLabel>
          <ol className="mt-1 divide-y divide-[var(--border-color)]">
            {takeaways.slice(0, 3).map((takeaway, index) => (
              <li key={`${index}-${takeaway}`} className="flex gap-3 py-1">
                <span className="font-bold tabular-nums" style={{ color: "var(--accent)" }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-sm leading-5 text-[var(--text-primary)]">{takeaway}</p>
              </li>
            ))}
          </ol>
          {takeaways.length > 3 ? (
            <div className="mt-2">
              <DetailOverlay label={`View all ${takeaways.length} takeaways`} title="All tactical takeaways">
                <ol className="space-y-2">
                  {takeaways.map((item, index) => <li key={`${index}-${item}`} className="text-sm leading-5">{index + 1}. {item}</li>)}
                </ol>
              </DetailOverlay>
            </div>
          ) : null}
        </Panel>
      ) : null}
      {performers.length > 0 ? (
        <Panel className="p-3 sm:p-4">
          <FieldLabel>STANDOUT PERFORMERS</FieldLabel>
          <ul className="mt-1 divide-y divide-[var(--border-color)]">
            {performers.slice(0, 4).map((performer) => (
              <li key={performer} className="py-1 text-sm leading-5 text-[var(--text-primary)]">
                {performer}
              </li>
            ))}
          </ul>
          {performers.length > 4 ? (
            <div className="mt-2">
              <DetailOverlay label={`View all ${performers.length} performers`} title="All standout performers">
                <ul className="space-y-2">
                  {performers.map((item) => <li key={item} className="text-sm leading-5">{item}</li>)}
                </ul>
              </DetailOverlay>
            </div>
          ) : null}
        </Panel>
      ) : null}
    </div>
  );
}

function HistoricalMatchupsContent({ report }: { report: PostMatchEdaReport }) {
  const { winnerForm, loserForm, headToHead } = report.historical;
  const forms = [winnerForm, loserForm].filter(
    (form): form is NonNullable<typeof form> => Boolean(form),
  );
  const [view, setView] = useState(forms[0]?.team ?? "head-to-head");
  const selectedForm = forms.find((form) => form.team === view);

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <SegmentedControl
        value={view}
        onChange={setView}
        label="Historical comparison view"
        options={[
          ...forms.map((form) => ({ value: form.team, label: form.team })),
          { value: "head-to-head", label: "Head-to-head" },
        ]}
      />
      {selectedForm ? (
        <Panel className="p-3 sm:p-5">
          <FieldLabel>{selectedForm.available ? "TEAM FORM" : "TEAM FORM · LIMITED"}</FieldLabel>
          <Value>{selectedForm.team}</Value>
          <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">
            {selectedForm.wins} wins · {selectedForm.losses} losses · {selectedForm.noResult} no result
          </p>
          <Note>
            {selectedForm.avgRuns != null ? `Average runs: ${selectedForm.avgRuns} · ` : ""}
            {selectedForm.sampleSize} historical matches · {selectedForm.confidence} confidence
          </Note>
          <p className="mt-2 text-sm leading-5 text-[var(--text-secondary)]">{selectedForm.summary}</p>
          {selectedForm.warning ? (
            <p className="mt-2 text-sm leading-5" style={{ color: "var(--status-warning-text)" }}>
              {selectedForm.warning}
            </p>
          ) : null}
        </Panel>
      ) : (
        <Panel className="p-3 sm:p-5">
          <FieldLabel>{headToHead.available ? "HEAD-TO-HEAD" : "HEAD-TO-HEAD · LIMITED"}</FieldLabel>
          <Value className="text-2xl sm:text-3xl">
            {headToHead.teamA} {headToHead.teamAWins} — {headToHead.teamBWins} {headToHead.teamB}
          </Value>
          <Note>
            {headToHead.noResult} no results · {headToHead.sampleSize} historical matches ·{" "}
            {headToHead.confidence} confidence
          </Note>
          <p className="mt-2 text-sm leading-5 text-[var(--text-secondary)]">{headToHead.summary}</p>
          {headToHead.warning ? (
            <p className="mt-2 text-sm leading-5" style={{ color: "var(--status-warning-text)" }}>
              {headToHead.warning}
            </p>
          ) : null}
        </Panel>
      )}
    </div>
  );
}

function VenueHistoryContent({ report }: { report: PostMatchEdaReport }) {
  const venue = report.historical.venue;
  const [view, setView] = useState("venue");
  const [selectedBenchmark, setSelectedBenchmark] = useState(0);
  const benchmark = report.benchmarkCards[selectedBenchmark];

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <SegmentedControl
        value={view}
        onChange={setView}
        label="Venue and benchmark view"
        options={[
          { value: "venue", label: "Venue" },
          { value: "benchmarks", label: "Benchmarks" },
        ]}
      />
      {view === "venue" ? (
        <Panel className="p-3 sm:p-5">
          <FieldLabel>{venue.available ? "HISTORICAL VENUE CONTEXT" : "VENUE CONTEXT · LIMITED"}</FieldLabel>
          <Value className="text-2xl sm:text-3xl">{venue.venue}</Value>
          <div className="mt-1 grid grid-cols-2 gap-x-4">
            <MetricRow
              label="Average first innings"
              value={venue.avgFirstInningsScore ?? "Unavailable"}
              detail={venue.avgFirstInningsScore == null ? undefined : `${venue.sampleSize} matches`}
              compact
            />
            <MetricRow
              label="Chase win rate"
              value={venue.chaseWinPct == null ? "Unavailable" : `${venue.chaseWinPct}%`}
              detail={venue.chaseSampleSize == null ? undefined : `${venue.chaseSampleSize} chases`}
              compact
            />
          </div>
          <p className="mt-2 text-sm leading-5 text-[var(--text-secondary)]">{venue.summary}</p>
          {venue.warning ? (
            <p className="mt-2 text-sm leading-5" style={{ color: "var(--status-warning-text)" }}>
              {venue.warning}
            </p>
          ) : null}
        </Panel>
      ) : (
        <Panel className="p-3 sm:p-5">
          <FieldLabel>BENCHMARK CARDS</FieldLabel>
          {benchmark ? (
            <>
              {report.benchmarkCards.length > 1 ? (
                <label className="mt-2 block text-xs font-semibold text-[var(--text-secondary)]">
                  Benchmark
                  <select
                    value={selectedBenchmark}
                    onChange={(event) => setSelectedBenchmark(Number(event.target.value))}
                    className="mt-1 min-h-10 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-2 text-sm text-[var(--text-primary)]"
                  >
                    {report.benchmarkCards.map((card, index) => (
                      <option key={card.id} value={index}>{card.label}</option>
                    ))}
                  </select>
                </label>
              ) : null}
              <Value>{benchmark.value}</Value>
              <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">{benchmark.insight}</p>
              {benchmark.subValue ? (
                <p className="mt-1 text-xs leading-4 text-[var(--text-secondary)]">{benchmark.subValue}</p>
              ) : null}
              {benchmark.quality?.warning ? (
                <p className="mt-1 text-xs leading-4" style={{ color: "var(--status-warning-text)" }}>
                  {benchmark.quality.warning}
                </p>
              ) : null}
            </>
          ) : <AvailabilityMessage>No historical benchmark cards were returned.</AvailabilityMessage>}
        </Panel>
      )}
    </div>
  );
}

function AnalysisAvailabilityContent({
  report,
  coverage,
}: {
  report: PostMatchEdaReport;
  coverage: MatchCoverageSummary;
}) {
  const inningsCount = report.intel.inningsSummaries.length;
  const hasDeliveryFlow = (report.retrospective.summaryAnalytics?.innings ?? []).some(
    (inning) => inning.overSummaries.length > 0,
  );
  const hasHistory =
    report.historical.venue.available ||
    report.historical.headToHead.available ||
    Boolean(report.historical.winnerForm?.available || report.historical.loserForm?.available);
  const limitations = [...report.intel.reportNotes, ...report.retrospective.warnings];
  const availabilityItems = [
    {
      label: "Scorecards",
      detail:
        inningsCount > 0
          ? `${inningsCount} innings summaries with totals and metrics.`
          : "No innings summary was returned.",
    },
    {
      label: "Delivery sequence",
      detail: hasDeliveryFlow
        ? `${report.retrospective.ballsTracked} tracked balls; sequence completeness is not established.`
        : "No usable over sequence; delivery patterns are not inferred.",
    },
    {
      label: "Historical comparison",
      detail: hasHistory
        ? "Venue, team-form, or head-to-head baselines are available with caveats."
        : "No eligible baseline; none is inferred from this match alone.",
    },
    {
      label: "Linked coverage",
      detail: `${coverage.commentarySession ? "Commentary available" : "No commentary"} · ${coverage.blogs.length} related articles${coverage.coverageAvailable ? "" : " · lookup unavailable"}.`,
    },
  ];

  return (
    <Panel className="p-3 sm:p-4">
      <div className="grid grid-cols-2 gap-2">
        {availabilityItems.map((item) => (
          <div key={item.label} className="rounded-lg bg-[var(--bg-hover)] p-2.5">
            <FieldLabel>{item.label}</FieldLabel>
            <p className="mt-1 text-xs leading-4 text-[var(--text-secondary)]">{item.detail}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--border-color)] pt-3">
        {limitations.length > 0 ? (
          <DetailOverlay label={`Limitations and warnings (${limitations.length})`} title="Analysis limitations and warnings">
            <ul className="space-y-2">
              {limitations.map((note, index) => (
                <li key={`${index}-${note}`} className="flex gap-2 text-sm leading-5 text-[var(--text-secondary)]">
                  <Info className="mt-1 shrink-0" size={14} style={{ color: "var(--status-warning-text)" }} />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </DetailOverlay>
        ) : (
          <span className="text-xs text-[var(--text-secondary)]">No additional limitations were returned.</span>
        )}
        {report.sources.length > 0 ? (
          <DetailOverlay label={`Evidence and provenance (${report.sources.length})`} title="Evidence and provenance">
            <ul className="space-y-3">
              {report.sources.map((source) => (
                <li key={source.id}>
                  <p className="font-semibold">{source.title}</p>
                  <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">{source.note}</p>
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-[var(--accent)] underline">
                      View source
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </DetailOverlay>
        ) : null}
        {coverage.commentarySession ? (
          <Link
            href={`/commentary/${coverage.commentarySession.id}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--text-primary)] underline decoration-[var(--accent-border)] underline-offset-4"
          >
            Live commentary <ExternalLink size={13} aria-hidden="true" />
          </Link>
        ) : null}
        {coverage.blogs.length > 0 ? (
          <DetailOverlay label={`Related articles (${coverage.blogs.length})`} title="Related articles">
            <ul className="space-y-2">
              {coverage.blogs.map((blog) => (
                <li key={blog.id}>
                  <Link href={`/blog/${blog.slug}`} className="text-sm font-semibold text-[var(--accent)] underline">
                    {blog.title}
                  </Link>
                </li>
              ))}
            </ul>
          </DetailOverlay>
        ) : null}
      </div>
    </Panel>
  );
}

function buildMatchCoverSlide(match: Match): SlideDefinition {
  const teams = match.teams.filter((team) => team.trim());
  const headline = teams.length > 0
    ? teams.join(" vs ")
    : match.name.split(",")[0]?.trim() || match.name;
  const matchLabel = match.name.toLowerCase().startsWith(headline.toLowerCase())
    ? match.name.slice(headline.length).replace(/^[\s,–—-]+/, "").trim()
    : "";
  const date = Number.isFinite(Date.parse(match.date)) ? formatDate(match.date) : undefined;
  const metadata = [
    { label: "Format", value: match.matchType },
    { label: "Series ID", value: match.series_id },
    { label: "Venue", value: match.venue },
    { label: "Date", value: date },
  ].flatMap(({ label, value }) =>
    value?.trim() ? [{ label, value: value.trim() }] : [],
  );

  return {
    section: "MATCH EDA",
    title: headline,
    description: "",
    cover: true,
    content: (
      <div className="flex h-full min-h-0 flex-col justify-center gap-8 px-6 py-7 text-left sm:gap-10 sm:px-10 sm:py-10 lg:px-14">
        <Logo
          variant="horizontal"
          theme="white"
          width={173}
          height={28}
          alt="CricGeek"
        />
        <div className="max-w-6xl">
          <h1 className="break-words text-[clamp(2.25rem,5vw,5rem)] font-black leading-[1.05] tracking-tight text-[var(--text-primary)] [overflow-wrap:anywhere]">
            {headline}
          </h1>
          {matchLabel ? (
            <p className="mt-3 text-lg font-medium text-[var(--text-secondary)] sm:text-xl">
              {matchLabel}
            </p>
          ) : null}
        </div>
        {metadata.length > 0 ? (
          <dl className="grid max-w-6xl grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-5">
            {metadata.map((item) => (
              <div key={item.label} className="min-w-0 border-t border-[var(--border-color)] pt-3">
                <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)] sm:text-xs">
                  {item.label}
                </dt>
                <dd className="mt-1 break-words text-sm font-semibold leading-5 text-[var(--text-primary)] sm:text-base [overflow-wrap:anywhere]">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    ),
  };
}

function buildMatch1415755Slides({
  match,
  report,
  innings,
  scorecards,
  selectedInnings,
  onSelectInnings,
  selectedInningsAnalytics,
}: {
  match: Match;
  report: PostMatchEdaReport;
  innings: PostMatchInningsSummary[];
  scorecards?: Scorecard[] | null;
  selectedInnings: number;
  onSelectInnings: (value: number) => void;
  selectedInningsAnalytics: PostMatchInningsAnalytics | undefined;
}): SlideDefinition[] {
  const topBatter = report.intel.battingLeaders.find(
    (leader) => leader.name === "V Kohli" && leader.runs === 76,
  );
  const topBowler = report.intel.bowlingLeaders.find(
    (leader) =>
      leader.name === "HH Pandya" &&
      leader.wickets === 3 &&
      leader.runsConceded === 20,
  );
  const topBatterTeam = topBatter ? getTeamFromInnings(topBatter.inning, match) : undefined;
  const topBowlerTeam = topBowler ? getBowlerTeam(topBowler.inning, match) : undefined;
  const battingContributions = [
    ["V Kohli", 76],
    ["AR Patel", 47],
    ["S Dube", 27],
    ["RG Sharma", 9],
    ["HH Pandya", 5],
    ["SA Yadav", 3],
    ["RA Jadeja", 2],
    ["RR Pant", 0],
  ] as const;
  const gameChangingMoments = [
    {
      name: "H Klaasen",
      label: "High-contribution batter dismissed",
      over: 17,
      sourcePosition: "16.1",
      event: 100,
      impactScore: 10,
      runs: 52,
      wickets: 1,
    },
    {
      name: "DA Miller",
      label: "High-pressure late-chase wicket",
      over: 20,
      sourcePosition: "19.1",
      event: 118,
      impactScore: 10,
      runs: 21,
      wickets: 1,
    },
  ];
  const gameChangingInnings = innings[1];
  const gameChangingTeam = gameChangingInnings
    ? getTeamFromInnings(gameChangingInnings.inning, match)
    : undefined;
  const gameChangingTeamColors = getTeamColorMap(getMatchTeams(match));
  const evidenceMoments: RankedGameChangingMoment[] = gameChangingMoments.map((moment) => {
    const players = getMomentPlayers(moment.name, gameChangingInnings?.inning, scorecards);
    return {
      title: moment.name,
      description: moment.label,
      innings: gameChangingInnings
        ? `Innings ${innings.indexOf(gameChangingInnings) + 1}`
        : undefined,
      team: gameChangingTeam,
      over: moment.over,
      sourcePosition: moment.sourcePosition,
      event: moment.event,
      impactScore: moment.impactScore,
      runs: moment.runs,
      wickets: moment.wickets,
      players: players.players,
      supportingContext: players.supportingContext,
    };
  });
  const hasImpactScores = evidenceMoments.some((moment) => hasMomentValue(moment.impactScore));

  return [
    buildMatchCoverSlide(match),
    {
      section: "MATCH OVERVIEW",
      title: "Match Overview",
      description: "Innings totals are compared without inferring a result.",
      content: (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { team: "India · Innings 1", score: "176", wickets: "7", balls: "120" },
              { team: "South Africa · Innings 2", score: "169", wickets: "8", balls: "120" },
            ].map((inningsRow, index) => (
              <Panel
                key={inningsRow.team}
                className={getInningsOutcomeClass(
                  innings[index] ? getInningsOutcome(innings[index], match, report) : undefined,
                )}
              >
                <FieldLabel>{inningsRow.team}</FieldLabel>
                <Value className="text-3xl">{inningsRow.score}</Value>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <MetricRow label="Wickets" value={inningsRow.wickets} compact />
                  <MetricRow label="Legal deliveries" value={inningsRow.balls} compact />
                </div>
              </Panel>
            ))}
          </div>
          <Panel className="grid gap-3 sm:grid-cols-2">
            <MetricRow
              label="Highest individual score"
              value="V Kohli · 76 from 59 balls"
              badge={topBatterTeam}
              badgeOutcome={getTeamOutcome(topBatterTeam, match, report)}
              compact
            />
            <MetricRow
              label="Best bowling"
              value="HH Pandya · 3 wickets for 20 runs"
              badge={topBowlerTeam}
              badgeOutcome={getTeamOutcome(topBowlerTeam, match, report)}
              compact
            />
          </Panel>
          <p className="text-xs text-[var(--text-secondary)]">Score comparison only; no result is inferred.</p>
        </div>
      ),
    },
    {
      section: hasImpactScores
        ? "CRICSHEET · EVIDENCE-RANKED TIMELINE"
        : "REPORT-IDENTIFIED TURNING POINTS",
      title: "Game-Changing Moments ⭐",
      description: hasImpactScores
        ? "Scores summarize observed evidence, not causality, win probability, or the match result."
        : "",
      titleAside: hasImpactScores ? (
        <span className="mt-2 shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[9px] font-semibold leading-3 text-amber-800 dark:text-amber-200 sm:mt-2 sm:text-[10px]">
          Provisional evidence
        </span>
      ) : undefined,
      supporting: <GameChangingMomentsFooter report={report} evidenceMode={hasImpactScores} />,
      content: (
        hasImpactScores ? (
          <RankedGameChangingMomentsContent
            moments={evidenceMoments}
            teamColors={gameChangingTeamColors}
          />
        ) : (
          <RankedGameChangingMomentsContent
            moments={report.intel.turningPoints.slice(0, 3).map((description) => ({
              title: "-",
              description,
            }))}
            teamColors={gameChangingTeamColors}
          />
        )
      ),
    },
    {
      section: "BATTING · PERFORMANCE",
      title: "Batting Performance",
      description: "Batter selection and comparison are supported by the existing analysis page.",
      content: (
        <div className="space-y-3">
          <Panel>
            <FieldLabel>EXAMPLE BATTER</FieldLabel>
            <Value>S Dube</Value>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Batter selector and optional comparison are available in the analysis page.
            </p>
          </Panel>
          <Panel className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            <MetricRow label="Runs" value="27" compact />
            <MetricRow label="Strike rate" value="168.75 runs/100 balls" compact />
            <MetricRow label="Balls faced" value="16" compact />
            <MetricRow label="Fours" value="3" compact />
            <MetricRow label="Sixes" value="1" compact />
            <MetricRow label="Dot-ball percentage" value="18.75%" compact />
          </Panel>
          <p className="text-xs text-[var(--text-secondary)]">
            No comparison-batter values or additional metrics are supplied.
          </p>
        </div>
      ),
    },
    {
      section: "BATTING · CONTRIBUTION",
      title: "Batting Contribution",
      description: "API-provided batter runs for India, Innings 1.",
      content: (
        <Panel className="p-2 sm:p-4">
          <div className="mb-2 flex items-center justify-between">
            <FieldLabel>INDIA · INNINGS 1</FieldLabel>
            <FieldLabel>BATTER RUNS</FieldLabel>
          </div>
          <div className="grid grid-cols-2 gap-x-5">
            {battingContributions.map(([name, runs]) => (
              <div key={name} className="flex items-center justify-between border-b border-[var(--border-color)] py-2">
                <span className="text-sm font-semibold text-[var(--text-primary)]">{name}</span>
                <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">{runs}</span>
              </div>
            ))}
          </div>
        </Panel>
      ),
    },
    {
      section: "BOWLING · PERFORMANCE + CONTRIBUTION",
      title: "Bowling Performance & Contribution",
      description: "Bowling figures and contributions returned by the match scorecards.",
      content: (
        <BowlingPerformanceContributionContent
          match={match}
          bowlers={report.intel.bowlingLeaders}
          scorecards={scorecards}
        />
      ),
    },
    {
      section: "EXTRAS",
      title: "Extras Breakdown",
      description: "Scorecard extras for each innings, with totals and category breakdown.",
      content: <ExtrasBreakdownContent innings={innings} match={match} scorecards={scorecards} />,
    },
    {
      section: "INNINGS ANALYTICS",
      title: "Runs & Wicket Progression",
      description: selectedInningsAnalytics?.overSummaries.length
        ? "Recorded-event view only; chart groupings are display-only."
        : "Demo presentation curve fills missing over-by-over data; it is not a recorded sequence.",
      content: (
        <div className="space-y-3">
          <InningsProgressionContent
            match={match}
            innings={innings}
            selectedInnings={selectedInnings}
            onSelectInnings={onSelectInnings}
            analytics={selectedInningsAnalytics}
          />
          <p className="text-xs text-[var(--text-secondary)]">
            Display-only chart grouping; it does not replace API metric cards.
          </p>
        </div>
      ),
    },
    {
      section: "DISMISSALS · KEY EVENTS",
      title: "Dismissals & Key Events",
      description: "Dismissals grouped by innings from the match scorecards.",
      content: <DismissalInningsPanels match={match} scorecards={scorecards} />,
    },
    {
      section: "ADVANCED INSIGHTS",
      title: "Advanced Insights",
      description: "Historical comparison status and available match metrics.",
      content: <AdvancedInsightsContent match={match} report={report} />,
    },
    {
      section: "EVIDENCE & DATA QUALITY",
      title: "Evidence, Availability & Data Quality",
      description: "Sources, availability limits, and interpretation boundaries.",
      content: (
        <Panel className="p-3 sm:p-5">
          <ul className="space-y-3 text-sm leading-5 text-[var(--text-secondary)]">
            <li>Historical values and availability come from the post-match API. Reconciliation is <strong>Partial</strong>.</li>
            <li>Demo-only synthetic values fill missing fields for presentation; they are not post-match API data.</li>
            <li>Chart groupings are display-only and are not substitutes for API metrics.</li>
            <li>Event evidence is not a historical baseline and does not imply causality or win probability.</li>
            <li>Project wording: “Partnership tracking becomes available once ball-by-ball sequencing is available.”</li>
            <li>When commentary is unavailable, the report warns: “Ball-by-ball commentary was unavailable, so over-by-over and partnership storytelling is limited to scorecard evidence.”</li>
            <li>For unavailable sequences, the project states: “No usable over sequence; delivery patterns are not inferred.”</li>
            <li>For missing batter-level dot counts, the scorecard/report states: “The scorecard/report does not provide batter-level dot-ball counts.”</li>
          </ul>
        </Panel>
      ),
    },
  ];
}

type PostMatchSlideBuildInput = {
  match: Match;
  report: PostMatchEdaReport;
  coverage: MatchCoverageSummary;
  innings: PostMatchInningsSummary[];
  scorecards?: Scorecard[] | null;
  selectedInnings: number;
  onSelectInnings: (value: number) => void;
  selectedInningsAnalytics: PostMatchInningsAnalytics | undefined;
  batters: BatterData[];
  selectedBatter: string;
  onSelectBatter: (value: string) => void;
};

function isMatch1415755(input: PostMatchSlideBuildInput) {
  return input.match.id === "1415755";
}

function buildGenericPostMatchSlides(input: PostMatchSlideBuildInput): SlideDefinition[] {
  const { match, report, innings, scorecards, selectedInnings, onSelectInnings } = input;
  const bowlingLeaders = report.intel.bowlingLeaders;
  const topBatter = [...report.intel.battingLeaders].sort((a, b) => b.runs - a.runs)[0];
  const topBowler = [...bowlingLeaders].sort((a, b) =>
    b.wickets === a.wickets ? a.runsConceded - b.runsConceded : b.wickets - a.wickets,
  )[0];
  const topBatterTeam = topBatter ? getTeamFromInnings(topBatter.inning, match) : undefined;
  const topBowlerTeam = topBowler ? getBowlerTeam(topBowler.inning, match) : undefined;
  const gameChangingTeamColors = getTeamColorMap(getMatchTeams(match));
  const battingPerformanceBatters =
    innings.length > 0
      ? innings.flatMap((summary) =>
          makeBatterData(
            summary,
            scorecards?.find((scorecard) => scorecard.inning === summary.inning),
            report.intel.battingLeaders,
          ),
        )
      : report.intel.battingLeaders;
  const defaultPerformanceBatter =
    input.batters.find((batter) => batter.name === input.selectedBatter) ?? input.batters[0];
  const hasReportedTurningPoints = report.intel.turningPoints.length > 0;
  const turningPointDescriptions = hasReportedTurningPoints
    ? report.intel.turningPoints
    : [
        "Demo pressure moment · synthetic presentation example",
        "Demo scoring phase · synthetic presentation example",
      ];
  const genericMoments: RankedGameChangingMoment[] = turningPointDescriptions
    .slice(0, 3)
    .map((description, index) => {
      const summary = innings[index % Math.max(innings.length, 1)];
      const team = summary ? getTeamFromInnings(summary.inning, match) : undefined;
      const over = demoInteger(
        match.id,
        `moment:${index}:over`,
        1,
        Math.max(1, Math.ceil(summary?.totalOvers ?? 20)),
      );
      const batter = report.intel.battingLeaders.find(
        (leader) => leader.inning === summary?.inning,
      );
      return {
        title: description.startsWith("Demo")
          ? `Demo moment ${index + 1}`
          : `Reported turning point ${index + 1}`,
        description,
        innings: summary?.inning ?? `Innings ${index + 1}`,
        team: team ?? getMatchTeams(match)[index % Math.max(getMatchTeams(match).length, 1)],
        over,
        sourcePosition: `${Math.max(0, over - 1)}.1`,
        event: demoInteger(match.id, `moment:${index}:event`, 1, 120),
        impactScore: demoInteger(match.id, `moment:${index}:impact`, 4, 10),
        runs: demoInteger(match.id, `moment:${index}:runs`, 8, 32),
        wickets: 1,
        players: [
          { name: batter?.name ?? `Demo Batter ${index + 1}`, role: "batter" },
          { name: `Demo Bowler ${index + 1}`, role: "bowler" },
        ],
      };
    });
  return [
    buildMatchCoverSlide(match),
    {
      section: "MATCH OVERVIEW",
      title: "Match Overview",
      description: "Available innings totals and match leaders.",
      content: (
        <div className="space-y-3">
          {innings.length > 0 ? <MatchOverviewContent summaries={innings} match={match} report={report} /> : (
            <AvailabilityMessage>Innings totals are unavailable in the post-match report.</AvailabilityMessage>
          )}
          <Panel className="grid gap-3 sm:grid-cols-2">
            <MetricRow
              label="Highest individual score"
              value={topBatter ? `${topBatter.name} · ${topBatter.runs} from ${topBatter.balls} balls` : "Unavailable"}
              badge={topBatterTeam}
              badgeOutcome={getTeamOutcome(topBatterTeam, match, report)}
              compact
            />
            <MetricRow
              label="Best bowling"
              value={topBowler ? `${topBowler.name} · ${topBowler.wickets}/${topBowler.runsConceded}` : "Unavailable"}
              badge={topBowlerTeam}
              badgeOutcome={getTeamOutcome(topBowlerTeam, match, report)}
              compact
            />
          </Panel>
        </div>
      ),
    },
    {
      section: hasReportedTurningPoints ? "REPORT-IDENTIFIED TURNING POINTS" : "DEMO TURNING POINTS",
      title: "Game-Changing Moments ⭐",
      description: "",
      supporting: hasReportedTurningPoints
        ? <GameChangingMomentsFooter report={report} evidenceMode={false} />
        : <p className="line-clamp-2 break-words">Synthetic moments are for presentation preview only; they are not report or event evidence.</p>,
      content: (
        <RankedGameChangingMomentsContent
          moments={genericMoments}
          teamColors={gameChangingTeamColors}
        />
      ),
    },
    {
      section: "BATTING · PERFORMANCE",
      title: "Batting Performance",
      description: "Select and compare batters using scorecard-supported metrics.",
      content: battingPerformanceBatters.length > 0 ? (
        <BattingPerformanceContent
          match={match}
          batters={battingPerformanceBatters}
          defaultBatter={defaultPerformanceBatter}
          metricPage="all"
        />
      ) : (
        <AvailabilityMessage>Batter scorecard metrics are unavailable for this innings.</AvailabilityMessage>
      ),
    },
    {
      section: "BATTING · CONTRIBUTION",
      title: "Batting Contribution",
      description: "Available batter-run contributions for the selected innings.",
      content: (
        <BattingContributionContent
          innings={innings}
          selectedInnings={selectedInnings}
          onSelectInnings={onSelectInnings}
          match={match}
          batters={input.batters}
          selectedBatter={input.selectedBatter}
          onSelectBatter={input.onSelectBatter}
        />
      ),
    },
    {
      section: "BOWLING · PERFORMANCE + CONTRIBUTION",
      title: "Bowling Performance & Contribution",
      description: "Bowling figures and contributions returned by the match scorecards.",
      content: (
        <BowlingPerformanceContributionContent
          match={match}
          bowlers={bowlingLeaders}
          scorecards={scorecards}
        />
      ),
    },
    {
      section: "EXTRAS",
      title: "Extras Breakdown",
      description: "Scorecard extras for each innings, with totals and category breakdown.",
      content: <ExtrasBreakdownContent innings={innings} match={match} scorecards={scorecards} />,
    },
    {
      section: "INNINGS ANALYTICS",
      title: "Runs & Wicket Progression",
      description: input.selectedInningsAnalytics?.overSummaries.length
        ? "Cumulative runs by recorded over, using available post-match event data."
        : "Demo presentation curve fills missing over-by-over data; it is not a recorded sequence.",
      content: (
        <div className="space-y-2">
          <InningsProgressionContent
            match={match}
            innings={innings}
            selectedInnings={selectedInnings}
            onSelectInnings={onSelectInnings}
            analytics={input.selectedInningsAnalytics}
          />
          <p className="text-xs text-[var(--text-secondary)]">
            Display-only chart grouping; it does not replace API metric cards.
          </p>
        </div>
      ),
    },
    {
      section: "DISMISSALS · KEY EVENTS",
      title: "Dismissals & Key Events",
      description: "Dismissals grouped by innings from the match scorecards.",
      content: <DismissalInningsPanels match={match} scorecards={scorecards} />,
    },
    {
      section: "ADVANCED INSIGHTS",
      title: "Advanced Insights",
      description: "Historical comparison status and returned match metrics.",
      content: <AdvancedInsightsContent match={match} report={report} />,
    },
    {
      section: "EVIDENCE & DATA QUALITY",
      title: "Evidence, Availability & Data Quality",
      description: "Post-match API provenance and current data limitations.",
      content: (
        <div className="space-y-3">
          <AnalysisAvailabilityContent report={report} coverage={input.coverage} />
          <Panel className="space-y-3 p-3 sm:p-5">
            <p className="text-sm leading-5 text-[var(--text-secondary)]">
              Historical values and availability come from the post-match API. Chart groupings are display-only and do not replace API metrics.
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Demo-only synthetic values fill missing fields for presentation; they are not post-match API data.
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Event evidence is not a historical baseline and does not imply causality or win probability.
            </p>
          </Panel>
        </div>
      ),
    },
  ];
}

function buildPostMatchSlides(input: PostMatchSlideBuildInput): SlideDefinition[] {
  return isMatch1415755(input)
    ? buildMatch1415755Slides({
        match: input.match,
        report: input.report,
        innings: input.innings,
        scorecards: input.scorecards,
        selectedInnings: input.selectedInnings,
        onSelectInnings: input.onSelectInnings,
        selectedInningsAnalytics: input.selectedInningsAnalytics,
      })
    : buildGenericPostMatchSlides(input);
}

export default function PostMatchAnalysisSlides({
  match,
  report,
  coverage,
  scorecards,
}: PostMatchInsightsStoryProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"next" | "previous">("next");
  const [selectedInnings, setSelectedInnings] = useState(0);
  const [selectedBatter, setSelectedBatter] = useState("");
  const shellRef = useRef<HTMLDivElement>(null);
  const askDialogRef = useRef<HTMLDialogElement>(null);
  const touchStart = useRef<{
    x: number;
    y: number;
    time: number;
    identifier: number;
  } | null>(null);
  const innings = useMemo(() => {
    const summaries = [...report.intel.inningsSummaries];
    for (const scorecard of scorecards ?? []) {
      if (!summaries.some((summary) =>
        normalizeTeamName(summary.inning) === normalizeTeamName(scorecard.inning),
      )) {
        summaries.push(summaryFromScorecard(match, scorecard));
      }
    }
    for (const summary of makeDemoInnings(match)) {
      if (!summaries.some((item) =>
        normalizeTeamName(item.inning) === normalizeTeamName(summary.inning),
      )) {
        summaries.push(summary);
      }
    }
    return summaries.length > 0 ? summaries : makeDemoInnings(match);
  }, [match, report.intel.inningsSummaries, scorecards]);
  const presentationScorecards = useMemo(
    () => innings.map((summary) => {
      const source = scorecards?.find(
        (scorecard) => normalizeTeamName(scorecard.inning) === normalizeTeamName(summary.inning),
      );
      return makeDemoScorecard(match, summary, source);
    }),
    [innings, match, scorecards],
  );
  const presentationReport = useMemo(() => ({
    ...report,
    intel: {
      ...report.intel,
      battingLeaders: mergePresentationBattingLeaders(
        presentationScorecards,
        report.intel.battingLeaders,
      ),
      bowlingLeaders: mergePresentationBowlingLeaders(
        presentationScorecards,
        report.intel.bowlingLeaders,
      ),
    },
  }), [presentationScorecards, report]);
  const safeInningsIndex = Math.min(selectedInnings, Math.max(innings.length - 1, 0));
  const selectedSummary = innings[safeInningsIndex] ?? null;
  const selectedScorecard = presentationScorecards.find(
    (scorecard) =>
      normalizeTeamName(scorecard.inning) === normalizeTeamName(selectedSummary?.inning ?? ""),
  );
  const batters = useMemo(
    () => makeBatterData(selectedSummary, selectedScorecard, presentationReport.intel.battingLeaders),
    [selectedSummary, selectedScorecard, presentationReport.intel.battingLeaders],
  );
  const selectedInningsAnalytics = report.retrospective.summaryAnalytics?.innings.find(
    (item) => item.inning === selectedSummary?.inning,
  );
  const activeBatter = batters.some((batter) => batter.name === selectedBatter)
    ? selectedBatter
    : batters[0]?.name ?? "";
  const slides = buildPostMatchSlides({
    match,
    report: presentationReport,
    coverage,
    innings,
    scorecards: presentationScorecards,
    selectedInnings: safeInningsIndex,
    onSelectInnings: setSelectedInnings,
    selectedInningsAnalytics,
    batters,
    selectedBatter: activeBatter,
    onSelectBatter: setSelectedBatter,
  });

  const currentSlideIndex = Math.min(activeSlide, slides.length - 1);
  const setSlide = useCallback(
    (nextIndex: number) => {
      const boundedIndex = Math.max(0, Math.min(nextIndex, slides.length - 1));
      if (boundedIndex === currentSlideIndex) return;
      setSlideDirection(boundedIndex > currentSlideIndex ? "next" : "previous");
      setActiveSlide(boundedIndex);
    },
    [currentSlideIndex, slides.length],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      const isSlideNavigationButton =
        target instanceof HTMLElement &&
        target.matches(
          "[aria-label^='Go to slide '], [aria-label^='Previous slide:'], [aria-label^='Next slide:']",
        );
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.matches("input, textarea, select, [role='combobox']") ||
          (target.matches("button") && !isSlideNavigationButton))
      ) {
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setSlide(currentSlideIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setSlide(currentSlideIndex + 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentSlideIndex, setSlide]);

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    if (event.touches.length !== 1) {
      touchStart.current = null;
      return;
    }
    if (
      event.target instanceof Element &&
      event.target.closest(
        "dialog, a, button, input, select, textarea, [contenteditable='true'], [role='combobox'], [data-no-swipe='true']",
      )
    ) {
      touchStart.current = null;
      return;
    }
    const touch = event.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: event.timeStamp,
      identifier: touch.identifier,
    };
  };

  const handleTouchMove = (event: TouchEvent<HTMLElement>) => {
    if (event.touches.length !== 1) touchStart.current = null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = touchStart.current;
    if (!start) return;
    const touch =
      event.changedTouches.length === 1
        ? Array.from(event.changedTouches).find((item) => item.identifier === start.identifier)
        : undefined;
    touchStart.current = null;
    if (!touch) return;
    const duration = event.timeStamp - start.time;
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const minimumDistance = Math.max(55, window.innerWidth * 0.15);
    if (
      duration < 0 ||
      duration >= 800 ||
      Math.abs(deltaX) < minimumDistance ||
      Math.abs(deltaX) < Math.abs(deltaY) * 1.5
    ) {
      return;
    }
    setSlide(currentSlideIndex + (deltaX < 0 ? 1 : -1));
  };

  return (
    <div
      ref={shellRef}
      role="region"
      aria-label="Post-match analysis story"
      className="cg-analytics-scope fixed inset-0 z-[120] flex h-[100dvh] w-full flex-col touch-pan-y overflow-x-hidden overflow-y-hidden bg-[var(--analytics-page-bg)] pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] text-[var(--text-primary)]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        touchStart.current = null;
      }}
    >
      <StoryProgress slides={slides} activeSlide={currentSlideIndex} onSelect={setSlide} />
      <div className="mx-auto flex h-10 w-full max-w-[1340px] shrink-0 items-center justify-between gap-3 px-4 sm:h-12 sm:px-7 lg:px-9">
        <Link
          href={`/matches/${match.id}`}
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] sm:gap-2 sm:text-sm"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          <span>Match Centre</span>
        </Link>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="hidden max-w-[28rem] truncate text-right text-xs font-semibold text-[var(--text-muted)] sm:inline sm:text-sm">
            {match.name} · {match.matchEnded ? "POST-MATCH EDA" : match.matchStarted ? "LIVE ANALYSIS" : "PRE-MATCH · ANALYSIS PENDING"}
          </span>
          <button
            type="button"
            onClick={() => askDialogRef.current?.showModal()}
            aria-haspopup="dialog"
            aria-label="Ask the analyst"
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-hover)] px-2 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent-border)] sm:px-3"
          >
            <MessageCircle size={14} aria-hidden="true" />
            Ask
          </button>
          <ThemeToggle />
        </div>
      </div>
      <div className="mx-auto flex min-h-0 w-full max-w-[1340px] flex-1 px-0 sm:px-4 sm:pb-4 lg:px-7">
        <div className="h-full min-h-0 w-full overflow-hidden">
          <div
            data-slide-direction={slideDirection}
            className={cn(
              "flex h-full w-full transition-transform duration-300 motion-reduce:transition-none",
              slideDirection === "next" ? "ease-out" : "ease-in-out",
            )}
            style={{ transform: `translateX(-${currentSlideIndex * 100}%)` }}
          >
            {slides.map((slide, index) => {
              const previousTitle = index > 0 ? slides[index - 1]?.title : undefined;
              const nextTitle = index < slides.length - 1 ? slides[index + 1]?.title : undefined;
              return (
                <div
                  key={`${index}-${slide.title}`}
                  aria-hidden={index !== currentSlideIndex}
                  inert={index !== currentSlideIndex}
                  className={cn(
                    "h-full w-full min-w-0 shrink-0 overflow-hidden transition-opacity duration-300 motion-reduce:transition-none",
                    index === currentSlideIndex ? "opacity-100" : "opacity-0",
                  )}
                >
                  <SlideShell
                    slide={slide}
                    index={index}
                    total={slides.length}
                    previousTitle={previousTitle}
                    nextTitle={nextTitle}
                    onPrevious={() => setSlide(index - 1)}
                    onNext={() => setSlide(index + 1)}
                    supporting={slide.supporting}
                  >
                    {slide.content}
                  </SlideShell>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <dialog
        ref={askDialogRef}
        aria-label="Ask the analyst"
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-1rem)] max-w-3xl overflow-y-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-3 text-[var(--text-primary)] shadow-2xl backdrop:bg-black/70 sm:p-5"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Ask the analyst</h2>
          <button
            type="button"
            onClick={() => askDialogRef.current?.close()}
            aria-label="Close analyst dialog"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>
        <EdaAskPanel
          matchId={match.id}
          title="Ask The Analyst"
          description="Ask a question about this match report."
          suggestions={[
            "What decided this match more than the raw margin suggests?",
            ...report.intel.turningPoints.slice(0, 2),
            "How did the result compare with venue and rivalry history?",
          ]}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-inset)]"
        />
      </dialog>
    </div>
  );
}
