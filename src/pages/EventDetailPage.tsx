import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, CheckCircle, XCircle,
  Share2, Edit, Trash2, User, Globe, ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { UserAvatar, UserName } from "@/components/UserLink";

export default function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event-detail", eventId],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*").eq("id", eventId!).single();
      return data;
    },
    enabled: !!eventId,
  });

  const { data: creator } = useQuery({
    queryKey: ["event-creator", event?.user_id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", event!.user_id).single();
      return data;
    },
    enabled: !!event,
  });

  const { data: attendees = [] } = useQuery({
    queryKey: ["event-attendees", eventId],
    queryFn: async () => {
      const { data: rsvps } = await supabase.from("event_rsvps").select("*").eq("event_id", eventId!);
      if (!rsvps?.length) return [];
      const result = [];
      for (const r of rsvps) {
        const { data: prof } = await supabase.from("profiles").select("display_name, avatar_url, username, user_id").eq("user_id", r.user_id).single();
        result.push({ ...r, profile: prof });
      }
      return result;
    },
    enabled: !!eventId,
  });

  const isRsvpd = attendees.some(a => a.user_id === user?.id);
  const isMine = event?.user_id === user?.id;
  const isPast = event ? new Date(event.event_date) < new Date() : false;

  const rsvpMutation = useMutation({
    mutationFn: async () => {
      if (isRsvpd) {
        await supabase.from("event_rsvps").delete().eq("event_id", eventId!).eq("user_id", user!.id);
      } else {
        await supabase.from("event_rsvps").insert({ event_id: eventId!, user_id: user!.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-attendees", eventId] });
      toast.success(isRsvpd ? "RSVP cancelled" : "You're going!");
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("events").delete().eq("id", eventId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Event deleted");
      navigate("/events");
    },
  });

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!");
  };

  if (isLoading) {
    return <div className="p-6 md:p-8 max-w-4xl animate-pulse"><div className="h-8 bg-muted rounded w-1/3 mb-4" /><div className="h-48 bg-muted rounded-xl" /></div>;
  }

  if (!event) {
    return <div className="p-6 md:p-8 max-w-4xl text-center py-20"><h2 className="font-display text-xl font-bold mb-2">Event not found</h2><Button variant="outline" onClick={() => navigate("/events")}>Back to Events</Button></div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/events")}>
          <ArrowLeft size={16} /> Back to Events
        </Button>
      </motion.div>

      {/* Cover */}
      {event.cover_url && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl overflow-hidden mb-6 h-56 md:h-72 bg-secondary">
          <img src={event.cover_url} alt="" className="w-full h-full object-cover" />
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {isPast && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Past</span>}
              <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">{event.title}</h1>
            </div>
            <Link to={`/profile/${event.user_id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <UserAvatar userId={event.user_id} avatarUrl={creator?.avatar_url} size={6} />
              <span>Hosted by {creator?.display_name || "Artist"}</span>
            </Link>
          </div>
          <div className="flex gap-2 shrink-0">
            {!isPast && (
              <Button variant={isRsvpd ? "outline" : "hero"} size="sm" onClick={() => rsvpMutation.mutate()}>
                {isRsvpd ? <><XCircle size={14} /> Cancel RSVP</> : <><CheckCircle size={14} /> RSVP</>}
              </Button>
            )}
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleShare}><Share2 size={14} /></Button>
            {isMine && (
              <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteEvent.mutate()}>
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        </div>

        {/* Details grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 space-y-6">
            {event.description && (
              <div>
                <h3 className="font-display font-bold text-sm mb-2 text-foreground">About</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{event.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Card className="border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Calendar size={18} className="text-primary" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm font-medium">{format(new Date(event.event_date), "EEEE, MMM d, yyyy")}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center"><Clock size={18} className="text-accent" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="text-sm font-medium">{format(new Date(event.event_date), "h:mm a")}</p>
                  </div>
                </CardContent>
              </Card>
              {event.location && (
                <Card className="border-border/50 col-span-2">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center"><MapPin size={18} className="text-muted-foreground" /></div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="text-sm font-medium">{event.location}</p>
                    </div>
                    {event.location.startsWith("http") && (
                      <a href={event.location} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} className="text-primary" /></a>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Attendees sidebar */}
          <div>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-bold text-sm">Attendees</h3>
                  <span className="text-xs text-muted-foreground">{attendees.length}{event.max_attendees ? ` / ${event.max_attendees}` : ""}</span>
                </div>
                {attendees.length > 0 ? (
                  <div className="space-y-2">
                    {attendees.map((a: any) => (
                      <Link key={a.id} to={`/profile/${a.user_id}`} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
                        <UserAvatar userId={a.user_id} avatarUrl={a.profile?.avatar_url} size={7} />
                        <span className="text-xs font-medium truncate">{a.profile?.display_name || "Artist"}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No attendees yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
