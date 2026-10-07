"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PenSquare, Clock, Eye, MessageSquare, Search, Trophy, TrendingUp } from "lucide-react";
import AdSlot from "@/components/ads/AdSlot";
import CricketBallReactionButton from "@/components/blog/CricketBallReactionButton";
import SaveBlogButton from "@/components/blog/SaveBlogButton";
import WriterProfileCard from "@/components/writer/WriterProfileCard";
import { ARCHETYPE_META } from "@/lib/scoring";
import { parseBlogTags } from "@/lib/blog-tags";
import { useCricGeekSession } from "@/hooks/useCricGeekSession";
import { rankExpressionCandidates } from "@/lib/expression-recommendations";
import { getLocalExpressionSignals, recordLocalExpressionsSeen } from "@/lib/communities/local-community-service";

interface Blog {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  tags: string;
  matchTag?: string | null;
  views: number;
  runs: number;
  createdAt: string;
  author: { id: string; name: string; avatar: string | null; role?: string };
  _count: { comments: number; reactions?: number; saves?: number };
  score?: { bqs: number; archetypeLabel: string; processingStatus?: string } | null;
  viewerState?: { reacted: boolean; saved: boolean };
  reactionCount?: number;
  saveCount?: number;
}

function getScoreColor(bqs: number): string {
  if (bqs >= 80) return "text-green-400";
  if (bqs >= 60) return "text-yellow-400";
  if (bqs >= 40) return "text-orange-400";
  return "text-red-400";
}

function getScoreBg(bqs: number): string {
  if (bqs >= 80) return "bg-green-400/10";
  if (bqs >= 60) return "bg-yellow-400/10";
  if (bqs >= 40) return "bg-orange-400/10";
  return "bg-red-400/10";
}

function getSeenExpressionSlugs(userId: string) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(`cricgeek.seenExpressions.${userId}`) || "[]");
    return Array.isArray(saved) ? saved.filter((slug): slug is string => typeof slug === "string").slice(-100) : [];
  } catch {
    return [];
  }
}

function rememberSeenExpressionSlugs(userId: string, slugs: string[]) {
  try {
    const seen = new Set([...getSeenExpressionSlugs(userId), ...slugs]);
    sessionStorage.setItem(`cricgeek.seenExpressions.${userId}`, JSON.stringify([...seen].slice(-100)));
  } catch {
    // Session storage is optional; ranking still works without the repeat-view signal.
  }
}

function BlogPageContent() {
  const searchParams = useSearchParams();
  const { user, status, isLocalUser } = useCricGeekSession();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const initialFeed = searchParams.get("feed");
  const [feed, setFeed] = useState<"latest" | "for-you" | "saved">(
    initialFeed === "saved" || initialFeed === "for-you" ? initialFeed : "latest"
  );
  const matchId = searchParams.get("matchId") || "";
  const currentUserId = user?.id ?? "";

  useEffect(() => {
    let active = true;
    const fetchBlogs = async () => {
      if (feed !== "latest" && status === "loading") return;
      if (feed !== "latest" && status === "unauthenticated") {
        setBlogs([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (matchId) params.set("matchId", matchId);
        const localDemoFeed = Boolean(isLocalUser && currentUserId && feed !== "latest");
        params.set("feed", localDemoFeed ? "latest" : feed);
        if (localDemoFeed) params.set("limit", "250");
        if (feed === "for-you" && currentUserId && !isLocalUser) {
          const seenSlugs = getSeenExpressionSlugs(currentUserId);
          if (seenSlugs.length > 0) params.set("seen", seenSlugs.join(","));
        }
        const res = await fetch(`/api/blogs${params.toString() ? `?${params.toString()}` : ""}`);
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        if (!res.ok) {
          setBlogs([]);
          return;
        }
        let nextBlogs: Blog[] = data.blogs || [];

        if (localDemoFeed && currentUserId) {
          const localSignals = getLocalExpressionSignals(currentUserId);
          const savedSlugs = new Set(localSignals.savedSlugs);
          const reactedSlugs = new Set(localSignals.reactedSlugs);

          if (feed === "saved") {
            nextBlogs = nextBlogs.filter((blog) => savedSlugs.has(blog.slug));
          } else {
            const interactedBlogs = nextBlogs.filter(
              (blog) => savedSlugs.has(blog.slug) || reactedSlugs.has(blog.slug)
            );
            nextBlogs = rankExpressionCandidates(nextBlogs, {
              followedWriterIds: localSignals.followedWriterIds,
              interactedAuthorIds: interactedBlogs.map((blog) => blog.author.id),
              interactedTags: interactedBlogs.flatMap((blog) => parseBlogTags(blog.tags)),
              communityTopics: localSignals.communityTopics,
              ownExpressionTopics: localSignals.ownExpressionTopics,
              seenSlugs: localSignals.seenSlugs,
            }).slice(0, 10);
          }

          nextBlogs = nextBlogs.map((blog) => ({
            ...blog,
            viewerState: {
              reacted: reactedSlugs.has(blog.slug),
              saved: savedSlugs.has(blog.slug),
            },
          }));
          recordLocalExpressionsSeen(currentUserId, nextBlogs.map((blog) => blog.slug));
        } else if (feed === "for-you" && currentUserId) {
          rememberSeenExpressionSlugs(currentUserId, nextBlogs.map((blog) => blog.slug));
        }

        setBlogs(nextBlogs);
      } catch {
        if (active) setBlogs([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchBlogs();
    return () => {
      active = false;
    };
  }, [matchId, feed, status, currentUserId, isLocalUser]);

  const filteredBlogs = blogs.filter(
    (blog) =>
      blog.title.toLowerCase().includes(search.toLowerCase()) ||
      blog.tags.toLowerCase().includes(search.toLowerCase())
  );
  const signInHref = `/auth/login?redirect=${encodeURIComponent(`/blog?feed=${feed}`)}`;

  return (
    <div>
      <div className="w-full border-b border-gray-800/80 bg-cg-dark">
        <div className="mx-auto max-w-[1440px] px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <AdSlot slot="expressions-top" size="leaderboard" placeholder className="mx-auto" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <PenSquare className="text-cg-green" />
              Expressions
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {matchId
                ? "Coverage linked to this match, including previews, reactions, and discussion."
                : "AI-scored cricket expressions, opinions, and discussion"}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="hidden sm:flex items-center gap-1 rounded-lg border border-gray-800 bg-cg-dark-2 p-1">
              {[
                { id: "latest", label: "Latest" },
                { id: "for-you", label: "For You" },
                { id: "saved", label: "Saved" },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFeed(option.id as "latest" | "for-you" | "saved")}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                    feed === option.id
                      ? "bg-cg-green text-black"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Link
              href="/leaderboard"
              className="bg-white/5 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-white/10 transition-all border border-gray-700 inline-flex items-center gap-2"
            >
              <Trophy size={16} className="text-yellow-400" />
              Leaderboard
            </Link>
            <Link
              href="/blog/write"
              className="bg-cg-green text-black px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-cg-green-dark transition-all inline-flex items-center gap-2"
            >
              <PenSquare size={16} />
              Express Yourself
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expressions by title or tag..."
            className="w-full bg-cg-dark-2 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:border-cg-green focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Blog List */}
          <div className="lg:col-span-2 space-y-4">
            {feed !== "latest" && status === "unauthenticated" ? (
              <div className="rounded-xl border border-gray-800 bg-cg-dark-2 px-6 py-10 text-center">
                <h2 className="text-lg font-bold text-white">
                  {feed === "saved" ? "Sign in to view saved expressions" : "Sign in for your For You feed"}
                </h2>
                <p className="mt-2 text-sm text-gray-400">
                  {feed === "saved"
                    ? "Saved expressions are private to your account."
                    : "Sign in to see expressions selected from your activity and preferences."}
                </p>
                <Link
                  href={signInHref}
                  className="mt-5 inline-flex items-center rounded-lg bg-cg-green px-4 py-2 text-sm font-bold text-black hover:bg-cg-green-dark"
                >
                  Sign In
                </Link>
              </div>
            ) : loading || (feed !== "latest" && status === "loading") ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-cg-dark-2 border border-gray-800 rounded-xl p-5 animate-pulse">
                    <div className="h-5 bg-gray-800 rounded w-3/4 mb-3" />
                    <div className="h-4 bg-gray-800 rounded w-full mb-2" />
                    <div className="h-4 bg-gray-800 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : filteredBlogs.length === 0 ? (
              <div className="text-center py-12">
                <PenSquare size={48} className="text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400">
                  {feed === "saved"
                    ? "You have not saved any expressions yet."
                    : feed === "for-you"
                      ? "Save or react to expressions and follow writers to personalize this feed."
                      : "No expressions found. Be the first to share one."}
                </p>
              </div>
            ) : (
              filteredBlogs.map((blog) => (
                <article key={blog.id} className="bg-cg-dark-2 border border-gray-800 rounded-xl p-5 hover:border-cg-green/50 transition-all group">
                  <div className="flex items-start gap-4">
                    {blog.score?.processingStatus === "processing" ? (
                      <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border border-amber-500/30 bg-amber-500/10 text-amber-300">
                        <span className="text-[9px] font-black uppercase tracking-[0.18em]">Live</span>
                        <span className="text-[9px] font-medium">Scoring</span>
                      </div>
                    ) : blog.score ? (
                      <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${getScoreBg(blog.score.bqs)}`}>
                        <span className={`text-lg font-black leading-none ${getScoreColor(blog.score.bqs)}`}>
                          {blog.score.bqs}
                        </span>
                        <span className="text-[8px] text-gray-500 font-medium">EQS</span>
                      </div>
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <Link href={`/blog/${blog.slug}`} className="block">
                        <h2 className="text-lg font-bold text-white group-hover:text-cg-green transition-colors">
                          {blog.title}
                        </h2>
                        <p className="text-gray-400 text-sm mt-1.5 line-clamp-2">
                          {blog.excerpt}
                        </p>
                      </Link>
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
                        <Link
                          href={`/writer/${blog.author.id}`}
                          className="text-cg-green font-medium hover:underline"
                        >
                          {blog.author.name}
                        </Link>
                        {blog.score?.processingStatus === "processing" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                            Scoring in progress
                          </span>
                        ) : blog.score?.archetypeLabel && (() => {
                          const meta = ARCHETYPE_META[blog.score.archetypeLabel];
                          return meta ? (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${meta.bgColor} ${meta.color}`}>
                              {meta.icon} {meta.label}
                            </span>
                          ) : null;
                        })()}
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(blog.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={12} />
                          {blog.views}
                        </span>
                        <span className="flex items-center gap-1 text-orange-400">
                          🏏 {blog.reactionCount ?? blog.runs ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={12} />
                          {blog._count.comments}
                        </span>
                      </div>
                      {blog.tags && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {parseBlogTags(blog.tags).map((tag) => (
                            <span
                              key={`${blog.id}-${tag}`}
                              className="bg-gray-800 text-gray-400 text-[10px] px-2 py-0.5 rounded-full"
                            >
                              #{tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <CricketBallReactionButton
                          slug={blog.slug}
                          initialCount={blog.reactionCount ?? blog.runs ?? 0}
                          initialReacted={Boolean(blog.viewerState?.reacted)}
                          compact
                          loginHref={`/auth/login?redirect=/blog/${blog.slug}`}
                        />
                        <SaveBlogButton
                          slug={blog.slug}
                          initialSaved={Boolean(blog.viewerState?.saved)}
                          initialCount={blog.saveCount ?? blog._count.saves ?? 0}
                          compact
                          loginHref={`/auth/login?redirect=/blog/${blog.slug}`}
                        />
                        <Link
                          href={`/blog/${blog.slug}`}
                          className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
                        >
                          {blog.score?.processingStatus === "processing" ? "Check later" : "Read Match Story"}
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Top Writer */}
            <div className="bg-cg-dark-2 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <TrendingUp size={14} className="text-cg-green" />
                Top Writer
              </h3>
              <WriterProfileCard
                id="1"
                name="CricAnalyst Pro"
                avatar={null}
                archetype="analyst"
                level={8}
                xp={780}
                averageBQS={88.5}
                totalBlogs={34}
                compact
              />
            </div>

            <div className="bg-cg-dark-2 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-3">Popular Tags</h3>
              <div className="flex flex-wrap gap-2">
                {["analysis", "ipl", "test-cricket", "world-cup", "india", "t20", "bowling", "batting"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearch(tag)}
                    className="bg-gray-800 text-gray-300 text-xs px-3 py-1.5 rounded-full hover:bg-cg-green/20 hover:text-cg-green transition-all"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-cg-dark-2 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-2">What is EQS?</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Expression Quality Score (EQS) is our cricket expression engine. Each expression is checked for originality, coherence,
                constructiveness, evidence strength, fact accuracy, argument logic, depth, balance, and negativity-versus-toxicity
                before a final 0-100 score is assembled.
              </p>
              <Link href="/leaderboard" className="text-cg-green text-xs font-medium mt-2 inline-block hover:underline">
                View Leaderboard →
              </Link>
            </div>

            <div className="bg-cg-dark-2 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-2">Expression Guidelines</h3>
              <ul className="text-gray-400 text-xs space-y-1">
                <li>• Expressions must be 50–2000 words</li>
                <li>• Cricket-related content only</li>
                <li>• No hate speech or personal attacks</li>
                <li>• Borderline toxic or spammy writing is blocked</li>
                <li>• Cricket-ball reactions and saves help shape your feed</li>
                <li>• Higher EQS → higher leaderboard rank</li>
              </ul>
            </div>

            <AdSlot slot="blog-sidebar" format="rectangle" />
          </div>
        </div>
      </div>
    </div>
  );
}

function BlogPageFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-4">
        {[1, 2, 3].map((index) => (
          <div
            key={index}
            className="bg-cg-dark-2 border border-gray-800 rounded-xl p-5 animate-pulse"
          >
            <div className="h-5 bg-gray-800 rounded w-3/4 mb-3" />
            <div className="h-4 bg-gray-800 rounded w-full mb-2" />
            <div className="h-4 bg-gray-800 rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={<BlogPageFallback />}>
      <BlogPageContent />
    </Suspense>
  );
}
