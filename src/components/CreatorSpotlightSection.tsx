import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Creator {
  id: string;
  name: string;
  role: string;
  image: string;
  followers: string;
  projects: string;
  bio: string;
  tags: string[];
}

const creators: Creator[] = [
  {
    id: "1",
    name: "Alex Rivera",
    role: "Music Producer",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    followers: "12.5K",
    projects: "24 Projects",
    bio: "Specializing in electronic and hip-hop production",
    tags: ["Producer", "EDM", "Hip-Hop"],
  },
  {
    id: "2",
    name: "Maya Chen",
    role: "Visual Designer",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    followers: "8.3K",
    projects: "18 Projects",
    bio: "Creative director focusing on visual storytelling",
    tags: ["Designer", "Animation", "UI/UX"],
  },
  {
    id: "3",
    name: "Jordan Smith",
    role: "Filmmaker",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c006ce70?w=400&h=400&fit=crop",
    followers: "15.7K",
    projects: "31 Projects",
    bio: "Documentary and commercial video production",
    tags: ["Filmmaker", "Director", "Editor"],
  },
  {
    id: "4",
    name: "Sophia Patel",
    role: "Sound Engineer",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    followers: "6.2K",
    projects: "42 Projects",
    bio: "Mixing and mastering specialist",
    tags: ["Engineer", "Audio", "Mixing"],
  },
];

export default function CreatorSpotlightSection() {
  return (
    <section className="py-28 bg-gradient-to-b from-background to-background/50">
      <div className="container">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Creator Spotlight</span>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold mt-3">
            Meet the <span className="text-gradient">Community</span>
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">Discover talented creators already making waves</p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {creators.map((creator) => (
            <motion.div
              key={creator.id}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
              className="group relative rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/40 transition-all duration-400"
            >
              {/* Image Container */}
              <div className="relative h-48 overflow-hidden bg-secondary">
                <motion.img
                  src={creator.image}
                  alt={creator.name}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.4 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                {/* Hover Action Buttons */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                >
                  <motion.button
                    className="p-2.5 rounded-full bg-primary/90 text-primary-foreground hover:bg-primary transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Heart size={20} />
                  </motion.button>
                  <motion.button
                    className="p-2.5 rounded-full bg-primary/90 text-primary-foreground hover:bg-primary transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <MessageCircle size={20} />
                  </motion.button>
                  <motion.button
                    className="p-2.5 rounded-full bg-primary/90 text-primary-foreground hover:bg-primary transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Share2 size={20} />
                  </motion.button>
                </motion.div>
              </div>

              {/* Creator Info */}
              <div className="p-5">
                <h3 className="font-display font-bold text-lg text-foreground">{creator.name}</h3>
                <p className="text-sm text-primary font-semibold mb-2">{creator.role}</p>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{creator.bio}</p>

                {/* Stats */}
                <div className="flex gap-4 mb-4 text-xs text-muted-foreground">
                  <div>
                    <div className="font-semibold text-foreground">{creator.followers}</div>
                    <div>Followers</div>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{creator.projects}</div>
                    <div>Created</div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {creator.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary border border-primary/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <Button variant="outline" size="sm" className="w-full gap-2 group">
                  View Profile
                  <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center mt-12">
          <Button variant="hero" size="lg">
            Explore All Creators
          </Button>
        </div>
      </div>
    </section>
  );
}
