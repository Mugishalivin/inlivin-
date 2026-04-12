import { DocsLayout } from "@/components/DocsLayout";
import { BookOpen, ArrowRight } from "lucide-react";

const posts = [
  {
    title: "The Future of Creator Monetization",
    date: "April 2026",
    category: "Industry Insights",
  },
  {
    title: "Interview: Rising Star Creators on Their Journey",
    date: "March 2026",
    category: "Creator Stories",
  },
  {
    title: "Creator Toolkit: 10 Tools Every Artist Needs",
    date: "March 2026",
    category: "Tips & Strategies",
  },
  {
    title: "How to Build Your Audience from Zero",
    date: "February 2026",
    category: "Tips & Strategies",
  },
  {
    title: "Marketplace Best Practices for Sellers",
    date: "February 2026",
    category: "Platform Guides",
  },
];

export function BlogPage() {
  return (
    <DocsLayout
      title="Blog"
      description="Creator insights, guides, and industry trends"
      breadcrumbs={[{ label: "Community", href: "/docs" }]}
    >
      <div className="space-y-12">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Latest Articles</h2>
          <div className="space-y-4">
            {posts.map((post, idx) => (
              <a
                key={idx}
                href="#"
                className="p-6 rounded-lg border border-border bg-card hover:border-primary hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-primary/70 uppercase">
                        {post.category}
                      </span>
                      <span className="text-xs text-muted-foreground">{post.date}</span>
                    </div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                  </div>
                  <ArrowRight className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                </div>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              "Creator Stories",
              "Platform Guides",
              "Industry Insights",
              "Tips & Strategies",
              "Updates",
            ].map((cat, idx) => (
              <button
                key={idx}
                className="p-4 rounded-lg border border-border bg-card hover:border-primary hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-primary" />
                  <span className="font-semibold text-foreground">{cat}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <h2 className="text-xl font-bold text-foreground mb-3">Subscribe to Updates</h2>
          <p className="text-muted-foreground mb-6">
            Get new articles delivered to your inbox
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-primary transition-colors"
            />
            <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}
