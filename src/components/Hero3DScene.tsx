import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, Torus, Box } from "@react-three/drei";
import * as THREE from "three";

function FloatingOrb({ position, color, speed = 1, distort = 0.4, size = 1 }: {
  position: [number, number, number];
  color: string;
  speed?: number;
  distort?: number;
  size?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.15 * speed;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2 * speed;
    }
  });

  return (
    <Float speed={speed * 1.5} rotationIntensity={0.6} floatIntensity={1.2}>
      <Sphere ref={meshRef} args={[size, 64, 64]} position={position}>
        <MeshDistortMaterial
          color={color}
          roughness={0.15}
          metalness={0.8}
          distort={distort}
          speed={speed * 2}
          transparent
          opacity={0.85}
        />
      </Sphere>
    </Float>
  );
}

function FloatingRing({ position, color, speed = 1 }: {
  position: [number, number, number];
  color: string;
  speed?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5 * speed) * 0.3 + 0.5;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.3 * speed;
    }
  });

  return (
    <Float speed={speed} rotationIntensity={0.4} floatIntensity={0.8}>
      <Torus ref={meshRef} args={[0.8, 0.15, 32, 64]} position={position}>
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.9}
          transparent
          opacity={0.7}
        />
      </Torus>
    </Float>
  );
}

function FloatingCube({ position, color, speed = 1 }: {
  position: [number, number, number];
  color: string;
  speed?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.4 * speed;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3 * speed;
    }
  });

  return (
    <Float speed={speed * 1.2} rotationIntensity={0.8} floatIntensity={1}>
      <Box ref={meshRef} args={[0.5, 0.5, 0.5]} position={position}>
        <meshStandardMaterial
          color={color}
          roughness={0.1}
          metalness={0.95}
          transparent
          opacity={0.6}
        />
      </Box>
    </Float>
  );
}

function Particles({ count = 80 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null!);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const colorOptions = [
      new THREE.Color("hsl(12, 80%, 55%)"),
      new THREE.Color("hsl(175, 60%, 38%)"),
      new THREE.Color("hsl(40, 15%, 92%)"),
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return { positions, colors };
  }, [count]);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.02;
      mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.colors.length / 3}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#fff5ee" />
      <pointLight position={[-3, 2, 4]} intensity={0.6} color="hsl(12, 80%, 55%)" />
      <pointLight position={[3, -2, 2]} intensity={0.4} color="hsl(175, 60%, 38%)" />

      <FloatingOrb position={[1.5, 0.5, 0]} color="hsl(12, 80%, 55%)" speed={0.8} distort={0.5} size={1.2} />
      <FloatingOrb position={[-1.8, -0.8, -1]} color="hsl(175, 60%, 45%)" speed={0.6} distort={0.3} size={0.7} />
      <FloatingOrb position={[0.3, 1.5, -2]} color="hsl(40, 60%, 70%)" speed={1} distort={0.35} size={0.5} />

      <FloatingRing position={[-1, 1, 0.5]} color="hsl(12, 70%, 60%)" speed={0.7} />
      <FloatingRing position={[2, -1, -1.5]} color="hsl(175, 50%, 50%)" speed={0.5} />

      <FloatingCube position={[2.5, 1.5, -1]} color="hsl(40, 40%, 80%)" speed={0.9} />
      <FloatingCube position={[-2.2, 0.5, 0.5]} color="hsl(12, 60%, 65%)" speed={0.6} />

      <Particles count={100} />
    </>
  );
}

export default function Hero3DScene() {
  try {
    return (
      <div className="absolute inset-0 z-0 w-full h-full overflow-hidden">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          dpr={typeof window !== 'undefined' ? window.devicePixelRatio : 1}
          gl={{ 
            antialias: true, 
            alpha: true,
            precision: 'lowp'
          }}
          style={{ 
            background: "transparent",
            width: "100%",
            height: "100%",
            display: "block"
          }}
        >
          <color attach="background" args={["transparent"]} />
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </div>
    );
  } catch (error) {
    console.error("Hero3DScene Error:", error);
    // Fallback gradient if 3D fails
    return (
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
    );
  }
}
