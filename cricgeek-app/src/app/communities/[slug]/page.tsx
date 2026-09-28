import { notFound } from "next/navigation";
import CommunityDetailClient from "./CommunityDetailClient";
import { SAMPLE_COMMUNITIES } from "../mockData";

export const runtime = "nodejs";

export default async function CommunityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const community = SAMPLE_COMMUNITIES.find(c => c.slug === resolvedParams.slug);

  if (!community) {
    notFound();
  }

  return <CommunityDetailClient community={community} />;
}
