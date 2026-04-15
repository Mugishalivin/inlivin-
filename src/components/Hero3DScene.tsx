import { useEffect, useRef } from "react";

export default function Hero3DScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size
      const updateSize = () => {
        canvas.width = canvas.clientWidth * window.devicePixelRatio;
        canvas.height = canvas.clientHeight * window.devicePixelRatio;
      };
      updateSize();
      window.addEventListener("resize", updateSize);

      let animationId: number;
      let time = 0;

      const animate = () => {
        time += 0.016; // ~60fps

        // Create gradient background
        const gradient = ctx!.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, "#0f172a");
        gradient.addColorStop(0.5, "#1e293b");
        gradient.addColorStop(1, "#0f172a");
        ctx!.fillStyle = gradient;
        ctx!.fillRect(0, 0, canvas.width, canvas.height);

        // Draw floating orbs with glow effect
        const orbs = [
          { x: 0.3, y: 0.5, radius: 40, color: "#ef4444", speed: 0.8, opacity: 0.4 },
          { x: 0.7, y: 0.3, radius: 60, color: "#3b82f6", speed: 0.5, opacity: 0.3 },
          { x: 0.5, y: 0.7, radius: 50, color: "#22c55e", speed: 0.6, opacity: 0.35 },
        ];

        orbs.forEach((orb, i) => {
          const offsetX = Math.sin(time * orb.speed + i) * 0.1;
          const offsetY = Math.cos(time * orb.speed + i) * 0.1;
          const x = canvas.width * (orb.x + offsetX);
          const y = canvas.height * (orb.y + offsetY);

          // Draw outer glow
          for (let glow = 3; glow > 0; glow--) {
            const glowGradient = ctx!.createRadialGradient(x, y, 0, x, y, orb.radius * (1 + glow * 0.5));
            glowGradient.addColorStop(0, orb.color + Math.floor(orb.opacity * 255 * (1 - glow / 3)).toString(16).padStart(2, '0'));
            glowGradient.addColorStop(1, orb.color + "00");
            ctx!.fillStyle = glowGradient;
            ctx!.fillRect(x - orb.radius * (1 + glow * 0.5), y - orb.radius * (1 + glow * 0.5), orb.radius * 2 * (1 + glow * 0.5), orb.radius * 2 * (1 + glow * 0.5));
          }

          // Draw core
          ctx!.fillStyle = orb.color + Math.floor(orb.opacity * 255 * 1.5).toString(16).padStart(2, '0');
          ctx!.beginPath();
          ctx!.arc(x, y, orb.radius, 0, Math.PI * 2);
          ctx!.fill();
        });

        // Draw animated particles
        const particleCount = 40;
        for (let i = 0; i < particleCount; i++) {
          const x = (canvas.width * (time * 0.02 + i / particleCount)) % canvas.width;
          const y = canvas.height * 0.5 + Math.sin(time * 0.5 + i) * 50;
          const size = Math.sin(time + i) * 0.5 + 1.5;
          const opacity = 0.3 + Math.sin(time + i) * 0.2;

          ctx!.fillStyle = `rgba(148, 163, 184, ${opacity})`;
          ctx!.beginPath();
          ctx!.arc(x, y, size, 0, Math.PI * 2);
          ctx!.fill();
        }

        animationId = requestAnimationFrame(animate);
      };

      animate();

      return () => {
        window.removeEventListener("resize", updateSize);
        cancelAnimationFrame(animationId);
      };
    } catch (error) {
      console.error("Canvas animation error:", error);
    }
  }, []);

  return (
    <div className="absolute inset-0 z-0 w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        }}
      />
    </div>
  );
}
