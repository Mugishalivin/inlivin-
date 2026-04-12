import { DocsLayout } from "@/components/DocsLayout";
import { Check, Zap } from "lucide-react";

export function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for getting started",
      features: [
        "Basic creator profile",
        "Up to 10 uploads/month",
        "Core analytics",
        "Community access",
        "Email support",
      ],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Creator",
      price: "$9.99",
      period: "/month",
      description: "Ideal for active creators",
      features: [
        "Everything in Starter",
        "Unlimited uploads",
        "Advanced analytics",
        "Monetization tools",
        "Live streaming (5/month)",
        "Priority support",
      ],
      cta: "Start Free Trial",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$29.99",
      period: "/month",
      description: "For serious creators",
      features: [
        "Everything in Creator",
        "Unlimited live streams",
        "Advanced collaboration",
        "Team members (up to 5)",
        "API access",
        "Custom branding",
        "Dedicated support",
      ],
      cta: "Start Free Trial",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For agencies & organizations",
      features: [
        "Everything in Pro",
        "White-label solution",
        "Custom domain",
        "Unlimited team members",
        "Priority onboarding",
        "SLA guarantee",
        "Dedicated account manager",
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  return (
    <DocsLayout
      title="Pricing Plans"
      description="Choose the perfect plan for your journey"
      breadcrumbs={[{ label: "Product", href: "/docs" }]}
    >
      <div className="space-y-12">
        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative rounded-lg border transition-all duration-300 ${
                plan.highlighted
                  ? "border-primary bg-card shadow-xl scale-105 md:scale-100"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <Zap size={12} />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-6">
                <h3 className="font-semibold text-lg text-foreground mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                </div>

                <button
                  className={`w-full py-2 rounded-lg font-semibold transition-colors mb-6 ${
                    plan.highlighted
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-primary text-primary hover:bg-primary/5"
                  }`}
                >
                  {plan.cta}
                </button>

                <div className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Check size={16} className="text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "Can I change my plan?",
                a: "Yes! You can upgrade or downgrade anytime. Changes take effect at your next billing cycle.",
              },
              {
                q: "Is there a free trial?",
                a: "Yes! All paid plans include a 14-day free trial with full access to all features.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept credit cards (Visa, Mastercard, Amex), PayPal, and Apple Pay.",
              },
              {
                q: "Do you offer discounts?",
                a: "Yes! Annual billing gives you 20% off. Contact us for custom enterprise pricing.",
              },
            ].map((faq, idx) => (
              <details
                key={idx}
                className="group border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors"
              >
                <summary className="font-semibold text-foreground flex items-center justify-between">
                  {faq.q}
                  <span className="text-primary group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <p className="mt-3 text-muted-foreground text-sm">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}
