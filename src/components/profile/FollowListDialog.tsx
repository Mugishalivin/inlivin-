import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User } from "lucide-react";
import { UserBadge } from "@/components/UserBadge";

const sb = supabase as any;

export function FollowListDialog({
  userId, mode, onClose,
}: { userId: string; mode: "followers" | "following" | null; onClose: () => void }) {
  const { data: people = [], isLoading } = useQuery({
    queryKey: ["follow-list", userId, mode],
    enabled: !!mode,
    queryFn: async () => {
      const col = mode === "followers" ? "following_id" : "follower_id";
      const other = mode === "followers" ? "follower_id" : "following_id";
      const { data: rows } = await sb.from("connections").select(other).eq(col, userId);
      const ids = (rows ?? []).map((r: any) => r[other]);
      if (!ids.length) return [];
      const { data } = await sb.from("profiles").select("user_id, display_name, username, avatar_url").in("user_id", ids);
      return data ?? [];
    },
  });

  return (
    <Dialog open={!!mode} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="capitalize">{mode}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto -mx-2">
          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading…</p>
          ) : people.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Nobody yet.</p>
          ) : (
            people.map((p: any) => (
              <Link key={p.user_id} to={`/profile/${p.user_id}`} onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-secondary">
                <div className="h-10 w-10 rounded-full bg-secondary overflow-hidden flex items-center justify-center">
                  {p.avatar_url ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" /> : <User size={18} className="text-muted-foreground" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-sm font-medium truncate">
                    {p.display_name || "Artist"} <UserBadge userId={p.user_id} size={14} />
                  </div>
                  {p.username && <p className="text-xs text-muted-foreground">@{p.username}</p>}
                </div>
              </Link>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
