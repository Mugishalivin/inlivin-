import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const marqueeItems = [
  "Musicians",
  "Producers",
  "Designers",
  "Photographers",
  "Filmmakers",
  "Animators",
  "Writers",
  "Vocalists",
  "DJs",
  "Illustrators",
];

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-16 overflow-hidden bg-gradient-to-br from-white via-gray-50 to-gray-100">
      {/* Clean gradient background instead of 3D scene */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-purple-300 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs font-medium text-gray-700 mb-8">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Connecting 50,000+ artists worldwide
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-[clamp(2.5rem,6vw,5rem)] font-extrabold leading-[0.95] tracking-tight mb-6 text-gray-900"
            >
              Create
              <br />
              Together,
              <br />
              <span className="text-blue-600">Anywhere.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-gray-700 leading-relaxed mb-10 max-w-md"
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
              <Button
                variant="hero-outline"
                size="lg"
                onClick={() => {
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
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
            initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.4, type: "spring" }}
            className="relative hidden lg:block"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-square max-w-lg mx-auto lg:ml-auto bg-card/30 backdrop-blur-xl border border-border/50 p-8 flex flex-col justify-end">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
              <div className="relative space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
                    IN
                  </div>
                  <div>
                    <div className="font-display font-bold text-foreground">Inlivin Studio</div>
                    <div className="text-xs text-muted-foreground">Create | Collaborate | Connect</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {["Music", "Art", "Photo"].map((cat) => (
                    <div
                      key={cat}
                      className="rounded-xl bg-background/50 backdrop-blur border border-border/50 px-3 py-2 text-center text-xs font-medium text-foreground"
                    >
                      {cat}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  2,847 creators online now
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 mt-24 border-t border-b border-border py-5 overflow-hidden bg-background/50 backdrop-blur-sm">
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
