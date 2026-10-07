import { auth } from "@/lib/auth";
import WriteBlogGate from "@/components/blog/WriteBlogGate";

export default async function WriteBlogLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  return <WriteBlogGate serverAuthenticated={Boolean(userId)}>{children}</WriteBlogGate>;
}