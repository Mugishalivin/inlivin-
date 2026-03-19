import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User, FolderOpen, MessageCircle, Users, Compass, Zap,
  TrendingUp, Music, Sparkles, ArrowRight
} from "lucide-react";

const quickActions = [
  { label: "New Project", icon: FolderOpen, href: "/projects", color: "text-primary" },
  { label: "Find Artists", icon: Compass, href: "/explore", color: "text-accent" },
  { label: "Messages", icon: MessageCircle, href: "/messages", color: "text-primary" },
];

const activityFeed = [
  { id: 1, text: "Welcome to inlivin! Complete your profile to get discovered.", time: "Just now", icon: Sparkles },
  { id: 2, text: "Explore trending artists in your genre.", time: "Tip", icon: TrendingUp },
  { id: 3, text: "Start your first project and share your vision.", time: "Tip", icon: Music },
];

export default function DashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

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
          { label: "Connections", value: "0", icon: Users, trend: "+0" },
          { label: "Projects", value: "0", icon: FolderOpen, trend: "+0" },
          { label: "Messages", value: "0", icon: MessageCircle, trend: "0 new" },
          { label: "Profile Views", value: "0", icon: TrendingUp, trend: "—" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50 bg-card hover:border-primary/20 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon size={18} className="text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">{stat.trend}</span>
              </div>
              <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Zap size={18} className="text-primary" /> Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {activityFeed.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{item.text}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.href)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:bg-primary/5 transition-all group"
              >
                <action.icon size={22} className={`${action.color} group-hover:scale-110 transition-transform`} />
                <span className="text-xs font-medium text-foreground">{action.label}</span>
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

          {/* Discover teaser */}
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
