export default function Template({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="cg-page-transition">{children}</div>;
}