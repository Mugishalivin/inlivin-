import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, Pencil, Plus, Trash2, Megaphone, BadgeDollarSign, Image as ImageIcon } from "lucide-react";

type ContentKind = "announcement" | "promotion" | "ad";

type ContentRecord = {
  id: string;
  title: string;
  content: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
  media_url?: string | null;
  media_type?: string | null;
  discount_percentage?: number | null;
  valid_until?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  target_audience?: string | null;
};

const initialForm = {
  type: "announcement" as ContentKind,
  title: "",
  content: "",
  media_url: "",
  media_type: "",
  discount_percentage: "",
  valid_until: "",
  image_url: "",
  link_url: "",
  target_audience: "",
  is_active: true,
};

export function AdminContentManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const adminDb = supabase as any;
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState<{ type: ContentKind; item: ContentRecord } | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaFilePreview, setMediaFilePreview] = useState<string | null>(null);
  const mediaPreview = useMemo(() => {
    const url = mediaFilePreview || (form.type === "ad" ? form.image_url.trim() : form.media_url.trim());
    if (!url) return null;
    const mediaType = mediaFile?.type?.toLowerCase() || (form.type === "ad" ? "image" : form.media_type.trim().toLowerCase());
    return {
      url,
      isVideo: mediaType.startsWith("video"),
      isImage: mediaType.startsWith("image") || (!mediaType && /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(url)),
    };
  }, [form.image_url, form.media_type, form.media_url, form.type, mediaFile, mediaFilePreview]);

  const { data: announcements = [] } = useQuery({
    queryKey: ["admin", "content-announcements"],
    queryFn: async () => (await supabase.from("announcements").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: promotions = [] } = useQuery({
    queryKey: ["admin", "content-promotions"],
    queryFn: async () => (await supabase.from("promotions").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: ads = [] } = useQuery({
    queryKey: ["admin", "content-ads"],
    queryFn: async () => (await supabase.from("ads").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const grouped = useMemo(() => ({
    announcement: announcements as ContentRecord[],
    promotion: promotions as ContentRecord[],
    ad: ads as ContentRecord[],
  }), [announcements, promotions, ads]);

  const currentItems = grouped[form.type];

  const setField = (key: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  const resetForm = (type: ContentKind = "announcement") => setForm({ ...initialForm, type });

  const handleMediaPick = (file: File | null) => {
    setMediaFile(file);
    setMediaFilePreview(file ? URL.createObjectURL(file) : null);
    if (file) {
      const mediaType = file.type.startsWith("video") ? "video" : "image";
      setForm((current) => ({
        ...current,
        media_type: mediaType,
      }));
    }
  };

  const uploadPickedMedia = async () => {
    if (!mediaFile || !user?.id) return null;
    const safeName = mediaFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `admin-content/${user.id}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("project-files").upload(path, mediaFile, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("project-files").getPublicUrl(path);
    return {
      url: data.publicUrl,
      type: mediaFile.type.startsWith("video") ? "video" : "image",
    };
  };

  const createItem = async () => {
    if (!user?.id) return;
    if (!form.title.trim() || !form.content.trim()) return toast.error("Title and content are required");
    const table = form.type === "announcement" ? "announcements" : form.type === "promotion" ? "promotions" : "ads";
    const uploaded = await uploadPickedMedia();
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      content: form.content.trim(),
      created_by: user.id,
      is_active: form.is_active,
      media_url: uploaded?.url || form.media_url.trim() || null,
      media_type: uploaded?.type || form.media_type.trim() || null,
    };
    if (form.type === "promotion") {
      payload.discount_percentage = form.discount_percentage ? Number(form.discount_percentage) : null;
      payload.valid_until = form.valid_until || null;
    }
    if (form.type === "ad") {
      payload.image_url = uploaded?.type === "image" ? uploaded.url : form.image_url.trim() || null;
      payload.link_url = form.link_url.trim() || null;
      payload.target_audience = form.target_audience.trim() || null;
    }
    const { error } = await adminDb.from(table).insert([payload]);
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["admin", "content-announcements"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "content-promotions"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "content-ads"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "promotions"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "ads"] });
    toast.success(`${form.type} created`);
    resetForm(form.type);
    setMediaFile(null);
    setMediaFilePreview(null);
  };

  const updateItem = async () => {
    if (!editing) return;
    const { type, item } = editing;
    const table = type === "announcement" ? "announcements" : type === "promotion" ? "promotions" : "ads";
    const payload: Record<string, unknown> = {
      title: item.title,
      content: item.content,
      is_active: item.is_active,
      media_url: item.media_url ?? null,
      media_type: item.media_type ?? null,
    };
    if (type === "promotion") {
      payload.discount_percentage = item.discount_percentage ?? null;
      payload.valid_until = item.valid_until ?? null;
    }
    if (type === "ad") {
      payload.image_url = item.image_url ?? null;
      payload.link_url = item.link_url ?? null;
      payload.target_audience = item.target_audience ?? null;
    }
    const { error } = await adminDb.from(table).update(payload).eq("id", item.id);
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["admin", "content-announcements"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "content-promotions"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "content-ads"] });
    toast.success("Content updated");
    setEditing(null);
  };

  const toggleActive = async (type: ContentKind, item: ContentRecord) => {
    const table = type === "announcement" ? "announcements" : type === "promotion" ? "promotions" : "ads";
    const { error } = await adminDb.from(table).update({ is_active: !item.is_active }).eq("id", item.id);
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["admin", "content-announcements"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "content-promotions"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "content-ads"] });
    toast.success(item.is_active ? "Unpublished" : "Published");
  };

  const deleteItem = async (type: ContentKind, id: string) => {
    if (!window.confirm("Delete this item?")) return;
    const table = type === "announcement" ? "announcements" : type === "promotion" ? "promotions" : "ads";
    const { error } = await adminDb.from(table).delete().eq("id", id);
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["admin", "content-announcements"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "content-promotions"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "content-ads"] });
    toast.success("Content deleted");
  };

  const openEditor = (type: ContentKind, item: ContentRecord) => {
    setEditing({ type, item: { ...item } });
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card/95 shadow-sm backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Megaphone className="h-5 w-5 text-primary" />
              Content publisher
            </CardTitle>
            <CardDescription className="text-muted-foreground">Create, publish, unpublish, edit, and delete announcements, promotions, and ads.</CardDescription>
          </div>
          <Badge className="border-border bg-secondary text-foreground">Live DB CRUD</Badge>
        </CardHeader>
      </Card>

      <Card className="border-border bg-card/95 shadow-sm backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-foreground">Create new content</CardTitle>
          <CardDescription className="text-muted-foreground">Anything published here appears across the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(value) => setForm({ ...initialForm, type: value as ContentKind })}>
                <SelectTrigger className="border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="ad">Ad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setField("title", e.target.value)} className="border-border bg-background" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea value={form.content} onChange={(e) => setField("content", e.target.value)} className="min-h-28 border-border bg-background" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Media URL</Label>
              <Input value={form.media_url} onChange={(e) => setField("media_url", e.target.value)} className="border-border bg-background" />
            </div>
            <div className="space-y-2">
              <Label>Media type</Label>
              <Select value={form.media_type || "image"} onValueChange={(value) => setField("media_type", value)}>
                <SelectTrigger className="border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.is_active ? "active" : "inactive"} onValueChange={(value) => setField("is_active", value === "active")}>
                <SelectTrigger className="border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Upload image or video</Label>
            <Input type="file" accept="image/*,video/*" className="border-border bg-background" onChange={(event) => handleMediaPick(event.target.files?.[0] || null)} />
          </div>

          {form.type === "promotion" && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Discount percentage</Label>
                <Input type="number" min="0" max="100" value={form.discount_percentage} onChange={(e) => setField("discount_percentage", e.target.value)} className="border-border bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Valid until</Label>
                <Input type="datetime-local" value={form.valid_until} onChange={(e) => setField("valid_until", e.target.value)} className="border-border bg-background" />
              </div>
            </div>
          )}

          {form.type === "ad" && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input value={form.image_url} onChange={(e) => setField("image_url", e.target.value)} className="border-border bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Link URL</Label>
                <Input value={form.link_url} onChange={(e) => setField("link_url", e.target.value)} className="border-border bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Target audience</Label>
                <Input value={form.target_audience} onChange={(e) => setField("target_audience", e.target.value)} className="border-border bg-background" />
              </div>
            </div>
          )}

          {mediaPreview?.url && (
            <div className="rounded-3xl border border-border bg-background p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Preview</div>
                  <div className="text-sm text-foreground">See how the media will appear before publishing</div>
                </div>
                <Badge className="border-border bg-secondary text-foreground">
                  {mediaPreview.isVideo ? "Video" : mediaPreview.isImage ? "Image" : "Link"}
                </Badge>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border">
                {mediaPreview.isVideo ? (
                  <video src={mediaPreview.url} controls className="h-56 w-full object-cover" />
                ) : (
                  <img src={mediaPreview.url} alt="Preview" className="h-56 w-full object-cover" />
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={createItem}>
              <Plus className="h-4 w-4" />
              Create
            </Button>
            <Button variant="outline" className="border-border bg-background hover:bg-secondary" onClick={() => resetForm(form.type)}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="announcement" value={form.type} onValueChange={(value) => setForm((current) => ({ ...current, type: value as ContentKind }))}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="announcement">Announcements</TabsTrigger>
          <TabsTrigger value="promotion">Promotions</TabsTrigger>
          <TabsTrigger value="ad">Ads</TabsTrigger>
        </TabsList>
        {(["announcement", "promotion", "ad"] as ContentKind[]).map((kind) => (
          <TabsContent key={kind} value={kind}>
            <Card className="border-border bg-card/95 shadow-sm backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-foreground capitalize">{kind} board</CardTitle>
                <CardDescription className="text-muted-foreground">Manage every {kind} item in the database.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 xl:grid-cols-2">
                {grouped[kind].map((item) => (
                  <div key={item.id} className="rounded-3xl border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="font-semibold text-foreground">{item.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-3">{item.content}</div>
                      </div>
                      <Badge className="border-border bg-secondary text-foreground">{item.is_active ? "Published" : "Hidden"}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="border-border bg-background hover:bg-secondary" onClick={() => openEditor(kind, item)}>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="border-border bg-background hover:bg-secondary" onClick={() => toggleActive(kind, item)}>
                        <CheckCircle2 className="h-4 w-4" />
                        {item.is_active ? "Unpublish" : "Publish"}
                      </Button>
                      <Button variant="outline" size="sm" className="border-border bg-background hover:bg-secondary" onClick={() => deleteItem(kind, item.id)}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                {!currentItems.length && (
                  <div className="rounded-3xl border border-dashed border-border bg-background p-8 text-muted-foreground">
                    No {kind} items yet. Create one above.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit {editing?.type}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editing.item.title} onChange={(e) => setEditing((current) => current ? { ...current, item: { ...current.item, title: e.target.value } } : current)} className="border-border bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea value={editing.item.content} onChange={(e) => setEditing((current) => current ? { ...current, item: { ...current.item, content: e.target.value } } : current)} className="min-h-28 border-border bg-background" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Media URL</Label>
                  <Input value={editing.item.media_url || ""} onChange={(e) => setEditing((current) => current ? { ...current, item: { ...current.item, media_url: e.target.value } } : current)} className="border-border bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Media type</Label>
                  <Select value={editing.item.media_type || "image"} onValueChange={(value) => setEditing((current) => current ? { ...current, item: { ...current.item, media_type: value } } : current)}>
                    <SelectTrigger className="border-border bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="image/jpeg">Image/JPEG</SelectItem>
                      <SelectItem value="image/png">Image/PNG</SelectItem>
                      <SelectItem value="video/mp4">Video/MP4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {editing.type === "ad" && (
                  <>
                    <div className="space-y-2">
                      <Label>Image URL</Label>
                      <Input value={editing.item.image_url || ""} onChange={(e) => setEditing((current) => current ? { ...current, item: { ...current.item, image_url: e.target.value } } : current)} className="border-border bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label>Link URL</Label>
                      <Input value={editing.item.link_url || ""} onChange={(e) => setEditing((current) => current ? { ...current, item: { ...current.item, link_url: e.target.value } } : current)} className="border-border bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label>Target audience</Label>
                      <Input value={editing.item.target_audience || ""} onChange={(e) => setEditing((current) => current ? { ...current, item: { ...current.item, target_audience: e.target.value } } : current)} className="border-border bg-background" />
                    </div>
                  </>
                )}
                {editing.type === "promotion" && (
                  <>
                    <div className="space-y-2">
                      <Label>Discount percentage</Label>
                      <Input type="number" min="0" max="100" value={editing.item.discount_percentage ?? ""} onChange={(e) => setEditing((current) => current ? { ...current, item: { ...current.item, discount_percentage: e.target.value ? Number(e.target.value) : null } } : current)} className="border-border bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label>Valid until</Label>
                      <Input type="datetime-local" value={editing.item.valid_until || ""} onChange={(e) => setEditing((current) => current ? { ...current, item: { ...current.item, valid_until: e.target.value } } : current)} className="border-border bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={editing.item.is_active ? "active" : "inactive"} onValueChange={(value) => setEditing((current) => current ? { ...current, item: { ...current.item, is_active: value === "active" } } : current)}>
                        <SelectTrigger className="border-border bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
              {editing.item.media_url && (
                <div className="overflow-hidden rounded-2xl border border-border">
                  {String(editing.item.media_type || "").startsWith("video") ? (
                    <video src={editing.item.media_url} controls className="h-64 w-full object-cover" />
                  ) : (
                    <img src={editing.item.media_url} alt={editing.item.title} className="h-64 w-full object-cover" />
                  )}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" className="border-border bg-background hover:bg-secondary" onClick={() => setEditing((current) => current ? { ...current, item: { ...current.item, is_active: !current.item.is_active } } : current)}>
                  Toggle publish
                </Button>
                <Button onClick={updateItem}>Save changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
