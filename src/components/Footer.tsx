const footerLinks = {
  Product: ["Features", "Pricing", "Changelog", "Roadmap"],
  Community: ["Discord", "Twitter/X", "Blog", "Events"],
  Resources: ["Help Center", "API Docs", "Tutorials", "Status"],
  Legal: ["Privacy", "Terms", "Cookies", "Licenses"],
};

export function Footer() {
  return (
    <footer className="border-t border-border py-16">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <span className="font-display text-xl font-bold text-gradient">inlivin</span>
            <p className="text-sm text-muted-foreground mt-3 max-w-xs">
              The platform where artists come alive. Connect, create, and collaborate globally.
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-display font-semibold text-sm mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">© 2026 Inlivin. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
