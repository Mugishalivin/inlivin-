import { DocsLayout } from "@/components/DocsLayout";
import { Lock, Eye, Trash2, Download } from "lucide-react";

export function PrivacyPage() {
  const sections = [
    {
      icon: <Eye size={24} />,
      title: "Information We Collect",
      items: [
        "Account information (name, email, profile data)",
        "Content you upload and create",
        "Usage data and analytics",
        "Device and browser information",
        "Location data (with consent)",
      ],
    },
    {
      icon: <Lock size={24} />,
      title: "How We Protect Your Data",
      items: [
        "SSL/TLS encryption for data in transit",
        "AES-256 encryption for stored data",
        "Regular security audits",
        "Strict access controls",
        "GDPR and CCPA compliance",
      ],
    },
    {
      icon: <Trash2 size={24} />,
      title: "Your Rights",
      items: [
        "Access and review your data",
        "Request data deletion",
        "Export your information",
        "Opt-out of marketing",
        "Manage privacy settings",
      ],
    },
  ];

  return (
    <DocsLayout
      title="Privacy Policy"
      description="Your privacy is our priority. Learn how we protect your data."
      breadcrumbs={[{ label: "Legal", href: "/docs" }]}
    >
      <div className="space-y-12">
        <p className="text-lg text-muted-foreground">
          Last updated: April 2026 • Effective immediately
        </p>

        {/* Overview */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6">
          <h2 className="text-xl font-bold text-foreground mb-3">
            Your Privacy Matters to Us
          </h2>
          <p className="text-foreground leading-relaxed">
            inlivin is committed to protecting your privacy. We collect minimal data
            necessary to provide our service, and we never sell your personal information
            to third parties.
          </p>
        </div>

        {/* Key Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sections.map((section, idx) => (
            <div
              key={idx}
              className="p-6 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
            >
              <div className="text-primary mb-3">{section.icon}</div>
              <h3 className="font-semibold text-foreground mb-3">{section.title}</h3>
              <ul className="space-y-2">
                {section.items.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Important Sections */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Data Collection</h2>
            <p className="text-muted-foreground mb-4">
              We collect information in three ways:
            </p>
            <div className="space-y-3">
              <div className="p-4 rounded-lg border border-border bg-card">
                <h4 className="font-semibold text-foreground mb-2">Information You Provide</h4>
                <p className="text-sm text-muted-foreground">
                  Account details, uploaded content, payment information, and communications with support
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card">
                <h4 className="font-semibold text-foreground mb-2">Information Collected Automatically</h4>
                <p className="text-sm text-muted-foreground">
                  Usage analytics, device information, cookies, and browsing behavior
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card">
                <h4 className="font-semibold text-foreground mb-2">Information from Third Parties</h4>
                <p className="text-sm text-muted-foreground">
                  Social media connections, payment processors, and analytics providers
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Data Protection</h2>
            <p className="text-muted-foreground mb-4">
              We use industry-leading security practices:
            </p>
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <div className="flex items-start gap-3">
                <Lock className="text-primary flex-shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-semibold text-foreground">Encryption</h4>
                  <p className="text-sm text-muted-foreground">
                    SSL/TLS for data in transit, AES-256 for stored data
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Eye className="text-primary flex-shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-semibold text-foreground">Access Controls</h4>
                  <p className="text-sm text-muted-foreground">
                    Strict permissions and authentication requirements
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Download className="text-primary flex-shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-semibold text-foreground">Compliance</h4>
                  <p className="text-sm text-muted-foreground">
                    GDPR, CCPA, and other privacy regulation compliant
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Your Rights</h2>
            <p className="text-muted-foreground mb-4">
              You have the right to:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Access and review your data",
                "Request corrections to your information",
                "Delete your account and data",
                "Export your information",
                "Opt-out of marketing emails",
                "Disable tracking and cookies",
              ].map((right, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border border-border bg-card flex items-center gap-3"
                >
                  <span className="text-primary font-bold">✓</span>
                  <span className="text-foreground">{right}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-semibold text-foreground mb-2">Privacy Questions?</h2>
          <p className="text-muted-foreground mb-4">
            Contact our privacy team at{" "}
            <a href="mailto:privacy@inlivin.com" className="text-primary hover:underline">
              privacy@inlivin.com
            </a>
          </p>
        </div>
      </div>
    </DocsLayout>
  );
}
