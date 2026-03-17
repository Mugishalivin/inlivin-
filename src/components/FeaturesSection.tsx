import { motion } from "framer-motion";
import {
  MessageSquare, Users, FolderOpen, Search, Sparkles, Globe,
  Video, Shield, Zap, Music, Palette, Share2
} from "lucide-react";

const features = [
  { icon: Search, title: "Smart Discovery", desc: "AI-powered search to find the perfect collaborator by skill, genre, or vibe." },
  { icon: MessageSquare, title: "Real-time Messaging", desc: "Chat, voice, and video calls built right in. Never leave the platform." },
  { icon: FolderOpen, title: "File Sharing", desc: "Share any file type with instant preview — audio, video, images, docs." },
  { icon: Users, title: "Groups & Collectives", desc: "Create private or public groups to organize your creative teams." },
  { icon: Sparkles, title: "AI Recommendations", desc: "Get matched with artists who complement your style and skills." },
  { icon: Globe, title: "Global Reach", desc: "Connect with creatives across 120+ countries in real time." },
  { icon: Video, title: "Live Sessions", desc: "Jam together with low-latency live audio and video rooms." },
  { icon: Shield, title: "IP Protection", desc: "Watermarking, versioning, and contracts built into every share." },
  { icon: Zap, title: "Instant Portfolio", desc: "Showcase your work with a beautiful auto-generated portfolio." },
  { icon: Music, title: "Audio Workspaces", desc: "Collaborate on tracks with shared DAW-like timelines." },
  { icon: Palette, title: "Visual Boards", desc: "Mood boards and visual references to align creative direction." },
  { icon: Share2, title: "Cross-Platform", desc: "Works seamlessly on desktop, tablet, and mobile devices." },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px]" />

      <div className="container relative z-10">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold tracking-widest uppercase text-primary">Features</span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mt-3 mb-4">
            Everything You Need to <span className="text-gradient">Create Together</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From discovery to delivery, Inlivin gives you every tool to collaborate without boundaries.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={itemVariants}
              className="group relative rounded-xl p-6 bg-gradient-card border border-border hover:border-primary/30 transition-all duration-300 glow-border"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon size={20} className="text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
