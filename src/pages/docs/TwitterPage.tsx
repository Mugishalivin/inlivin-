import { DocsLayout } from "@/components/DocsLayout";
import { ExternalLink, Heart, MessageCircle, Share2 } from "lucide-react";

export function TwitterPage() {
  return (
    <DocsLayout
      title="Twitter/X"
      description="Follow inlivin for updates and community highlights"
      breadcrumbs={[{ label: "Community", href: "/docs" }]}
    >
      <div className="space-y-12">
        <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/30 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Follow @inlivinofficial</h2>
          <p className="text-muted-foreground mb-6">
            Get the latest updates, creator spotlights, and community highlights
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            <Share2 size={20} />
            Follow on Twitter/X
            <ExternalLink size={16} />
          </a>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">What We Share</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Creator Spotlights",
                description: "Celebrate creators making waves in our community",
              },
              {
                title: "Product News",
                description: "Latest features, updates, and announcements",
              },
              {
                title: "Tips & Insights",
                description: "Creator advice and industry best practices",
              },
              {
                title: "Community Highlights",
                description: "Amazing content from our community members",
              },
            ].map((item, idx) => (
              <div key={idx} className="p-6 rounded-lg border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Engagement</h2>
          <div className="space-y-3">
            {[
              { hashtag: "#InlivinCreator", purpose: "Share your work with us" },
              {
                hashtag: "#InlivinCommunity",
                purpose: "Connect with other creators",
              },
              {
                hashtag: "Tag @inlivinofficial",
                purpose: "Chance to be featured",
              },
            ].map((item, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-border bg-card">
                <p className="font-semibold text-primary">{item.hashtag}</p>
                <p className="text-sm text-muted-foreground">{item.purpose}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}
