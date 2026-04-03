import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { ArrowRightLeft, BarChart3, Database, FileClock, LayoutDashboard, Menu, MonitorUp, Moon, PanelLeftClose, PanelLeftOpen, Rocket, Shield, SlidersHorizontal, SunMedium, Users2, Workflow } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const adminNav = [
  { title: "Overview", url: "/admin/overview", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users2 },
  { title: "Impersonate", url: "/admin/impersonate", icon: ArrowRightLeft },
  { title: "Content", url: "/admin/content", icon: Database },
  { title: "Reports", url: "/admin/reports", icon: FileClock },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Audit", url: "/admin/audit", icon: FileClock },
  { title: "Monitoring", url: "/admin/monitoring", icon: MonitorUp },
  { title: "Operations", url: "/admin/operations", icon: Rocket },
  { title: "Security", url: "/admin/security", icon: Shield },
  { title: "Integrations", url: "/admin/integrations", icon: SlidersHorizontal },
  { title: "Workflows", url: "/admin/workflows", icon: Workflow },
];

export function AdminShell() {
  const { profile, role, adminViewMode, setAdminViewMode, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") return stored;
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  });

  useEffect(() => {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", theme);
    window.dispatchEvent(new Event("themechange"));
  }, [theme]);

  useEffect(() => {
    const channel = supabase.channel("admin-realtime-shell");
    const tables = [
      "profiles",
      "user_roles",
      "projects",
      "notifications",
      "call_sessions",
      "announcements",
      "promotions",
      "ads",
      "admin_audit_logs",
      "admin_feature_flags",
      "admin_command_history",
      "admin_workflow_states",
      "admin_alert_rules",
      "admin_integrations",
      "admin_monitoring_events",
      "admin_impersonation_sessions",
      "user_reports",
    ];
    tables.forEach((table) => {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin"] });
      });
    });
    void channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const switchToUserMode = async () => {
    setAdminViewMode("user");
    navigate("/dashboard");
  };

  return (
    <div className="admin-surface min-h-screen bg-background text-foreground" data-theme-mode={theme}>
      <div className="mx-auto flex min-h-screen max-w-[1900px] gap-6 px-4 py-4 lg:px-6">
        {sidebarOpen && (
          <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[280px] shrink-0 flex-col rounded-[28px] border border-border bg-card/95 p-4 shadow-sm backdrop-blur-xl lg:flex">
          <div className="mb-6 rounded-[24px] border border-border bg-background/70 p-4">
            <div className="text-xs uppercase tracking-[0.35em] text-primary/70">Admin Plane</div>
            <div className="mt-2 text-2xl font-black text-foreground">Control center</div>
            <div className="mt-1 text-sm text-muted-foreground">Fast navigation, tables, workflows, and live system operations.</div>
          </div>

          <nav className="space-y-1">
            {adminNav.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeClassName="bg-primary/10 text-primary ring-1 ring-primary/20"
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto space-y-3">
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Current mode</div>
              <div className="mt-2 flex items-center gap-2">
                <Badge className="border-border bg-secondary text-foreground">{adminViewMode ?? "unset"}</Badge>
                <Badge className={cn("border-border bg-secondary", role === "admin" ? "text-primary" : "text-foreground")}>
                  {role ?? "user"}
                </Badge>
              </div>
            </div>
            <Button variant="outline" className="w-full border-border bg-background text-foreground hover:bg-secondary" onClick={switchToUserMode}>
              View as user
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground hover:bg-secondary hover:text-foreground" onClick={signOut}>
              Sign out
            </Button>
          </div>
          </aside>
        )}

        <main className="min-w-0 flex-1">
          <div className="mb-5 flex items-center justify-between gap-4 rounded-[28px] border border-border bg-card/95 px-5 py-4 shadow-sm backdrop-blur-xl lg:px-6">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 border-border bg-background text-foreground hover:bg-secondary"
                onClick={() => setSidebarOpen((current) => !current)}
                title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              >
                {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              </Button>
              <div>
                <div className="text-xs uppercase tracking-[0.35em] text-primary/70">Administration</div>
                <div className="mt-1 text-2xl font-black text-foreground">Expanded system console</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {profile?.display_name || profile?.username || "Administrator"} is controlling the platform from the admin plane.
                </div>
              </div>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <Badge className="border-border bg-secondary text-foreground">RLS protected</Badge>
              <Badge className="border-border bg-secondary text-foreground">RBAC</Badge>
              <Badge className="border-border bg-secondary text-foreground">Audit logged</Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden rounded-full border border-border bg-background p-1 sm:flex">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${theme === "light" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <SunMedium className="mr-1 inline h-3.5 w-3.5" />
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${theme === "dark" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Moon className="mr-1 inline h-3.5 w-3.5" />
                  Dark
                </button>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 border-border bg-background text-foreground hover:bg-secondary lg:hidden"
                onClick={() => setSidebarOpen((current) => !current)}
                title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2 rounded-[24px] border border-border bg-card/95 p-3 shadow-sm backdrop-blur-xl lg:hidden">
            {adminNav.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs text-muted-foreground"
                activeClassName="border-primary/30 bg-primary/10 text-primary"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.title}
              </NavLink>
            ))}
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  );
}
