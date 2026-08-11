import { motion } from "framer-motion";
import { Phone, PhoneOff, Video, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCall } from "@/contexts/CallContext";

export function IncomingCallOverlay() {
  const { incomingCall, profiles, acceptCall, declineCall, isConnecting } = useCall();

  if (!incomingCall) return null;

  const caller = profiles[incomingCall.initiator_id];
  const isVideo = incomingCall.mode === "video";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 p-4 backdrop-blur-xl"
      role="dialog"
      aria-label="Incoming call"
    >
      <motion.div
        initial={{ y: 24, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        className="w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card p-6 text-center shadow-2xl"
      >
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Incoming {incomingCall.is_group ? "group " : ""}{isVideo ? "video" : "voice"} call
        </p>

        <div className="relative mx-auto mt-6 h-24 w-24">
          <span className="absolute -inset-3 animate-ping rounded-full bg-primary/20" aria-hidden />
          <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary">
            {caller?.avatar_url ? (
              <img src={caller.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
        </div>

        <h3 className="mt-4 font-display text-xl font-bold text-foreground">
          {caller?.display_name || caller?.username || "Artist"}
        </h3>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          {isVideo ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
          {isVideo ? "Video call" : "Voice call"}
          {incomingCall.is_group && (
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> group</span>
          )}
        </p>

        <div className="mt-7 flex items-center justify-center gap-4">
          <Button
            variant="destructive"
            size="icon"
            className="h-14 w-14 rounded-full"
            aria-label="Decline call"
            onClick={() => void declineCall()}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full"
            aria-label="Accept call"
            disabled={isConnecting}
            onClick={() => void acceptCall()}
          >
            {isVideo ? <Video className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          {isConnecting ? "Connecting…" : "Calls are peer-to-peer and never stored"}
        </p>
      </motion.div>
    </motion.div>
  );
}
