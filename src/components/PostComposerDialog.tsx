import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ImagePlus, Loader2, Send, Tag, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase as supabaseRaw } from "@/integrations/supabase/client";
const supabase: any = supabaseRaw;
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function PostComposerDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; onCreated?: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [caption, setCaption] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setCaption("");
    setTagInput("");
    setTags([]);
    setFiles([]);
  };

  const addTag = () => {
    const value = tagInput.trim().replace(/^#/, "");
    if (!value) return;
    if (!tags.includes(value)) setTags((prev) => [...prev, value]);
    setTagInput("");
  };

  const submit = async () => {
    if (!user) return;
    const content = caption.trim();
    if (!content && files.length === 0) {
      toast.error("Add some text or an image to post");
      return;
    }
    setIsSubmitting(true);
    try {
      const postTags = [...tags.map((tag) => tag.replace(/^#/, "")).map((tag) => `#${tag}`)];
      const { data: post, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          caption: content,
          tags: postTags.length ? postTags : null,
          visibility: "public",
          is_draft: false,
          post_type: files.length ? "visual" : "text",
        })
        .select()
        .single();
      if (error) throw error;

      if (files.length) {
        let order = 0;
        for (const file of files) {
          const ext = file.name.split(".").pop() || "bin";
          const path = `posts/${user.id}/${Date.now()}-${order}.${ext}`;
          const { error: uploadErr } = await supabase.storage.from("project-files").upload(path, file, { upsert: true });
          if (uploadErr) throw uploadErr;
          const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(path);
          const isImage = file.type.startsWith("image/");
          await supabase.from("post_media").insert({
            post_id: post.id,
            media_url: urlData.publicUrl,
            media_type: isImage ? "image" : "video",
            display_order: order,
            alt_text: file.name,
          });
          order += 1;
        }
      }

      toast.success("Post published");
      reset();
      onOpenChange(false);
      onCreated?.();
      navigate("/feed", { replace: true });
    } catch (error: any) {
      toast.error(error?.message || "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a post</DialogTitle>
          <DialogDescription>Share your work with the inlivin community.</DialogDescription>
        </DialogHeader>

        <Textarea
          autoFocus
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          placeholder="What are you sharing today?"
          className="min-h-[120px] resize-y"
        />

        {/* Tags */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add hashtags (e.g. music)"
                className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm"
              />
            </div>
            <Button variant="outline" size="sm" onClick={addTag} type="button">
              Add
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                  #{tag}
                  <button type="button" onClick={() => setTags((prev) => prev.filter((item) => item !== tag))} className="text-muted-foreground hover:text-foreground" aria-label={`Remove #${tag}`}>
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Media */}
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          />
          {files.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {files.map((file, index) => (
                <div key={index} className="relative aspect-square overflow-hidden rounded-lg bg-secondary">
                  {file.type.startsWith("image/") ? (
                    <img src={URL.createObjectURL(file)} alt={file.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">🎬</div>
                  )}
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                    aria-label="Remove file"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" className="w-full" type="button" onClick={() => fileInputRef.current?.click()}>
            <ImagePlus size={15} className="mr-2" />
            {files.length ? "Add more media" : "Add images / video"}
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
            Cancel
          </Button>
          <Button onClick={submit} disabled={isSubmitting} className="min-w-[120px]">
            {isSubmitting ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Send size={15} className="mr-2" />}
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PostComposerDialog;
