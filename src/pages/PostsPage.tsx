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
    </div>
  );
}

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
    </div>
  );
}
