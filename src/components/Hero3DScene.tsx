import { motion } from "framer-motion";

const orbs = [
  {
    className:
      "left-[8%] top-[10%] h-48 w-48 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.85),rgba(226,96,42,0.65)_35%,rgba(226,96,42,0.08)_72%,transparent)]",
    duration: 14,
    x: [0, 28, -18, 0],
    y: [0, -24, 16, 0],
    scale: [1, 1.08, 0.94, 1],
  },
  {
    className:
      "right-[10%] top-[18%] h-64 w-64 bg-[radial-gradient(circle_at_40%_40%,rgba(255,255,255,0.72),rgba(22,129,118,0.52)_38%,rgba(22,129,118,0.08)_72%,transparent)]",
    duration: 18,
    x: [0, -32, 14, 0],
    y: [0, 22, -18, 0],
    scale: [1, 0.92, 1.06, 1],
  },
  {
    className:
      "left-[22%] bottom-[10%] h-40 w-40 bg-[radial-gradient(circle_at_35%_35%,rgba(255,250,240,0.95),rgba(244,206,91,0.46)_34%,rgba(244,206,91,0.08)_70%,transparent)]",
    duration: 12,
    x: [0, 20, -12, 0],
    y: [0, 16, -14, 0],
    scale: [1, 1.1, 0.96, 1],
  },
];

export default function Hero3DScene() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(226,96,42,0.18),transparent_32%),radial-gradient(circle_at_78%_24%,rgba(22,129,118,0.18),transparent_30%),linear-gradient(180deg,rgba(255,248,241,0.92),rgba(250,246,240,0.72)_40%,rgba(250,246,240,0.98))]" />

      {orbs.map((orb) => (
        <motion.div
          key={orb.className}
          animate={{
            x: orb.x,
            y: orb.y,
            scale: orb.scale,
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`absolute rounded-full blur-3xl ${orb.className}`}
        />
      ))}

      <motion.div
        animate={{ rotate: [0, 8, -6, 0], scale: [1, 1.04, 0.98, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10 bg-[conic-gradient(from_180deg_at_50%_50%,rgba(226,96,42,0.05),rgba(22,129,118,0.12),rgba(244,206,91,0.06),rgba(226,96,42,0.05))] opacity-90 blur-2xl"
      />

      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/55 to-transparent" />
    </div>
  );
}
