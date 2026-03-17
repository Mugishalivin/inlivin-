import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  { text: "Inlivin changed how I collaborate. Found my producer in Tokyo from my bedroom in Lagos.", name: "Tunde A.", role: "Singer-Songwriter" },
  { text: "The file sharing is insane. Preview stems, videos, mockups — all without downloading. Game changer.", name: "Jess K.", role: "Music Producer" },
  { text: "Built an entire visual album with a team I met on Inlivin. 6 countries, 1 vision.", name: "Carlos M.", role: "Director & Animator" },
];

export function CommunitySection() {
  return (
    <section id="community" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
      <div className="container relative z-10">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold tracking-widest uppercase text-primary">Community</span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mt-3 mb-4">
            Loved by <span className="text-gradient">Creatives</span>
          </h2>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid md:grid-cols-3 gap-6"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
              className="rounded-xl p-6 bg-card border border-border relative"
            >
              <Quote size={24} className="text-primary/20 mb-4" />
              <p className="text-foreground leading-relaxed mb-6">"{t.text}"</p>
              <div>
                <div className="font-display font-semibold text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
