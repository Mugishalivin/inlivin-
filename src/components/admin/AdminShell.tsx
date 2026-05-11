import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { BarChart3, Bell, Database, FileText, HeartPulse, LayoutDashboard, Medal, Menu, Moon, PanelLeftClose, PanelLeftOpen, Settings, SunMedium, Users2, X, ArrowRightLeft, FileClock, ChevronRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { applyThemePreference, getStoredThemePreference, type ThemePreference } from "@/lib/theme";
import { useIsMobile } from "@/hooks/use-mobile";

const adminSections = [
  {
    label: "Control",
    items: [
      { title: "Overview", url: "/admin/overview", icon: LayoutDashboard },
      { title: "Users", url: "/admin/users", icon: Users2 },
      { title: "Impersonate", url: "/admin/impersonate", icon: ArrowRightLeft },
    ],
  },
  {
    label: "Content",
    items: [
      { title: "Content", url: "/admin/content", icon: Database },
      { title: "Notifications", url: "/admin/notifications", icon: Bell },
      { title: "Reports", url: "/admin/reports", icon: FileClock },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Health", url: "/admin/health", icon: HeartPulse },
      { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Configuration",
    items: [
      { title: "Badges", url: "/admin/badges", icon: Medal },
      { title: "Settings", url: "/admin/settings", icon: Settings },
    ],
  },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { profile, role, adminViewMode, setAdminViewMode, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="shrink-0 px-5 py-5">
        <div className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Admin</div>
        <div className="mt-1 text-lg font-black text-foreground">Control Center</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="space-y-5">
          {adminSections.map((section) => (
            <div key={section.label}>
              <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/60">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <NavLink
                      key={item.title}
                      to={item.url}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                      activeClassName=""
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.title}</span>
                      {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-border p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span>System online</span>
          <span className="ml-auto">{role}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => {
            setAdminViewMode("user");
            navigate("/dashboard");
            onNavigate?.();
          }}
        >
          Switch to User View
        </Button>
        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={signOut}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export function AdminShell() {
  const { profile, role, adminViewMode } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<ThemePreference>(() => getStoredThemePreference());

  useEffect(() => { applyThemePreference(theme); }, [theme]);

  useEffect(() => {
    const syncTheme = () => setTheme(getStoredThemePreference());
    syncTheme();
    window.addEventListener("storage", syncTheme);
    window.addEventListener("themechange", syncTheme as EventListener);
    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("themechange", syncTheme as EventListener);
    };
  }, []);

  useEffect(() => {
    const channel = supabase.channel("admin-realtime-shell");
    const tables = ["profiles", "projects", "notifications", "announcements", "promotions", "ads", "admin_audit_logs", "admin_feature_flags", "admin_command_history"];
    tables.forEach((table) => {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin"] });
      });
    });
    void channel.subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        {!isMobile && sidebarOpen && (
          <aside className="sticky top-0 h-screen w-[260px] shrink-0 border-r border-border bg-card/50 backdrop-blur-xl">
            <SidebarNav />
          </aside>
        )}

        {/* Mobile Sidebar */}
        {isMobile && (
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="w-[280px] p-0 border-r border-border">
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Top Bar */}
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-sm lg:px-6">
            <div className="flex items-center gap-3">
              {isMobile ? (
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMobileOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setSidebarOpen(!sidebarOpen)}>
                  {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                </Button>
              )}
              <div className="hidden sm:block">
                <span className="text-sm font-semibold text-foreground">
                  {profile?.display_name || "Administrator"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden rounded-lg border border-border bg-card p-0.5 sm:flex">
                <button
                  onClick={() => setTheme("light")}
                  className={cn("rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors", theme === "light" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  <SunMedium className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={cn("rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors", theme === "dark" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  <Moon className="h-3.5 w-3.5" />
                </button>
              </div>
              <Badge variant="outline" className="hidden md:inline-flex text-[10px]">RBAC</Badge>
              <Badge variant="outline" className="hidden md:inline-flex text-[10px]">Audit</Badge>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
