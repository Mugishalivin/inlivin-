import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, Heart, MessageCircle, UserPlus, Calendar, FolderOpen, Users } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const typeIcons: Record<string, any> = {
  follow: UserPlus,
  like: Heart,
  comment: MessageCircle,
  message: MessageCircle,
  event: Calendar,
  collaboration: Users,
  default: Bell,
};

const typeRoutes: Record<string, (refType?: string | null, refId?: string | null) => string> = {
  follow: (_rt, refId) => `/profile/${refId}`,
  like: (_rt, refId) => `/projects`,
  comment: (_rt, refId) => `/feed`,
  message: () => `/messages`,
  event: (_rt, refId) => `/events`,
  collaboration: (_rt, refId) => `/projects`,
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", user!.id).eq("is_read", false);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const handleNotificationClick = (notif: any) => {
    if (!notif.is_read) markRead.mutate(notif.id);
    const routeFn = typeRoutes[notif.type];
    if (routeFn) {
      navigate(routeFn(notif.reference_type, notif.reference_id));
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">
            Notifications<span className="text-primary">.</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
            <Check size={14} /> Mark all read
          </Button>
        )}
      </motion.div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-1">
          {notifications.map((notif, idx) => {
            const Icon = typeIcons[notif.type] || typeIcons.default;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                  notif.is_read ? "hover:bg-secondary/30" : "bg-primary/5 hover:bg-primary/10"
                }`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  notif.is_read ? "bg-secondary" : "bg-primary/10"
                }`}>
                  <Icon size={16} className={notif.is_read ? "text-muted-foreground" : "text-primary"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notif.is_read ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                    {notif.title}
                  </p>
                  {notif.message && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.message}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">{formatTime(notif.created_at)}</p>
                </div>
                {!notif.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-border/50 border-dashed">
            <CardContent className="py-16 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Bell size={28} className="text-primary" />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-1">No notifications</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                When someone follows you, likes your work, or sends a message, you'll see it here.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
