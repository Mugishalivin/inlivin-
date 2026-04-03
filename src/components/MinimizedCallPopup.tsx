import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { User, Mic, MicOff, Phone } from "lucide-react";
import { useCall } from "@/contexts/CallContext";

export const MinimizedCallPopup = () => {
  const navigate = useNavigate();
  const {
    currentCallSession,
    otherUser,
    isMicMuted,
    setIsMicMuted,
    endCallSession,
    setCallRoomOpen,
  } = useCall();

  const [position, setPosition] = useState({ x: window.innerWidth - 320, y: window.innerHeight - 120 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - startX;
      const newY = e.clientY - startY;

      const maxX = window.innerWidth - 300;
      const maxY = window.innerHeight - 100;
      const boundedX = Math.max(0, Math.min(newX, maxX));
      const boundedY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: boundedX, y: boundedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleClick = () => {
    if (!isDragging) {
      navigate("/messages");
      setCallRoomOpen(true);
    }
  };

  if (!currentCallSession) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed z-50"
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      ref={dragRef}
    >
      <div className="bg-black/90 backdrop-blur-md border border-white/20 rounded-lg p-3 shadow-2xl min-w-[280px]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              {otherUser?.profile?.avatar_url ? (
                <img
                  src={otherUser.profile.avatar_url}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <User size={14} className="text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {otherUser?.profile?.display_name || "User"}
              </p>
              <p className="text-xs text-white/60">
                {currentCallSession.mode === "video" ? "Video" : "Voice"} call
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-white hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              setIsMicMuted(!isMicMuted);
            }}
          >
            {isMicMuted ? <MicOff size={14} /> : <Mic size={14} />}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="h-8 px-3"
            onClick={(e) => {
              e.stopPropagation();
              endCallSession(currentCallSession.id);
            }}
          >
            <Phone size={14} className="mr-1" /> End
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
