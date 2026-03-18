import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-28">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden bg-card border border-border p-12 md:p-20 text-center"
        >
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-primary/8 blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-accent/8 blur-[80px]" />

          <div className="relative z-10">
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6">
              Ready to create
              <br />
              <span className="text-gradient">something amazing?</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-md mx-auto mb-10">
              Join thousands of artists already collaborating on Inlivin. It's free to start.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="hero" size="lg" onClick={() => navigate("/register")}>
                Get Started Free <ArrowRight size={18} />
              </Button>
              <Button variant="hero-outline" size="lg" onClick={() => navigate("/login")}>
                Sign In
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
