import { DocsLayout } from "@/components/DocsLayout";
import { GitBranch, Tag, Calendar } from "lucide-react";

const versions = [
  {
    version: "2.1.0",
    date: "April 2026",
    type: "Feature Release",
    features: [
      "New video trimming tools in content editor",
      "Real-time collaboration on project notes",
      "Enhanced search with AI-powered recommendations",
      "Dark mode improvements",
      "Mobile app beta launch",
    ],
    fixes: [
      "Fixed audio sync issues in multi-track projects",
      "Resolved marketplace payment discrepancies",
      "Improved live stream stability",
    ],
  },
  {
    version: "2.0.5",
    date: "March 2026",
    type: "Patch",
    features: [
      "New notification preferences settings",
      "Enhanced security options",
      "New analytics filters",
    ],
    fixes: [
      "Fixed export format issues",
      "Resolved timezone handling bugs",
      "Improved mobile responsiveness",
    ],
  },
  {
    version: "2.0.0",
    date: "February 2026",
    type: "Major Release",
    features: [
      "Marketplace launch",
      "Live streaming feature",
      "Advanced team collaboration",
      "API public release",
    ],
  },
];

export function ChangelogPage() {
  return (
    <DocsLayout
      title="Changelog"
      description="Track all updates, improvements, and fixes"
      breadcrumbs={[{ label: "Product", href: "/docs" }]}
    >
      <div className="space-y-8">
        <p className="text-lg text-muted-foreground">
          Stay updated with all the latest changes, features, and improvements.
        </p>

        {versions.map((version, idx) => (
          <div
            key={idx}
            className="border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-foreground">v{version.version}</h3>
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {version.type}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar size={16} />
                  {version.date}
                </div>
              </div>
              <GitBranch className="text-primary flex-shrink-0" size={24} />
            </div>

            <div className="space-y-4">
              {version.features && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Tag size={16} className="text-primary" />
                    Added
                  </h4>
                  <ul className="space-y-2 ml-6">
                    {version.features.map((feature, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        • {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {version.fixes && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Tag size={16} className="text-green-600" />
                    Fixed
                  </h4>
                  <ul className="space-y-2 ml-6">
                    {version.fixes.map((fix, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        • {fix}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </DocsLayout>
  );
}
