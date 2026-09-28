import type { Metadata } from "next";
import CommunitiesClient from "./CommunitiesClient";

export const metadata: Metadata = {
  title: "Communities | CricGeek",
  description: "Discover, follow, and participate in cricket communities.",
};

export const runtime = "nodejs";

export default function CommunitiesPage() {
  return <CommunitiesClient />;
}
