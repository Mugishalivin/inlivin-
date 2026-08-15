import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Shield } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppLayout() {
  const { impersonationTarget, stopImpersonation, setAdminViewMode, authRole, readOnlyPreview } = useAuth();
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full">
        {/* Sidebar handles its own mobile sheet internally */}
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {impersonationTarget && (
            <div className="border-b border-primary/20 bg-primary/10 px-4 py-2 text-sm text-foreground">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Previewing as {impersonationTarget.label}
                  {readOnlyPreview && <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Read only</span>}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border bg-background text-foreground hover:bg-secondary"
                  onClick={() => {
                    stopImpersonation();
                    if (authRole === "admin") setAdminViewMode("admin");
                  }}
                >
                  Exit preview
                </Button>
              </div>
            </div>
          )}
          {/* Top header */}
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9" />
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
