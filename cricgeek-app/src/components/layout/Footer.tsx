import Link from "next/link";

const footerLinks = {
  Cricket: [
    { href: "/matches", label: "Live Matches" },
    { href: "/calendar", label: "Match Calendar" },
    { href: "/blog", label: "Community Expressions" },
  ],
  Legal: [
    { href: "/legal/privacy", label: "Privacy Policy" },
    { href: "/legal/terms", label: "Terms of Use" },
    { href: "/legal/guidelines", label: "Community Guidelines" },
    { href: "/legal/content-policy", label: "Content & IP Policy" },
  ],
  Company: [{ href: "/contact", label: "Contact Us" }],
};

export default function Footer() {
  return (
    <footer className="bg-[var(--bg-surface)] border-t border-[var(--border-color)] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-cg-green rounded-lg flex items-center justify-center">
                <span className="text-black font-black text-lg">CG</span>
              </div>
              <span className="text-[var(--text-primary)] font-bold text-xl">CricGeek</span>
            </div>
            <p className="text-[var(--text-secondary)] text-sm">
              Your ultimate cricket companion. Live scores, expert analysis,
              and community-driven cricket discussion.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-[var(--text-primary)] font-semibold mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[var(--text-secondary)] hover:text-cg-green text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--border-color)] mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[var(--text-muted)] text-sm">
            © {new Date().getFullYear()} CricGeek. All rights reserved.
          </p>
          <p className="text-[var(--text-faint)] text-xs">
            Cricket data provided by SportMonks. Not affiliated with ICC or BCCI.
          </p>
        </div>
      </div>
    </footer>
  );
}
