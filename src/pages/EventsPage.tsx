import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EventCard } from "@/components/EventCard";
import { LoadingCardGrid } from "@/components/LoadingSkeletons";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Calendar, Plus, Search, Filter, X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("upcoming"); // upcoming, past, all

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      try {
        // @ts-ignore - Supabase type definition issue with chained queries
        const { data } = await supabase
          .from("events")
          .select("*")
          .eq("is_cancelled", false)
          .order("event_date", { ascending: true })
          .limit(100);

        if (user?.id && data) {
          return data.filter(e => e.is_public || e.user_id === user.id);
        }
        
        return data ?? [];
      } catch (error) {
        console.error("Error fetching events:", error);
        return [];
      }
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
      const userIds = [...new Set(events.map(e => e.user_id))] as string[];
      const creators: Record<string, string> = {};
      for (const uid of userIds) {
        const { data } = await supabase.from("profiles").select("display_name").eq("user_id", uid as string).single() as any;
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

  // Apply filters
  let filteredEvents = events;
  
  if (dateFilter === "upcoming") {
    filteredEvents = upcomingEvents;
  } else if (dateFilter === "past") {
    filteredEvents = pastEvents;
  }

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredEvents = filteredEvents.filter(e => 
      e.title.toLowerCase().includes(query) || 
      e.description?.toLowerCase().includes(query) ||
      e.location?.toLowerCase().includes(query)
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">
            Events<span className="text-primary">.</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Discover and join events from the community.</p>
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={() => navigate("/create-event")}
        >
          <Plus size={14} className="mr-1" /> Create Event
        </Button>
      </div>

      {/* Search & Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 space-y-4">
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search events by title, location, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>

          {(searchQuery || dateFilter !== "upcoming") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setDateFilter("upcoming");
              }}
              className="text-xs"
            >
              <X size={12} className="mr-1" /> Clear Filters
            </Button>
          )}
        </div>
      </motion.div>

      {isLoading ? (
        <LoadingCardGrid count={9} />
      ) : filteredEvents.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-foreground">
              {dateFilter === "upcoming" ? "✨ Upcoming Events" : dateFilter === "past" ? "📚 Past Events" : "All Events"}
            </h2>
            <span className="text-xs text-muted-foreground">{filteredEvents.length} result{filteredEvents.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-max">
            {filteredEvents.map((event, idx) => (
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
      ) : (
        <Card className="border-border/50 border-dashed">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <Calendar size={28} className="text-accent" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground mb-1">No events found</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              {searchQuery ? "Try adjusting your search or filters" : "Create an event to bring the creative community together."}
            </p>
            <Button variant="hero" size="sm" onClick={() => navigate("/create-event")}><Plus size={16} /> Create Event</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
