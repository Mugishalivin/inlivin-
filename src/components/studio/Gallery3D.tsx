import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface GalleryItem {
  id: string;
  url: string;
  type: "image" | "video";
  name: string;
  alt?: string;
}

interface Gallery3DProps {
  items: GalleryItem[];
  onFullscreen?: (item: GalleryItem) => void;
}

export function Gallery3D({ items, onFullscreen }: Gallery3DProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [showControls, setShowControls] = useState(false);

  if (!items.length) {
    return (
      <div className="w-full h-96 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center">
        <p className="text-slate-600 dark:text-slate-400">No media to display</p>
      </div>
    );
  }

  const currentItem = items[activeIndex];
  const nextIndex = (activeIndex + 1) % items.length;
  const prevIndex = (activeIndex - 1 + items.length) % items.length;
  const nextItem = items[nextIndex];
  const prevItem = items[prevIndex];

  const handlePrev = () => {
    setActiveIndex(prevIndex);
    setAutoPlay(false);
  };

  const handleNext = () => {
    setActiveIndex(nextIndex);
    setAutoPlay(false);
  };

  // Auto-play carousel
  useEffect(() => {
    if (!autoPlay) return;
    const timer = setTimeout(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 5000);
    return () => clearTimeout(timer);
  }, [autoPlay, items.length]);

  return (
    <div
      className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Main Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, rotateY: 90 }}
          animate={{ opacity: 1, rotateY: 0 }}
          exit={{ opacity: 0, rotateY: -90 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 w-full h-full"
        >
          {currentItem.type === "image" ? (
            <img
              src={currentItem.url}
              alt={currentItem.alt || currentItem.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <video
              src={currentItem.url}
              className="w-full h-full object-contain"
              autoPlay={isPlaying}
              muted={volume === 0}
              controls={false}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Side previews */}
      <motion.div
        className="absolute inset-y-0 left-0 w-20 flex items-center justify-start pl-2 opacity-0 group-hover:opacity-100"
        initial={false}
        animate={{ opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="aspect-video w-16 h-24 rounded-lg overflow-hidden border-2 border-violet-500 shadow-lg">
          {prevItem.type === "image" ? (
            <img
              src={prevItem.url}
              alt={prevItem.name}
              className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform"
              onClick={handlePrev}
            />
          ) : (
            <video
              src={prevItem.url}
              className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform"
              onClick={handlePrev}
            />
          )}
        </div>
      </motion.div>

      <motion.div
        className="absolute inset-y-0 right-0 w-20 flex items-center justify-end pr-2 opacity-0 group-hover:opacity-100"
        initial={false}
        animate={{ opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="aspect-video w-16 h-24 rounded-lg overflow-hidden border-2 border-violet-500 shadow-lg">
          {nextItem.type === "image" ? (
            <img
              src={nextItem.url}
              alt={nextItem.name}
              className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform"
              onClick={handleNext}
            />
          ) : (
            <video
              src={nextItem.url}
              className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform"
              onClick={handleNext}
            />
          )}
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity"
        initial={false}
        animate={{ opacity: showControls ? 1 : 0 }}
      >
        <Button
          variant="ghost"
          size="lg"
          onClick={handlePrev}
          className="text-white hover:bg-white/20"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={handleNext}
          className="text-white hover:bg-white/20"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </motion.div>

      {/* Bottom Controls */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100"
        initial={false}
        animate={{ opacity: showControls ? 1 : 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-white text-sm font-medium mb-2">{currentItem.name}</p>
            <div className="w-full bg-white/20 rounded-full h-1">
              <div
                className="bg-violet-500 h-1 rounded-full"
                style={{ width: `${((activeIndex + 1) / items.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            {currentItem.type === "video" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVolume(volume === 0 ? 100 : 0)}
                  className="text-white hover:bg-white/20"
                >
                  {volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFullscreen?.(currentItem)}
              className="text-white hover:bg-white/20"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Item counter */}
      <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium">
        {activeIndex + 1} / {items.length}
      </div>
    </div>
  );
}
