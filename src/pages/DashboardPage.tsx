import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogOut, User, Home, Settings } from "lucide-react";

export default function DashboardPage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <a href="/" className="font-display text-xl font-extrabold text-foreground">
            inlivin<span className="text-primary">.</span>
          </a>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <Home size={16} className="mr-1" /> Home
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut size={16} className="mr-1" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl font-extrabold mb-2">
            Welcome{profile?.display_name ? `, ${profile.display_name}` : ""}!
          </h1>
          <p className="text-muted-foreground mb-8">
            This is your creative hub. Here's what's happening.
          </p>

          {/* Profile card */}
          <div className="rounded-2xl border border-border bg-card p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User size={28} className="text-muted-foreground" />
                )}
              </div>
              <div>
                <h2 className="font-display font-bold text-lg">{profile?.display_name || "Artist"}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                {profile?.location && (
                  <p className="text-xs text-muted-foreground mt-0.5">{profile.location}</p>
                )}
              </div>
            </div>

            {profile?.bio && (
              <p className="text-sm text-foreground mb-4">{profile.bio}</p>
            )}

            {profile?.skills && profile.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.skills.map((s) => (
                  <span key={s} className="text-xs px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground">{s}</span>
                ))}
              </div>
            )}

            <Button variant="hero-outline" size="sm" onClick={() => navigate("/settings")}>
              <Settings size={14} className="mr-1" /> Edit Profile
            </Button>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Connections", value: "0" },
              { label: "Projects", value: "0" },
              { label: "Messages", value: "0" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-5 text-center">
                <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
