import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, PhoneOff, Maximize2, Video, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCall } from "@/contexts/CallContext";

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

export function CallDock() {
  const { user } = useAuth();
  const {
    session, participants, profiles, isRoomOpen, isMicMuted, durationSeconds,
    setRoomOpen, toggleMic, leaveCall,
  } = useCall();

  const [position, setPosition] = useState({ x: 16, y: 16 });
  const draggingRef = useRef(false);
  const movedRef = useRef(false);

  useEffect(() => {
    setPosition({ x: Math.max(12, window.innerWidth - 312), y: Math.max(12, window.innerHeight - 132) });
  }, []);

  const startDrag = (clientX: number, clientY: number) => {
    draggingRef.current = true;
    movedRef.current = false;
    const offsetX = clientX - position.x;
    const offsetY = clientY - position.y;

    const move = (x: number, y: number) => {
      movedRef.current = true;
      setPosition({
        x: Math.max(8, Math.min(x - offsetX, window.innerWidth - 292)),
        y: Math.max(8, Math.min(y - offsetY, window.innerHeight - 112)),
      });
    };

    const onMouseMove = (event: MouseEvent) => move(event.clientX, event.clientY);
    const onTouchMove = (event: TouchEvent) => move(event.touches[0].clientX, event.touches[0].clientY);
    const stop = () => {
      draggingRef.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", stop);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", stop);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", stop);
    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", stop);
  };

  if (!session || isRoomOpen) return null;

  const others = participants.filter((p) => p.user_id !== user?.id && p.status !== "left" && p.status !== "declined");
  const isVideo = session.mode === "video";
  const headline = session.is_group
    ? `${others.length + 1} in call`
    : profiles[others[0]?.user_id ?? ""]?.display_name || "Artist";
  const ringing = others.every((p) => p.status === "invited");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed z-[65] w-[280px] select-none"
      style={{ left: position.x, top: position.y }}
    >
      <div
        className="rounded-2xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur-xl"
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
      >
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary">
            {profiles[others[0]?.user_id ?? ""]?.avatar_url ? (
              <img src={profiles[others[0]?.user_id ?? ""]?.avatar_url as string} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${ringing ? "bg-amber-500" : "bg-emerald-500"}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{headline}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {isVideo ? <Video className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
              {ringing ? "Ringing…" : formatDuration(durationSeconds)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            aria-label="Expand call"
            onClick={() => { if (!movedRef.current) setRoomOpen(true); }}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button
            variant={isMicMuted ? "secondary" : "outline"}
            size="sm"
            className="flex-1"
            aria-label={isMicMuted ? "Unmute microphone" : "Mute microphone"}
            onClick={toggleMic}
          >
            {isMicMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="destructive" size="sm" className="flex-1" onClick={() => void leaveCall()}>
            <PhoneOff className="mr-1 h-3.5 w-3.5" /> End
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
