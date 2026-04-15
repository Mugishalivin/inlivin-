import { motion } from "framer-motion";
import { Shield, Zap, TrendingUp, Lock, Sparkles, Award } from "lucide-react";

interface Benefit {
  icon: any;
  title: string;
  description: string;
  image: string;
}

const benefits: Benefit[] = [
  {
    icon: Sparkles,
    title: "AI-Powered Matching",
    description: "Our smart algorithm finds the perfect collaborators based on your skills, style, and goals",
    image: "https://images.unsplash.com/photo-1677442d019e0c38b0e89381923d4b43a1d15d21?w=500&h=350&fit=crop",
  },
  {
    icon: Zap,
    title: "Real-Time Collaboration",
    description: "Work together seamlessly with HD video, instant messaging, and shared file spaces",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=350&fit=crop",
  },
  {
    icon: Shield,
    title: "IP Protection Built-In",
    description: "Automatic watermarking, version control, and smart contracts protect your work",
    image: "https://images.unsplash.com/photo-1526374965328-7f5ae4e8e90f?w=500&h=350&fit=crop",
  },
  {
    icon: TrendingUp,
    title: "Monetization Tools",
    description: "Multiple revenue streams: marketplace sales, licensing, royalties, and partnerships",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&h=350&fit=crop",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description: "Bank-level encryption and compliance with GDPR, CCPA, and industry standards",
    image: "https://images.unsplash.com/photo-1563986768711-b3baa3cf572d?w=500&h=350&fit=crop",
  },
  {
    icon: Award,
    title: "Creator Academy",
    description: "Free courses, mentorship, and resources to level up your creative skills",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=350&fit=crop",
  },
];

export function WhyChooseInlivinSection() {
  return (
    <section className="py-28 bg-background">
      <div className="container">
        <div className="text-center mb-20">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Why Choose Inlivin</span>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold mt-3">
            Everything creators <span className="text-gradient">deserve</span>
          </h2>
          <p className="text-muted-foreground mt-4 text-lg max-w-2xl mx-auto">
            Purpose-built platform designed specifically for the needs of modern creative professionals
          </p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {benefits.map((benefit, idx) => (
            <motion.div
              key={idx}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
              className="group relative rounded-2xl overflow-hidden border border-border hover:border-primary/40 transition-all duration-400 overflow-hidden bg-card"
            >
              {/* Image Background */}
              <div className="relative h-48 overflow-hidden bg-secondary">
                <motion.img
                  src={benefit.image}
                  alt={benefit.title}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60" />
              </div>

              {/* Content */}
              <div className="p-6 relative">
                {/* Icon */}
                <motion.div
                  className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4 border border-primary/30 group-hover:bg-primary/20 transition-colors"
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <benefit.icon size={24} className="text-primary" />
                </motion.div>

                {/* Title & Description */}
                <h3 className="font-display font-bold text-lg text-foreground mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>

                {/* Decoration */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <p className="text-sm text-muted-foreground mb-8">Trusted by leading creators and organizations</p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-60 group-hover:opacity-100 transition-opacity">
            {["SOC 2 Certified", "GDPR Compliant", "ISO 27001", "Stripe Verified"].map((badge, idx) => (
              <motion.div
                key={idx}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-2 h-2 rounded-full bg-primary" />
                {badge}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
