"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search as SearchIcon, Users } from "lucide-react";
import AdSlot from "@/components/ads/AdSlot";
import CommunityActions from "@/components/communities/CommunityActions";
import { SAMPLE_COMMUNITIES, Community } from "./mockData";
import { getExtraMemberCount } from "@/lib/communities/local-community-service";
import { useLocalCommunitySession } from "@/hooks/useLocalCommunitySession";

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatMemberCount(base: number, extra: number): string {
  const total = base + extra;
  if (extra > 0) return total.toLocaleString();
  return formatNumber(base);
}

function CommunityCard({ community }: { community: Community }) {
  const router = useRouter();
  const extraMembers = getExtraMemberCount(community.id);

  const handleCardClick = () => {
    router.push(`/communities/${community.slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <article 
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="link"
      aria-label={`View ${community.name} community`}
      className="rounded-3xl border border-gray-800 bg-[linear-gradient(160deg,rgba(17,17,17,0.95),rgba(12,28,18,0.9))] p-5 shadow-sm transition-all hover:border-gray-700 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-cg-green focus-visible:border-transparent"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="inline-flex rounded-full border border-cg-green/20 bg-cg-green/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cg-green mb-3">
            {community.topic}
          </div>
          <h3 className="text-xl font-black text-white">{community.name}</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">
            {community.description}
          </p>
          
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Users size={16} />
              <span><strong className="text-gray-300">{formatMemberCount(community.followers, extraMembers)}</strong> Members</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span><strong className="text-gray-300">{formatNumber(community.posts)}</strong> Posts</span>
            </div>
          </div>
          
          {community.topWriters.length > 0 && (
            <div className="mt-5 flex flex-col gap-2">
              <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold mr-1">Popular Writers:</span>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-1">
                {community.topWriters.map((writer) => (
                  <Link key={writer.id} href={`/writer/${writer.id}`} onClick={(event) => event.stopPropagation()} className="flex items-center gap-2 rounded-sm outline-none hover:text-cg-green focus-visible:ring-2 focus-visible:ring-cg-green">
                    <div className="w-6 h-6 rounded-full bg-cg-dark-2 border border-gray-700 flex items-center justify-center text-[9px] font-bold text-cg-green">
                      {writer.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-300">{writer.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div onClick={(event) => event.stopPropagation()}>
          <CommunityActions community={community} />
        </div>
      </div>
    </article>
  );
}

export default function CommunitiesClient() {
  useLocalCommunitySession();
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);

  const filteredCommunities = SAMPLE_COMMUNITIES.filter((community) => {
    if (!deferredQuery.trim()) return community.isTrending;
    
    const lowerQuery = deferredQuery.toLowerCase();
    return (
      community.name.toLowerCase().includes(lowerQuery) ||
      community.topic.toLowerCase().includes(lowerQuery) ||
      community.description.toLowerCase().includes(lowerQuery)
    );
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.08),transparent_40%),linear-gradient(180deg,#060606,#0a0a0a)] text-white">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 xl:px-20 py-8">
        
        <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-8 flex flex-col">

          <main className="flex-1 w-full min-w-0 flex flex-col gap-8">
            
            <section className="bg-white/[0.02] border border-gray-800 rounded-3xl p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-cg-green/20 bg-cg-green/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-cg-green mb-6">
                <Users size={14} />
                Network
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
                Communities
              </h1>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6">
                Discover, follow, and participate in cricket communities. Talk about your favorite players, teams, or analytical topics.
              </p>

              <div className="relative flex items-center">
                <SearchIcon size={20} className="absolute left-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search communities, players, teams, or topics..."
                  className="w-full bg-black/40 border border-gray-700 hover:border-gray-500 focus:border-cg-green transition-all rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </section>
            
            <div className="xl:hidden w-full flex justify-center my-2">
              <AdSlot slot="communities-mobile-1" size="mobile-banner" placeholder />
            </div>

            <section className="flex flex-col gap-5">
              <h2 className="text-lg font-bold uppercase tracking-wider text-gray-300 px-2">
                {deferredQuery.trim() ? "Search Results" : "Trending Communities"}
              </h2>

              {filteredCommunities.length > 0 ? (
                filteredCommunities.map((community) => (
                  <CommunityCard key={community.id} community={community} />
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-gray-700 bg-white/[0.01] p-12 text-center">
                  <div className="flex justify-center mb-4 text-gray-600">
                    <SearchIcon size={40} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-300 mb-2">No communities found.</h3>
                  <p className="text-sm text-gray-500">
                    Try searching for another player, team, tournament, or cricket topic.
                  </p>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="mt-6 text-cg-green text-sm font-semibold hover:underline"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </section>
            
            <div className="xl:hidden w-full flex justify-center my-4">
               <AdSlot slot="communities-mobile-2" size="mobile-banner" placeholder />
            </div>

          </main>

          <aside className="hidden xl:block w-[300px]">
            <div className="sticky top-24 flex flex-col gap-6">
              <AdSlot slot="communities-right-1" size="rectangle" placeholder />
              <AdSlot slot="communities-right-2" size="rectangle" placeholder />
              <AdSlot slot="communities-right-3" size="half-page" placeholder />
            </div>
          </aside>
          
        </div>
      </div>
    </div>
  );
}
