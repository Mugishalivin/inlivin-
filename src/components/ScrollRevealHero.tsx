import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface SentenceData {
  emoji: string;
  title: string;
  description: string;
}

const sentences: SentenceData[] = [
  {
    emoji: "✨",
    title: "Create",
    description: "Unleash your creativity with powerful tools",
  },
  {
    emoji: "📤",
    title: "Upload",
    description: "Share your work with the world instantly",
  },
  {
    emoji: "✏️",
    title: "Edit",
    description: "Refine every detail with precision controls",
  },
  {
    emoji: "🎨",
    title: "Manage",
    description: "Organize all your creative content seamlessly",
  },
  {
    emoji: "🚀",
    title: "Collaborate",
    description: "Connect with creators and grow your network",
  },
];

export default function ScrollRevealHero() {
  const [revealedItems, setRevealedItems] = useState<number[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          // Trigger staggered reveal
          sentences.forEach((_, index) => {
            setTimeout(() => {
              setRevealedItems((prev) => [...prev, index]);
            }, index * 200);
          });
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <section ref={containerRef} className="relative py-32 md:py-48 bg-background overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      <div className="container relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Main heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-20 text-center"
          >
            <h2 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-foreground via-primary to-purple-500 bg-clip-text text-transparent mb-6">
              Your Creative Studio
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to create, share, and grow your creative empire
            </p>
          </motion.div>

          {/* Scroll-reveal sentences */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8">
            {sentences.map((sentence, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={
                  revealedItems.includes(index)
                    ? { opacity: 1, y: 0, scale: 1 }
                    : {}
                }
                transition={{
                  duration: 0.6,
                  ease: [0.23, 1, 0.32, 1],
                  delay: 0,
                }}
                whileHover={{ scale: 1.05, y: -8 }}
                className="group relative"
              >
                {/* Card background with gradient border effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                
                <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8 hover:border-primary/50 transition-all duration-300 h-full flex flex-col">
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Emoji */}
                    <motion.div
                      initial={{ scale: 0.8, rotate: -20 }}
                      animate={
                        revealedItems.includes(index)
                          ? { scale: 1, rotate: 0 }
                          : {}
                      }
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className="text-4xl md:text-5xl mb-4"
                    >
                      {sentence.emoji}
                    </motion.div>

                    {/* Title */}
                    <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {sentence.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm md:text-base text-muted-foreground group-hover:text-foreground/80 transition-colors line-clamp-3">
                      {sentence.description}
                    </p>

                    {/* Bottom accent line */}
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={
                        revealedItems.includes(index)
                          ? { scaleX: 1 }
                          : { scaleX: 0 }
                      }
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className="h-1 bg-gradient-to-r from-primary to-purple-500 rounded-full mt-6 origin-left"
                    />
                  </div>

                  {/* Corner accent */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 1 } : {}}
            transition={{ delay: 1.5, duration: 1 }}
            className="mt-20 text-center"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex flex-col items-center"
            >
              <p className="text-sm text-muted-foreground mb-2">Scroll to explore</p>
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
