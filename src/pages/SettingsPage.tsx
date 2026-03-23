import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/LoadingSkeletons";
import { toast } from "sonner";
import { Save, User, Upload } from "lucide-react";

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [website, setWebsite] = useState(profile?.website || "");
  const [skills, setSkills] = useState(profile?.skills?.join(", ") || "");
  const [genres, setGenres] = useState(profile?.genres?.join(", ") || "");
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setAvatarUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${profile.user_id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setAvatarUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);

    await supabase
      .from("profiles")
      .update({ avatar_url: urlData.publicUrl })
      .eq("user_id", profile.user_id);

    await refreshProfile();
    setAvatarUploading(false);
    toast.success("Avatar updated!");
  };

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
    <div className="p-6 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">
          Settings<span className="text-primary">.</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your profile and preferences.</p>
      </div>

      {/* Avatar */}
      <Card className="border-border/50 mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">Avatar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={32} className="text-muted-foreground" />
              )}
            </div>
            <div>
              <label className="cursor-pointer">
                <Button variant="hero-outline" size="sm" asChild disabled={avatarUploading}>
                  <span>
                    {avatarUploading ? <LoadingSpinner size="sm" /> : <Upload size={14} />}
                    {avatarUploading ? "Uploading..." : "Upload Photo"}
                  </span>
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
              <p className="text-[11px] text-muted-foreground mt-1.5">JPG, PNG. Max 5MB.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile form */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium">Display Name</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1.5 h-10" placeholder="Your name" />
              </div>
              <div>
                <Label className="text-xs font-medium">Username</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1.5 h-10" placeholder="@username" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium">Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1.5" placeholder="Tell the world about yourself..." rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium">Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1.5 h-10" placeholder="City, Country" />
              </div>
              <div>
                <Label className="text-xs font-medium">Website</Label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="mt-1.5 h-10" placeholder="https://..." />
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium">Skills</Label>
              <Input value={skills} onChange={(e) => setSkills(e.target.value)} className="mt-1.5 h-10" placeholder="Production, Vocals, Mixing (comma separated)" />
            </div>

            <div>
              <Label className="text-xs font-medium">Genres</Label>
              <Input value={genres} onChange={(e) => setGenres(e.target.value)} className="mt-1.5 h-10" placeholder="R&B, Hip-Hop, Electronic (comma separated)" />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="hero" type="submit" disabled={loading}>
                {loading ? <LoadingSpinner size="sm" /> : <Save size={14} />}
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <p className="text-[11px] text-muted-foreground">{user?.email}</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
