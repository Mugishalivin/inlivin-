import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
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
import { applyAppearancePreference, applyThemePreference } from "@/lib/theme";
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
  Search,
  X,
} from "lucide-react";

type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];
type ThemeMode = "light" | "dark" | "system";
type VisibilityMode = "public" | "followers" | "private";
type ExtraSettings = {
  themeAccent: string;
  feedDensity: string;
  pushNotifications: boolean;
  smsNotifications: boolean;
  emailSummary: string;
  messageSound: boolean;
  allowGroupInvites: boolean;
  autoplayGifs: boolean;
  highQualityMedia: boolean;
  wifiOnlyMedia: boolean;
  discoverableProfile: boolean;
  showInSearch: boolean;
  recommendToOthers: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  captionsEnabled: boolean;
  highContrastMode: boolean;
  twoFactorEnabled: boolean;
  sessionTimeoutMinutes: number;
  requirePasswordForActions: boolean;
  dataSharing: boolean;
  analyticsSharing: boolean;
  backupExports: boolean;
  instagramSync: boolean;
  spotifySync: boolean;
  calendarSync: boolean;
  driveSync: boolean;
  slackSync: boolean;
  showActivityStatus: boolean;
  typingIndicator: boolean;
  profileHighlights: boolean;
  betaFeatures: boolean;
  developerMode: boolean;
  contentLanguage: string;
  loginAlerts: boolean;
  allowFollowRequests: boolean;
  allowTagging: boolean;
  sidebarMode: string;
  autoArchiveDays: number;
  autoSaveDrafts: boolean;
};

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
}) as UserSettings;

const defaultExtraSettings = (): ExtraSettings => ({
  themeAccent: "sunset",
  feedDensity: "comfortable",
  pushNotifications: true,
  smsNotifications: false,
  emailSummary: "weekly",
  messageSound: true,
  allowGroupInvites: true,
  autoplayGifs: true,
  highQualityMedia: true,
  wifiOnlyMedia: false,
  discoverableProfile: true,
  showInSearch: true,
  recommendToOthers: true,
  reducedMotion: false,
  largeText: false,
  captionsEnabled: true,
  highContrastMode: false,
  twoFactorEnabled: false,
  sessionTimeoutMinutes: 60,
  requirePasswordForActions: true,
  dataSharing: true,
  analyticsSharing: true,
  backupExports: true,
  instagramSync: false,
  spotifySync: false,
  calendarSync: false,
  driveSync: false,
  slackSync: false,
  showActivityStatus: true,
  typingIndicator: true,
  profileHighlights: true,
  betaFeatures: false,
  developerMode: false,
  contentLanguage: "English",
  loginAlerts: true,
  allowFollowRequests: true,
  allowTagging: true,
  sidebarMode: "auto",
  autoArchiveDays: 30,
  autoSaveDrafts: true,
});

const profileLink = (userId: string) => `${window.location.origin}/profile/${userId}`;

const settingsSections = [
  { value: "identity", title: "Identity", description: "Name, bio, avatar, and profile basics." },
  { value: "appearance", title: "Appearance", description: "Theme, density, and visual style." },
  { value: "privacy", title: "Privacy", description: "Who sees you and how you appear." },
  { value: "notifications", title: "Notifications", description: "Alerts, summaries, and inbox signals." },
  { value: "messages", title: "Messages", description: "Chat access and message behavior." },
  { value: "media", title: "Media", description: "Autoplay, quality, captions, and data use." },
  { value: "discovery", title: "Discovery", description: "Search visibility and recommendations." },
  { value: "accessibility", title: "Accessibility", description: "Text, contrast, motion, and readability." },
  { value: "security", title: "Security", description: "2FA, session timing, and safe actions." },
  { value: "preferences", title: "Preferences", description: "Core app preferences and theme mode." },
  { value: "data", title: "Data", description: "Sync status, profile URL, and account data." },
  { value: "integrations", title: "Integrations", description: "External services and connected tools." },
  { value: "activity", title: "Activity", description: "Presence, typing, and backup behavior." },
  { value: "feed", title: "Feed", description: "How your feed is displayed and behaves." },
  { value: "profile", title: "Profile", description: "Visibility and profile surface settings." },
  { value: "advanced", title: "Advanced", description: "Beta, developer, and archive controls." },
] as const;

export default function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<(typeof settingsSections)[number]["value"]>("identity");
  const [searchQuery, setSearchQuery] = useState("");

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
  const [extraSettings, setExtraSettings] = useState<ExtraSettings>(defaultExtraSettings);
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [hasHydratedSettings, setHasHydratedSettings] = useState(false);
  const [persistAfterReset, setPersistAfterReset] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const lastSavedSnapshotRef = useRef("");
  const hasSeededSnapshotRef = useRef(false);
  const autoSaveEnabled = true;
  const resolvedProfile = profile ?? {
    user_id: user?.id ?? "",
    display_name: null,
    username: null,
    avatar_url: null,
    bio: null,
    skills: [] as string[],
    genres: [] as string[],
    location: null,
    website: null,
    last_seen_at: null,
  };

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
  const settingsLoaded = !!user && userSettings !== undefined;

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

  // Filter settings sections based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return settingsSections;
    const query = searchQuery.toLowerCase();
    return settingsSections.filter(
      (section) =>
        section.title.toLowerCase().includes(query) ||
        section.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Ensure activeSection is always in filteredSections
  useEffect(() => {
    const isCurrentSectionFiltered = filteredSections.some((section) => section.value === activeSection);
    if (!isCurrentSectionFiltered && filteredSections.length > 0) {
      setActiveSection(filteredSections[0].value);
    }
  }, [filteredSections, activeSection]);

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
    if (!settingsLoaded) return;
    const merged = userSettings ?? defaultSettings(user?.id ?? "");
    setThemeMode((merged.theme_mode as ThemeMode) || "system");
    setProfileVisibility((merged.profile_visibility as VisibilityMode) || "public");
    setEmailNotifications(merged.email_notifications);
    setMarketingEmails(merged.marketing_emails);
    setAllowMessages(merged.allow_messages);
    setShowLocation(merged.show_location);
    setCompactMode(merged.compact_mode);
    setAutoplayMedia(merged.autoplay_media);
    setExtraSettings({
      themeAccent: (merged as any).theme_accent || "sunset",
      feedDensity: (merged as any).feed_density || "comfortable",
      pushNotifications: (merged as any).push_notifications ?? true,
      smsNotifications: (merged as any).sms_notifications ?? false,
      emailSummary: (merged as any).email_summary || "weekly",
      messageSound: (merged as any).message_sound ?? true,
      allowGroupInvites: (merged as any).allow_group_invites ?? true,
      autoplayGifs: (merged as any).autoplay_gifs ?? true,
      highQualityMedia: (merged as any).high_quality_media ?? true,
      wifiOnlyMedia: (merged as any).wifi_only_media ?? false,
      discoverableProfile: (merged as any).discoverable_profile ?? true,
      showInSearch: (merged as any).show_in_search ?? true,
      recommendToOthers: (merged as any).recommend_to_others ?? true,
      reducedMotion: (merged as any).reduced_motion ?? false,
      largeText: (merged as any).large_text ?? false,
      captionsEnabled: (merged as any).captions_enabled ?? true,
      highContrastMode: (merged as any).high_contrast_mode ?? false,
      twoFactorEnabled: (merged as any).two_factor_enabled ?? false,
      sessionTimeoutMinutes: (merged as any).session_timeout_minutes ?? 60,
      requirePasswordForActions: (merged as any).require_password_for_actions ?? true,
      dataSharing: (merged as any).data_sharing ?? true,
      analyticsSharing: (merged as any).analytics_sharing ?? true,
      backupExports: (merged as any).backup_exports ?? true,
      instagramSync: (merged as any).instagram_sync ?? false,
      spotifySync: (merged as any).spotify_sync ?? false,
      calendarSync: (merged as any).calendar_sync ?? false,
      driveSync: (merged as any).drive_sync ?? false,
      slackSync: (merged as any).slack_sync ?? false,
      showActivityStatus: (merged as any).show_activity_status ?? true,
      typingIndicator: (merged as any).typing_indicator ?? true,
      profileHighlights: (merged as any).profile_highlights ?? true,
      betaFeatures: (merged as any).beta_features ?? false,
      developerMode: (merged as any).developer_mode ?? false,
      contentLanguage: (merged as any).content_language || "English",
      loginAlerts: (merged as any).login_alerts ?? true,
      allowFollowRequests: (merged as any).allow_follow_requests ?? true,
      allowTagging: (merged as any).allow_tagging ?? true,
      sidebarMode: (merged as any).sidebar_mode || "auto",
      autoArchiveDays: (merged as any).auto_archive_days ?? 30,
      autoSaveDrafts: (merged as any).auto_save_drafts ?? true,
    });
    setHasHydratedSettings(true);
  }, [settingsLoaded, user?.id, userSettings]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    applyThemePreference(themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    applyAppearancePreference({
      themeAccent: extraSettings.themeAccent as any,
      feedDensity: (compactMode ? "compact" : extraSettings.feedDensity) as any,
      reducedMotion: extraSettings.reducedMotion,
      largeText: extraSettings.largeText,
      highContrastMode: extraSettings.highContrastMode,
      compactMode,
      sidebarMode: extraSettings.sidebarMode,
    });
  }, [
    compactMode,
    extraSettings.feedDensity,
    extraSettings.highContrastMode,
    extraSettings.largeText,
    extraSettings.reducedMotion,
    extraSettings.sidebarMode,
    extraSettings.themeAccent,
  ]);

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

  const settingsPayload = useMemo(() => ({
    user_id: user?.id ?? "",
    theme_mode: themeMode,
    profile_visibility: profileVisibility,
    email_notifications: emailNotifications,
    marketing_emails: marketingEmails,
    allow_messages: allowMessages,
    show_location: showLocation,
    compact_mode: compactMode,
    autoplay_media: autoplayMedia,
    theme_accent: extraSettings.themeAccent,
    feed_density: extraSettings.feedDensity,
    push_notifications: extraSettings.pushNotifications,
    sms_notifications: extraSettings.smsNotifications,
    email_summary: extraSettings.emailSummary,
    message_sound: extraSettings.messageSound,
    allow_group_invites: extraSettings.allowGroupInvites,
    autoplay_gifs: extraSettings.autoplayGifs,
    high_quality_media: extraSettings.highQualityMedia,
    wifi_only_media: extraSettings.wifiOnlyMedia,
    discoverable_profile: extraSettings.discoverableProfile,
    show_in_search: extraSettings.showInSearch,
    recommend_to_others: extraSettings.recommendToOthers,
    reduced_motion: extraSettings.reducedMotion,
    large_text: extraSettings.largeText,
    captions_enabled: extraSettings.captionsEnabled,
    high_contrast_mode: extraSettings.highContrastMode,
    two_factor_enabled: extraSettings.twoFactorEnabled,
    session_timeout_minutes: extraSettings.sessionTimeoutMinutes,
    require_password_for_actions: extraSettings.requirePasswordForActions,
    data_sharing: extraSettings.dataSharing,
    analytics_sharing: extraSettings.analyticsSharing,
    backup_exports: extraSettings.backupExports,
    instagram_sync: extraSettings.instagramSync,
    spotify_sync: extraSettings.spotifySync,
    calendar_sync: extraSettings.calendarSync,
    drive_sync: extraSettings.driveSync,
    slack_sync: extraSettings.slackSync,
    show_activity_status: extraSettings.showActivityStatus,
    typing_indicator: extraSettings.typingIndicator,
    profile_highlights: extraSettings.profileHighlights,
    beta_features: extraSettings.betaFeatures,
    developer_mode: extraSettings.developerMode,
    content_language: extraSettings.contentLanguage,
    login_alerts: extraSettings.loginAlerts,
    allow_follow_requests: extraSettings.allowFollowRequests,
    allow_tagging: extraSettings.allowTagging,
    sidebar_mode: extraSettings.sidebarMode,
    auto_archive_days: extraSettings.autoArchiveDays,
    auto_save_drafts: extraSettings.autoSaveDrafts,
  }), [
    autoplayMedia,
    allowMessages,
    compactMode,
    emailNotifications,
    marketingEmails,
    profileVisibility,
    showLocation,
    themeMode,
    user?.id,
    extraSettings,
  ]);

  const settingsSnapshot = useMemo(() => JSON.stringify(settingsPayload), [settingsPayload]);
  const updateExtra = <K extends keyof ExtraSettings>(key: K, value: ExtraSettings[K]) => {
    setExtraSettings((current) => ({ ...current, [key]: value }));
  };

  const syncMutation = useMutation({
    mutationFn: async (source: "manual" | "auto" = "manual") => {
      if (!user) throw new Error("User is not loaded yet.");

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
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      const { error: settingsError } = await supabase.from("user_settings").upsert(
        settingsPayload,
        { onConflict: "user_id" },
      );

      if (settingsError) throw settingsError;
      return source;
    },
    onMutate: () => setSaving(true),
    onSuccess: async (_result, source) => {
      lastSavedSnapshotRef.current = settingsSnapshot;
      setSaveStatus("saved");
      await refreshProfile();
      await queryClient.invalidateQueries({ queryKey: ["user-settings", user?.id] });
      await queryClient.invalidateQueries({ queryKey: ["settings-overview", user?.id] });
      if (source === "manual") {
        toast.success("Settings synced to the database");
      }
      window.setTimeout(() => {
        setSaveStatus((current) => (current === "saved" ? "idle" : current));
      }, 1200);
    },
    onError: (error: any, source) => {
      setSaveStatus("error");
      if (source === "manual") {
        toast.error(error.message || "Failed to save settings");
      } else {
        toast.error(error.message || "Auto-save failed");
      }
    },
    onSettled: () => setSaving(false),
  });

  useEffect(() => {
    if (!autoSaveEnabled || !hasHydratedSettings || !user) return;
    if (saving) return;
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    if (settingsSnapshot === lastSavedSnapshotRef.current) return;

    setSaveStatus("saving");
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      syncMutation.mutate("auto");
    }, 900);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [autoSaveEnabled, hasHydratedSettings, saving, settingsSnapshot, syncMutation, user]);

  useEffect(() => {
    if (!persistAfterReset || !hasHydratedSettings || !user) return;
    setPersistAfterReset(false);
    syncMutation.mutate("manual");
  }, [hasHydratedSettings, persistAfterReset, syncMutation, user]);

  useEffect(() => {
    if (!hasHydratedSettings || hasSeededSnapshotRef.current) return;
    lastSavedSnapshotRef.current = settingsSnapshot;
    hasSeededSnapshotRef.current = true;
  }, [hasHydratedSettings, settingsSnapshot]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoadingAvatar(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${resolvedProfile.user_id || user.id}/avatar.${ext}`;

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
    syncMutation.mutate("manual");
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
    setExtraSettings(defaultExtraSettings());
    setPersistAfterReset(true);
    toast("Preferences reset", {
      description: "Auto-save will persist the reset state shortly.",
    });
  };

  if (!user) {
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
        <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as (typeof settingsSections)[number]["value"])} className="space-y-6">
          <div className="space-y-6">
            <Card className="border-border/60 bg-card/90 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base">Settings navigator</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Pick a section to tune. Every control is saved to the database.
                </p>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {/* Search Input */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search settings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-8 h-10 text-sm"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filtered Sections List */}
                {filteredSections.length > 0 ? (
                  <TabsList className="flex h-auto w-full flex-wrap gap-2 bg-transparent p-0">
                    {filteredSections.map((section) => (
                      <TabsTrigger
                        key={section.value}
                        value={section.value}
                        className="rounded-full border border-border/60 bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors data-[state=active]:border-primary/40 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      >
                        {section.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">No settings found matching "{searchQuery}"</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              {filteredSections.some(s => s.value === 'identity') && (
              <TabsContent value="identity" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                  <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base">Profile Identity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0 ring-4 ring-background">
                      {resolvedProfile.avatar_url ? (
                        <img src={resolvedProfile.avatar_url} alt="" className="h-full w-full object-cover" />
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
                        {resolvedProfile.avatar_url ? (
                          <img src={resolvedProfile.avatar_url} alt="" className="h-full w-full object-cover" />
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
              )}

              {filteredSections.some(s => s.value === 'preferences') && (
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
              )}

              {filteredSections.some(s => s.value === 'data') && (
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
                    <p className="text-xs text-muted-foreground mt-1">{resolvedProfile.display_name || "Artist"} | {resolvedProfile.username ? `@${resolvedProfile.username}` : "no username"}</p>
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
              )}

              {filteredSections.some(s => s.value === 'appearance') && (
              <TabsContent value="appearance" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/60">
                <CardHeader className="pb-3"><CardTitle className="font-display text-base">Appearance</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Live preview</p>
                        <h3 className="mt-1 font-display text-lg text-foreground">Your theme updates instantly</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Accent, density, and contrast are applied across the app and saved to the database.</p>
                      </div>
                      <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">Live</Badge>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-border/60 bg-card/80 p-3 shadow-sm">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Accent</p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-9 w-9 rounded-xl bg-primary shadow-sm" />
                          <div>
                            <p className="font-medium text-foreground capitalize">{extraSettings.themeAccent}</p>
                            <p className="text-xs text-muted-foreground">Primary buttons and highlights</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-border/60 bg-card/80 p-3 shadow-sm">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Density</p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex h-9 items-center gap-1 rounded-xl border border-border bg-background px-3">
                            <span className="h-2 w-2 rounded-full bg-primary" />
                            <span className="h-2 w-2 rounded-full bg-accent" />
                            <span className="h-2 w-2 rounded-full bg-secondary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground capitalize">{compactMode ? "Compact" : extraSettings.feedDensity}</p>
                            <p className="text-xs text-muted-foreground">Spacing and corner radius</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Theme accent</Label>
                    <Select value={extraSettings.themeAccent} onValueChange={(value) => updateExtra("themeAccent", value)}>
                      <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sunset">Sunset</SelectItem>
                        <SelectItem value="ocean">Ocean</SelectItem>
                        <SelectItem value="forest">Forest</SelectItem>
                        <SelectItem value="midnight">Midnight</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Feed density</Label>
                    <Select value={extraSettings.feedDensity} onValueChange={(value) => updateExtra("feedDensity", value)}>
                      <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comfortable">Comfortable</SelectItem>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="dense">Dense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="rounded-2xl border border-border/60 p-4 space-y-4">
                    <SettingToggle label="Compact mode" description="Tighter spacing in feeds and cards." checked={compactMode} onChange={setCompactMode} />
                    <SettingToggle label="Large text" description="Bump up text size across the app." checked={extraSettings.largeText} onChange={(value) => updateExtra("largeText", value)} />
                    <SettingToggle label="High contrast" description="Stronger contrast for readability." checked={extraSettings.highContrastMode} onChange={(value) => updateExtra("highContrastMode", value)} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-3"><CardTitle className="font-display text-base">Visibility</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <SettingToggle label="Profile highlights" description="Feature your best posts on your profile." checked={extraSettings.profileHighlights} onChange={(value) => updateExtra("profileHighlights", value)} />
                  <SettingToggle label="Show in search" description="Let other users find your profile in search." checked={extraSettings.showInSearch} onChange={(value) => updateExtra("showInSearch", value)} />
                  <SettingToggle label="Discoverable profile" description="Allow recommendations in the platform." checked={extraSettings.discoverableProfile} onChange={(value) => updateExtra("discoverableProfile", value)} />
                  <SettingToggle label="Recommend to others" description="Suggest your profile in discovery feeds." checked={extraSettings.recommendToOthers} onChange={(value) => updateExtra("recommendToOthers", value)} />
                </CardContent>
              </Card>
            </div>
              </TabsContent>
              )}

              {filteredSections.some(s => s.value === 'privacy') && (
              <TabsContent value="privacy" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/60">
                <CardHeader className="pb-3"><CardTitle className="font-display text-base">Privacy</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <SettingToggle label="Show activity status" description="Let others know when you're online." checked={extraSettings.showActivityStatus} onChange={(value) => updateExtra("showActivityStatus", value)} />
                  <SettingToggle label="Typing indicator" description="Show when you are typing a message." checked={extraSettings.typingIndicator} onChange={(value) => updateExtra("typingIndicator", value)} />
                  <SettingToggle label="Allow follow requests" description="Approve who can follow you." checked={extraSettings.allowFollowRequests} onChange={(value) => updateExtra("allowFollowRequests", value)} />
                  <SettingToggle label="Allow tagging" description="Allow others to tag your profile and content." checked={extraSettings.allowTagging} onChange={(value) => updateExtra("allowTagging", value)} />
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-3"><CardTitle className="font-display text-base">Location & Profile</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <SettingToggle label="Show location" description="Display your city or region on your profile." checked={showLocation} onChange={setShowLocation} />
                  <div>
                    <Label className="text-xs font-medium">Profile visibility</Label>
                    <Select value={profileVisibility} onValueChange={(value) => setProfileVisibility(value as VisibilityMode)}>
                      <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="followers">Followers only</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
              </TabsContent>
              )}

              {filteredSections.some(s => s.value === 'notifications') && (
              <TabsContent value="notifications" className="space-y-6">
            <Card className="border-border/60">
              <CardHeader className="pb-3"><CardTitle className="font-display text-base">Notifications</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <SettingToggle label="Push notifications" description="Browser and mobile push alerts." checked={extraSettings.pushNotifications} onChange={(value) => updateExtra("pushNotifications", value)} />
                <SettingToggle label="Email notifications" description="Messages, follows, and account activity." checked={emailNotifications} onChange={setEmailNotifications} />
                <SettingToggle label="Login alerts" description="Get notified about sign-ins from new devices." checked={extraSettings.loginAlerts} onChange={(value) => updateExtra("loginAlerts", value)} />
                <SettingToggle label="SMS notifications" description="Text alerts for urgent updates." checked={extraSettings.smsNotifications} onChange={(value) => updateExtra("smsNotifications", value)} />
                <SettingToggle label="Marketing emails" description="Creator tips, product updates, and promos." checked={marketingEmails} onChange={setMarketingEmails} />
                <div>
                  <Label className="text-xs font-medium">Email summary</Label>
                  <Select value={extraSettings.emailSummary} onValueChange={(value) => updateExtra("emailSummary", value)}>
                    <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
              </TabsContent>
              )}

              {filteredSections.some(s => s.value === 'messages') && (
              <TabsContent value="messages" className="space-y-6">
            <Card className="border-border/60">
              <CardHeader className="pb-3"><CardTitle className="font-display text-base">Messages</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <SettingToggle label="Allow messages" description="Let other creators start conversations with you." checked={allowMessages} onChange={setAllowMessages} />
                <SettingToggle label="Message sound" description="Play a sound for incoming messages." checked={extraSettings.messageSound} onChange={(value) => updateExtra("messageSound", value)} />
                <SettingToggle label="Allow group invites" description="Accept invites into group chats." checked={extraSettings.allowGroupInvites} onChange={(value) => updateExtra("allowGroupInvites", value)} />
              </CardContent>
            </Card>
              </TabsContent>
              )}

              {filteredSections.some(s => s.value === 'media') && (
              <TabsContent value="media" className="space-y-6">
            <Card className="border-border/60">
              <CardHeader className="pb-3"><CardTitle className="font-display text-base">Media</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <SettingToggle label="Autoplay media" description="Play videos and animated assets automatically." checked={autoplayMedia} onChange={setAutoplayMedia} />
                <SettingToggle label="Autoplay GIFs" description="Animate GIF previews across the app." checked={extraSettings.autoplayGifs} onChange={(value) => updateExtra("autoplayGifs", value)} />
                <SettingToggle label="High quality media" description="Prefer higher quality image and video previews." checked={extraSettings.highQualityMedia} onChange={(value) => updateExtra("highQualityMedia", value)} />
                <SettingToggle label="Wi-Fi only media" description="Load heavy media only on Wi-Fi." checked={extraSettings.wifiOnlyMedia} onChange={(value) => updateExtra("wifiOnlyMedia", value)} />
                <SettingToggle label="Captions enabled" description="Show captions or alt info when available." checked={extraSettings.captionsEnabled} onChange={(value) => updateExtra("captionsEnabled", value)} />
              </CardContent>
            </Card>
              </TabsContent>
              )}

              {filteredSections.some(s => s.value === 'discovery') && (
              <TabsContent value="discovery" className="space-y-6">
            <Card className="border-border/60">
              <CardHeader className="pb-3"><CardTitle className="font-display text-base">Discovery</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <SettingToggle label="Discoverable profile" description="Let the platform surface your profile." checked={extraSettings.discoverableProfile} onChange={(value) => updateExtra("discoverableProfile", value)} />
                <SettingToggle label="Show in search" description="Include your profile in search results." checked={extraSettings.showInSearch} onChange={(value) => updateExtra("showInSearch", value)} />
                <SettingToggle label="Recommend to others" description="Suggest your profile to similar users." checked={extraSettings.recommendToOthers} onChange={(value) => updateExtra("recommendToOthers", value)} />
                <SettingToggle label="Profile highlights" description="Highlight selected content on your profile." checked={extraSettings.profileHighlights} onChange={(value) => updateExtra("profileHighlights", value)} />
              </CardContent>
            </Card>
              </TabsContent>
              )}

              {filteredSections.some(s => s.value === 'accessibility') && (
              <TabsContent value="accessibility" className="space-y-6">
            <Card className="border-border/60">
              <CardHeader className="pb-3"><CardTitle className="font-display text-base">Accessibility</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <SettingToggle label="Reduced motion" description="Minimize transitions and motion effects." checked={extraSettings.reducedMotion} onChange={(value) => updateExtra("reducedMotion", value)} />
                <SettingToggle label="Large text" description="Increase readability across the app." checked={extraSettings.largeText} onChange={(value) => updateExtra("largeText", value)} />
                <SettingToggle label="High contrast" description="Use stronger contrast in UI surfaces." checked={extraSettings.highContrastMode} onChange={(value) => updateExtra("highContrastMode", value)} />
                <SettingToggle label="Captions enabled" description="Show caption text and accessible labels." checked={extraSettings.captionsEnabled} onChange={(value) => updateExtra("captionsEnabled", value)} />
              </CardContent>
            </Card>
              </TabsContent>
              )}

              {filteredSections.some(s => s.value === 'security') && (
              <TabsContent value="security" className="space-y-6">
            <Card className="border-border/60">
              <CardHeader className="pb-3"><CardTitle className="font-display text-base">Security</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <SettingToggle label="Two-factor auth" description="Require a second step when signing in." checked={extraSettings.twoFactorEnabled} onChange={(value) => updateExtra("twoFactorEnabled", value)} />
                <SettingToggle label="Login alerts" description="Be notified when new devices sign in." checked={extraSettings.loginAlerts} onChange={(value) => updateExtra("loginAlerts", value)} />
                <SettingToggle label="Password for actions" description="Ask for your password before destructive changes." checked={extraSettings.requirePasswordForActions} onChange={(value) => updateExtra("requirePasswordForActions", value)} />
                <div>
                  <Label className="text-xs font-medium">Session timeout</Label>
                  <Select value={String(extraSettings.sessionTimeoutMinutes)} onValueChange={(value) => updateExtra("sessionTimeoutMinutes", Number(value))}>
                    <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
              </TabsContent>
              )}

              {filteredSections.some(s => s.value === 'integrations') && (
              <TabsContent value="integrations" className="space-y-6">
            <Card className="border-border/60">
              <CardHeader className="pb-3"><CardTitle className="font-display text-base">Integrations</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <SettingToggle label="Instagram sync" description="Sync profile links and updates." checked={extraSettings.instagramSync} onChange={(value) => updateExtra("instagramSync", value)} />
                <SettingToggle label="Spotify sync" description="Show listening activity and playlists." checked={extraSettings.spotifySync} onChange={(value) => updateExtra("spotifySync", value)} />
                <SettingToggle label="Calendar sync" description="Connect events to your calendar." checked={extraSettings.calendarSync} onChange={(value) => updateExtra("calendarSync", value)} />
                <SettingToggle label="Drive sync" description="Back up assets and exports to Drive." checked={extraSettings.driveSync} onChange={(value) => updateExtra("driveSync", value)} />
                <SettingToggle label="Slack sync" description="Forward alerts to Slack channels." checked={extraSettings.slackSync} onChange={(value) => updateExtra("slackSync", value)} />
              </CardContent>
            </Card>
              </TabsContent>
              )}

              {filteredSections.some(s => s.value === 'activity') && (
              <TabsContent value="activity" className="space-y-6">
            <Card className="border-border/60">
              <CardHeader className="pb-3"><CardTitle className="font-display text-base">Activity</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <SettingToggle label="Show activity status" description="Let others see your online presence." checked={extraSettings.showActivityStatus} onChange={(value) => updateExtra("showActivityStatus", value)} />
                <SettingToggle label="Typing indicator" description="Show when you are composing a message." checked={extraSettings.typingIndicator} onChange={(value) => updateExtra("typingIndicator", value)} />
                <SettingToggle label="Backup exports" description="Keep periodic exports for your account." checked={extraSettings.backupExports} onChange={(value) => updateExtra("backupExports", value)} />
              </CardContent>
            </Card>
              </TabsContent>
              )}

              {filteredSections.some(s => s.value === 'feed') && (
              <TabsContent value="feed" className="space-y-6">
            <Card className="border-border/60">
              <CardHeader className="pb-3"><CardTitle className="font-display text-base">Feed</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <SettingToggle label="Compact feed" description="Tighter cards and less whitespace." checked={compactMode} onChange={setCompactMode} />
                <SettingToggle label="Autoplay media" description="Play videos automatically in feeds." checked={autoplayMedia} onChange={setAutoplayMedia} />
                <SettingToggle label="Autoplay GIFs" description="Animate GIF previews in your feed." checked={extraSettings.autoplayGifs} onChange={(value) => updateExtra("autoplayGifs", value)} />
                <div>
                  <Label className="text-xs font-medium">Sidebar mode</Label>
                  <Select value={extraSettings.sidebarMode} onValueChange={(value) => updateExtra("sidebarMode", value)}>
                    <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="wide">Wide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
              </TabsContent>
              )}

              {filteredSections.some(s => s.value === 'profile') && (
              <TabsContent value="profile" className="space-y-6">
            <Card className="border-border/60">
              <CardHeader className="pb-3"><CardTitle className="font-display text-base">Profile</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <SettingToggle label="Profile highlights" description="Feature selected posts on your profile." checked={extraSettings.profileHighlights} onChange={(value) => updateExtra("profileHighlights", value)} />
                <SettingToggle label="Allow follow requests" description="Approve new followers before they connect." checked={extraSettings.allowFollowRequests} onChange={(value) => updateExtra("allowFollowRequests", value)} />
                <SettingToggle label="Allow tagging" description="Let people tag your account in posts." checked={extraSettings.allowTagging} onChange={(value) => updateExtra("allowTagging", value)} />
                <div>
                  <Label className="text-xs font-medium">Content language</Label>
                  <Select value={extraSettings.contentLanguage} onValueChange={(value) => updateExtra("contentLanguage", value)}>
                    <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
              </TabsContent>
              )}

              {filteredSections.some(s => s.value === 'advanced') && (
              <TabsContent value="advanced" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/60">
                <CardHeader className="pb-3"><CardTitle className="font-display text-base">Advanced</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                <SettingToggle label="Beta features" description="Enable experimental product features." checked={extraSettings.betaFeatures} onChange={(value) => updateExtra("betaFeatures", value)} />
                  <SettingToggle label="Developer mode" description="Expose extra debugging options." checked={extraSettings.developerMode} onChange={(value) => updateExtra("developerMode", value)} />
                  <SettingToggle label="Data sharing" description="Allow first-party service optimization." checked={extraSettings.dataSharing} onChange={(value) => updateExtra("dataSharing", value)} />
                  <SettingToggle label="Analytics sharing" description="Share anonymous usage analytics." checked={extraSettings.analyticsSharing} onChange={(value) => updateExtra("analyticsSharing", value)} />
                  <SettingToggle label="Auto-save drafts" description="Keep draft text and form data synced locally." checked={extraSettings.autoSaveDrafts} onChange={(value) => updateExtra("autoSaveDrafts", value)} />
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-3"><CardTitle className="font-display text-base">Archive</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <SettingToggle label="Auto archive backups" description="Keep automatic account snapshots." checked={extraSettings.backupExports} onChange={(value) => updateExtra("backupExports", value)} />
                  <div>
                    <Label className="text-xs font-medium">Auto archive days</Label>
                    <Select value={String(extraSettings.autoArchiveDays)} onValueChange={(value) => updateExtra("autoArchiveDays", Number(value))}>
                      <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
              </TabsContent>
              )}

            </div>
          </div>
        </Tabs>

        <div className="sticky bottom-4 mt-6">
          <Card className="border-border/60 bg-background/95 shadow-xl backdrop-blur">
            <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">Ready to sync your changes?</p>
                <p className="text-xs text-muted-foreground">Changes auto-save to the database after a short pause. You can still force a save here.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {saveStatus === "saving" || saving ? "Auto-saving" : saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Save error" : "Auto-save on"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {saveStatus === "saved"
                      ? "Your latest changes are in sync."
                      : saveStatus === "error"
                        ? "Try the save button if the network is flaky."
                        : "Edits persist automatically after you pause typing."}
                  </p>
                </div>
                <Button variant="hero" type="submit" disabled={saving || loadingAvatar}>
                  {saving ? <LoadingSpinner size="sm" /> : <Save size={14} />}
                  {saving ? "Saving..." : "Save now"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
