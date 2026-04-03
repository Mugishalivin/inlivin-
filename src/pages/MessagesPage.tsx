import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCall } from "@/contexts/CallContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingList, LoadingChat } from "@/components/LoadingSkeletons";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  MessageCircle, Search, Send, User, ArrowLeft, Plus, Phone, Video,
  MoreVertical, Paperclip, Trash2, Check, CheckCheck,
  Copy, Reply, Forward, Star, StarOff, Edit2, X, Mic, MicOff,
  SmilePlus, Archive, BellOff, Bell, Info, Heart, ThumbsUp, Laugh, Flame as Fire, Hand,
  Headphones, Radio, Sparkles, Clapperboard, Users, UserPlus, Volume2, VideoOff, Minimize2
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const EMOJI_REACTIONS = [
  { emoji: "❤️", icon: Heart, label: "Love" },
  { emoji: "👍", icon: ThumbsUp, label: "Like" },
  { emoji: "😂", icon: Laugh, label: "Haha" },
  { emoji: "🔥", icon: Fire, label: "Fire" },
  { emoji: "👏", icon: Hand, label: "Clap" },
];

interface ConversationWithDetails {
  id: string;
  updated_at: string;
  participants: { user_id: string; profile: { display_name: string | null; avatar_url: string | null; username: string | null } }[];
  lastMessage?: { content: string; created_at: string; sender_id: string };
}

interface CallSessionRow {
  id: string;
  conversation_id: string;
  initiator_id: string;
  recipient_id: string;
  mode: "voice" | "video" | "emoji";
  status: "pending" | "accepted" | "active" | "rejected" | "ended";
  offer_sdp: string | null;
  answer_sdp: string | null;
  caller_candidates: unknown;
  callee_candidates: unknown;
  burst_emojis: string[];
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
  started_at: string | null;
  ended_at: string | null;
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const escapeIlike = (value: string) => value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");

const dedupeProfiles = (rows: Array<{ user_id: string; display_name: string | null; avatar_url: string | null; username: string | null; last_seen_at?: string | null }>) => {
  const map = new Map<string, (typeof rows)[number]>();
  rows.forEach((row) => {
    if (!map.has(row.user_id)) map.set(row.user_id, row);
  });
  return Array.from(map.values());
};

export default function MessagesPage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchUsers, setSearchUsers] = useState("");
  const [debouncedSearchUsers, setDebouncedSearchUsers] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchConvos, setSearchConvos] = useState("");
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [editingMsg, setEditingMsg] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; sender: string } | null>(null);
  const [forwardMsg, setForwardMsg] = useState<string | null>(null);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [starredMsgs, setStarredMsgs] = useState<Set<string>>(new Set());
  const [searchInChat, setSearchInChat] = useState("");
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showEmojiFor, setShowEmojiFor] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, string[]>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string | null>(null);
  const [voiceNoteLabel, setVoiceNoteLabel] = useState<string | null>(null);
  const [mutedConvos, setMutedConvos] = useState<Set<string>>(new Set());
  const [archivedConvos, setArchivedConvos] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [msgInfoId, setMsgInfoId] = useState<string | null>(null);
  const [showCallSheet, setShowCallSheet] = useState(false);
  const [callMode, setCallMode] = useState<"voice" | "video" | null>(null);
  const [callBurstEmoji, setCallBurstEmoji] = useState<string>("✨");
  const [showAddUserMenu, setShowAddUserMenu] = useState(false);
  const [callAddUserSearch, setCallAddUserSearch] = useState("");
  const [debouncedCallAddUserSearch, setDebouncedCallAddUserSearch] = useState("");
  const [forwardSearch, setForwardSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; isMine: boolean } | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<{ url: string; name: string | null; mime: string | null; kind: string; avatarUrl?: string | null; senderName?: string | null } | null>(null);
  const [callAccepting, setCallAccepting] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const {
    currentCallSession,
    setCurrentCallSession,
    callRoomOpen,
    setCallRoomOpen,
    otherUser,
    setOtherUser,
    isMicMuted,
    setIsMicMuted,
  } = useCall();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const localMediaStreamRef = useRef<MediaStream | null>(null);
  const remoteMediaStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const processedCallerCandidatesRef = useRef(0);
  const processedCalleeCandidatesRef = useRef(0);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchUsers(searchUsers.trim());
    }, 220);
    return () => window.clearTimeout(timer);
  }, [searchUsers]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedCallAddUserSearch(callAddUserSearch.trim());
    }, 220);
    return () => window.clearTimeout(timer);
  }, [callAddUserSearch]);

  // Handle incoming userId from query params (from profile/explore message button)
  const chatWithUserId = searchParams.get("chatWith");
  const startConversation = useMutation({
    mutationFn: async (otherUserId: string) => {
      const { data: myConvos } = await supabase
        .from("conversation_participants").select("conversation_id").eq("user_id", user!.id);
      if (myConvos?.length) {
        for (const mc of myConvos) {
          const { data: otherPart } = await supabase
            .from("conversation_participants").select("id")
            .eq("conversation_id", mc.conversation_id).eq("user_id", otherUserId).maybeSingle();
          if (otherPart) return mc.conversation_id;
        }
      }
      const convoId = crypto.randomUUID();
      const { error: convoErr } = await supabase.from("conversations").insert({ id: convoId });
      if (convoErr) throw convoErr;
      const { error: selfErr } = await supabase.from("conversation_participants").insert({ conversation_id: convoId, user_id: user!.id });
      if (selfErr) throw selfErr;
      const { error: otherErr } = await supabase.from("conversation_participants").insert({ conversation_id: convoId, user_id: otherUserId });
      if (otherErr) throw otherErr;
      return convoId;
    },
    onSuccess: (convoId) => {
      setActiveConvo(convoId ?? null);
      setShowNewChat(false);
      setSearchUsers("");
      searchParams.delete("chatWith");
      setSearchParams(searchParams, { replace: true });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  useEffect(() => {
    if (chatWithUserId && user) {
      startConversation.mutate(chatWithUserId);
    }
  }, [chatWithUserId, startConversation, user]);

  // Fetch conversations (batch load participants + profiles + last message)
  const { data: conversations = [], isLoading: convoLoading } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: participations } = await supabase
        .from("conversation_participants")
        .select("conversation_id, conversations(id, created_at, updated_at)")
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false });

      if (!participations?.length) return [];

      const conversationIds = participations.map((row) => row.conversation_id);

      const { data: allParticipants } = await supabase
        .from("conversation_participants")
        .select("conversation_id, user_id")
        .in("conversation_id", conversationIds)
        .neq("user_id", user.id);

      const otherUserIds = Array.from(new Set((allParticipants ?? []).map((p) => p.user_id)));
      const profileMap = new Map<string, { display_name: string | null; avatar_url: string | null; username: string | null }>();
      if (otherUserIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url, username")
          .in("user_id", otherUserIds);
        (profiles ?? []).forEach((profile) => {
          profileMap.set(profile.user_id, profile);
        });
      }

      const { data: lastMessages } = await supabase
        .from("messages")
        .select("conversation_id, content, created_at, sender_id")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false });

      const lastMessageMap = new Map<string, { content: string; created_at: string; sender_id: string }>();
      (lastMessages ?? []).forEach((msg) => {
        if (!lastMessageMap.has(msg.conversation_id)) {
          lastMessageMap.set(msg.conversation_id, msg as any);
        }
      });

      return (participations ?? []).reduce<ConversationWithDetails[]>((acc, row) => {
        const convo = (row as any).conversations;
        const convoRecord = Array.isArray(convo) ? convo[0] : convo;
        if (!convoRecord) return acc;

        const participants = (allParticipants ?? [])
          .filter((p) => p.conversation_id === convoRecord.id)
          .map((p) => ({
            user_id: p.user_id,
            profile: profileMap.get(p.user_id) || { display_name: null, avatar_url: null, username: null },
          }));

        const lastMessage = lastMessageMap.get(convoRecord.id);
        acc.push({ ...convoRecord, participants, lastMessage: lastMessage || undefined });
        return acc;
      }, []);
    },
    enabled: !!user,
    staleTime: 1000 * 15,
    gcTime: 1000 * 60 * 3,
  });

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", activeConvo],
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("*").eq("conversation_id", activeConvo!).order("created_at", { ascending: true });
      return data ?? [];
    },
    enabled: !!activeConvo,
  });

  const { data: hiddenMessageRows = [] } = useQuery({
    queryKey: ["message-hidden", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("message_hidden").select("message_id").eq("user_id", user.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: callSessions = [] } = useQuery<CallSessionRow[]>({
    queryKey: ["call-sessions", activeConvo],
    queryFn: async () => {
      if (!activeConvo) return [];
      const { data } = await supabase
        .from("call_sessions")
        .select("*")
        .eq("conversation_id", activeConvo)
        .neq("status", "ended")
        .order("created_at", { ascending: false });
      return (data ?? []) as CallSessionRow[];
    },
    enabled: !!activeConvo,
  });

  // Search users
  const activeCutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const { data: activeChatSuggestions = [] } = useQuery({
    queryKey: ["active-chat-suggestions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, username, last_seen_at")
        .neq("user_id", user.id)
        .not("last_seen_at", "is", null)
        .gte("last_seen_at", activeCutoff)
        .order("last_seen_at", { ascending: false })
        .limit(8);
      return (data ?? []) as Array<{ user_id: string; display_name: string | null; avatar_url: string | null; username: string | null; last_seen_at?: string | null }>;
    },
    enabled: !!user && showNewChat && !debouncedSearchUsers,
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ["search-users-chat", debouncedSearchUsers],
    queryFn: async () => {
      if (!debouncedSearchUsers) return [];
      const term = escapeIlike(debouncedSearchUsers);
      const select = "user_id, display_name, avatar_url, username, last_seen_at";
      try {
        const [nameRes, userRes] = await Promise.all([
          supabase
            .from("profiles")
            .select(select)
            .neq("user_id", user!.id)
            .not("last_seen_at", "is", null)
            .gte("last_seen_at", activeCutoff)
            .ilike("display_name", `%${term}%`)
            .limit(10),
          supabase
            .from("profiles")
            .select(select)
            .neq("user_id", user!.id)
            .not("last_seen_at", "is", null)
            .gte("last_seen_at", activeCutoff)
            .ilike("username", `%${term}%`)
            .limit(10),
        ]);
        const merged = dedupeProfiles([
          ...(nameRes.data ?? []),
          ...(userRes.data ?? []),
        ] as Array<{ user_id: string; display_name: string | null; avatar_url: string | null; username: string | null; last_seen_at?: string | null }>);
        return merged;
      } catch (error) {
        console.error("Search error:", error);
        return [];
      }
    },
    enabled: !!user && debouncedSearchUsers.length > 1,
  });

  const { data: callUserSuggestions = [] } = useQuery({
    queryKey: ["call-user-suggestions", debouncedCallAddUserSearch],
    queryFn: async () => {
      if (!user) return [];
      const trimmed = debouncedCallAddUserSearch.trim();
      const select = "user_id, display_name, avatar_url, username, last_seen_at";
      if (!trimmed) {
        return (activeChatSuggestions as Array<{ user_id: string; display_name: string | null; avatar_url: string | null; username: string | null; last_seen_at?: string | null }>);
      }
      const term = escapeIlike(trimmed);
      try {
        const [nameRes, userRes] = await Promise.all([
          supabase
            .from("profiles")
            .select(select)
            .neq("user_id", user!.id)
            .not("last_seen_at", "is", null)
            .gte("last_seen_at", activeCutoff)
            .ilike("display_name", `%${term}%`)
            .limit(8),
          supabase
            .from("profiles")
            .select(select)
            .neq("user_id", user!.id)
            .not("last_seen_at", "is", null)
            .gte("last_seen_at", activeCutoff)
            .ilike("username", `%${term}%`)
            .limit(8),
        ]);
        return dedupeProfiles([
          ...(nameRes.data ?? []),
          ...(userRes.data ?? []),
        ] as Array<{ user_id: string; display_name: string | null; avatar_url: string | null; username: string | null; last_seen_at?: string | null }>);
      } catch (error) {
        console.error("Call add-user search error:", error);
        return [];
      }
    },
    enabled: !!user,
  });

  const { data: forwardSuggestions = [] } = useQuery({
    queryKey: ["forward-suggestions", forwardMsg, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: connections } = await supabase
        .from("connections")
        .select("following_id")
        .eq("follower_id", user.id)
        .limit(5);
      const ids = connections?.map((row) => row.following_id) ?? [];
      if (!ids.length) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, username, last_seen_at")
        .in("user_id", ids);
      return ((profiles ?? []) as Array<{ user_id: string; display_name: string | null; avatar_url: string | null; username: string | null; last_seen_at?: string | null }>).filter((profile) => {
        if (!profile.last_seen_at) return false;
        return new Date(profile.last_seen_at).getTime() >= new Date(activeCutoff).getTime();
      });
    },
    enabled: !!forwardMsg && !!user,
  });

  const { data: forwardSearchResults = [] } = useQuery({
    queryKey: ["forward-search", forwardSearch, forwardMsg],
    queryFn: async () => {
      if (!forwardSearch.trim()) return [];
      const term = escapeIlike(forwardSearch.trim());
      try {
        const [nameRes, userRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url, username, last_seen_at")
            .neq("user_id", user!.id)
            .not("last_seen_at", "is", null)
            .gte("last_seen_at", activeCutoff)
            .ilike("display_name", `%${term}%`)
            .limit(8),
          supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url, username, last_seen_at")
            .neq("user_id", user!.id)
            .not("last_seen_at", "is", null)
            .gte("last_seen_at", activeCutoff)
            .ilike("username", `%${term}%`)
            .limit(8),
        ]);
        return dedupeProfiles([...(nameRes.data ?? []), ...(userRes.data ?? [])]);
      } catch (error) {
        console.error("Forward search error:", error);
        return [];
      }
    },
    enabled: !!forwardMsg && forwardSearch.length > 1 && !!user,
  });

  // Real-time messages
  useEffect(() => {
    if (!activeConvo) return;
    const channel = supabase.channel(`messages-${activeConvo}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${activeConvo}` },
        () => queryClient.invalidateQueries({ queryKey: ["messages", activeConvo] })
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConvo, queryClient]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("conversations-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" },
        () => queryClient.invalidateQueries({ queryKey: ["conversations"] })
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("message-hidden-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "message_hidden" }, () => {
        queryClient.invalidateQueries({ queryKey: ["message-hidden", user.id] });
        queryClient.invalidateQueries({ queryKey: ["messages", activeConvo] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConvo, queryClient, user]);

  useEffect(() => {
    if (!activeConvo) return;
    const channel = supabase
      .channel(`call-sessions-${activeConvo}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "call_sessions", filter: `conversation_id=eq.${activeConvo}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["call-sessions", activeConvo] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConvo, queryClient]);

  useEffect(() => {
    if (!activeConvo || !user) return;
    const channel = supabase
      .channel(`typing-${activeConvo}`)
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.userId === user.id) return;
        setOtherTyping(Boolean(payload?.isTyping));
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 2200);
      })
      .subscribe();
    typingChannelRef.current = channel;
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setOtherTyping(false);
      typingChannelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [activeConvo, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = useCallback((val: string) => {
    setMessageText(val);
    if (!activeConvo || !user || !typingChannelRef.current) return;
    typingChannelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: user.id, isTyping: Boolean(val.trim()) },
    });
  }, [activeConvo, user]);

const sendMessage = useMutation({
    mutationFn: async () => {
      if (!activeConvo) return;
      const contentParts: string[] = [];
      const text = messageText.trim();
      if (text) contentParts.push(text);
      let attachment_url: string | null = null;
      let attachment_name: string | null = null;
      let attachment_mime_type: string | null = null;
      let attachment_kind = "text";
      let attachment_marker = "";
      if (attachFile) {
        const ext = attachFile.name.split(".").pop() || "bin";
        const path = `messages/${user!.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("project-files").upload(path, attachFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(path);
        attachment_url = urlData.publicUrl;
        attachment_name = attachFile.name;
        attachment_mime_type = attachFile.type || null;
        attachment_kind = attachFile.type.startsWith("image/")
          ? "image"
          : attachFile.type.startsWith("video/")
            ? "video"
            : attachFile.type.startsWith("audio/")
              ? "audio"
              : "file";
        attachment_marker = attachment_kind === "image" ? "🖼️" : attachment_kind === "video" ? "🎬" : attachment_kind === "audio" ? "🎧" : "📎";
        contentParts.push(`${attachment_marker} ${urlData.publicUrl}`);
      }
      if (voiceNoteUrl) {
        contentParts.push(`🎤 ${voiceNoteUrl}`);
        attachment_url = attachment_url || voiceNoteUrl;
        attachment_name = attachment_name || voiceNoteLabel || "Voice note";
        attachment_mime_type = attachment_mime_type || "audio/webm";
        if (attachment_kind === "text") attachment_kind = "audio";
      }
      if (replyTo) {
        contentParts.unshift(`↩️ ${replyTo.content.slice(0, 50)}${replyTo.content.length > 50 ? "..." : ""}`);
      }
      const content = contentParts.join("\n\n");
      if (!content) return;
      const { error } = await supabase.from("messages").insert({
        conversation_id: activeConvo,
        sender_id: user!.id,
        content,
        attachment_url,
        attachment_name,
        attachment_mime_type,
        attachment_kind,
      });
      if (error) throw error;
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", activeConvo);
    },
    onSuccess: () => {
      setMessageText("");
      setAttachFile(null);
      setReplyTo(null);
      setVoiceNoteUrl(null);
      setVoiceNoteLabel(null);
      setRecordSeconds(0);
      queryClient.invalidateQueries({ queryKey: ["messages", activeConvo] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Message sent!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const hideMessageForMe = useMutation({
    mutationFn: async (msgId: string) => {
      const { error } = await supabase.from("message_hidden").upsert({ message_id: msgId, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-hidden", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["messages", activeConvo] });
      toast.success("Message hidden");
    },
  });

  const deleteMessageForEveryone = useMutation({
    mutationFn: async (msgId: string) => {
      const { data: msg } = await supabase.from("messages").select("sender_id").eq("id", msgId).single();
      if (!msg || msg.sender_id !== user!.id) throw new Error("Only the sender can delete for everyone");
      const { error } = await supabase.from("messages").update({ deleted_for_all: true, content: "This message was deleted" }).eq("id", msgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", activeConvo] });
      toast.success("Deleted for everyone");
    },
  });

  // Edit message
  const editMessage = useMutation({
    mutationFn: async ({ msgId, content }: { msgId: string; content: string }) => {
      const { error } = await supabase.from("messages").update({ content: `${content} (edited)` }).eq("id", msgId).eq("sender_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingMsg(null);
      setEditText("");
      queryClient.invalidateQueries({ queryKey: ["messages", activeConvo] });
      toast.success("Message edited");
    },
  });

  const forwardToUser = useMutation({
    mutationFn: async (target: { user_id: string }) => {
      if (!forwardMsg) throw new Error("Nothing to forward");
      const convoId = await startConversation.mutateAsync(target.user_id);
      const { error } = await supabase.from("messages").insert({
        conversation_id: convoId,
        sender_id: user!.id,
        content: `⤳ Forwarded:\n${forwardMsg}`,
      });
      if (error) throw error;
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convoId);
      return convoId;
    },
    onSuccess: () => {
      setForwardMsg(null);
      setForwardSearch("");
      toast.success("Forwarded to artist");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const cleanupCallResources = useCallback(() => {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    localMediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    localMediaStreamRef.current = null;
    remoteMediaStreamRef.current = null;
    processedCallerCandidatesRef.current = 0;
    processedCalleeCandidatesRef.current = 0;
    setIsMicMuted(false);
    setIsCameraOff(false);
    setCallRoomOpen(false);
    setCurrentCallSession(null);
    setCallAccepting(false);
  }, []);

  const startCallInvite = useMutation({
    mutationFn: async ({ conversationId, recipient }: { conversationId: string; recipient: { user_id: string; profile: { display_name: string | null; avatar_url: string | null; username: string | null } } }) => {
      if (!conversationId || !recipient?.user_id) {
        throw new Error("Please open a conversation first");
      }
      const currentCallMode = callMode || "voice";
      const { data, error } = await supabase
        .from("call_sessions")
        .insert({
          conversation_id: conversationId,
          initiator_id: user!.id,
          recipient_id: recipient.user_id,
          mode: currentCallMode,
          burst_emojis: [],
          status: "pending",
        })
        .select("*")
        .single();
      if (error) throw error;
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user!.id,
        content: `📞 Started a ${currentCallMode === "video" ? "video" : "voice"} call...`,
        call_session_id: data.id,
        attachment_kind: "call",
      });
      return data as CallSessionRow;
    },
    onSuccess: (session, { recipient }) => {
      setCurrentCallSession(session);
      setOtherUser(recipient);
      setCallRoomOpen(true);
      setShowCallSheet(false);
      toast.success("Call started");
      queryClient.invalidateQueries({ queryKey: ["call-sessions", activeConvo] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const acceptCallSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.from("call_sessions").update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      }).eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: (_, sessionId) => {
      const session = callSessions.find(s => s.id === sessionId);
      if (session) {
        setCurrentCallSession(session);
        setOtherUser(localOtherUser);
      }
      setCallRoomOpen(true);
      setCallAccepting(true);
      queryClient.invalidateQueries({ queryKey: ["call-sessions", activeConvo] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Could not accept call");
      setCallAccepting(false);
    },
  });

  const declineCallSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.from("call_sessions").update({ status: "rejected", ended_at: new Date().toISOString() }).eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Call declined");
      queryClient.invalidateQueries({ queryKey: ["call-sessions", activeConvo] });
    },
  });

  const endCallSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.from("call_sessions").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      cleanupCallResources();
      setCurrentCallSession(null);
      setOtherUser(null);
      setCallRoomOpen(false);
      toast.success("Call ended");
      queryClient.invalidateQueries({ queryKey: ["call-sessions", activeConvo] });
    },
  });

  // Delete conversation
  const deleteConversation = useMutation({
    mutationFn: async (convoId: string) => {
      const { error } = await supabase.from("conversation_participants").delete().eq("conversation_id", convoId).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setActiveConvo(null);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Conversation removed");
    },
  });

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return d.toLocaleDateString();
  };

  const isImageUrl = (text: string) => /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(text);
  const isVideoUrl = (text: string) => /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(text);
  const isAudioUrl = (text: string) => /\.(mp3|wav|ogg|m4a|aac|webm)(\?.*)?$/i.test(text);
  const isLinkUrl = (text: string) => /^https?:\/\/[^\s]+$/i.test(text);

  const addReaction = useCallback((msgId: string, emoji: string) => {
    setReactions((prev) => {
      const existing = prev[msgId] || [];
      if (existing.includes(emoji)) return { ...prev, [msgId]: existing.filter((e) => e !== emoji) };
      return { ...prev, [msgId]: [...existing, emoji] };
    });
    setShowEmojiFor(null);
  }, []);

  const toggleStar = useCallback((msgId: string) => {
    setStarredMsgs((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId); else next.add(msgId);
      return next;
    });
  }, []);

  const toggleMute = useCallback((convoId: string) => {
    setMutedConvos((prev) => {
      const next = new Set(prev);
      if (next.has(convoId)) {
        next.delete(convoId);
        toast.success("Unmuted");
      } else {
        next.add(convoId);
        toast.success("Muted");
      }
      return next;
    });
  }, []);

  const toggleArchive = useCallback((convoId: string) => {
    setArchivedConvos((prev) => {
      const next = new Set(prev);
      if (next.has(convoId)) {
        next.delete(convoId);
        toast.success("Unarchived");
      } else {
        next.add(convoId);
        toast.success("Archived");
      }
      return next;
    });
  }, []);

  const copyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  }, []);

  const uploadRecordedVoiceNote = useCallback(async (blob: Blob, duration: number) => {
    const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: blob.type || "audio/webm" });
    const path = `messages/${user!.id}/voice-notes/${Date.now()}.webm`;
    const { error } = await supabase.storage.from("project-files").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("project-files").getPublicUrl(path);
    setVoiceNoteUrl(data.publicUrl);
    setVoiceNoteLabel(`Voice note ${formatDuration(Math.max(1, duration))}`);
    // Auto-send voice note after upload
    setTimeout(() => sendMessage.mutate(), 300);
  }, [user, sendMessage]);

  const cancelRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    recordingChunksRef.current = [];
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    recordingStreamRef.current = null;
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
    setRecordSeconds(0);
    setVoiceNoteUrl(null);
    setVoiceNoteLabel(null);
    toast.message("Recording discarded");
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    recordingStreamRef.current = null;
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  const pauseRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.pause();
      setIsPaused(true);
      toast.message("Recording paused");
    }
  }, []);

  const resumeRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === "paused") {
      recorder.resume();
      setIsPaused(false);
      toast.message("Recording resumed");
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Voice notes are not supported in this browser");
      return;
    }
    try {
      setRecordSeconds(0);
      setIsPaused(false);
      setVoiceNoteUrl(null);
      setVoiceNoteLabel(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      recordingChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };
      recorder.onpause = () => toast.message("Recording paused");
      recorder.onresume = () => toast.message("Recording live");
      recorder.onstop = async () => {
        try {
          const blob = new Blob(recordingChunksRef.current, { type: recorder.mimeType || "audio/webm" });
          await uploadRecordedVoiceNote(blob, recordSeconds);
        } catch (error: any) {
          toast.error(error?.message || "Could not save voice note");
        } finally {
          recordingChunksRef.current = [];
          mediaRecorderRef.current = null;
          recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
          recordingStreamRef.current = null;
        }
      };
      recorder.start();
      setIsRecording(true);
      recordingTimerRef.current = setInterval(() => setRecordSeconds((sec) => sec + 1), 1000);
      toast.info("Recording voice note...");
    } catch (error: any) {
      toast.error(error?.message || "Microphone access denied");
      setIsRecording(false);
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
    }
  }, [recordSeconds, uploadRecordedVoiceNote]);

  const toggleRecording = useCallback(() => {
    if (isRecording) stopRecording();
    else void startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const getAttachmentInfo = (msg: { content: string; attachment_url?: string | null; attachment_name?: string | null; attachment_mime_type?: string | null; attachment_kind?: string | null }) => {
    if (msg.attachment_url) {
      return {
        url: msg.attachment_url,
        name: msg.attachment_name || null,
        mime: msg.attachment_mime_type || null,
        kind: msg.attachment_kind || "file",
      };
    }
    const markerLine = msg.content.split("\n").find((line) => /^(🖼️|🎬|🎧|🎤|📎)\s+/.test(line));
    if (!markerLine) return null;
    const match = markerLine.match(/^(🖼️|🎬|🎧|🎤|📎)\s+(.+)$/);
    if (!match) return null;
    const marker = match[1];
    const url = match[2];
    return {
      url,
      name: null,
      mime: marker === "🎬" ? "video/*" : marker === "🎧" || marker === "🎤" ? "audio/*" : null,
      kind: marker === "🖼️" ? "image" : marker === "🎬" ? "video" : marker === "🎧" || marker === "🎤" ? "audio" : "file",
    };
  };

  const openAttachmentPreview = (msg: { content: string; attachment_url?: string | null; attachment_name?: string | null; attachment_mime_type?: string | null; attachment_kind?: string | null }, meta?: { avatarUrl?: string | null; senderName?: string | null }) => {
    const attachment = getAttachmentInfo(msg);
    if (!attachment) return;
    setPreviewAttachment({
      ...attachment,
      avatarUrl: meta?.avatarUrl ?? null,
      senderName: meta?.senderName ?? null,
    });
  };

  const renderMessageContent = (
    msg: { content: string; attachment_url?: string | null; attachment_name?: string | null; attachment_mime_type?: string | null; attachment_kind?: string | null },
    meta?: { isMine?: boolean; avatarUrl?: string | null; senderName?: string | null }
  ) => {
    const parts = msg.content.split('\n');
    const attachment = getAttachmentInfo(msg);
    const previewMeta = {
      avatarUrl: meta?.avatarUrl ?? null,
      senderName: meta?.senderName ?? null,
    };
    return parts.map((part, i) => {
      if (part.startsWith('🖼️ ')) {
        const url = part.replace('🖼️ ', '');
        if (isImageUrl(url)) {
          return <img key={i} src={url} alt="attachment" className="max-w-[200px] rounded-lg mt-1 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => openAttachmentPreview(msg, previewMeta)} />;
        }
        return <button key={i} type="button" onClick={() => openAttachmentPreview(msg, previewMeta)} className="underline text-xs opacity-80 block text-left">Image attachment</button>;
      }
      if (part.startsWith('🎬 ')) {
        const url = part.replace('🎬 ', '');
        if (isVideoUrl(url)) {
          return <button key={i} type="button" onClick={() => openAttachmentPreview(msg, previewMeta)} className="block text-left"><video controls className="mt-2 w-full max-w-[280px] rounded-xl border border-border/60 bg-black" src={url} /></button>;
        }
        return <button key={i} type="button" onClick={() => openAttachmentPreview(msg, previewMeta)} className="underline text-xs opacity-80 block text-left">Video attachment</button>;
      }
      if (part.startsWith('🎧 ')) {
        const url = part.replace('🎧 ', '');
        if (isAudioUrl(url)) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => openAttachmentPreview(msg, previewMeta)}
              className="mt-2 flex w-full max-w-[280px] items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-3 py-2 text-left shadow-sm backdrop-blur-md transition-all hover:bg-white/12"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Radio size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{attachment?.name || "Audio file"}</p>
                <p className="text-[11px] text-muted-foreground">Tap to open full preview</p>
              </div>
            </button>
          );
        }
        return <button key={i} type="button" onClick={() => openAttachmentPreview(msg, previewMeta)} className="underline text-xs opacity-80 block text-left">Audio attachment</button>;
      }
      if (part.startsWith('🎤 ')) {
        return (
          <button
            key={i}
            type="button"
            onClick={() => openAttachmentPreview(msg, previewMeta)}
            className="mt-2 flex w-full max-w-[280px] items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-3 py-2 text-left shadow-sm backdrop-blur-md transition-all hover:bg-white/12"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Radio size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{attachment?.name || "Voice note"}</p>
              <p className="text-[11px] text-muted-foreground">Tap to listen in preview</p>
            </div>
          </button>
        );
      }
      if (part.startsWith('📎 ')) {
        return <button key={i} type="button" onClick={() => openAttachmentPreview(msg, previewMeta)} className="underline text-xs opacity-80 block text-left">Attachment</button>;
      }
      if (part.startsWith('↩️ ')) {
        return <div key={i} className="text-[10px] opacity-60 border-l-2 border-current pl-2 mb-1 italic">{part.replace('↩️ ', '')}</div>;
      }
      if (part.startsWith('⤳ Forwarded:')) {
        return <div key={i} className="text-[10px] opacity-60 italic mb-1">⤳ Forwarded</div>;
      }
      if (isLinkUrl(part)) {
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline break-all hover:opacity-80 transition-opacity">
            {part.length > 50 ? `${part.slice(0, 50)}...` : part}
          </a>
        );
      }
      if (i === 0 && attachment && parts.length === 1 && !part.trim()) {
        return (
          <button key={i} type="button" className="rounded-xl border border-border/60 bg-secondary/20 p-3 text-left" onClick={() => openAttachmentPreview(msg, previewMeta)}>
            <p className="text-sm font-medium">{attachment.name || "Attachment"}</p>
            <p className="text-xs text-muted-foreground capitalize">{attachment.kind}</p>
          </button>
        );
      }
      return <span key={i}>{part}{i < parts.length - 1 && <br />}</span>;
    });
  };

  const visibleMessages = useMemo(() => {
    if (!messages.length) return [];
    const hiddenIds = new Set(hiddenMessageRows.map((row) => row.message_id));
    return messages.filter((msg) => !msg.deleted_for_all && !hiddenIds.has(msg.id));
  }, [messages, hiddenMessageRows]);

  const groupedMessages = useMemo(() => {
    return visibleMessages.reduce((groups: Record<string, typeof visibleMessages>, msg) => {
      const date = new Date(msg.created_at).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
      return groups;
    }, {});
  }, [visibleMessages]);

  const filteredGroupedMessages = useMemo((): Record<string, typeof visibleMessages> => {
    if (!showChatSearch || !searchInChat.trim()) return groupedMessages as Record<string, typeof visibleMessages>;
    const q = searchInChat.toLowerCase();
    return Object.fromEntries(
      Object.entries(groupedMessages as Record<string, typeof visibleMessages>)
        .map(([date, msgs]) => [date, msgs.filter((m) => m.content.toLowerCase().includes(q))])
        .filter(([, msgs]) => msgs.length > 0)
    );
  }, [showChatSearch, searchInChat, groupedMessages]);

  const pinnedMessages = useMemo(() => visibleMessages.filter((m) => starredMsgs.has(m.id)), [visibleMessages, starredMsgs]);

  const filteredConversations = useMemo(() => {
    const q = searchConvos.trim().toLowerCase();
    const filtered = (conversations as ConversationWithDetails[]).filter((c) => {
      if (archivedConvos.has(c.id) && !showArchived) return false;
      if (showArchived && !archivedConvos.has(c.id)) return false;
      if (!q) return true;
      const name = c.participants[0]?.profile?.display_name || "";
      const uname = c.participants[0]?.profile?.username || "";
      return name.toLowerCase().includes(q) || uname.toLowerCase().includes(q);
    });

    // Deduplicate by participant user_id, keeping the most recent conversation
    const seen = new Map<string, ConversationWithDetails>();
    filtered.forEach((c) => {
      const participantId = c.participants[0]?.user_id;
      if (!participantId) return;
      const existing = seen.get(participantId);
      if (!existing || new Date(c.updated_at) > new Date(existing.updated_at)) {
        seen.set(participantId, c);
      }
    });

    return Array.from(seen.values()).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [conversations, archivedConvos, showArchived, searchConvos]);

  const activeConversation = useMemo(() => (activeConvo ? (conversations as ConversationWithDetails[]).find((c) => c.id === activeConvo) : null), [activeConvo, conversations]);
  const localOtherUser = activeConversation?.participants?.[0] ?? null;

  const incomingPendingCall = useMemo(() => callSessions.find((session) => session.status === "pending" && session.recipient_id === user?.id) ?? null, [callSessions, user?.id]);

  useEffect(() => {
    if (incomingPendingCall && incomingPendingCall.id !== currentCallSession?.id) {
      setCallRoomOpen(false);
    }
  }, [currentCallSession?.id, incomingPendingCall]);

  useEffect(() => {
    if (!currentCallSession || !user || peerConnectionRef.current) return;
    let cancelled = false;
    const isInitiator = currentCallSession.initiator_id === user.id;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: currentCallSession.mode === "video",
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        localMediaStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const remoteStream = new MediaStream();
        remoteMediaStreamRef.current = remoteStream;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
        });
        peerConnectionRef.current = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
          event.streams[0]?.getTracks().forEach((track) => remoteStream.addTrack(track));
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
        };

        pc.onicecandidate = async (event) => {
          if (!event.candidate) return;
          const candidatePayload = event.candidate.toJSON();
          const field = isInitiator ? "caller_candidates" : "callee_candidates";
          const { data: existing } = await supabase.from("call_sessions").select(field).eq("id", currentCallSession.id).single();
          const currentList = (existing?.[field as "caller_candidates" | "callee_candidates"] as Record<string, unknown>[] | null) ?? [];
          await supabase.from("call_sessions").update({
            [field]: [...currentList, candidatePayload],
          }).eq("id", currentCallSession.id);
        };

        if (isInitiator && !currentCallSession.offer_sdp) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await supabase.from("call_sessions").update({
            offer_sdp: offer.sdp,
            status: "pending",
          }).eq("id", currentCallSession.id);
        }
      } catch (error: any) {
        toast.error(error?.message || "Could not start call");
        cleanupCallResources();
      }
    };

    void start();

    return () => {
      cancelled = true;
    };
  }, [cleanupCallResources, currentCallSession, user]);

  useEffect(() => {
    const audioTrack = localMediaStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) audioTrack.enabled = !isMicMuted;
  }, [isMicMuted, currentCallSession]);

  useEffect(() => {
    const videoTrack = localMediaStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) videoTrack.enabled = !isCameraOff;
  }, [currentCallSession, isCameraOff]);

  useEffect(() => {
    if (!currentCallSession) return;
    if (currentCallSession.status === "ended" || currentCallSession.status === "rejected") {
      cleanupCallResources();
    }
  }, [cleanupCallResources, currentCallSession]);

  useEffect(() => {
    if (!currentCallSession || !peerConnectionRef.current || !user) return;
    const isInitiator = currentCallSession.initiator_id === user.id;
    const pc = peerConnectionRef.current;
    const remoteCandidates = isInitiator ? (currentCallSession.callee_candidates as Record<string, unknown>[]) : (currentCallSession.caller_candidates as Record<string, unknown>[]);

    const syncOfferAnswer = async () => {
      try {
        if (!isInitiator && currentCallSession.offer_sdp && pc.signalingState === "stable") {
          await pc.setRemoteDescription({ type: "offer", sdp: currentCallSession.offer_sdp });
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await supabase.from("call_sessions").update({
            answer_sdp: answer.sdp,
            status: "active",
            accepted_at: new Date().toISOString(),
            started_at: new Date().toISOString(),
          }).eq("id", currentCallSession.id);
          setCallAccepting(false);
        }
        if (isInitiator && currentCallSession.answer_sdp && pc.signalingState !== "closed") {
          const hasRemote = pc.currentRemoteDescription?.type === "answer";
          if (!hasRemote) {
            await pc.setRemoteDescription({ type: "answer", sdp: currentCallSession.answer_sdp });
            await supabase.from("call_sessions").update({
              status: "active",
              started_at: currentCallSession.started_at || new Date().toISOString(),
            }).eq("id", currentCallSession.id);
            setCallRoomOpen(true);
          }
        }
      } catch (error: any) {
        toast.error(error?.message || "Call connection failed");
      }
    };

    void syncOfferAnswer();

    const processedRef = isInitiator ? processedCalleeCandidatesRef : processedCallerCandidatesRef;
    const toProcess = remoteCandidates.slice(processedRef.current);
    if (toProcess.length > 0) {
      processedRef.current = remoteCandidates.length;
      toProcess.forEach(async (candidate) => {
        try {
          await pc.addIceCandidate(candidate as RTCIceCandidateInit);
        } catch {
          // ignore bad candidates on reconnect
        }
      });
    }
  }, [currentCallSession, user]);

  // ======================== CHAT VIEW ========================
  if (activeConvo) {
    const convo = (conversations as ConversationWithDetails[]).find(c => c.id === activeConvo);
    const otherUser = convo?.participants?.[0];
    const isMuted = mutedConvos.has(activeConvo);

    return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 p-4 backdrop-blur-2xl">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveConvo(null)}>
            <ArrowLeft size={16} />
          </Button>
          <Link to={`/profile/${localOtherUser?.user_id}`} className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10 ring-1 ring-white/20 transition-all hover:ring-white/35">
            {localOtherUser?.profile?.avatar_url ? (
              <img src={otherUser.profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={16} className="text-muted-foreground" />
            )}
            {/* Online indicator */}
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
          </Link>
          <div className="flex-1">
            <Link to={`/profile/${localOtherUser?.user_id}`} className="font-display font-bold text-sm hover:text-primary transition-colors">{localOtherUser?.profile?.display_name || "Artist"}</Link>
            {otherTyping ? (
              <p className="flex items-center gap-1 text-[10px] text-primary font-medium">
                Typing
                <span className="flex items-center gap-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                </span>
              </p>
            ) : null}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowChatSearch(!showChatSearch)}>
              <Search size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (!activeConvo || !otherUser) {
                  toast.error("Please open a conversation first");
                  return;
                }
                setCallMode("voice");
                setShowCallSheet(true);
              }}
              disabled={!activeConvo || !otherUser}
            >
              <Phone size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (!activeConvo || !otherUser) {
                  toast.error("Please open a conversation first");
                  return;
                }
                setCallMode("video");
                setShowCallSheet(true);
              }}
              disabled={!activeConvo || !otherUser}
            >
              <Video size={16} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical size={16} /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setPinnedOpen(true)}>
                  <Star size={14} className="mr-2" /> Starred Messages ({pinnedMessages.length})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleMute(activeConvo)}>
                  {isMuted ? <Bell size={14} className="mr-2" /> : <BellOff size={14} className="mr-2" />}
                  {isMuted ? "Unmute" : "Mute"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleArchive(activeConvo)}>
                  <Archive size={14} className="mr-2" /> Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => deleteConversation.mutate(activeConvo)}>
                  <Trash2 size={14} className="mr-2" /> Delete Chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search in chat */}
        <AnimatePresence>
          {showChatSearch && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-border">
              <div className="p-2 flex gap-2">
                <Input value={searchInChat} onChange={e => setSearchInChat(e.target.value)} placeholder="Search in conversation..." className="h-9 flex-1" autoFocus />
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setShowChatSearch(false); setSearchInChat(""); }}>
                  <X size={14} />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Muted indicator */}
        {isMuted && (
          <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/65 backdrop-blur-xl">
            <BellOff size={12} /> This conversation is muted
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {messagesLoading ? (
            <LoadingChat count={4} />
          ) : (
            <>
              {Object.entries(filteredGroupedMessages).map(([date, msgs]) => (
                <div key={date}>
                  <div className="flex justify-center my-4">
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] text-white/65 backdrop-blur-xl">{date}</span>
                  </div>
                  <AnimatePresence>
                    {(msgs as typeof visibleMessages).map((msg, idx) => {
                      const isMe = msg.sender_id === user!.id;
                      const showAvatar = idx === 0 || msgs[idx - 1]?.sender_id !== msg.sender_id;
                      const msgReactions = reactions[msg.id] || [];
                      const isStarred = starredMsgs.has(msg.id);
                      const isEditing = editingMsg === msg.id;

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1 group/msg`}
                        >
                          {!isMe && showAvatar && (
                            <Link to={`/profile/${localOtherUser?.user_id}`} className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10">
                              {localOtherUser?.profile?.avatar_url ? (
                                <img src={otherUser.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User size={12} className="text-muted-foreground" />
                              )}
                            </Link>
                          )}
                          {!isMe && !showAvatar && <div className="w-7 mr-2 shrink-0" />}

                          <div className="relative max-w-[70%]">
                            {/* Action buttons - appear on hover */}
                            <div className={`absolute ${isMe ? "left-0 -translate-x-full pr-1" : "right-0 translate-x-full pl-1"} top-0 flex items-center gap-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity z-10`}>
                              <button className="rounded p-1 hover:bg-white/10" onClick={() => setShowEmojiFor(showEmojiFor === msg.id ? null : msg.id)}>
                                <SmilePlus size={12} className="text-muted-foreground" />
                              </button>
                              <button className="rounded p-1 hover:bg-white/10" onClick={() => setReplyTo({ id: msg.id, content: msg.content, sender: isMe ? "You" : (localOtherUser?.profile?.display_name || "Artist") })}>
                                <Reply size={12} className="text-muted-foreground" />
                              </button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="rounded p-1 hover:bg-white/10"><MoreVertical size={12} className="text-muted-foreground" /></button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={isMe ? "end" : "start"} className="w-40">
                                  <DropdownMenuItem onClick={() => copyMessage(msg.content)}>
                                    <Copy size={12} className="mr-2" /> Copy
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toggleStar(msg.id)}>
                                    {isStarred ? <StarOff size={12} className="mr-2" /> : <Star size={12} className="mr-2" />}
                                    {isStarred ? "Unstar" : "Star"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setForwardMsg(msg.content)}>
                                    <Forward size={12} className="mr-2" /> Forward
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setMsgInfoId(msg.id)}>
                                    <Info size={12} className="mr-2" /> Info
                                  </DropdownMenuItem>
                                  {isMe && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => { setEditingMsg(msg.id); setEditText(msg.content.replace(" (edited)", "")); }}>
                                        <Edit2 size={12} className="mr-2" /> Edit
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget({ id: msg.id, isMine: isMe })}>
                                    <Trash2 size={12} className="mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Emoji picker */}
                            <AnimatePresence>
                              {showEmojiFor === msg.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className={`absolute ${isMe ? "right-0" : "left-0"} -top-10 z-20 flex gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-1 shadow-lg backdrop-blur-xl`}
                                >
                                  {EMOJI_REACTIONS.map(r => (
                                    <button key={r.emoji} className="hover:scale-125 transition-transform text-sm" onClick={() => addReaction(msg.id, r.emoji)}>
                                      {r.emoji}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Star indicator */}
                            {isStarred && (
                              <Star size={10} className="absolute -top-1.5 -right-1.5 text-yellow-500 fill-yellow-500" />
                            )}

                            {/* Message bubble */}
                            {isEditing ? (
                              <div className="flex gap-1">
                                <Input value={editText} onChange={e => setEditText(e.target.value)} className="h-8 text-sm" autoFocus
                                  onKeyDown={e => { if (e.key === "Enter") editMessage.mutate({ msgId: msg.id, content: editText }); if (e.key === "Escape") setEditingMsg(null); }}
                                />
                                <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => editMessage.mutate({ msgId: msg.id, content: editText })}>
                                  <Check size={12} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setEditingMsg(null)}>
                                  <X size={12} />
                                </Button>
                              </div>
                            ) : (
                              <div className={`rounded-2xl px-3.5 py-2 text-sm backdrop-blur-xl ${
                                isMe ? "rounded-br-md border border-white/15 bg-white/10 text-black shadow-lg dark:text-white" : "rounded-bl-md border border-white/15 bg-white/10 text-black shadow-lg dark:text-white"
                              }`}>
                                <div>{renderMessageContent(msg, { isMine: isMe, avatarUrl: isMe ? profile?.avatar_url : localOtherUser?.profile?.avatar_url, senderName: isMe ? "You" : (localOtherUser?.profile?.display_name || "Artist") })}</div>
                                <div className="flex items-center gap-1 justify-end mt-0.5">
                                  <p className="text-[10px] text-black/60 dark:text-white/60">
                                    {formatTime(msg.created_at)}
                                  </p>
                                  {isMe && <CheckCheck size={12} className="text-black/60 dark:text-white/60" />}
                                </div>
                              </div>
                            )}

                            {/* Reactions */}
                            {msgReactions.length > 0 && (
                              <div className={`flex gap-0.5 mt-0.5 ${isMe ? "justify-end" : "justify-start"}`}>
                                {msgReactions.map((emoji, i) => (
                                  <span key={i} className="cursor-pointer rounded-full border border-white/10 bg-white/10 px-1.5 py-0.5 text-xs hover:bg-white/15" onClick={() => addReaction(msg.id, emoji)}>
                                    {emoji}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ))}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply preview */}
        <AnimatePresence>
          {replyTo && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex items-center gap-2 border-t border-white/10 bg-white/5 px-4 py-2 text-sm backdrop-blur-xl">
                <Reply size={14} className="text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-primary font-medium">{replyTo.sender}</p>
                  <p className="text-xs text-muted-foreground truncate">{replyTo.content}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setReplyTo(null)}><X size={12} /></Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="border-t border-white/10 bg-white/5 p-4 backdrop-blur-2xl">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (isRecording) {
                stopRecording();
                return;
              }
              sendMessage.mutate();
            }}
          >
            <div className="flex items-end gap-2">
              <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-white/15 bg-white/10 transition-all hover:bg-white/15">
                <Paperclip size={18} className="text-muted-foreground transition-colors group-hover:text-foreground" />
                <input type="file" accept="image/*,video/*,audio/*,application/pdf,.pdf" className="hidden" onChange={(e) => setAttachFile(e.target.files?.[0] || null)} />
              </label>
              <Button
                type="button"
                variant={isRecording ? "secondary" : "ghost"}
                size="icon"
                className="h-11 w-11 shrink-0 rounded-2xl border border-white/15 bg-white/10"
                onClick={toggleRecording}
              >
                {isRecording ? <MicOff size={18} className="text-destructive" /> : <Mic size={18} className="text-muted-foreground" />}
              </Button>
              <div className="relative flex-1">
                <Input
                  ref={inputRef}
                  value={messageText}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder={isRecording ? "Recording in progress..." : "Type a message..."}
                  className="h-11 rounded-2xl border-white/15 bg-white/10 pr-14"
                />
                {isRecording && (
                  <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-end gap-0.5">
                    {[6, 10, 14, 8].map((height, index) => (
                      <motion.span
                        key={index}
                        animate={isPaused ? { height: 5, opacity: 0.45 } : { height: [height, height + 7, height - 1, height + 4] }}
                        transition={{
                          duration: 0.8 + index * 0.05,
                          repeat: isPaused ? 0 : Infinity,
                          repeatType: "mirror",
                          ease: "easeInOut",
                          delay: index * 0.08,
                        }}
                        className="w-1 rounded-full bg-gradient-to-t from-fuchsia-500 via-cyan-500 to-emerald-400"
                        style={{ height }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <Button variant="hero" size="icon" className="h-11 w-11 shrink-0 rounded-2xl shadow-lg" type="submit" disabled={!messageText.trim() && !attachFile && !voiceNoteUrl && !isRecording}>
                <Send size={16} />
              </Button>
            </div>

            <AnimatePresence>
              {attachFile && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm backdrop-blur-xl"
                >
                  {attachFile.type.startsWith("video/") ? <Clapperboard size={14} className="text-muted-foreground" /> : attachFile.type.startsWith("audio/") ? <Headphones size={14} className="text-muted-foreground" /> : <Paperclip size={14} className="text-muted-foreground" />}
                  <span className="truncate flex-1">{attachFile.name}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setAttachFile(null)}>×</Button>
                </motion.div>
              )}

              {voiceNoteUrl && !isRecording && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm backdrop-blur-xl"
                >
                  <Radio size={14} className="text-cyan-500" />
                  <span className="truncate flex-1">{voiceNoteLabel || "Voice note"} ready to send</span>
                  <Button variant="outline" size="sm" className="h-8 rounded-full" onClick={() => sendMessage.mutate()} disabled={!voiceNoteUrl}>
                    <Send size={14} className="mr-1" /> Send
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setVoiceNoteUrl(null)}>×</Button>
                </motion.div>
              )}

              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="rounded-2xl border border-white/15 bg-white/10 p-3 shadow-sm backdrop-blur-xl"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Voice booth</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded-full bg-pink-500/15 px-2 py-0.5 text-xs font-medium text-pink-600">Live</span>
                        <span className="text-sm font-semibold">{formatDuration(recordSeconds)}</span>
                        <span className="text-xs text-muted-foreground">{isPaused ? "Paused" : "Listening to your voice..."}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" className="h-8 rounded-full" onClick={isPaused ? resumeRecording : pauseRecording}>
                        {isPaused ? "Resume" : "Pause"}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="h-8 rounded-full text-destructive hover:text-destructive" onClick={cancelRecording}>
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="hero"
                        size="sm"
                        className="h-8 rounded-full"
                        onClick={async () => {
                          if (isPaused) resumeRecording();
                          stopRecording();
                          toast.message("Voice note finalized");
                        }}
                      >
                        <Send size={14} className="mr-1" /> Send note
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-end justify-center gap-1">
                    {[12, 18, 8, 22, 14, 28, 10, 24, 16, 20, 9, 26].map((height, index) => (
                      <motion.div
                        key={index}
                        animate={isPaused ? { height: 8, opacity: 0.45 } : { height: [height, height + 16, height - 2, height + 10] }}
                        transition={{
                          duration: 0.9 + (index % 3) * 0.12,
                          repeat: isPaused ? 0 : Infinity,
                          repeatType: "mirror",
                          ease: "easeInOut",
                          delay: index * 0.05,
                        }}
                        className="w-2 rounded-full bg-gradient-to-t from-fuchsia-500 via-cyan-500 to-emerald-400"
                        style={{ height }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* Image Preview Modal */}
        <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
          <DialogContent className="sm:max-w-3xl overflow-hidden border-white/15 bg-white/10 p-0 text-white backdrop-blur-2xl shadow-2xl">
            {imagePreview && (
              <div className="flex min-h-[50vh] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_55%)] p-4">
                <img src={imagePreview} alt="" className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl ring-1 ring-white/10" />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Starred Messages Dialog */}
        <Dialog open={pinnedOpen} onOpenChange={setPinnedOpen}>
          <DialogContent className="border-white/15 bg-white/10 text-white backdrop-blur-2xl sm:max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <Star size={18} className="text-yellow-500" />
              <h3 className="font-display font-bold">Starred Messages</h3>
            </div>
            {pinnedMessages.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pinnedMessages.map(msg => (
                  <div key={msg.id} className="rounded-2xl border border-white/10 bg-white/10 p-3 text-sm backdrop-blur-xl">
                    <p>{msg.content}</p>
                    <p className="text-[10px] text-white/60 mt-1">{new Date(msg.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/60 text-center py-6">No starred messages</p>
            )}
          </DialogContent>
        </Dialog>

        {/* Forward Dialog */}
        <Dialog open={!!forwardMsg} onOpenChange={() => setForwardMsg(null)}>
          <DialogContent className="border-white/15 bg-white/10 text-white backdrop-blur-2xl sm:max-w-lg">
            <div className="mb-4 flex items-center gap-2">
              <Forward size={18} className="text-primary" />
              <h3 className="font-display font-bold">Forward Message</h3>
            </div>
            <p className="mb-3 truncate rounded-2xl border border-white/10 bg-white/10 p-2 text-xs text-white/65 backdrop-blur-xl">"{forwardMsg}"</p>
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={forwardSearch} onChange={(e) => setForwardSearch(e.target.value)} placeholder="Search people to forward to..." className="h-10 border-white/15 bg-white/10 pl-10 text-white placeholder:text-white/50" autoFocus />
            </div>
            {!forwardSearch.trim() && forwardSuggestions.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-[11px] uppercase tracking-[0.25em] text-white/55">People you follow</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {forwardSuggestions.map((profile: { user_id: string; display_name: string | null; avatar_url: string | null; username: string | null }) => (
                    <button
                      key={profile.user_id}
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-2 text-left backdrop-blur-xl transition-colors hover:bg-white/10"
                      onClick={() => forwardToUser.mutate({ user_id: profile.user_id })}
                    >
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10">
                        {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : <User size={12} className="text-muted-foreground" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{profile.display_name || "Artist"}</p>
                        {profile.username && <p className="text-[11px] text-white/60">@{profile.username}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {forwardSearch.trim() ? forwardSearchResults.map((profile: { user_id: string; display_name: string | null; avatar_url: string | null; username: string | null }) => (
                <button
                  key={profile.user_id}
                  className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-2 text-left backdrop-blur-xl transition-colors hover:bg-white/10"
                  onClick={() => forwardToUser.mutate({ user_id: profile.user_id })}
                >
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10">
                    {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : <User size={12} className="text-muted-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{profile.display_name || "Artist"}</p>
                    {profile.username && <p className="text-[11px] text-white/60">@{profile.username}</p>}
                  </div>
                </button>
              )) : (
                <p className="py-4 text-center text-sm text-white/60">{forwardSuggestions.length ? "Tap a suggestion or search someone else." : "Search artists or start from your follow list."}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Message Info Dialog */}
        <Dialog open={!!msgInfoId} onOpenChange={() => setMsgInfoId(null)}>
          <DialogContent className="border-white/15 bg-white/10 text-white backdrop-blur-2xl sm:max-w-sm">
            <div className="flex items-center gap-2 mb-4">
              <Info size={18} className="text-primary" />
              <h3 className="font-display font-bold">Message Info</h3>
            </div>
            {msgInfoId && (() => {
              const msg = messages.find(m => m.id === msgInfoId);
              if (!msg) return null;
              return (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-sm backdrop-blur-xl">{msg.content}</div>
                  <div className="text-xs space-y-1 text-white/60">
                    <p>Sent: {new Date(msg.created_at).toLocaleString()}</p>
                    <p>From: {msg.sender_id === user!.id ? "You" : (localOtherUser?.profile?.display_name || "Artist")}</p>
                    <p>Status: Delivered ✓✓</p>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        <Dialog open={!!previewAttachment} onOpenChange={() => setPreviewAttachment(null)}>
          <DialogContent className="sm:max-w-3xl overflow-hidden border border-black/10 bg-transparent p-0 text-black shadow-none backdrop-blur-3xl dark:border-white/10 dark:text-white">
            {previewAttachment && (
              <div className="relative min-h-[72vh] p-3 text-black sm:p-5 dark:text-white">
                <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
                  <Button asChild size="sm" className="h-8 border border-black/10 bg-white/90 text-slate-950 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
                    <a href={previewAttachment.url} download>Download</a>
                  </Button>
                </div>

                <div className="flex min-h-[72vh] items-center justify-center">
                  {previewAttachment.kind === "audio" ? (
                    <div className="flex w-full max-w-xl flex-col items-center gap-5 rounded-[2rem] border border-black/10 bg-white/70 p-8 text-center shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl" />
                        <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-white/30 shadow-xl dark:border-white/20 dark:bg-white/15">
                          {previewAttachment.avatarUrl ? (
                            <img src={previewAttachment.avatarUrl} alt={previewAttachment.senderName || "Artist"} className="h-full w-full object-cover" />
                          ) : (
                            <User size={28} className="text-black/80 dark:text-white/80" />
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-black/70 dark:text-white/70">{previewAttachment.senderName || "Artist"}</p>
                        <p className="mt-1 text-xl font-semibold text-black dark:text-white">{previewAttachment.name || "Audio file"}</p>
                      </div>
                      <div className="flex items-end gap-1">
                        {[10, 16, 8, 20, 13, 24, 11, 22, 15, 18, 9, 26].map((height, index) => (
                          <motion.span
                            key={index}
                            animate={{ height: [height, height + 10, height - 2, height + 6] }}
                            transition={{
                              duration: 0.8 + (index % 3) * 0.08,
                              repeat: Infinity,
                              repeatType: "mirror",
                              ease: "easeInOut",
                              delay: index * 0.04,
                            }}
                            className="w-2 rounded-full bg-gradient-to-t from-cyan-400 via-fuchsia-400 to-emerald-300"
                            style={{ height }}
                          />
                        ))}
                      </div>
                        <audio controls autoPlay className="w-full rounded-2xl bg-white/10 dark:bg-white/10" src={previewAttachment.url} />
                      </div>
                    ) : previewAttachment.kind === "image" ? (
                      <img src={previewAttachment.url} alt={previewAttachment.name || "Attachment"} className="mx-auto max-h-[72vh] max-w-full rounded-[1.5rem] object-contain shadow-2xl ring-1 ring-white/10" />
                    ) : previewAttachment.kind === "video" ? (
                      <video controls className="mx-auto max-h-[72vh] w-full max-w-4xl rounded-[1.5rem] bg-black shadow-2xl ring-1 ring-white/10" src={previewAttachment.url} />
                    ) : previewAttachment.mime === "application/pdf" || previewAttachment.url.toLowerCase().includes(".pdf") ? (
                      <iframe src={previewAttachment.url} title={previewAttachment.name || "PDF preview"} className="h-[72vh] w-full rounded-[1.5rem] border border-white/10 bg-white shadow-2xl" />
                    ) : (
                    <div className="flex w-full max-w-xl flex-col items-center gap-4 rounded-[2rem] border border-black/10 bg-white/70 p-8 text-center shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-black/10 bg-white/30 text-black shadow-xl dark:border-white/20 dark:bg-white/15 dark:text-white">
                        <Paperclip size={28} />
                      </div>
                      <div>
                        <p className="font-semibold text-black dark:text-white">{previewAttachment.name || "File preview unavailable"}</p>
                        <p className="mt-1 text-sm text-black/70 dark:text-white/70">Download this file.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent className="border-white/15 bg-white/10 text-white backdrop-blur-2xl sm:max-w-md">
            <div className="mb-4">
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/55">Delete message</p>
              <h3 className="font-display text-xl font-bold">Choose how to remove it</h3>
            </div>
            <div className="space-y-3">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => {
                  if (!deleteTarget) return;
                  hideMessageForMe.mutate(deleteTarget.id);
                  setDeleteTarget(null);
                }}
              >
                Delete for me
              </Button>
              {deleteTarget?.isMine && (
                <Button
                  className="w-full justify-start"
                  variant="destructive"
                  onClick={() => {
                    if (!deleteTarget) return;
                    deleteMessageForEveryone.mutate(deleteTarget.id);
                    setDeleteTarget(null);
                  }}
                >
                  Delete for everyone
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!incomingPendingCall}
          onOpenChange={(open) => {
            if (!open && incomingPendingCall) {
              declineCallSession.mutate(incomingPendingCall.id);
            }
          }}
        >
          <DialogContent className="border-white/15 bg-white/10 text-white backdrop-blur-2xl sm:max-w-md">
            <div className="mb-4">
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/55">Incoming call</p>
              <h3 className="font-display text-xl font-bold">
                {incomingPendingCall?.mode === "video" ? "Video call" : "Voice call"} from {localOtherUser?.profile?.display_name || "Artist"}
              </h3>
            </div>
            <div className="mb-4 rounded-2xl border border-white/10 bg-white/10 p-3 text-sm backdrop-blur-xl">
              <p className="text-xs text-white/60">Call type</p>
              <p className="mt-1 text-base font-semibold capitalize">{incomingPendingCall?.mode === "video" ? "📹 Video call" : "🎧 Voice call"}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => incomingPendingCall && declineCallSession.mutate(incomingPendingCall.id)}>
                Decline
              </Button>
              <Button
                variant="hero"
                className="flex-1"
                onClick={() => incomingPendingCall && acceptCallSession.mutate(incomingPendingCall.id)}
                disabled={callAccepting}
              >
                {callAccepting ? "Connecting..." : "Accept"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={callRoomOpen && !!currentCallSession} onOpenChange={(open) => { if (!open) setCallRoomOpen(false); }}>
          <DialogContent className="sm:max-w-6xl overflow-hidden border-white/15 bg-white/10 p-0 text-white backdrop-blur-2xl shadow-2xl">
            {currentCallSession && (
              <div className="bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_38%),linear-gradient(180deg,rgba(15,23,42,0.22),rgba(15,23,42,0.52))]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-white/55">Live call</p>
                    <h3 className="font-display text-lg font-bold">{currentCallSession.mode === "video" ? "Video room" : "Voice room"}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {currentCallSession.burst_emojis.slice(0, 3).map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm transition-all hover:bg-white/20"
                        onClick={() => toast.message(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                    <Button
                      variant={isMicMuted ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => {
                        const audioTrack = localMediaStreamRef.current?.getAudioTracks()[0];
                        if (audioTrack) audioTrack.enabled = !audioTrack.enabled;
                        setIsMicMuted(!isMicMuted);
                      }}
                    >
                      <Volume2 size={14} className="mr-1" /> {isMicMuted ? "Unmute" : "Mute"}
                    </Button>
                    {currentCallSession.mode === "video" && (
                      <Button
                        variant={isCameraOff ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => {
                          const videoTrack = localMediaStreamRef.current?.getVideoTracks()[0];
                          if (videoTrack) videoTrack.enabled = !videoTrack.enabled;
                          setIsCameraOff((value) => !value);
                        }}
                      >
                        {isCameraOff ? <VideoOff size={14} className="mr-1" /> : <Video size={14} className="mr-1" />}
                        {isCameraOff ? "Camera on" : "Camera off"}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setCallRoomOpen(false)}>
                      <Minimize2 size={14} className="mr-1" /> Minimize
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => endCallSession.mutate(currentCallSession.id)}>
                      End
                    </Button>
                  </div>
                </div>

                <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
                  <div className="relative min-h-[520px] overflow-hidden p-4">
                    {currentCallSession.mode === "video" ? (
                      <div className="grid h-full grid-rows-[minmax(0,1fr)_auto] gap-4">
                        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-2xl backdrop-blur-2xl">
                          <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
                          <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white backdrop-blur-xl">Remote video</div>
                          <div className="absolute bottom-4 right-4 overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-xl backdrop-blur-2xl">
                            <video ref={localVideoRef} autoPlay muted playsInline className="h-40 w-28 object-cover opacity-90" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur-2xl">
                            <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">Your room</p>
                            <div className="mt-3 flex items-center gap-3">
                              <div className="h-12 w-12 overflow-hidden rounded-full bg-white/10 ring-2 ring-white/10">
                                {user?.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} alt="" className="h-full w-full object-cover" /> : <User size={18} className="m-3 text-white/70" />}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-semibold">{user?.user_metadata?.full_name || "You"}</p>
                                <p className="text-xs text-white/60">{isMicMuted ? "Mic muted" : "Mic live"}</p>
                              </div>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur-2xl">
                            <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">Shared actions</p>
                            <div className="mt-3 flex items-center gap-2">
                              {[["Mute", isMicMuted], ["Camera", isCameraOff], ["Invite", false]].map(([label, active]: [string, boolean], idx) => (
                                <span key={idx} className={`rounded-full px-3 py-1 text-xs ${active ? "bg-primary text-primary-foreground" : "bg-white/10 text-white/80"}`}>
                                  {label}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-6 rounded-3xl border border-white/15 bg-white/10 p-6 text-white shadow-2xl backdrop-blur-2xl">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-cyan-400/15 blur-3xl" />
                          <div className="relative flex h-36 w-36 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur-2xl">
                            {localOtherUser?.profile?.avatar_url ? (
                              <img src={otherUser.profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                            ) : (
                              <User size={44} className="text-white/80" />
                            )}
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">Voice call</p>
                          <h4 className="mt-2 text-2xl font-bold">{localOtherUser?.profile?.display_name || "Artist"}</h4>
                          <p className="mt-1 text-sm text-white/60">{isMicMuted ? "You are muted" : "You are speaking"} with live wave feedback</p>
                        </div>
                        <div className="flex items-end gap-1">
                          {[12, 22, 16, 28, 14, 20, 10, 24, 18, 26, 12, 30].map((height, index) => (
                            <motion.div
                              key={index}
                              animate={isMicMuted ? { height: 8, opacity: 0.35 } : { height: [height, height + 16, height - 3, height + 8] }}
                              transition={{
                                duration: 0.85 + (index % 4) * 0.08,
                                repeat: isMicMuted ? 0 : Infinity,
                                repeatType: "mirror",
                                ease: "easeInOut",
                                delay: index * 0.04,
                              }}
                              className="w-2 rounded-full bg-gradient-to-t from-cyan-400 via-fuchsia-400 to-emerald-300"
                              style={{ height }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-white/10 bg-white/5 p-4 lg:border-l lg:border-t-0 backdrop-blur-2xl">
                    <div className="flex h-full flex-col gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-xl">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-white/55">Participant</p>
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10">
                            {localOtherUser?.profile?.avatar_url ? <img src={localOtherUser.profile.avatar_url} alt="" className="h-full w-full object-cover" /> : <User size={14} className="text-muted-foreground" />}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{localOtherUser?.profile?.display_name || "Artist"}</p>
                            <p className="text-xs text-white/60">{currentCallSession.mode === "video" ? "Video call" : "Voice call"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-xl">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-white/55">Quality</p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex h-2 flex-1 gap-0.5 overflow-hidden rounded-full bg-white/10">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className={`flex-1 rounded-full ${i < 4 ? "bg-green-500" : "bg-white/20"}`} />
                            ))}
                          </div>
                          <span className="text-xs text-white/60">Strong</span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-xl">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-white/55">Your status</p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-xs font-medium">{isMicMuted ? "Muted" : "Connected"}</span>
                        </div>
                      </div>

                      <div className="relative">
                        <Button variant="outline" className="w-full rounded-2xl border border-white/15 bg-white/10 text-white hover:bg-white/20" onClick={() => setShowAddUserMenu((value) => !value)}>
                          <UserPlus size={14} className="mr-2" /> Add user
                        </Button>
                        {showAddUserMenu && (
                          <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-xl border border-white/15 bg-black/80 p-2 backdrop-blur-xl">
                            <Input
                              value={callAddUserSearch}
                              onChange={(e) => setCallAddUserSearch(e.target.value)}
                              placeholder="Search to add user..."
                              className="h-8"
                            />
                            <div className="max-h-40 overflow-y-auto mt-2">
                              {callUserSuggestions.length ? callUserSuggestions.map((profile) => (
                                <button
                                  key={profile.user_id}
                                  type="button"
                                  onClick={() => {
                                    toast.success(`Invite sent to ${profile.display_name || profile.username || "artist"}`);
                                    setShowAddUserMenu(false);
                                    setCallAddUserSearch("");
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm hover:bg-white/10"
                                >
                                  <div className="h-6 w-6 rounded-full bg-white/10">
                                    {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : <User size={12} className="m-1" />}
                                  </div>
                                  <div className="flex-1 truncate">
                                    {profile.display_name || profile.username || "Artist"}
                                    <p className="text-[10px] text-white/60">{profile.username ? `@${profile.username}` : ""}</p>
                                  </div>
                                  <span className="text-xs text-white/60">Add</span>
                                </button>
                              )) : (
                                <p className="text-xs text-white/60 p-2">No suggestions yet.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showCallSheet} onOpenChange={setShowCallSheet}>
          <DialogContent className="border-white/15 bg-white/10 text-white backdrop-blur-2xl sm:max-w-md">
            <div className="mb-4">
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/55">Call studio</p>
              <h3 className="font-display text-xl font-bold">{callMode === "video" ? "Video call setup" : "Voice call setup"}</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCallMode("voice")}
                  className={`rounded-2xl border p-3 text-left transition-all ${callMode === "voice" ? "border-white/20 bg-white/15" : "border-white/10 bg-white/5"}`}
                >
                  <Phone size={18} className="mb-2 text-primary" />
                  <p className="font-semibold">Voice</p>
                  <p className="text-xs text-white/60">Audio room</p>
                </button>
                <button
                  type="button"
                  onClick={() => setCallMode("video")}
                  className={`rounded-2xl border p-3 text-left transition-all ${callMode === "video" ? "border-white/20 bg-white/15" : "border-white/10 bg-white/5"}`}
                >
                  <Video size={18} className="mb-2 text-primary" />
                  <p className="font-semibold">Video</p>
                  <p className="text-xs text-white/60">Face-to-face</p>
                </button>
              </div>
              <Button
                className="w-full"
                variant="hero"
                onClick={() => {
                  const recipient = localOtherUser;
                  if (!activeConvo || !recipient) {
                    toast.error("Please open a conversation first");
                    return;
                  }
                  if (!callMode) setCallMode("voice");
                  startCallInvite.mutate({ conversationId: activeConvo, recipient });
                }}
                disabled={!activeConvo || !localOtherUser}
              >
                Start call now
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ======================== NEW CHAT ========================
  if (showNewChat) {
    return (
      <div className="p-6 md:p-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setShowNewChat(false); setSearchUsers(""); }}>
            <ArrowLeft size={16} />
          </Button>
          <h1 className="font-display text-xl font-bold">New Message</h1>
        </div>
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or username..." className="pl-10 h-11" value={searchUsers} onChange={e => setSearchUsers(e.target.value)} autoFocus />
        </div>
        <div className="space-y-1">
          {!debouncedSearchUsers ? (
            <>
              <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Active now</p>
              {activeChatSuggestions.map(profile => (
                <motion.button
                  key={profile.user_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => startConversation.mutate(profile.user_id)}
                  disabled={startConversation.isPending}
                >
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                    {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={16} className="text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{profile.display_name || "Artist"}</p>
                    {profile.username && <p className="text-[11px] text-muted-foreground">@{profile.username}</p>}
                  </div>
                  {startConversation.isPending ? (
                    <div className="h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  ) : (
                    <MessageCircle size={16} className="text-muted-foreground" />
                  )}
                </motion.button>
              ))}
              {!activeChatSuggestions.length && (
                <p className="text-sm text-muted-foreground text-center py-8">No active artists right now. Start typing to search everyone else.</p>
              )}
            </>
          ) : (
            <>
              {searchResults.map(profile => (
                <motion.button
                  key={profile.user_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => startConversation.mutate(profile.user_id)}
                  disabled={startConversation.isPending}
                >
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                    {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={16} className="text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{profile.display_name || "Artist"}</p>
                    {profile.username && <p className="text-[11px] text-muted-foreground">@{profile.username}</p>}
                  </div>
                  {startConversation.isPending ? (
                    <div className="h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  ) : (
                    <MessageCircle size={16} className="text-muted-foreground" />
                  )}
                </motion.button>
              ))}
              {debouncedSearchUsers.length > 1 && searchResults.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No active artists found</p>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ======================== CONVERSATION LIST ========================
  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">
            Messages<span className="text-primary">.</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Connect and collaborate with other artists.</p>
        </div>
        <Button variant="hero" size="sm" onClick={() => setShowNewChat(true)}>
          <Plus size={16} /> New Chat
        </Button>
      </div>

      {/* Search & Archive toggle */}
      <div className="flex gap-2 mb-4">
        {conversations.length > 0 && (
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search conversations..." className="pl-10 h-10" value={searchConvos} onChange={e => setSearchConvos(e.target.value)} />
          </div>
        )}
        {archivedConvos.size > 0 && (
          <Button variant={showArchived ? "secondary" : "outline"} size="sm" className="h-10 shrink-0" onClick={() => setShowArchived(!showArchived)}>
            <Archive size={14} className="mr-1" /> {showArchived ? "Inbox" : `Archived (${archivedConvos.size})`}
          </Button>
        )}
      </div>

      {convoLoading ? (
        <LoadingList count={5} />
      ) : filteredConversations.length > 0 ? (
        <div className="space-y-1">
          {filteredConversations.map((convo, idx) => {
            const other = convo.participants[0];
            const isLastSenderMe = convo.lastMessage?.sender_id === user!.id;
            const isMuted = mutedConvos.has(convo.id);
            return (
              <motion.div key={convo.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-all group"
              >
                <button className="flex items-center gap-3 flex-1 text-left min-w-0" onClick={() => setActiveConvo(convo.id)}>
                  <div className="relative w-11 h-11 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                    {other?.profile?.avatar_url ? (
                      <img src={other.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={18} className="text-muted-foreground" />
                    )}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{other?.profile?.display_name || "Artist"}</p>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {isMuted && <BellOff size={10} className="text-muted-foreground" />}
                        {convo.lastMessage && <span className="text-[10px] text-muted-foreground">{formatTime(convo.lastMessage.created_at)}</span>}
                      </div>
                    </div>
                    {convo.lastMessage && (
                      <p className="text-xs text-muted-foreground truncate">
                        {isLastSenderMe && <span className="text-primary">You: </span>}
                        {convo.lastMessage.content}
                      </p>
                    )}
                  </div>
                </button>
                {/* Quick actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <MoreVertical size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toggleMute(convo.id)}>
                      {isMuted ? <Bell size={12} className="mr-2" /> : <BellOff size={12} className="mr-2" />}
                      {isMuted ? "Unmute" : "Mute"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleArchive(convo.id)}>
                      <Archive size={12} className="mr-2" /> {archivedConvos.has(convo.id) ? "Unarchive" : "Archive"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => deleteConversation.mutate(convo.id)}>
                      <Trash2 size={12} className="mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="border-border/50 border-dashed">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <MessageCircle size={28} className="text-accent" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground mb-1">{showArchived ? "No archived chats" : "No messages yet"}</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              {showArchived ? "Archived conversations will appear here." : "Start a conversation by finding artists to collaborate with."}
            </p>
            {!showArchived && (
              <Button variant="hero" size="sm" onClick={() => setShowNewChat(true)}>
                <Plus size={16} /> Start Chatting
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
