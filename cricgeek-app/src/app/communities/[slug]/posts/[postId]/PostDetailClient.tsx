"use client";

import { useMemo, useState, useEffect } from "react";
import { Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import AdSlot from "@/components/ads/AdSlot";
import { Community, Post } from "../../../mockData";
import { getPostById } from "@/lib/communities/local-community-service";
import { useLocalCommunitySession } from "@/hooks/useLocalCommunitySession";

export default function PostDetailClient({
  community,
  post,
  postId,
}: {
  community: Community;
  post: Post | null;
  postId: string;
}) {
  const { snapshot } = useLocalCommunitySession();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const resolvedPost = useMemo(
    () => post ?? (mounted ? getPostById(community.slug, postId) : null),
    [community.slug, mounted, post, postId, snapshot]
  );

  if (!resolvedPost) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.08),transparent_40%),linear-gradient(180deg,#060606,#0a0a0a)] text-white">
        <div className="mx-auto max-w-[1440px] px-4 py-16 text-center text-gray-400">
          {mounted ? "This discussion could not be found." : "Loading discussion..."}
        </div>
      </div>
    );
  }

  const authorHref = resolvedPost.authorId ? `/writer/${resolvedPost.authorId}` : null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.08),transparent_40%),linear-gradient(180deg,#060606,#0a0a0a)] text-white">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 xl:px-20 py-8">
        
        <div className="mb-6">
          <Link href={`/communities/${community.slug}`} className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-cg-green transition-all">
            <ArrowLeft size={16} /> Back to {community.name}
          </Link>
        </div>

        <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-8 flex flex-col">

          <main className="flex-1 w-full min-w-0 flex flex-col gap-8">
            <article className="bg-white/[0.02] border border-gray-800 rounded-3xl p-6 sm:p-10 shadow-sm">
              <div className="mb-8">
                <div className="inline-flex rounded-full border border-cg-green/20 bg-cg-green/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cg-green mb-4">
                  {resolvedPost.category}
                </div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-6 leading-tight">
                  {resolvedPost.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 border-t border-b border-gray-800 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-cg-dark-2 border border-gray-700 flex items-center justify-center text-xs font-bold text-cg-green">
                      {resolvedPost.author.charAt(0).toUpperCase()}
                    </div>
                    {authorHref ? (
                      <Link href={authorHref} className="font-semibold text-gray-200 hover:text-cg-green">
                        {resolvedPost.author}
                      </Link>
                    ) : (
                      <span className="font-semibold text-gray-200">{resolvedPost.author}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>{resolvedPost.date}</span>
                  </div>
                  <div className="text-gray-500">
                    {resolvedPost.readTime}
                  </div>
                </div>
              </div>

              <div className="max-w-none">
                <p className="text-lg text-gray-300 font-medium mb-8 leading-relaxed">
                  {resolvedPost.summary}
                </p>
                
                {resolvedPost.content ? (
                  resolvedPost.content.map((paragraph, idx) => (
                    <p key={idx} className="text-gray-400 leading-loose mb-6 text-base tracking-wide">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No full content provided for this post.</p>
                )}
              </div>
            </article>
            
            <div className="xl:hidden w-full flex justify-center my-4">
               <AdSlot slot="post-detail-mobile-1" size="mobile-banner" placeholder />
            </div>

          </main>

          <aside className="hidden xl:flex flex-col gap-6 sticky top-24 h-max">
            <AdSlot slot="post-detail-right-1" size="rectangle" placeholder />
            <AdSlot slot="post-detail-right-2" size="half-page" placeholder />
          </aside>
          
        </div>
      </div>
    </div>
  );
}
