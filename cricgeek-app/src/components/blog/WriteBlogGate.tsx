"use client";

import Link from "next/link";
import { useCricGeekSession } from "@/hooks/useCricGeekSession";

export default function WriteBlogGate({
  children,
  serverAuthenticated,
}: {
  children: React.ReactNode;
  serverAuthenticated: boolean;
}) {
  const { user, status } = useCricGeekSession();

  if (serverAuthenticated || user) return children;
  if (status === "loading") return <div className="min-h-[60vh]" />;

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-12">
      <section className="w-full rounded-xl border border-gray-800 bg-cg-dark-2 p-6 text-center sm:p-8">
        <h1 className="text-xl font-bold text-white">Sign in to express yourself</h1>
        <p className="mt-2 text-sm text-gray-400">
          Sign in to open the expression editor and publish your writing.
        </p>
        <Link
          href={`/auth/login?redirect=${encodeURIComponent("/blog/write")}`}
          className="mt-5 inline-flex items-center rounded-lg bg-cg-green px-4 py-2 text-sm font-bold text-black hover:bg-cg-green-dark"
        >
          Sign In
        </Link>
      </section>
    </div>
  );
}