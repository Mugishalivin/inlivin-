import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImg from "@/assets/hero-abstract.jpg";

const marqueeItems = [
  "Musicians", "Producers", "Designers", "Photographers", "Filmmakers",
  "Animators", "Writers", "Vocalists", "DJs", "Illustrators",
];

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-16 overflow-hidden">
      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Connecting 50,000+ artists worldwide
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-[clamp(2.5rem,6vw,5rem)] font-extrabold leading-[0.95] tracking-tight mb-6"
            >
              Create
              <br />
              Together,
              <br />
              <span className="text-gradient">Anywhere.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-md"
            >
              The collaboration platform built for artists. Find your people,
              share your craft, and build something extraordinary.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-3"
            >
              <Button variant="hero" size="lg" onClick={() => navigate("/register")}>
                Start Creating <ArrowRight size={18} />
              </Button>
              <Button variant="hero-outline" size="lg" onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}>
                See How It Works
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex gap-10 mt-14"
            >
              {[
                { value: "50K+", label: "Artists" },
                { value: "120+", label: "Countries" },
                { value: "1M+", label: "Collabs" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-square max-w-lg mx-auto lg:ml-auto">
              <img src={heroImg} alt="Abstract collaboration art" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
            </div>
            <div className="absolute -bottom-4 left-4 lg:left-0 bg-card border border-border rounded-xl px-5 py-3 shadow-lg">
              <div className="text-xs text-muted-foreground">Active now</div>
              <div className="font-display font-bold text-foreground">2,847 creators online</div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mt-24 border-t border-b border-border py-5 overflow-hidden">
        <div className="animate-marquee flex gap-8 whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="text-sm font-medium text-muted-foreground flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
