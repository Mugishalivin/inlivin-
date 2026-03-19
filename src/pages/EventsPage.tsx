import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Calendar, Plus, MapPin, Users, Clock, Trash2, Edit, CheckCircle, XCircle
} from "lucide-react";
import { format } from "date-fns";

export default function EventsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("is_public", true)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(20);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: myRsvps = [] } = useQuery({
    queryKey: ["my-rsvps"],
    queryFn: async () => {
      const { data } = await supabase
        .from("event_rsvps")
        .select("event_id")
        .eq("user_id", user!.id);
      return (data ?? []).map(r => r.event_id);
    },
    enabled: !!user,
  });

  const { data: rsvpCounts = {} } = useQuery({
    queryKey: ["rsvp-counts", events.map(e => e.id)],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const e of events) {
        const { count } = await supabase
          .from("event_rsvps")
          .select("*", { count: "exact", head: true })
          .eq("event_id", e.id);
        counts[e.id] = count ?? 0;
      }
      return counts;
    },
    enabled: events.length > 0,
  });

  const { data: eventCreators = {} } = useQuery({
    queryKey: ["event-creators", events.map(e => e.user_id)],
    queryFn: async () => {
      const userIds = [...new Set(events.map(e => e.user_id))];
      const creators: Record<string, string> = {};
      for (const uid of userIds) {
        const { data } = await supabase.from("profiles").select("display_name").eq("user_id", uid).single();
        creators[uid] = data?.display_name || "Artist";
      }
      return creators;
    },
    enabled: events.length > 0,
  });

  const createEvent = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("events").insert({
        user_id: user!.id,
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        event_date: new Date(eventDate).toISOString(),
        max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event created!");
      setOpen(false);
      setTitle(""); setDescription(""); setLocation(""); setEventDate(""); setMaxAttendees("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const rsvpMutation = useMutation({
    mutationFn: async (eventId: string) => {
      if (myRsvps.includes(eventId)) {
        const { error } = await supabase.from("event_rsvps").delete().eq("event_id", eventId).eq("user_id", user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_rsvps").insert({ event_id: eventId, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-rsvps"] });
      queryClient.invalidateQueries({ queryKey: ["rsvp-counts"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event deleted");
    },
  });

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">
            Events<span className="text-primary">.</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Upcoming events from the community.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" size="sm"><Plus size={16} /> Create Event</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Create Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-medium">Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1.5" placeholder="Event name" />
              </div>
              <div>
                <Label className="text-xs font-medium">Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1.5" rows={3} placeholder="What's happening?" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Date & Time</Label>
                  <Input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-xs font-medium">Max Attendees</Label>
                  <Input type="number" value={maxAttendees} onChange={e => setMaxAttendees(e.target.value)} className="mt-1.5" placeholder="Unlimited" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium">Location</Label>
                <Input value={location} onChange={e => setLocation(e.target.value)} className="mt-1.5" placeholder="Venue or online link" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="hero" onClick={() => createEvent.mutate()} disabled={!title.trim() || !eventDate || createEvent.isPending}>
                {createEvent.isPending ? "Creating..." : "Create Event"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-border/50 animate-pulse">
              <CardContent className="p-5">
                <div className="h-5 bg-muted rounded w-1/3 mb-3" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-4">
          {events.map(event => {
            const isRsvpd = myRsvps.includes(event.id);
            const count = rsvpCounts[event.id] ?? 0;
            const isMine = event.user_id === user!.id;
            return (
              <Card key={event.id} className="border-border/50 hover:border-primary/20 transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display font-bold text-base text-foreground">{event.title}</h3>
                        {isMine && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">Your event</span>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {format(new Date(event.event_date), "MMM d, yyyy · h:mm a")}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} /> {event.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users size={12} /> {count} going{event.max_attendees ? ` / ${event.max_attendees}` : ""}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2">
                        by {eventCreators[event.user_id] || "Artist"}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant={isRsvpd ? "outline" : "hero"}
                        size="sm"
                        onClick={() => rsvpMutation.mutate(event.id)}
                      >
                        {isRsvpd ? <><XCircle size={14} /> Cancel</> : <><CheckCircle size={14} /> RSVP</>}
                      </Button>
                      {isMine && (
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => deleteEvent.mutate(event.id)}>
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-border/50 border-dashed">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <Calendar size={28} className="text-accent" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground mb-1">No upcoming events</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Create an event to bring the creative community together.
            </p>
            <Button variant="hero" size="sm" onClick={() => setOpen(true)}>
              <Plus size={16} /> Create Event
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
