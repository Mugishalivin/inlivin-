import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Reply, Trash2, MessageCircle } from "lucide-react";
import { MentionAutocompleteInput } from "@/components/MentionAutocompleteInput";
import { MentionDisplay } from "@/components/MentionDisplay";

interface CommentSectionProps {
  itemId: string;
  allowComments: boolean;
  commentsVisibleToAll: boolean;
  sellerId: string;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  is_seller: boolean;
  is_deleted: boolean;
  user?: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
}

export function CommentSection({
  itemId,
  allowComments,
  commentsVisibleToAll,
  sellerId,
}: CommentSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["item-comments", itemId],
    queryFn: async () => {
      if (!itemId) return [];

      const { data, error } = await (supabase as any)
        .from("digital_product_comments")
        .select(`
          id,
          user_id,
          content,
          parent_comment_id,
          created_at,
          is_seller,
          is_deleted,
          user:profiles(display_name, username, avatar_url)
        `)
        .eq("item_id", itemId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching comments:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!itemId && allowComments,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!user) {
        toast.error("Please log in to comment");
        return;
      }

      const { error } = await (supabase as any)
        .from("digital_product_comments")
        .insert({
          item_id: itemId,
          user_id: user.id,
          content: text,
          is_seller: user.id === sellerId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["item-comments", itemId] });
      toast.success("Comment posted!");
    },
    onError: (error) => {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
    },
  });

  // Add reply mutation
  const addReplyMutation = useMutation({
    mutationFn: async ({ text, parentId }: { text: string; parentId: string }) => {
      if (!user) {
        toast.error("Please log in to reply");
        return;
      }

      const { error } = await (supabase as any)
        .from("digital_product_comments")
        .insert({
          item_id: itemId,
          user_id: user.id,
          content: text,
          parent_comment_id: parentId,
          is_seller: user.id === sellerId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setReplyingTo(null);
      setReplyTexts({});
      queryClient.invalidateQueries({ queryKey: ["item-comments", itemId] });
      toast.success("Reply posted!");
    },
    onError: (error) => {
      console.error("Error posting reply:", error);
      toast.error("Failed to post reply");
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await (supabase as any)
        .from("digital_product_comments")
        .update({ is_deleted: true })
        .eq("id", commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item-comments", itemId] });
      toast.success("Comment deleted");
    },
    onError: (error) => {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    },
  });

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  };

  const handlePostReply = (parentId: string) => {
    const text = replyTexts[parentId];
    if (!text?.trim()) return;
    addReplyMutation.mutate({ text, parentId });
  };

  const rootComments = comments.filter((c: Comment) => !c.parent_comment_id);
  const getReplies = (parentId: string) =>
    comments.filter((c: Comment) => c.parent_comment_id === parentId);

  if (!allowComments) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg text-center text-muted-foreground text-sm">
        Comments are disabled for this item
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <MessageCircle size={18} />
        Comments ({rootComments.length})
      </h3>

      {/* Comment Input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <MentionAutocompleteInput
            value={newComment}
            onChange={setNewComment}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && newComment.trim()) {
                handlePostComment();
              }
            }}
            placeholder="Share your thoughts..."
            disabled={addCommentMutation.isPending}
            rows={2}
          />
          <Button
            onClick={handlePostComment}
            disabled={!newComment.trim() || addCommentMutation.isPending}
            size="sm"
            className="self-end"
          >
            Post
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        <AnimatePresence>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading comments...</div>
          ) : rootComments.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            rootComments.map((comment: Comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <CommentItem
                  comment={comment}
                  replies={getReplies(comment.id)}
                  onReply={() => setReplyingTo(comment.id)}
                  onDelete={() => deleteCommentMutation.mutate(comment.id)}
                  onPostReply={() => handlePostReply(comment.id)}
                  replyText={replyTexts[comment.id] || ""}
                  onReplyTextChange={(text) =>
                    setReplyTexts({ ...replyTexts, [comment.id]: text })
                  }
                  isReplying={replyingTo === comment.id}
                  isDeleting={deleteCommentMutation.isPending}
                  isPosting={addReplyMutation.isPending}
                  canDelete={user?.id === comment.user_id || user?.id === sellerId}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  replies: Comment[];
  onReply: () => void;
  onDelete: () => void;
  onPostReply: () => void;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  isReplying: boolean;
  isDeleting: boolean;
  isPosting: boolean;
  canDelete: boolean;
}

function CommentItem({
  comment,
  replies,
  onReply,
  onDelete,
  onPostReply,
  replyText,
  onReplyTextChange,
  isReplying,
  isDeleting,
  isPosting,
  canDelete,
}: CommentItemProps) {
  return (
    <Card className="p-3 bg-muted/20 rounded-lg space-y-2">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={comment.user?.avatar_url || ""} />
          <AvatarFallback>
            {comment.user?.display_name?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{comment.user?.display_name}</p>
            {comment.is_seller && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                Seller
              </span>
            )}
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </p>
          </div>
          <p className="text-sm text-foreground break-words mt-1">
            <MentionDisplay text={comment.content} />
          </p>
        </div>

        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
          >
            <Trash2 size={14} />
          </Button>
        )}
      </div>

      {/* Reply Button */}
      <div className="flex gap-2 pl-11">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReply}
          className="h-7 text-xs gap-1"
        >
          <Reply size={12} />
          Reply
        </Button>
      </div>

      {/* Reply Input */}
      <AnimatePresence>
        {isReplying && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="pl-11 space-y-2"
          >
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <MentionAutocompleteInput
                  value={replyText}
                  onChange={onReplyTextChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && replyText.trim()) {
                      onPostReply();
                    }
                  }}
                  placeholder="Write a reply..."
                  disabled={isPosting}
                  rows={1}
                  className="text-sm"
                />
              </div>
              <Button
                onClick={onPostReply}
                disabled={!replyText.trim() || isPosting}
                size="sm"
              >
                Reply
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Replies */}
      <AnimatePresence>
        {replies.length > 0 && (
          <motion.div className="pl-11 space-y-2 mt-2 border-l-2 border-border/50 pl-3">
            {replies.map((reply: Comment) => (
              <motion.div
                key={reply.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="p-2 bg-muted/30 rounded text-sm"
              >
                <div className="flex items-start gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={reply.user?.avatar_url || ""} />
                    <AvatarFallback>
                      {reply.user?.display_name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-medium text-xs">{reply.user?.display_name}</p>
                      {reply.is_seller && (
                        <span className="text-xs bg-primary/20 text-primary px-1.5 py-0 rounded">
                          Seller
                        </span>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(reply.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <p className="text-xs text-foreground break-words mt-0.5">
                      <MentionDisplay text={reply.content} />
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
