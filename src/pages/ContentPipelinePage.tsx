import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Circle,
  Clock3,
  CloudUpload,
  Download,
  Eye,
  FileAudio2,
  FileImage,
  FileText,
  FileVideo,
  FolderOpen,
  Heart,
  Layers3,
  Lightbulb,
  ListTodo,
  Loader2,
  MonitorPlay,
  MoreHorizontal,
  Palette,
  Rocket,
  Sparkles,
  Star,
  Target,
  Trash2,
  Upload,
  Wand2,
  Wrench,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type StudioAsset = Database["public"]["Tables"]["studio_assets"]["Row"];
type StudioTask = Database["public"]["Tables"]["studio_tasks"]["Row"];
type StudioScheduleItem = Database["public"]["Tables"]["studio_schedule_items"]["Row"];

type PreviewKind = "image" | "video" | "audio" | "iframe" | "text" | "download";

const badgeTone: Record<string, string> = {
  low: "bg-emerald-500/10 text-emerald-600",
  medium: "bg-amber-500/10 text-amber-600",
  high: "bg-rose-500/10 text-rose-600",
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/10 text-primary",
  done: "bg-emerald-500/10 text-emerald-600",
  planned: "bg-primary/10 text-primary",
  active: "bg-emerald-500/10 text-emerald-600",
  archived: "bg-muted text-muted-foreground",
};

const studioSections = [
  { label: "Vault", icon: FolderOpen, hint: "Store files, preview them on click, and keep everything in one home base." },
  { label: "Tasks", icon: ListTodo, hint: "Track what needs to happen next with priorities and due dates." },
  { label: "Schedule", icon: Calendar, hint: "Plan launches, sessions, and deadlines on a living timeline." },
  { label: "Focus", icon: Target, hint: "See the strongest next move based on the data already in your studio." },
];

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleString("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShortDate(value?: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}

function normalizeTags(raw: string) {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function getPreviewKind(asset: StudioAsset): PreviewKind {
  const mime = (asset.mime_type || "").toLowerCase();
  const name = (asset.file_name || asset.title || "").toLowerCase();
  if (mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(name)) return "image";
  if (mime.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(name)) return "video";
  if (mime.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac)$/i.test(name)) return "audio";
  if (mime.includes("pdf") || /\.pdf$/i.test(name)) return "iframe";
  if (mime.startsWith("text/") || /\.(txt|md|json|csv|log|xml|yaml|yml)$/i.test(name)) return "text";
  return "download";
}

function fileGlyph(asset: StudioAsset) {
  const kind = getPreviewKind(asset);
  if (kind === "image") return FileImage;
  if (kind === "video") return FileVideo;
  if (kind === "audio") return FileAudio2;
  if (kind === "iframe" || kind === "text") return FileText;
  return CloudUpload;
}

function previewLabel(asset: StudioAsset) {
  const kind = getPreviewKind(asset);
  if (kind === "image") return "Image preview";
  if (kind === "video") return "Video preview";
  if (kind === "audio") return "Audio preview";
  if (kind === "iframe") return "Document preview";
  if (kind === "text") return "Text preview";
  return "File preview";
}

function isMissingStudioTableError(error: unknown) {
  return error instanceof Error && error.message.includes("Could not find the table");
}

function studioSetupMessage(feature: string) {
  return `The Studio ${feature} table is not available yet. Apply the latest Supabase migrations to enable this feature.`;
}

async function uploadStudioFile(userId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `studio-assets/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("project-files").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("project-files").getPublicUrl(path);
  return {
    file_path: path,
    file_url: data.publicUrl,
    mime_type: file.type || null,
    file_size: file.size,
    file_name: file.name,
  };
}

function HeroGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        animate={{ y: [0, 18, 0], x: [0, -10, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -left-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl"
        animate={{ y: [0, -16, 0], x: [0, 14, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-16 right-1/3 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl"
        animate={{ y: [0, -8, 0], opacity: [0.25, 0.8, 0.25] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

export default function ContentPipelinePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [previewAsset, setPreviewAsset] = useState<StudioAsset | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [assetTitle, setAssetTitle] = useState("");
  const [assetDescription, setAssetDescription] = useState("");
  const [assetCategory, setAssetCategory] = useState("creation");
  const [assetTags, setAssetTags] = useState("");
  const [assetFavorite, setAssetFavorite] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskCategory, setTaskCategory] = useState("general");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskReminder, setTaskReminder] = useState("");
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [scheduleType, setScheduleType] = useState("session");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleColor, setScheduleColor] = useState("primary");
  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: ["studio-assets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("studio_assets")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(48);
      if (error) {
        if (isMissingStudioTableError(error)) return [];
        throw error;
      }
      return (data ?? []) as StudioAsset[];
    },
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["studio-tasks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("studio_tasks")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) {
        if (isMissingStudioTableError(error)) return [];
        throw error;
      }
      return (data ?? []) as StudioTask[];
    },
  });

  const { data: schedule = [], isLoading: scheduleLoading } = useQuery({
    queryKey: ["studio-schedule", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("studio_schedule_items")
        .select("*")
        .eq("user_id", user!.id)
        .order("scheduled_at", { ascending: true });
      if (error) {
        if (isMissingStudioTableError(error)) return [];
        throw error;
      }
      return (data ?? []) as StudioScheduleItem[];
    },
  });

  const { data: studioSchemaReady = true } = useQuery({
    queryKey: ["studio-schema-ready"],
    enabled: !!user,
    queryFn: async () => {
      const { error } = await supabase.from("studio_assets").select("id").limit(1);
      return !error || !isMissingStudioTableError(error);
    },
  });

  const uploadAssetMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a file first");
      if (!assetTitle.trim()) throw new Error("Give the asset a title");
      if (!studioSchemaReady) throw new Error(studioSetupMessage("vault"));
      const meta = await uploadStudioFile(user!.id, file);
      const { error } = await supabase.from("studio_assets").insert({
        user_id: user!.id,
        title: assetTitle.trim(),
        description: assetDescription.trim() || null,
        category: assetCategory,
        tags: normalizeTags(assetTags),
        is_favorite: assetFavorite,
        file_name: meta.file_name,
        file_path: meta.file_path,
        file_url: meta.file_url,
        mime_type: meta.mime_type,
        file_size: meta.file_size,
      });
      if (error) {
        if (isMissingStudioTableError(error)) throw new Error(studioSetupMessage("vault"));
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["studio-assets", user?.id] });
      setFile(null);
      setAssetTitle("");
      setAssetDescription("");
      setAssetCategory("creation");
      setAssetTags("");
      setAssetFavorite(false);
      toast.success("Asset stored in your studio vault.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      if (!taskTitle.trim()) throw new Error("Give the task a title");
      if (!studioSchemaReady) throw new Error(studioSetupMessage("tasks"));
      const { error } = await supabase.from("studio_tasks").insert({
        user_id: user!.id,
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        priority: taskPriority,
        category: taskCategory,
        due_date: taskDueDate || null,
        reminder_at: taskReminder || null,
        status: "todo",
      });
      if (error) {
        if (isMissingStudioTableError(error)) throw new Error(studioSetupMessage("tasks"));
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["studio-tasks", user?.id] });
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("medium");
      setTaskCategory("general");
      setTaskDueDate("");
      setTaskReminder("");
      toast.success("Task added to your studio board.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createScheduleMutation = useMutation({
    mutationFn: async () => {
      if (!scheduleTitle.trim()) throw new Error("Give the schedule item a title");
      if (!scheduleDate) throw new Error("Pick a date and time");
      if (!studioSchemaReady) throw new Error(studioSetupMessage("schedule"));
      const { error } = await supabase.from("studio_schedule_items").insert({
        user_id: user!.id,
        title: scheduleTitle.trim(),
        notes: scheduleNotes.trim() || null,
        item_type: scheduleType,
        scheduled_at: scheduleDate,
        color: scheduleColor,
      });
      if (error) {
        if (isMissingStudioTableError(error)) throw new Error(studioSetupMessage("schedule"));
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["studio-schedule", user?.id] });
      setScheduleTitle("");
      setScheduleNotes("");
      setScheduleType("session");
      setScheduleDate("");
      setScheduleColor("primary");
      toast.success("Scheduled item saved.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleAssetFavorite = useMutation({
    mutationFn: async (asset: StudioAsset) => {
      if (!studioSchemaReady) throw new Error(studioSetupMessage("vault"));
      const { error } = await supabase
        .from("studio_assets")
        .update({ is_favorite: !asset.is_favorite })
        .eq("id", asset.id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["studio-assets", user?.id] });
    },
  });

  const toggleTaskStatus = useMutation({
    mutationFn: async (task: StudioTask) => {
      if (!studioSchemaReady) throw new Error(studioSetupMessage("tasks"));
      const completed = task.status !== "done";
      const { error } = await supabase
        .from("studio_tasks")
        .update({
          status: completed ? "done" : "todo",
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq("id", task.id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["studio-tasks", user?.id] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      if (!studioSchemaReady) throw new Error(studioSetupMessage("tasks"));
      const { error } = await supabase.from("studio_tasks").delete().eq("id", taskId).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["studio-tasks", user?.id] });
      toast.success("Task removed.");
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      if (!studioSchemaReady) throw new Error(studioSetupMessage("schedule"));
      const { error } = await supabase.from("studio_schedule_items").delete().eq("id", scheduleId).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["studio-schedule", user?.id] });
      toast.success("Schedule item removed.");
    },
  });

  const vaultStats = useMemo(() => {
    const total = assets.length;
    const favorites = assets.filter((asset) => asset.is_favorite).length;
    const images = assets.filter((asset) => getPreviewKind(asset) === "image").length;
    const videos = assets.filter((asset) => getPreviewKind(asset) === "video").length;
    const docs = assets.filter((asset) => ["iframe", "text"].includes(getPreviewKind(asset))).length;
    const taskDone = tasks.filter((task) => task.status === "done").length;
    return {
      total,
      favorites,
      images,
      videos,
      docs,
      taskDone,
      taskTotal: tasks.length,
      scheduleTotal: schedule.length,
    };
  }, [assets, tasks, schedule]);

  const studioInsights = useMemo(() => {
    const dueSoon = tasks.filter((task) => task.due_date && new Date(task.due_date).getTime() < Date.now() + 1000 * 60 * 60 * 24 * 3 && task.status !== "done").length;
    const overdue = tasks.filter((task) => task.due_date && new Date(task.due_date).getTime() < Date.now() && task.status !== "done").length;
    const nextSchedule = schedule[0];
    const topCategory =
      assets.reduce<Record<string, number>>((acc, asset) => {
        acc[asset.category || "creation"] = (acc[asset.category || "creation"] || 0) + 1;
        return acc;
      }, {});
    const bestCategory = Object.entries(topCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || "creation";

    return [
      assets.length === 0
        ? "Start by dropping a file into the vault. The studio becomes more useful once it knows what you are working on."
        : `Your vault has ${assets.length} asset${assets.length > 1 ? "s" : ""} and the most active lane is ${bestCategory}.`,
      overdue > 0
        ? `${overdue} task${overdue > 1 ? "s" : ""} are overdue. Clear those first so the board stays light.`
        : dueSoon > 0
          ? `${dueSoon} task${dueSoon > 1 ? "s" : ""} are due soon. Keep the momentum going.`
          : "Your task board is clear enough to start a new creative sprint.",
      nextSchedule
        ? `Next session: ${nextSchedule.title} on ${formatDate(nextSchedule.scheduled_at)}.`
        : "Add a launch, review, or creation session to make the timeline feel alive.",
      vaultStats.favorites > 0
        ? `${vaultStats.favorites} asset${vaultStats.favorites > 1 ? "s are" : " is"} starred for quick access.`
        : "Star your best reference files so they stay within reach.",
    ];
  }, [assets, tasks, schedule, vaultStats.favorites]);

  const taskProgress = tasks.length > 0 ? Math.round((vaultStats.taskDone / tasks.length) * 100) : 0;
  const nextSchedule = schedule[0];

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md border-border/50">
          <CardHeader>
            <CardTitle>Studio access required</CardTitle>
            <CardDescription>Sign in to open your workspace, vault, tasks, and schedule.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/login")}>Go to login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="relative overflow-hidden p-6 md:p-8 max-w-7xl">
      <HeroGlow />

      {!studioSchemaReady ? (
        <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-foreground">Studio database tables are not installed yet</p>
              <p className="text-sm text-muted-foreground">
                The workspace will stay responsive, but vault, task, and schedule writes will be disabled until the latest Supabase migrations are applied.
              </p>
            </div>
            <Badge className="w-fit bg-amber-500/10 text-amber-600">Setup required</Badge>
          </CardContent>
        </Card>
      ) : null}

      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge className="mb-3 border-primary/20 bg-primary/10 text-primary">
            <Layers3 className="mr-1 h-3.5 w-3.5" />
            Creator Studio
          </Badge>
          <h1 className="font-display text-3xl font-black tracking-tight md:text-5xl">
            <span className="bg-gradient-to-r from-primary via-orange-400 to-accent bg-clip-text text-transparent">
              Your home base for creating, storing, and planning
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            Keep files, ideas, tasks, and schedules in one place so your workspace feels like a real studio you can live in every day.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Vault", value: vaultStats.total, icon: FolderOpen },
            { label: "Tasks", value: vaultStats.taskTotal, icon: ListTodo },
            { label: "Schedule", value: vaultStats.scheduleTotal, icon: Calendar },
            { label: "Favorites", value: vaultStats.favorites, icon: Star },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl border border-border/50 bg-card/85 px-4 py-3 text-center shadow-sm backdrop-blur"
            >
              <item.icon className="mx-auto h-4 w-4 text-primary" />
              <p className="mt-2 text-2xl font-black text-foreground">{item.value}</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="vault" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-fit">
          <TabsTrigger value="vault">Vault</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="focus">Focus</TabsTrigger>
        </TabsList>

        <TabsContent value="vault" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Card className="border-border/50 bg-gradient-to-br from-primary/5 via-background to-accent/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <Upload size={18} className="text-primary" />
                  Store anything in your vault
                </CardTitle>
                <CardDescription>Images, videos, audio, PDFs, docs, and text files all live here with previews.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="studio-file">File</Label>
                  <Input id="studio-file" type="file" onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)} />
                  {file ? <p className="mt-1 text-xs text-muted-foreground">Selected: {file.name}</p> : null}
                </div>
                <div>
                  <Label htmlFor="asset-title">Title</Label>
                  <Input id="asset-title" value={assetTitle} onChange={(e) => setAssetTitle(e.target.value)} placeholder="Mix notes, cover art, demo audio..." />
                </div>
                <div>
                  <Label htmlFor="asset-description">Description</Label>
                  <Textarea id="asset-description" value={assetDescription} onChange={(e) => setAssetDescription(e.target.value)} placeholder="What is this file for?" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Category</Label>
                    <Select value={assetCategory} onValueChange={setAssetCategory}>
                      <SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="creation">Creation</SelectItem>
                        <SelectItem value="reference">Reference</SelectItem>
                        <SelectItem value="release">Release</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="archive">Archive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="asset-tags">Tags</Label>
                    <Input id="asset-tags" value={assetTags} onChange={(e) => setAssetTags(e.target.value)} placeholder="studio, cover, reel, notes" />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/30 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Star this asset</p>
                    <p className="text-xs text-muted-foreground">Make it show up in favorites first.</p>
                  </div>
                  <Switch checked={assetFavorite} onCheckedChange={setAssetFavorite} />
                </div>
                <Button className="w-full gap-2" onClick={() => uploadAssetMutation.mutate()} disabled={uploadAssetMutation.isPending || !studioSchemaReady}>
                  {uploadAssetMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
                  Save to vault
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                {[
                  { label: "Images", value: vaultStats.images, icon: FileImage },
                  { label: "Videos", value: vaultStats.videos, icon: FileVideo },
                  { label: "Docs", value: vaultStats.docs, icon: FileText },
                ].map((item) => (
                  <Card key={item.label} className="border-border/50">
                    <CardContent className="p-4">
                      <item.icon className="h-4 w-4 text-primary" />
                      <p className="mt-2 text-2xl font-black text-foreground">{item.value}</p>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 font-display text-lg">
                    <Sparkles size={18} className="text-accent" />
                    Smart studio notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  {studioInsights.map((item, index) => (
                    <motion.div key={index} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="rounded-xl border border-border/50 bg-secondary/20 p-3">
                      {item}
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {assetsLoading ? (
              <Card className="border-border/50 md:col-span-2 xl:col-span-3">
                <CardContent className="flex items-center justify-center p-10 text-sm text-muted-foreground">Loading vault...</CardContent>
              </Card>
            ) : assets.length === 0 ? (
              <Card className="border-dashed border-border/60 md:col-span-2 xl:col-span-3">
                <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center text-sm text-muted-foreground">
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity }} className="rounded-full bg-primary/10 p-4 text-primary">
                    <FolderOpen className="h-6 w-6" />
                  </motion.div>
                  <p className="font-semibold text-foreground">Your vault is empty</p>
                  <p>Upload a file to start building a private creative home base.</p>
                </CardContent>
              </Card>
            ) : (
              assets.map((asset, index) => {
                const Glyph = fileGlyph(asset);
                const kind = getPreviewKind(asset);
                return (
                  <motion.button
                    key={asset.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => setPreviewAsset(asset)}
                    className="group text-left"
                  >
                    <Card className="h-full overflow-hidden border-border/50 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:border-primary/25">
                      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-secondary to-muted">
                        {kind === "image" ? (
                          <img src={asset.file_url} alt={asset.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : kind === "video" ? (
                          <video src={asset.file_url} className="h-full w-full object-cover" muted playsInline />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
                            <div className="rounded-2xl bg-background/80 p-4 shadow-sm">
                              <Glyph className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{previewLabel(asset)}</p>
                              <p className="mt-1 text-xs text-muted-foreground">Click to open and inspect.</p>
                            </div>
                          </div>
                        )}
                        <div className="absolute left-3 top-3 flex gap-2">
                          <Badge className="bg-background/90 text-foreground shadow-sm">{asset.category || "creation"}</Badge>
                          {asset.is_favorite ? <Badge className="bg-amber-500/90 text-white shadow-sm"><Star className="mr-1 h-3 w-3" />Starred</Badge> : null}
                        </div>
                        <div className="absolute right-3 top-3">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 rounded-full bg-background/80 backdrop-blur"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAssetFavorite.mutate(asset);
                            }}
                          >
                            <Heart className={`h-4 w-4 ${asset.is_favorite ? "fill-current text-rose-500" : "text-muted-foreground"}`} />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="space-y-2 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground line-clamp-1">{asset.title}</p>
                            <p className="text-xs text-muted-foreground">{asset.file_name}</p>
                          </div>
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </div>
                        {asset.description ? <p className="line-clamp-2 text-sm text-muted-foreground">{asset.description}</p> : null}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(asset.tags || []).slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">#{tag}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.button>
                );
              })
            )}
          </div>
        </TabsContent>
        <TabsContent value="tasks" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Card className="border-border/50 bg-gradient-to-br from-background via-background to-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <ListTodo size={18} className="text-primary" />
                  Build your task board
                </CardTitle>
                <CardDescription>Break bigger creative work into clear next steps.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="task-title">Title</Label>
                  <Input id="task-title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Edit cover art for launch post" />
                </div>
                <div>
                  <Label htmlFor="task-description">Description</Label>
                  <Textarea id="task-description" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} placeholder="Add notes, references, and the reason it matters." />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Priority</Label>
                    <Select value={taskPriority} onValueChange={setTaskPriority}>
                      <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={taskCategory} onValueChange={setTaskCategory}>
                      <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="release">Release</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="promotion">Promotion</SelectItem>
                        <SelectItem value="studio">Studio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="task-due">Due date</Label>
                    <Input id="task-due" type="datetime-local" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="task-reminder">Reminder</Label>
                    <Input id="task-reminder" type="datetime-local" value={taskReminder} onChange={(e) => setTaskReminder(e.target.value)} />
                  </div>
                </div>
                <Button className="w-full gap-2" onClick={() => createTaskMutation.mutate()} disabled={createTaskMutation.isPending || !studioSchemaReady}>
                  {createTaskMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  Add task
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <Target size={18} className="text-accent" />
                  Board health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Completion</span>
                    <span className="font-semibold text-foreground">{taskProgress}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" initial={{ width: 0 }} animate={{ width: `${taskProgress}%` }} transition={{ duration: 0.8 }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Open</p>
                    <p className="mt-1 text-2xl font-black text-foreground">{tasks.filter((task) => task.status !== "done").length}</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Done</p>
                    <p className="mt-1 text-2xl font-black text-foreground">{vaultStats.taskDone}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-4">
                  <p className="font-semibold text-foreground">What to do first</p>
                  <p className="mt-1 text-muted-foreground">Focus on due tasks and then star the assets you use repeatedly.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {tasksLoading ? (
              <Card className="border-border/50 lg:col-span-2">
                <CardContent className="flex items-center justify-center p-10 text-sm text-muted-foreground">Loading tasks...</CardContent>
              </Card>
            ) : tasks.length === 0 ? (
              <Card className="border-dashed border-border/60 lg:col-span-2">
                <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center text-sm text-muted-foreground">
                  <ListTodo className="h-6 w-6 text-primary" />
                  <p className="font-semibold text-foreground">No tasks on the board yet</p>
                  <p>Add your first task and turn this studio into a real workflow.</p>
                </CardContent>
              </Card>
            ) : (
              tasks.map((task) => {
                const isDone = task.status === "done";
                const isOverdue = task.due_date ? new Date(task.due_date).getTime() < Date.now() && !isDone : false;
                return (
                  <Card key={task.id} className="border-border/50 transition-all hover:-translate-y-1 hover:shadow-lg">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleTaskStatus.mutate(task)}
                            className="mt-0.5 rounded-full transition-colors hover:bg-secondary"
                          >
                            {isDone ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                          </button>
                          <div>
                            <p className={`font-semibold ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>{task.title}</p>
                            {task.description ? <p className="mt-1 text-sm text-muted-foreground">{task.description}</p> : null}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteTaskMutation.mutate(task.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={badgeTone[task.priority] || "bg-secondary text-secondary-foreground"}>{task.priority}</Badge>
                        <Badge variant="secondary">{task.category || "general"}</Badge>
                        <Badge className={badgeTone[task.status] || "bg-secondary text-secondary-foreground"}>{task.status}</Badge>
                        {isOverdue ? <Badge className="bg-rose-500/10 text-rose-600">Overdue</Badge> : null}
                      </div>
                      <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                        <div className="rounded-lg border border-border/50 p-2">Due: {formatDate(task.due_date)}</div>
                        <div className="rounded-lg border border-border/50 p-2">Reminder: {formatDate(task.reminder_at)}</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
        <TabsContent value="schedule" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Card className="border-border/50 bg-gradient-to-br from-background via-background to-accent/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <Calendar size={18} className="text-accent" />
                  Schedule something real
                </CardTitle>
                <CardDescription>Block time for sessions, launches, reviews, and creative cleanup.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="schedule-title">Title</Label>
                  <Input id="schedule-title" value={scheduleTitle} onChange={(e) => setScheduleTitle(e.target.value)} placeholder="Album listening session" />
                </div>
                <div>
                  <Label htmlFor="schedule-notes">Notes</Label>
                  <Textarea id="schedule-notes" value={scheduleNotes} onChange={(e) => setScheduleNotes(e.target.value)} placeholder="Who is it for? What should happen?" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Type</Label>
                    <Select value={scheduleType} onValueChange={setScheduleType}>
                      <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="session">Session</SelectItem>
                        <SelectItem value="launch">Launch</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="meetup">Meetup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="schedule-color">Color</Label>
                    <Select value={scheduleColor} onValueChange={setScheduleColor}>
                      <SelectTrigger><SelectValue placeholder="Color" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="accent">Accent</SelectItem>
                        <SelectItem value="emerald">Emerald</SelectItem>
                        <SelectItem value="amber">Amber</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="schedule-date">Scheduled for</Label>
                  <Input id="schedule-date" type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
                </div>
                <Button className="w-full gap-2" onClick={() => createScheduleMutation.mutate()} disabled={createScheduleMutation.isPending || !studioSchemaReady}>
                  {createScheduleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                  Save schedule item
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <Clock3 size={18} className="text-primary" />
                  Time map
                </CardTitle>
                <CardDescription>Keep a visible list of what is coming next.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {nextSchedule ? (
                  <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Next up</p>
                    <p className="mt-1 font-semibold text-foreground">{nextSchedule.title}</p>
                    <p className="mt-1 text-muted-foreground">{formatDate(nextSchedule.scheduled_at)}</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
                    No scheduled items yet.
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/50 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sessions</p>
                    <p className="mt-1 text-2xl font-black text-foreground">{schedule.filter((item) => item.item_type === "session").length}</p>
                  </div>
                  <div className="rounded-xl border border-border/50 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Launches</p>
                    <p className="mt-1 text-2xl font-black text-foreground">{schedule.filter((item) => item.item_type === "launch").length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {scheduleLoading ? (
              <Card className="border-border/50 lg:col-span-2">
                <CardContent className="flex items-center justify-center p-10 text-sm text-muted-foreground">Loading schedule...</CardContent>
              </Card>
            ) : schedule.length === 0 ? (
              <Card className="border-dashed border-border/60 lg:col-span-2">
                <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center text-sm text-muted-foreground">
                  <Calendar className="h-6 w-6 text-accent" />
                  <p className="font-semibold text-foreground">Your timeline is empty</p>
                  <p>Add a session or launch so the studio feels alive.</p>
                </CardContent>
              </Card>
            ) : (
              schedule.map((item) => (
                <Card key={item.id} className="border-border/50 transition-all hover:-translate-y-1 hover:shadow-lg">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className={badgeTone[item.status] || "bg-secondary text-secondary-foreground"}>{item.item_type}</Badge>
                          <Badge variant="secondary">{item.color}</Badge>
                        </div>
                        <p className="mt-2 font-semibold text-foreground">{item.title}</p>
                        {item.notes ? <p className="mt-1 text-sm text-muted-foreground">{item.notes}</p> : null}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteScheduleMutation.mutate(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="rounded-lg border border-border/50 p-3 text-xs text-muted-foreground">
                      Scheduled for {formatDate(item.scheduled_at)}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="focus" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="border-border/50 bg-gradient-to-br from-primary/5 via-background to-accent/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <Wand2 size={18} className="text-primary" />
                  Studio focus feed
                </CardTitle>
                <CardDescription>Dynamic guidance based on the state of your workspace.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {studioSections.map((section) => (
                  <div key={section.label} className="rounded-xl border border-border/50 bg-card/80 p-4">
                    <div className="flex items-center gap-2">
                      <section.icon className="h-4 w-4 text-primary" />
                      <p className="font-semibold text-foreground">{section.label}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{section.hint}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <Lightbulb size={18} className="text-accent" />
                  Action ideas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
                  <p className="font-semibold text-foreground">Organize by vibe</p>
                  <p className="mt-1">Tag files by purpose so you can find the right reference in seconds.</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
                  <p className="font-semibold text-foreground">Set a weekly review</p>
                  <p className="mt-1">Use schedule items for review sessions to keep your studio clean and focused.</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
                  <p className="font-semibold text-foreground">Pin your best work</p>
                  <p className="mt-1">Favorite files are one click away when you need them most.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <MonitorPlay size={18} className="text-primary" />
                Your current rhythm
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              {[
                { label: "Vault health", value: assets.length > 0 ? "Alive" : "Empty" },
                { label: "Task pressure", value: tasks.filter((task) => task.status !== "done").length > 0 ? "Needs action" : "Clear" },
                { label: "Schedule density", value: schedule.length > 0 ? "Active" : "Open" },
                { label: "Focus mode", value: vaultStats.favorites > 0 ? "Ready" : "Building" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border/50 bg-secondary/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                  <p className="mt-2 font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!previewAsset} onOpenChange={(open) => !open && setPreviewAsset(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              {previewAsset?.title || "Asset preview"}
            </DialogTitle>
          </DialogHeader>
          {previewAsset ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/50 bg-secondary/20 p-3">
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge>{previewLabel(previewAsset)}</Badge>
                  {previewAsset.category ? <Badge variant="secondary">{previewAsset.category}</Badge> : null}
                  {previewAsset.is_favorite ? <Badge className="bg-amber-500/90 text-white">Starred</Badge> : null}
                </div>
                <div className="max-h-[60vh] overflow-auto rounded-xl border border-border/50 bg-background">
                  {getPreviewKind(previewAsset) === "image" ? (
                    <img src={previewAsset.file_url} alt={previewAsset.title} className="max-h-[60vh] w-full object-contain" />
                  ) : getPreviewKind(previewAsset) === "video" ? (
                    <video src={previewAsset.file_url} controls className="w-full" />
                  ) : getPreviewKind(previewAsset) === "audio" ? (
                    <div className="p-6">
                      <audio src={previewAsset.file_url} controls className="w-full" />
                    </div>
                  ) : getPreviewKind(previewAsset) === "iframe" ? (
                    <iframe src={previewAsset.file_url} className="h-[60vh] w-full" title={previewAsset.title} />
                  ) : getPreviewKind(previewAsset) === "text" ? (
                    <iframe src={previewAsset.file_url} className="h-[60vh] w-full" title={previewAsset.title} />
                  ) : (
                    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 p-6 text-center">
                      <FileText className="h-10 w-10 text-primary" />
                      <p className="font-semibold text-foreground">This file can be downloaded or opened in a new tab.</p>
                      <Button asChild>
                        <a href={previewAsset.file_url} target="_blank" rel="noreferrer">Open file</a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground">{previewAsset.file_name}</p>
                  <p>{formatDate(previewAsset.created_at)}</p>
                </div>
                <Button variant="secondary" className="gap-2" asChild>
                  <a href={previewAsset.file_url} target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
