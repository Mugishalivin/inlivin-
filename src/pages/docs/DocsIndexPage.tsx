import { DocsLayout } from "@/components/DocsLayout";
import {
  Package,
  Users,
  BookOpen,
  Scale,
  Zap,
  DollarSign,
  GitBranch,
  MessageCircle,
  Share2,
  Calendar,
  HelpCircle,
  Code,
  AlertCircle,
  Lock,
  FileText,
  Cookie,
  ArrowRight,
} from "lucide-react";

const categories = [
  {
    title: "Product",
    icon: <Package size={24} />,
    description: "Learn about features, pricing, and product roadmap",
    color: "from-blue-500/10 to-blue-600/10",
    items: [
      { name: "Features", icon: <Zap size={16} />, href: "/docs/features" },
      { name: "Pricing", icon: <DollarSign size={16} />, href: "/docs/pricing" },
      { name: "Changelog", icon: <GitBranch size={16} />, href: "/docs/changelog" },
      { name: "Roadmap", icon: <BookOpen size={16} />, href: "/docs/roadmap" },
    ],
  },
  {
    title: "Community",
    icon: <Users size={24} />,
    description: "Connect with creators and join our community",
    color: "from-purple-500/10 to-purple-600/10",
    items: [
      { name: "Discord", icon: <MessageCircle size={16} />, href: "/docs/discord" },
      { name: "Twitter/X", icon: <Share2 size={16} />, href: "/docs/twitter" },
      { name: "Blog", icon: <FileText size={16} />, href: "/docs/blog" },
      { name: "Events", icon: <Calendar size={16} />, href: "/docs/events" },
    ],
  },
  {
    title: "Resources",
    icon: <BookOpen size={24} />,
    description: "Find guides, API docs, and technical resources",
    color: "from-green-500/10 to-green-600/10",
    items: [
      { name: "Help Center", icon: <HelpCircle size={16} />, href: "/docs/help-center" },
      { name: "API Docs", icon: <Code size={16} />, href: "/docs/api" },
      { name: "Tutorials", icon: <BookOpen size={16} />, href: "/docs/tutorials" },
      { name: "Status", icon: <AlertCircle size={16} />, href: "/docs/status" },
    ],
  },
  {
    title: "Legal",
    icon: <Scale size={24} />,
    description: "Privacy, terms, and legal information",
    color: "from-red-500/10 to-red-600/10",
    items: [
      { name: "Privacy Policy", icon: <Lock size={16} />, href: "/docs/privacy" },
      { name: "Terms of Service", icon: <FileText size={16} />, href: "/docs/terms" },
      { name: "Cookies Policy", icon: <Cookie size={16} />, href: "/docs/cookies" },
    ],
  },
];

export function DocsIndexPage() {
  return (
    <DocsLayout
      title="Documentation"
      description="Everything you need to know about inlivin"
    >
      <div className="space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-primary text-sm font-semibold">Welcome to Docs</span>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Explore comprehensive guides, API documentation, and resources to help you get
            the most out of inlivin.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Popular Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { title: "Getting Started", icon: "🚀", href: "/docs/help-center" },
              { title: "Feature Tour", icon: "✨", href: "/docs/features" },
              { title: "API Reference", icon: "⚙️", href: "/docs/api" },
              { title: "Community Chat", icon: "💬", href: "/docs/discord" },
            ].map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                className="p-4 rounded-lg border border-border bg-card hover:border-primary hover:shadow-md transition-all group"
              >
                <div className="text-2xl mb-2">{link.icon}</div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {link.title}
                </h3>
              </a>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-12">
          {categories.map((category, idx) => (
            <div key={idx}>
              <div className="flex items-start gap-4 mb-6">
                <div className="text-primary mt-1">{category.icon}</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground">{category.title}</h2>
                  <p className="text-muted-foreground">{category.description}</p>
                </div>
              </div>

              <div
                className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${
                  category.items.length <= 3 ? 3 : 4
                } gap-4`}
              >
                {category.items.map((item, itemIdx) => (
                  <a
                    key={itemIdx}
                    href={item.href}
                    className={`group relative overflow-hidden rounded-lg border border-border bg-gradient-to-br ${category.color} p-6 hover:border-primary hover:shadow-lg transition-all`}
                  >
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
                    <div className="relative flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-primary">{item.icon}</div>
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {item.name}
                          </h3>
                        </div>
                      </div>
                      <ArrowRight
                        size={16}
                        className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1"
                      />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { stat: "500+", label: "Help Articles" },
              { stat: "50+", label: "Video Tutorials" },
              { stat: "24/7", label: "Community Support" },
              { stat: "99.9%", label: "Uptime Guarantee" },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="text-2xl font-bold text-primary mb-1">{item.stat}</div>
                <div className="text-sm text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-card border border-border rounded-lg p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Can't Find What You're Looking For?</h2>
          <p className="text-muted-foreground mb-6">
            Our community and support team are here to help
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/docs/help-center"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold inline-flex items-center gap-2 justify-center"
            >
              Contact Support
              <ArrowRight size={18} />
            </a>
            <a
              href="/docs/discord"
              className="px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors font-semibold"
            >
              Join Community
            </a>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}
