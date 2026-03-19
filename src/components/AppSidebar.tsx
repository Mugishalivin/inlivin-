import {
  Home, FolderOpen, MessageCircle, Compass, Settings, LogOut, User,
  Bell, Globe, Calendar, BarChart3, Bookmark
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
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

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Feed", url: "/feed", icon: Globe },
  { title: "Projects", url: "/projects", icon: FolderOpen },
  { title: "Messages", url: "/messages", icon: MessageCircle },
  { title: "Explore", url: "/explore", icon: Compass },
];

const secondaryNav = [
  { title: "Events", url: "/events", icon: Calendar },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Bookmarks", url: "/bookmarks", icon: Bookmark },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const bottomNav = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

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

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const renderNavItems = (items: typeof mainNav) =>
    items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            end
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            activeClassName="bg-primary/10 text-primary font-semibold"
          >
            <div className="relative">
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {item.title === "Notifications" && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary" />
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
              </span>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="pt-4">
        {/* Brand */}
        <div className={`px-4 mb-6 ${collapsed ? "text-center" : ""}`}>
          <a href="/dashboard" className="font-display text-xl font-extrabold text-sidebar-foreground">
            {collapsed ? (
              <span className="text-primary text-2xl">i.</span>
            ) : (
              <>inlivin<span className="text-primary">.</span></>
            )}
          </a>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
            {!collapsed && "Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(mainNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
            {!collapsed && "More"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(secondaryNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(bottomNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={16} className="text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.display_name || "Artist"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {profile?.username ? `@${profile.username}` : "Set username"}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={handleSignOut}>
              <LogOut size={14} />
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="icon" className="w-full" onClick={handleSignOut}>
            <LogOut size={16} />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
