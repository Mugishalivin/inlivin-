const footerLinks = {
  Product: [
    { name: "Features", href: "/docs/features" },
    { name: "Pricing", href: "/docs/pricing" },
    { name: "Changelog", href: "/docs/changelog" },
    { name: "Roadmap", href: "/docs/roadmap" },
  ],
  Community: [
    { name: "Discord", href: "/docs/discord" },
    { name: "Twitter/X", href: "/docs/twitter" },
    { name: "Blog", href: "/docs/blog" },
    { name: "Events", href: "/docs/events" },
  ],
  Resources: [
    { name: "Help Center", href: "/docs/help-center" },
    { name: "API Docs", href: "/docs/api" },
    { name: "Tutorials", href: "/docs/tutorials" },
    { name: "Status", href: "/docs/status" },
  ],
  Legal: [
    { name: "Privacy", href: "/docs/privacy" },
    { name: "Terms", href: "/docs/terms" },
    { name: "Cookies", href: "/docs/cookies" },
    { name: "Licenses", href: "/docs/licenses" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border pt-16 pb-10">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2 md:col-span-1">
            <span className="font-display text-xl font-extrabold text-foreground">
              inlivin<span className="text-primary">.</span>
            </span>
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed max-w-xs">
              The platform where artists come alive. Create, collaborate, and connect — globally.
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-display font-semibold text-sm text-foreground mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="section-divider mt-12 mb-8" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">© 2026 Inlivin. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="/docs/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="/docs/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
