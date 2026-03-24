import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingList, LoadingChat } from "@/components/LoadingSkeletons";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, Search, Send, User, ArrowLeft, Plus, Phone, Video,
  MoreVertical, Smile, Paperclip, Trash2, Image as ImageIcon, Check, CheckCheck
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface ConversationWithDetails {
  id: string;
  updated_at: string;
  participants: { user_id: string; profile: { display_name: string | null; avatar_url: string | null; username: string | null } }[];
  lastMessage?: { content: string; created_at: string; sender_id: string };
}

export default function MessagesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchUsers, setSearchUsers] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchConvos, setSearchConvos] = useState("");
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch conversations
  const { data: conversations = [], isLoading: convoLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data: participations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user!.id);

      if (!participations?.length) return [];

      const convoIds = participations.map(p => p.conversation_id);
      const { data: convos } = await supabase
        .from("conversations")
        .select("*")
        .in("id", convoIds)
        .order("updated_at", { ascending: false });

      const result: ConversationWithDetails[] = [];
      for (const convo of convos ?? []) {
        const { data: parts } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", convo.id)
          .neq("user_id", user!.id);

        const participants = [];
        for (const p of parts ?? []) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("display_name, avatar_url, username")
            .eq("user_id", p.user_id)
            .single();
          participants.push({ user_id: p.user_id, profile: prof || { display_name: null, avatar_url: null, username: null } });
        }

        const { data: lastMsg } = await supabase
          .from("messages")
          .select("content, created_at, sender_id")
          .eq("conversation_id", convo.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        result.push({ ...convo, participants, lastMessage: lastMsg || undefined });
      }
      return result;
    },
    enabled: !!user,
  });

  // Fetch messages for active conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", activeConvo],
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeConvo!)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
    enabled: !!activeConvo,
  });

  // Search users for new chat
  const { data: searchResults = [] } = useQuery({
    queryKey: ["search-users-chat", searchUsers],
    queryFn: async () => {
      if (!searchUsers.trim()) return [];
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .neq("user_id", user!.id)
        .or(`display_name.ilike.%${searchUsers}%,username.ilike.%${searchUsers}%`)
        .limit(10);
      return data ?? [];
    },
    enabled: !!user && searchUsers.length > 1,
  });

  // Real-time messages
  useEffect(() => {
    if (!activeConvo) return;
    const channel = supabase
      .channel(`messages-${activeConvo}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeConvo}` },
        () => queryClient.invalidateQueries({ queryKey: ["messages", activeConvo] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConvo, queryClient]);

  // Real-time conversation list updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("conversations-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" },
        () => queryClient.invalidateQueries({ queryKey: ["conversations"] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!activeConvo) return;

      let content = messageText.trim();

      // Handle file attachment
      if (attachFile) {
        const ext = attachFile.name.split(".").pop();
        const path = `messages/${user!.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("project-files")
          .upload(path, attachFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(path);
        content = content ? `${content}\n📎 ${urlData.publicUrl}` : `📎 ${urlData.publicUrl}`;
      }

      if (!content) return;

      const { error } = await supabase.from("messages").insert({
        conversation_id: activeConvo,
        sender_id: user!.id,
        content,
      });
      if (error) throw error;
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", activeConvo);
    },
    onSuccess: () => {
      setMessageText("");
      setAttachFile(null);
      queryClient.invalidateQueries({ queryKey: ["messages", activeConvo] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteConversation = useMutation({
    mutationFn: async (convoId: string) => {
      // Remove self from participants (effectively "deletes" the convo for this user)
      // Note: We can't actually delete due to RLS, so we leave the conversation
      const { error } = await supabase.from("conversation_participants")
        .delete()
        .eq("conversation_id", convoId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setActiveConvo(null);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Conversation removed");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const startConversation = useMutation({
    mutationFn: async (otherUserId: string) => {
      const { data: myConvos } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user!.id);

      if (myConvos?.length) {
        for (const mc of myConvos) {
          const { data: otherPart } = await supabase
            .from("conversation_participants")
            .select("id")
            .eq("conversation_id", mc.conversation_id)
            .eq("user_id", otherUserId)
            .single();
          if (otherPart) return mc.conversation_id;
        }
      }

      const { data: convo, error: convoErr } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();
      if (convoErr) throw convoErr;

      // Insert participants one at a time to avoid RLS issues
      const { error: selfErr } = await supabase
        .from("conversation_participants")
        .insert({ conversation_id: convo.id, user_id: user!.id });
      if (selfErr) throw selfErr;

      const { error: otherErr } = await supabase
        .from("conversation_participants")
        .insert({ conversation_id: convo.id, user_id: otherUserId });
      if (otherErr) throw otherErr;

      return convo.id;
    },
    onSuccess: (convoId) => {
      setActiveConvo(convoId);
      setShowNewChat(false);
      setSearchUsers("");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err: any) => toast.error(err.message),
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

  const isImageUrl = (text: string) => {
    return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(text);
  };

  const renderMessageContent = (content: string) => {
    const parts = content.split('\n');
    return parts.map((part, i) => {
      if (part.startsWith('📎 ')) {
        const url = part.replace('📎 ', '');
        if (isImageUrl(url)) {
          return <img key={i} src={url} alt="attachment" className="max-w-[200px] rounded-lg mt-1 cursor-pointer" onClick={() => window.open(url, '_blank')} />;
        }
        return <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="underline text-xs opacity-80 block">📎 Attachment</a>;
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

  const filteredConversations = conversations.filter(c => {
    if (!searchConvos.trim()) return true;
    const name = c.participants[0]?.profile?.display_name || "";
    const uname = c.participants[0]?.profile?.username || "";
    return name.toLowerCase().includes(searchConvos.toLowerCase()) || uname.toLowerCase().includes(searchConvos.toLowerCase());
  });

  // Chat view
  if (activeConvo) {
    const convo = conversations.find(c => c.id === activeConvo);
    const otherUser = convo?.participants?.[0];

    return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border bg-card/50 backdrop-blur-sm">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveConvo(null)}>
            <ArrowLeft size={16} />
          </Button>
          <Link to={`/profile/${otherUser?.user_id}`} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
            {otherUser?.profile?.avatar_url ? (
              <img src={otherUser.profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={16} className="text-muted-foreground" />
            )}
          </Link>
          <div className="flex-1">
            <Link to={`/profile/${otherUser?.user_id}`} className="font-display font-bold text-sm hover:text-primary transition-colors">{otherUser?.profile?.display_name || "Artist"}</Link>
            {otherUser?.profile?.username && (
              <p className="text-[11px] text-muted-foreground">@{otherUser.profile.username}</p>
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info("Voice call coming soon!")}>
              <Phone size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info("Video call coming soon!")}>
              <Video size={16} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-destructive" onClick={() => deleteConversation.mutate(activeConvo)}>
                  <Trash2 size={14} className="mr-2" /> Delete Chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {messagesLoading ? (
            <LoadingChat count={4} />
          ) : (
            <>
              {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex justify-center my-4">
                <span className="text-[10px] px-3 py-1 rounded-full bg-secondary text-muted-foreground">{date}</span>
              </div>
              <AnimatePresence>
                {msgs.map((msg, idx) => {
                  const isMe = msg.sender_id === user!.id;
                  const showAvatar = idx === 0 || msgs[idx - 1]?.sender_id !== msg.sender_id;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}
                    >
                      {!isMe && showAvatar && (
                        <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center overflow-hidden mr-2 mt-1 shrink-0">
                          {otherUser?.profile?.avatar_url ? (
                            <img src={otherUser.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={12} className="text-muted-foreground" />
                          )}
                        </div>
                      )}
                      {!isMe && !showAvatar && <div className="w-7 mr-2 shrink-0" />}
                      <div className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-secondary-foreground rounded-bl-md"
                      }`}>
                        <div>{renderMessageContent(msg.content)}</div>
                        <div className={`flex items-center gap-1 justify-end mt-0.5`}>
                          <p className={`text-[10px] ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                            {formatTime(msg.created_at)}
                          </p>
                          {isMe && <CheckCheck size={12} className="text-primary-foreground/60" />}
                        </div>
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
          <form
            className="flex gap-2 items-end"
            onSubmit={e => { e.preventDefault(); sendMessage.mutate(); }}
          >
            <label className="cursor-pointer">
              <Paperclip size={18} className="text-muted-foreground hover:text-foreground transition-colors mt-2.5" />
              <input type="file" className="hidden" onChange={e => setAttachFile(e.target.files?.[0] || null)} />
            </label>
            <Input
              ref={inputRef}
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 h-11"
            />
            <Button variant="hero" size="icon" className="h-11 w-11 shrink-0" type="submit" disabled={!messageText.trim() && !attachFile}>
              <Send size={16} />
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // New chat search
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
          <Input
            placeholder="Search by name or username..."
            className="pl-10 h-11"
            value={searchUsers}
            onChange={e => setSearchUsers(e.target.value)}
            autoFocus
          />
        </div>
        <div className="space-y-1">
          {searchResults.map(profile => (
            <motion.button
              key={profile.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
              onClick={() => startConversation.mutate(profile.user_id)}
            >
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={16} className="text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{profile.display_name || "Artist"}</p>
                {profile.username && <p className="text-[11px] text-muted-foreground">@{profile.username}</p>}
              </div>
              <MessageCircle size={16} className="text-muted-foreground" />
            </motion.button>
          ))}
          {searchUsers.length > 1 && searchResults.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No artists found</p>
          )}
        </div>
      </div>
    );
  }

  // Conversation list
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

      {/* Search conversations */}
      {conversations.length > 0 && (
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-10 h-10"
            value={searchConvos}
            onChange={e => setSearchConvos(e.target.value)}
          />
        </div>
      )}

      {convoLoading ? (
        <LoadingList count={5} />
      ) : filteredConversations.length > 0 ? (
        <div className="space-y-1">
          {filteredConversations.map((convo, idx) => {
            const other = convo.participants[0];
            const isLastSenderMe = convo.lastMessage?.sender_id === user!.id;
            return (
              <motion.button
                key={convo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-all text-left group"
                onClick={() => setActiveConvo(convo.id)}
              >
                <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                  {other?.profile?.avatar_url ? (
                    <img src={other.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={18} className="text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{other?.profile?.display_name || "Artist"}</p>
                    {convo.lastMessage && (
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{formatTime(convo.lastMessage.created_at)}</span>
                    )}
                  </div>
                  {convo.lastMessage && (
                    <p className="text-xs text-muted-foreground truncate">
                      {isLastSenderMe && <span className="text-primary">You: </span>}
                      {convo.lastMessage.content}
                    </p>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      ) : (
        <Card className="border-border/50 border-dashed">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <MessageCircle size={28} className="text-accent" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground mb-1">No messages yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Start a conversation by finding artists to collaborate with.
            </p>
            <Button variant="hero" size="sm" onClick={() => setShowNewChat(true)}>
              <Plus size={16} /> Start Chatting
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
