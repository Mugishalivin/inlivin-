import { motion } from "framer-motion";
import { Users, Globe, Music, Zap } from "lucide-react";

interface Stat {
  icon: any;
  value: string;
  label: string;
  description: string;
  color: string;
}

const stats: Stat[] = [
  {
    icon: Users,
    value: "50K+",
    label: "Active Creators",
    description: "From 120+ countries creating together",
    color: "from-blue-500/20 to-blue-500/5",
  },
  {
    icon: Globe,
    value: "120+",
    label: "Countries",
    description: "Spanning all 6 inhabited continents",
    color: "from-purple-500/20 to-purple-500/5",
  },
  {
    icon: Music,
    value: "1M+",
    label: "Projects Created",
    description: "And counting every single day",
    color: "from-pink-500/20 to-pink-500/5",
  },
  {
    icon: Zap,
    value: "$50M+",
    label: "Earned by Creators",
    description: "Through collaborations & marketplace",
    color: "from-amber-500/20 to-amber-500/5",
  },
];

export function EnhancedStatsSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
              className={`group relative rounded-2xl p-8 bg-gradient-to-br ${stat.color} border border-border hover:border-primary/40 transition-all duration-400 overflow-hidden`}
            >
              {/* Background blur */}
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/10 blur-3xl group-hover:blur-2xl transition-all" />

              {/* Icon */}
              <motion.div
                className="relative w-12 h-12 rounded-xl bg-background/50 flex items-center justify-center mb-6 border border-border/50 group-hover:bg-primary/10 group-hover:border-primary/40 transition-all"
                whileHover={{ scale: 1.15, rotate: 10 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <stat.icon size={24} className="text-primary" />
              </motion.div>

              {/* Value */}
              <motion.div
                className="font-display text-4xl font-black text-foreground mb-2"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 + 0.2 }}
              >
                {stat.value}
              </motion.div>

              {/* Label */}
              <div className="text-sm font-semibold text-muted-foreground mb-2">{stat.label}</div>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed">{stat.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
