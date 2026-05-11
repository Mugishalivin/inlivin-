import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface SlideshowItem {
  id: string;
  url: string;
  title?: string;
  description?: string;
}

interface SlideshowProps {
  items: SlideshowItem[];
  onClose: () => void;
}

export function Slideshow({ items, onClose }: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentItem = items[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  // Auto-play
  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(handleNext, 4000);
    return () => clearInterval(timer);
  }, [autoPlay, items.length]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [onClose]);

  if (!currentItem || items.length === 0) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-50 bg-black flex flex-col`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-black via-black to-transparent flex items-center justify-between p-6">
        <div>
          <h2 className="text-white text-xl font-semibold">Presentation Mode</h2>
          <p className="text-white/60 text-sm mt-1">
            {currentIndex + 1} / {items.length}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-white hover:bg-white/20"
          >
            <Maximize2 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Slides */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-8"
          >
            <img
              src={currentItem.url}
              alt={currentItem.title || `Slide ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            {currentItem.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">{currentItem.title}</h3>
                {currentItem.description && (
                  <p className="text-white/80">{currentItem.description}</p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <Button
          variant="ghost"
          size="lg"
          onClick={handlePrev}
          className="absolute left-6 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={handleNext}
          className="absolute right-6 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      </div>

      {/* Footer Controls */}
      <div className="bg-gradient-to-t from-black via-black to-transparent p-6 flex items-center justify-center gap-4">
        <Button
          variant={autoPlay ? "default" : "outline"}
          size="sm"
          onClick={() => setAutoPlay(!autoPlay)}
        >
          {autoPlay ? "Pause" : "Auto-play"}
        </Button>

        {/* Slide indicator dots */}
        <div className="flex gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? "bg-violet-500 w-8" : "bg-white/30 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <p className="text-white/60 text-sm ml-auto">
          Use ← → or click to navigate | ESC to exit
        </p>
      </div>
    </div>
  );
}
