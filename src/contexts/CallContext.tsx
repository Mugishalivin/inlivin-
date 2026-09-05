import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const sb = supabase as any;

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ],
  bundlePolicy: "max-bundle",
};

export type CallMode = "voice" | "video";
export type CallStatus = "pending" | "accepted" | "active" | "rejected" | "ended";

export interface CallSession {
  id: string;
  conversation_id: string;
  initiator_id: string;
  recipient_id: string | null;
  mode: CallMode | string;
  status: CallStatus | string;
  is_group?: boolean | null;
  title?: string | null;
  burst_emojis?: string[] | null;
  created_at: string;
  accepted_at?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
}

export interface CallParticipant {
  id: string;
  session_id: string;
  user_id: string;
  status: "invited" | "joined" | "left" | "declined" | string;
  is_muted: boolean;
  is_video_on: boolean;
  is_screen_sharing: boolean;
  joined_at: string | null;
}

export interface CallProfile {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface StartCallArgs {
  conversationId: string;
  mode: CallMode;
  inviteeIds: string[];
  isGroup?: boolean;
  title?: string | null;
}

interface CallContextType {
  session: CallSession | null;
  participants: CallParticipant[];
  profiles: Record<string, CallProfile>;
  incomingCall: CallSession | null;
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  isMicMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isRoomOpen: boolean;
  isConnecting: boolean;
  durationSeconds: number;
  connectionQuality: "connecting" | "good" | "weak";
  setRoomOpen: (open: boolean) => void;
  startCall: (args: StartCallArgs) => Promise<CallSession | null>;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  leaveCall: () => Promise<void>;
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => Promise<void>;
  inviteToCall: (userIds: string[]) => Promise<void>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error("useCall must be used within a CallProvider");
  return context;
};

export const CallProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [session, setSession] = useState<CallSession | null>(null);
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [profiles, setProfiles] = useState<Record<string, CallProfile>>({});
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRoomOpen, setIsRoomOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<"connecting" | "good" | "weak">("connecting");

  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const sessionIdRef = useRef<string | null>(null);
  const joinedRef = useRef(false);

  const loadProfiles = useCallback(async (ids: string[]) => {
    const missing = ids.filter((id) => id && !profiles[id]);
    if (!missing.length) return;
    const { data } = await sb
      .from("profiles")
      .select("user_id, display_name, username, avatar_url")
      .in("user_id", missing);
    if (data?.length) {
      setProfiles((prev) => {
        const next = { ...prev };
        for (const row of data as CallProfile[]) next[row.user_id] = row;
        return next;
      });
    }
  }, [profiles]);

  /* ------------------------------ media ------------------------------ */

  const acquireMedia = useCallback(async (mode: CallMode) => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: mode === "video" ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false,
    });
    localStreamRef.current = stream;
    cameraTrackRef.current = stream.getVideoTracks()[0] ?? null;
    setLocalStream(stream);
    return stream;
  }, []);

  const teardown = useCallback(() => {
    peersRef.current.forEach((pc) => {
      try { pc.close(); } catch { /* noop */ }
    });
    peersRef.current.clear();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    cameraTrackRef.current = null;
    joinedRef.current = false;
    sessionIdRef.current = null;
    setLocalStream(null);
    setRemoteStreams({});
    setSession(null);
    setParticipants([]);
    setIsRoomOpen(false);
    setIsMicMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    setIsConnecting(false);
    setDurationSeconds(0);
    setConnectionQuality("connecting");
  }, []);

  /* ---------------------------- signalling ---------------------------- */

  const sendSignal = useCallback(async (to: string, kind: string, payload: unknown) => {
    if (!sessionIdRef.current || !userId) return;
    await sb.from("call_signals").insert({
      session_id: sessionIdRef.current,
      from_user_id: userId,
      to_user_id: to,
      kind,
      payload: payload as any,
    });
  }, [userId]);

  const getPeer = useCallback((peerId: string) => {
    const existing = peersRef.current.get(peerId);
    if (existing) return existing;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current.set(peerId, pc);

    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current as MediaStream);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) void sendSignal(peerId, "ice", event.candidate.toJSON());
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (!stream) return;
      setRemoteStreams((prev) => ({ ...prev, [peerId]: stream }));
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setConnectionQuality("good");
      if (pc.connectionState === "disconnected") setConnectionQuality("weak");
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        setRemoteStreams((prev) => {
          const next = { ...prev };
          delete next[peerId];
          return next;
        });
      }
    };

    return pc;
  }, [sendSignal]);

  const callPeer = useCallback(async (peerId: string) => {
    const pc = getPeer(peerId);
    if (pc.signalingState !== "stable") return;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await sendSignal(peerId, "offer", { sdp: offer.sdp, type: offer.type });
  }, [getPeer, sendSignal]);

  const handleSignal = useCallback(async (signal: any) => {
    if (!userId || signal.to_user_id !== userId) return;
    const from = signal.from_user_id as string;
    const pc = getPeer(from);
    try {
      if (signal.kind === "offer") {
        await pc.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendSignal(from, "answer", { sdp: answer.sdp, type: answer.type });
      } else if (signal.kind === "answer") {
        if (pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
        }
      } else if (signal.kind === "ice") {
        await pc.addIceCandidate(signal.payload as RTCIceCandidateInit);
      }
    } catch {
      /* ignore late/duplicate signals */
    }
  }, [getPeer, sendSignal, userId]);

  /* --------------------------- subscriptions --------------------------- */

  // Incoming call watcher (works on every page)
  useEffect(() => {
    if (!userId) return;

    const resolveIncoming = async (sessionId: string) => {
      const { data } = await sb.from("call_sessions").select("*").eq("id", sessionId).maybeSingle();
      if (!data) return;
      if (data.status === "ended" || data.status === "rejected") return;
      if (sessionIdRef.current === data.id) return;
      setIncomingCall(data as CallSession);
      void loadProfiles([data.initiator_id]);
    };

    const channel = supabase
      .channel(`call-invites-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "call_participants", filter: `user_id=eq.${userId}` },
        ({ new: row }: any) => {
          if (row.status === "invited") void resolveIncoming(row.session_id);
        },
      )
      .subscribe();

    // Catch calls that started while offline / before subscription
    void (async () => {
      const { data } = await sb
        .from("call_participants")
        .select("session_id, status, created_at")
        .eq("user_id", userId)
        .eq("status", "invited")
        .order("created_at", { ascending: false })
        .limit(1);
      const row = data?.[0];
      if (row && Date.now() - new Date(row.created_at).getTime() < 45_000) {
        void resolveIncoming(row.session_id);
      }
    })();

    return () => { supabase.removeChannel(channel); };
  }, [loadProfiles, userId]);

  // Active session watcher: session row, participants, signals
  useEffect(() => {
    const activeId = session?.id;
    if (!activeId || !userId) return;

    const channel = supabase
      .channel(`call-room-${activeId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "call_sessions", filter: `id=eq.${activeId}` },
        ({ new: row }: any) => setSession(row as CallSession),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "call_participants", filter: `session_id=eq.${activeId}` },
        async () => {
          const { data } = await sb.from("call_participants").select("*").eq("session_id", activeId);
          setParticipants((data ?? []) as CallParticipant[]);
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "call_signals", filter: `to_user_id=eq.${userId}` },
        ({ new: row }: any) => {
          if (row.session_id === activeId) void handleSignal(row);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [handleSignal, session?.id, userId]);

  // Keep peer mesh in sync with joined participants
  useEffect(() => {
    if (!userId || !joinedRef.current || !session) return;
    const joined = participants.filter((p) => p.status === "joined" && p.user_id !== userId);
    void loadProfiles(participants.map((p) => p.user_id));

    joined.forEach((peer) => {
      if (peersRef.current.has(peer.user_id)) return;
      // Deterministic offerer avoids glare in a mesh
      if (userId < peer.user_id) void callPeer(peer.user_id);
      else getPeer(peer.user_id);
    });

    const joinedIds = new Set(joined.map((p) => p.user_id));
    peersRef.current.forEach((pc, peerId) => {
      if (joinedIds.has(peerId)) return;
      try { pc.close(); } catch { /* noop */ }
      peersRef.current.delete(peerId);
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[peerId];
        return next;
      });
    });
  }, [callPeer, getPeer, loadProfiles, participants, session, userId]);

  // End of call detection
  useEffect(() => {
    if (!session) return;
    if (session.status === "ended" || session.status === "rejected") {
      toast.message(session.status === "rejected" ? "Call declined" : "Call ended");
      teardown();
    }
  }, [session, teardown]);

  // Duration timer
  useEffect(() => {
    if (!session || !joinedRef.current) return;
    const timer = window.setInterval(() => setDurationSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [session?.id, session, participants.length]);

  /* ------------------------------ actions ------------------------------ */

  const startCall = useCallback(async ({ conversationId, mode, inviteeIds, isGroup, title }: StartCallArgs) => {
    if (!userId) return null;
    if (sessionIdRef.current) {
      toast.error("You are already in a call");
      return null;
    }
    const targets = inviteeIds.filter((id) => id && id !== userId);
    if (!targets.length) {
      toast.error("Select at least one person to call");
      return null;
    }
    setIsConnecting(true);
    try {
      await acquireMedia(mode);

      const group = isGroup ?? targets.length > 1;
      const { data: created, error } = await sb
        .from("call_sessions")
        .insert({
          conversation_id: conversationId,
          initiator_id: userId,
          recipient_id: group ? null : targets[0],
          mode,
          status: "pending",
          is_group: group,
          title: title ?? null,
          burst_emojis: [],
        })
        .select("*")
        .single();
      if (error) throw error;

      const newSession = created as CallSession;
      sessionIdRef.current = newSession.id;
      joinedRef.current = true;

      await sb.from("call_participants").insert([
        { session_id: newSession.id, user_id: userId, status: "joined", joined_at: new Date().toISOString(), is_video_on: mode === "video" },
        ...targets.map((id) => ({ session_id: newSession.id, user_id: id, status: "invited", is_video_on: mode === "video" })),
      ]);

      await sb.from("messages").insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: `📞 Started a ${group ? "group " : ""}${mode === "video" ? "video" : "voice"} call`,
        call_session_id: newSession.id,
        attachment_kind: "call",
      });

      setSession(newSession);
      setIsRoomOpen(true);
      await loadProfiles([userId, ...targets]);
      const { data: rows } = await sb.from("call_participants").select("*").eq("session_id", newSession.id);
      setParticipants((rows ?? []) as CallParticipant[]);
      return newSession;
    } catch (error: any) {
      teardown();
      toast.error(error?.message || "Could not start the call");
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [acquireMedia, loadProfiles, teardown, userId]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall || !userId) return;
    setIsConnecting(true);
    try {
      const mode = (incomingCall.mode === "video" ? "video" : "voice") as CallMode;
      await acquireMedia(mode);
      sessionIdRef.current = incomingCall.id;
      joinedRef.current = true;

      await sb
        .from("call_participants")
        .update({ status: "joined", joined_at: new Date().toISOString(), is_video_on: mode === "video" })
        .eq("session_id", incomingCall.id)
        .eq("user_id", userId);

      await sb
        .from("call_sessions")
        .update({
          status: "active",
          accepted_at: incomingCall.accepted_at ?? new Date().toISOString(),
          started_at: incomingCall.started_at ?? new Date().toISOString(),
        })
        .eq("id", incomingCall.id);

      setSession({ ...incomingCall, status: "active" });
      setIncomingCall(null);
      setIsRoomOpen(true);
      const { data: rows } = await sb.from("call_participants").select("*").eq("session_id", incomingCall.id);
      setParticipants((rows ?? []) as CallParticipant[]);
      await loadProfiles((rows ?? []).map((row: CallParticipant) => row.user_id));
    } catch (error: any) {
      teardown();
      toast.error(error?.message || "Could not join the call");
    } finally {
      setIsConnecting(false);
    }
  }, [acquireMedia, incomingCall, loadProfiles, teardown, userId]);

  const declineCall = useCallback(async () => {
    if (!incomingCall || !userId) return;
    const target = incomingCall;
    setIncomingCall(null);
    await sb
      .from("call_participants")
      .update({ status: "declined", left_at: new Date().toISOString() })
      .eq("session_id", target.id)
      .eq("user_id", userId);

    const { data: rows } = await sb.from("call_participants").select("status").eq("session_id", target.id);
    const anyoneLeft = (rows ?? []).some((row: any) => row.status === "joined" || row.status === "invited");
    if (!anyoneLeft || !target.is_group) {
      await sb
        .from("call_sessions")
        .update({ status: "rejected", ended_at: new Date().toISOString() })
        .eq("id", target.id);
    }
  }, [incomingCall, userId]);

  const leaveCall = useCallback(async () => {
    const activeId = sessionIdRef.current;
    const current = session;
    if (!activeId || !userId) {
      teardown();
      return;
    }
    await sb
      .from("call_participants")
      .update({ status: "left", left_at: new Date().toISOString() })
      .eq("session_id", activeId)
      .eq("user_id", userId);

    const { data: rows } = await sb.from("call_participants").select("status").eq("session_id", activeId);
    const remaining = (rows ?? []).filter((row: any) => row.status === "joined" || row.status === "invited");
    if (remaining.length <= (current?.is_group ? 0 : 1) || remaining.length === 0) {
      await sb
        .from("call_sessions")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", activeId);
    }
    teardown();
  }, [session, teardown, userId]);

  const syncOwnState = useCallback(async (patch: Record<string, unknown>) => {
    if (!sessionIdRef.current || !userId) return;
    await sb
      .from("call_participants")
      .update(patch)
      .eq("session_id", sessionIdRef.current)
      .eq("user_id", userId);
  }, [userId]);

  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMicMuted(!track.enabled);
    void syncOwnState({ is_muted: !track.enabled });
  }, [syncOwnState]);

  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) {
      toast.message("This is a voice call");
      return;
    }
    track.enabled = !track.enabled;
    setIsCameraOff(!track.enabled);
    void syncOwnState({ is_video_on: track.enabled });
  }, [syncOwnState]);

  const replaceOutgoingVideo = useCallback(async (track: MediaStreamTrack | null) => {
    const senders: RTCRtpSender[] = [];
    peersRef.current.forEach((pc) => {
      pc.getSenders().forEach((sender) => {
        if (sender.track?.kind === "video" || (!sender.track && track)) senders.push(sender);
      });
    });
    await Promise.all(senders.map((sender) => sender.replaceTrack(track).catch(() => undefined)));
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (!localStreamRef.current) return;
    try {
      if (isScreenSharing) {
        await replaceOutgoingVideo(cameraTrackRef.current ?? null);
        setIsScreenSharing(false);
        void syncOwnState({ is_screen_sharing: false });
        return;
      }
      const display = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: false });
      const screenTrack: MediaStreamTrack = display.getVideoTracks()[0];
      screenTrack.onended = () => {
        void replaceOutgoingVideo(cameraTrackRef.current ?? null);
        setIsScreenSharing(false);
        void syncOwnState({ is_screen_sharing: false });
      };
      await replaceOutgoingVideo(screenTrack);
      setIsScreenSharing(true);
      void syncOwnState({ is_screen_sharing: true });
    } catch (error: any) {
      toast.error(error?.message || "Screen sharing was blocked");
    }
  }, [isScreenSharing, replaceOutgoingVideo, syncOwnState]);

  const inviteToCall = useCallback(async (userIds: string[]) => {
    const activeId = sessionIdRef.current;
    if (!activeId) return;
    const existing = new Set(participants.map((p) => p.user_id));
    const fresh = userIds.filter((id) => id && !existing.has(id));
    if (!fresh.length) return;
    const { error } = await sb.from("call_participants").insert(
      fresh.map((id) => ({ session_id: activeId, user_id: id, status: "invited" })),
    );
    if (error) {
      toast.error(error.message);
      return;
    }
    await sb.from("call_sessions").update({ is_group: true }).eq("id", activeId);
    await loadProfiles(fresh);
    toast.success(fresh.length > 1 ? `${fresh.length} people invited` : "Invite sent");
  }, [loadProfiles, participants]);

  // Hang up cleanly when the tab closes
  useEffect(() => {
    const handler = () => { void leaveCall(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [leaveCall]);

  const value = useMemo<CallContextType>(() => ({
    session,
    participants,
    profiles,
    incomingCall,
    localStream,
    remoteStreams,
    isMicMuted,
    isCameraOff,
    isScreenSharing,
    isRoomOpen,
    isConnecting,
    durationSeconds,
    connectionQuality,
    setRoomOpen: setIsRoomOpen,
    startCall,
    acceptCall,
    declineCall,
    leaveCall,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    inviteToCall,
  }), [
    acceptCall, connectionQuality, declineCall, durationSeconds, incomingCall, inviteToCall, isCameraOff,
    isConnecting, isMicMuted, isRoomOpen, isScreenSharing, leaveCall, localStream, participants, profiles,
    remoteStreams, session, startCall, toggleCamera, toggleMic, toggleScreenShare,
  ]);

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
