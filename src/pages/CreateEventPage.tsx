import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Image as ImageIcon, Plus, X, Link as LinkIcon,
  Instagram, Twitter, Youtube, Music, Globe, MapPin, Calendar, Users,
  Tag, Hash, Eye, EyeOff
} from "lucide-react";

export default function CreateEventPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Basic Info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [category, setCategory] = useState("art");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [isVirtual, setIsVirtual] = useState(false);
  const [virtualLink, setVirtualLink] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("");

  // Media
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Announcement Features
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");

  // Social Media Links
  const [socialLinks, setSocialLinks] = useState({
    instagram: "",
    twitter: "",
    youtube: "",
    tiktok: "",
    website: "",
  });

  // Event Guidelines
  const [guidelines, setGuidelines] = useState("");
  const [dressCode, setDressCode] = useState("");
  const [ageRestriction, setAgeRestriction] = useState("");

  const handleCoverChange = (file: File | null) => {
    setCoverFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setCoverPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addHashtag = (hashtag: string) => {
    const trimmed = hashtag.trim().toLowerCase().replace(/^#+/, "#");
    if (trimmed && !hashtags.includes(trimmed)) {
      setHashtags([...hashtags, trimmed]);
      setHashtagInput("");
    }
  };

  const removeHashtag = (hashtag: string) => {
    setHashtags(hashtags.filter(h => h !== hashtag));
  };

  const saveEvent = useMutation({
    mutationFn: async () => {
      let cover_url = null;

      if (coverFile) {
        const ext = coverFile.name.split(".").pop();
        const path = `events/${user!.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("project-files")
          .upload(path, coverFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(path);
        cover_url = urlData.publicUrl;
      }

      const eventDateTime = new Date(`${eventDate}T${eventTime}`).toISOString();

      const payload = {
        user_id: user!.id,
        title: title.trim(),
        description: description.trim() || null,
        short_description: shortDescription.trim() || null,
        category: category || "art",
        event_date: eventDateTime,
        location: isVirtual ? virtualLink : location.trim() || null,
        is_virtual: isVirtual,
        max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
        cover_url,
        tags: tags.length > 0 ? tags : null,
        hashtags: hashtags.length > 0 ? hashtags : null,
        is_public: isPublic,
        social_links: Object.values(socialLinks).some(v => v) ? socialLinks : null,
        guidelines: guidelines.trim() || null,
        dress_code: dressCode.trim() || null,
        age_restriction: ageRestriction || null,
        announcement_text: showAnnouncement ? announcementText.trim() : null,
      };

      const { error } = await supabase.from("events").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("🎉 Event created successfully!");
      navigate("/events");
    },
    onError: (err: any) => toast.error(err.message || "Failed to create event"),
  });

  const isFormValid = title.trim() && eventDate && eventTime && (isVirtual ? virtualLink.trim() : location.trim());

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/events")}
            className="rounded-full"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-extrabold text-foreground">
              Create Event<span className="text-primary">.</span>
            </h1>
            <p className="text-muted-foreground mt-1">Fill in all details to announce your amazing event.</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Section 1: Basic Information */}
          <Card className="border-border/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">1</div>
                Basic Information
              </CardTitle>
              <CardDescription>Tell us about your event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cover Image */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Event Cover Image</Label>
                <div>
                  {coverPreview ? (
                    <div className="relative rounded-xl overflow-hidden h-48 bg-secondary">
                      <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                      <button
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-destructive hover:bg-background/90 transition-colors"
                        onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/40 transition-colors bg-secondary/30 hover:bg-secondary/50">
                      <ImageIcon size={40} className="text-muted-foreground mb-2" />
                      <span className="text-sm font-medium text-muted-foreground">Click to upload event cover</span>
                      <span className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 5MB</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleCoverChange(e.target.files?.[0] || null)} />
                    </label>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="grid gap-2">
                <Label className="text-sm font-semibold">Event Title</Label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Annual Art Exhibition 2026"
                  className="text-base h-12"
                />
              </div>

              {/* Category & Visibility */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="art">🎨 Art Exhibition</SelectItem>
                      <SelectItem value="music">🎵 Music Performance</SelectItem>
                      <SelectItem value="workshop">🎓 Workshop</SelectItem>
                      <SelectItem value="networking">🤝 Networking</SelectItem>
                      <SelectItem value="conference">🎤 Conference</SelectItem>
                      <SelectItem value="other">✨ Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold">Visibility</Label>
                  <Button
                    variant={isPublic ? "default" : "outline"}
                    onClick={() => setIsPublic(!isPublic)}
                    className="justify-between h-10"
                  >
                    <span>{isPublic ? "Public" : "Private"}</span>
                    {isPublic ? <Eye size={16} /> : <EyeOff size={16} />}
                  </Button>
                </div>
              </div>

              {/* Short Description */}
              <div className="grid gap-2">
                <Label className="text-sm font-semibold">Short Description (for preview)</Label>
                <Input
                  value={shortDescription}
                  onChange={e => setShortDescription(e.target.value.slice(0, 100))}
                  maxLength={100}
                  placeholder="One line teaser (max 100 characters)"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">{shortDescription.length}/100</p>
              </div>

              {/* Full Description */}
              <div className="grid gap-2">
                <Label className="text-sm font-semibold">Full Description</Label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your event in detail... What's the mood? What will happen?"
                  rows={5}
                  className="text-sm resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Date & Location */}
          <Card className="border-border/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">2</div>
                Date, Time & Location
              </CardTitle>
              <CardDescription>When and where is your event?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Calendar size={16} /> Date
                  </Label>
                  <Input
                    type="date"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold">Time</Label>
                  <Input
                    type="time"
                    value={eventTime}
                    onChange={e => setEventTime(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Users size={16} /> Max Attendees (optional)
                  </Label>
                  <Input
                    type="number"
                    value={maxAttendees}
                    onChange={e => setMaxAttendees(e.target.value)}
                    placeholder="Leave blank for unlimited"
                    className="h-10"
                  />
                </div>
              </div>

              {/* Virtual Toggle */}
              <div className="bg-secondary/50 rounded-lg p-4 border border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-semibold">Virtual Event?</Label>
                    <p className="text-xs text-muted-foreground mt-1">Join online from anywhere</p>
                  </div>
                  <Button
                    variant={isVirtual ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsVirtual(!isVirtual)}
                  >
                    {isVirtual ? "Virtual" : "In-Person"}
                  </Button>
                </div>
              </div>

              {/* Location or Virtual Link */}
              {isVirtual ? (
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Globe size={16} /> Meeting Link
                  </Label>
                  <Input
                    value={virtualLink}
                    onChange={e => setVirtualLink(e.target.value)}
                    placeholder="https://zoom.us/... or https://meet.google.com/..."
                    className="h-10"
                  />
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <MapPin size={16} /> Location
                  </Label>
                  <Input
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="Venue name or address"
                    className="h-10"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 3: Event Guidelines */}
          <Card className="border-border/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">3</div>
                Guidelines & Rules
              </CardTitle>
              <CardDescription>Set expectations for attendees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-sm font-semibold">Event Guidelines</Label>
                <Textarea
                  value={guidelines}
                  onChange={e => setGuidelines(e.target.value)}
                  placeholder="e.g., No photos without permission, Doors open 30 min early, Required equipment..."
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold">Dress Code (optional)</Label>
                  <Input
                    value={dressCode}
                    onChange={e => setDressCode(e.target.value)}
                    placeholder="e.g., Casual, Formal, Costume..."
                    className="h-10"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold">Age Restriction (optional)</Label>
                  <Select value={ageRestriction} onValueChange={setAgeRestriction}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="No restriction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No restriction</SelectItem>
                      <SelectItem value="13+">13+</SelectItem>
                      <SelectItem value="16+">16+</SelectItem>
                      <SelectItem value="18+">18+</SelectItem>
                      <SelectItem value="21+">21+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Tags & Hashtags */}
          <Card className="border-border/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">4</div>
                Tags & Hashtags
              </CardTitle>
              <CardDescription>Help people discover your event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tags */}
              <div className="grid gap-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Tag size={16} /> Event Tags
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag(tagInput))}
                    placeholder="Add tag and press Enter"
                    className="h-10 flex-1"
                  />
                  <Button onClick={() => addTag(tagInput)} variant="outline" size="sm">
                    <Plus size={16} />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-2">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-destructive">
                          <X size={14} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Hashtags */}
              <div className="grid gap-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Hash size={16} /> Hashtags (for social media)
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={hashtagInput}
                    onChange={e => setHashtagInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addHashtag(hashtagInput))}
                    placeholder="Add hashtag (e.g., #artexpo) and press Enter"
                    className="h-10 flex-1"
                  />
                  <Button onClick={() => addHashtag(hashtagInput)} variant="outline" size="sm">
                    <Plus size={16} />
                  </Button>
                </div>
                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map(tag => (
                      <Badge key={tag} variant="outline" className="gap-2">
                        {tag}
                        <button onClick={() => removeHashtag(tag)} className="hover:text-destructive">
                          <X size={14} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Social Media Links */}
          <Card className="border-border/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">5</div>
                Social Media & Links
              </CardTitle>
              <CardDescription>Connect your event across platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Instagram size={16} /> Instagram
                  </Label>
                  <Input
                    value={socialLinks.instagram}
                    onChange={e => setSocialLinks({...socialLinks, instagram: e.target.value})}
                    placeholder="https://instagram.com/yourprofile"
                    className="h-10"
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Twitter size={16} /> Twitter/X
                  </Label>
                  <Input
                    value={socialLinks.twitter}
                    onChange={e => setSocialLinks({...socialLinks, twitter: e.target.value})}
                    placeholder="https://twitter.com/yourprofile"
                    className="h-10"
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Youtube size={16} /> YouTube
                  </Label>
                  <Input
                    value={socialLinks.youtube}
                    onChange={e => setSocialLinks({...socialLinks, youtube: e.target.value})}
                    placeholder="https://youtube.com/@yourchannel"
                    className="h-10"
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Music size={16} /> TikTok
                  </Label>
                  <Input
                    value={socialLinks.tiktok}
                    onChange={e => setSocialLinks({...socialLinks, tiktok: e.target.value})}
                    placeholder="https://tiktok.com/@yourprofile"
                    className="h-10"
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <LinkIcon size={16} /> Website
                  </Label>
                  <Input
                    value={socialLinks.website}
                    onChange={e => setSocialLinks({...socialLinks, website: e.target.value})}
                    placeholder="https://yourwebsite.com"
                    className="h-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 6: Announcement */}
          <Card className="border-primary/30 bg-primary/5 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/40 flex items-center justify-center text-primary font-bold">6</div>
                  Launch Announcement
                </CardTitle>
                <Button
                  variant={showAnnouncement ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAnnouncement(!showAnnouncement)}
                >
                  {showAnnouncement ? "Enabled" : "Disabled"}
                </Button>
              </div>
              <CardDescription>Let people know you're hosting something special</CardDescription>
            </CardHeader>
            {showAnnouncement && (
              <CardContent>
                <Textarea
                  value={announcementText}
                  onChange={e => setAnnouncementText(e.target.value)}
                  placeholder="Write an exciting announcement to share when event goes live... (optional)"
                  rows={3}
                  className="text-sm resize-none"
                />
              </CardContent>
            )}
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => navigate("/events")}
              className="px-6 h-11"
            >
              Cancel
            </Button>
            <Button
              variant="hero"
              onClick={() => saveEvent.mutate()}
              disabled={!isFormValid || saveEvent.isPending}
              className="px-8 h-11"
            >
              {saveEvent.isPending ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "🚀 Create Event"
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
