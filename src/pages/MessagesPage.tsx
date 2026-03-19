import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MessageCircle, Search, Send, User, ArrowLeft, Plus } from "lucide-react";

interface ConversationWithDetails {
  id: string;
  updated_at: string;
  participants: { user_id: string; profile: { display_name: string | null; avatar_url: string | null; username: string | null } }[];
  lastMessage?: { content: string; created_at: string };
}

export default function MessagesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchUsers, setSearchUsers] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          .select("content, created_at")
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
  const { data: messages = [] } = useQuery({
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
    refetchInterval: 3000,
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!messageText.trim() || !activeConvo) return;
      const { error } = await supabase.from("messages").insert({
        conversation_id: activeConvo,
        sender_id: user!.id,
        content: messageText.trim(),
      });
      if (error) throw error;
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", activeConvo);
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["messages", activeConvo] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const startConversation = useMutation({
    mutationFn: async (otherUserId: string) => {
      // Check if conversation already exists
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
          if (otherPart) {
            return mc.conversation_id;
          }
        }
      }

      const { data: convo, error: convoErr } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();
      if (convoErr) throw convoErr;

      await supabase.from("conversation_participants").insert([
        { conversation_id: convo.id, user_id: user!.id },
        { conversation_id: convo.id, user_id: otherUserId },
      ]);

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

  // Chat view
  if (activeConvo) {
    const convo = conversations.find(c => c.id === activeConvo);
    const otherUser = convo?.participants?.[0];

    return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveConvo(null)}>
            <ArrowLeft size={16} />
          </Button>
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
            {otherUser?.profile?.avatar_url ? (
              <img src={otherUser.profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={16} className="text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="font-display font-bold text-sm">{otherUser?.profile?.display_name || "Artist"}</h3>
            {otherUser?.profile?.username && (
              <p className="text-[11px] text-muted-foreground">@{otherUser.profile.username}</p>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(msg => {
            const isMe = msg.sender_id === user!.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm ${
                  isMe
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-secondary-foreground rounded-bl-md"
                }`}>
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <form
            className="flex gap-2"
            onSubmit={e => { e.preventDefault(); sendMessage.mutate(); }}
          >
            <Input
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 h-11"
            />
            <Button variant="hero" size="icon" className="h-11 w-11 shrink-0" type="submit" disabled={!messageText.trim()}>
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
            <button
              key={profile.id}
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
              <div>
                <p className="text-sm font-medium">{profile.display_name || "Artist"}</p>
                {profile.username && <p className="text-[11px] text-muted-foreground">@{profile.username}</p>}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Conversation list
  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
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

      {convoLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
              <div className="w-11 h-11 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length > 0 ? (
        <div className="space-y-1">
          {conversations.map(convo => {
            const other = convo.participants[0];
            return (
              <button
                key={convo.id}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                onClick={() => setActiveConvo(convo.id)}
              >
                <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
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
                      <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(convo.lastMessage.created_at)}</span>
                    )}
                  </div>
                  {convo.lastMessage && (
                    <p className="text-xs text-muted-foreground truncate">{convo.lastMessage.content}</p>
                  )}
                </div>
              </button>
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
