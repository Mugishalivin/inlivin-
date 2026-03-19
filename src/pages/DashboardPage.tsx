import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User, FolderOpen, MessageCircle, Users, Compass, Zap,
  TrendingUp, Sparkles, ArrowRight, Heart, Calendar, Bell,
  Globe, BarChart3, Bookmark
} from "lucide-react";

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { count: followers } = await supabase
        .from("connections").select("*", { count: "exact", head: true }).eq("following_id", user!.id);
      const { count: projects } = await supabase
        .from("projects").select("*", { count: "exact", head: true }).eq("user_id", user!.id);
      const { count: unreadNotifs } = await supabase
        .from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user!.id).eq("is_read", false);

      const { data: convoParts } = await supabase
        .from("conversation_participants").select("conversation_id").eq("user_id", user!.id);
      const convos = convoParts?.length ?? 0;

      return {
        followers: followers ?? 0,
        projects: projects ?? 0,
        notifications: unreadNotifs ?? 0,
        conversations: convos,
      };
    },
    enabled: !!user,
  });

  // Recent activity from notifications
  const { data: recentActivity = [] } = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: !!user,
  });

  // Upcoming events
  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ["dashboard-events"],
    queryFn: async () => {
      const { data: rsvps } = await supabase
        .from("event_rsvps").select("event_id").eq("user_id", user!.id);
      if (!rsvps?.length) return [];
      const ids = rsvps.map(r => r.event_id);
      const { data: events } = await supabase
        .from("events").select("*").in("id", ids).gte("event_date", new Date().toISOString()).order("event_date", { ascending: true }).limit(3);
      return events ?? [];
    },
    enabled: !!user,
  });

  const quickActions = [
    { label: "New Project", icon: FolderOpen, href: "/projects", color: "text-primary" },
    { label: "Find Artists", icon: Compass, href: "/explore", color: "text-accent" },
    { label: "Messages", icon: MessageCircle, href: "/messages", color: "text-primary" },
    { label: "Feed", icon: Globe, href: "/feed", color: "text-accent" },
    { label: "Events", icon: Calendar, href: "/events", color: "text-primary" },
    { label: "Analytics", icon: BarChart3, href: "/analytics", color: "text-accent" },
  ];

  const activityIcons: Record<string, any> = {
    follow: Users, like: Heart, comment: MessageCircle, message: MessageCircle, event: Calendar, default: Sparkles,
  };

  const defaultActivity = [
    { id: "1", title: "Welcome to inlivin! Complete your profile to get discovered.", created_at: new Date().toISOString(), type: "default" },
    { id: "2", title: "Explore trending artists in your genre.", created_at: new Date().toISOString(), type: "default" },
    { id: "3", title: "Start your first project and share your vision.", created_at: new Date().toISOString(), type: "default" },
  ];

  const activityItems = recentActivity.length > 0 ? recentActivity : defaultActivity;

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">
          Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}
          <span className="text-primary">.</span>
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening in your creative world.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Followers", value: stats?.followers ?? 0, icon: Users, color: "text-primary" },
          { label: "Projects", value: stats?.projects ?? 0, icon: FolderOpen, color: "text-accent" },
          { label: "Conversations", value: stats?.conversations ?? 0, icon: MessageCircle, color: "text-primary" },
          { label: "Notifications", value: stats?.notifications ?? 0, icon: Bell, color: "text-accent" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50 bg-card hover:border-primary/20 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon size={18} className={stat.color} />
                <TrendingUp size={12} className="text-muted-foreground" />
              </div>
              <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Activity Feed + Quick Actions */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Zap size={18} className="text-primary" /> Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {activityItems.map((item: any) => {
                const Icon = activityIcons[item.type] || activityIcons.default;
                return (
                  <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={14} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Upcoming events */}
          {upcomingEvents.length > 0 && (
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <Calendar size={16} className="text-accent" /> Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcomingEvents.map((event: any) => (
                  <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-accent">{new Date(event.event_date).toLocaleDateString("en", { month: "short" })}</span>
                      <span className="text-xs font-bold text-foreground">{new Date(event.event_date).getDate()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{event.title}</p>
                      {event.location && <p className="text-[11px] text-muted-foreground">{event.location}</p>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.href)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:bg-primary/5 transition-all group"
              >
                <action.icon size={20} className={`${action.color} group-hover:scale-110 transition-transform`} />
                <span className="text-[11px] font-medium text-foreground">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Profile Card */}
        <div className="space-y-4">
          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-3 overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} className="text-muted-foreground" />
                  )}
                </div>
                <h3 className="font-display font-bold text-foreground">
                  {profile?.display_name || "Artist"}
                </h3>
                {profile?.username && (
                  <p className="text-xs text-muted-foreground">@{profile.username}</p>
                )}
                {profile?.location && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">{profile.location}</p>
                )}
              </div>

              {profile?.bio && (
                <p className="text-xs text-muted-foreground text-center mb-3 line-clamp-3">{profile.bio}</p>
              )}

              {profile?.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                  {profile.skills.slice(0, 4).map((s) => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <Button
                variant="hero-outline"
                size="sm"
                className="w-full"
                onClick={() => navigate("/settings")}
              >
                Edit Profile <ArrowRight size={14} />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="p-5 text-center">
              <Compass size={28} className="text-accent mx-auto mb-2" />
              <h4 className="font-display font-bold text-sm text-foreground mb-1">Discover Artists</h4>
              <p className="text-[11px] text-muted-foreground mb-3">
                Find collaborators, connect with creators in your genre.
              </p>
              <Button variant="hero" size="sm" className="w-full" onClick={() => navigate("/explore")}>
                Explore <ArrowRight size={14} />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
