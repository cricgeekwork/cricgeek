import { parseBlogTags } from "@/lib/blog-tags";

export type ExpressionCandidate = {
  id: string;
  slug: string;
  authorId?: string | null;
  author?: { id?: string } | null;
  title: string;
  excerpt?: string | null;
  tags?: string | null;
  createdAt: Date | string;
  views?: number;
  runs?: number;
  reactionCount?: number;
  saveCount?: number;
  score?: { bqs?: number | null } | null;
  _count?: { comments?: number; reactions?: number; saves?: number };
  mentionedTeams?: unknown;
  mentionedPlayers?: unknown;
};

export type ExpressionRecommendationSignals = {
  followedWriterIds?: string[];
  interactedAuthorIds?: string[];
  favoriteTags?: string[];
  interactedTags?: string[];
  favoriteTeams?: string[];
  favoritePlayers?: string[];
  communityTopics?: string[];
  ownExpressionTopics?: string[];
  seenSlugs?: string[];
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function readStrings(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((entry): entry is string => typeof entry === "string");
    }
  } catch {
    // Older entity values may be comma-separated text.
  }
  return value.split(",").map((entry) => entry.trim()).filter(Boolean);
}

function frequencyMatches(values: string[], candidates: Set<string>) {
  return values.reduce((count, value) => count + (candidates.has(normalize(value)) ? 1 : 0), 0);
}

function topicMatches(topics: string[], text: string, candidateTags: Set<string>, exactWeight: number, wordWeight: number) {
  let score = 0;
  for (const topic of topics) {
    const normalizedTopic = normalize(topic);
    if (!normalizedTopic) continue;
    if (text.includes(normalizedTopic)) {
      score += exactWeight;
      continue;
    }
    const words = normalizedTopic.split(" ").filter((word) => word.length > 3 && word !== "cricket");
    score += words.filter((word) => candidateTags.has(word) || text.includes(word)).length * wordWeight;
  }
  return Math.min(score, exactWeight * 2);
}

function scoreCandidate(candidate: ExpressionCandidate, signals: ExpressionRecommendationSignals, now: number) {
  const authorId = candidate.authorId ?? candidate.author?.id ?? "";
  const blogTags = parseBlogTags(candidate.tags).map(normalize);
  const tagSet = new Set(blogTags);
  const mentionedTeams = readStrings(candidate.mentionedTeams);
  const mentionedPlayers = readStrings(candidate.mentionedPlayers);
  const text = normalize([
    candidate.title,
    candidate.excerpt ?? "",
    ...blogTags,
    ...mentionedTeams,
    ...mentionedPlayers,
  ].join(" "));
  const preferredTags = (signals.favoriteTags ?? []).map(normalize);
  const interactedTags = (signals.interactedTags ?? []).map(normalize);
  const favoriteTeams = (signals.favoriteTeams ?? []).map(normalize);
  const favoritePlayers = (signals.favoritePlayers ?? []).map(normalize);
  let score = 0;

  if (authorId && signals.followedWriterIds?.includes(authorId)) score += 50;
  const authorInteractions = (signals.interactedAuthorIds ?? []).filter((id) => id === authorId).length;
  score += Math.min(authorInteractions, 3) * 20;
  score += Math.min(frequencyMatches(preferredTags, tagSet), 4) * 12;
  score += Math.min(frequencyMatches(interactedTags, tagSet), 4) * 10;
  score += Math.min(frequencyMatches(favoriteTeams, new Set(mentionedTeams.map(normalize))), 3) * 10;
  score += Math.min(frequencyMatches(favoritePlayers, new Set(mentionedPlayers.map(normalize))), 3) * 12;
  score += topicMatches(signals.communityTopics ?? [], text, tagSet, 14, 3);
  score += topicMatches(signals.ownExpressionTopics ?? [], text, tagSet, 7, 1.5);

  const ageDays = Math.max(0, (now - new Date(candidate.createdAt).getTime()) / 86_400_000);
  score += Math.max(0, 8 - ageDays * 0.25);
  score += Math.max(0, Math.min(100, candidate.score?.bqs ?? 0)) / 12;
  score += Math.log1p(Math.max(0, candidate.views ?? 0)) * 0.4;
  score += Math.log1p(
    Math.max(0, candidate.reactionCount ?? candidate._count?.reactions ?? 0) +
      Math.max(0, candidate.saveCount ?? candidate._count?.saves ?? 0) +
      Math.max(0, candidate.runs ?? 0)
  );
  if (signals.seenSlugs?.includes(candidate.slug)) score -= 14;

  return score;
}

export function rankExpressionCandidates<T extends ExpressionCandidate>(
  candidates: T[],
  signals: ExpressionRecommendationSignals,
  now = Date.now()
) {
  const remaining = candidates
    .map((candidate, order) => ({ candidate, order, score: scoreCandidate(candidate, signals, now) }))
    .filter(({ candidate }, index, list) => list.findIndex((item) => item.candidate.id === candidate.id) === index);
  const ranked: T[] = [];
  const authorCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();

  while (remaining.length > 0) {
    remaining.sort((left, right) => {
      const leftAuthor = left.candidate.authorId ?? left.candidate.author?.id ?? "";
      const rightAuthor = right.candidate.authorId ?? right.candidate.author?.id ?? "";
      const leftTag = normalize(parseBlogTags(left.candidate.tags)[0] ?? "");
      const rightTag = normalize(parseBlogTags(right.candidate.tags)[0] ?? "");
      const leftScore = left.score - (authorCounts.get(leftAuthor) ?? 0) * 4 - (tagCounts.get(leftTag) ?? 0) * 2;
      const rightScore = right.score - (authorCounts.get(rightAuthor) ?? 0) * 4 - (tagCounts.get(rightTag) ?? 0) * 2;
      return rightScore - leftScore || left.order - right.order;
    });

    const [{ candidate }] = remaining.splice(0, 1);
    ranked.push(candidate);
    const authorId = candidate.authorId ?? candidate.author?.id ?? "";
    const tag = normalize(parseBlogTags(candidate.tags)[0] ?? "");
    if (authorId) authorCounts.set(authorId, (authorCounts.get(authorId) ?? 0) + 1);
    if (tag) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }

  return ranked;
}