import { DocsLayout } from "@/components/DocsLayout";
import { Zap, Users, Pen, Megaphone, BarChart3, Radio, ShoppingCart } from "lucide-react";

export function FeaturesPage() {
  const features = [
    {
      icon: <Users size={24} />,
      title: "Creator Portfolio",
      description: "Showcase your work with customizable artist profiles",
      items: ["Multiple media formats", "Real-time analytics", "Advanced discovery"],
    },
    {
      icon: <Pen size={24} />,
      title: "Collaboration Tools",
      description: "Work together seamlessly with real-time features",
      items: ["Real-time workspace", "Project management", "Version control"],
    },
    {
      icon: <Megaphone size={24} />,
      title: "Content Management",
      description: "Organize and manage all your content efficiently",
      items: ["Batch processing", "Smart tagging", "Auto-organization"],
    },
    {
      icon: <BarChart3 size={24} />,
      title: "Analytics Dashboard",
      description: "Track performance with detailed insights",
      items: ["Real-time metrics", "Audience analytics", "Revenue tracking"],
    },
    {
      icon: <Radio size={24} />,
      title: "Live Streaming",
      description: "Stream high-quality content to your audience",
      items: ["HD broadcasting", "Interactive features", "Multi-platform"],
    },
    {
      icon: <ShoppingCart size={24} />,
      title: "Marketplace",
      description: "Sell your digital products and services",
      items: ["Easy listings", "Commission tracking", "Automated fulfillment"],
    },
  ];

  return (
    <DocsLayout
      title="Platform Features"
      description="Discover all the powerful tools that make inlivin the ultimate creator platform"
      breadcrumbs={[{ label: "Product", href: "/docs" }]}
    >
      <div className="space-y-12">
        <div className="prose prose-sm md:prose-base max-w-none">
          <p className="text-lg text-muted-foreground">
            inlivin provides everything you need to create, collaborate, and monetize your work.
          </p>
        </div>

        {/* Core Features Grid */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Core Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="p-6 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300"
              >
                <div className="text-primary mb-3">{feature.icon}</div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.items.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Advanced Features */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Advanced Features</h2>
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-6 border border-primary/20">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <Zap className="text-primary flex-shrink-0" size={20} />
                <span>API access for custom integrations</span>
              </li>
              <li className="flex items-center gap-3">
                <Zap className="text-primary flex-shrink-0" size={20} />
                <span>White-label options for agencies</span>
              </li>
              <li className="flex items-center gap-3">
                <Zap className="text-primary flex-shrink-0" size={20} />
                <span>Custom domain support</span>
              </li>
              <li className="flex items-center gap-3">
                <Zap className="text-primary flex-shrink-0" size={20} />
                <span>Advanced security features</span>
              </li>
              <li className="flex items-center gap-3">
                <Zap className="text-primary flex-shrink-0" size={20} />
                <span>Team management and SSO</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <h3 className="text-xl font-bold text-foreground mb-2">Ready to get started?</h3>
          <p className="text-muted-foreground mb-6">
            Explore all features with a free 14-day trial
          </p>
          <a
            href="#"
            className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Start Free Trial
          </a>
        </div>
      </div>
    </DocsLayout>
  );
}
