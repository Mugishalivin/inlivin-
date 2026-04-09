import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Zap, ChevronRight, Crown } from "lucide-react";

export default function ContinueAsPage() {
  const { user, role, loading, adminViewMode, setAdminViewMode, stopImpersonation } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) {
      navigate("/dashboard", { replace: true });
      return;
    }
    if (!loading && user && role === "admin" && adminViewMode) {
      navigate(adminViewMode === "admin" ? "/admin/overview" : "/dashboard", { replace: true });
    }
  }, [loading, user, role, adminViewMode, navigate]);

  if (loading || !user || role !== "admin") {
    return null;
  }

  const handleChoice = (mode: "user" | "admin") => {
    stopImpersonation();
    setAdminViewMode(mode);
    navigate(mode === "admin" ? "/admin/overview" : "/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <Badge className="border-purple-400/30 bg-purple-500/20 text-purple-100 hover:bg-purple-500/30 animate-pulse">
              <Crown size={14} className="mr-1.5" />
              Admin Session Detected
            </Badge>
          </div>

          <h1 className="text-5xl sm:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-200 via-pink-200 to-cyan-200">
            Welcome Back, Admin
          </h1>

          <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Choose how you'd like to experience the platform. Continue as a regular user to see the public experience, or jump straight into your admin controls.
          </p>
        </div>

        {/* Choice Cards */}
        <div className="w-full max-w-4xl grid gap-6 sm:grid-cols-2 mb-8">
          {/* User Mode Card */}
          <button
            onClick={() => handleChoice("user")}
            className="group relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            {/* Card Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-slate-800/50 to-slate-900/80 border border-cyan-400/20 rounded-2xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/0 to-cyan-500/0 group-hover:from-cyan-400/10 group-hover:to-cyan-500/5 transition-all duration-500" />

            {/* Content */}
            <div className="relative">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-cyan-500/10 border border-cyan-400/30 group-hover:border-cyan-300/50 transition-colors">
                <User className="h-6 w-6 text-cyan-300 group-hover:text-cyan-200 transition-colors" />
              </div>

              <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-cyan-200 transition-colors">
                Explore as User
              </h3>

              <p className="text-sm leading-relaxed text-slate-300 mb-6 group-hover:text-slate-200 transition-colors">
                Experience the platform from a regular user's perspective. Browse the feed, discover content, and see exactly what your users see.
              </p>

              <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm group-hover:gap-3 transition-all">
                Continue
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* Admin Mode Card */}
          <button
            onClick={() => handleChoice("admin")}
            className="group relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            {/* Card Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-slate-800/50 to-slate-900/80 border border-purple-400/20 rounded-2xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 to-purple-500/0 group-hover:from-purple-400/10 group-hover:to-purple-500/5 transition-all duration-500" />

            {/* Badge */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Badge className="border-purple-300/50 bg-purple-500/30 text-purple-100">Recommended</Badge>
            </div>

            {/* Content */}
            <div className="relative">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400/20 to-purple-500/10 border border-purple-400/30 group-hover:border-purple-300/50 transition-colors">
                <Zap className="h-6 w-6 text-purple-300 group-hover:text-purple-200 transition-colors" />
              </div>

              <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-purple-200 transition-colors">
                Admin Dashboard
              </h3>

              <p className="text-sm leading-relaxed text-slate-300 mb-6 group-hover:text-slate-200 transition-colors">
                Access the full admin control center with user management, analytics, content moderation, security tools, and more.
              </p>

              <div className="flex items-center gap-2 text-purple-300 font-semibold text-sm group-hover:gap-3 transition-all">
                Launch Control Panel
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-slate-400 mt-4">
          <p>Your admin privileges remain active regardless of which mode you choose.</p>
        </div>
      </div>
    </div>
  );
}
