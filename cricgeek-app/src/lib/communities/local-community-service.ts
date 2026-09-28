import { Community, Post, SAMPLE_COMMUNITIES, SAMPLE_POSTS } from "@/app/communities/mockData";
import {
  getLocalDemoUser,
  getLocalDemoUsers,
  getLocalWriterProfile,
  type LocalDemoUser,
} from "./local-users";

export type JoinRequestStatus = "pending" | "accepted" | "rejected";

export type JoinRequest = {
  id: string;
  communityId: string;
  requesterId: string;
  status: JoinRequestStatus;
  createdAt: string;
};

export type CommunityNotification = {
  id: string;
  userId: string;
  type: "join_request";
  message: string;
  communityId: string;
  requestId: string;
  requesterId: string;
  read: boolean;
  createdAt: string;
};

export type LocalCommunityState = {
  follows: Array<{ communityId: string; userId: string }>;
  memberships: Array<{ communityId: string; userId: string }>;
  joinRequests: JoinRequest[];
  notifications: CommunityNotification[];
  extraPosts: Post[];
};

const USER_KEY = "cricgeek.local.currentUserId";
const STATE_KEY = "cricgeek.local.communityState";
const STATE_EVENT = "cricgeek-local-state";

const emptyState = (): LocalCommunityState => ({
  follows: [],
  memberships: [],
  joinRequests: [],
  notifications: [],
  extraPosts: [],
});

function canUseStorage() {
  return typeof window !== "undefined";
}

function emitChange() {
  if (!canUseStorage()) return;
  window.dispatchEvent(new Event(STATE_EVENT));
}

function readState(): LocalCommunityState {
  if (!canUseStorage()) return emptyState();
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<LocalCommunityState>;
    return {
      follows: parsed.follows ?? [],
      memberships: parsed.memberships ?? [],
      joinRequests: parsed.joinRequests ?? [],
      notifications: parsed.notifications ?? [],
      extraPosts: parsed.extraPosts ?? [],
    };
  } catch {
    return emptyState();
  }
}

function writeState(state: LocalCommunityState) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
  emitChange();
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function subscribeLocalCommunityState(listener: () => void) {
  if (!canUseStorage()) return () => undefined;
  window.addEventListener(STATE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(STATE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

export function getLocalCommunitySnapshot() {
  if (!canUseStorage()) return "";
  return `${window.localStorage.getItem(USER_KEY) ?? ""}|${window.localStorage.getItem(STATE_KEY) ?? ""}`;
}

export function getUserWriterProfile(userId: string) {
  const profile = getLocalWriterProfile(userId);
  if (!profile) return null;
  const joinedNames = SAMPLE_COMMUNITIES
    .filter((community) => isCommunityMember(community.id, userId))
    .map((community) => community.name);
  const communities = Array.from(new Set([...(profile.communities ?? []), ...joinedNames]));
  return { ...profile, communities };
}

export function getCurrentUser(): LocalDemoUser | null {
  if (!canUseStorage()) return null;
  const userId = window.localStorage.getItem(USER_KEY);
  if (!userId) return null;
  return getLocalDemoUser(userId);
}

export function signInLocalUser(userId: string) {
  const user = getLocalDemoUser(userId);
  if (!user || !canUseStorage()) return null;
  window.localStorage.setItem(USER_KEY, userId);
  emitChange();
  return user;
}

export function signOutLocalUser() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(USER_KEY);
  emitChange();
}

export function getUser(userId: string) {
  return getLocalDemoUser(userId);
}

export function listLocalUsers() {
  return getLocalDemoUsers();
}

export function getCommunity(communityId: string) {
  return SAMPLE_COMMUNITIES.find((community) => community.id === communityId) ?? null;
}

export function getCommunityBySlug(slug: string) {
  return SAMPLE_COMMUNITIES.find((community) => community.slug === slug) ?? null;
}

export function isFollowingCommunity(communityId: string, userId: string) {
  return readState().follows.some((item) => item.communityId === communityId && item.userId === userId);
}

export function followCommunity(communityId: string, userId: string) {
  const state = readState();
  if (!state.follows.some((item) => item.communityId === communityId && item.userId === userId)) {
    state.follows.push({ communityId, userId });
    writeState(state);
  }
}

export function unfollowCommunity(communityId: string, userId: string) {
  const state = readState();
  state.follows = state.follows.filter((item) => !(item.communityId === communityId && item.userId === userId));
  writeState(state);
}

export function isCommunityMember(communityId: string, userId: string) {
  const community = getCommunity(communityId);
  if (community?.headId === userId) return true;
  return readState().memberships.some((item) => item.communityId === communityId && item.userId === userId);
}

export function getExtraMemberCount(communityId: string) {
  return readState().memberships.filter((item) => item.communityId === communityId).length;
}

export function getJoinRequest(communityId: string, userId: string) {
  const requests = readState().joinRequests.filter(
    (request) => request.communityId === communityId && request.requesterId === userId
  );
  return requests.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

export function getPendingJoinRequest(communityId: string, userId: string) {
  return (
    readState().joinRequests.find(
      (request) =>
        request.communityId === communityId &&
        request.requesterId === userId &&
        request.status === "pending"
    ) ?? null
  );
}

export function sendJoinRequest(communityId: string, userId: string) {
  const community = getCommunity(communityId);
  const requester = getUser(userId);
  if (!community || !requester) return null;
  if (community.headId === userId || isCommunityMember(communityId, userId)) return getJoinRequest(communityId, userId);

  const existing = getPendingJoinRequest(communityId, userId);
  if (existing) return existing;

  const state = readState();
  const request: JoinRequest = {
    id: newId("jr"),
    communityId,
    requesterId: userId,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  state.joinRequests.push(request);
  state.notifications.push({
    id: newId("nt"),
    userId: community.headId,
    type: "join_request",
    message: `${requester.name} requested to join ${community.name}.`,
    communityId,
    requestId: request.id,
    requesterId: userId,
    read: false,
    createdAt: request.createdAt,
  });
  writeState(state);
  return request;
}

export function cancelJoinRequest(communityId: string, userId: string) {
  const pending = getPendingJoinRequest(communityId, userId);
  if (!pending) return;
  const state = readState();
  state.joinRequests = state.joinRequests.filter((request) => request.id !== pending.id);
  state.notifications = state.notifications.filter((notification) => notification.requestId !== pending.id);
  writeState(state);
}

export function getJoinRequestsForHead(communityId: string, headId: string) {
  const community = getCommunity(communityId);
  if (!community || community.headId !== headId) return [];
  return readState().joinRequests.filter(
    (request) => request.communityId === communityId && request.status === "pending"
  );
}

export function acceptJoinRequest(requestId: string) {
  const state = readState();
  const request = state.joinRequests.find((item) => item.id === requestId);
  if (!request || request.status !== "pending") return null;
  const community = getCommunity(request.communityId);
  const currentUser = getCurrentUser();
  if (!community || !currentUser || community.headId !== currentUser.id) return null;
  request.status = "accepted";
  if (!state.memberships.some((item) => item.communityId === request.communityId && item.userId === request.requesterId)) {
    state.memberships.push({ communityId: request.communityId, userId: request.requesterId });
  }
  state.notifications = state.notifications.map((notification) =>
    notification.requestId === requestId ? { ...notification, read: true } : notification
  );
  writeState(state);
  return request;
}

export function rejectJoinRequest(requestId: string) {
  const state = readState();
  const request = state.joinRequests.find((item) => item.id === requestId);
  if (!request || request.status !== "pending") return null;
  const community = getCommunity(request.communityId);
  const currentUser = getCurrentUser();
  if (!community || !currentUser || community.headId !== currentUser.id) return null;
  request.status = "rejected";
  state.notifications = state.notifications.filter((notification) => notification.requestId !== requestId);
  writeState(state);
  return request;
}

export function getNotifications(userId: string) {
  return readState()
    .notifications.filter((notification) => notification.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getUnreadNotificationCount(userId: string) {
  return getNotifications(userId).filter((notification) => !notification.read).length;
}

export function markNotificationRead(notificationId: string) {
  const state = readState();
  state.notifications = state.notifications.map((notification) =>
    notification.id === notificationId ? { ...notification, read: true } : notification
  );
  writeState(state);
}

export function getCommunityPosts(communitySlug: string): Post[] {
  const seed = SAMPLE_POSTS.filter((post) => post.communitySlug === communitySlug);
  const extra = readState().extraPosts.filter((post) => post.communitySlug === communitySlug);
  return [...extra, ...seed];
}

export function getPostById(communitySlug: string, postId: string): Post | null {
  return getCommunityPosts(communitySlug).find((post) => post.id === postId) ?? SAMPLE_POSTS.find((post) => post.id === postId) ?? null;
}

export function addCommunityPost(input: {
  community: Community;
  author: LocalDemoUser;
  title: string;
  summary: string;
}) {
  if (!isCommunityMember(input.community.id, input.author.id)) return null;
  const state = readState();
  const post: Post = {
    id: newId("p"),
    communityId: input.community.id,
    communitySlug: input.community.slug,
    title: input.title,
    summary: input.summary,
    content: [input.summary],
    author: input.author.name,
    authorId: input.author.id,
    date: "Just now",
    category: "Community Discussion",
    readTime: "2 min read",
  };
  state.extraPosts.unshift(post);
  writeState(state);
  return post;
}

export type CommunityMembershipState = "guest" | "join" | "pending" | "joined" | "head";

export function getMembershipState(communityId: string, userId: string | null): CommunityMembershipState {
  const community = getCommunity(communityId);
  if (!community || !userId) return "join";
  if (community.headId === userId) return "head";
  if (isCommunityMember(communityId, userId)) return "joined";
  if (getPendingJoinRequest(communityId, userId)) return "pending";
  return "join";
}

export function getCommunityHead(community: Community) {
  return getUser(community.headId);
}
