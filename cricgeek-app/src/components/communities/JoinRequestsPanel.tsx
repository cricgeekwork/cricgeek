"use client";

import Link from "next/link";
import { Community } from "@/app/communities/mockData";
import { useLocalCommunitySession } from "@/hooks/useLocalCommunitySession";
import {
  acceptJoinRequest,
  getJoinRequestsForHead,
  getUser,
  rejectJoinRequest,
} from "@/lib/communities/local-community-service";

export default function JoinRequestsPanel({ community }: { community: Community }) {
  const { user, snapshot } = useLocalCommunitySession();
  if (!user || community.headId !== user.id) return null;

  const requests = getJoinRequestsForHead(community.id, user.id);

  return (
    <section
      id="join-requests"
      data-state={snapshot}
      className="bg-white/[0.02] border border-gray-800 rounded-3xl p-6"
    >
      <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">
        Pending Join Requests
      </h2>
      {requests.length === 0 ? (
        <p className="text-sm text-gray-500">No pending requests right now.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map((request) => {
            const requester = getUser(request.requesterId);
            if (!requester) return null;
            return (
              <div key={request.id} className="rounded-2xl border border-gray-800 bg-black/30 p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <p className="text-white font-bold">{requester.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">@{requester.username}</p>
                    <p className="text-sm text-gray-400 mt-2 max-w-xl">{requester.bio}</p>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-400">
                      <span><strong className="text-gray-200">{requester.articleCount}</strong> Articles</span>
                      <span><strong className="text-gray-200">{requester.totalViews.toLocaleString()}</strong> Views</span>
                      <span><strong className="text-gray-200">{requester.followerCount.toLocaleString()}</strong> Followers</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/writer/${requester.id}`}
                      className="py-2 px-4 rounded-xl text-sm font-bold border border-gray-600 text-gray-200 hover:border-gray-400 hover:bg-gray-800/60 transition-all"
                    >
                      View Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => acceptJoinRequest(request.id)}
                      className="py-2 px-4 rounded-xl text-sm font-bold bg-cg-green text-black hover:bg-cg-green-dark transition-all"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectJoinRequest(request.id)}
                      className="py-2 px-4 rounded-xl text-sm font-bold bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
