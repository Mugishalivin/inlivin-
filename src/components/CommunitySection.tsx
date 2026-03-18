import { motion } from "framer-motion";

const testimonials = [
  {
    text: "Inlivin changed how I collaborate. Found my producer in Tokyo from my bedroom in Lagos — and we dropped a track in 3 days.",
    name: "Tunde A.",
    role: "Singer-Songwriter",
  },
  {
    text: "The file sharing is insane. Preview stems, videos, mockups — all without downloading. This is the tool we've been waiting for.",
    name: "Jess K.",
    role: "Music Producer",
  },
  {
    text: "Built an entire visual album with a team I met here. 6 countries, 1 vision. Inlivin made it feel like we were in the same room.",
    name: "Carlos M.",
    role: "Director & Animator",
  },
];

export function CommunitySection() {
  return (
    <section id="community" className="py-28">
      <div className="container">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Community</span>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold mt-3">
            Trusted by <span className="text-gradient">creatives</span>
          </h2>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
          className="grid md:grid-cols-3 gap-6"
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
              className={`rounded-2xl p-8 border border-border ${i === 1 ? "bg-card md:-mt-4 md:mb-4" : "bg-card"}`}
            >
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} />
                ))}
              </div>
              <p className="text-foreground leading-relaxed mb-8 text-[15px]">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-sm text-muted-foreground">
                  {t.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <div className="font-display font-semibold text-sm text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Star() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-primary">
      <path
        d="M8 1L10.163 5.279L15 6.018L11.5 9.421L12.326 14.236L8 11.959L3.674 14.236L4.5 9.421L1 6.018L5.837 5.279L8 1Z"
        fill="currentColor"
      />
    </svg>
  );
}
