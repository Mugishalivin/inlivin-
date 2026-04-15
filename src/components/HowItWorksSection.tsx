import { motion } from "framer-motion";
import { Search, Users, PlusCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Step {
  number: number;
  icon: any;
  title: string;
  description: string;
  image: string;
  details: string[];
}

const steps: Step[] = [
  {
    number: 1,
    icon: Search,
    title: "Browse & Discover",
    description: "Find creators nearby or across the globe with AI-powered recommendations",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1000&h=600&fit=crop",
    details: ["Smart search filters", "AI recommendations", "Skill matching"],
  },
  {
    number: 2,
    icon: Users,
    title: "Connect & Message",
    description: "Start a conversation and get to know potential collaborators instantly",
    image: "https://images.unsplash.com/photo-1460925431917-917de08d37a4?w=1000&h=600&fit=crop",
    details: ["Real-time chat", "Voice calls", "Video calls"],
  },
  {
    number: 3,
    icon: PlusCircle,
    title: "Create Together",
    description: "Work on shared projects with built-in tools and file sharing",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1000&h=600&fit=crop",
    details: ["Live collaboration", "File sharing", "Project management"],
  },
  {
    number: 4,
    icon: Zap,
    title: "Share & Monetize",
    description: "Publish your work and earn through multiple revenue streams",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1000&h=600&fit=crop",
    details: ["Revenue sharing", "Marketplace", "Analytics"],
  },
];

function StepCard({ step, index }: { step: Step; index: number }) {
  const isEven = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-20 relative"
    >
      {/* Background Image Section */}
      <motion.div
        className={`relative h-96 lg:h-[500px] rounded-2xl overflow-hidden border border-border/30 ${
          isEven ? "lg:order-1" : "lg:order-2"
        }`}
        initial={{ opacity: 0.3 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        {/* Background Image */}
        <motion.img
          src={step.image}
          alt={step.title}
          className="w-full h-full object-cover"
          whileInView={{ scale: 1.05 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-transparent" />

        {/* Number Badge */}
        <motion.div
          className="absolute top-6 left-6 z-10"
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/90 flex items-center justify-center backdrop-blur-md border border-primary/30 shadow-lg">
            <span className="text-3xl font-display font-black text-primary-foreground">{step.number}</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Content Section */}
      <motion.div
        className={isEven ? "lg:order-2" : "lg:order-1"}
        initial={{ opacity: 0, x: isEven ? 50 : -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        viewport={{ once: true }}
      >
        {/* Icon */}
        <motion.div
          className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mb-6 border border-primary/30"
          whileInView={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
          viewport={{ once: true }}
        >
          <step.icon size={28} className="text-primary" />
        </motion.div>

        <h3 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">{step.title}</h3>
        <p className="text-muted-foreground text-lg mb-6 leading-relaxed">{step.description}</p>

        {/* Details with staggered animation */}
        <div className="space-y-3 mb-8">
          {step.details.map((detail, idx) => (
            <motion.div
              key={idx}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 + 0.2, duration: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-primary/50" />
              <span className="text-sm font-medium text-foreground">{detail}</span>
            </motion.div>
          ))}
        </div>

        <Button variant="hero-outline" size="lg">
          Learn More
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default function HowItWorksSection() {
  return (
    <section className="py-28 bg-gradient-to-b from-background via-primary/5 to-background">
      <div className="container">
        <div className="text-center mb-20">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-primary">How It Works</span>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold mt-3">
            Four <span className="text-gradient">simple steps</span>
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">From discovery to creation to success</p>
        </div>

        <div className="space-y-8">
          {steps.map((step, index) => (
            <StepCard key={step.number} step={step} index={index} />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          <h3 className="font-display text-2xl font-bold text-foreground mb-4">Ready to start creating?</h3>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of creators who are already making amazing things together on Inlivin
          </p>
          <Button variant="hero" size="lg">
            Get Started Free
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
