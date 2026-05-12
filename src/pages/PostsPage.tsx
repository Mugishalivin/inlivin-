<<<<<<< HEAD
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  FileImage,
  Globe,
  Hash,
  ImagePlus,
  Link as LinkIcon,
  Loader2,
  Lock,
  Plus,
  RefreshCcw,
  Send,
  Sparkles,
  Target,
  Trash2,
  Video,
  Wand2,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type LinkItem = {
  id: string;
  title: string;
  url: string;
  icon: string;
  order: number;
};

type DraftState = {
  title: string;
  content: string;
  imageUrl: string;
  isPublic: boolean;
  postStyle: "standard" | "announcement";
  textTheme: TextTheme;
  textAlign: TextAlign;
  textSize: TextSize;
  links: LinkItem[];
};

type TextTheme = "sunset" | "ocean" | "ink" | "fresh" | "paper" | "royal";
type TextAlign = "left" | "center" | "right";
type TextSize = "sm" | "md" | "lg";

const DRAFT_KEY = "inlivin-post-composer-draft";
const MAX_FILES = 6;

const textThemes: Record<TextTheme, { label: string; className: string; chip: string }> = {
  sunset: { label: "Sunset", className: "bg-gradient-to-br from-primary via-rose-500 to-accent text-primary-foreground", chip: "bg-primary" },
  ocean: { label: "Ocean", className: "bg-gradient-to-br from-accent via-cyan-600 to-primary text-white", chip: "bg-accent" },
  ink: { label: "Ink", className: "bg-foreground text-background", chip: "bg-foreground" },
  fresh: { label: "Fresh", className: "bg-gradient-to-br from-emerald-500 via-accent to-primary text-white", chip: "bg-emerald-500" },
  paper: { label: "Paper", className: "bg-secondary text-secondary-foreground", chip: "bg-secondary" },
  royal: { label: "Royal", className: "bg-gradient-to-br from-violet-600 via-primary to-fuchsia-600 text-white", chip: "bg-violet-600" },
};

const textAlignClasses: Record<TextAlign, string> = {
  left: "text-left items-start",
  center: "text-center items-center",
  right: "text-right items-end",
};

const textSizeClasses: Record<TextSize, string> = {
  sm: "text-xl md:text-2xl",
  md: "text-2xl md:text-3xl",
  lg: "text-3xl md:text-4xl",
};

const promptChips = [
  "New release",
  "Behind the scenes",
  "Open for collabs",
  "Process update",
  "Event recap",
  "Resource drop",
];

const ctaSnippets = [
  "What do you think?",
  "Save this for later.",
  "Message me if you want to collaborate.",
  "I would love feedback from other creators.",
];

const linkIcons = [
  { value: "Globe", label: "Website" },
  { value: "Music", label: "Music" },
  { value: "Video", label: "Video" },
  { value: "Image", label: "Portfolio" },
  { value: "Package", label: "Product" },
  { value: "Zap", label: "Featured" },
];

const normalizeUrl = (url: string) => {
  const trimmed = url.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const extractTags = (text: string) => {
  const explicit = [...text.matchAll(/#([\w-]+)/g)].map((match) => match[1].toLowerCase());
  const words = text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 4)
    .slice(0, 8);
  return [...new Set([...explicit, ...words])].slice(0, 8);
};

export default function PostsPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [postStyle, setPostStyle] = useState<"standard" | "announcement">("standard");
  const [textTheme, setTextTheme] = useState<TextTheme>("sunset");
  const [textAlign, setTextAlign] = useState<TextAlign>("center");
  const [textSize, setTextSize] = useState<TextSize>("md");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [newLink, setNewLink] = useState({ title: "", url: "", icon: "Globe" });
  const [activeTab, setActiveTab] = useState("compose");

  useEffect(() => {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as DraftState;
      setTitle(draft.title || "");
      setContent(draft.content || "");
      setImageUrl(draft.imageUrl || "");
      setIsPublic(draft.isPublic ?? true);
      setPostStyle(draft.postStyle || "standard");
      setTextTheme(draft.textTheme || "sunset");
      setTextAlign(draft.textAlign || "center");
      setTextSize(draft.textSize || "md");
      setLinks(draft.links || []);
    } catch {
      window.localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview));
  }, [previews]);

  const derivedTags = useMemo(() => extractTags(`${title} ${content}`), [title, content]);
  const hasMedia = imageUrl.trim().length > 0 || files.length > 0;
  const hasVisualSlot = hasMedia || content.trim().length > 0 || title.trim().length > 0;
  const readinessScore = useMemo(() => {
    let score = 0;
    if (content.trim().length >= 20) score += 35;
    if (title.trim()) score += 15;
    if (hasVisualSlot) score += 20;
    if (links.length > 0) score += 10;
    if (derivedTags.length > 0) score += 10;
    if (content.trim().length <= 500) score += 10;
    return Math.min(score, 100);
  }, [content, derivedTags.length, hasVisualSlot, links.length, title]);

  const saveDraft = () => {
    const draft: DraftState = { title, content, imageUrl, isPublic, postStyle, textTheme, textAlign, textSize, links };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    toast.success("Draft saved");
  };

  const clearDraft = () => {
    setTitle("");
    setContent("");
    setImageUrl("");
    setIsPublic(true);
    setPostStyle("standard");
    setTextTheme("sunset");
    setTextAlign("center");
    setTextSize("md");
    setFiles([]);
    setPreviews([]);
    setLinks([]);
    window.localStorage.removeItem(DRAFT_KEY);
    toast.success("Composer cleared");
  };

  const handleFiles = (selected: FileList | null) => {
    if (!selected) return;
    const mediaFiles = Array.from(selected)
      .filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"))
      .slice(0, MAX_FILES);

    if (mediaFiles.length === 0) {
      toast.error("Please choose image or video files");
      return;
    }

    previews.forEach((preview) => URL.revokeObjectURL(preview));
    setFiles(mediaFiles);
    setPreviews(mediaFiles.map((file) => URL.createObjectURL(file)));
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
    setPreviews((current) => current.filter((_, previewIndex) => previewIndex !== index));
  };

  const addLink = () => {
    if (!newLink.title.trim() || !newLink.url.trim()) {
      toast.error("Add a title and URL for the link");
      return;
    }

    const url = normalizeUrl(newLink.url);
    try {
      new URL(url);
    } catch {
      toast.error("Enter a valid link");
      return;
    }

    setLinks((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        title: newLink.title.trim(),
        url,
        icon: newLink.icon,
        order: current.length,
      },
    ]);
    setNewLink({ title: "", url: "", icon: "Globe" });
  };

  const addPromptChip = (chip: string) => {
    setContent((current) => {
      const spacer = current.trim() ? "\n\n" : "";
      return `${current}${spacer}${chip}: `;
    });
  };

  const appendSnippet = (snippet: string) => {
    setContent((current) => {
      const spacer = current.trim() ? "\n\n" : "";
      return `${current}${spacer}${snippet}`;
    });
  };

  const publishPost = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Please sign in first.");
      if (!content.trim()) throw new Error("Write something before publishing.");

      const uploadedMedia: Array<{ url: string; type: string }> = [];
      for (const [index, file] of files.entries()) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/posts/${Date.now()}-${index}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("project-files").upload(path, file, {
          upsert: true,
          contentType: file.type,
        });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("project-files").getPublicUrl(path);
        uploadedMedia.push({
          url: data.publicUrl,
          type: file.type.startsWith("video/") ? "video" : "image",
        });
      }

      const hostedImage = imageUrl.trim();
      const caption = title.trim() ? `${title.trim()}\n\n${content.trim()}` : content.trim();
      const hasVideo = uploadedMedia.some((item) => item.type === "video");
      const isAnnouncement = !hostedImage && uploadedMedia.length === 0;
      const { data: post, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          caption,
          post_type: isAnnouncement ? "announcement" : hasVideo ? "reel" : hostedImage || uploadedMedia.length > 1 ? "carousel" : "post",
          visibility: isPublic ? "public" : "private",
          allow_comments: true,
          hide_like_count: false,
          is_draft: false,
          tags: isAnnouncement
            ? [...derivedTags, `_style:${textTheme}`, `_align:${textAlign}`, `_size:${textSize}`]
            : derivedTags,
        })
        .select()
        .single();

      if (error) throw error;

      if (hostedImage) {
        await (supabase as any).from("post_media").insert({
          post_id: post.id,
          media_url: hostedImage,
          media_type: "image",
          display_order: 0,
        });
      }

      if (uploadedMedia.length > 0) {
        const offset = hostedImage ? 1 : 0;
        await (supabase as any).from("post_media").insert(
          uploadedMedia.map((item, index) => ({
            post_id: post.id,
            media_url: item.url,
            media_type: item.type,
            display_order: index + offset,
          }))
        );
      }

      if (links.length > 0) {
        const { error: linkError } = await (supabase as any).from("post_links").insert(
          links.map((link, index) => ({
            post_id: post.id,
            title: link.title,
            url: link.url,
            icon: link.icon,
            order: index,
          }))
        );
        if (linkError) {
          toast.warning("Post published, but links could not be saved");
        }
      }

      return post;
    },
    onSuccess: () => {
      window.localStorage.removeItem(DRAFT_KEY);
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      toast.success("Post published");
      navigate("/feed");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to publish post"),
  });

  const previewMedia = previews[0]
    ? { url: previews[0], type: files[0]?.type.startsWith("video/") ? "video" : "image" }
    : imageUrl.trim()
      ? { url: imageUrl.trim(), type: "image" }
      : null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <Button variant="ghost" className="mb-2 px-0 text-muted-foreground" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="font-display text-2xl font-extrabold text-foreground md:text-4xl">
              Create Post<span className="text-primary">.</span>
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Build a clean, media-rich update for your audience. Publishing sends you back to the feed.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={saveDraft}>
              <RefreshCcw className="h-4 w-4" />
              Save draft
            </Button>
            <Button onClick={() => publishPost.mutate()} disabled={publishPost.isPending || !content.trim()}>
              {publishPost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publish
            </Button>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="border-border/60 bg-card">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle className="font-display text-xl">Composer</CardTitle>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="compose">Compose</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsContent value="compose" className="mt-0 space-y-6">
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
                    <div className="space-y-2">
                      <Label htmlFor="post-title">Title</Label>
                      <Input
                        id="post-title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Name the update"
                        maxLength={90}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Visibility</Label>
                      <button
                        type="button"
                        onClick={() => setIsPublic((value) => !value)}
                        className={`flex h-10 w-full items-center justify-between rounded-lg border px-3 text-sm transition ${
                          isPublic ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                          {isPublic ? "Public" : "Private"}
                        </span>
                        {isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="post-content">Post copy</Label>
                      <span className="text-xs text-muted-foreground">{content.length}/1200</span>
                    </div>
                    <Textarea
                      id="post-content"
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      placeholder="Share the story, context, launch note, or call for collaboration..."
                      maxLength={1200}
                      className="min-h-40 resize-y"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={postStyle === "announcement" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPostStyle(postStyle === "announcement" ? "standard" : "announcement")}
                      >
                        <MessageStyleIcon />
                        Text announcement
                      </Button>
                      {promptChips.map((chip) => (
                        <Button key={chip} type="button" variant="outline" size="sm" onClick={() => addPromptChip(chip)}>
                          <Sparkles className="h-3.5 w-3.5" />
                          {chip}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {!hasMedia && (
                    <div className="space-y-4 rounded-lg border border-border bg-background p-4">
                      <div>
                        <Label className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Text card style
                        </Label>
                        <p className="mt-1 text-xs text-muted-foreground">
                          When no media is uploaded, this style fills the visual space on the feed and profile.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {(Object.entries(textThemes) as Array<[TextTheme, typeof textThemes[TextTheme]]>).map(([theme, config]) => (
                          <button
                            key={theme}
                            type="button"
                            onClick={() => setTextTheme(theme)}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                              textTheme === theme ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary"
                            }`}
                          >
                            <span className={`h-4 w-4 rounded-full ${config.chip}`} />
                            {config.label}
                          </button>
                        ))}
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Alignment</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {(["left", "center", "right"] as TextAlign[]).map((align) => (
                              <Button
                                key={align}
                                type="button"
                                variant={textAlign === align ? "default" : "outline"}
                                size="sm"
                                onClick={() => setTextAlign(align)}
                                className="capitalize"
                              >
                                {align}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Text size</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {(["sm", "md", "lg"] as TextSize[]).map((size) => (
                              <Button
                                key={size}
                                type="button"
                                variant={textSize === size ? "default" : "outline"}
                                size="sm"
                                onClick={() => setTextSize(size)}
                                className="uppercase"
                              >
                                {size}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 rounded-lg border border-border bg-background p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Label className="flex items-center gap-2">
                          <ImagePlus className="h-4 w-4 text-primary" />
                          Media
                        </Label>
                        <p className="mt-1 text-xs text-muted-foreground">Upload up to {MAX_FILES} images or videos, or paste a hosted image URL.</p>
                      </div>
                      <Badge variant="secondary">{files.length} uploaded</Badge>
                    </div>
                    <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
                      <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card text-center transition hover:border-primary/50">
                        <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={(event) => handleFiles(event.target.files)} />
                        <FileImage className="mb-2 h-8 w-8 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Choose media</span>
                        <span className="mt-1 text-xs text-muted-foreground">PNG, JPG, WebP, MP4</span>
                      </label>
                      <div className="space-y-3">
                        <Input
                          value={imageUrl}
                          onChange={(event) => setImageUrl(event.target.value)}
                          placeholder="https://example.com/cover.jpg"
                        />
                        {previews.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                            {previews.map((preview, index) => (
                              <div key={preview} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
                                {files[index]?.type.startsWith("video/") ? (
                                  <video src={preview} className="h-full w-full object-cover" muted playsInline />
                                ) : (
                                  <img src={preview} alt="" className="h-full w-full object-cover" />
                                )}
                                {files[index]?.type.startsWith("video/") && (
                                  <span className="absolute bottom-1 left-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                                    <Video className="mr-1 inline h-3 w-3" />
                                    Video
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-foreground opacity-0 shadow transition group-hover:opacity-100"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-lg border border-border bg-background p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Label className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-primary" />
                        Links and resources
                      </Label>
                      <Badge variant="secondary">{links.length} link{links.length === 1 ? "" : "s"}</Badge>
                    </div>
                    <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_150px_auto]">
                      <Input
                        value={newLink.title}
                        onChange={(event) => setNewLink((current) => ({ ...current, title: event.target.value }))}
                        placeholder="Label"
                      />
                      <Input
                        value={newLink.url}
                        onChange={(event) => setNewLink((current) => ({ ...current, url: event.target.value }))}
                        placeholder="https://..."
                      />
                      <Select value={newLink.icon} onValueChange={(value) => setNewLink((current) => ({ ...current, icon: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {linkIcons.map((icon) => (
                            <SelectItem key={icon.value} value={icon.value}>
                              {icon.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" onClick={addLink}>
                        <Plus className="h-4 w-4" />
                        Add
                      </Button>
                    </div>
                    {links.length > 0 && (
                      <div className="space-y-2">
                        {links.map((link) => (
                          <div key={link.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
                            <LinkIcon className="h-4 w-4 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">{link.title}</p>
                              <p className="truncate text-xs text-muted-foreground">{link.url}</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setLinks((current) => current.filter((item) => item.id !== link.id))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-border bg-background p-4">
                      <Label className="flex items-center gap-2">
                        <Wand2 className="h-4 w-4 text-primary" />
                        Suggested finishing lines
                      </Label>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {ctaSnippets.map((snippet) => (
                          <Button key={snippet} type="button" variant="outline" size="sm" onClick={() => appendSnippet(snippet)}>
                            {snippet}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-4">
                      <Label className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-primary" />
                        Detected topics
                      </Label>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {derivedTags.length > 0 ? (
                          derivedTags.map((tag) => <Badge key={tag} variant="secondary">#{tag}</Badge>)
                        ) : (
                          <p className="text-sm text-muted-foreground">Topics appear as you write.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="mt-0">
                  <PostPreview
                    title={title}
                    content={content}
                    media={previewMedia}
                    isPublic={isPublic}
                    postStyle={postStyle}
                    textTheme={textTheme}
                    textAlign={textAlign}
                    textSize={textSize}
                    displayName={profile?.display_name || user?.email?.split("@")[0] || "Creator"}
                    avatarUrl={profile?.avatar_url}
                    links={links}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <aside className="space-y-4">
            <Card className="border-border/60 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-primary" />
                  Publish Readiness
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Score</span>
                    <span className="font-semibold text-foreground">{readinessScore}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-gradient-primary transition-all" style={{ width: `${readinessScore}%` }} />
                  </div>
                </div>
                <ChecklistItem done={content.trim().length >= 20} label="Clear post copy" />
                <ChecklistItem done={!!title.trim()} label="Readable title" />
                <ChecklistItem done={hasVisualSlot} label="Visual card ready" />
                <ChecklistItem done={links.length > 0} label="Resource link added" />
                <ChecklistItem done={content.trim().length <= 500} label="Easy to scan" />
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card">
              <CardHeader>
                <CardTitle className="text-base">Publishing Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Public post</p>
                    <p className="text-xs text-muted-foreground">Visible to other users when feeds support posts.</p>
                  </div>
                  <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                </div>
                <Button className="w-full" onClick={() => publishPost.mutate()} disabled={publishPost.isPending || !content.trim()}>
                  {publishPost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Publish and go to Feed
                </Button>
                <Button variant="outline" className="w-full" onClick={clearDraft}>
                  <Trash2 className="h-4 w-4" />
                  Clear composer
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
=======
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Image as ImageIcon,
  Video, Film, Plus, MapPin, Music, Hash, Sparkles, ChevronLeft, ChevronRight,
  Smile, Flame, Laugh, Frown, X, Globe, Lock, Users as UsersIcon, BarChart3,
  Pause, Play, Volume2, VolumeX, Eye, Trash2, Pin, Search,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Profile = { user_id: string; display_name: string | null; avatar_url: string | null; username?: string | null };
type Media = { id: string; media_url: string; media_type: string; thumbnail_url?: string | null; display_order: number };
type Post = {
  id: string;
  user_id: string;
  caption: string | null;
  location: string | null;
  post_type: string;
  music_track?: string | null;
  music_artist?: string | null;
  visibility: string;
  allow_comments: boolean;
  hide_like_count: boolean;
  is_pinned: boolean;
  is_draft: boolean;
  tags: string[] | null;
  view_count: number;
  expires_at: string | null;
  created_at: string;
  profile?: Profile | null;
  media?: Media[];
  likes_count?: number;
  comments_count?: number;
  liked_by_me?: boolean;
  saved_by_me?: boolean;
  my_reaction?: string | null;
};

const sb = supabase as any;
const REACTIONS = [
  { key: "like", icon: Heart, color: "text-rose-500", label: "Like" },
  { key: "fire", icon: Flame, color: "text-orange-500", label: "Fire" },
  { key: "laugh", icon: Laugh, color: "text-yellow-500", label: "Haha" },
  { key: "wow", icon: Sparkles, color: "text-purple-500", label: "Wow" },
  { key: "sad", icon: Frown, color: "text-blue-500", label: "Sad" },
];

// Floating animated background words (landing effect)
const FloatingWords = () => {
  const words = ["create", "share", "inspire", "live", "art", "vibe", "studio", "feed"];
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-[0.06] dark:opacity-[0.08]">
      {words.map((w, i) => (
        <motion.div
          key={w}
          className="absolute font-display text-7xl md:text-9xl font-black tracking-tighter"
          initial={{ x: `${(i * 37) % 100}%`, y: `${(i * 53) % 100}%` }}
          animate={{ x: [`${(i * 37) % 100}%`, `${(i * 47 + 20) % 100}%`, `${(i * 37) % 100}%`], y: [`${(i * 53) % 100}%`, `${(i * 31 + 30) % 100}%`, `${(i * 53) % 100}%`] }}
          transition={{ duration: 30 + i * 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {w}
        </motion.div>
      ))}
    </div>
  );
};

// ============== STORIES BAR ==============
function StoriesBar({ onOpenCreate, onOpenStory }: { onOpenCreate: () => void; onOpenStory: (id: string) => void }) {
  const { user } = useAuth();
  const [stories, setStories] = useState<Post[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await sb
        .from("posts")
        .select("id, user_id, caption, created_at, expires_at, post_type")
        .eq("post_type", "story")
        .eq("is_draft", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(30);
      if (!data) return;
      const userIds = [...new Set(data.map((s: any) => s.user_id))];
      const [{ data: profiles }, { data: media }] = await Promise.all([
        sb.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds),
        sb.from("post_media").select("*").in("post_id", data.map((s: any) => s.id)),
      ]);
      const profMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      const mediaMap = new Map<string, Media[]>();
      (media || []).forEach((m: any) => {
        const arr = mediaMap.get(m.post_id) || [];
        arr.push(m);
        mediaMap.set(m.post_id, arr);
      });
      setStories(data.map((s: any) => ({ ...s, profile: profMap.get(s.user_id), media: mediaMap.get(s.id) || [] })));
    })();
  }, []);

  // Group stories by user
  const grouped = useMemo(() => {
    const map = new Map<string, Post[]>();
    stories.forEach((s) => {
      const arr = map.get(s.user_id) || [];
      arr.push(s);
      map.set(s.user_id, arr);
    });
    return Array.from(map.entries());
  }, [stories]);

  return (
    <div className="mb-6">
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenCreate}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary via-pink-500 to-amber-500 p-[2px]">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                <Plus className="w-6 h-6 text-primary" />
              </div>
            </div>
            <span className="text-xs text-muted-foreground">Your story</span>
          </motion.button>
          {grouped.map(([uid, items]) => {
            const first = items[0];
            return (
              <motion.button
                key={uid}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onOpenStory(first.id)}
                className="flex flex-col items-center gap-1.5 shrink-0"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary via-pink-500 to-amber-500 p-[2.5px] animate-pulse-slow">
                  <div className="w-full h-full rounded-full bg-background p-[2px]">
                    <Avatar className="w-full h-full">
                      <AvatarImage src={first.profile?.avatar_url || undefined} />
                      <AvatarFallback>{first.profile?.display_name?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <span className="text-xs truncate max-w-[64px]">{first.profile?.display_name || "User"}</span>
              </motion.button>
            );
          })}
        </div>
      </ScrollArea>
>>>>>>> 58da23d0bd108b20438c2b1208ed1fb9bb2944e7
    </div>
  );
}

<<<<<<< HEAD
function MessageStyleIcon() {
  return <Sparkles className="h-3.5 w-3.5" />;
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`flex h-5 w-5 items-center justify-center rounded-full ${done ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
        <Check className="h-3.5 w-3.5" />
      </span>
      <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}

function PostPreview({
  title,
  content,
  media,
  isPublic,
  postStyle,
  textTheme,
  textAlign,
  textSize,
  displayName,
  avatarUrl,
  links,
}: {
  title: string;
  content: string;
  media: { url: string; type: string } | null;
  isPublic: boolean;
  postStyle: "standard" | "announcement";
  textTheme: TextTheme;
  textAlign: TextAlign;
  textSize: TextSize;
  displayName: string;
  avatarUrl?: string | null;
  links: LinkItem[];
}) {
  return (
    <div className="mx-auto max-w-xl overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-secondary">
          {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : <Sparkles className="h-4 w-4 text-primary" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            {isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {isPublic ? "Public" : "Private"} preview
          </p>
        </div>
      </div>
      {media ? (
        <div className="aspect-video bg-muted">
          {media.type === "video" ? (
            <video src={media.url} className="h-full w-full object-contain bg-black" controls playsInline />
          ) : (
            <img src={media.url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
      ) : (
        <div className={`flex aspect-video justify-center p-8 ${textThemes[textTheme].className} ${textAlignClasses[textAlign]}`}>
          <div className="max-w-[92%]">
            <p className={`font-display font-extrabold leading-tight ${textSizeClasses[textSize]}`}>{title || "Announcement"}</p>
            <p className="mt-3 line-clamp-5 text-sm opacity-90">{content || "Write a short update people can read fast."}</p>
          </div>
        </div>
      )}
      <div className="space-y-3 p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{title || "Untitled post"}</h2>
        <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
          {content || "Your post copy will appear here as you write."}
        </p>
        {links.length > 0 && (
          <div className="space-y-2 pt-2">
            {links.map((link) => (
              <div key={link.id} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <LinkIcon className="h-4 w-4 text-primary" />
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">{link.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
=======
// ============== STORY VIEWER ==============
function StoryViewer({ storyId, onClose }: { storyId: string | null; onClose: () => void }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Post[]>([]);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!storyId) return;
    (async () => {
      const { data: story } = await sb.from("posts").select("user_id").eq("id", storyId).maybeSingle();
      if (!story) return;
      const { data } = await sb
        .from("posts")
        .select("*")
        .eq("user_id", story.user_id)
        .eq("post_type", "story")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: true });
      const ids = (data || []).map((d: any) => d.id);
      const [{ data: profile }, { data: media }] = await Promise.all([
        sb.from("profiles").select("*").eq("user_id", story.user_id).maybeSingle(),
        sb.from("post_media").select("*").in("post_id", ids),
      ]);
      const mediaMap = new Map<string, Media[]>();
      (media || []).forEach((m: any) => {
        const arr = mediaMap.get(m.post_id) || [];
        arr.push(m);
        mediaMap.set(m.post_id, arr);
      });
      const enriched = (data || []).map((p: any) => ({ ...p, profile, media: mediaMap.get(p.id) || [] }));
      const startIdx = enriched.findIndex((p: Post) => p.id === storyId);
      setIndex(Math.max(0, startIdx));
      setItems(enriched);
    })();
  }, [storyId]);

  // mark viewed
  useEffect(() => {
    const current = items[index];
    if (!current || !user) return;
    sb.from("story_views").upsert({ story_id: current.id, viewer_id: user.id }, { onConflict: "story_id,viewer_id" });
  }, [index, items, user]);

  // auto-progress
  useEffect(() => {
    if (!items[index]) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (index + 1 < items.length) setIndex(index + 1);
          else onClose();
          return 0;
        }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [index, items, onClose]);

  if (!storyId) return null;
  const current = items[index];
  if (!current) return null;
  const firstMedia = current.media?.[0];

  return (
    <Dialog open={!!storyId} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 bg-black overflow-hidden h-[80vh]">
        <div className="absolute top-0 left-0 right-0 z-10 p-3 flex gap-1">
          {items.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded overflow-hidden">
              <div
                className="h-full bg-white transition-all"
                style={{ width: i < index ? "100%" : i === index ? `${progress}%` : "0%" }}
              />
            </div>
          ))}
        </div>
        <div className="absolute top-6 left-3 right-3 z-10 flex items-center gap-2 pt-3">
          <Avatar className="w-8 h-8 ring-2 ring-white/30">
            <AvatarImage src={current.profile?.avatar_url || undefined} />
            <AvatarFallback>{current.profile?.display_name?.[0]}</AvatarFallback>
          </Avatar>
          <span className="text-white text-sm font-medium">{current.profile?.display_name}</span>
          <span className="text-white/60 text-xs ml-auto">{formatDistanceToNow(new Date(current.created_at), { addSuffix: true })}</span>
          <Button variant="ghost" size="icon" className="text-white" onClick={onClose}><X /></Button>
        </div>
        <div className="absolute inset-0 flex items-center justify-center" onClick={(e) => {
          const x = (e.nativeEvent as MouseEvent).offsetX;
          const w = (e.currentTarget as HTMLElement).clientWidth;
          if (x < w / 2 && index > 0) setIndex(index - 1);
          else if (x >= w / 2 && index < items.length - 1) setIndex(index + 1);
          else if (x >= w / 2) onClose();
        }}>
          {firstMedia?.media_type === "video" ? (
            <video src={firstMedia.media_url} autoPlay muted playsInline className="max-h-full max-w-full" />
          ) : firstMedia ? (
            <img src={firstMedia.media_url} className="max-h-full max-w-full" alt="" />
          ) : (
            <div className="text-white text-2xl font-display text-center px-8">{current.caption}</div>
          )}
        </div>
        {current.caption && firstMedia && (
          <div className="absolute bottom-16 left-0 right-0 px-6 text-white text-center text-sm bg-gradient-to-t from-black/70 to-transparent py-4">
            {current.caption}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============== POST CARD ==============
function PostCard({ post, onUpdate }: { post: Post; onUpdate: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mediaIdx, setMediaIdx] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isLiked, setIsLiked] = useState(!!post.liked_by_me);
  const [reaction, setReaction] = useState<string | null>(post.my_reaction ?? null);
  const [likes, setLikes] = useState(post.likes_count || 0);
  const [saved, setSaved] = useState(!!post.saved_by_me);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [doubleTapPing, setDoubleTapPing] = useState(false);

  const media = post.media || [];
  const currentMedia = media[mediaIdx];

  const toggleLike = async (reactionKey = "like") => {
    if (!user) return;
    const wasLiked = isLiked;
    if (wasLiked && reactionKey === reaction) {
      setIsLiked(false);
      setReaction(null);
      setLikes((l) => l - 1);
      await sb.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
    } else {
      setIsLiked(true);
      setReaction(reactionKey);
      if (!wasLiked) setLikes((l) => l + 1);
      await sb.from("post_likes").upsert({ post_id: post.id, user_id: user.id, reaction: reactionKey }, { onConflict: "post_id,user_id" });
    }
    setShowReactions(false);
  };

  const doubleTap = () => {
    if (!isLiked) toggleLike("like");
    setDoubleTapPing(true);
    setTimeout(() => setDoubleTapPing(false), 700);
  };

  const toggleSave = async () => {
    if (!user) return;
    if (saved) {
      await sb.from("post_saves").delete().eq("post_id", post.id).eq("user_id", user.id);
      setSaved(false);
      toast.success("Removed from saved");
    } else {
      await sb.from("post_saves").insert({ post_id: post.id, user_id: user.id });
      setSaved(true);
      toast.success("Saved");
    }
  };

  const loadComments = async () => {
    const { data } = await sb
      .from("post_comments")
      .select("*")
      .eq("post_id", post.id)
      .order("created_at", { ascending: false })
      .limit(50);
    const uids = [...new Set((data || []).map((c: any) => c.user_id))];
    const { data: profs } = await sb.from("profiles").select("user_id, display_name, avatar_url").in("user_id", uids);
    const pm = new Map((profs || []).map((p: any) => [p.user_id, p]));
    setComments((data || []).map((c: any) => ({ ...c, profile: pm.get(c.user_id) })));
  };

  useEffect(() => {
    if (showComments) loadComments();
  }, [showComments]);

  const submitComment = async () => {
    if (!user || !commentText.trim()) return;
    const { error } = await sb.from("post_comments").insert({ post_id: post.id, user_id: user.id, content: commentText.trim() });
    if (error) return toast.error(error.message);
    setCommentText("");
    loadComments();
  };

  const sharePost = () => {
    const url = `${window.location.origin}/posts?p=${post.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  const deletePost = async () => {
    if (!user || user.id !== post.user_id) return;
    if (!confirm("Delete this post?")) return;
    await sb.from("posts").delete().eq("id", post.id);
    toast.success("Post deleted");
    onUpdate();
  };

  const currentReaction = REACTIONS.find((r) => r.key === reaction) || REACTIONS[0];
  const ReactionIcon = currentReaction.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-3">
        <button onClick={() => navigate(`/profile/${post.user_id}`)} className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary via-pink-500 to-amber-500 p-[2px]">
            <Avatar className="w-full h-full ring-2 ring-background">
              <AvatarImage src={post.profile?.avatar_url || undefined} />
              <AvatarFallback>{post.profile?.display_name?.[0]}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm truncate">{post.profile?.display_name || "User"}</span>
              {post.is_pinned && <Pin className="w-3 h-3 text-primary" />}
            </div>
            {post.location && <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{post.location}</div>}
          </div>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={sharePost}>Copy link</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast("Reported")}>Report</DropdownMenuItem>
            {user?.id === post.user_id && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={deletePost} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Media carousel */}
      {media.length > 0 && (
        <div className="relative bg-black aspect-square" onDoubleClick={doubleTap}>
          <AnimatePresence mode="wait">
            <motion.div
              key={mediaIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {currentMedia.media_type === "video" ? (
                <>
                  <video
                    ref={videoRef}
                    src={currentMedia.media_url}
                    className="max-h-full max-w-full"
                    loop
                    muted={muted}
                    playsInline
                    onClick={() => {
                      if (videoRef.current?.paused) { videoRef.current.play(); setPlaying(true); }
                      else { videoRef.current?.pause(); setPlaying(false); }
                    }}
                  />
                  <button
                    onClick={() => setMuted(!muted)}
                    className="absolute bottom-3 right-3 bg-black/60 text-white rounded-full p-2 backdrop-blur"
                  >
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  {!playing && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-black/40 rounded-full p-4"><Play className="w-8 h-8 text-white" /></div>
                    </div>
                  )}
                </>
              ) : (
                <img src={currentMedia.media_url} alt={post.caption || ""} className="max-h-full max-w-full object-contain" />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Double-tap heart */}
          <AnimatePresence>
            {doubleTapPing && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Heart className="w-32 h-32 text-white fill-rose-500" />
              </motion.div>
            )}
          </AnimatePresence>

          {media.length > 1 && (
            <>
              {mediaIdx > 0 && (
                <button onClick={() => setMediaIdx(mediaIdx - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 backdrop-blur">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              {mediaIdx < media.length - 1 && (
                <button onClick={() => setMediaIdx(mediaIdx + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 backdrop-blur">
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {media.map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === mediaIdx ? "bg-white w-4" : "bg-white/50"}`} />
                ))}
              </div>
            </>
          )}
          {post.music_track && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 text-white text-xs rounded-full px-3 py-1 backdrop-blur">
              <Music className="w-3 h-3 animate-spin-slow" />
              <span className="truncate max-w-[160px]">{post.music_track}{post.music_artist ? ` — ${post.music_artist}` : ""}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-1 relative">
          <div className="relative" onMouseLeave={() => setShowReactions(false)}>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => toggleLike(reaction || "like")}
              onMouseEnter={() => setShowReactions(true)}
              className={`p-2 rounded-full hover:bg-muted transition ${isLiked ? currentReaction.color : ""}`}
            >
              <ReactionIcon className={`w-6 h-6 ${isLiked ? "fill-current" : ""}`} />
            </motion.button>
            <AnimatePresence>
              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  className="absolute bottom-full left-0 mb-2 flex gap-1 bg-card border border-border rounded-full px-2 py-1.5 shadow-xl z-20"
                >
                  {REACTIONS.map((r) => (
                    <motion.button
                      key={r.key}
                      whileHover={{ scale: 1.3, y: -4 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleLike(r.key)}
                      className={`${r.color} p-1.5 rounded-full`}
                      title={r.label}
                    >
                      <r.icon className="w-5 h-5 fill-current" />
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => setShowComments(true)} className="p-2 rounded-full hover:bg-muted">
            <MessageCircle className="w-6 h-6" />
          </button>
          <button onClick={sharePost} className="p-2 rounded-full hover:bg-muted">
            <Send className="w-6 h-6" />
          </button>
          <button onClick={toggleSave} className="ml-auto p-2 rounded-full hover:bg-muted">
            <Bookmark className={`w-6 h-6 ${saved ? "fill-current" : ""}`} />
          </button>
        </div>

        {!post.hide_like_count && likes > 0 && (
          <div className="text-sm font-semibold">{likes.toLocaleString()} {likes === 1 ? "like" : "likes"}</div>
        )}

        {post.caption && (
          <div className="text-sm">
            <span className="font-semibold mr-1.5">{post.profile?.display_name}</span>
            <span>{post.caption}</span>
          </div>
        )}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.map((t) => (
              <span key={t} className="text-xs text-primary">#{t}</span>
            ))}
          </div>
        )}
        {(post.comments_count ?? 0) > 0 && (
          <button onClick={() => setShowComments(true)} className="text-xs text-muted-foreground hover:underline">
            View all {post.comments_count} comments
          </button>
        )}
        <div className="text-[11px] text-muted-foreground uppercase tracking-wider">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
        </div>
      </div>

      {/* Comments sheet */}
      <Sheet open={showComments} onOpenChange={setShowComments}>
        <SheetContent side="bottom" className="h-[75vh] flex flex-col">
          <SheetHeader>
            <SheetTitle>Comments</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-3 py-2">
              {comments.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first!</p>}
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={c.profile?.avatar_url || undefined} />
                    <AvatarFallback>{c.profile?.display_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-semibold mr-1.5">{c.profile?.display_name || "User"}</span>
                      <span>{c.content}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  {c.user_id === user?.id && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => {
                      await sb.from("post_comments").delete().eq("id", c.id);
                      loadComments();
                    }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex gap-2 pt-3 border-t">
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
            />
            <Button onClick={submitComment} disabled={!commentText.trim()}>Post</Button>
          </div>
        </SheetContent>
      </Sheet>
    </motion.article>
  );
}

// ============== CREATE POST DIALOG ==============
function CreatePostDialog({ open, onOpenChange, defaultType, onCreated }: { open: boolean; onOpenChange: (b: boolean) => void; defaultType: string; onCreated: () => void; }) {
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [musicTrack, setMusicTrack] = useState("");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [allowComments, setAllowComments] = useState(true);
  const [hideLikes, setHideLikes] = useState(false);
  const [postType, setPostType] = useState(defaultType);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { setPostType(defaultType); }, [defaultType, open]);

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).slice(0, postType === "story" ? 1 : 10);
    setFiles(arr);
    setPreviews(arr.map((f) => URL.createObjectURL(f)));
  };

  const submit = async (asDraft = false) => {
    if (!user) return toast.error("Please sign in");
    if (!caption.trim() && files.length === 0) return toast.error("Add a caption or media");
    setUploading(true);
    try {
      const tagArr = tags.split(/[,\s]+/).map((t) => t.replace(/^#/, "").trim()).filter(Boolean);
      const expires_at = postType === "story" ? new Date(Date.now() + 24 * 3600 * 1000).toISOString() : null;
      const { data: post, error } = await sb.from("posts").insert({
        user_id: user.id,
        caption: caption.trim() || null,
        location: location.trim() || null,
        music_track: musicTrack.trim() || null,
        post_type: postType,
        visibility,
        allow_comments: allowComments,
        hide_like_count: hideLikes,
        is_draft: asDraft,
        tags: tagArr,
        expires_at,
      }).select().single();
      if (error) throw error;

      // upload media
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${post.id}/${i}-${Date.now()}.${ext}`;
        const { error: upErr } = await sb.storage.from("project-files").upload(path, file);
        if (upErr) throw upErr;
        const { data: pub } = sb.storage.from("project-files").getPublicUrl(path);
        await sb.from("post_media").insert({
          post_id: post.id,
          media_url: pub.publicUrl,
          media_type: file.type.startsWith("video") ? "video" : file.type.startsWith("audio") ? "audio" : "image",
          display_order: i,
        });
      }
      // hashtags
      for (const t of tagArr) await sb.from("post_hashtags").insert({ post_id: post.id, tag: t.toLowerCase() });
      toast.success(asDraft ? "Saved as draft" : "Posted!");
      setCaption(""); setLocation(""); setMusicTrack(""); setTags(""); setFiles([]); setPreviews([]);
      onOpenChange(false);
      onCreated();
    } catch (e: any) {
      toast.error(e.message || "Failed to post");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create {postType}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 pb-4">
            <Tabs value={postType} onValueChange={setPostType}>
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="post"><ImageIcon className="w-4 h-4 mr-1" />Post</TabsTrigger>
                <TabsTrigger value="reel"><Film className="w-4 h-4 mr-1" />Reel</TabsTrigger>
                <TabsTrigger value="story"><Sparkles className="w-4 h-4 mr-1" />Story</TabsTrigger>
                <TabsTrigger value="carousel"><Video className="w-4 h-4 mr-1" />Carousel</TabsTrigger>
              </TabsList>
            </Tabs>

            <label className="block border-2 border-dashed border-border hover:border-primary rounded-xl p-6 cursor-pointer transition">
              <input type="file" multiple={postType !== "story"} accept="image/*,video/*" onChange={(e) => handleFiles(e.target.files)} className="hidden" />
              {previews.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm">Click to upload images or videos</p>
                  <p className="text-xs mt-1">Up to {postType === "story" ? 1 : 10} files</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {previews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                      {files[i]?.type.startsWith("video") ? (
                        <video src={src} className="w-full h-full object-cover" />
                      ) : (
                        <img src={src} className="w-full h-full object-cover" alt="" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </label>

            <Textarea
              placeholder="Write a caption... use @mentions and #hashtags"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Add location" value={location} onChange={(e) => setLocation(e.target.value)} className="pl-9" />
              </div>
              <div className="relative">
                <Music className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Add music (track title)" value={musicTrack} onChange={(e) => setMusicTrack(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="relative">
              <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="art, music, design (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} className="pl-9" />
            </div>

            <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Advanced</Label>
              <div className="flex gap-2">
                {[
                  { v: "public", icon: Globe, label: "Public" },
                  { v: "followers", icon: UsersIcon, label: "Followers" },
                  { v: "private", icon: Lock, label: "Only me" },
                ].map((opt) => (
                  <button key={opt.v} onClick={() => setVisibility(opt.v)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs ${visibility === opt.v ? "border-primary bg-primary/10" : "border-border"}`}>
                    <opt.icon className="w-3.5 h-3.5" /> {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Allow comments</Label>
                <Switch checked={allowComments} onCheckedChange={setAllowComments} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Hide like count</Label>
                <Switch checked={hideLikes} onCheckedChange={setHideLikes} />
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => submit(true)} disabled={uploading}>Save draft</Button>
          <Button onClick={() => submit(false)} disabled={uploading} variant="hero">
            {uploading ? "Posting..." : "Share"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============== MAIN PAGE ==============
export default function PostsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("feed");
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Post[]>([]);
  const [saved, setSaved] = useState<Post[]>([]);
  const [trending, setTrending] = useState<Post[]>([]);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState("post");
  const [storyId, setStoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [params] = useSearchParams();

  const enrich = useCallback(async (raws: any[]): Promise<Post[]> => {
    if (raws.length === 0) return [];
    const uids = [...new Set(raws.map((r) => r.user_id))];
    const ids = raws.map((r) => r.id);
    const [{ data: profiles }, { data: media }, { data: likes }, { data: cmts }, { data: myLikes }, { data: mySaves }] = await Promise.all([
      sb.from("profiles").select("user_id, display_name, avatar_url").in("user_id", uids),
      sb.from("post_media").select("*").in("post_id", ids).order("display_order"),
      sb.from("post_likes").select("post_id").in("post_id", ids),
      sb.from("post_comments").select("post_id").in("post_id", ids),
      user ? sb.from("post_likes").select("post_id, reaction").in("post_id", ids).eq("user_id", user.id) : Promise.resolve({ data: [] }),
      user ? sb.from("post_saves").select("post_id").in("post_id", ids).eq("user_id", user.id) : Promise.resolve({ data: [] }),
    ]);
    const pm = new Map((profiles || []).map((p: any) => [p.user_id, p]));
    const mm = new Map<string, Media[]>();
    (media || []).forEach((m: any) => { const a = mm.get(m.post_id) || []; a.push(m); mm.set(m.post_id, a); });
    const lc = new Map<string, number>();
    (likes || []).forEach((l: any) => lc.set(l.post_id, (lc.get(l.post_id) || 0) + 1));
    const cc = new Map<string, number>();
    (cmts || []).forEach((c: any) => cc.set(c.post_id, (cc.get(c.post_id) || 0) + 1));
    const myL = new Map((myLikes || []).map((l: any) => [l.post_id, l.reaction]));
    const myS = new Set((mySaves || []).map((s: any) => s.post_id));
    return raws.map((r) => ({
      ...r,
      profile: pm.get(r.user_id),
      media: mm.get(r.id) || [],
      likes_count: lc.get(r.id) || 0,
      comments_count: cc.get(r.id) || 0,
      liked_by_me: myL.has(r.id),
      my_reaction: myL.get(r.id) || null,
      saved_by_me: myS.has(r.id),
    }));
  }, [user]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: feedRaw }, { data: reelsRaw }, { data: trendRaw }] = await Promise.all([
        sb.from("posts").select("*").in("post_type", ["post", "carousel"]).eq("is_draft", false).eq("visibility", "public").order("created_at", { ascending: false }).limit(50),
        sb.from("posts").select("*").eq("post_type", "reel").eq("is_draft", false).eq("visibility", "public").order("created_at", { ascending: false }).limit(30),
        sb.from("posts").select("*").eq("is_draft", false).eq("visibility", "public").order("view_count", { ascending: false }).limit(20),
      ]);
      setPosts(await enrich(feedRaw || []));
      setReels(await enrich(reelsRaw || []));
      setTrending(await enrich(trendRaw || []));

      if (user) {
        const { data: savesData } = await sb.from("post_saves").select("post_id").eq("user_id", user.id);
        const savedIds = (savesData || []).map((s: any) => s.post_id);
        if (savedIds.length) {
          const { data: savedRaw } = await sb.from("posts").select("*").in("id", savedIds);
          setSaved(await enrich(savedRaw || []));
        }
      }
    } finally {
      setLoading(false);
    }
  }, [enrich, user]);

  useEffect(() => { load(); }, [load]);

  // realtime
  useEffect(() => {
    const ch = supabase
      .channel("posts-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  // deep link ?p=...
  useEffect(() => {
    const p = params.get("p");
    if (p && posts.length) {
      const el = document.getElementById(`post-${p}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [params, posts]);

  const filteredPosts = useMemo(() => {
    if (!search) return posts;
    const q = search.toLowerCase();
    return posts.filter((p) =>
      (p.caption || "").toLowerCase().includes(q) ||
      (p.location || "").toLowerCase().includes(q) ||
      (p.tags || []).some((t) => t.toLowerCase().includes(q)) ||
      (p.profile?.display_name || "").toLowerCase().includes(q)
    );
  }, [search, posts]);

  const openCreate = (type: string) => { setCreateType(type); setCreateOpen(true); };

  return (
    <div className="relative min-h-screen px-4 md:px-8 py-6 max-w-[1200px] mx-auto">
      <FloatingWords />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6 flex-wrap gap-3"
      >
        <div>
          <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight">
            <motion.span
              className="bg-gradient-to-r from-primary via-pink-500 to-amber-500 bg-clip-text text-transparent"
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 8, repeat: Infinity }}
              style={{ backgroundSize: "200% 200%" }}
            >
              Posts
            </motion.span>
            <span className="text-primary">.</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Share, react, discover. Your creative pulse.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts, tags, people" className="pl-9 w-56" />
          </div>
          <Button onClick={() => openCreate("post")} variant="hero" className="gap-1.5">
            <Plus className="w-4 h-4" /> Create
          </Button>
        </div>
      </motion.div>

      {/* Stories */}
      <StoriesBar onOpenCreate={() => openCreate("story")} onOpenStory={setStoryId} />

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="bg-card/50 backdrop-blur border">
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="reels"><Film className="w-3.5 h-3.5 mr-1" />Reels</TabsTrigger>
          <TabsTrigger value="trending"><Flame className="w-3.5 h-3.5 mr-1" />Trending</TabsTrigger>
          <TabsTrigger value="saved"><Bookmark className="w-3.5 h-3.5 mr-1" />Saved</TabsTrigger>
        </TabsList>

        <TabsContent value="feed">
          {loading ? (
            <div className="grid place-items-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No posts yet. Be the first to share!</p>
              <Button variant="hero" onClick={() => openCreate("post")}>Create your first post</Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-5 max-w-2xl mx-auto md:max-w-none">
              {filteredPosts.map((p) => <div key={p.id} id={`post-${p.id}`}><PostCard post={p} onUpdate={load} /></div>)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reels">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {reels.map((r) => {
              const m = r.media?.[0];
              return (
                <motion.div
                  key={r.id}
                  whileHover={{ scale: 1.03, y: -4 }}
                  className="relative aspect-[9/16] bg-black rounded-xl overflow-hidden cursor-pointer group"
                  onClick={() => setStoryId(r.id)}
                >
                  {m?.media_type === "video" ? (
                    <video src={m.media_url} className="w-full h-full object-cover" muted loop onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()} onMouseLeave={(e) => (e.currentTarget as HTMLVideoElement).pause()} />
                  ) : m ? (
                    <img src={m.media_url} className="w-full h-full object-cover" alt="" />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 text-white">
                    <div className="text-xs font-semibold truncate">{r.profile?.display_name}</div>
                    <div className="text-[11px] line-clamp-2 opacity-90">{r.caption}</div>
                  </div>
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur text-white text-[11px] rounded-full px-2 py-0.5">
                    <Heart className="w-3 h-3" />{r.likes_count || 0}
                  </div>
                </motion.div>
              );
            })}
            {reels.length === 0 && (
              <div className="col-span-full text-center py-16">
                <Film className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground mb-3">No reels yet</p>
                <Button onClick={() => openCreate("reel")}>Create reel</Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="trending">
          <div className="grid grid-cols-3 md:grid-cols-4 gap-1.5">
            {trending.map((p) => {
              const m = p.media?.[0];
              return (
                <motion.div
                  key={p.id}
                  whileHover={{ scale: 1.04 }}
                  className="relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer group"
                >
                  {m && (m.media_type === "video"
                    ? <video src={m.media_url} className="w-full h-full object-cover" muted />
                    : <img src={m.media_url} className="w-full h-full object-cover" alt="" />)}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-3 text-white text-sm font-semibold">
                      <span className="flex items-center gap-1"><Heart className="w-4 h-4 fill-white" />{p.likes_count}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4 fill-white" />{p.comments_count}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="saved">
          <div className="grid md:grid-cols-2 gap-5">
            {saved.map((p) => <PostCard key={p.id} post={p} onUpdate={load} />)}
            {saved.length === 0 && <p className="col-span-full text-center text-muted-foreground py-12">No saved posts yet</p>}
          </div>
        </TabsContent>
      </Tabs>

      {/* Floating create button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => openCreate("post")}
        className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-gradient-to-tr from-primary via-pink-500 to-amber-500 text-white shadow-2xl flex items-center justify-center md:hidden"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      <CreatePostDialog open={createOpen} onOpenChange={setCreateOpen} defaultType={createType} onCreated={load} />
      <StoryViewer storyId={storyId} onClose={() => setStoryId(null)} />
>>>>>>> 58da23d0bd108b20438c2b1208ed1fb9bb2944e7
    </div>
  );
}
