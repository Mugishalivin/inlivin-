import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Check, Heart, MessageCircle, MoreVertical, Trash2, UserPlus, Calendar, Users, Sparkles, Flag } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserAvatar } from "@/components/UserLink";

const typeIcons: Record<string, any> = {
  follow: UserPlus,
  like: Heart,
  comment: MessageCircle,
  message: MessageCircle,
  event: Calendar,
  report: Flag,
  collaboration: Users,
  tip: Sparkles,
  default: Bell,
};

const referenceRoutes: Record<string, (refId: string) => string> = {
  user: (refId) => `/profile/${refId}`,
  project: (refId) => `/projects/${refId}`,
  event: (refId) => `/events/${refId}`,
  conversation: () => `/messages`,
  announcement: (refId) => `/content/announcement/${refId}`,
  promotion: (refId) => `/content/promotion/${refId}`,
  ad: (refId) => `/content/ad/${refId}`,
  item: (refId) => `/marketplace/${refId}`,
  selling_item: (refId) => `/marketplace/${refId}`,
  selling: (refId) => `/marketplace/${refId}`,
};

const typeFallbackRoutes: Record<string, string> = {
  follow: "/search",
  like: "/projects",
  comment: "/feed",
  message: "/messages",
  event: "/events",
  collaboration: "/network",
  report: "/dashboard",
};

const getNotificationRoute = (notif: any) => {
  if (notif.reference_type && notif.reference_id) {
    const routeFn = referenceRoutes[notif.reference_type];
    if (routeFn) return routeFn(notif.reference_id);
  }

  if (notif.type === "event" && notif.reference_id) return `/events/${notif.reference_id}`;
  if (notif.type === "collaboration" && notif.reference_id) return `/projects/${notif.reference_id}`;
  return typeFallbackRoutes[notif.type] || "/notifications";
};

const firstImage = (...urls: Array<string | null | undefined>) => urls.find(Boolean) || null;

const firstArrayImage = (urls: unknown) => Array.isArray(urls) ? urls.find(Boolean) || null : null;

// Function to get the image URL for the entity a notification points to.
const getNotificationImage = async (notif: any): Promise<string | null> => {
  try {
    if (!notif.reference_id) return null;

    if (notif.reference_type === "user") {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", notif.reference_id)
        .single();
      return data?.avatar_url || null;
    }

    if (notif.reference_type === "event" || notif.type === "event" || notif.type === "rsvp") {
      const { data } = await supabase
        .from("events")
        .select("cover_url")
        .eq("id", notif.reference_id)
        .single();

      if (data?.cover_url) return data.cover_url;

      const { data: media } = await supabase
        .from("event_media")
        .select("media_url")
        .eq("event_id", notif.reference_id)
        .eq("media_type", "image")
        .order("display_order", { ascending: true })
        .limit(1)
        .maybeSingle();
      return media?.media_url || null;
    }

    if (notif.reference_type === "project" || notif.type === "project" || notif.type === "collaboration") {
      const { data } = await supabase
        .from("projects")
        .select("cover_url")
        .eq("id", notif.reference_id)
        .single();

      if (data?.cover_url) return data.cover_url;

      const { data: media } = await supabase
        .from("project_media")
        .select("file_url, file_type")
        .eq("project_id", notif.reference_id)
        .ilike("file_type", "image/%")
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle();
      return media?.file_url || null;
    }

    if (notif.reference_type === "selling_item" || notif.reference_type === "selling" || notif.reference_type === "item" || notif.type === "item_reported" || notif.type === "item") {
      const { data } = await supabase
        .from("selling_items")
        .select("image_url, images_urls")
        .eq("id", notif.reference_id)
        .single();
      return firstImage(data?.image_url, firstArrayImage(data?.images_urls));
    }

    if (notif.reference_type === "announcement") {
      const { data } = await (supabase as any)
        .from("announcements")
        .select("media_url")
        .eq("id", notif.reference_id)
        .single();
      return data?.media_url || null;
    }

    if (notif.reference_type === "promotion") {
      const { data } = await (supabase as any)
        .from("promotions")
        .select("media_url")
        .eq("id", notif.reference_id)
        .single();
      return data?.media_url || null;
    }

    if (notif.reference_type === "ad") {
      const { data } = await (supabase as any)
        .from("ads")
        .select("image_url, media_url")
        .eq("id", notif.reference_id)
        .single();
      return firstImage(data?.media_url, data?.image_url);
    }

    return null;
  } catch (err) {
    console.error('Error fetching notification image:', err);
    return null;
  }
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
    enabled: !!user,
  });

  // Fetch profiles for notification actors
  const actorIds = [...new Set(notifications.filter(n => n.reference_type === "user" && n.reference_id).map(n => n.reference_id!))];
  const { data: actorProfiles = {} } = useQuery({
    queryKey: ["notif-actors", actorIds],
    queryFn: async () => {
      const result: Record<string, any> = {};
      for (const uid of actorIds) {
        const { data } = await supabase.from("profiles").select("display_name, avatar_url, user_id").eq("user_id", uid).single();
        if (data) result[uid] = data;
      }
      return result;
    },
    enabled: actorIds.length > 0,
  });

  // Fetch images for notifications with media
  const { data: notificationImages = {} } = useQuery({
    queryKey: ["notif-images", notifications.map(n => n.id).join(',')],
    queryFn: async () => {
      const result: Record<string, string | null> = {};
      for (const notif of notifications) {
        const imageUrl = await getNotificationImage(notif);
        result[notif.id] = imageUrl;
      }
      return result;
    },
    enabled: notifications.length > 0,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notif-count"] });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notif-count"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", user!.id).eq("is_read", false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notif-count"] });
    },
  });

  const handleNotificationClick = (notif: any) => {
    if (!notif.is_read) markRead.mutate(notif.id);
    navigate(getNotificationRoute(notif));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
    return d.toLocaleDateString();
  };

  // Group: Today, This Week, Earlier
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = todayStart - 6 * 86400000;

  const grouped = {
    today: notifications.filter(n => new Date(n.created_at).getTime() >= todayStart),
    thisWeek: notifications.filter(n => { const t = new Date(n.created_at).getTime(); return t >= weekStart && t < todayStart; }),
    earlier: notifications.filter(n => new Date(n.created_at).getTime() < weekStart),
  };

  const renderGroup = (label: string, items: any[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">{label}</p>
        <div className="space-y-0.5">
          {items.map((notif, idx) => {
            const Icon = typeIcons[notif.type] || typeIcons.default;
            const actorProfile = notif.reference_type === "user" && notif.reference_id ? actorProfiles[notif.reference_id] : null;
            const notifImage = notificationImages[notif.id];
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors cursor-pointer ${
                  notif.is_read ? "hover:bg-secondary/40" : "bg-primary/[0.04] hover:bg-primary/[0.08]"
                }`}
                onClick={() => handleNotificationClick(notif)}
              >
                {/* Avatar or icon or notification image */}
                {notifImage ? (
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0 overflow-hidden border border-border">
                    <img src={notifImage} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : actorProfile ? (
                  <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                    {actorProfile.avatar_url ? (
                      <img src={actorProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Icon size={18} className={notif.is_read ? "text-muted-foreground" : "text-primary"} />
                    )}
                  </div>
                ) : (
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                    notif.is_read ? "bg-secondary" : "bg-primary/10"
                  }`}>
                    <Icon size={18} className={notif.is_read ? "text-muted-foreground" : "text-primary"} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] leading-tight ${notif.is_read ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                    {notif.title}
                  </p>
                  {notif.message && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{notif.message}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground">{formatTime(notif.created_at)}</span>
                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        aria-label="Notification actions"
                      >
                        <MoreVertical size={15} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                      {!notif.is_read && (
                        <DropdownMenuItem onClick={() => markRead.mutate(notif.id)}>
                          <Check size={14} className="mr-2" />
                          Mark as read
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => deleteNotification.mutate(notif.id)}
                      >
                        <Trash2 size={14} className="mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <h1 className="font-display text-xl md:text-2xl font-extrabold text-foreground">
          Notifications
        </h1>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => markAllRead.mutate()}>
            Mark all as read
          </Button>
        )}
      </motion.div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
              <div className="w-11 h-11 rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-2.5 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <>
          {renderGroup("Today", grouped.today)}
          {renderGroup("This Week", grouped.thisWeek)}
          {renderGroup("Earlier", grouped.earlier)}
        </>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center py-20">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Bell size={24} className="text-muted-foreground/40" />
          </div>
          <h3 className="font-display font-bold text-base text-foreground mb-1">No notifications yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            When someone follows you, likes your work, or invites you to collaborate, it'll show up here.
          </p>
        </motion.div>
      )}
    </div>
  );
}
