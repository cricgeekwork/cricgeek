import type { Commentary } from "@/types/cricket";
import {
  formatCommentaryTimestamp,
  renderCommentaryText,
} from "@/components/commentary/commentary-rich-text";

interface CommentaryFeedProps {
  commentary: Commentary;
}

// Score badge colour
function scoreBadge(score: number) {
  if (score === 6)
    return { bg: "bg-violet-600", text: "text-white", label: "6" };
  if (score === 4)
    return { bg: "bg-cg-green", text: "text-black", label: "4" };
  if (score === 0)
    return { bg: "bg-transparent border border-[var(--border-color)]", text: "text-[var(--text-muted)]", label: "•" };
  return { bg: "border border-[var(--border-color)] bg-[var(--tag-bg)]", text: "text-[var(--text-primary)]", label: String(score) };
}

function deriveOverSummary(commentary: Commentary) {
  const latest = commentary.bbb[0];
  if (!latest) return null;

  const sameOver = commentary.bbb.filter((ball) => ball.over === latest.over);
  const overRuns = sameOver.reduce((sum, ball) => sum + ball.score, 0);

  return {
    latest,
    sameOver,
    overRuns,
  };
}

export default function CommentaryFeed({ commentary }: CommentaryFeedProps) {
  const summary = deriveOverSummary(commentary);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[22px] overflow-hidden shadow-sm">
      <div className="px-5 py-4 bg-[var(--bg-surface-2)] border-b border-[var(--border-color)] flex items-center justify-between">
        <div>
          <h3 className="text-[var(--text-primary)] font-semibold text-base tracking-wide">Ball-by-Ball Commentary</h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{commentary.bbb.length} balls logged</p>
        </div>
        {summary && (
          <span className="rounded-full border border-[var(--border-color)] bg-[var(--tag-bg)] px-3 py-1 text-xs text-[var(--text-secondary)]">
            Updated {formatCommentaryTimestamp(summary.latest.timestamp)}
          </span>
        )}
      </div>

      {summary && (
        <div className="grid gap-px border-b border-[var(--border-color)] bg-[var(--border-color)] md:grid-cols-[120px,1fr,220px]">
          <div className="bg-[var(--bg-card)] px-5 py-4">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--text-muted)]">OVER</p>
            <p className="mt-1 text-3xl font-black text-[var(--text-primary)]">{summary.latest.over}</p>
          </div>
          <div className="bg-[var(--bg-card)] px-5 py-4">
            <p className="text-2xl font-bold text-[var(--text-primary)]">{summary.overRuns} runs</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{summary.sameOver.length} balls tracked in this over</p>
          </div>
          <div className="bg-[var(--bg-card)] px-5 py-4 text-left md:text-right">
            <p className="text-2xl font-bold text-[var(--text-primary)]">{summary.latest.batsman}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{summary.latest.bowler} on the attack</p>
          </div>
        </div>
      )}

      <div className="divide-y divide-[var(--border-color)] max-h-[720px] overflow-y-auto">
        {commentary.bbb.map((ball) => {
          const badge = scoreBadge(ball.score);
          const overLabel = `${ball.over}.${ball.ball}`;
          return (
            <div key={ball.id} className="flex gap-0 px-2 hover:bg-[var(--bg-hover)] transition-colors">
              <div className="w-20 shrink-0 flex items-start justify-center pt-5 pb-5">
                <span className="text-xl font-semibold text-[var(--text-primary)] leading-none">{overLabel}</span>
              </div>

              <div className="w-14 shrink-0 flex items-start justify-center pt-5 pb-5">
                <div className={`min-w-9 h-9 rounded-md flex items-center justify-center px-2 text-sm font-bold ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </div>
              </div>

              <div className="flex-1 py-5 pr-5 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--text-secondary)] uppercase">
                    {ball.bowler} to {ball.batsman}
                    {ball.score === 6 && ", Six Runs"}
                    {ball.score === 4 && ", Four Runs"}
                    {ball.score === 0 && ", No Run"}
                    {ball.score > 0 && ball.score !== 4 && ball.score !== 6 && `, ${ball.score} Run${ball.score !== 1 ? "s" : ""}`}
                  </p>
                  <span className="rounded-full border border-[var(--border-color)] bg-[var(--tag-bg)] px-2.5 py-1 text-[11px] text-[var(--text-muted)]">
                    {formatCommentaryTimestamp(ball.timestamp, true)}
                  </span>
                </div>
                <p className="text-[18px] text-[var(--text-primary)] leading-9">
                  {renderCommentaryText(ball.commentary)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
