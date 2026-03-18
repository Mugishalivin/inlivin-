import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Get started and explore",
    features: ["5 connections/month", "Basic messaging", "2GB storage", "Community access"],
    cta: "Start Free",
    featured: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/month",
    desc: "For serious creators",
    features: ["Unlimited connections", "HD video calls", "50GB storage", "AI recommendations", "Group creation", "Priority support"],
    cta: "Go Pro",
    featured: true,
  },
  {
    name: "Collective",
    price: "$29",
    period: "/month",
    desc: "For teams & labels",
    features: ["Everything in Pro", "Unlimited storage", "Admin dashboard", "IP protection suite", "Custom branding", "API access"],
    cta: "Start Collective",
    featured: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-28">
      <div className="container">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Pricing</span>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold mt-3 mb-4">
            Simple, <span className="text-gradient">honest</span> pricing
          </h2>
          <p className="text-muted-foreground text-[15px]">No hidden fees. Cancel anytime. Start free.</p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
              className={`rounded-2xl p-7 border transition-all duration-300 flex flex-col ${
                plan.featured
                  ? "bg-card border-primary/30 shadow-lg relative glow-border"
                  : "bg-card border-border"
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-semibold bg-gradient-primary rounded-full px-4 py-1 text-primary-foreground">
                  Most Popular
                </span>
              )}
              <h3 className="font-display text-lg font-bold text-foreground">{plan.name}</h3>
              <div className="mt-3 mb-1">
                <span className="font-display text-4xl font-extrabold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                    <Check size={16} className="text-primary mt-0.5 shrink-0" /> {f}
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
