import { DocsLayout } from "@/components/DocsLayout";
import { Target, Zap, CheckCircle } from "lucide-react";

export function RoadmapPage() {
  const quarters = [
    {
      quarter: "Q2 2026",
      items: [
        { task: "Video trimming tools", status: "done" },
        { task: "AI-powered content recommendations", status: "in-progress" },
        { task: "Enhanced mobile experience", status: "in-progress" },
        { task: "Advanced scheduling tools", status: "planned" },
      ],
    },
    {
      quarter: "Q3 2026",
      items: [
        { task: "AI co-creation tools", status: "planned" },
        { task: "Web3 integration", status: "planned" },
        { task: "NFT support", status: "planned" },
        { task: "Podcast hosting platform", status: "planned" },
      ],
    },
    {
      quarter: "Q4 2026",
      items: [
        { task: "Subscription management v2", status: "planned" },
        { task: "Advanced royalty tracking", status: "planned" },
        { task: "Multi-language support", status: "planned" },
      ],
    },
  ];

  const statusColor = {
    done: "bg-green-500/20 text-green-700 dark:text-green-400",
    "in-progress": "bg-blue-500/20 text-blue-700 dark:text-blue-400",
    planned: "bg-gray-500/20 text-gray-700 dark:text-gray-400",
  };

  return (
    <DocsLayout
      title="Product Roadmap"
      description="See what's coming to inlivin"
      breadcrumbs={[{ label: "Product", href: "/docs" }]}
    >
      <div className="space-y-12">
        {quarters.map((q, idx) => (
          <div key={idx}>
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Target className="text-primary" />
              {q.quarter}
            </h2>
            <div className="space-y-3">
              {q.items.map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg border border-border bg-card flex items-center justify-between"
                >
                  <span className="text-foreground">{item.task}</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      statusColor[item.status as keyof typeof statusColor]
                    }`}
                  >
                    {item.status === "done"
                      ? "✓ Released"
                      : item.status === "in-progress"
                        ? "🔄 In Progress"
                        : "📅 Planned"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6">
          <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
            <Zap className="text-primary" />
            How to Vote on Features
          </h2>
          <p className="text-muted-foreground">
            Have ideas for features you'd like to see? Join our Discord community and let us
            know! Your feedback helps shape the future of inlivin.
          </p>
        </div>
      </div>
    </DocsLayout>
  );
}
