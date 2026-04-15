import { motion } from "framer-motion";
import { Star, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessStory {
  id: string;
  title: string;
  description: string;
  image: string;
  creators: string[];
  views: string;
  rating: number;
  category: string;
  impact: string;
}

const successStories: SuccessStory[] = [
  {
    id: "1",
    title: "From Bedroom to Billboard",
    description: "A producer and vocalist met on Inlivin and created a viral hit in just 6 weeks",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop",
    creators: ["3 Artists"],
    views: "2.3M",
    rating: 4.9,
    category: "Music",
    impact: "1M+ Streams",
  },
  {
    id: "2",
    title: "Global Visual Campaign",
    description: "International team of designers collaborated on award-winning brand campaign",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop",
    creators: ["7 Designers"],
    views: "890K",
    rating: 4.8,
    category: "Design",
    impact: "Won 3 Awards",
  },
  {
    id: "3",
    title: "Documentary Series",
    description: "Multi-country documentary created by distributed crew across 5 continents",
    image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&h=400&fit=crop",
    creators: ["12 Creators"],
    views: "450K",
    rating: 4.9,
    category: "Video",
    impact: "Festival Selection",
  },
  {
    id: "4",
    title: "Indie Game Launch",
    description: "Artist collective created stunning visuals for indie game that hit top 10",
    image: "https://images.unsplash.com/photo-1538481143235-c8f91b3f1181?w=600&h=400&fit=crop",
    creators: ["8 Creators"],
    views: "1.2M",
    rating: 4.7,
    category: "Gaming",
    impact: "$500K Revenue",
  },
];

export default function SuccessStoriesSection() {
  return (
    <section className="py-28">
      <div className="container">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Success Stories</span>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold mt-3">
            Collaborations that <span className="text-gradient">changed lives</span>
          </h2>
          <p className="text-muted-foreground mt-4 text-lg max-w-2xl mx-auto">
            See how creators from around the world are making their biggest dreams come true together
          </p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
          className="grid lg:grid-cols-2 gap-6"
        >
          {successStories.map((story) => (
            <motion.div
              key={story.id}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
              className="group relative rounded-2xl overflow-hidden border border-border hover:border-primary/40 transition-all duration-400"
            >
              {/* Image Container */}
              <div className="relative h-80 overflow-hidden bg-secondary">
                <motion.img
                  src={story.image}
                  alt={story.title}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center rounded-full bg-primary/90 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-primary-foreground">
                    {story.category}
                  </span>
                </div>

                {/* Stats Overlay */}
                <div className=" absolute inset-0 flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="flex gap-3">
                    <motion.div
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-sm"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <TrendingUp size={16} /> {story.views}
                    </motion.div>
                    <motion.div
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-sm"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <Users size={16} /> {story.creators[0]}
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 bg-card">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-display text-xl font-bold text-foreground flex-1">{story.title}</h3>
                  <div className="flex items-center gap-1.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < Math.floor(story.rating) ? "fill-primary text-primary" : "text-muted-foreground/30"}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">{story.description}</p>

                <div className="flex gap-3 mb-4">
                  <div className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                    <span className="text-xs font-semibold text-primary">{story.impact}</span>
                  </div>
                </div>

                <Button variant="hero" size="sm" className="w-full">
                  View Full Story
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
