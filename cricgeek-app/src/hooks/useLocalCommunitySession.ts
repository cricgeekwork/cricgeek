"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  getCurrentUser,
  getLocalCommunitySnapshot,
  subscribeLocalCommunityState,
} from "@/lib/communities/local-community-service";

export function useLocalCommunitySession() {
  const snapshot = useSyncExternalStore(
    subscribeLocalCommunityState,
    getLocalCommunitySnapshot,
    () => ""
  );

  const user = useMemo(() => getCurrentUser(), [snapshot]);
  const refresh = useCallback(() => getCurrentUser(), [snapshot]);

  return { user, snapshot, refresh };
}
