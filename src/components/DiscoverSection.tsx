import { motion } from "framer-motion";
import { MapPin, Star, Music, Palette, Camera, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

const artists = [
  { name: "Maya Chen", role: "Producer & Vocalist", location: "Tokyo, JP", rating: 4.9, icon: Music, color: "text-primary" },
  { name: "Luca Moretti", role: "Visual Artist", location: "Milan, IT", rating: 4.8, icon: Palette, color: "text-accent" },
  { name: "Amara Osei", role: "Photographer", location: "Accra, GH", rating: 5.0, icon: Camera, color: "text-primary" },
  { name: "Kai Rivera", role: "Sound Engineer", location: "LA, US", rating: 4.7, icon: Mic, color: "text-accent" },
  { name: "Anika Sharma", role: "Animator", location: "Mumbai, IN", rating: 4.9, icon: Palette, color: "text-primary" },
  { name: "Emil Larsen", role: "Songwriter", location: "Copenhagen, DK", rating: 4.8, icon: Music, color: "text-accent" },
];

export function DiscoverSection() {
  return (
    <section id="discover" className="py-24">
      <div className="container">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold tracking-widest uppercase text-accent">Discover</span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mt-3 mb-4">
            Find Your Next <span className="text-gradient">Collaborator</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Browse thousands of talented artists from around the world. Filter by skill, genre, location, and more.
          </p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {artists.map((a) => (
            <motion.div
              key={a.name}
              variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } } }}
              className="group rounded-xl p-5 bg-card border border-border hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <a.icon size={20} className={a.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-foreground truncate">{a.name}</h3>
                  <p className="text-sm text-muted-foreground">{a.role}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {a.location}</span>
                    <span className="flex items-center gap-1"><Star size={12} className="text-yellow-500" /> {a.rating}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="hero" size="sm" className="flex-1 text-xs">Connect</Button>
                <Button variant="hero-outline" size="sm" className="flex-1 text-xs">View Profile</Button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center mt-12">
          <Button variant="hero-outline" size="lg">Explore All Artists</Button>
        </div>
      </div>
    </section>
  );
}
