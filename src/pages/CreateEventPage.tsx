import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Image as ImageIcon, Plus, X, Globe, MapPin, Calendar, Users, Tag, Instagram, Twitter, Youtube, Music, LinkIcon, Eye, EyeOff } from "lucide-react";

export default function CreateEventPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Please sign in to create events.</p>
          <Button onClick={() => navigate("/login")} className="mt-4">Sign In</Button>
        </div>
      </div>
    );
  }

  // Form state
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

  // Handlers
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
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  // Validation
  const isFormValid = !!(
    title.trim() &&
    eventDate &&
    eventTime &&
    (isVirtual ? virtualLink.trim() : location.trim())
  );

  // Save mutation
  const saveEvent = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
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

      const eventDateTime = new Date(`${eventDate}T${eventTime}`).toISOString();
      const payload = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        event_date: eventDateTime,
        location: locVal,
        max_attendees: maxAttendees ? parseInt(maxAttendees, 10) : null,
        cover_url,
        is_public: isPublic,
      };

      const { error } = await supabase.from("events").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("🎉 Event created successfully!");
      setTimeout(() => navigate("/events"), 1500);
    },
    onError: (err: any) => toast.error(err.message || "Failed to create event"),
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-4 px-4 md:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/events")} className="h-10 w-10">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-extrabold">
              Create Event<span className="text-primary">.</span>
            </h1>
            <p className="text-muted-foreground mt-1">Share your amazing event</p>
          </div>
        </div>

        <div className="grid gap-4">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">1</span>
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cover */}
              <div>
                <Label className="text-sm font-semibold block mb-2">Cover Image</Label>
                {coverPreview ? (
                  <div className="relative rounded-lg overflow-hidden h-28 bg-secondary">
                    <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
                    <button className="absolute top-2 right-2 h-8 w-8 rounded-full bg-destructive text-white flex items-center justify-center" onClick={() => { setCoverFile(null); setCoverPreview(null); }} type="button">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-28 rounded-lg border-2 border-dashed border-border cursor-pointer hover:bg-secondary/30 bg-secondary/10">
                    <ImageIcon size={32} className="text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click to upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleCoverChange(e.target.files?.[0] || null)} />
                  </label>
                )}
              </div>

              {/* Title */}
              <div>
                <Label className="text-sm font-semibold block mb-2">Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event name" maxLength={100} />
              </div>

              {/* Category & Visibility */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold block mb-2">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="art">🎨 Art</SelectItem>
                      <SelectItem value="music">🎵 Music</SelectItem>
                      <SelectItem value="workshop">🎓 Workshop</SelectItem>
                      <SelectItem value="other">✨ Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-semibold block mb-2">Visibility</Label>
                  <Button variant={isPublic ? "default" : "outline"} onClick={() => setIsPublic(!isPublic)} className="w-full">
                    {isPublic ? "Public" : "Private"}
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm font-semibold block mb-2">Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your event..." rows={2} />
              </div>
            </CardContent>
          </Card>

          {/* Date & Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">2</span>
                Date & Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-sm font-semibold block mb-2">Date *</Label>
                  <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm font-semibold block mb-2">Time *</Label>
                  <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm font-semibold block mb-2">Max Attendees</Label>
                  <Input type="number" value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value)} placeholder="Unlimited" min="1" />
                </div>
              </div>

              {/* Virtual Toggle */}
              <Button onClick={() => setIsVirtual(!isVirtual)} variant={isVirtual ? "default" : "outline"} className="w-full">
                {isVirtual ? "Virtual Event" : "In-Person Event"}
              </Button>

              {/* Location or Link */}
              {isVirtual ? (
                <div>
                  <Label className="text-sm font-semibold block mb-2">Meeting Link *</Label>
                  <Input value={virtualLink} onChange={(e) => setVirtualLink(e.target.value)} placeholder="https://zoom.us/..." type="url" />
                </div>
              ) : (
                <div>
                  <Label className="text-sm font-semibold block mb-2">Location *</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Venue or address" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">3</span>
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(tagInput))} placeholder="Add tag" />
                <Button onClick={() => addTag(tagInput)} variant="outline" size="icon">
                  <Plus size={16} />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-2">
                      {tag}
                      <button onClick={() => removeTag(tag)} type="button">
                        <X size={14} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">4</span>
                Social Media
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-semibold block mb-1">Instagram</Label>
                <Input value={socialLinks.instagram} onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })} placeholder="https://instagram.com/..." />
              </div>
              <div>
                <Label className="text-sm font-semibold block mb-1">Twitter</Label>
                <Input value={socialLinks.twitter} onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })} placeholder="https://twitter.com/..." />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => navigate("/events")} disabled={saveEvent.isPending}>
              Cancel
            </Button>
            <Button variant="hero" onClick={() => saveEvent.mutate()} disabled={!isFormValid || saveEvent.isPending}>
              {saveEvent.isPending ? "Creating..." : "🚀 Create Event"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
