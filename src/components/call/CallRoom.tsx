import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, Minimize2, Users, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCall, type CallParticipant, type CallProfile } from "@/contexts/CallContext";

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

function ParticipantTile({
  participant,
  profile,
  stream,
  isSelf,
  isVideoCall,
  muted,
  cameraOff,
  screenSharing,
  large,
}: {
  participant?: CallParticipant;
  profile?: CallProfile;
  stream: MediaStream | null;
  isSelf?: boolean;
  isVideoCall: boolean;
  muted?: boolean;
  cameraOff?: boolean;
  screenSharing?: boolean;
  large?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  const name = isSelf ? "You" : profile?.display_name || profile?.username || "Artist";
  const showVideo = isVideoCall && stream && !cameraOff;
  const pending = participant && participant.status === "invited";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-lg backdrop-blur-xl ${large ? "min-h-[320px]" : "min-h-[180px]"}`}
    >
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full min-h-[inherit] flex-col items-center justify-center gap-3 p-6">
          <div className="relative">
            {!muted && !pending && (
              <span className="absolute -inset-2 animate-ping rounded-full bg-primary/20" aria-hidden />
            )}
            <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-7 w-7 text-muted-foreground" />
              )}
            </div>
          </div>
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">
            {pending ? "Ringing…" : muted ? "Muted" : isVideoCall && cameraOff ? "Camera off" : "Connected"}
          </p>
        </div>
      )}

      <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
        <span className="max-w-[60%] truncate rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
          {name}
        </span>
        <span className="flex items-center gap-1">
          {screenSharing && (
            <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground">Sharing</span>
          )}
          <span className="rounded-full bg-background/80 p-1.5 backdrop-blur">
            {muted ? <MicOff className="h-3.5 w-3.5 text-destructive" /> : <Mic className="h-3.5 w-3.5 text-foreground" />}
          </span>
        </span>
      </div>
    </motion.div>
  );
}

export function CallRoom() {
  const { user } = useAuth();
  const {
    session, participants, profiles, localStream, remoteStreams, isMicMuted, isCameraOff,
    isScreenSharing, isRoomOpen, durationSeconds, connectionQuality,
    setRoomOpen, toggleMic, toggleCamera, toggleScreenShare, leaveCall,
  } = useCall();

  const isVideoCall = session?.mode === "video";
  const others = useMemo(
    () => participants.filter((p) => p.user_id !== user?.id && p.status !== "left" && p.status !== "declined"),
    [participants, user?.id],
  );
  const self = participants.find((p) => p.user_id === user?.id);

  if (!session || !isRoomOpen) return null;

  const gridClass = others.length <= 1
    ? "grid-cols-1"
    : others.length <= 3
      ? "grid-cols-1 sm:grid-cols-2"
      : "grid-cols-2 lg:grid-cols-3";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] flex flex-col bg-background/95 backdrop-blur-2xl"
      role="dialog"
      aria-label={`${isVideoCall ? "Video" : "Voice"} call room`}
    >
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            {session.is_group ? "Group" : "Private"} {isVideoCall ? "video" : "voice"} call
          </p>
          <h2 className="truncate font-display text-lg font-bold text-foreground">
            {session.title || (session.is_group ? `${others.length + 1} participants` : profiles[others[0]?.user_id ?? ""]?.display_name || "Artist")}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Encrypted peer-to-peer
          </span>
          <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium tabular-nums text-foreground">
            {formatDuration(durationSeconds)}
          </span>
          <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground sm:flex">
            <Users className="h-3.5 w-3.5" /> {others.filter((p) => p.status === "joined").length + 1}
          </span>
          <Button variant="ghost" size="icon" aria-label="Minimize call" onClick={() => setRoomOpen(false)}>
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Stage */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className={`grid gap-4 ${gridClass}`}>
          {others.map((participant) => (
            <ParticipantTile
              key={participant.id}
              participant={participant}
              profile={profiles[participant.user_id]}
              stream={remoteStreams[participant.user_id] ?? null}
              isVideoCall={isVideoCall}
              muted={participant.is_muted}
              cameraOff={!participant.is_video_on}
              screenSharing={participant.is_screen_sharing}
              large={others.length === 1}
            />
          ))}
        </div>

        {connectionQuality === "weak" && (
          <p className="mt-4 text-center text-xs text-muted-foreground">Reconnecting — network looks unstable.</p>
        )}
      </div>

      {/* Self preview */}
      <div className="pointer-events-none absolute bottom-24 right-4 w-32 sm:w-44">
        <div className="pointer-events-auto">
          <ParticipantTile
            participant={self}
            profile={{
              user_id: user?.id ?? "",
              display_name: "You",
              username: null,
              avatar_url: (user?.user_metadata as any)?.avatar_url ?? null,
            }}
            stream={localStream}
            isSelf
            isVideoCall={isVideoCall}
            muted={isMicMuted}
            cameraOff={isCameraOff}
            screenSharing={isScreenSharing}
          />
        </div>
      </div>

      {/* Controls */}
      <footer className="border-t border-border/60 bg-card/70 px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-xl items-center justify-center gap-2 sm:gap-3">
          <Button
            variant={isMicMuted ? "secondary" : "outline"}
            size="icon"
            className="min-h-11 min-w-11 rounded-full"
            aria-label={isMicMuted ? "Unmute microphone" : "Mute microphone"}
            onClick={toggleMic}
          >
            {isMicMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

          {isVideoCall && (
            <Button
              variant={isCameraOff ? "secondary" : "outline"}
              size="icon"
              className="min-h-11 min-w-11 rounded-full"
              aria-label={isCameraOff ? "Turn camera on" : "Turn camera off"}
              onClick={toggleCamera}
            >
              {isCameraOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
            </Button>
          )}

          <Button
            variant={isScreenSharing ? "default" : "outline"}
            size="icon"
            className="min-h-11 min-w-11 rounded-full"
            aria-label={isScreenSharing ? "Stop sharing screen" : "Share screen"}
            onClick={() => void toggleScreenShare()}
          >
            <MonitorUp className="h-4 w-4" />
          </Button>

          <Button
            variant="destructive"
            className="min-h-11 rounded-full px-6"
            onClick={() => void leaveCall()}
          >
            <PhoneOff className="mr-2 h-4 w-4" /> Leave
          </Button>
        </div>
      </footer>
    </motion.div>
  );
}
