import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  CloudUpload,
  Download,
  ExternalLink,
  FileAudio2,
  FileImage,
  FileText,
  FileVideo,
  Folder,
  HardDrive,
  Link2,
  Loader2,
  Lock,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type StudioAsset = Database["public"]["Tables"]["studio_assets"]["Row"];

const MAX_UPLOAD_BYTES = 300 * 1024 * 1024; // 300 MB — bigger files must come in as a Drive link
const FOLDERS = ["audio", "visual", "video", "document", "other"] as const;
type FolderKey = (typeof FOLDERS)[number];

const folderMeta: Record<FolderKey, { label: string; icon: typeof FileAudio2 }> = {
  audio: { label: "Audio", icon: FileAudio2 },
  visual: { label: "Visuals", icon: FileImage },
  video: { label: "Video", icon: FileVideo },
  document: { label: "Documents", icon: FileText },
  other: { label: "Other", icon: Folder },
};

const formatSize = (bytes?: number | null) => {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
};

const guessFolder = (mime?: string | null): FolderKey => {
  if (!mime) return "other";
  if (mime.startsWith("audio")) return "audio";
  if (mime.startsWith("video")) return "video";
  if (mime.startsWith("image")) return "visual";
  if (mime.includes("pdf") || mime.includes("text") || mime.includes("document")) return "document";
  return "other";
};

const isExternal = (asset: StudioAsset) => (asset.tags ?? []).includes("external-link");

export default function StudioSafeZonePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [activeFolder, setActiveFolder] = useState<FolderKey | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [folder, setFolder] = useState<FolderKey>("other");
  const [driveLink, setDriveLink] = useState("");

  const tooLarge = !!file && file.size > MAX_UPLOAD_BYTES;

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["safe-zone-assets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("studio_assets")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as StudioAsset[];
    },
  });

  const stored = useMemo(
    () => assets.filter((a) => !isExternal(a)).reduce((sum, a) => sum + (a.file_size ?? 0), 0),
    [assets],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return assets.filter((asset) => {
      const inFolder = activeFolder === "all" || (asset.category ?? "other") === activeFolder;
      const matches =
        !term ||
        asset.title.toLowerCase().includes(term) ||
        (asset.file_name ?? "").toLowerCase().includes(term) ||
        (asset.description ?? "").toLowerCase().includes(term);
      return inFolder && matches;
    });
  }, [assets, activeFolder, search]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    assets.forEach((asset) => {
      const key = asset.category ?? "other";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return map;
  }, [assets]);

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setNotes("");
    setDriveLink("");
    setFolder("other");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be signed in");
      const useLink = tooLarge || (!file && !!driveLink.trim());

      if (useLink) {
        const link = driveLink.trim();
        if (!link) throw new Error("Add the Google Drive link for this file");
        const { error } = await supabase.from("studio_assets").insert({
          user_id: user.id,
          title: title.trim() || file?.name || "Linked file",
          description: notes.trim() || null,
          file_name: file?.name || link.split("/").pop() || "drive-link",
          file_path: link,
          file_url: link,
          file_size: file?.size ?? null,
          mime_type: file?.type || "link/external",
          category: folder,
          tags: ["external-link"],
        });
        if (error) throw error;
        return;
      }

      if (!file) throw new Error("Choose a file to keep safe");
      const path = `${user.id}/safe-zone/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error: uploadError } = await supabase.storage.from("project-files").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) throw uploadError;
      const { data: publicUrl } = supabase.storage.from("project-files").getPublicUrl(path);
      const { error } = await supabase.from("studio_assets").insert({
        user_id: user.id,
        title: title.trim() || file.name,
        description: notes.trim() || null,
        file_name: file.name,
        file_path: path,
        file_url: publicUrl.publicUrl,
        file_size: file.size,
        mime_type: file.type || null,
        category: folder,
        tags: [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved to your Safe Zone");
      queryClient.invalidateQueries({ queryKey: ["safe-zone-assets"] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => toast.error(error?.message ?? "Could not save this file"),
  });

  const favoriteMutation = useMutation({
    mutationFn: async (asset: StudioAsset) => {
      const { error } = await supabase
        .from("studio_assets")
        .update({ is_favorite: !asset.is_favorite })
        .eq("id", asset.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["safe-zone-assets"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (asset: StudioAsset) => {
      if (!isExternal(asset)) {
        await supabase.storage.from("project-files").remove([asset.file_path]);
      }
      const { error } = await supabase.from("studio_assets").delete().eq("id", asset.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed");
      queryClient.invalidateQueries({ queryKey: ["safe-zone-assets"] });
    },
    onError: (error: any) => toast.error(error?.message ?? "Could not remove this file"),
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <motion.header
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-5 sm:p-7"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
              <Lock size={12} /> Private
            </span>
            <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Studio Safe Zone<span className="text-primary">.</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your own vault for masters, stems, artwork and contracts. Files over 300&nbsp;MB are kept as a Google Drive link.
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="lg" className="w-full gap-2 sm:w-auto">
                <CloudUpload size={16} /> Keep a file
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Keep a file safe</DialogTitle>
                <DialogDescription>
                  Up to 300&nbsp;MB is stored here. Anything bigger stays on Google Drive and we keep the link.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="safe-file">File</Label>
                  <Input
                    id="safe-file"
                    ref={fileInputRef}
                    type="file"
                    onChange={(event) => {
                      const picked = event.target.files?.[0] ?? null;
                      setFile(picked);
                      if (picked) {
                        setTitle((current) => current || picked.name.replace(/\.[^.]+$/, ""));
                        setFolder(guessFolder(picked.type));
                      }
                    }}
                  />
                  {file && (
                    <p className="text-xs text-muted-foreground">
                      {file.name} · {formatSize(file.size)}
                    </p>
                  )}
                </div>

                {tooLarge && (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                    This file is {formatSize(file!.size)} — over the 300&nbsp;MB limit. Upload it to Google Drive and paste the
                    share link below; we will store the link instead.
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="drive-link" className="flex items-center gap-1.5">
                    <Link2 size={13} /> Google Drive link {tooLarge ? "(required)" : "(optional)"}
                  </Label>
                  <Input
                    id="drive-link"
                    placeholder="https://drive.google.com/file/d/..."
                    value={driveLink}
                    onChange={(event) => setDriveLink(event.target.value)}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="safe-title">Title</Label>
                    <Input id="safe-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Master mix v3" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Folder</Label>
                    <Select value={folder} onValueChange={(value) => setFolder(value as FolderKey)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FOLDERS.map((key) => (
                          <SelectItem key={key} value={key}>{folderMeta[key].label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="safe-notes">Notes</Label>
                  <Textarea id="safe-notes" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What is this file for?" />
                </div>

                <Button className="w-full gap-2" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                  {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CloudUpload size={16} />}
                  {tooLarge || (!file && driveLink) ? "Save link" : "Save file"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Files kept", value: String(assets.length), icon: Folder },
            { label: "Space used", value: formatSize(stored), icon: HardDrive },
            { label: "Drive links", value: String(assets.filter(isExternal).length), icon: Link2 },
            { label: "Starred", value: String(assets.filter((a) => a.is_favorite).length), icon: Star },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border/50 bg-background/60 p-3">
              <stat.icon size={15} className="text-primary" />
              <p className="mt-2 font-display text-lg font-bold leading-none">{stat.value}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.header>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your vault" className="pl-9" />
        </div>
      </div>

      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveFolder("all")}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
            activeFolder === "all" ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:bg-secondary"
          }`}
        >
          All ({assets.length})
        </button>
        {FOLDERS.map((key) => {
          const Icon = folderMeta[key].icon;
          const active = activeFolder === key;
          return (
            <button
              key={key}
              onClick={() => setActiveFolder(key)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                active ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Icon size={13} /> {folderMeta[key].label} ({counts.get(key) ?? 0})
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card className="mt-6 border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <Lock size={26} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nothing here yet — your vault is empty.</p>
            <Button size="sm" onClick={() => setDialogOpen(true)}>Keep your first file</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((asset, index) => {
            const key = (asset.category ?? "other") as FolderKey;
            const Icon = folderMeta[key]?.icon ?? Folder;
            const external = isExternal(asset);
            return (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
              >
                <Card className="group h-full border-border/60 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                  <CardContent className="flex h-full flex-col gap-3 p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon size={17} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-sm font-bold">{asset.title}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{asset.file_name}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">···</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => favoriteMutation.mutate(asset)}>
                            <Star size={13} className="mr-2" /> {asset.is_favorite ? "Unstar" : "Star"}
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={asset.file_url} target="_blank" rel="noopener noreferrer">
                              {external ? <ExternalLink size={13} className="mr-2" /> : <Download size={13} className="mr-2" />}
                              {external ? "Open in Drive" : "Download"}
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(asset)}>
                            <Trash2 size={13} className="mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {asset.description && (
                      <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{asset.description}</p>
                    )}

                    <div className="mt-auto flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded-full bg-secondary px-2 py-0.5">{folderMeta[key]?.label ?? "Other"}</span>
                      <span>{external ? "Drive link" : formatSize(asset.file_size)}</span>
                      {asset.is_favorite && <Star size={11} className="text-amber-500" fill="currentColor" />}
                      <span className="ml-auto">{new Date(asset.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
