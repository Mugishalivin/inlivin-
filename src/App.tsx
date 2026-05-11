import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CallProvider } from "@/contexts/CallContext";
import { MinimizedCallPopup } from "@/components/MinimizedCallPopup";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import ContinueAsPage from "./pages/ContinueAsPage";
import { AdminShell } from "@/components/admin/AdminShell";
import AdminOverviewPage from "./pages/admin/AdminOverviewPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminContentPage from "./pages/admin/AdminContentPage";
import AdminImpersonatePage from "./pages/admin/AdminImpersonatePage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminLookupPage from "./pages/admin/AdminLookupPage";
import PowerfulAdminSettingsPage from "./pages/admin/PowerfulAdminSettingsPage";
import { AdminBadgesPage } from "./pages/admin/AdminBadgesPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import MessagesPage from "./pages/MessagesPage";
import ExplorePage from "./pages/ExplorePage";
import FeedPage from "./pages/FeedPage";
import PostsPage from "./pages/PostsPage";
import EventDetailPage from "./pages/EventDetailPage";
import CreateEventPage from "./pages/CreateEventPage";
import EventsPage from "./pages/EventsPage";
import NotificationsPage from "./pages/NotificationsPage";
import AdminNotificationsPage from "./pages/admin/AdminNotificationsPage";
import AdminHealthPage from "./pages/admin/AdminHealthPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import BookmarksPage from "./pages/BookmarksPage";
import SettingsPage from "./pages/SettingsPage";
import UserProfilePage from "./pages/UserProfilePage";
import ContentPipelinePage from "./pages/ContentPipelinePage";
import ContentDetailPage from "./pages/ContentDetailPage";
import UpdatesPage from "./pages/UpdatesPage";
import CreatorMarketplacePage from "./pages/CreatorMarketplacePage";
import MarketplacePage from "./pages/MarketplacePage";
import MarketplaceDetailPage from "./pages/MarketplaceDetailPage";
import CollaborationNetworkPage from "./pages/CollaborationNetworkPage";
import NotFound from "./pages/NotFound";
import { DocsIndexPage } from "./pages/docs/DocsIndexPage";
import { FeaturesPage } from "./pages/docs/FeaturesPage";
import { PricingPage } from "./pages/docs/PricingPage";
import { HelpCenterPage } from "./pages/docs/HelpCenterPage";
import { ApiDocsPage } from "./pages/docs/ApiDocsPage";
import { DiscordPage } from "./pages/docs/DiscordPage";
import { PrivacyPage } from "./pages/docs/PrivacyPage";
import { TermsPage } from "./pages/docs/TermsPage";
import { ChangelogPage } from "./pages/docs/ChangelogPage";
import { RoadmapPage } from "./pages/docs/RoadmapPage";
import { TwitterPage } from "./pages/docs/TwitterPage";
import { BlogPage } from "./pages/docs/BlogPage";
import { EventsPage as DocsEventsPage } from "./pages/docs/EventsPage";
import { TutorialsPage } from "./pages/docs/TutorialsPage";
import { StatusPage } from "./pages/docs/StatusPage";
import { CookiesPage } from "./pages/docs/CookiesPage";
import { LicensesPage } from "./pages/docs/LicensesPage";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

// Global end call function
const endCallSession = async (sessionId: string) => {
  try {
    const { error } = await supabase
      .from("call_sessions")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", sessionId);
    if (error) throw error;
    toast.success("Call ended");
    queryClient.invalidateQueries({ queryKey: ["call-sessions"] });
  } catch (error) {
    console.error("Error ending call:", error);
    toast.error("Failed to end call");
  }
};

function AdminAwareDashboardRoute() {
  const { role, authRole, adminViewMode } = useAuth();
  if ((role === "admin" || authRole === "admin") && !adminViewMode) {
    return <Navigate to="/continue-as" replace />;
  }
  if ((role === "admin" || authRole === "admin") && adminViewMode === "admin") {
    return <Navigate to="/admin/overview" replace />;
  }
  return <DashboardPage />;
}

function AdminRouteGate() {
  const { role, authRole, adminViewMode } = useAuth();
  const isAdmin = role === "admin" || authRole === "admin";
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  if (isAdmin && !adminViewMode) {
    return <Navigate to="/continue-as" replace />;
  }
  if (isAdmin && adminViewMode === "user") {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CallProvider endCallSession={endCallSession}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              {/* Docs Routes */}
              <Route path="/docs" element={<DocsIndexPage />} />
              <Route path="/docs/features" element={<FeaturesPage />} />
              <Route path="/docs/pricing" element={<PricingPage />} />
              <Route path="/docs/changelog" element={<ChangelogPage />} />
              <Route path="/docs/roadmap" element={<RoadmapPage />} />
              <Route path="/docs/help-center" element={<HelpCenterPage />} />
              <Route path="/docs/api" element={<ApiDocsPage />} />
              <Route path="/docs/tutorials" element={<TutorialsPage />} />
              <Route path="/docs/status" element={<StatusPage />} />
              <Route path="/docs/discord" element={<DiscordPage />} />
              <Route path="/docs/twitter" element={<TwitterPage />} />
              <Route path="/docs/blog" element={<BlogPage />} />
              <Route path="/docs/events" element={<DocsEventsPage />} />
              <Route path="/docs/privacy" element={<PrivacyPage />} />
              <Route path="/docs/terms" element={<TermsPage />} />
              <Route path="/docs/cookies" element={<CookiesPage />} />
              <Route path="/docs/licenses" element={<LicensesPage />} />
              <Route
                path="/continue-as"
                element={
                  <ProtectedRoute>
                    <ContinueAsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminRouteGate />
                  </ProtectedRoute>
                }
              >
                <Route element={<AdminShell />}>
                  <Route index element={<Navigate to="overview" replace />} />
                  <Route path="overview" element={<AdminOverviewPage />} />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="impersonate" element={<AdminImpersonatePage />} />
                  <Route path="content" element={<AdminContentPage />} />
                  <Route path="reports" element={<AdminReportsPage />} />
                  <Route path="analytics" element={<AdminAnalyticsPage />} />
                  <Route path="notifications" element={<AdminNotificationsPage />} />
                  <Route path="health" element={<AdminHealthPage />} />
                  <Route path="lookup" element={<AdminLookupPage />} />
                  <Route path="badges" element={<AdminBadgesPage />} />
                  <Route path="settings" element={<PowerfulAdminSettingsPage />} />
                </Route>
              </Route>
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<AdminAwareDashboardRoute />} />
                <Route path="/feed" element={<FeedPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/create-event" element={<CreateEventPage />} />
                <Route path="/events/:eventId" element={<EventDetailPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/bookmarks" element={<BookmarksPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile/:userId" element={<UserProfilePage />} />
                <Route path="/studio" element={<ContentPipelinePage />} />
                <Route path="/updates" element={<UpdatesPage />} />
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="/marketplace/:itemId" element={<MarketplaceDetailPage />} />
                <Route path="/selling/:itemId" element={<MarketplaceDetailPage />} />
                <Route path="/creator-marketplace" element={<CreatorMarketplacePage />} />
                <Route path="/network" element={<CollaborationNetworkPage />} />
                <Route path="/content-pipeline" element={<Navigate to="/studio" replace />} />
                <Route path="/content/:contentType/:contentId" element={<ContentDetailPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <MinimizedCallPopup />
          </CallProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
