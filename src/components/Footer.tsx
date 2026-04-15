import { useNavigate } from "react-router-dom";

const footerLinks = {
  Product: [
    { name: "Features", path: "/docs/features" },
    { name: "Pricing", path: "/docs/pricing" },
    { name: "Changelog", path: "/docs/changelog" },
    { name: "Roadmap", path: "/docs/roadmap" },
  ],
  Community: [
    { name: "Discord", path: "/docs/discord" },
    { name: "Twitter/X", path: "/docs/twitter" },
    { name: "Blog", path: "/docs/blog" },
    { name: "Events", path: "/docs/events" },
  ],
  Resources: [
    { name: "Help Center", path: "/docs/help-center" },
    { name: "API Docs", path: "/docs/api" },
    { name: "Tutorials", path: "/docs/tutorials" },
    { name: "Status", path: "/docs/status" },
  ],
  Legal: [
    { name: "Privacy", path: "/docs/privacy" },
    { name: "Terms", path: "/docs/terms" },
    { name: "Cookies", path: "/docs/cookies" },
    { name: "Licenses", path: "/docs/licenses" },
  ],
};

export function Footer() {
  const navigate = useNavigate();
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
                {links.map((item) => (
                  <li key={item.name}>
                    <button onClick={() => navigate(item.path)} className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left">
                      {item.name}
                    </button>
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
            <button onClick={() => navigate("/docs/privacy")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</button>
            <button onClick={() => navigate("/docs/terms")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
