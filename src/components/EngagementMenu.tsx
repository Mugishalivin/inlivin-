import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Heart, MessageSquare, Share2, Bookmark } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface EngagementMenuProps {
  itemId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EngagementMenu({ itemId, open, onOpenChange }: EngagementMenuProps) {
  const [selectedTab, setSelectedTab] = useState<"views" | "likes" | "interactions" | "shares" | "bookmarks">("views");

  // Fetch who viewed
  const { data: viewers = [] } = useQuery({
    queryKey: ["item-viewers", itemId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("digital_product_views")
        .select(
          `
          viewer:profiles!viewer_id(
            id,
            display_name,
            username,
            avatar_url
          ),
          viewed_at
        `
        )
        .eq("item_id", itemId)
        .order("viewed_at", { ascending: false });
      return data ?? [];
    },
  });

  // Fetch who liked
  const { data: likers = [] } = useQuery({
    queryKey: ["item-likers", itemId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("digital_product_likes")
        .select(
          `
          user:profiles!user_id(
            id,
            display_name,
            username,
            avatar_url
          ),
          liked_at
        `
        )
        .eq("item_id", itemId)
        .order("liked_at", { ascending: false });
      return data ?? [];
    },
  });

  // Fetch interactions
  const { data: interactions = [] } = useQuery({
    queryKey: ["item-interactions", itemId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("digital_product_interactions")
        .select(
          `
          id,
          user:profiles!user_id(
            id,
            display_name,
            username,
            avatar_url
          ),
          comment_type,
          comment_text,
          created_at
        `
        )
        .eq("item_id", itemId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  // Fetch who shared
  const { data: sharers = [] } = useQuery({
    queryKey: ["item-sharers", itemId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("digital_product_shares")
        .select(
          `
          user:profiles!user_id(
            id,
            display_name,
            username,
            avatar_url
          ),
          shared_at
        `
        )
        .eq("item_id", itemId)
        .order("shared_at", { ascending: false });
      return data ?? [];
    },
  });

  // Fetch who bookmarked
  const { data: bookmarkers = [] } = useQuery({
    queryKey: ["item-bookmarkers", itemId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("digital_product_bookmarks")
        .select(
          `
          user:profiles!user_id(
            id,
            display_name,
            username,
            avatar_url
          ),
          bookmarked_at
        `
        )
        .eq("item_id", itemId)
        .order("bookmarked_at", { ascending: false });
      return data ?? [];
    },
  });

  const tabs = [
    { id: "views" as const, label: "Views", icon: Eye, data: viewers, count: viewers.length },
    { id: "likes" as const, label: "Likes", icon: Heart, data: likers, count: likers.length },
    { id: "interactions" as const, label: "Interactions", icon: MessageSquare, data: interactions, count: interactions.length },
    { id: "shares" as const, label: "Shares", icon: Share2, data: sharers, count: sharers.length },
    { id: "bookmarks" as const, label: "Bookmarks", icon: Bookmark, data: bookmarkers, count: bookmarkers.length },
  ];

  const currentTab = tabs.find(t => t.id === selectedTab)!;
  const CurrentIcon = currentTab.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CurrentIcon size={20} />
            {currentTab.label}
          </DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex gap-1 overflow-x-auto pb-2 border-b border-border/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={selectedTab === tab.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedTab(tab.id)}
                className="gap-2 flex-shrink-0"
              >
                <Icon size={16} />
                <span className="text-xs font-medium">{tab.count}</span>
              </Button>
            );
          })}
        </div>

        {/* Content */}
        <ScrollArea className="h-[400px]">
          {currentTab.data.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-center">
              <p className="text-sm text-muted-foreground">No {currentTab.label.toLowerCase()} yet</p>
            </div>
          ) : selectedTab === "interactions" ? (
            // Interactions view
            <div className="space-y-3 pr-4">
              {interactions.map((interaction: any) => (
                <div key={interaction.id} className="border border-border/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={interaction.user?.avatar_url} />
                      <AvatarFallback>{interaction.user?.display_name?.[0] ?? "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {interaction.user?.display_name || interaction.user?.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(interaction.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {interaction.comment_type && (
                      <span className="text-xs bg-muted px-2 py-1 rounded capitalize">{interaction.comment_type}</span>
                    )}
                  </div>
                  {interaction.comment_text && (
                    <p className="text-sm text-foreground/80">{interaction.comment_text}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Views, Likes, Shares, Bookmarks
            <div className="space-y-2 pr-4">
              {currentTab.data.map((item: any, idx: number) => {
                const profile = selectedTab === "views" ? item.viewer : item.user;
                const timestamp = selectedTab === "views" ? item.viewed_at : selectedTab === "likes" ? item.liked_at : selectedTab === "shares" ? item.shared_at : item.bookmarked_at;

                return (
                  <button
                    key={idx}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback>{profile?.display_name?.[0] ?? "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {profile?.display_name || profile?.username || "Anonymous"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{profile?.username || "unknown"}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
