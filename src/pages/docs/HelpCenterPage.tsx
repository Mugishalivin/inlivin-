import { DocsLayout } from "@/components/DocsLayout";
import { Search, MessageCircle, Mail, Lightbulb } from "lucide-react";
import { useState } from "react";

export function HelpCenterPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const topics = [
    { icon: <Lightbulb size={20} />, title: "Getting Started", count: 8 },
    { icon: <Lightbulb size={20} />, title: "Content Management", count: 12 },
    { icon: <Lightbulb size={20} />, title: "Monetization", count: 9 },
    { icon: <Lightbulb size={20} />, title: "Troubleshooting", count: 15 },
  ];

  const faqs = [
    {
      q: "How do I create an account?",
      a: "Visit inlivin.com and click 'Sign Up'. You can create an account with email or integrate with social media accounts.",
    },
    {
      q: "What file formats are supported?",
      a: "We support video (MP4, MOV, AVI), audio (MP3, WAV, AAC), images (JPG, PNG, GIF), and documents (PDF, DOCX).",
    },
    {
      q: "How do I start monetizing?",
      a: "Enable monetization in Account Settings, link your payment method, and configure your revenue preferences. All paid plans include this feature.",
    },
    {
      q: "Can I have multiple team members?",
      a: "Yes! Creator plan includes up to 3 members, Pro plan up to 5, and Enterprise offers unlimited team members.",
    },
    {
      q: "How secure is my data?",
      a: "We use industry-standard SSL/TLS encryption, AES-256 for stored data, and undergo regular security audits.",
    },
    {
      q: "What's the refund policy?",
      a: "We offer a 14-day money-back guarantee on all paid plans if you're not satisfied.",
    },
  ];

  return (
    <DocsLayout
      title="Help Center"
      description="Find answers to your questions and get support"
      breadcrumbs={[{ label: "Resources", href: "/docs" }]}
    >
      <div className="space-y-12">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search help articles..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Topic Grid */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Popular Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topics.map((topic, idx) => (
              <button
                key={idx}
                className="p-5 rounded-lg border border-border bg-card hover:border-primary hover:shadow-md transition-all text-left"
              >
                <div className="text-primary mb-2">{topic.icon}</div>
                <h3 className="font-semibold text-foreground mb-1">{topic.title}</h3>
                <p className="text-xs text-muted-foreground">{topic.count} articles</p>
              </button>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <button
                key={idx}
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full text-left p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-foreground">{faq.q}</h3>
                  <span
                    className={`text-primary flex-shrink-0 transition-transform ${
                      expandedFaq === idx ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </div>
                {expandedFaq === idx && (
                  <p className="mt-3 text-muted-foreground text-sm">{faq.a}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Support Contact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
            <Mail className="text-primary mb-3" size={24} />
            <h3 className="font-semibold text-foreground mb-2">Email Support</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Response time 24-48 hours
            </p>
            <a href="mailto:support@inlivin.com" className="text-primary hover:underline text-sm font-semibold">
              support@inlivin.com
            </a>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
            <MessageCircle className="text-primary mb-3" size={24} />
            <h3 className="font-semibold text-foreground mb-2">Live Chat</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Mon-Fri, 9 AM - 6 PM UTC
            </p>
            <button className="text-primary hover:underline text-sm font-semibold">
              Start Chat
            </button>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
            <Lightbulb className="text-primary mb-3" size={24} />
            <h3 className="font-semibold text-foreground mb-2">Community</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Get help from other users
            </p>
            <a href="#" className="text-primary hover:underline text-sm font-semibold">
              Join Discord
            </a>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}
