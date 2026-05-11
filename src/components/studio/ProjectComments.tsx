import { useState } from "react";
import { MessageSquare, Reply, Trash2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: Date;
  likes: number;
  isLiked?: boolean;
  replies: Comment[];
}

interface ProjectCommentsProps {
  comments: Comment[];
  onAddComment?: (content: string, parentId?: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  onLikeComment?: (commentId: string) => Promise<void>;
  canComment?: boolean;
}

export function ProjectComments({
  comments,
  onAddComment,
  onDeleteComment,
  onLikeComment,
  canComment = true,
}: ProjectCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      await onAddComment?.(newComment, replyingTo || undefined);
      setNewComment("");
      setReplyingTo(null);
    } finally {
      setLoading(false);
    }
  };

  const renderComment = (comment: Comment, depth = 0) => (
    <div key={comment.id} className={`${depth > 0 ? "ml-8" : ""}`}>
      <div className="flex gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex-shrink-0"></div>
        <div className="flex-1">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-slate-900 dark:text-white">
                {comment.author}
              </p>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {formatDistanceToNow(comment.timestamp, { addSuffix: true })}
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 text-sm mb-2">
              {comment.content}
            </p>
          </div>

          <div className="flex gap-2 mt-2 ml-3">
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs gap-1 ${
                comment.isLiked ? "text-pink-600" : "text-slate-600"
              }`}
              onClick={() => onLikeComment?.(comment.id)}
            >
              <Heart className="w-3 h-3" />
              {comment.likes > 0 && comment.likes}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-600"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            >
              <Reply className="w-3 h-3 mr-1" />
              Reply
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-600 hover:text-red-600"
              onClick={() => onDeleteComment?.(comment.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>

          {replyingTo === comment.id && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a reply..."
                className="mb-2 text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSubmitComment} disabled={loading}>
                  {loading ? "Posting..." : "Reply"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplyingTo(null);
                    setNewComment("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => renderComment(reply, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-violet-600" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Comments
        </h3>
        <span className="ml-2 px-3 py-1 bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-200 rounded-full text-sm font-medium">
          {comments.length}
        </span>
      </div>

      {canComment && (
        <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="mb-3"
            rows={3}
          />
          <Button onClick={handleSubmitComment} disabled={loading || !newComment.trim()}>
            {loading ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => renderComment(comment))
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
            <p className="text-slate-600 dark:text-slate-400">No comments yet. Be the first!</p>
          </div>
        )}
      </div>
    </div>
  );
}
