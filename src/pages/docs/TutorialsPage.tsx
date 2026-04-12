import { DocsLayout } from "@/components/DocsLayout";
import { Video, BookOpen, Lightbulb } from "lucide-react";

const tutorials = [
  {
    category: "Getting Started",
    icon: <Lightbulb size={20} />,
    items: [
      "Create and verify your account",
      "Set up your creator profile",
      "Add profile picture and bio",
      "Connect your social media",
    ],
  },
  {
    category: "Content Creation",
    icon: <Video size={20} />,
    items: [
      "Video editing basics",
      "Creating thumbnails",
      "Writing effective descriptions",
      "Optimizing for discovery",
    ],
  },
  {
    category: "Monetization",
    icon: <BookOpen size={20} />,
    items: [
      "Setting up monetization",
      "Creating marketplace listings",
      "Accepting commissions",
      "Managing payments",
    ],
  },
  {
    category: "Growth Strategies",
    icon: <Lightbulb size={20} />,
    items: [
      "Building your audience",
      "Engagement tactics",
      "Using analytics",
      "Cross-promotion tips",
    ],
  },
];

export function TutorialsPage() {
  return (
    <DocsLayout
      title="Tutorials"
      description="Step-by-step guides to master inlivin"
      breadcrumbs={[{ label: "Resources", href: "/docs" }]}
    >
      <div className="space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tutorials.map((section, idx) => (
            <div key={idx} className="p-6 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-primary">{section.icon}</div>
                <h3 className="font-semibold text-foreground text-lg">{section.category}</h3>
              </div>
              <ul className="space-y-2">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary mt-1">→</span>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Learning Paths</h2>
          <div className="space-y-3">
            {[
              {
                title: "Beginner Creator",
                description: "Start from scratch and build your first project",
              },
              {
                title: "Content Strategist",
                description: "Learn how to plan and execute content strategy",
              },
              {
                title: "Monetization Master",
                description: "Maximize your earnings across all platforms",
              },
              {
                title: "Community Builder",
                description: "Grow and engage your audience effectively",
              },
            ].map((path, idx) => (
              <button
                key={idx}
                className="w-full text-left p-4 rounded-lg border border-border bg-muted hover:border-primary hover:bg-muted/50 transition-all"
              >
                <h4 className="font-semibold text-foreground">{path.title}</h4>
                <p className="text-sm text-muted-foreground">{path.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}
