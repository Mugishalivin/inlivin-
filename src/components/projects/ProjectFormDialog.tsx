import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Lock } from "lucide-react";
import type { FolderCategory } from "./CategoryFolders";

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: boolean;
  categories: FolderCategory[];
  title: string; setTitle: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  tags: string; setTags: (v: string) => void;
  isPublic: boolean; setIsPublic: (v: boolean) => void;
  isProtected: boolean; setIsProtected: (v: boolean) => void;
  password: string; setPassword: (v: string) => void;
  coverFile: File | null; setCoverFile: (f: File | null) => void;
  onSave: () => void;
  saving: boolean;
}

export function ProjectFormDialog(props: ProjectFormDialogProps) {
  const { open, onOpenChange, editing, categories, title, setTitle, description, setDescription,
    category, setCategory, tags, setTags, isPublic, setIsPublic, isProtected, setIsProtected,
    password, setPassword, coverFile, setCoverFile, onSave, saving } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{editing ? "Edit Project" : "New Project"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div><Label className="text-xs font-medium">Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1.5" placeholder="Project name" /></div>
          <div><Label className="text-xs font-medium">Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1.5" placeholder="What's this about?" rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs font-medium">Category</Label><Select value={category} onValueChange={setCategory}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs font-medium">Visibility</Label><Select value={isPublic ? "public" : "private"} onValueChange={v => setIsPublic(v === "public")}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="public">Public</SelectItem><SelectItem value="private">Private</SelectItem></SelectContent></Select></div>
          </div>
          <div><Label className="text-xs font-medium">Tags</Label><Input value={tags} onChange={e => setTags(e.target.value)} className="mt-1.5" placeholder="beats, lo-fi, chill (comma separated)" /></div>
          <div className="border rounded-lg p-3 bg-secondary/20">
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" id="protect" checked={isProtected} onChange={e => setIsProtected(e.target.checked)} className="w-4 h-4" />
              <Label htmlFor="protect" className="text-xs font-medium cursor-pointer"><Lock className="w-3 h-3 inline mr-1" />Password Protect This Project</Label>
            </div>
            {isProtected && (
              <Input value={password} onChange={e => setPassword(e.target.value)} className="mt-1.5" placeholder="Set password" type="password" />
            )}
          </div>
          <div>
            <Label className="text-xs font-medium">Cover Image</Label>
            <div className="mt-1.5">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Upload size={14} />{coverFile ? coverFile.name : "Choose file..."}
                <input type="file" accept="image/*" className="hidden" onChange={e => setCoverFile(e.target.files?.[0] || null)} />
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="hero" onClick={onSave} disabled={!title.trim() || saving} className="w-full sm:w-auto">
            {saving ? "Saving..." : editing ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
