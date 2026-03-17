import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/10 blur-[150px]" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-accent/8 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="container relative z-10 text-center"
      >
        <h2 className="font-display text-4xl sm:text-6xl font-bold mb-6">
          Ready to <span className="text-gradient">Come Alive</span>?
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
          Join thousands of artists already building, sharing, and growing together on Inlivin.
        </p>
        <Button variant="hero" size="lg" className="text-base px-10">
          Get Started Free <ArrowRight className="ml-2" size={18} />
        </Button>
      </motion.div>
    </section>
  );
}
