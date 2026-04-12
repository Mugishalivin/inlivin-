import { DocsLayout } from "@/components/DocsLayout";
import { Cookie, ToggleLeft, Eye } from "lucide-react";

export function CookiesPage() {
  return (
    <DocsLayout
      title="Cookies Policy"
      description="How we use cookies and tracking technologies"
      breadcrumbs={[{ label: "Legal", href: "/docs" }]}
    >
      <div className="space-y-12">
        <p className="text-lg text-muted-foreground">
          Last updated: April 2026 • Effective immediately
        </p>

        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6">
          <h2 className="text-xl font-bold text-foreground mb-3">What Are Cookies?</h2>
          <p className="text-foreground">
            Cookies are small text files stored on your device that contain information about
            your browsing activity, preferences, and session data. They help websites remember
            who you are and how you interact with them.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Types of Cookies We Use</h2>
          <div className="space-y-4">
            {[
              {
                title: "Essential Cookies",
                icon: <Cookie size={24} />,
                description: "Required for basic functionality and security",
              },
              {
                title: "Performance Cookies",
                icon: <Eye size={24} />,
                description: "Help us measure performance and improve services",
              },
              {
                title: "Preference Cookies",
                icon: <ToggleLeft size={24} />,
                description: "Remember your choices like theme and language",
              },
            ].map((type, idx) => (
              <div key={idx} className="p-6 rounded-lg border border-border bg-card">
                <div className="flex items-start gap-3 mb-2">
                  <div className="text-primary">{type.icon}</div>
                  <h3 className="font-semibold text-foreground text-lg">{type.title}</h3>
                </div>
                <p className="text-muted-foreground">{type.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Your Cookie Choices</h2>
          <div className="space-y-4">
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold text-foreground mb-2">Browser Controls</h3>
              <p className="text-sm text-muted-foreground mb-3">
                You can manage cookies through your browser settings:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Delete existing cookies</li>
                <li>• Block cookies from specific sites</li>
                <li>• Delete cookies when closing browser</li>
                <li>• See what cookies are stored</li>
              </ul>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold text-foreground mb-2">Opt-Out Options</h3>
              <p className="text-sm text-muted-foreground mb-3">
                You can opt-out of specific types of cookies:
              </p>
              <button className="text-primary hover:underline text-sm font-semibold">
                Manage Cookie Preferences
              </button>
            </div>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Important Note</h2>
          <p className="text-sm text-foreground">
            Blocking essential cookies may affect website functionality. However, you can still
            use inlivin without accepting non-essential cookies.
          </p>
        </div>
      </div>
    </DocsLayout>
  );
}
