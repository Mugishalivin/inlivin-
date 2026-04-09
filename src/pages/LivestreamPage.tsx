import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Radio, Play, Heart, MessageCircle, Eye, Clock, DollarSign, Users } from "lucide-react";

export default function LivestreamPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const { data: mySessions = [] } = useQuery({
    queryKey: ["livestream", "my-sessions", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("livestream_sessions")
        .select("*")
        .eq("creator_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const { data: allLivestreams = [] } = useQuery({
    queryKey: ["livestream", "all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("livestream_sessions")
        .select("*")
        .eq("status", "live")
        .order("viewers_count", { ascending: false });
      return data ?? [];
    },
    refetchInterval: 10000,
  });

  const createStreamMutation = useMutation({
    mutationFn: async () => {
      const streamKey = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const { error } = await supabase.from("livestream_sessions").insert({
        creator_id: user!.id,
        title: title.trim(),
        description: description.trim() || null,
        stream_key: streamKey,
        status: scheduledAt ? "scheduled" : "live",
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        started_at: !scheduledAt ? new Date().toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["livestream", "my-sessions"] });
      toast.success("Livestream created!");
      setOpen(false);
      setTitle("");
      setDescription("");
      setScheduledAt("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6 p-6 md:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground flex items-center gap-2">
            <Radio className="w-8 h-8 text-red-500 animate-pulse" />
            Go Live
          </h1>
          <p className="text-muted-foreground mt-2">Stream your creative process and connect with your audience in real-time.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" size="sm"><Play className="w-4 h-4 mr-2" /> Start Streaming</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Start a Livestream</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-sm">Stream Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Studio Session 🎵" className="mt-1.5" />
              </div>
              <div>
                <Label className="text-sm">Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What are you creating today?" rows={3} className="mt-1.5" />
              </div>
              <div>
                <Label className="text-sm">Schedule (optional)</Label>
                <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="mt-1.5" />
              </div>
              <div className="bg-secondary/50 p-3 rounded-lg text-xs text-muted-foreground">
                💡 <strong>Tip:</strong> Go live immediately or schedule for later. Your stream will be archived automatically.
              </div>
            </div>
            <DialogFooter>
              <Button variant="hero" onClick={() => createStreamMutation.mutate()} disabled={!title || createStreamMutation.isPending}>
                {createStreamMutation.isPending ? "Starting..." : "Go Live"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Live Streams */}
      {allLivestreams.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            Live Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allLivestreams.map((stream: any) => (
              <Card key={stream.id} className="border-red-500/30 bg-red-500/5 overflow-hidden group cursor-pointer hover:border-red-500/50 transition-colors">
                <CardContent className="p-0">
                  <div className="h-32 bg-secondary relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-b from-red-500/20 to-transparent" />
                    <Badge className="absolute top-2 left-2 bg-red-500 animate-pulse">LIVE</Badge>
                    <Play className="w-8 h-8 text-white opacity-70" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-1">{stream.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{stream.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-3">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {stream.viewers_count || 0}</span>
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {stream.likes_count || 0}</span>
                    </div>
                    <Button size="sm" className="w-full mt-3">Watch Now</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* My Streams */}
      {mySessions.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold">My Streams</h2>
          <div className="space-y-2">
            {mySessions.map((session: any) => (
              <Card key={session.id} className="border-border/50 hover:border-primary/20 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{session.title}</h3>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Badge variant={session.status === "live" ? "default" : "secondary"} className="capitalize">
                        {session.status}
                      </Badge>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(session.created_at).toLocaleDateString()}</span>
                      {session.status === "ended" && (
                        <>
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {session.viewers_count || 0} viewers</span>
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${session.tips_total || 0}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Details</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Benefits */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">Why Go Live?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="text-primary">✓</span> <span>Connect with audience in real-time</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary">✓</span> <span>Accept tips & donations during streams</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary">✓</span> <span>Grow audience with replay archives</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary">✓</span> <span>Multi-artist collab streams</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
