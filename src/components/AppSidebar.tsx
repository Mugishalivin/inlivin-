import {
  Home, FolderOpen, MessageCircle, Compass, Settings, LogOut, User,
  Bell, Globe, Calendar, BarChart3, Bookmark, Users, Megaphone,
  LayoutDashboard, FileText, Shield, Activity, Database, ArrowLeftRight,
  ShoppingCart, TrendingUp, Radio, Sparkles
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { getAdminBadgeMetrics, getBadgeCountForSection } from "@/lib/admin-badge-metrics";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { readUpdatesSeenAt } from "@/lib/update-feed";

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Posts", url: "/posts", icon: Globe },
  { title: "Projects", url: "/projects", icon: FolderOpen },
  { title: "Messages", url: "/messages", icon: MessageCircle },
  { title: "Explore", url: "/explore", icon: Compass },
];

const secondaryNav = [
  { title: "Events", url: "/events", icon: Calendar },
  { title: "Studio", url: "/studio", icon: Sparkles },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Bookmarks", url: "/bookmarks", icon: Bookmark },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Collaboration", url: "/network", icon: Users },
  { title: "Marketplace", url: "/marketplace", icon: ShoppingCart },
];

const getSecondaryNav = (role: string | null, adminViewMode: string | null, impersonationTarget: { userId: string; label: string } | null) => {
  const nav = [...secondaryNav];
  if (role === 'admin' && adminViewMode === "admin" && !impersonationTarget) {
    nav.push({ title: "Admin", url: "/admin/overview", icon: Users });
  }
  return nav;
};

const bottomNav = [
  { title: "Settings", url: "/settings", icon: Settings },
];

const adminReturnNav = [
  { title: "Return to Admin", url: "/admin/overview", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
];

const adminNav = [
  { title: "Overview", url: "/admin/overview", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Impersonate", url: "/admin/impersonate", icon: ArrowLeftRight },
  { title: "Content", url: "/admin/content", icon: FileText },
  { title: "Reports", url: "/admin/reports", icon: BarChart3 },
  { title: "Analytics", url: "/admin/analytics", icon: Database },
  { title: "Health", url: "/admin/health", icon: Activity },
  { title: "Badges", url: "/admin/badges", icon: Shield },
  { title: "Lookup", url: "/admin/lookup", icon: Compass },
  { title: "Settings", url: "/admin/settings", icon: Settings },

];

export function AppSidebar({ onItemSelected }: { onItemSelected?: () => void }) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, role, adminViewMode, impersonationTarget, signOut, setAdminViewMode } = useAuth();
  const [updatesSeenVersion, setUpdatesSeenVersion] = useState(0);

  const isActive = (path: string) => location.pathname === path;

  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
    onItemSelected?.();
  };

  const handleReturnToAdmin = () => {
    setAdminViewMode("admin");
    navigate("/admin/overview");
    closeMobile();
  };


  useEffect(() => {
    const refreshUpdatesSeen = () => setUpdatesSeenVersion((value) => value + 1);
    window.addEventListener("updates-seen-changed", refreshUpdatesSeen);
    return () => window.removeEventListener("updates-seen-changed", refreshUpdatesSeen);
  }, []);

  const updatesSeenAt = readUpdatesSeenAt(user?.id);

  // Unread notifications count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-notif-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const { data: updatesUnreadCount = 0 } = useQuery({
    queryKey: ["unread-updates-count", user?.id, updatesSeenAt, updatesSeenVersion],
    queryFn: async () => {
      if (!user?.id) return 0;

      const countFrom = async (table: "announcements" | "promotions" | "ads") => {
        let query = supabase.from(table).select("*", { count: "exact", head: true }).eq("is_active", true);
        if (updatesSeenAt) {
          query = query.gt("created_at", updatesSeenAt);
        }
        const { count } = await query;
        return count ?? 0;
      };

      const [announcementsCount, promotionsCount, adsCount] = await Promise.all([
        countFrom("announcements"),
        countFrom("promotions"),
        countFrom("ads"),
      ]);

      return announcementsCount + promotionsCount + adsCount;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  // Admin badge metrics
  const { data: adminMetrics = { unreadReports: 0, suspendedUsers: 0, bannedUsers: 0, flaggedContent: 0, pendingApprovals: 0, recentAuditLogs: 0, securityAlerts: 0, failedLoginAttempts: 0, totalAdminActions: 0 } } = useQuery({
    queryKey: ["admin-badge-metrics", adminViewMode],
    queryFn: getAdminBadgeMetrics,
    enabled: !!user && role === "admin" && adminViewMode === "admin",
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Helper function to get badge count for a nav item
  const getNavItemBadgeCount = (itemTitle: string): number => {
    const sectionMap: Record<string, keyof typeof adminMetrics> = {
      "Reports": "unreadReports",
      "Users": "suspendedUsers",
      "Content": "flaggedContent",
      "Security": "securityAlerts",
      "Monitoring": "recentAuditLogs",
      "Lookup": "totalAdminActions",
    };

    const metric = sectionMap[itemTitle];
    return metric ? (adminMetrics[metric] as number) : 0;
  };

  const renderNavItems = (items: typeof mainNav) =>
    items.map((item) => {
      // Special handler for "Return to Admin" button
      if (item.title === "Return to Admin") {
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild>
              <button
                onClick={handleReturnToAdmin}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
              >
                <div className="relative">
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                </div>
                {!collapsed && (
                  <span className="flex items-center gap-2">
                    {item.title}
                  </span>
                )}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      }

      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild>
            <NavLink
              to={item.url}
              end
              onClick={closeMobile}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              activeClassName="bg-primary/10 text-primary font-semibold"
            >
            <div className="relative">
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {(item.title === "Notifications" && unreadCount > 0) || (item.title === "Updates" && updatesUnreadCount > 0) ? (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary" />
              ) : null}
              {/* Admin badge indicator */}
              {adminViewMode === "admin" && adminNav.some(a => a.title === item.title) && getNavItemBadgeCount(item.title) > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              )}
            </div>
            {!collapsed && (
              <span className="flex items-center gap-2">
                {item.title}
                {item.title === "Notifications" && unreadCount > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 text-[10px] px-1.5">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
                {item.title === "Updates" && updatesUnreadCount > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 text-[10px] px-1.5">
                    {updatesUnreadCount > 9 ? "9+" : updatesUnreadCount}
                  </Badge>
                )}
                {/* Admin section badges */}
                {adminViewMode === "admin" && adminNav.some(a => a.title === item.title) && (() => {
                  const badgeCount = getNavItemBadgeCount(item.title);
                  if (badgeCount > 0) {
                    return (
                      <Badge variant="destructive" className="h-5 min-w-5 text-[10px] px-1.5">
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </Badge>
                    );
                  }
                  return null;
                })()}
              </span>
            )}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="pt-4 flex flex-col h-full">
        {/* Brand */}
        <div className={`px-4 mb-6 shrink-0 ${collapsed ? "text-center" : ""}`}>
          <a href="/dashboard" className="font-display text-xl font-extrabold text-sidebar-foreground">
            {collapsed ? (
              <span className="text-primary text-2xl">i.</span>
            ) : (
              <>inlivin<span className="text-primary">.</span></>
            )}
          </a>
        </div>

        {/* Scrollable Navigation Area */}
        <div className={`flex-1 ${collapsed ? "overflow-hidden" : "overflow-y-auto"} overflow-x-hidden pr-2`}>
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
              {!collapsed && "Menu"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminViewMode === "admin" && !impersonationTarget ? renderNavItems(adminNav) : renderNavItems(mainNav)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {adminViewMode === "admin" && !impersonationTarget ? null : (
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                {!collapsed && "More"}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>{renderNavItems(getSecondaryNav(role, adminViewMode, impersonationTarget))}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>{renderNavItems((role === 'admin' && adminViewMode === 'user') ? adminReturnNav : bottomNav)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-0">
        {!collapsed ? (
          <Link
            to={user ? `/profile/${user.id}` : "/settings"}
            className="flex items-center gap-3 p-4 hover:bg-sidebar-accent/50 transition-colors cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-border group-hover:ring-primary/30 transition-all">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={18} className="text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">
                {profile?.display_name || "Artist"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {profile?.username ? `@${profile.username}` : user?.email?.split("@")[0]}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSignOut(); }}
            >
              <LogOut size={14} />
            </Button>
          </Link>
        ) : (
          <div className="p-3 flex flex-col items-center gap-2">
            <Link to={user ? `/profile/${user.id}` : "/settings"}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden ring-2 ring-border hover:ring-primary/30 transition-all">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={14} className="text-muted-foreground" />
                )}
              </div>
            </Link>
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={handleSignOut}>
              <LogOut size={14} />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
