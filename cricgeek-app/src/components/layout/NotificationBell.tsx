"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useLocalCommunitySession } from "@/hooks/useLocalCommunitySession";
import {
  getCommunity,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
} from "@/lib/communities/local-community-service";

export default function NotificationBell() {
  const { user } = useLocalCommunitySession();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const notifications = getNotifications(user.id);
  const unread = getUnreadNotificationCount(user.id);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`relative ${open ? "z-[51]" : ""} text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800/50 transition-all`}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-cg-green text-black text-[10px] font-black flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 flex max-h-[80dvh] w-80 flex-col overflow-hidden rounded-xl border border-gray-700 bg-cg-dark-2 shadow-xl z-50 max-md:fixed max-md:left-3 max-md:right-3 max-md:top-[4.5rem] max-md:mt-0 max-md:w-auto max-md:max-h-[80dvh] max-md:max-w-none">
            <div className="shrink-0 border-b border-gray-800 px-4 py-3">
              <p className="text-sm font-bold text-white">Notifications</p>
            </div>
            {notifications.length === 0 ? (
              <p className="min-h-0 overflow-y-auto px-4 py-6 text-sm text-gray-500 max-md:break-words">No notifications yet.</p>
            ) : (
              <div className="min-h-0 max-h-80 overflow-y-auto py-1 max-md:max-h-none max-md:flex-1">
                {notifications.map((notification) => {
                  const community = getCommunity(notification.communityId);
                  return (
                    <Link
                      key={notification.id}
                      href={community ? `/communities/${community.slug}#join-requests` : "/communities"}
                      onClick={() => {
                        markNotificationRead(notification.id);
                        setOpen(false);
                      }}
                      className={`block break-words px-4 py-3 text-sm hover:bg-gray-800 transition-all ${
                        notification.read ? "text-gray-400" : "text-white"
                      }`}
                    >
                      {notification.message}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
