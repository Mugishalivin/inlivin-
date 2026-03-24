import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
  MoreVertical, Paperclip, Trash2, Image as ImageIcon, Check, CheckCheck,
  Copy, Reply, Forward, Pin, Star, StarOff, Edit2, X, Mic, MicOff,
  SmilePlus, Archive, BellOff, Bell, Info, Heart, ThumbsUp, Laugh, Flame as Fire, Hand,
  ZoomIn
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

export default function MessagesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchUsers, setSearchUsers] = useState("");
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
  const [isTyping, setIsTyping] = useState(false);
  const [mutedConvos, setMutedConvos] = useState<Set<string>>(new Set());
  const [archivedConvos, setArchivedConvos] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [msgInfoId, setMsgInfoId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
            .eq("conversation_id", mc.conversation_id).eq("user_id", otherUserId).single();
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
  }, [chatWithUserId, user]);

  // Fetch conversations
  const { data: conversations = [], isLoading: convoLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data: participations } = await supabase
        .from("conversation_participants").select("conversation_id").eq("user_id", user!.id);
      if (!participations?.length) return [];
      const convoIds = participations.map(p => p.conversation_id);
      const { data: convos } = await supabase.from("conversations").select("*").in("id", convoIds).order("updated_at", { ascending: false });
      const result: ConversationWithDetails[] = [];
      for (const convo of convos ?? []) {
        const { data: parts } = await supabase.from("conversation_participants").select("user_id").eq("conversation_id", convo.id).neq("user_id", user!.id);
        const participants = [];
        for (const p of parts ?? []) {
          const { data: prof } = await supabase.from("profiles").select("display_name, avatar_url, username").eq("user_id", p.user_id).single();
          participants.push({ user_id: p.user_id, profile: prof || { display_name: null, avatar_url: null, username: null } });
        }
        const { data: lastMsg } = await supabase.from("messages").select("content, created_at, sender_id").eq("conversation_id", convo.id).order("created_at", { ascending: false }).limit(1).single();
        result.push({ ...convo, participants, lastMessage: lastMsg || undefined });
      }
      return result;
    },
    enabled: !!user,
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

  // Search users
  const { data: searchResults = [] } = useQuery({
    queryKey: ["search-users-chat", searchUsers],
    queryFn: async () => {
      if (!searchUsers.trim()) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("user_id", user!.id)
        .or(`display_name.ilike.%${searchUsers}%,username.ilike.%${searchUsers}%`)
        .limit(10);
      if (error) {
        console.error("Search error:", error);
        return [];
      }
      return data ?? [];
    },
    enabled: !!user && searchUsers.length > 1,
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Typing indicator simulation
  const simulateTyping = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);
    // In a real app, you'd broadcast typing via realtime channel
  }, []);

  const handleInputChange = (val: string) => {
    setMessageText(val);
    // Simulate showing typing to other user (visual only for demo)
  };

  // Send message
  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!activeConvo) return;
      let content = messageText.trim();
      if (attachFile) {
        const ext = attachFile.name.split(".").pop();
        const path = `messages/${user!.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("project-files").upload(path, attachFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(path);
        content = content ? `${content}\n📎 ${urlData.publicUrl}` : `📎 ${urlData.publicUrl}`;
      }
      if (replyTo) {
        content = `↩️ ${replyTo.content.slice(0, 50)}${replyTo.content.length > 50 ? "..." : ""}\n\n${content}`;
      }
      if (!content) return;
      const { error } = await supabase.from("messages").insert({ conversation_id: activeConvo, sender_id: user!.id, content });
      if (error) throw error;
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", activeConvo);
    },
    onSuccess: () => {
      setMessageText("");
      setAttachFile(null);
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: ["messages", activeConvo] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Delete message
  const deleteMessage = useMutation({
    mutationFn: async (msgId: string) => {
      const { error } = await supabase.from("messages").delete().eq("id", msgId).eq("sender_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", activeConvo] });
      toast.success("Message deleted");
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

  // Forward message
  const forwardMessage = useMutation({
    mutationFn: async ({ convoId, content }: { convoId: string; content: string }) => {
      const { error } = await supabase.from("messages").insert({
        conversation_id: convoId, sender_id: user!.id, content: `⤳ Forwarded:\n${content}`,
      });
      if (error) throw error;
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convoId);
    },
    onSuccess: () => {
      setForwardMsg(null);
      toast.success("Message forwarded");
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
  const isLinkUrl = (text: string) => /^https?:\/\/[^\s]+$/i.test(text);

  const addReaction = (msgId: string, emoji: string) => {
    setReactions(prev => {
      const existing = prev[msgId] || [];
      if (existing.includes(emoji)) return { ...prev, [msgId]: existing.filter(e => e !== emoji) };
      return { ...prev, [msgId]: [...existing, emoji] };
    });
    setShowEmojiFor(null);
  };

  const toggleStar = (msgId: string) => {
    setStarredMsgs(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId); else next.add(msgId);
      return next;
    });
  };

  const toggleMute = (convoId: string) => {
    setMutedConvos(prev => {
      const next = new Set(prev);
      if (next.has(convoId)) { next.delete(convoId); toast.success("Unmuted"); }
      else { next.add(convoId); toast.success("Muted"); }
      return next;
    });
  };

  const toggleArchive = (convoId: string) => {
    setArchivedConvos(prev => {
      const next = new Set(prev);
      if (next.has(convoId)) { next.delete(convoId); toast.success("Unarchived"); }
      else { next.add(convoId); toast.success("Archived"); }
      return next;
    });
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const renderMessageContent = (content: string) => {
    const parts = content.split('\n');
    return parts.map((part, i) => {
      if (part.startsWith('📎 ')) {
        const url = part.replace('📎 ', '');
        if (isImageUrl(url)) {
          return <img key={i} src={url} alt="attachment" className="max-w-[200px] rounded-lg mt-1 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setImagePreview(url)} />;
        }
        return <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="underline text-xs opacity-80 block">📎 Attachment</a>;
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
      return <span key={i}>{part}{i < parts.length - 1 && <br />}</span>;
    });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: Record<string, typeof messages>, msg) => {
    const date = new Date(msg.created_at).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  // Filter messages by search
  const filteredGroupedMessages: Record<string, typeof messages> = showChatSearch && searchInChat.trim()
    ? Object.fromEntries(
        Object.entries(groupedMessages).map(([date, msgs]) => [
          date,
          msgs.filter(m => m.content.toLowerCase().includes(searchInChat.toLowerCase()))
        ]).filter(([, msgs]) => (msgs as any[]).length > 0)
      ) as Record<string, typeof messages>
    : groupedMessages;

  const pinnedMessages = messages.filter(m => starredMsgs.has(m.id));

  const filteredConversations = conversations.filter(c => {
    if (archivedConvos.has(c.id) && !showArchived) return false;
    if (showArchived && !archivedConvos.has(c.id)) return false;
    if (!searchConvos.trim()) return true;
    const name = c.participants[0]?.profile?.display_name || "";
    const uname = c.participants[0]?.profile?.username || "";
    return name.toLowerCase().includes(searchConvos.toLowerCase()) || uname.toLowerCase().includes(searchConvos.toLowerCase());
  });

  // ======================== CHAT VIEW ========================
  if (activeConvo) {
    const convo = conversations.find(c => c.id === activeConvo);
    const otherUser = convo?.participants?.[0];
    const isMuted = mutedConvos.has(activeConvo);

    return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-card/50 backdrop-blur-sm">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveConvo(null)}>
            <ArrowLeft size={16} />
          </Button>
          <Link to={`/profile/${otherUser?.user_id}`} className="relative w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
            {otherUser?.profile?.avatar_url ? (
              <img src={otherUser.profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={16} className="text-muted-foreground" />
            )}
            {/* Online indicator */}
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
          </Link>
          <div className="flex-1">
            <Link to={`/profile/${otherUser?.user_id}`} className="font-display font-bold text-sm hover:text-primary transition-colors">{otherUser?.profile?.display_name || "Artist"}</Link>
            <p className="text-[10px] text-green-500 font-medium">Online</p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowChatSearch(!showChatSearch)}>
              <Search size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info("Voice call coming soon!")}>
              <Phone size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info("Video call coming soon!")}>
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
          <div className="px-4 py-1.5 bg-secondary/50 flex items-center gap-2 text-xs text-muted-foreground">
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
                    <span className="text-[10px] px-3 py-1 rounded-full bg-secondary text-muted-foreground">{date}</span>
                  </div>
                  <AnimatePresence>
                    {msgs.map((msg, idx) => {
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
                            <Link to={`/profile/${otherUser?.user_id}`} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center overflow-hidden mr-2 mt-1 shrink-0">
                              {otherUser?.profile?.avatar_url ? (
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
                              <button className="p-1 rounded hover:bg-secondary" onClick={() => setShowEmojiFor(showEmojiFor === msg.id ? null : msg.id)}>
                                <SmilePlus size={12} className="text-muted-foreground" />
                              </button>
                              <button className="p-1 rounded hover:bg-secondary" onClick={() => setReplyTo({ id: msg.id, content: msg.content, sender: isMe ? "You" : (otherUser?.profile?.display_name || "Artist") })}>
                                <Reply size={12} className="text-muted-foreground" />
                              </button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1 rounded hover:bg-secondary"><MoreVertical size={12} className="text-muted-foreground" /></button>
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
                                      <DropdownMenuItem className="text-destructive" onClick={() => deleteMessage.mutate(msg.id)}>
                                        <Trash2 size={12} className="mr-2" /> Delete
                                      </DropdownMenuItem>
                                    </>
                                  )}
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
                                  className={`absolute ${isMe ? "right-0" : "left-0"} -top-10 flex gap-1 bg-card border border-border rounded-full px-2 py-1 shadow-lg z-20`}
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
                              <div className={`px-3.5 py-2 rounded-2xl text-sm ${
                                isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary text-secondary-foreground rounded-bl-md"
                              }`}>
                                <div>{renderMessageContent(msg.content)}</div>
                                <div className="flex items-center gap-1 justify-end mt-0.5">
                                  <p className={`text-[10px] ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                                    {formatTime(msg.created_at)}
                                  </p>
                                  {isMe && <CheckCheck size={12} className="text-primary-foreground/60" />}
                                </div>
                              </div>
                            )}

                            {/* Reactions */}
                            {msgReactions.length > 0 && (
                              <div className={`flex gap-0.5 mt-0.5 ${isMe ? "justify-end" : "justify-start"}`}>
                                {msgReactions.map((emoji, i) => (
                                  <span key={i} className="text-xs bg-secondary/80 rounded-full px-1.5 py-0.5 cursor-pointer hover:bg-secondary" onClick={() => addReaction(msg.id, emoji)}>
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
              <div className="px-4 py-2 bg-secondary/50 flex items-center gap-2 text-sm border-t border-border">
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

        {/* Attach preview */}
        {attachFile && (
          <div className="px-4 py-2 bg-secondary/50 flex items-center gap-2 text-sm">
            <Paperclip size={14} className="text-muted-foreground" />
            <span className="truncate flex-1">{attachFile.name}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAttachFile(null)}>×</Button>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border bg-card/30">
          <form className="flex gap-2 items-end" onSubmit={e => { e.preventDefault(); sendMessage.mutate(); }}>
            <label className="cursor-pointer">
              <Paperclip size={18} className="text-muted-foreground hover:text-foreground transition-colors mt-2.5" />
              <input type="file" className="hidden" onChange={e => setAttachFile(e.target.files?.[0] || null)} />
            </label>
            <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => {
              setIsRecording(!isRecording);
              if (!isRecording) toast.info("Voice messages coming soon!");
            }}>
              {isRecording ? <MicOff size={18} className="text-destructive" /> : <Mic size={18} className="text-muted-foreground" />}
            </Button>
            <Input
              ref={inputRef}
              value={messageText}
              onChange={e => handleInputChange(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 h-11"
            />
            <Button variant="hero" size="icon" className="h-11 w-11 shrink-0" type="submit" disabled={!messageText.trim() && !attachFile}>
              <Send size={16} />
            </Button>
          </form>
        </div>

        {/* Image Preview Modal */}
        <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
          <DialogContent className="sm:max-w-3xl p-0 bg-black/90 border-none">
            {imagePreview && (
              <div className="flex items-center justify-center min-h-[50vh]">
                <img src={imagePreview} alt="" className="max-w-full max-h-[80vh] object-contain" />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Starred Messages Dialog */}
        <Dialog open={pinnedOpen} onOpenChange={setPinnedOpen}>
          <DialogContent className="sm:max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <Star size={18} className="text-yellow-500" />
              <h3 className="font-display font-bold">Starred Messages</h3>
            </div>
            {pinnedMessages.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pinnedMessages.map(msg => (
                  <div key={msg.id} className="p-3 rounded-lg bg-secondary/50 text-sm">
                    <p>{msg.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(msg.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No starred messages</p>
            )}
          </DialogContent>
        </Dialog>

        {/* Forward Dialog */}
        <Dialog open={!!forwardMsg} onOpenChange={() => setForwardMsg(null)}>
          <DialogContent className="sm:max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <Forward size={18} className="text-primary" />
              <h3 className="font-display font-bold">Forward Message</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3 p-2 bg-secondary/50 rounded-lg truncate">"{forwardMsg}"</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {conversations.filter(c => c.id !== activeConvo).map(c => {
                const other = c.participants[0];
                return (
                  <button
                    key={c.id}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 text-left text-sm"
                    onClick={() => forwardMessage.mutate({ convoId: c.id, content: forwardMsg! })}
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                      {other?.profile?.avatar_url ? <img src={other.profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={12} className="text-muted-foreground" />}
                    </div>
                    <span>{other?.profile?.display_name || "Artist"}</span>
                  </button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        {/* Message Info Dialog */}
        <Dialog open={!!msgInfoId} onOpenChange={() => setMsgInfoId(null)}>
          <DialogContent className="sm:max-w-sm">
            <div className="flex items-center gap-2 mb-4">
              <Info size={18} className="text-primary" />
              <h3 className="font-display font-bold">Message Info</h3>
            </div>
            {msgInfoId && (() => {
              const msg = messages.find(m => m.id === msgInfoId);
              if (!msg) return null;
              return (
                <div className="space-y-3">
                  <div className="p-3 bg-secondary/50 rounded-lg text-sm">{msg.content}</div>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <p>Sent: {new Date(msg.created_at).toLocaleString()}</p>
                    <p>From: {msg.sender_id === user!.id ? "You" : (otherUser?.profile?.display_name || "Artist")}</p>
                    <p>Status: Delivered ✓✓</p>
                  </div>
                </div>
              );
            })()}
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
          {searchResults.map(profile => (
            <motion.button
              key={profile.id}
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
          {searchUsers.length > 1 && searchResults.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No artists found</p>
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
