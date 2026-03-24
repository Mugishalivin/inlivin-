import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2, Flag, UserPlus, Check, MapPin, Calendar, Users,
  Edit, Trash2, MoreVertical, Copy, Lock, Search, Mail, MessageSquare
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EventCardProps {
  event: any;
  isOwner: boolean;
  isJoined: boolean;
  attendeeCount: number;
  creatorName: string;
  onEdit: (event: any) => void;
  onDelete: (id: string) => void;
  index?: number;
}

export function EventCard({
  event,
  isOwner,
  isJoined,
  attendeeCount,
  creatorName,
  onEdit,
  onDelete,
  index = 0,
}: EventCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isHovered, setIsHovered] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMessage, setShareMessage] = useState(`Check out this event: ${event.title}`);
  const [searchQuery, setSearchQuery] = useState("");

  const eventDate = new Date(event.event_date);
  const formattedDate = eventDate.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = eventDate.toLocaleTimeString("en", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const shareUrl = `${window.location.origin}/events/${event.id}`;

  // RSVP/Join mutation
  const rsvpMutation = useMutation({
    mutationFn: async () => {
      if (isJoined) {
        const { error } = await supabase
          .from("event_rsvps")
          .delete()
          .eq("event_id", event.id)
          .eq("user_id", user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_rsvps").insert({
          event_id: event.id,
          user_id: user!.id,
          status: "going",
        });
        if (error) throw error;
        // Send notification to event creator
        try {
          await supabase.from("notifications").insert({
            user_id: event.user_id,
            title: "New RSVP",
            message: `${user?.user_metadata?.name || "Someone"} is joining your event: ${event.title}`,
            type: "event",
            reference_id: event.id,
            reference_type: "event",
          });
        } catch (notifErr) {
          // Silently fail - notification not critical
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-rsvps"] });
      queryClient.invalidateQueries({ queryKey: ["rsvp-counts"] });
      toast.success(isJoined ? "Removed from event" : "Joined event!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Share button
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Event link copied to clipboard!");
      setShowShareModal(false);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // Share via email
  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Check out this event: ${event.title}`);
    const body = encodeURIComponent(`${shareMessage}\n\n${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // Share on social
  const handleTwitterShare = () => {
    const text = encodeURIComponent(`${shareMessage} ${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  // Report button
  const handleReport = async () => {
    setIsReporting(true);
    try {
      await supabase.from("notifications").insert({
        user_id: event.user_id,
        title: "Event Reported",
        message: `Event "${event.title}" was reported by a user.`,
        type: "report",
        reference_id: event.id,
        reference_type: "event",
      });
      toast.success("Event reported. Thank you!");
      setIsReporting(false);
    } catch (err: any) {
      toast.success("Event reported. Thank you!");
      setIsReporting(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative group overflow-hidden rounded-3xl bg-slate-900 shadow-lg hover:shadow-2xl transition-all duration-300 h-96 md:h-[550px] cursor-pointer"
      >
        {/* MASSIVE Background Image - Takes up entire card */}
        <div className="absolute inset-0 overflow-hidden">
          {event.cover_url ? (
            <img
              src={event.cover_url}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-accent/30 to-slate-900 flex items-center justify-center">
              <Calendar size={120} className="text-slate-600/30" />
            </div>
          )}
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/5 to-black/60" />
        </div>

        {/* Owner Menu - Top Right (always visible) */}
        {isOwner && (
          <div className="absolute top-4 right-4 z-50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 bg-white/20 backdrop-blur hover:bg-white/30 text-white"
                >
                  <MoreVertical size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(event)}>
                  <Edit size={14} className="mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(event.id)}
                >
                  <Trash2 size={14} className="mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Your Event Badge */}
        {isOwner && (
          <div className="absolute top-4 left-4 z-50">
            <span className="px-3 py-1.5 rounded-full bg-primary/90 backdrop-blur text-xs font-semibold text-primary-foreground">
              ✨ Your Event
            </span>
          </div>
        )}

        {/* Minimal Bottom Info - Very Small */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent p-4 z-40">
          <h3 className="font-display font-bold text-lg text-white line-clamp-2 mb-1">
            {event.title}
          </h3>
          <div className="flex flex-wrap gap-3 text-white/80 text-xs">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {formattedDate}
            </span>
            {event.location && (
              <span className="flex items-center gap-1 line-clamp-1">
                <MapPin size={12} />
                {event.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users size={12} />
              {attendeeCount}
            </span>
          </div>
        </div>

        {/* Hover Button Overlay - Center (appears on hover) */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-45"
            >
              {/* Join Button */}
              <motion.div
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    rsvpMutation.mutate();
                  }}
                  disabled={rsvpMutation.isPending}
                  size="lg"
                  className={`font-bold text-base px-8 transition-all ${
                    isJoined
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }`}
                >
                  {rsvpMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />
                      Joining...
                    </>
                  ) : isJoined ? (
                    <>
                      <Check size={18} className="mr-2" /> Going
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} className="mr-2" /> Join Event
                    </>
                  )}
                </Button>
              </motion.div>

              {/* Report Button (only if not owner) */}
              {!isOwner && (
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReport();
                    }}
                    disabled={isReporting}
                    variant="outline"
                    size="lg"
                    className="bg-red-500/20 border-red-400/50 hover:bg-red-500/30 text-red-300 hover:text-red-200 font-bold text-base px-8"
                  >
                    {isReporting ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-red-300/30 border-t-red-300 animate-spin mr-2" />
                        Reporting...
                      </>
                    ) : (
                      <>
                        <Flag size={18} className="mr-2" /> Report
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Share Button - Bottom Right (always visible) */}
        <div className="absolute bottom-5 right-5 z-50">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setShowShareModal(true);
              }}
              size="icon"
              className="h-12 w-12 rounded-full bg-primary/90 hover:bg-primary text-white shadow-lg"
            >
              <Share2 size={20} />
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Enhanced Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Share Event</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Event Preview */}
            <div className="bg-secondary/50 rounded-lg p-2 border border-border/50">
              <h4 className="font-semibold text-xs mb-0.5">{event.title}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {event.description || "Join us for this amazing event!"}
              </p>
            </div>

            {/* Share Message */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                Share Message
              </label>
              <textarea
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                className="w-full p-2 rounded-lg bg-secondary/50 border border-border text-xs resize-none h-16 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Write your message..."
              />
            </div>

            {/* Event Link */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                Event Link
              </label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="text-xs bg-secondary/50"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>

            {/* Share Options */}
            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-xs font-semibold text-muted-foreground">Share via</p>

              {/* Email Share */}
              <Button
                onClick={handleEmailShare}
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <Mail size={16} />
                Email
              </Button>

              {/* Twitter Share */}
              <Button
                onClick={handleTwitterShare}
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <MessageSquare size={16} />
                Twitter/X
              </Button>

              {/* Web Share API Fallback */}
              {navigator.share && (
                <Button
                  onClick={async () => {
                    try {
                      await navigator.share({
                        title: event.title,
                        text: shareMessage,
                        url: shareUrl,
                      });
                      setShowShareModal(false);
                    } catch (err) {
                      if ((err as any).name !== "AbortError") {
                        toast.error("Failed to share");
                      }
                    }
                  }}
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <Share2 size={16} />
                  More Options
                </Button>
              )}
            </div>

            {/* Login Suggestion - only if not logged in */}
            {!user && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 flex gap-2">
                <Lock size={16} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-primary mb-1">
                    Login to attend events
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Sign in to RSVP and connect with other artists.
                  </p>
                </div>
              </div>
            )}

            {/* Search Suggestion */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                Find Similar Events
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by category or keyword..."
                  className="pl-9 text-xs bg-secondary/50"
                />
              </div>
              {searchQuery && (
                <p className="text-[11px] text-muted-foreground mt-2">
                  💡 Try searching: music, art, workshop, online...
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
