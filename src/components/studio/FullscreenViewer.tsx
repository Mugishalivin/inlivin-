import { X, Volume2, VolumeX, Play, Pause, RotateCw, Maximize, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

interface FullscreenViewerProps {
  item: {
    url: string;
    name: string;
    type: "image" | "video" | "pdf";
  };
  onClose: () => void;
  autoPlay?: boolean;
}

export function FullscreenViewer({ item, onClose, autoPlay = true }: FullscreenViewerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [volume, setVolume] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-play video on mount
  useEffect(() => {
    if (item.type === "video" && autoPlay && videoRef.current) {
      videoRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [item.type, autoPlay]);

  // Update video volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Handle play/pause
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => setIsPlaying(false));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case " ":
          e.preventDefault();
          if (item.type === "video") {
            setIsPlaying(!isPlaying);
          }
          break;
        case "Escape":
          onClose();
          break;
        case "f":
          // Fullscreen toggle (browser API)
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen();
          }
          break;
        case "r":
          if (item.type === "image") {
            setRotation((rotation + 90) % 360);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isPlaying, item.type, rotation, onClose]);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = item.url;
    link.download = item.name;
    link.click();
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col group">
      {/* Header */}
      <div className="bg-gradient-to-r from-black via-black to-transparent flex items-center justify-between p-6 group-hover:opacity-100 transition-opacity">
        <div>
          <h2 className="text-white text-xl font-semibold">{item.name}</h2>
          <p className="text-white/60 text-sm mt-1 capitalize">{item.type} Preview</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-white hover:bg-white/20"
            title="Download (D)"
          >
            <Download className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto bg-black">
        {item.type === "image" && (
          <img
            src={item.url}
            alt={item.name}
            className="max-w-full max-h-full object-contain select-none"
            style={{ transform: `rotate(${rotation}deg)` }}
            draggable={false}
          />
        )}
        {item.type === "video" && (
          <video
            ref={videoRef}
            src={item.url}
            controls={false}
            className="max-w-full max-h-full object-contain"
            style={{ maxHeight: "calc(100vh - 200px)" }}
            onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
            onLoadedMetadata={(e) => setDuration((e.target as HTMLVideoElement).duration)}
            onEnded={() => setIsPlaying(false)}
          />
        )}
        {item.type === "pdf" && (
          <iframe
            src={item.url}
            className="w-full h-full border-0"
            title={item.name}
          />
        )}
      </div>

      {/* Footer Controls */}
      {item.type !== "pdf" && (
        <div className="bg-gradient-to-t from-black via-black to-transparent p-6 group-hover:opacity-100 transition-opacity">
          {item.type === "video" && (
            <>
              {/* Progress Bar */}
              <div className="mb-4 space-y-2">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={(e) => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = Number(e.target.value);
                    }
                  }}
                  className="w-full cursor-pointer accent-violet-600"
                />
                <div className="flex justify-between text-xs text-white/60">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </>
          )}

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {item.type === "image" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRotation((rotation + 90) % 360)}
                className="text-white hover:bg-white/20"
                title="Rotate (R)"
              >
                <RotateCw className="w-5 h-5" />
              </Button>
            )}

            {item.type === "video" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-white hover:bg-white/20 flex-shrink-0"
                  title="Play/Pause (Space)"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVolume(volume === 0 ? 100 : 0)}
                  className="text-white hover:bg-white/20 flex-shrink-0"
                  title="Mute/Unmute"
                >
                  {volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </Button>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-24 cursor-pointer accent-violet-600"
                    title="Volume"
                  />
                  <span className="text-xs text-white/60 w-8">{volume}%</span>
                </div>
              </>
            )}
          </div>

          {/* Keyboard Hints */}
          <div className="text-center text-xs text-white/40 mt-4">
            {item.type === "image" && "Press R to rotate • Esc to close"}
            {item.type === "video" && "Space to play/pause • Esc to close"}
          </div>
        </div>
      )}
    </div>
  );
}
