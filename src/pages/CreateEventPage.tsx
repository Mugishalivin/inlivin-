import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Globe, Image as ImageIcon, LinkIcon, MapPin, Plus, Sparkles, Tag, Users, Video, X, CheckCircle2, WandSparkles, Eye, EyeOff, Clock3, Mic2, Camera, Megaphone } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PRESET_IDEAS = [
  { title: "Sunset showcase", category: "art", mood: "warm", icon: Sparkles },
  { title: "Listening lounge", category: "music", mood: "electric", icon: Mic2 },
  { title: "Studio open house", category: "workshop", mood: "bright", icon: Camera },
  { title: "Community drop-in", category: "other", mood: "social", icon: Megaphone },
];

const QUICK_TAGS = ["studio", "drop-in", "launch", "gallery", "live", "community", "vip", "afterhours"];

export default function CreateEventPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("art");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [isVirtual, setIsVirtual] = useState(false);
  const [virtualLink, setVirtualLink] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [socialLinks, setSocialLinks] = useState({ instagram: "", twitter: "", youtube: "", tiktok: "", website: "" });

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-md w-full border-border/60 shadow-xl">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Please sign in to create events.</p>
            <Button onClick={() => navigate("/login")} className="mt-4">Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCoverChange = (file: File | null) => {
    if (!file) {
      setCoverFile(null);
      setCoverPreview(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setCoverPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const addTag = (val: string) => {
    const trimmed = val.trim().toLowerCase();
    if (!trimmed || tags.includes(trimmed) || tags.length >= 10) return;
    setTags((prev) => [...prev, trimmed]);
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((item) => item !== tag));

  const eventDateTime = eventDate && eventTime ? new Date(`${eventDate}T${eventTime}`) : null;

  const readiness = useMemo(() => {
    const checks = [
      title.trim(),
      description.trim().length > 15,
      eventDate,
      eventTime,
      isVirtual ? virtualLink.trim() : location.trim(),
      tags.length > 0,
      coverPreview || coverFile,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [title, description, eventDate, eventTime, isVirtual, virtualLink, location, tags.length, coverPreview, coverFile]);

  const smartTips = useMemo(() => {
    const tips: string[] = [];
    if (!title.trim()) tips.push("Name the event clearly so artists know what to expect.");
    if (description.trim().length < 30) tips.push("Add a stronger description with the vibe, goal, and guest experience.");
    if (!coverPreview && !coverFile) tips.push("Upload a strong cover image to boost click-through and shareability.");
    if (!tags.length) tips.push("Use 3 to 5 tags to help the event surface in discovery.");
    if (isVirtual && !virtualLink.trim()) tips.push("Paste the meeting or livestream link for your virtual event.");
    if (!isVirtual && !location.trim()) tips.push("Set a venue or studio address for in-person attendance.");
    if (!eventDate || !eventTime) tips.push("Choose a date and time so the event can be scheduled.");
    return tips.length ? tips : ["Your event setup looks solid. Add a final polish pass and publish when ready."];
  }, [title, description, coverPreview, coverFile, tags.length, isVirtual, virtualLink, location, eventDate, eventTime]);

  const saveEvent = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title is required");
      if (!eventDate) throw new Error("Date is required");
      if (!eventTime) throw new Error("Time is required");

      const locVal = isVirtual ? virtualLink.trim() : location.trim();
      if (!locVal) throw new Error("Location or meeting link is required");

      let cover_url = null;
      if (coverFile) {
        const ext = coverFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `events/${user.id}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("project-files").upload(path, coverFile, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from("project-files").getPublicUrl(path);
        cover_url = data.publicUrl;
      }

      const { error } = await supabase.from("events").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        event_date: new Date(`${eventDate}T${eventTime}`).toISOString(),
        location: locVal,
        max_attendees: maxAttendees ? parseInt(maxAttendees, 10) : null,
        cover_url,
        is_public: isPublic,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event created successfully");
      setTimeout(() => navigate("/events"), 900);
    },
    onError: (err: any) => toast.error(err.message || "Failed to create event"),
  });

  const applyIdea = (idea: typeof PRESET_IDEAS[number]) => {
    setTitle(idea.title);
    setCategory(idea.category);
    setDescription(`A ${idea.mood} ${idea.category} event designed to bring artists together, inspire connection, and make the space feel unforgettable.`);
    if (idea.category === "music") {
      setIsVirtual(true);
      setVirtualLink((prev) => prev || "https://");
    } else {
      setIsVirtual(false);
    }
  };

  const eventLabel = category === "music" ? "Listening Event" : category === "workshop" ? "Workshop" : category === "art" ? "Art Experience" : "Creator Event";
  const locationLabel = isVirtual ? "Virtual" : "In person";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.16),_transparent_26%),linear-gradient(to_bottom_right,rgba(8,15,32,0.02),rgba(15,23,42,0.03))]">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[2rem] border border-border/50 bg-card/70 backdrop-blur-xl shadow-[0_30px_100px_rgba(15,23,42,0.12)]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-16 top-8 h-40 w-40 rounded-full bg-primary/15 blur-3xl animate-pulse" />
            <div className="absolute right-10 top-0 h-28 w-28 rounded-full bg-cyan-400/15 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-fuchsia-400/10 blur-3xl" />
          </div>

          <div className="relative grid gap-0 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="border-b border-border/50 xl:border-b-0 xl:border-r xl:border-border/50 p-5 md:p-8">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate("/events")} className="h-10 w-10 rounded-full">
                  <ArrowLeft size={18} />
                </Button>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">Event Studio</p>
                  <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight">
                    Create an event that feels alive.
                  </h1>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {PRESET_IDEAS.map((idea) => {
                  const Icon = idea.icon;
                  return (
                    <button
                      key={idea.title}
                      type="button"
                      onClick={() => applyIdea(idea)}
                      className="group rounded-2xl border border-border/60 bg-background/60 p-4 text-left transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon size={18} />
                        </div>
                        <Sparkles size={14} className="text-muted-foreground transition-transform group-hover:rotate-12" />
                      </div>
                      <p className="font-semibold">{idea.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground capitalize">{idea.mood} {idea.category}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <Card className="border-border/60 bg-background/70">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <WandSparkles size={16} className="text-primary" /> Fast setup
                    </CardTitle>
                    <CardDescription>Use these quick actions to shape the event vibe faster.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    <Button type="button" variant={isPublic ? "default" : "outline"} size="sm" onClick={() => setIsPublic(true)}>
                      <Globe size={14} className="mr-1" /> Public
                    </Button>
                    <Button type="button" variant={!isPublic ? "default" : "outline"} size="sm" onClick={() => setIsPublic(false)}>
                      <EyeOff size={14} className="mr-1" /> Private
                    </Button>
                    <Button type="button" variant={isVirtual ? "default" : "outline"} size="sm" onClick={() => setIsVirtual(true)}>
                      <Video size={14} className="mr-1" /> Virtual
                    </Button>
                    <Button type="button" variant={!isVirtual ? "default" : "outline"} size="sm" onClick={() => setIsVirtual(false)}>
                      <MapPin size={14} className="mr-1" /> Venue
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-background/70">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CheckCircle2 size={16} className="text-emerald-500" /> Event health
                    </CardTitle>
                    <CardDescription>Live readiness based on what you have filled in.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-black">{readiness}%</p>
                        <p className="text-xs text-muted-foreground">Ready to publish</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Mode</p>
                        <p className="text-sm font-medium">{eventLabel}</p>
                      </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary via-cyan-500 to-fuchsia-500 transition-all" style={{ width: `${readiness}%` }} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <Card className="border-border/60 bg-background/70">
                  <CardHeader>
                    <CardTitle className="text-base">Event details</CardTitle>
                    <CardDescription>Give the event a strong identity.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="mb-2 block text-sm font-medium">Cover image</Label>
                      {coverPreview ? (
                        <div className="group relative overflow-hidden rounded-2xl border border-border/50">
                          <img src={coverPreview} alt="Cover preview" className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                          <button
                            type="button"
                            onClick={() => handleCoverChange(null)}
                            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur hover:bg-black"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-gradient-to-br from-primary/5 to-cyan-500/5 text-center transition-colors hover:border-primary/40 hover:bg-primary/10">
                          <ImageIcon size={30} className="mb-3 text-primary" />
                          <p className="font-medium">Drop a cover image here</p>
                          <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WEBP up to 5MB</p>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleCoverChange(e.target.files?.[0] || null)} />
                        </label>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <Label className="mb-2 block text-sm font-medium">Event title *</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Create a title that people remember" className="h-11" maxLength={100} />
                      </div>
                      <div>
                        <Label className="mb-2 block text-sm font-medium">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="art">Art</SelectItem>
                            <SelectItem value="music">Music</SelectItem>
                            <SelectItem value="workshop">Workshop</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-2 block text-sm font-medium">Visibility</Label>
                        <Button type="button" variant={isPublic ? "default" : "outline"} className="h-11 w-full justify-between" onClick={() => setIsPublic((prev) => !prev)}>
                          <span className="flex items-center gap-2">
                            {isPublic ? <Eye size={14} /> : <EyeOff size={14} />}
                            {isPublic ? "Public event" : "Private event"}
                          </span>
                          <span className="text-xs opacity-70">{isPublic ? "discoverable" : "invite only"}</span>
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block text-sm font-medium">Description</Label>
                      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell people what will happen, why it matters, and what they should bring." rows={5} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-background/70">
                  <CardHeader>
                    <CardTitle className="text-base">Smart shortcuts</CardTitle>
                    <CardDescription>Tap to shape the event faster.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-2 block text-sm font-medium">Date *</Label>
                        <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="h-11" />
                      </div>
                      <div>
                        <Label className="mb-2 block text-sm font-medium">Time *</Label>
                        <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="h-11" />
                      </div>
                      <div className="col-span-2">
                        <Label className="mb-2 block text-sm font-medium">Maximum attendees</Label>
                        <Input type="number" value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value)} placeholder="Unlimited" min="1" className="h-11" />
                      </div>
                    </div>

                    {isVirtual ? (
                      <div>
                        <Label className="mb-2 block text-sm font-medium">Meeting link *</Label>
                        <Input value={virtualLink} onChange={(e) => setVirtualLink(e.target.value)} placeholder="https://..." type="url" className="h-11" />
                      </div>
                    ) : (
                      <div>
                        <Label className="mb-2 block text-sm font-medium">Location *</Label>
                        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Studio, venue, or address" className="h-11" />
                      </div>
                    )}

                    <div>
                      <Label className="mb-2 block text-sm font-medium">Quick tags</Label>
                      <div className="flex gap-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(tagInput))}
                          placeholder="Add a tag"
                          className="h-11"
                        />
                        <Button type="button" variant="outline" className="h-11 px-4" onClick={() => addTag(tagInput)}>
                          <Plus size={16} />
                        </Button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {QUICK_TAGS.map((tag) => (
                          <button key={tag} type="button" onClick={() => addTag(tag)} className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-foreground">
                            #{tag}
                          </button>
                        ))}
                      </div>
                      {tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="gap-2 rounded-full px-3 py-1">
                              #{tag}
                              <button type="button" onClick={() => removeTag(tag)}>
                                <X size={12} />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="mb-2 block text-sm font-medium">Promotion links</Label>
                      <div className="grid gap-3">
                        <Input value={socialLinks.website} onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })} placeholder="Website or ticket link" className="h-11" />
                        <Input value={socialLinks.instagram} onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })} placeholder="Instagram" className="h-11" />
                        <Input value={socialLinks.twitter} onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })} placeholder="X / Twitter" className="h-11" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/70 p-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Publishing checklist</p>
                  <p className="text-xs text-muted-foreground">Keep the essentials complete, then launch.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Title", done: !!title.trim() },
                    { label: "Date", done: !!eventDate },
                    { label: "Time", done: !!eventTime },
                    { label: "Details", done: description.trim().length > 15 },
                    { label: "Cover", done: !!coverPreview || !!coverFile },
                  ].map((item) => (
                    <Badge key={item.label} variant={item.done ? "default" : "outline"} className="rounded-full px-3 py-1">
                      {item.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 md:p-8">
              <div className="sticky top-6 space-y-4">
                <Card className="overflow-hidden border-border/60 bg-background/80">
                  <div className="relative h-56 overflow-hidden bg-gradient-to-br from-primary/20 via-cyan-500/15 to-fuchsia-500/15">
                    {coverPreview ? (
                      <img src={coverPreview} alt="Event cover preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-background/80 shadow">
                            <Sparkles size={24} className="text-primary" />
                          </div>
                          <p className="text-sm font-semibold">Your event cover preview</p>
                          <p className="text-xs text-muted-foreground">Upload a strong visual to make it pop</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                    <div className="absolute left-4 top-4 flex gap-2">
                      <Badge className="rounded-full bg-black/60 text-white backdrop-blur">{locationLabel}</Badge>
                      <Badge className="rounded-full bg-black/60 text-white backdrop-blur">{category}</Badge>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h2 className="text-2xl font-black text-white drop-shadow">
                        {title || "Untitled event"}
                      </h2>
                      <p className="mt-1 text-sm text-white/80 line-clamp-3">
                        {description || "Describe the atmosphere, the moment, and the value for your audience."}
                      </p>
                    </div>
                  </div>
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Calendar size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">
                          {eventDateTime ? eventDateTime.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }) : "Pick a date"}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <Clock3 size={12} />
                          {eventDateTime ? eventDateTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Set the launch time"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Audience</p>
                        <p className="mt-1 text-lg font-bold">{maxAttendees || "Open"}</p>
                      </div>
                      <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Privacy</p>
                        <p className="mt-1 text-lg font-bold">{isPublic ? "Public" : "Private"}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Sparkles size={14} className="text-primary" /> Smart suggestions
                      </div>
                      <div className="mt-3 space-y-2">
                        {smartTips.slice(0, 4).map((tip) => (
                          <div key={tip} className="flex gap-2 text-sm text-muted-foreground">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-gradient-to-r from-primary/10 via-cyan-500/10 to-fuchsia-500/10 p-4">
                      <p className="text-sm font-semibold">Ready to publish?</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {readiness >= 85 ? "You are close. Give it one final polish and launch." : "Fill the checklist on the left to unlock publishing confidence."}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-background/80">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Promotional glow-up</CardTitle>
                    <CardDescription>Use this once the event is live.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>1. Share the cover to stories and reels.</p>
                    <p>2. Turn the description into a short announcement post.</p>
                    <p>3. Pin the event link in your bio and messages.</p>
                    <p>4. Add a reminder post 24 hours before launch.</p>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => navigate("/events")} disabled={saveEvent.isPending}>
                    Cancel
                  </Button>
                  <Button
                    variant="hero"
                    className="flex-1"
                    onClick={() => saveEvent.mutate()}
                    disabled={saveEvent.isPending || !title.trim() || !eventDate || !eventTime || !(isVirtual ? virtualLink.trim() : location.trim())}
                  >
                    {saveEvent.isPending ? "Creating..." : "Create event"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
