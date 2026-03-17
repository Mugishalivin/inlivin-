import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    desc: "Get started and explore",
    features: ["5 connections/month", "Basic messaging", "2GB storage", "Community access"],
    cta: "Start Free",
    featured: false,
  },
  {
    name: "Pro",
    price: "$12",
    desc: "For serious creators",
    features: ["Unlimited connections", "HD video calls", "50GB storage", "AI recommendations", "Group creation", "Priority support"],
    cta: "Go Pro",
    featured: true,
  },
  {
    name: "Collective",
    price: "$29",
    desc: "For teams & labels",
    features: ["Everything in Pro", "Unlimited storage", "Admin dashboard", "IP protection suite", "Custom branding", "API access"],
    cta: "Start Collective",
    featured: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24">
      <div className="container">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold tracking-widest uppercase text-primary">Pricing</span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mt-3 mb-4">
            Simple, <span className="text-gradient">Transparent</span> Pricing
          </h2>
          <p className="text-muted-foreground">No hidden fees. Cancel anytime.</p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
              className={`rounded-xl p-6 border transition-all duration-300 ${
                plan.featured
                  ? "bg-gradient-card border-primary/40 shadow-[var(--shadow-glow)] scale-[1.02]"
                  : "bg-card border-border"
              }`}
            >
              {plan.featured && (
                <span className="text-xs font-semibold bg-gradient-primary rounded-full px-3 py-1 text-primary-foreground">
                  Most Popular
                </span>
              )}
              <h3 className="font-display text-xl font-bold mt-4">{plan.name}</h3>
              <div className="mt-2">
                <span className="font-display text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">/mo</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2 mb-6">{plan.desc}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <Check size={16} className="text-primary shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button variant={plan.featured ? "hero" : "hero-outline"} className="w-full">
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
