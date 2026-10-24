"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Newspaper } from "lucide-react";
import type { CricketNewsArticle } from "@/lib/news/types";

type CricketNewsSidebarProps = {
  limit?: number;
  team?: string;
  tournament?: string;
  className?: string;
};

type NewsApiResponse = {
  ok: boolean;
  provider: string;
  count: number;
  cache: {
    hit: boolean;
    stale: boolean;
  };
  updatedAt: string;
  error?: string;
  articles: CricketNewsArticle[];
};

function formatPublishedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Recently";
  return `${formatDistanceToNow(parsed, { addSuffix: true })}`;
}

function NewsImage({ imageUrl, title }: { imageUrl: string; title: string }) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return (
      <div className="flex h-28 w-full items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface-2)] text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
        Cricket Update
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={title}
      className="h-28 w-full rounded-xl object-cover"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function clampStyle(lines: number) {
  return {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical" as const,
    WebkitLineClamp: lines,
    overflow: "hidden",
  };
}

export default function CricketNewsSidebar({
  limit = 6,
  team,
  tournament,
  className,
}: CricketNewsSidebarProps) {
  const [articles, setArticles] = useState<CricketNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [provider, setProvider] = useState<string>("none");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (team) params.set("team", team);
    if (tournament) params.set("tournament", tournament);
    return params.toString();
  }, [limit, team, tournament]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadNews() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/cricket-news?${queryString}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const payload = (await response.json()) as NewsApiResponse;
        if (!response.ok) {
          throw new Error(payload.error || "Unable to load cricket news.");
        }

        setArticles(Array.isArray(payload.articles) ? payload.articles : []);
        setProvider(payload.provider || "none");
        setStale(Boolean(payload.cache?.stale));
        setError(payload.error || null);
      } catch (loadError) {
        if ((loadError as Error).name === "AbortError") return;
        setArticles([]);
        setError("Could not load cricket news right now.");
        setProvider("none");
        setStale(false);
      } finally {
        setLoading(false);
      }
    }

    loadNews();

    return () => {
      controller.abort();
    };
  }, [queryString]);

  return (
    <section className={`rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-card)] p-5 ${className || ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--tag-bg)] text-sky-600 dark:text-[#7ac0ff]">
            <Newspaper size={15} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Cricket News</p>
            <p className="text-xs text-[var(--text-secondary)]">Provider: {provider}</p>
          </div>
        </div>
      </div>

      {stale && (
        <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
          Showing last cached stories while provider updates are delayed.
        </p>
      )}

      {loading && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {[1, 2, 3].map((skeleton) => (
            <div key={skeleton} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface-2)] p-3 animate-pulse">
              <div className="h-24 rounded-lg bg-[var(--border-color)]" />
              <div className="mt-3 h-3 rounded bg-[var(--border-color)]" />
              <div className="mt-2 h-3 w-4/5 rounded bg-[var(--border-color)]" />
              <div className="mt-3 h-2 w-1/2 rounded bg-[var(--border-color)]" />
            </div>
          ))}
        </div>
      )}

      {!loading && articles.length === 0 && (
        <div className="mt-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface-2)] px-4 py-5 text-sm text-[var(--text-secondary)]">
          {error || "No cricket news is available yet."}
        </div>
      )}

      {!loading && articles.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {articles.map((article) => (
            <article key={article.id} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface-2)] p-3 transition-colors hover:bg-[var(--bg-hover-2)]">
              <NewsImage imageUrl={article.imageUrl} title={article.title} />
              <a
                href={article.articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-start gap-1 text-sm font-semibold leading-5 text-[var(--text-primary)] hover:text-cg-green"
              >
                <span style={clampStyle(2)}>{article.title}</span>
                <ExternalLink size={14} className="mt-0.5 shrink-0" />
              </a>
              <p className="mt-2 text-xs text-[var(--text-secondary)]" style={clampStyle(3)}>
                {article.description || "Read the full update for details."}
              </p>
              <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                <span style={clampStyle(1)}>{article.sourceName}</span>
                <span>{formatPublishedAt(article.publishedAt)}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && error && articles.length > 0 && (
        <p className="mt-3 text-xs text-amber-800 dark:text-amber-200">{error}</p>
      )}
    </section>
  );
}
