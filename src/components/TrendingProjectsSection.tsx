import { motion } from "framer-motion";
import { Heart, MessageCircle, Eye, Sparkles, TrendingUp } from "lucide-react";

interface TrendingProject {
  id: string;
  title: string;
  image: string;
  category: string;
  creators: string[];
  engagement: string;
  momentum: "🔥 Hot" | "⚡ Rising" | "⭐ Viral";
}

const trendingProjects: TrendingProject[] = [
  {
    id: "1",
    title: "Synth Wave Summer",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=300&fit=crop",
    category: "Music",
    creators: ["3 Artists"],
    engagement: "24.5K",
    momentum: "🔥 Hot",
  },
  {
    id: "2",
    title: "Digital Dreams Collection",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop",
    category: "Design",
    creators: ["5 Designers"],
    engagement: "18.3K",
    momentum: "⭐ Viral",
  },
  {
    id: "3",
    title: "Urban Motion - Documentary",
    image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=300&fit=crop",
    category: "Video",
    creators: ["8 Creators"],
    engagement: "32.1K",
    momentum: "⚡ Rising",
  },
  {
    id: "4",
    title: "Pixel Art Renaissance",
    image: "https://images.unsplash.com/photo-1538481143235-c8f91b3f1181?w=400&h=300&fit=crop",
    category: "Gaming",
    creators: ["4 Artists"],
    engagement: "15.7K",
    momentum: "🔥 Hot",
  },
  {
    id: "5",
    title: "Ambient Textures Vol. 2",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop",
    category: "Audio",
    creators: ["2 Producers"],
    engagement: "21.3K",
    momentum: "⚡ Rising",
  },
  {
    id: "6",
    title: "Neon Nights Campaign",
    image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=300&fit=crop",
    category: "Production",
    creators: ["6 Creators"],
    engagement: "28.9K",
    momentum: "⭐ Viral",
  },
];

export default function TrendingProjectsSection() {
  return (
    <section className="py-28 bg-gradient-to-b from-background/50 to-background">
      <div className="container">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-16">
          <div>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Trending Now</span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold mt-3">
              What's <span className="text-gradient">happening</span>
            </h2>
          </div>
          <motion.button
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
            whileHover={{ scale: 1.05 }}
          >
            <TrendingUp size={16} />
            View All Trending
          </motion.button>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {trendingProjects.map((project, idx) => (
            <motion.div
              key={project.id}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
              className="group relative rounded-xl overflow-hidden border border-border hover:border-primary/40 transition-all duration-300 cursor-pointer"
            >
              {/* Image */}
              <div className="relative h-56 overflow-hidden bg-secondary">
                <motion.img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.4 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Momentum Badge */}
                <div className="absolute top-3 right-3">
                  <motion.span 
                    className="inline-flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-white border border-white/20"
                    whileHover={{ scale: 1.1 }}
                  >
                    {project.momentum.charAt(0)}
                    <span>{project.momentum.slice(2)}</span>
                  </motion.span>
                </div>

                {/* Category */}
                <div className="absolute top-3 left-3">
                  <span className="inline-flex rounded-full bg-primary/80 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                    {project.category}
                  </span>
                </div>

                {/* Hover Stats */}
                <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-2 justify-end">
                    <motion.div
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-medium"
                      initial={{ opacity: 0, y: 10 }}
                      whileHover={{ opacity: 1, y: 0 }}
                    >
                      <Eye size={14} />
                      {project.engagement}
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 bg-card">
                <h3 className="font-display font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {project.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">{project.creators.join(", ")}</p>

                {/* Engagement Indicators */}
                <div className="flex gap-2">
                  <motion.button
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-secondary hover:bg-primary/10 transition-colors group/btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Heart size={14} className="text-muted-foreground group-hover/btn:text-primary transition-colors" />
                    <span className="text-xs text-muted-foreground group-hover/btn:text-foreground transition-colors">Like</span>
                  </motion.button>
                  <motion.button
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-secondary hover:bg-primary/10 transition-colors group/btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <MessageCircle size={14} className="text-muted-foreground group-hover/btn:text-primary transition-colors" />
                    <span className="text-xs text-muted-foreground group-hover/btn:text-foreground transition-colors">Comment</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
