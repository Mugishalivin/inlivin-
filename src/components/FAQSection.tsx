import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function FAQSection() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "How do I get started on inlivin?",
      a: "Simply sign up with your email, create your profile, and start uploading your creative work. You'll have access to all basic features immediately.",
    },
    {
      q: "What are the payment methods for monetization?",
      a: "We support credit cards, PayPal, bank transfers, and cryptocurrency. Payments are processed monthly with no hidden fees.",
    },
    {
      q: "Can I collaborate with other creators?",
      a: "Yes! Our platform has built-in collaboration tools. You can invite team members, share projects, and work together in real-time.",
    },
    {
      q: "Is my content secure on inlivin?",
      a: "Absolutely. We use industry-leading encryption, regular security audits, and comply with GDPR and other privacy standards.",
    },
    {
      q: "How do I grow my audience on inlivin?",
      a: "Use our discovery tools, engage with the community, collaborate with other creators, and leverage our promotion features.",
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="container">
        <div className="text-center mb-16 animate-fade-up">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about inlivin
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="group rounded-xl border border-border bg-card hover:border-primary/50 overflow-hidden transition-all duration-300"
              style={{
                animationDelay: `${idx * 100}ms`,
              }}
            >
              <button
                onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-muted/50 transition-colors duration-300"
              >
                <h3 className="font-semibold text-foreground text-left group-hover:text-primary transition-colors">
                  {faq.q}
                </h3>
                <ChevronDown
                  size={20}
                  className={`text-primary flex-shrink-0 transition-transform duration-300 ${
                    expandedIdx === idx ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expandedIdx === idx && (
                <div className="px-6 py-4 bg-muted/50 border-t border-border animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">Still have questions?</p>
          <a
            href="/docs/help-center"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg border border-primary text-primary hover:bg-primary/5 font-semibold transition-all duration-300 group"
          >
            Visit Help Center
            <svg
              className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
