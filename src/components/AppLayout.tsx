import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export function AppLayout() {
  const { impersonationTarget, stopImpersonation, setAdminViewMode, authRole, readOnlyPreview } = useAuth();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, []);

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full">
        {/* Desktop sidebar */}
        {!isMobile && <AppSidebar onItemSelected={() => {}} />}

        {/* Mobile sidebar via Sheet */}
        {isMobile && (
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="p-0 w-[280px] border-r border-border">
              <div className="h-full overflow-y-auto">
                <AppSidebar onItemSelected={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        )}

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
              {isMobile ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileOpen(true)}
                  className="h-8 w-8 p-0"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              ) : (
                <SidebarTrigger className="h-8 w-8" />
              )}
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
