import { DocsLayout } from "@/components/DocsLayout";
import { AlertCircle, Shield, Zap, DollarSign } from "lucide-react";

export function TermsPage() {
  const rules = [
    {
      icon: <AlertCircle size={24} />,
      title: "Content Requirements",
      description:
        "No illegal, explicit, hateful, or harassing content. Respect others' rights.",
    },
    {
      icon: <Shield size={24} />,
      title: "Account Security",
      description:
        "You're responsible for your account. Keep passwords secret and notify us of unauthorized access.",
    },
    {
      icon: <Zap size={24} />,
      title: "Intellectual Property",
      description:
        "Respect copyright laws. Don't infringe on others' rights or remove copyright notices.",
    },
    {
      icon: <DollarSign size={24} />,
      title: "Payments & Refunds",
      description:
        "14-day money-back guarantee. Charges occur on your billing date. Cancel anytime.",
    },
  ];

  return (
    <DocsLayout
      title="Terms of Service"
      description="Please read our terms carefully before using inlivin"
      breadcrumbs={[{ label: "Legal", href: "/docs" }]}
    >
      <div className="space-y-12">
        <p className="text-lg text-muted-foreground">
          Last updated: April 2026 • Effective immediately
        </p>

        {/* Important Notice */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">
                Important Agreement
              </h3>
              <p className="text-sm text-foreground">
                By using inlivin, you agree to be bound by these Terms. If you don't agree,
                please don't use our service. We strongly recommend reading the complete terms.
              </p>
            </div>
          </div>
        </div>

        {/* Key Terms */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Key Points</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rules.map((rule, idx) => (
              <div
                key={idx}
                className="p-6 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
              >
                <div className="text-primary mb-3">{rule.icon}</div>
                <h3 className="font-semibold text-foreground mb-2">{rule.title}</h3>
                <p className="text-sm text-muted-foreground">{rule.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Eligibility</h2>
            <div className="space-y-3">
              <p className="text-foreground">You must be:</p>
              <ul className="space-y-2 ml-4">
                {[
                  "At least 18 years old (or have parental consent if 13-18)",
                  "Legally authorized to enter into binding agreements",
                  "Using inlivin for lawful purposes only",
                ].map((item, idx) => (
                  <li key={idx} className="text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Prohibited Uses</h2>
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-4">
                You agree not to:
              </p>
              <ul className="space-y-2">
                {[
                  "Violate any applicable laws or regulations",
                  "Infringe on intellectual property or privacy rights",
                  "Harass, threaten, or abuse others",
                  "Post illegal, explicit, or violent content",
                  "Attempt to hack or gain unauthorized access",
                  "Remove copyright or proprietary notices",
                  "Spam or send unsolicited commercial messages",
                  "Upload malware or harmful code",
                ].map((item, idx) => (
                  <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-primary">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Your Content</h2>
            <div className="space-y-3">
              <div className="p-4 rounded-lg border border-border bg-card">
                <h4 className="font-semibold text-foreground mb-2">You Own Your Content</h4>
                <p className="text-sm text-muted-foreground">
                  You retain all rights to content you create. However, you grant us permission to host,
                  display, and distribute it on the platform.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card">
                <h4 className="font-semibold text-foreground mb-2">You're Responsible</h4>
                <p className="text-sm text-muted-foreground">
                  You warrant that your content doesn't infringe on others' rights and comply with all laws.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card">
                <h4 className="font-semibold text-foreground mb-2">Licensing & DMCA</h4>
                <p className="text-sm text-muted-foreground">
                  We respect intellectual property rights. Report copyright issues through our DMCA process.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Payment & Billing</h2>
            <div className="space-y-3">
              {[
                {
                  title: "Charges",
                  description: "Charges occur on your selected billing date automatically.",
                },
                {
                  title: "Cancellation",
                  description: "Cancel anytime. No questions asked. Changes take effect at next billing.",
                },
                {
                  title: "Refunds",
                  description: "14-day money-back guarantee on all paid plans.",
                },
                {
                  title: "Disputes",
                  description: "Report billing issues within 30 days for investigation.",
                },
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-border bg-card">
                  <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Limitation of Liability
            </h2>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
              <p className="text-sm text-foreground mb-3">
                inlivin is provided "AS IS" without warranties. To the fullest extent permitted by law:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  We're not liable for indirect or consequential damages
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  Our liability is limited to fees you paid in the last 12 months
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  We don't guarantee uninterrupted or error-free service
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-semibold text-foreground mb-2">Questions about Terms?</h2>
          <p className="text-muted-foreground">
            Contact our legal team at{" "}
            <a href="mailto:legal@inlivin.com" className="text-primary hover:underline">
              legal@inlivin.com
            </a>
          </p>
        </div>
      </div>
    </DocsLayout>
  );
}
