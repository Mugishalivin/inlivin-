import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/LoadingSkeletons";
import {
  Bell,
  Copy,
  DatabaseIcon,
  Eye,
  EyeOff,
  ExternalLink,
  Globe,
  LogOut,
  Monitor,
  Moon,
  RefreshCcw,
  Save,
  Shield,
  Sparkles,
  Sun,
  Upload,
  User,
} from "lucide-react";

type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];
type ThemeMode = "light" | "dark" | "system";
type VisibilityMode = "public" | "followers" | "private";

const defaultSettings = (userId = ""): UserSettings => ({
  id: "",
  user_id: userId,
  theme_mode: "system",
  profile_visibility: "public",
  email_notifications: true,
  marketing_emails: false,
  allow_messages: true,
  show_location: true,
  compact_mode: false,
  autoplay_media: true,
  created_at: "",
  updated_at: "",
});

const profileLink = (userId: string) => `${window.location.origin}/profile/${userId}`;

export default function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [skills, setSkills] = useState("");
  const [genres, setGenres] = useState("");
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    const stored = localStorage.getItem("theme");
    return stored === "light" || stored === "dark" ? stored : "system";
  });
  const [profileVisibility, setProfileVisibility] = useState<VisibilityMode>("public");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [allowMessages, setAllowMessages] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [autoplayMedia, setAutoplayMedia] = useState(true);
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: userSettings } = useQuery({
    queryKey: ["user-settings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserSettings | null;
    },
    enabled: !!user,
  });

  const { data: overview = { projects: 0, followers: 0, following: 0, unread: 0 } } = useQuery({
    queryKey: ["settings-overview", user?.id],
    queryFn: async () => {
      const [projectsRes, followersRes, followingRes, unreadRes] = await Promise.all([
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("connections").select("*", { count: "exact", head: true }).eq("following_id", user!.id),
        supabase.from("connections").select("*", { count: "exact", head: true }).eq("follower_id", user!.id),
        supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user!.id).eq("is_read", false),
      ]);

      return {
        projects: projectsRes.count ?? 0,
        followers: followersRes.count ?? 0,
        following: followingRes.count ?? 0,
        unread: unreadRes.count ?? 0,
      };
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!profile) return;

    setDisplayName(profile.display_name || "");
    setUsername(profile.username || "");
    setBio(profile.bio || "");
    setLocation(profile.location || "");
    setWebsite(profile.website || "");
    setSkills(profile.skills?.join(", ") || "");
    setGenres(profile.genres?.join(", ") || "");
  }, [profile]);

  useEffect(() => {
    const merged = userSettings ?? defaultSettings(user?.id ?? "");
    setThemeMode((merged.theme_mode as ThemeMode) || "system");
    setProfileVisibility((merged.profile_visibility as VisibilityMode) || "public");
    setEmailNotifications(merged.email_notifications);
    setMarketingEmails(merged.marketing_emails);
    setAllowMessages(merged.allow_messages);
    setShowLocation(merged.show_location);
    setCompactMode(merged.compact_mode);
    setAutoplayMedia(merged.autoplay_media);
  }, [user?.id, userSettings]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const resolvedTheme =
      themeMode === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : themeMode;

    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    localStorage.setItem("theme", themeMode);
  }, [themeMode]);

  const profileCompletion = useMemo(() => {
    const checks = [
      displayName.trim(),
      username.trim(),
      bio.trim(),
      location.trim(),
      website.trim(),
      skills.trim(),
      genres.trim(),
      profile?.avatar_url,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [bio, displayName, genres, location, profile?.avatar_url, skills, username, website]);

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!profile || !user) throw new Error("Profile is not loaded yet.");

      const { error: profileError } = await supabase
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

      if (profileError) throw profileError;

      const { error: settingsError } = await supabase.from("user_settings").upsert(
        {
          user_id: user.id,
          theme_mode: themeMode,
          profile_visibility: profileVisibility,
          email_notifications: emailNotifications,
          marketing_emails: marketingEmails,
          allow_messages: allowMessages,
          show_location: showLocation,
          compact_mode: compactMode,
          autoplay_media: autoplayMedia,
        },
        { onConflict: "user_id" },
      );

      if (settingsError) throw settingsError;
    },
    onMutate: () => setSaving(true),
    onSuccess: async () => {
      await refreshProfile();
      await queryClient.invalidateQueries({ queryKey: ["user-settings", user?.id] });
      await queryClient.invalidateQueries({ queryKey: ["settings-overview", user?.id] });
      toast.success("Settings synced to the database");
    },
    onError: (error: any) => toast.error(error.message || "Failed to save settings"),
    onSettled: () => setSaving(false),
  });

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile || !user) return;

    setLoadingAvatar(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${profile.user_id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setLoadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: urlData.publicUrl })
      .eq("user_id", user.id);

    setLoadingAvatar(false);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    await refreshProfile();
    toast.success("Avatar updated");
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    syncMutation.mutate();
  };

  const copyProfileUrl = async () => {
    if (!user) return;
    await navigator.clipboard.writeText(profileLink(user.id));
    toast.success("Profile link copied");
  };

  const openProfile = () => {
    if (user) navigate(`/profile/${user.id}`);
  };

  const resetPreferences = () => {
    setThemeMode("system");
    setProfileVisibility("public");
    setEmailNotifications(true);
    setMarketingEmails(false);
    setAllowMessages(true);
    setShowLocation(true);
    setCompactMode(false);
    setAutoplayMedia(true);
    toast("Preferences reset", {
      description: "Remember to save so the database matches your reset state.",
    });
  };

  if (!user || !profile) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-56 bg-muted rounded-xl" />
          <div className="h-32 bg-muted rounded-3xl" />
          <div className="h-[28rem] bg-muted rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-card via-background to-card p-6 md:p-8 mb-6 shadow-sm"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 right-6 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="relative grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
              <Sparkles size={12} className="text-primary" />
              Account control center
            </div>
            <h1 className="font-display text-[clamp(2.2rem,5vw,4.5rem)] font-extrabold leading-[0.95] tracking-tight max-w-3xl">
              Power settings for
              <span className="block text-gradient">your artist system.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm md:text-base text-muted-foreground">
              Sync profile identity, database-backed preferences, and privacy controls in one place.
              Every change here persists to Supabase so the account stays consistent everywhere.
            </p>

            <div className="flex flex-wrap gap-2 mt-5">
              <Button variant="hero" onClick={openProfile}>
                <ExternalLink size={14} className="mr-1" /> Open profile
              </Button>
              <Button variant="outline" onClick={copyProfileUrl}>
                <Copy size={14} className="mr-1" /> Copy profile link
              </Button>
              <Button variant="outline" onClick={resetPreferences}>
                <RefreshCcw size={14} className="mr-1" /> Reset preferences
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="border-border/60 bg-background/80">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <DatabaseIcon size={18} />
                  </div>
                  <Badge className="bg-primary/10 text-primary">DB linked</Badge>
                </div>
                <div className="font-display text-2xl font-bold">{userSettings ? "Synced" : "Ready"}</div>
                <p className="text-xs text-muted-foreground mt-1">Your profile and preferences persist in Supabase.</p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-background/80">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent-foreground">
                    <Shield size={18} />
                  </div>
                  <Badge variant="secondary">{profileCompletion}% complete</Badge>
                </div>
                <div className="font-display text-2xl font-bold">{overview.projects}</div>
                <p className="text-xs text-muted-foreground mt-1">Public projects connected to your identity.</p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-background/80">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-foreground">
                    <Bell size={18} />
                  </div>
                  <Badge variant="outline">{overview.unread} unread</Badge>
                </div>
                <div className="font-display text-2xl font-bold">{overview.followers}</div>
                <p className="text-xs text-muted-foreground mt-1">Followers waiting for updates.</p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-background/80">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-foreground">
                    <Globe size={18} />
                  </div>
                  <Badge variant="outline">{overview.following} following</Badge>
                </div>
                <div className="font-display text-2xl font-bold capitalize">{profileVisibility}</div>
                <p className="text-xs text-muted-foreground mt-1">Visibility mode synced from the database.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.section>

      <form onSubmit={handleSave}>
        <Tabs defaultValue="identity" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="identity">Identity</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="data">Data & Security</TabsTrigger>
          </TabsList>

          <TabsContent value="identity" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base">Profile Identity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0 ring-4 ring-background">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User size={34} className="text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="cursor-pointer inline-flex">
                        <Button variant="hero-outline" size="sm" asChild disabled={loadingAvatar}>
                          <span>
                            {loadingAvatar ? <LoadingSpinner size="sm" /> : <Upload size={14} />}
                            {loadingAvatar ? "Uploading..." : "Upload Photo"}
                          </span>
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                        />
                      </label>
                      <p className="text-[11px] text-muted-foreground">PNG, JPG, WebP. Stored in Supabase Storage.</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
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
                    <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1.5" placeholder="Tell the world about yourself..." rows={4} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs font-medium">Location</Label>
                      <Input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1.5 h-10" placeholder="City, Country" />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Website</Label>
                      <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="mt-1.5 h-10" placeholder="https://..." />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs font-medium">Skills</Label>
                      <Input value={skills} onChange={(e) => setSkills(e.target.value)} className="mt-1.5 h-10" placeholder="Production, Mixing, Performance" />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Genres</Label>
                      <Input value={genres} onChange={(e) => setGenres(e.target.value)} className="mt-1.5 h-10" placeholder="R&B, Hip-Hop, Electronic" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base">Live Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-[1.5rem] border border-border/60 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-full overflow-hidden bg-secondary flex items-center justify-center shrink-0">
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <User size={24} className="text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-display text-lg font-bold truncate">{displayName || "Artist"}</p>
                        <p className="text-xs text-muted-foreground">@{username || "username"}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                      <div className="rounded-2xl bg-background/70 p-3">
                        <div className="font-display text-xl font-bold">{overview.followers}</div>
                        <p className="text-[11px] text-muted-foreground">followers</p>
                      </div>
                      <div className="rounded-2xl bg-background/70 p-3">
                        <div className="font-display text-xl font-bold">{overview.projects}</div>
                        <p className="text-[11px] text-muted-foreground">projects</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-primary" />
                      Database status: {userSettings ? "synced" : "new settings row will be created on save"}
                    </div>
                    <div className="flex items-center gap-2">
                      <RefreshCcw size={14} className="text-primary" />
                      Last saved: {userSettings?.updated_at ? new Date(userSettings.updated_at).toLocaleString() : "not yet saved"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base">Visual Mode</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs font-medium">Theme Mode</Label>
                    <Select value={themeMode} onValueChange={(value) => setThemeMode(value as ThemeMode)}>
                      <SelectTrigger className="mt-1.5 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-2xl border border-border/60 p-4 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">Compact feed</p>
                        <p className="text-xs text-muted-foreground">Use tighter cards and spacing across the app.</p>
                      </div>
                      <Switch checked={compactMode} onCheckedChange={setCompactMode} />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">Autoplay media</p>
                        <p className="text-xs text-muted-foreground">Play videos and animated assets automatically.</p>
                      </div>
                      <Switch checked={autoplayMedia} onCheckedChange={setAutoplayMedia} />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <Button type="button" variant="outline" className="justify-start" onClick={() => setThemeMode("system")}>
                      <Monitor size={14} className="mr-2" /> System
                    </Button>
                    <Button type="button" variant="outline" className="justify-start" onClick={() => setThemeMode("light")}>
                      <Sun size={14} className="mr-2" /> Light
                    </Button>
                    <Button type="button" variant="outline" className="justify-start" onClick={() => setThemeMode("dark")}>
                      <Moon size={14} className="mr-2" /> Dark
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base">Discovery & Visibility</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs font-medium">Profile visibility</Label>
                    <Select value={profileVisibility} onValueChange={(value) => setProfileVisibility(value as VisibilityMode)}>
                      <SelectTrigger className="mt-1.5 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="followers">Followers only</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-2xl border border-border/60 p-4 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium flex items-center gap-2"><Bell size={14} /> Email notifications</p>
                        <p className="text-xs text-muted-foreground">Alerts for messages, follows, and project activity.</p>
                      </div>
                      <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium flex items-center gap-2"><Shield size={14} /> Allow messages</p>
                        <p className="text-xs text-muted-foreground">Let other creators start conversations with you.</p>
                      </div>
                      <Switch checked={allowMessages} onCheckedChange={setAllowMessages} />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium flex items-center gap-2"><Eye size={14} /> Show location</p>
                        <p className="text-xs text-muted-foreground">Display your city or region on your profile.</p>
                      </div>
                      <Switch checked={showLocation} onCheckedChange={setShowLocation} />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium flex items-center gap-2"><EyeOff size={14} /> Marketing emails</p>
                        <p className="text-xs text-muted-foreground">Get product updates and creator tips.</p>
                      </div>
                      <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-secondary/50 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium mb-1">
                      <DatabaseIcon size={14} className="text-primary" />
                      Database linked
                    </div>
                    <p className="text-xs text-muted-foreground">
                      These preferences are backed by Supabase and will travel with your account across devices.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base">Account Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/60 p-4">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium mt-1 break-all">{user.email}</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 p-4">
                      <p className="text-xs text-muted-foreground">Database sync</p>
                      <p className="font-medium mt-1">{userSettings?.updated_at ? new Date(userSettings.updated_at).toLocaleString() : "Pending first save"}</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 p-4">
                      <p className="text-xs text-muted-foreground">Profile URL</p>
                      <p className="font-medium mt-1 break-all">{profileLink(user.id)}</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 p-4">
                      <p className="text-xs text-muted-foreground">Privacy mode</p>
                      <p className="font-medium mt-1 capitalize">{profileVisibility}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button type="button" variant="outline" onClick={copyProfileUrl}>
                      <Copy size={14} className="mr-1" /> Copy link
                    </Button>
                    <Button type="button" variant="outline" onClick={openProfile}>
                      <ExternalLink size={14} className="mr-1" /> Open profile
                    </Button>
                    <Button type="button" variant="outline" onClick={resetPreferences}>
                      <RefreshCcw size={14} className="mr-1" /> Reset pref
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-gradient-to-br from-card via-background to-secondary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base flex items-center gap-2">
                    <LogOut size={16} /> Session Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Signed in as</p>
                    <p className="font-semibold break-all">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">{profile.display_name || "Artist"} | {profile.username ? `@${profile.username}` : "no username"}</p>
                  </div>

                  <Button variant="hero-outline" className="w-full justify-start" onClick={() => signOut()}>
                    <LogOut size={14} className="mr-2" /> Sign out
                  </Button>

                  <div className="rounded-2xl bg-primary/10 p-4 text-sm text-primary">
                    <div className="flex items-center gap-2 font-medium mb-1">
                      <Sparkles size={14} /> Everything here is connected
                    </div>
                    Profile details sync to `profiles`, preferences sync to `user_settings`, and theme changes update the app instantly.
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="sticky bottom-4 mt-6">
          <Card className="border-border/60 bg-background/95 shadow-xl backdrop-blur">
            <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">Ready to sync your changes?</p>
                <p className="text-xs text-muted-foreground">This saves your profile to the database and persists your preferences across sessions.</p>
              </div>
              <Button variant="hero" type="submit" disabled={saving || loadingAvatar}>
                {saving ? <LoadingSpinner size="sm" /> : <Save size={14} />}
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
