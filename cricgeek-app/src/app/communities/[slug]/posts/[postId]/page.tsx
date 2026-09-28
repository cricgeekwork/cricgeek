import { notFound } from "next/navigation";
import PostDetailClient from "./PostDetailClient";
import { SAMPLE_COMMUNITIES, SAMPLE_POSTS } from "../../../mockData";

export const runtime = "nodejs";

export default async function PostDetailPage({ params }: { params: Promise<{ slug: string; postId: string }> }) {
  const resolvedParams = await params;
  const community = SAMPLE_COMMUNITIES.find(c => c.slug === resolvedParams.slug);
  const post = SAMPLE_POSTS.find(p => p.id === resolvedParams.postId && p.communitySlug === resolvedParams.slug) ?? null;

  if (!community) {
    notFound();
  }

  return <PostDetailClient community={community} post={post} postId={resolvedParams.postId} />;
}
