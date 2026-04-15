import { useRef, useEffect, useState } from 'react';
import {
  Music,
  Palette,
  Code,
  Camera,
  Zap,
  Pen,
  Gamepad2,
  Microscope,
  Cpu,
  BookOpen
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
}

const Creator3DChain = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const categories: Category[] = [
    {
      id: 1,
      name: 'Musicians',
      icon: <Music size={32} />,
      color: 'from-red-500 to-pink-500',
      gradient: 'bg-gradient-to-br from-red-500 via-pink-500 to-red-600'
    },
    {
      id: 2,
      name: 'Designers',
      icon: <Palette size={32} />,
      color: 'from-purple-500 to-indigo-500',
      gradient: 'bg-gradient-to-br from-purple-500 via-indigo-500 to-purple-600'
    },
    {
      id: 3,
      name: 'Developers',
      icon: <Code size={32} />,
      color: 'from-blue-500 to-cyan-500',
      gradient: 'bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600'
    },
    {
      id: 4,
      name: 'Producers',
      icon: <Zap size={32} />,
      color: 'from-yellow-500 to-orange-500',
      gradient: 'bg-gradient-to-br from-yellow-500 via-orange-500 to-yellow-600'
    },
    {
      id: 5,
      name: 'Photographers',
      icon: <Camera size={32} />,
      color: 'from-green-500 to-emerald-500',
      gradient: 'bg-gradient-to-br from-green-500 via-emerald-500 to-green-600'
    },
    {
      id: 6,
      name: 'Writers',
      icon: <Pen size={32} />,
      color: 'from-amber-500 to-orange-500',
      gradient: 'bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600'
    },
    {
      id: 7,
      name: 'Game Developers',
      icon: <Gamepad2 size={32} />,
      color: 'from-pink-500 to-rose-500',
      gradient: 'bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600'
    },
    {
      id: 8,
      name: 'Technicians',
      icon: <Cpu size={32} />,
      color: 'from-slate-600 to-gray-600',
      gradient: 'bg-gradient-to-br from-slate-600 via-gray-600 to-slate-700'
    },
    {
      id: 9,
      name: 'Storytellers',
      icon: <BookOpen size={32} />,
      color: 'from-teal-500 to-cyan-500',
      gradient: 'bg-gradient-to-br from-teal-500 via-cyan-500 to-teal-600'
    },
    {
      id: 10,
      name: 'Scientists',
      icon: <Microscope size={32} />,
      color: 'from-violet-500 to-purple-500',
      gradient: 'bg-gradient-to-br from-violet-500 via-purple-500 to-violet-600'
    }
  ];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isHovering) return;

      const rect = container.getBoundingClientRect();
      const x = (e.clientY - rect.top - rect.height / 2) / 20;
      const y = (e.clientX - rect.left - rect.width / 2) / 20;

      setRotation({ x, y });
    };

    const handleMouseLeave = () => {
      setRotation({ x: 0, y: 0 });
      setIsHovering(false);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isHovering]);

  const angle = 360 / categories.length;

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center perspective cursor-grab active:cursor-grabbing"
      onMouseEnter={() => setIsHovering(true)}
      style={{ perspective: '1000px' }}
    >
      <div
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transformStyle: 'preserve-3d',
          transitionProperty: isHovering ? 'none' : 'transform',
          transitionDuration: '0.3s',
          width: '500px',
          height: '500px',
          position: 'relative'
        }}
      >
        {/* Central hub */}
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
          style={{
            width: '80px',
            height: '80px',
            transformStyle: 'preserve-3d',
            transform: 'translateZ(0px)'
          }}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-900 to-slate-700 border-2 border-slate-400 flex items-center justify-center shadow-2xl cursor-pointer hover:shadow-white/20 transition-all duration-300">
            <div className="text-2xl font-bold text-white">∞</div>
          </div>
        </div>

        {/* Chain links - categorized creators */}
        {categories.map((category, index) => {
          const angleInRadians = (angle * index * Math.PI) / 180;
          const radius = 200;
          const x = Math.cos(angleInRadians) * radius;
          const y = Math.sin(angleInRadians) * radius;

          return (
            <div
              key={category.id}
              className="absolute top-1/2 left-1/2 group"
              style={{
                width: '120px',
                height: '120px',
                transformStyle: 'preserve-3d',
                transform: `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), 50px)`,
              }}
            >
              {/* Connection line to center */}
              <svg
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 group-hover:opacity-60 transition-opacity"
                width={Math.abs(x) + 40}
                height={Math.abs(y) + 40}
                style={{
                  pointerEvents: 'none',
                  zIndex: -1
                }}
              >
                <line
                  x1={Math.abs(x) / 2}
                  y1={Math.abs(y) / 2}
                  x2={Math.abs(x) / 2 - x / 2}
                  y2={Math.abs(y) / 2 - y / 2}
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-slate-400"
                />
              </svg>

              {/* Category card */}
              <div
                className={`w-full h-full rounded-xl ${category.gradient} shadow-lg hover:shadow-2xl transform transition-all duration-300 hover:scale-110 hover:z-50 flex flex-col items-center justify-center text-white border border-white/20 backdrop-blur-sm cursor-pointer group relative overflow-hidden`}
              >
                {/* Animated background shimmer */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div className="transform group-hover:scale-125 transition-transform duration-300">
                    {category.icon}
                  </div>
                  <p className="text-xs font-semibold text-center text-white drop-shadow-lg">
                    {category.name}
                  </p>
                </div>

                {/* Glow effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-xl blur-xl shadow-2xl" />
              </div>
            </div>
          );
        })}

        {/* Orbiting particles */}
        <div
          className="absolute inset-0"
          style={{
            animation: 'spin 20s linear infinite reverse',
            transformStyle: 'preserve-3d'
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={`particle-${i}`}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                top: '50%',
                left: '50%',
                opacity: 0.3,
                transform: `rotateY(${i * 90}deg) translateZ(280px)`,
                animation: 'float 3s ease-in-out infinite'
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotateZ(0deg); }
          to { transform: rotateZ(360deg); }
        }

        @keyframes float {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }

        .perspective {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
};

export default Creator3DChain;
