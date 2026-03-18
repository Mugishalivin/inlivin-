import { motion } from "framer-motion";
import { MapPin, Star, Music, Palette, Camera, Mic, PenTool, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";

const artists = [
  { name: "Maya Chen", role: "Producer & Vocalist", location: "Tokyo, JP", rating: 4.9, icon: Music, tags: ["R&B", "Pop"] },
  { name: "Luca Moretti", role: "Visual Artist", location: "Milan, IT", rating: 4.8, icon: Palette, tags: ["3D", "Motion"] },
  { name: "Amara Osei", role: "Photographer", location: "Accra, GH", rating: 5.0, icon: Camera, tags: ["Portrait", "Fashion"] },
  { name: "Kai Rivera", role: "Sound Engineer", location: "LA, US", rating: 4.7, icon: Headphones, tags: ["Mixing", "Mastering"] },
  { name: "Anika Sharma", role: "Illustrator", location: "Mumbai, IN", rating: 4.9, icon: PenTool, tags: ["Digital", "Editorial"] },
  { name: "Emil Larsen", role: "Songwriter", location: "Copenhagen, DK", rating: 4.8, icon: Mic, tags: ["Indie", "Folk"] },
];

export function DiscoverSection() {
  return (
    <section id="discover" className="py-28">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-accent">Discover</span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold mt-3 leading-tight">
              Your next collab
              <br />
              <span className="text-gradient">starts here</span>
            </h2>
          </div>
          <p className="text-muted-foreground max-w-sm text-[15px] leading-relaxed">
            Browse artists from around the globe. Filter by skill, genre, location, and availability.
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
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
              className="group rounded-2xl p-6 bg-card border border-border hover:border-primary/25 transition-all duration-300"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <a.icon size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-foreground truncate">{a.name}</h3>
                  <p className="text-sm text-muted-foreground">{a.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><MapPin size={12} /> {a.location}</span>
                <span className="flex items-center gap-1"><Star size={12} className="text-primary" /> {a.rating}</span>
              </div>

              <div className="flex gap-2 mb-5">
                {a.tags.map((tag) => (
                  <span key={tag} className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="hero" size="sm" className="flex-1">Connect</Button>
                <Button variant="hero-outline" size="sm" className="flex-1">Profile</Button>
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
