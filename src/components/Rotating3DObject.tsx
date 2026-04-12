import { useEffect, useRef } from "react";

export function Rotating3DObject() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rotationX = 0;
    let rotationY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      targetRotationY = (x - 0.5) * 20;
      targetRotationX = (y - 0.5) * -20;
    };

    const animate = () => {
      rotationX += (targetRotationX - rotationX) * 0.1;
      rotationY += (targetRotationY - rotationY) * 0.1;

      const inner = container.querySelector('[data-3d-inner]') as HTMLElement;
      if (inner) {
        inner.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
      }
    };

    const animationFrame = setInterval(animate, 1000 / 60);

    container.addEventListener("mousemove", handleMouseMove);

    return () => {
      clearInterval(animationFrame);
      container.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-96 flex items-center justify-center"
      style={{ perspective: "1000px" }}
    >
      <div
        data-3d-inner
        style={{
          width: "200px",
          height: "200px",
          transformStyle: "preserve-3d",
          transition: "transform 0.05s ease-out",
        }}
      >
        {/* 3D Cube */}
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Front */}
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backgroundColor: "rgb(59, 130, 246)",
              border: "2px solid rgba(59, 130, 246, 0.5)",
              borderRadius: "8px",
              transform: "translateZ(100px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              color: "white",
              fontWeight: "bold",
            }}
          >
            CREATE
          </div>

          {/* Back */}
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backgroundColor: "rgb(139, 92, 246)",
              border: "2px solid rgba(139, 92, 246, 0.5)",
              borderRadius: "8px",
              transform: "rotateY(180deg) translateZ(100px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              color: "white",
              fontWeight: "bold",
            }}
          >
            BUILD
          </div>

          {/* Right */}
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backgroundColor: "rgb(236, 72, 153)",
              border: "2px solid rgba(236, 72, 153, 0.5)",
              borderRadius: "8px",
              transform: "rotateY(90deg) translateZ(100px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              color: "white",
              fontWeight: "bold",
            }}
          >
            CONNECT
          </div>

          {/* Left */}
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backgroundColor: "rgb(14, 165, 233)",
              border: "2px solid rgba(14, 165, 233, 0.5)",
              borderRadius: "8px",
              transform: "rotateY(-90deg) translateZ(100px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              color: "white",
              fontWeight: "bold",
            }}
          >
            SHARE
          </div>

          {/* Top */}
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backgroundColor: "rgb(34, 197, 94)",
              border: "2px solid rgba(34, 197, 94, 0.5)",
              borderRadius: "8px",
              transform: "rotateX(90deg) translateZ(100px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              color: "white",
              fontWeight: "bold",
            }}
          >
            EARN
          </div>

          {/* Bottom */}
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backgroundColor: "rgb(250, 204, 21)",
              border: "2px solid rgba(250, 204, 21, 0.5)",
              borderRadius: "8px",
              transform: "rotateX(-90deg) translateZ(100px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              color: "white",
              fontWeight: "bold",
            }}
          >
            GROW
          </div>
        </div>
      </div>
    </div>
  );
}
