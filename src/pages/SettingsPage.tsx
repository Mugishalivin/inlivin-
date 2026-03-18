import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [website, setWebsite] = useState(profile?.website || "");
  const [skills, setSkills] = useState(profile?.skills?.join(", ") || "");
  const [genres, setGenres] = useState(profile?.genres?.join(", ") || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        username: username.trim() || null,
        bio: bio.trim() || null,
        location: location.trim() || null,
        website: website.trim() || null,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        genres: genres.split(",").map((s) => s.trim()).filter(Boolean),
      })
      .eq("user_id", profile.user_id);

    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      await refreshProfile();
      toast.success("Profile updated!");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex items-center h-16 gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={18} />
          </Button>
          <h1 className="font-display font-bold">Settings</h1>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-lg">
          <h2 className="font-display text-2xl font-extrabold mb-6">Edit Profile</h2>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <Label className="text-sm font-medium">Display Name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1.5 h-11" placeholder="Your name" />
            </div>

            <div>
              <Label className="text-sm font-medium">Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1.5 h-11" placeholder="@username" />
            </div>

            <div>
              <Label className="text-sm font-medium">Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1.5" placeholder="Tell the world about yourself..." rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1.5 h-11" placeholder="City, Country" />
              </div>
              <div>
                <Label className="text-sm font-medium">Website</Label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="mt-1.5 h-11" placeholder="https://..." />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Skills</Label>
              <Input value={skills} onChange={(e) => setSkills(e.target.value)} className="mt-1.5 h-11" placeholder="Production, Vocals, Mixing (comma separated)" />
            </div>

            <div>
              <Label className="text-sm font-medium">Genres</Label>
              <Input value={genres} onChange={(e) => setGenres(e.target.value)} className="mt-1.5 h-11" placeholder="R&B, Hip-Hop, Electronic (comma separated)" />
            </div>

            <Button variant="hero" className="w-full h-11" type="submit" disabled={loading}>
              <Save size={16} className="mr-1" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
