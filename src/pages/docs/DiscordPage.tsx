import { DocsLayout } from "@/components/DocsLayout";
import { MessageCircle, Users, Flag, Heart } from "lucide-react";

export function DiscordPage() {
  const channels = [
    {
      name: "#announcements",
      icon: <Flag size={20} />,
      description: "Latest updates and product announcements",
    },
    {
      name: "#general",
      icon: <MessageCircle size={20} />,
      description: "General discussion and off-topic chat",
    },
    {
      name: "#showcase",
      icon: <Heart size={20} />,
      description: "Share your work and get feedback",
    },
    {
      name: "#help-support",
      icon: <Users size={20} />,
      description: "Ask questions and get help from the community",
    },
  ];

  return (
    <DocsLayout
      title="Discord Community"
      description="Connect, collaborate, and share with fellow creators"
      breadcrumbs={[{ label: "Community", href: "/docs" }]}
    >
      <div className="space-y-12">
        {/* Join Button */}
        <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/30 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Join Our Community
          </h2>
          <p className="text-muted-foreground mb-6">
            Connect with thousands of creators, share ideas, and get support
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            <MessageCircle size={20} />
            Join Our Discord Server
          </a>
        </div>

        {/* Channels */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Popular Channels</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {channels.map((channel, idx) => (
              <div
                key={idx}
                className="p-5 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="text-primary">{channel.icon}</div>
                  <h3 className="font-semibold text-foreground">{channel.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{channel.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Community Rules */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Community Guidelines</h2>
          <div className="space-y-3">
            {[
              "Be Respectful - Treat all members with courtesy",
              "No Spam - Avoid excessive self-promotion",
              "No Hate Speech - Zero tolerance for discrimination",
              "Stay On Topic - Keep discussions relevant to channels",
              "No NSFW Content - Keep the community family-friendly",
              "Engage Constructively - Help others and share knowledge",
            ].map((rule, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border border-border bg-card flex items-start gap-3"
              >
                <span className="text-primary font-bold flex-shrink-0">✓</span>
                <span className="text-foreground">{rule}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Community Features */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">What You'll Find</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Creator Spotlights",
                description:
                  "Featured creators share their journey and success stories",
              },
              {
                title: "Live Q&A Sessions",
                description: "Chat directly with our team about the platform",
              },
              {
                title: "Feature Discussions",
                description: "Vote on features and influence product direction",
              },
              {
                title: "Collaboration Hub",
                description: "Find partners for your next project",
              },
              {
                title: "Weekly Challenges",
                description: "Participate in creative challenges with prizes",
              },
              {
                title: "Learning Resources",
                description: "Access tutorials and best practices from experts",
              },
            ].map((feature, idx) => (
              <div key={idx} className="p-6 rounded-lg border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}
