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
  Share2, Edit, Trash2, User, Globe, ExternalLink, Heart, Bookmark, MessageCircle, Mail, Copy, Flag, Send, Trash, Star, AlertCircle, Eye, EyeOff, DollarSign, Gift, List
} from "lucide-react";
import { format } from "date-fns";
import { UserAvatar, UserName } from "@/components/UserLink";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReportDialog } from "@/components/ReportDialog";

export default function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isMobileVideoView, setIsMobileVideoView] = useState(false);
  const [showRsvpForm, setShowRsvpForm] = useState(false);
  const [rsvpResponse, setRsvpResponse] = useState("");
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [thankYouMessage, setThankYouMessage] = useState("");
  const [showAttendeeList, setShowAttendeeList] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [ratingReview, setRatingReview] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [onWaitlist, setOnWaitlist] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ["event-detail", eventId],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*").eq("id", eventId!).single();
      return data;
    },
    enabled: !!eventId,
  });

  const isOwner = user?.id === event?.user_id;

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

  const { data: media = [] } = useQuery({
    queryKey: ["event-media", eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from("event_media")
        .select("*")
        .eq("event_id", eventId!)
        .order("display_order", { ascending: true });
      return data ?? [];
    },
    enabled: !!eventId,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["event-comments", eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from("event_comments")
        .select("*")
        .eq("event_id", eventId!)
        .order("created_at", { ascending: false });
      
      if (!data?.length) return [];
      
      const result = [];
      for (const c of data) {
        const { data: prof } = await supabase.from("profiles").select("display_name, avatar_url, user_id").eq("user_id", c.user_id).single();
        result.push({ ...c, profile: prof });
      }
      return result;
    },
    enabled: !!eventId,
  });

  const { data: ratings = [] } = useQuery({
    queryKey: ["event-ratings", eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from("event_ratings")
        .select("*")
        .eq("event_id", eventId!);
      return data ?? [];
    },
    enabled: !!eventId,
  });

  const { data: userRatingData } = useQuery({
    queryKey: ["user-event-rating", eventId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("event_ratings")
        .select("*")
        .eq("event_id", eventId!)
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!eventId && !!user,
  });

  const { data: waitlistData = [] } = useQuery({
    queryKey: ["event-waitlist", eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from("event_waitlist")
        .select("*")
        .eq("event_id", eventId!);
      return data ?? [];
    },
    enabled: !!eventId,
  });

  useEffect(() => {
    if (event) {
      setEditTitle(event.title || "");
      setEditDescription(event.description || "");
      setShareMessage(`Check out: ${event.title}`);
    }
    if (userRatingData) {
      setUserRating(userRatingData.rating);
      setRatingReview(userRatingData.review || "");
    }
    if (waitlistData) {
      setOnWaitlist(waitlistData.some(w => w.user_id === user?.id));
    }
  }, [event, userRatingData, waitlistData, user]);

  const isRsvpd = attendees.some(a => a.user_id === user?.id);
  const isMine = event?.user_id === user?.id;
  const isPast = event ? new Date(event.event_date) < new Date() : false;

  const rsvpMutation = useMutation({
    mutationFn: async () => {
      // If event has requirements and this is a new RSVP, show form
      if (event?.requirements_info && !isRsvpd) {
        setShowRsvpForm(true);
        throw new Error("Show form");
      }
      
      if (isRsvpd) {
        await supabase.from("event_rsvps").delete().eq("event_id", eventId!).eq("user_id", user!.id);
      } else {
        await supabase.from("event_rsvps").insert({ event_id: eventId!, user_id: user!.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-attendees", eventId] });
      toast.success(isRsvpd ? "RSVP cancelled" : "You're going!");
      setShowRsvpForm(false);
      setRsvpResponse("");
    },
    onError: (err: any) => {
      if (err.message !== "Show form") {
        toast.error(err.message || "Failed to update RSVP");
      }
    },
  });

  const confirmRsvp = async () => {
    if (!rsvpResponse.trim() && event?.requirements_info) {
      toast.error("Please fill in the required information");
      return;
    }
    
    try {
      const { error } = await supabase.from("event_rsvps").insert({
        event_id: eventId!,
        user_id: user!.id,
      });
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["event-attendees", eventId] });
      toast.success("RSVP confirmed! See you at the event!");
      setShowRsvpForm(false);
      setRsvpResponse("");
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm RSVP");
    }
  };

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

  const sendThankYou = useMutation({
    mutationFn: async () => {
      if (!thankYouMessage.trim()) throw new Error("Message cannot be empty");
      
      // Create notifications for all attendees
      if (attendees.length > 0) {
        const notifications = attendees.map(a => ({
          user_id: a.user_id,
          title: `Thank you from ${creator?.display_name || "organizer"}`,
          message: thankYouMessage,
          type: "event",
          reference_id: eventId,
          reference_type: "event",
        }));
        
        const { error } = await supabase.from("notifications").insert(notifications);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(`Thank you message sent to ${attendees.length} attendees!`);
      setShowThankYouModal(false);
      setThankYouMessage("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to send message"),
  });

  const updateEvent = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("events").update({
        title: editTitle || event?.title,
        description: editDescription || event?.description,
      }).eq("id", eventId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-detail", eventId] });
      toast.success("Event updated!");
      setShowEditModal(false);
    },
  });

  const submitRating = useMutation({
    mutationFn: async () => {
      if (userRatingData) {
        const { error } = await supabase.from("event_ratings").update({
          rating: userRating,
          review: ratingReview,
        }).eq("event_id", eventId!).eq("user_id", user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_ratings").insert({
          event_id: eventId!,
          user_id: user!.id,
          rating: userRating,
          review: ratingReview,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-ratings", eventId] });
      queryClient.invalidateQueries({ queryKey: ["user-event-rating", eventId, user?.id] });
      toast.success("Rating saved!");
    },
  });

  const cancelEvent = useMutation({
    mutationFn: async () => {
      if (!cancellationReason.trim()) throw new Error("Please provide a cancellation reason");
      const { error } = await supabase.from("events").update({
        is_cancelled: true,
        cancellation_reason: cancellationReason,
        cancelled_at: new Date().toISOString(),
      }).eq("id", eventId!);
      if (error) throw error;

      // Notify all attendees
      if (attendees.length > 0) {
        const notifications = attendees.map(a => ({
          user_id: a.user_id,
          title: `${event?.title} has been cancelled`,
          message: cancellationReason,
          type: "event",
          reference_id: eventId,
          reference_type: "event",
        }));
        await supabase.from("notifications").insert(notifications);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-detail", eventId] });
      toast.success("Event cancelled. Attendees notified.");
      setShowCancelModal(false);
    },
  });

  const toggleWaitlist = useMutation({
    mutationFn: async () => {
      if (onWaitlist) {
        const { error } = await supabase.from("event_waitlist").delete().eq("event_id", eventId!).eq("user_id", user!.id);
        if (error) throw error;
      } else {
        // Get current position
        const { count } = await supabase.from("event_waitlist").select("*", { count: "exact", head: true }).eq("event_id", eventId!);
        const { error } = await supabase.from("event_waitlist").insert({
          event_id: eventId!,
          user_id: user!.id,
          position: (count || 0) + 1,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-waitlist", eventId] });
      toast.success(onWaitlist ? "Removed from waitlist" : "Added to waitlist");
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!newComment.trim()) throw new Error("Comment cannot be empty");
      const { error } = await supabase.from("event_comments").insert({
        event_id: eventId!,
        user_id: user!.id,
        content: newComment,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-comments", eventId] });
      setNewComment("");
      toast.success("Comment added!");
    },
    onError: (err: any) => toast.error(err.message || "Failed to add comment"),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("event_comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-comments", eventId] });
      toast.success("Comment deleted!");
    },
  });

  const { data: isBookmarked } = useQuery({
    queryKey: ["event-bookmarked", eventId, user?.id],
    queryFn: async () => {
      if (!user?.id || !eventId) return false;
      const { data, count } = await supabase
        .from("event_bookmarks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("event_id", eventId);
      return (count ?? 0) > 0;
    },
    enabled: !!user && !!eventId,
  });

  const toggleBookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !eventId) return;
      
      if (isBookmarked) {
        const { error } = await supabase
          .from("event_bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("event_id", eventId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_bookmarks").insert({
          user_id: user.id,
          event_id: eventId,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-bookmarked", eventId, user?.id] });
      toast.success(isBookmarked ? "Removed from bookmarks" : "Added to bookmarks");
    },
    onError: (err: any) => toast.error(err.message || "Failed to update bookmark"),
  });

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!");
  };

  const handleEmailShare = () => {
    const subject = `Check out: ${event?.title}`;
    const body = `${shareMessage || "Check out this event:"}\n\n${window.location.href}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent((shareMessage || `Check out: ${event?.title}`) + "\n\n");
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(window.location.href)}`, "_blank");
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
        {/* Cancelled Banner */}
        {event?.is_cancelled && (
          <Card className="border-destructive/50 bg-destructive/10 mb-6">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-destructive">Event Cancelled</h3>
                <p className="text-xs text-muted-foreground mt-1">{event.cancellation_reason}</p>
              </div>
            </CardContent>
          </Card>
        )}

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
          <div className="flex flex-wrap gap-2 shrink-0">
            {!isPast && (
              <Button variant={isRsvpd ? "outline" : "hero"} size="sm" onClick={() => rsvpMutation.mutate()}>
                {isRsvpd ? <><XCircle size={14} /> Cancel RSVP</> : <><CheckCircle size={14} /> RSVP</>}
              </Button>
            )}
            {isPast && isMine && (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowThankYouModal(true)}>
                  <Users size={14} className="mr-1" /> Thank Attendees
                </Button>
              </>
            )}
            <Button variant={liked ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => setLiked(!liked)} title="Like">
              <Heart size={14} fill={liked ? "currentColor" : "none"} />
            </Button>
            <Button variant={isBookmarked ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => toggleBookmarkMutation.mutate()} title="Save" disabled={toggleBookmarkMutation.isPending}>
              <Bookmark size={14} fill={isBookmarked ? "currentColor" : "none"} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8" title="Share">
                  <Share2 size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleShare}><Copy size={14} className="mr-2" /> Copy Link</DropdownMenuItem>
                <DropdownMenuItem onClick={handleEmailShare}><Mail size={14} className="mr-2" /> Email</DropdownMenuItem>
                <DropdownMenuItem onClick={handleTwitterShare}><MessageCircle size={14} className="mr-2" /> Twitter/X</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowShareModal(true)}><Share2 size={14} className="mr-2" /> More</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {isMine && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Edit size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!isPast && !event?.is_cancelled && <DropdownMenuItem onClick={() => setShowEditModal(true)}><Edit size={14} className="mr-2" /> Edit</DropdownMenuItem>}
                  {!event?.is_cancelled && <DropdownMenuItem onClick={() => setShowCancelModal(true)} className="text-destructive"><AlertCircle size={14} className="mr-2" /> Cancel Event</DropdownMenuItem>}
                  <DropdownMenuItem onClick={() => deleteEvent.mutate()} className="text-destructive"><Trash2 size={14} className="mr-2" /> Delete Event</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setReportOpen(true)} title="Report">
              <Flag size={14} />
            </Button>
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
          <div className="space-y-4">
            {/* Event Status Card */}
            <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="p-4 space-y-3">
                {/* Price */}
                {!event?.is_free && event?.price && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <DollarSign size={12} /> Price
                    </span>
                    <span className="text-sm font-bold">${event.price.toFixed(2)} {event.currency}</span>
                  </div>
                )}
                {event?.is_free && (
                  <div className="flex items-center gap-2">
                    <Gift size={12} className="text-primary" />
                    <span className="text-xs font-medium text-primary">Free Event</span>
                  </div>
                )}
                
                {/* Age Restriction */}
                {(event as any)?.age_restriction && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Age: </span>{(event as any).age_restriction}
                  </div>
                )}

                {/* Max Attendees / Waitlist Status */}
                {event?.max_attendees && (
                  <div className="text-xs">
                    {attendees.length >= event.max_attendees ? (
                      <div className="text-orange-600 dark:text-orange-400 font-medium">Event Full</div>
                    ) : (
                      <div className="text-muted-foreground">
                        {event.max_attendees - attendees.length} spots left
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendees Card */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-bold text-sm">Attendees</h3>
                  <span className="text-xs text-muted-foreground">{attendees.length}{event?.max_attendees ? ` / ${event.max_attendees}` : ""}</span>
                </div>
                
                {/* Show/Hide Toggle for owner */}
                {isMine && (
                  <div className="mb-3 pb-3 border-b border-border/50 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={async () => {
                        await supabase.from("events").update({ show_attendees: !event?.show_attendees }).eq("id", eventId!);
                        queryClient.invalidateQueries({ queryKey: ["event-detail", eventId] });
                      }}
                    >
                      {event?.show_attendees ? <Eye size={12} />: <EyeOff size={12} />}
                      {event?.show_attendees ? "Visible" : "Hidden"}
                    </Button>
                  </div>
                )}

                {attendees.length > 0 && event?.show_attendees ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {attendees.map((a: any) => (
                      <Link key={a.id} to={`/profile/${a.user_id}`} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
                        <UserAvatar userId={a.user_id} avatarUrl={a.profile?.avatar_url} size={7} />
                        <span className="text-xs font-medium truncate">{a.profile?.display_name || "Artist"}</span>
                      </Link>
                    ))}
                  </div>
                ) : attendees.length > 0 && !event?.show_attendees ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Attendees list hidden</p>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No attendees yet</p>
                )}
              </CardContent>
            </Card>

            {/* Waitlist Button */}
            {event?.max_attendees && attendees.length >= event.max_attendees && !isRsvpd && (
              <Button
                variant={onWaitlist ? "default" : "outline"}
                size="sm"
                className="w-full"
                onClick={() => toggleWaitlist.mutate()}
              >
                <List size={14} className="mr-1" />
                {onWaitlist ? `On Waitlist (#${waitlistData.findIndex(w => w.user_id === user?.id) + 1})` : "Join Waitlist"}
              </Button>
            )}

            {/* Ratings Card */}
            {isPast && (
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <h3 className="font-display font-bold text-sm mb-3">Rating</h3>
                  <div className="space-y-3">
                    {/* Show Average Rating */}
                    {ratings.length > 0 && (
                      <div className="text-center pb-3 border-b border-border/50">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              className={i < Math.round(ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">{(ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length).toFixed(1)} ({ratings.length} ratings)</p>
                      </div>
                    )}

                    {/* Your Rating */}
                    {user && (
                      <div>
                        <p className="text-xs font-medium mb-2">Your Rating</p>
                        <div className="flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setUserRating(star)}
                              className="transition-transform hover:scale-110"
                            >
                              <Star
                                size={16}
                                className={star <= userRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}
                              />
                            </button>
                          ))}
                        </div>
                        <Textarea
                          value={ratingReview}
                          onChange={(e) => setRatingReview(e.target.value)}
                          placeholder="Share your thoughts..."
                          className="text-xs h-16 resize-none mb-2"
                        />
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => submitRating.mutate()}
                          disabled={submitRating.isPending || userRating === 0}
                        >
                          {submitRating.isPending ? "Saving..." : "Save Rating"}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Media Section - Videos and Images */}
        {media.length > 0 && isMine && (
          <div className="mb-8">
            <h3 className="font-display font-bold text-lg mb-4 text-foreground">Media</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {media.map((m: any) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl overflow-hidden bg-secondary border border-border/50 hover:border-primary/20 transition-all group"
                >
                  {m.media_type === "video" ? (
                    <video
                      src={m.media_url}
                      controls
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <img
                      src={m.media_url}
                      alt={m.title || "Event media"}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                    />
                  )}
                  {m.title && (
                    <div className="p-3 bg-secondary border-t border-border/50">
                      <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                      {m.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{m.description}</p>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="mb-8">
          <h3 className="font-display font-bold text-lg mb-4 text-foreground">Comments {isPast ? "& Feedback" : "(Available After Event)"}</h3>
          
          {/* Add Comment - Only show after event */}
          {user && isPast && (
            <Card className="border-border/50 mb-6">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <UserAvatar userId={user.id} size={10} />
                  <div className="flex-1">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts about this event..."
                      className="text-sm resize-none h-20 mb-2"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => addCommentMutation.mutate()}
                        disabled={addCommentMutation.isPending || !newComment.trim()}
                      >
                        <Send size={14} className="mr-1" />
                        {addCommentMutation.isPending ? "Posting..." : "Post"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment: any) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-border/50 hover:border-primary/10 transition-all group">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <UserAvatar userId={comment.user_id} avatarUrl={comment.profile?.avatar_url} size={9} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <Link
                              to={`/profile/${comment.user_id}`}
                              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                            >
                              {comment.profile?.display_name || "Artist"}
                            </Link>
                            {comment.user_id === user?.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => deleteCommentMutation.mutate(comment.id)}
                              >
                                <Trash size={12} />
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {format(new Date(comment.created_at), "MMM d, yyyy h:mm a")}
                          </p>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="border-border/50 border-dashed">
              <CardContent className="py-8 text-center">
                <MessageCircle size={24} className="text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{isPast ? "No comments yet. Be the first!" : "Comments coming after the event"}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Share Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold block mb-2">Event Link</Label>
                <div className="flex gap-2">
                  <Input value={window.location.href} readOnly className="text-xs bg-secondary/50" />
                  <Button onClick={handleShare} variant="outline" size="icon" className="shrink-0"><Copy size={16} /></Button>
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold block mb-2">Message</Label>
                <Textarea value={shareMessage} onChange={(e) => setShareMessage(e.target.value)} className="text-xs h-16 resize-none" placeholder="Add a message..." />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleEmailShare} variant="outline" className="flex-1 text-xs"><Mail size={14} className="mr-1" /> Email</Button>
                <Button onClick={handleTwitterShare} variant="outline" className="flex-1 text-xs"><MessageCircle size={14} className="mr-1" /> Twitter</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* RSVP Requirements Form Modal */}
        <Dialog open={showRsvpForm} onOpenChange={setShowRsvpForm}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Confirm Your Attendance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {event?.requirements_info && (
                <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
                  <p className="text-xs font-semibold text-foreground mb-2">Event Requirements:</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{event.requirements_info}</p>
                </div>
              )}
              <div>
                <Label className="text-xs font-semibold block mb-2">
                  {event?.requirements_info ? "Your response" : "Optional note"}
                </Label>
                <Textarea
                  value={rsvpResponse}
                  onChange={(e) => setRsvpResponse(e.target.value)}
                  placeholder={event?.requirements_info ? "Fill in the required information above..." : "Add any notes (optional)"}
                  className="text-xs h-24 resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => { setShowRsvpForm(false); setRsvpResponse(""); }} className="text-xs">
                  Cancel
                </Button>
                <Button onClick={confirmRsvp} className="text-xs">
                  Confirm RSVP
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Thank You Modal */}
        <Dialog open={showThankYouModal} onOpenChange={setShowThankYouModal}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Thank Your Attendees</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Send a message to {attendees.length} attendee{attendees.length !== 1 ? 's' : ''}</p>
              <div>
                <Label className="text-xs font-semibold block mb-2">Message</Label>
                <Textarea
                  value={thankYouMessage}
                  onChange={(e) => setThankYouMessage(e.target.value)}
                  placeholder="Thank you for attending! It was great seeing you there..."
                  className="text-xs h-24 resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => { setShowThankYouModal(false); setThankYouMessage(""); }} className="text-xs">
                  Cancel
                </Button>
                <Button onClick={() => sendThankYou.mutate()} disabled={sendThankYou.isPending} className="text-xs">
                  {sendThankYou.isPending ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Event Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold block mb-2">Title</Label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold block mb-2">Description</Label>
                <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="text-xs h-20 resize-none" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowEditModal(false)} className="text-xs">Cancel</Button>
                <Button onClick={() => updateEvent.mutate()} disabled={updateEvent.isPending} className="text-xs">
                  {updateEvent.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel Event Modal */}
        <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Cancel Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <p className="text-xs text-destructive font-medium">This action cannot be undone. All attendees will be notified.</p>
              </div>
              <div>
                <Label className="text-xs font-semibold block mb-2">Cancellation Reason</Label>
                <Textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Tell attendees why the event is cancelled..."
                  className="text-xs h-24 resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => { setShowCancelModal(false); setCancellationReason(""); }} className="text-xs">
                  Don't Cancel
                </Button>
                <Button variant="destructive" onClick={() => cancelEvent.mutate()} disabled={cancelEvent.isPending || !cancellationReason.trim()} className="text-xs">
                  {cancelEvent.isPending ? "Cancelling..." : "Cancel Event"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <ReportDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          entityType="event"
          entityId={eventId || ""}
          reportedUserId={event.user_id}
          entityTitle={event.title}
          entityLabel="event"
        />
      </motion.div>
    </div>
  );
}
