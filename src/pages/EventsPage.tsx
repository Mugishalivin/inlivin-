import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/EventCard";
import { LoadingCardGrid } from "@/components/LoadingSkeletons";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Calendar, Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function EventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .or(`is_public.eq.true,user_id.eq.${user!.id}`)
        .order("event_date", { ascending: true })
        .limit(30);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: myRsvps = [] } = useQuery({
    queryKey: ["my-rsvps"],
    queryFn: async () => {
      const { data } = await supabase.from("event_rsvps").select("event_id").eq("user_id", user!.id);
      return (data ?? []).map(r => r.event_id);
    },
    enabled: !!user,
  });

  const { data: rsvpCounts = {} } = useQuery({
    queryKey: ["rsvp-counts", events.map(e => e.id)],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const e of events) {
        const { count } = await supabase.from("event_rsvps").select("*", { count: "exact", head: true }).eq("event_id", e.id);
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

  const upcomingEvents = events.filter(e => new Date(e.event_date) >= new Date());
  const pastEvents = events.filter(e => new Date(e.event_date) < new Date());

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">
            Events<span className="text-primary">.</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Upcoming events from the community.</p>
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={() => navigate("/create-event")}
        >
          <Plus size={16} /> Create Event
        </Button>
      </div>

      {isLoading ? (
        <LoadingCardGrid count={9} />
      ) : events.length > 0 ? (
        <div className="space-y-10">
          {/* Upcoming Events - Pinterest Grid */}
          {upcomingEvents.length > 0 && (
            <div>
              <h2 className="font-display font-bold text-xl mb-6 text-foreground">✨ Upcoming Events</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-max">
                {upcomingEvents.map((event, idx) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isOwner={event.user_id === user!.id}
                    isJoined={myRsvps.includes(event.id)}
                    attendeeCount={rsvpCounts[event.id] ?? 0}
                    creatorName={eventCreators[event.user_id] || "Artist"}
                    onEdit={() => {}}
                    onDelete={(id) => deleteEvent.mutate(id)}
                    index={idx}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Events - Compact View */}
          {pastEvents.length > 0 && (
            <div>
              <h2 className="font-display font-bold text-xl mb-6 text-muted-foreground">📚 Past Events</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 opacity-60">
                {pastEvents.slice(0, 9).map((event) => (
                  <Card key={event.id} className="border-border/50 hover:border-primary/10 transition-all cursor-pointer h-24" onClick={() => navigate(`/events/${event.id}`)}>
                    <CardContent className="p-4 flex items-center gap-3 h-full">
                      {event.cover_url && (
                        <div className="w-16 h-16 rounded-lg bg-secondary overflow-hidden shrink-0">
                          <img src={event.cover_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{event.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {new Date(event.event_date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card className="border-border/50 border-dashed">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <Calendar size={28} className="text-accent" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground mb-1">No upcoming events</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">Create an event to bring the creative community together.</p>
            <Button variant="hero" size="sm" onClick={() => navigate("/create-event")}><Plus size={16} /> Create Event</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
