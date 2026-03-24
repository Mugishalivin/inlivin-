import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, MessageCircle } from "lucide-react";

type ContentType = "announcement" | "promotion" | "ad";

function resolveTable(type: string): "announcements" | "promotions" | "ads" | null {
  if (type === "announcement") return "announcements";
  if (type === "promotion") return "promotions";
  if (type === "ad") return "ads";
  return null;
}

export default function ContentDetailPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { contentType, contentId } = useParams<{ contentType: ContentType; contentId: string }>();
  const [messageText, setMessageText] = useState("");

  const tableName = useMemo(() => resolveTable(contentType || ""), [contentType]);

  const { data: item, isLoading } = useQuery({
    queryKey: ["content-detail", contentType, contentId],
    queryFn: async () => {
      if (!tableName || !contentId) return null;
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", contentId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!tableName && !!contentId,
  });

  const communicate = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Please sign in first.");
      if (!item?.created_by) throw new Error("Could not find recipient.");
      if (!messageText.trim()) throw new Error("Message cannot be empty.");
      if (item.created_by === user.id) throw new Error("You cannot message yourself.");

      const { data: myConvos, error: convoFindErr } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);
      if (convoFindErr) throw convoFindErr;

      let conversationId: string | null = null;
      for (const row of myConvos ?? []) {
        const { data: otherParticipant } = await supabase
          .from("conversation_participants")
          .select("id")
          .eq("conversation_id", row.conversation_id)
          .eq("user_id", item.created_by)
          .single();
        if (otherParticipant) {
          conversationId = row.conversation_id;
          break;
        }
      }

      if (!conversationId) {
        const { data: convo, error: createConvoErr } = await supabase.from("conversations").insert({}).select().single();
        if (createConvoErr) throw createConvoErr;
        conversationId = convo.id;

        const { error: addSelfErr } = await supabase
          .from("conversation_participants")
          .insert({ conversation_id: conversationId, user_id: user.id });
        if (addSelfErr) throw addSelfErr;

        const { error: addOtherErr } = await supabase
          .from("conversation_participants")
          .insert({ conversation_id: conversationId, user_id: item.created_by });
        if (addOtherErr) throw addOtherErr;
      }

      const message = `[From ${contentType}] ${messageText.trim()}\nContent ID: ${contentId}`;
      const { error: sendErr } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: message,
      });
      if (sendErr) throw sendErr;

      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);

      await supabase.from("notifications").insert({
        user_id: item.created_by,
        title: "New content inquiry",
        message: `${user.email?.split("@")[0] || "A user"} sent a message about your ${contentType}.`,
        type: "message",
        reference_id: conversationId,
        reference_type: "conversation",
      });
    },
    onSuccess: () => {
      toast.success("Message sent.");
      setMessageText("");
      navigate("/messages");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!tableName) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">Invalid content type.</CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading content...</div>;
  }

  if (!item) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">Content not found.</CardContent>
        </Card>
      </div>
    );
  }

  const isOwner = user?.id === item.created_by;
  const mediaUrl = item.media_url || item.image_url || null;
  const mediaType = item.media_type || "";
  const isVideo = mediaType.startsWith("video/");

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back
      </Button>

      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>{item.title}</CardTitle>
            <Badge variant={item.is_active ? "default" : "secondary"}>
              {item.is_active ? "Live" : "Pending Review"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{item.content}</p>

          {mediaUrl && (
            <div className="rounded-lg border p-2">
              {isVideo ? (
                <video src={mediaUrl} controls className="w-full rounded-md" />
              ) : (
                <img src={mediaUrl} alt={item.title} className="w-full rounded-md object-cover" />
              )}
            </div>
          )}

          {"discount_percentage" in item && item.discount_percentage !== null && (
            <p className="text-sm">Discount: {item.discount_percentage}%</p>
          )}
          {"valid_until" in item && item.valid_until && (
            <p className="text-sm">Valid until: {new Date(item.valid_until).toLocaleString()}</p>
          )}
          {"target_audience" in item && item.target_audience && (
            <p className="text-sm">Target audience: {item.target_audience}</p>
          )}
          {"link_url" in item && item.link_url && (
            <a href={item.link_url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
              Open linked page
            </a>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Communicate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isOwner ? (
            <p className="text-sm text-muted-foreground">This is your own content.</p>
          ) : (
            <>
              <Label htmlFor="communicate-message">Tell them what you want</Label>
              <Textarea
                id="communicate-message"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Hi, I want to discuss this post..."
              />
              <Button onClick={() => communicate.mutate()} disabled={!messageText.trim() || communicate.isPending}>
                <MessageCircle className="mr-2 h-4 w-4" />
                {communicate.isPending ? "Sending..." : "Communicate"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
