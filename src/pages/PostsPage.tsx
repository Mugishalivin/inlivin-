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
    </div>
  );
}

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
    </div>
  );
}