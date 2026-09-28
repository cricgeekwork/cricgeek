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
        className="relative text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800/50 transition-all"
        aria-label="Notifications"
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
          <div className="absolute right-0 mt-2 w-80 bg-cg-dark-2 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800">
              <p className="text-sm font-bold text-white">Notifications</p>
            </div>
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500">No notifications yet.</p>
            ) : (
              <div className="max-h-80 overflow-y-auto py-1">
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
                      className={`block px-4 py-3 text-sm hover:bg-gray-800 transition-all ${
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
