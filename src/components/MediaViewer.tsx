import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  FileText,
  Maximize2,
  Minus,
  Music4,
  Paperclip,
  Play,
  Pause,
  Plus,
  RotateCw,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type MediaKind = "image" | "video" | "audio" | "pdf" | "file";

export interface MediaViewerItem {
  url: string;
  name?: string | null;
  mime?: string | null;
  kind?: string | null;
  subtitle?: string | null;
  avatarUrl?: string | null;
}

export const resolveMediaKind = (item: MediaViewerItem): MediaKind => {
  const kind = (item.kind || "").toLowerCase();
  if (["image", "video", "audio", "pdf"].includes(kind)) return kind as MediaKind;
  const mime = (item.mime || "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "pdf";
  const url = item.url.toLowerCase().split("?")[0];
  if (/\.(png|jpe?g|gif|webp|avif|svg|bmp)$/.test(url)) return "image";
  if (/\.(mp4|webm|mov|m4v|ogv)$/.test(url)) return "video";
  if (/\.(mp3|wav|ogg|m4a|aac|flac|webm)$/.test(url)) return "audio";
  if (url.endsWith(".pdf")) return "pdf";
  return "file";
};

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const BARS = [10, 16, 8, 20, 13, 24, 11, 22, 15, 18, 9, 26, 14, 19, 10, 23];

/**
 * Modern, unified file previewer used across messages, projects and studio.
 * Glass chrome, keyboard shortcuts, zoom/rotate, custom media transport.
 */
export function MediaViewer({ item, onClose }: { item: MediaViewerItem | null; onClose: () => void }) {
  const kind = item ? resolveMediaKind(item) : "file";
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    setIsPlaying(false);
    setCurrent(0);
    setDuration(0);
    setZoom(1);
    setRotation(0);
  }, [item?.url]);

  const togglePlay = useCallback(() => {
    const node = mediaRef.current;
    if (!node) return;
    if (node.paused) {
      void node.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      node.pause();
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    if (!item) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === " " && (kind === "video" || kind === "audio")) {
        event.preventDefault();
        togglePlay();
      }
      if (event.key.toLowerCase() === "r" && kind === "image") setRotation((value) => (value + 90) % 360);
      if (event.key === "+" || event.key === "=") setZoom((value) => Math.min(4, value + 0.25));
      if (event.key === "-") setZoom((value) => Math.max(0.5, value - 0.25));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, kind, onClose, togglePlay]);

  if (!item) return null;

  const transport = kind === "video" || kind === "audio";

  const chrome = (
    <motion.div
      key={item.url}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex flex-col bg-background/80 backdrop-blur-2xl"
    >
      <button
        type="button"
        aria-label="Close preview"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between gap-3 border-b border-border/50 bg-card/60 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {kind === "audio" ? <Music4 size={18} /> : kind === "pdf" ? <FileText size={18} /> : <Paperclip size={18} />}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold text-foreground md:text-base">
              {item.name || "Attachment"}
            </p>
            <p className="truncate text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {item.subtitle || `${kind} preview`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {kind === "image" && (
            <>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setZoom((v) => Math.max(0.5, v - 0.25))}>
                <Minus size={16} />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setZoom((v) => Math.min(4, v + 0.25))}>
                <Plus size={16} />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setRotation((v) => (v + 90) % 360)}>
                <RotateCw size={16} />
              </Button>
            </>
          )}
          <Button asChild variant="ghost" size="icon" className="h-9 w-9">
            <a href={item.url} download target="_blank" rel="noreferrer" aria-label="Download">
              <Download size={16} />
            </a>
          </Button>
          <Button asChild variant="ghost" size="icon" className="h-9 w-9">
            <a href={item.url} target="_blank" rel="noreferrer" aria-label="Open in new tab">
              <Maximize2 size={16} />
            </a>
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={onClose} aria-label="Close">
            <X size={16} />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="relative z-10 flex flex-1 items-center justify-center overflow-auto p-4 md:p-8">
        {kind === "image" && (
          <img
            src={item.url}
            alt={item.name || "Attachment"}
            draggable={false}
            style={{ transform: `rotate(${rotation}deg) scale(${zoom})` }}
            className="max-h-[74vh] max-w-full select-none rounded-2xl object-contain shadow-2xl ring-1 ring-border/60 transition-transform duration-200"
          />
        )}

        {kind === "video" && (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={item.url}
            playsInline
            className="max-h-[70vh] w-full max-w-5xl rounded-2xl bg-black shadow-2xl ring-1 ring-border/60"
            onTimeUpdate={(e) => setCurrent((e.target as HTMLVideoElement).currentTime)}
            onLoadedMetadata={(e) => setDuration((e.target as HTMLVideoElement).duration)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlay}
          />
        )}

        {kind === "audio" && (
          <div className="flex w-full max-w-xl flex-col items-center gap-6 rounded-3xl border border-border/60 bg-card/80 p-8 text-center shadow-2xl">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
              <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-secondary">
                {item.avatarUrl ? (
                  <img src={item.avatarUrl} alt={item.subtitle || "Sender"} className="h-full w-full object-cover" />
                ) : (
                  <Music4 size={28} className="text-primary" />
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{item.subtitle || "Audio"}</p>
              <p className="mt-1 font-display text-xl font-bold text-foreground">{item.name || "Audio file"}</p>
            </div>
            <div className="flex h-10 items-end gap-1">
              {BARS.map((height, index) => (
                <motion.span
                  key={index}
                  animate={isPlaying ? { height: [height, height + 12, height - 3, height + 6] } : { height }}
                  transition={{ duration: 0.9 + (index % 3) * 0.08, repeat: isPlaying ? Infinity : 0, repeatType: "mirror", ease: "easeInOut", delay: index * 0.03 }}
                  className="w-1.5 rounded-full bg-gradient-to-t from-primary via-accent to-primary/40"
                  style={{ height }}
                />
              ))}
            </div>
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={item.url}
              className="hidden"
              onTimeUpdate={(e) => setCurrent((e.target as HTMLAudioElement).currentTime)}
              onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>
        )}

        {kind === "pdf" && (
          <iframe
            src={item.url}
            title={item.name || "PDF preview"}
            className="h-[74vh] w-full max-w-5xl rounded-2xl border border-border/60 bg-white shadow-2xl"
          />
        )}

        {kind === "file" && (
          <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-border/60 bg-card/80 p-8 text-center shadow-2xl">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary text-foreground">
              <Paperclip size={26} />
            </div>
            <div>
              <p className="font-display font-bold text-foreground">{item.name || "File"}</p>
              <p className="mt-1 text-sm text-muted-foreground">No inline preview available for this format.</p>
            </div>
            <Button asChild>
              <a href={item.url} download target="_blank" rel="noreferrer">
                <Download size={15} className="mr-2" /> Download file
              </a>
            </Button>
          </div>
        )}
      </div>

      {/* Transport */}
      {transport && (
        <div className="relative z-10 border-t border-border/50 bg-card/60 px-4 py-3 md:px-8">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3">
            <Button size="icon" className="h-10 w-10 shrink-0 rounded-full" onClick={togglePlay}>
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </Button>
            <span className="w-11 shrink-0 text-xs tabular-nums text-muted-foreground">{formatTime(current)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={current}
              onChange={(event) => {
                const node = mediaRef.current;
                if (node) node.currentTime = Number(event.target.value);
                setCurrent(Number(event.target.value));
              }}
              className="h-1.5 min-w-[120px] flex-1 cursor-pointer accent-primary"
              aria-label="Seek"
            />
            <span className="w-11 shrink-0 text-xs tabular-nums text-muted-foreground">{formatTime(duration)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => {
                const node = mediaRef.current;
                if (!node) return;
                node.muted = !node.muted;
                setMuted(node.muted);
              }}
              aria-label="Mute"
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );

  return createPortal(<AnimatePresence>{chrome}</AnimatePresence>, document.body);
}

export default MediaViewer;
