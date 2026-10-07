"use client";

import { useSession } from "next-auth/react";
import { useLocalCommunitySession } from "@/hooks/useLocalCommunitySession";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export function useCricGeekSession() {
  const { data: session, status } = useSession();
  const { user: localUser, snapshot: localSnapshot } = useLocalCommunitySession();
  const sessionUser = (session?.user as SessionUser | undefined) ?? null;
  const user = sessionUser ?? (localUser
    ? { id: localUser.id, name: localUser.name, email: localUser.email, role: "user" }
    : null);
  const isLocalUser = Boolean(localUser && (!sessionUser || localUser.id === sessionUser.id));

  return {
    user,
    status: sessionUser ? status : localUser ? "authenticated" as const : status,
    isLocalUser,
    localSnapshot,
  };
}