"use client";

import { useRouter } from "next/navigation";
import { Community } from "@/app/communities/mockData";
import { useLocalCommunitySession } from "@/hooks/useLocalCommunitySession";
import {
  cancelJoinRequest,
  followCommunity,
  getMembershipState,
  isFollowingCommunity,
  sendJoinRequest,
  unfollowCommunity,
} from "@/lib/communities/local-community-service";
import type { LocalDemoUser } from "@/lib/communities/local-users";

function loginHref() {
  if (typeof window === "undefined") return "/auth/login";
  return `/auth/login?next=${encodeURIComponent(window.location.pathname)}`;
}

function FollowButton({
  following,
  onClick,
}: {
  following: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-2.5 px-4 rounded-xl text-sm font-bold transition-all border ${
        following
          ? "bg-[var(--tag-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--border-color)]"
          : "bg-[var(--btn-secondary-bg)] text-[var(--text-primary)] border-[var(--border-muted)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover-2)]"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}

function JoinButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  const joined = label === "Joined" || label === "Head";
  const pending = label === "Request Sent";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled && label === "Joined"}
      className={`py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
        joined
          ? "bg-[var(--tag-bg)] text-[var(--text-secondary)] border border-[var(--border-color)]"
          : pending
            ? "bg-[var(--tag-bg)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--border-color)]"
            : "cg-btn-primary"
      } ${disabled && label === "Joined" ? "cursor-default" : ""}`}
    >
      {label}
    </button>
  );
}

export default function CommunityActions({
  community,
  stacked = false,
}: {
  community: Community;
  stacked?: boolean;
}) {
  const router = useRouter();
  const { user, snapshot } = useLocalCommunitySession();
  const following = user ? isFollowingCommunity(community.id, user.id) : false;
  const membership = getMembershipState(community.id, user?.id ?? null);

  const requireUser = (event: React.MouseEvent, action: (current: LocalDemoUser) => void) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      router.push(loginHref());
      return;
    }
    action(user);
  };

  const joinLabel =
    membership === "head" ? "Head" : membership === "joined" ? "Joined" : membership === "pending" ? "Request Sent" : "Join";

  return (
    <div
      className={`flex gap-2 min-w-[220px] ${stacked ? "sm:flex-col" : "flex-row flex-wrap"}`}
      data-state={snapshot}
    >
      {membership !== "head" && (
        <FollowButton
          following={following}
          onClick={(event) =>
            requireUser(event, (current) => {
              if (isFollowingCommunity(community.id, current.id)) {
                unfollowCommunity(community.id, current.id);
              } else {
                followCommunity(community.id, current.id);
              }
            })
          }
        />
      )}
      {membership === "head" ? (
        <JoinButton label="Head" disabled onClick={(event) => event.stopPropagation()} />
      ) : (
        <JoinButton
          label={joinLabel}
          disabled={membership === "joined"}
          onClick={(event) =>
            requireUser(event, (current) => {
              if (membership === "joined") return;
              if (membership === "pending") {
                cancelJoinRequest(community.id, current.id);
                return;
              }
              sendJoinRequest(community.id, current.id);
            })
          }
        />
      )}
    </div>
  );
}
