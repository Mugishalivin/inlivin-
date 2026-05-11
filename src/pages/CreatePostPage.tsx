import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Link as LinkIcon, Plus, X, Trash2, Eye, EyeOff, 
  Share2, Image, Zap, Package, Music, Video, Globe
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon: string;
  order: number;
}

export default function CreatePostPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [newLink, setNewLink] = useState({ title: "", url: "", icon: "Globe" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createPostMutation = useMutation({
    mutationFn: async () => {
      if (!content.trim()) {
        throw new Error("Post content is required");
      }

      const { data, error } = await supabase.from("posts").insert({
        creator_id: user!.id,
        title: title || null,
        content,
        image_url: imageUrl || null,
        is_public: isPublic,
      }).select().single();

      if (error) throw error;

      // If there are links, store them as JSON in a separate table or in the post metadata
      if (links.length > 0) {
        const { error: linkError } = await supabase.from("post_links").insert(
          links.map(link => ({
            post_id: data.id,
            title: link.title,
            url: link.url,
            icon: link.icon,
            order: link.order,
          }))
        );
        if (linkError) console.error("Error saving links:", linkError);
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success("Post created successfully!");
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      navigate(`/profile/${user!.id}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create post");
    },
  });

  const addLink = () => {
    if (!newLink.title.trim() || !newLink.url.trim()) {
      toast.error("Please enter both title and URL");
      return;
    }

    // Validate URL
    try {
      new URL(newLink.url);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setLinks([
      ...links,
      {
        id: Math.random().toString(),
        title: newLink.title,
        url: newLink.url,
        icon: newLink.icon,
        order: links.length,
      },
    ]);
    setNewLink({ title: "", url: "", icon: "Globe" });
  };

  const removeLink = (id: string) => {
    setLinks(links.filter(link => link.id !== id));
  };

  const moveLink = (id: string, direction: "up" | "down") => {
    const index = links.findIndex(l => l.id === id);
    if ((direction === "up" && index === 0) || (direction === "down" && index === links.length - 1)) {
      return;
    }

    const newLinks = [...links];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newLinks[index], newLinks[swapIndex]] = [newLinks[swapIndex], newLinks[index]];
    setLinks(newLinks.map((l, i) => ({ ...l, order: i })));
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "Music": return <Music size={16} />;
      case "Video": return <Video size={16} />;
      case "Image": return <Image size={16} />;
      case "Package": return <Package size={16} />;
      case "Zap": return <Zap size={16} />;
      default: return <Globe size={16} />;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Back
      </motion.button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl">
              Create Post<span className="text-primary">.</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Share your links, updates, and connect with your audience
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Title Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Post Title (Optional)</label>
              <Input
                placeholder="Give your post a catchy title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">Make it memorable and descriptive</p>
            </div>

            {/* Content Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Content</label>
              <Textarea
                placeholder="Share your message, updates, or call-to-action..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-24 resize-none"
              />
              <p className="text-xs text-muted-foreground">{content.length} characters</p>
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Featured Image URL (Optional)</label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="h-10"
              />
              {imageUrl && (
                <div className="mt-2 rounded-lg overflow-hidden border border-border">
                  <img 
                    src={imageUrl} 
                    alt="Preview" 
                    className="w-full h-40 object-cover"
                    onError={() => {
                      toast.error("Failed to load image");
                      setImageUrl("");
                    }}
                  />
                </div>
              )}
            </div>

            {/* Links Section */}
            <div className="space-y-4 p-4 bg-card rounded-lg border border-border/50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <LinkIcon size={16} /> Links & Resources
                </h3>
                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                  {links.length} link{links.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Add Link Form */}
              <div className="space-y-3 p-3 bg-background rounded-lg border border-dashed border-border">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input
                    placeholder="Link title"
                    value={newLink.title}
                    onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                    className="h-9"
                  />
                  <Input
                    placeholder="https://example.com"
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    className="h-9 col-span-1 sm:col-span-1"
                  />
                  <Select value={newLink.icon} onValueChange={(value) => setNewLink({ ...newLink, icon: value })}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Globe">
                        <span className="flex items-center gap-2">
                          <Globe size={14} /> Website
                        </span>
                      </SelectItem>
                      <SelectItem value="Music">
                        <span className="flex items-center gap-2">
                          <Music size={14} /> Music
                        </span>
                      </SelectItem>
                      <SelectItem value="Video">
                        <span className="flex items-center gap-2">
                          <Video size={14} /> Video
                        </span>
                      </SelectItem>
                      <SelectItem value="Image">
                        <span className="flex items-center gap-2">
                          <Image size={14} /> Portfolio
                        </span>
                      </SelectItem>
                      <SelectItem value="Package">
                        <span className="flex items-center gap-2">
                          <Package size={14} /> Product
                        </span>
                      </SelectItem>
                      <SelectItem value="Zap">
                        <span className="flex items-center gap-2">
                          <Zap size={14} /> Featured
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  className="w-full h-9"
                  onClick={addLink}
                  variant="outline"
                >
                  <Plus size={14} className="mr-2" /> Add Link
                </Button>
              </div>

              {/* Links List */}
              <div className="space-y-2">
                {links.map((link, index) => (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="p-3 bg-background rounded-lg border border-border flex items-center gap-3 group hover:border-primary/20 transition-colors"
                  >
                    <div className="text-muted-foreground flex-shrink-0">
                      {getIconComponent(link.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{link.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => moveLink(link.id, "up")}
                        disabled={index === 0}
                        className="p-1 hover:bg-secondary rounded disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveLink(link.id, "down")}
                        disabled={index === links.length - 1}
                        className="p-1 hover:bg-secondary rounded disabled:opacity-50"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeLink(link.id)}
                        className="p-1 hover:bg-red-500/10 text-red-500 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Privacy Toggle */}
            <div className="p-4 bg-card rounded-lg border border-border/50 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground text-sm">Post Visibility</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isPublic ? "Public - Anyone can see this post" : "Private - Only you can see this post"}
                </p>
              </div>
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`p-2 rounded-lg transition-colors ${
                  isPublic
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isPublic ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-border/50">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setIsSubmitting(true);
                  createPostMutation.mutate();
                  setIsSubmitting(false);
                }}
                disabled={isSubmitting || !content.trim()}
              >
                <Share2 size={14} className="mr-2" />
                {isSubmitting ? "Publishing..." : "Publish Post"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
