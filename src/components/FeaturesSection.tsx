import { motion } from "framer-motion";
import {
  MessageSquare, Users, FolderOpen, Search, Sparkles, Globe,
  Video, Shield, Zap, Music, Palette, Share2
} from "lucide-react";
import { type LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

const features: Feature[] = [
  { icon: Search, title: "Smart Discovery", desc: "AI-powered search to find the perfect collaborator by skill, genre, or vibe." },
  { icon: MessageSquare, title: "Real-time Chat", desc: "Text, voice, and video — all built in. Stay connected without leaving." },
  { icon: FolderOpen, title: "File Sharing", desc: "Share any file with instant preview — audio stems, video edits, designs." },
  { icon: Users, title: "Groups & Collectives", desc: "Create private or public groups to organize your creative teams." },
  { icon: Sparkles, title: "AI Matching", desc: "Get matched with artists who complement your unique style and skills." },
  { icon: Globe, title: "Global Network", desc: "Connect with creatives across 120+ countries in real time." },
  { icon: Video, title: "Live Sessions", desc: "Jam together with low-latency live audio and video collaboration rooms." },
  { icon: Shield, title: "IP Protection", desc: "Watermarking, versioning, and contracts built into every share." },
  { icon: Zap, title: "Instant Portfolio", desc: "Showcase your work with a beautiful auto-generated portfolio page." },
  { icon: Music, title: "Audio Workspaces", desc: "Collaborate on tracks with shared timeline-based workspaces." },
  { icon: Palette, title: "Visual Boards", desc: "Mood boards and visual references to align creative direction." },
  { icon: Share2, title: "Cross-Platform", desc: "Works seamlessly on desktop, tablet, and mobile devices." },
];

// Split into highlighted + grid
const highlighted = features.slice(0, 3);
const grid = features.slice(3);

export function FeaturesSection() {
  return (
    <section id="features" className="py-28">
      <div className="container">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Features</span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold mt-3 leading-tight">
              Built for the way
              <br />
              <span className="text-gradient">creatives work</span>
            </h2>
          </div>
          <p className="text-muted-foreground max-w-sm text-[15px] leading-relaxed">
            From discovery to delivery, every tool you need to collaborate without boundaries — in one place.
          </p>
        </div>

        {/* 3 highlighted cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid md:grid-cols-3 gap-4 mb-4"
        >
          {highlighted.map((f) => (
            <motion.div
              key={f.title}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
              className="group relative rounded-2xl p-8 bg-card border border-border hover:border-primary/30 transition-all duration-400 glow-border"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                <f.icon size={22} className="text-primary" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Rest in compact grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {grid.map((f) => (
            <motion.div
              key={f.title}
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
              className="group flex gap-4 rounded-xl p-5 bg-card border border-border hover:border-primary/20 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <f.icon size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
