import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, Share2, Bookmark, BookmarkCheck, Trash2,
  Image as ImageIcon, TrendingUp, MoreHorizontal
} from "lucide-react";
import { UserAvatar, UserName } from "@/components/UserLink";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface FeedCardProps {
  project: any;
  creator?: any;
  isLiked: boolean;
  isBookmarked: boolean;
  likeCount: number;
  commentCount: number;
  isTopPick: boolean;
  timeAgo: string;
  onLike: (projectId: string) => void;
  onBookmark: (projectId: string) => void;
  onComment: (projectId: string) => void;
  onShare: (project: any) => void;
  onDelete?: (projectId: string) => void;
  index: number;
}

export function FeedCard({
  project,
  creator,
  isLiked,
  isBookmarked,
  likeCount,
  commentCount,
  isTopPick,
  timeAgo,
  onLike,
  onBookmark,
  onComment,
  onShare,
  onDelete,
  index,
}: FeedCardProps) {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group overflow-hidden rounded-3xl bg-slate-900 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
    >
      {/* PINTEREST-STYLE IMAGE - Takes up full height */}
      <div className="relative aspect-auto min-h-80">
        {project.cover_url ? (
          <img
            src={project.cover_url}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-accent/30 to-slate-900 flex items-center justify-center">
            <ImageIcon size={80} className="text-slate-600/50" />
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/5 to-black/70" />

        {/* Author Info - Top Left (always visible) */}
        <div className="absolute top-3 left-3 z-40 flex items-center gap-2 bg-black/40 rounded-full px-2 py-1.5 backdrop-blur">
          <UserAvatar userId={project.user_id} avatarUrl={creator?.avatar_url} size={6} />
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate">
              <UserName userId={project.user_id} name={creator?.display_name} />
            </p>
          </div>
        </div>

        {/* Top Pick Badge */}
        {isTopPick && (
          <div className="absolute top-3 right-3 z-40">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/90 backdrop-blur px-2.5 py-1 text-xs font-semibold text-primary-foreground">
              <TrendingUp size={12} /> Hot
            </span>
          </div>
        )}

        {/* Menu Button - Top Right */}
        <div className="absolute top-3 right-3 z-50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-white/20 backdrop-blur hover:bg-white/30 text-white rounded-full"
              >
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onShare(project)}>
                <Share2 size={14} className="mr-2" /> Share
              </DropdownMenuItem>
              {project.user_id === user?.id && onDelete && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(project.id)}
                >
                  <Trash2 size={14} className="mr-2" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Bottom Info - Always Visible */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent p-4 z-40">
          <h3 className="font-display font-bold text-lg text-white line-clamp-2 mb-1">
            {project.title}
          </h3>
          {project.description && (
            <p className="text-xs text-white/70 line-clamp-1 mb-2">
              {project.description}
            </p>
          )}
          {project.tags && (project.tags as string[]).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(project.tags as string[]).slice(0, 2).map(tag => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/60 text-white font-medium">
                  #{tag}
                </span>
              ))}
              {(project.tags as string[]).length > 2 && (
                <span className="text-[9px] text-white/60">+{(project.tags as string[]).length - 2}</span>
              )}
            </div>
          )}
        </div>

        {/* Hover Action Overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-45"
            >
              {/* Action Buttons */}
              <div className="flex gap-3 flex-wrap justify-center">
                {/* Like Button */}
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLike(project.id);
                    }}
                    size="lg"
                    className={`font-bold text-base px-6 transition-all rounded-full ${
                      isLiked
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground"
                    }`}
                  >
                    <Heart size={18} className="mr-2" fill={isLiked ? "currentColor" : "none"} />
                    {likeCount > 0 && likeCount}
                  </Button>
                </motion.div>

                {/* Comment Button */}
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onComment(project.id);
                    }}
                    variant="outline"
                    size="lg"
                    className="bg-white/20 border-white/30 hover:bg-white/30 text-white font-bold text-base px-6 rounded-full"
                  >
                    <MessageCircle size={18} className="mr-2" />
                    {commentCount > 0 && commentCount}
                  </Button>
                </motion.div>
              </div>

              {/* Time ago info */}
              <p className="text-xs text-white/70">{timeAgo}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bookmark Button - Floating (always visible) */}
        <div className="absolute bottom-4 right-4 z-50">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onBookmark(project.id);
              }}
              size="icon"
              className={`h-10 w-10 rounded-full transition-all ${
                isBookmarked
                  ? "bg-primary text-white"
                  : "bg-white/20 backdrop-blur hover:bg-white/30 text-white"
              }`}
            >
              {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
