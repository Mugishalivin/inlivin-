import { useEffect, useMemo, useRef, useState } from "react";
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
import { ReportDialog } from "@/components/ReportDialog";
import { isVideoMedia } from "@/lib/update-feed";

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
  const [reportOpen, setReportOpen] = useState(false);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);

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
      return data as any;
    },
    enabled: !!tableName && !!contentId,
  });

  const isOwner = user?.id === item?.created_by;
  const mediaUrl = item?.media_url || item?.image_url || null;
  const mediaType = item?.media_type || "";
  const isVideo = isVideoMedia(mediaUrl, mediaType);

  useEffect(() => {
    if (!mediaUrl || !isVideo) return;
    const video = heroVideoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.defaultMuted = true;
    video.preload = "auto";

    const attemptPlay = () => {
      video.load();
      const promise = video.play();
      if (promise) promise.catch(() => undefined);
    };

    if (video.readyState >= 2) {
      attemptPlay();
      return;
    }

    const onCanPlay = () => attemptPlay();
    video.addEventListener("canplay", onCanPlay, { once: true });
    video.addEventListener("loadedmetadata", attemptPlay, { once: true });
    return () => {
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("loadedmetadata", attemptPlay);
    };
  }, [isVideo, mediaUrl]);

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

  if (mediaUrl) {
    return (
      <div className="fixed inset-0 overflow-hidden bg-background text-foreground">
        <div className="relative h-full w-full overflow-hidden">
          {mediaUrl ? (
            isVideo ? (
              <video
                ref={heroVideoRef}
                src={mediaUrl}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                controls={false}
                className="absolute inset-0 h-full w-full object-cover brightness-[0.28] contrast-110 saturate-90 scale-105"
              />
            ) : (
              <img
                src={mediaUrl}
                alt={item.title}
                className="absolute inset-0 h-full w-full object-cover brightness-[0.28] contrast-110 saturate-90 scale-105"
              />
            )
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-black/90" />

          <div className="relative z-10 flex h-full flex-col justify-between p-4 sm:p-6 lg:p-8">
            <div className="flex items-start justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="border border-white/10 bg-white/10 text-white backdrop-blur hover:bg-white/15 hover:text-white"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              <Badge className="border-white/10 bg-white/10 px-3 py-1 text-white backdrop-blur">
                {item.is_active ? "Live" : "Pending Review"}
              </Badge>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div className="max-w-3xl space-y-4 lg:ml-auto lg:max-w-[36rem] lg:pl-8 xl:pl-14">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-white/10 bg-white/10 px-3 py-1 text-white backdrop-blur">
                    {contentType ? contentType[0].toUpperCase() + contentType.slice(1) : "Content"}
                  </Badge>
                  {item.valid_until && (
                    <Badge className="border-white/10 bg-white/10 px-3 py-1 text-white backdrop-blur">
                      Ends {new Date(item.valid_until).toLocaleDateString()}
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  <h1 className="font-display text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
                    {item.title}
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
                    {item.content}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-white/70">
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 backdrop-blur">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 backdrop-blur">
                    {contentType ? `${contentType} update` : "Platform update"}
                  </span>
                  {item.target_audience && (
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 backdrop-blur">
                      Audience {item.target_audience}
                    </span>
                  )}
                  {"discount_percentage" in item && item.discount_percentage !== null && (
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 backdrop-blur">
                      Discount {item.discount_percentage}%
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-4 text-white shadow-2xl backdrop-blur-xl lg:mr-6 xl:mr-10">
                <div className="space-y-3">
                  {isOwner ? (
                    <p className="text-sm text-white/70">This is your own content.</p>
                  ) : (
                    <>
                      <Label htmlFor="communicate-message" className="text-white">
                        Tell them what you want
                      </Label>
                      <Textarea
                        id="communicate-message"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Hi, I want to discuss this ad..."
                        className="min-h-24 border-white/10 bg-black/20 text-white placeholder:text-white/50"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => communicate.mutate()}
                          disabled={!messageText.trim() || communicate.isPending}
                          className="flex-1 bg-white text-slate-950 hover:bg-white/90"
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          {communicate.isPending ? "Sending..." : "Communicate"}
                        </Button>
                      </div>
                    </>
                  )}
                  <Button
                    variant="outline"
                    className="w-full border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                    onClick={() => setReportOpen(true)}
                  >
                    Report content
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ReportDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          entityType={(contentType || "announcement") as ContentType}
          entityId={contentId || ""}
          reportedUserId={item.created_by}
          entityTitle={item.title}
          entityLabel={`${contentType || "content"} content`}
        />
      </div>
    );
  }

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
          <Button
            variant="outline"
            className="border-border bg-background hover:bg-secondary"
            onClick={() => setReportOpen(true)}
          >
            Report content
          </Button>
        </CardContent>
      </Card>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        entityType={(contentType || "announcement") as ContentType}
        entityId={contentId || ""}
        reportedUserId={item.created_by}
        entityTitle={item.title}
        entityLabel={`${contentType || "content"} content`}
      />
    </div>
  );
}
