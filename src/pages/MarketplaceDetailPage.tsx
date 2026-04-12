import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft, Eye, Heart, Share2, MessageCircle, Bookmark, Download,
  Music, Video, Image as ImageIcon, Download as DownloadIcon, X, Lock
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EngagementMenu } from "@/components/EngagementMenu";
import { CommentSection } from "@/components/CommentSection";

export default function MarketplaceDetailPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [engagementMenuOpen, setEngagementMenuOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [downloadPassword, setDownloadPassword] = useState("");

  // Password verification handler
  const handleVerifyPassword = () => {
    if (downloadPassword === item?.download_password) {
      if (item?.file_url) {
        window.open(item.file_url, "_blank");
        setPasswordDialogOpen(false);
        setDownloadPassword("");
        toast.success("Password correct! Download started!");
      }
    } else {
      toast.error("Incorrect password. Please try again.");
      setDownloadPassword("");
    }
  };

  // Fetch item details
  const { data: item, isLoading } = useQuery({
    queryKey: ["marketplace-item", itemId],
    queryFn: async () => {
      if (!itemId) return null;

      try {
        console.log("🔍 Fetching item:", itemId);

        // First fetch the item
        const { data: itemData, error } = await (supabase as any)
          .from("selling_items")
          .select("*")
          .eq("id", itemId)
          .single();

        if (error) {
          console.error("❌ Error fetching item:", error);
          return null;
        }

        console.log("✅ Item fetched:", itemData);

        // Then fetch seller data if seller_id exists
        let seller = null;
        if (itemData?.seller_id) {
          const { data: sellerData, error: sellerError } = await (supabase as any)
            .from("profiles")
            .select("user_id, display_name, username, avatar_url, bio")
            .eq("user_id", itemData.seller_id)
            .single();

          if (sellerError) {
            console.warn("⚠️ Error fetching seller:", sellerError);
          } else {
            // Map user_id to id for compatibility
            seller = sellerData ? { id: sellerData.user_id, ...sellerData } : null;
            console.log("✅ Seller fetched:", seller);
          }
        }

        return {
          ...itemData,
          seller
        };
      } catch (err) {
        console.error("💥 Unexpected error:", err);
        return null;
      }
    },
    enabled: !!itemId,
  });

  // Track view on page load
  useEffect(() => {
    if (item && user && itemId) {
      (async () => {
        try {
          // First check if view already exists for this user
          const { data: existingView } = await (supabase as any)
            .from("digital_product_views")
            .select("id")
            .eq("item_id", itemId)
            .eq("viewer_id", user.id)
            .single();

          // Only insert if view doesn't already exist
          if (!existingView) {
            await (supabase as any)
              .from("digital_product_views")
              .insert({ item_id: itemId, viewer_id: user.id });
            
            // Refresh engagement counts
            queryClient.invalidateQueries({ queryKey: ["item-engagement-counts", itemId] });
          }
        } catch (error) {
          console.error("Error tracking view:", error);
        }
      })();
    }
  }, [item, user, itemId, queryClient]);

  // Fetch engagement counts
  const { data: engagementCounts = {} } = useQuery({
    queryKey: ["item-engagement-counts", itemId],
    queryFn: async () => {
      if (!itemId) return {};

      try {
        // Fetch just the IDs to count them
        const [viewsResp, likesResp, interactionsResp, sharesResp, bookmarksResp] = await Promise.all([
          (supabase as any).from("digital_product_views").select("id").eq("item_id", itemId),
          (supabase as any).from("digital_product_likes").select("id").eq("item_id", itemId),
          (supabase as any).from("digital_product_interactions").select("id").eq("item_id", itemId),
          (supabase as any).from("digital_product_shares").select("id").eq("item_id", itemId),
          (supabase as any).from("digital_product_bookmarks").select("id").eq("item_id", itemId),
        ]);

        return {
          views_count: viewsResp.data?.length ?? 0,
          likes_count: likesResp.data?.length ?? 0,
          interactions_count: interactionsResp.data?.length ?? 0,
          shares_count: sharesResp.data?.length ?? 0,
          bookmarks_count: bookmarksResp.data?.length ?? 0,
        };
      } catch (error) {
        console.error("Error fetching engagement counts:", error);
        return {
          views_count: 0,
          likes_count: 0,
          interactions_count: 0,
          shares_count: 0,
          bookmarks_count: 0,
        };
      }
    },
    enabled: !!itemId,
  });

  // Check if user liked this item
  const { data: userLiked = false } = useQuery({
    queryKey: ["item-user-liked", itemId, user?.id],
    queryFn: async () => {
      if (!user || !itemId) return false;

      const { data } = await (supabase as any)
        .from("digital_product_likes")
        .select("id")
        .eq("item_id", itemId)
        .eq("user_id", user.id)
        .single();

      return !!data;
    },
    enabled: !!user && !!itemId,
  });

  // Check if user bookmarked
  const { data: userBookmarked = false } = useQuery({
    queryKey: ["item-user-bookmarked", itemId, user?.id],
    queryFn: async () => {
      if (!user || !itemId) return false;

      const { data } = await (supabase as any)
        .from("digital_product_bookmarks")
        .select("id")
        .eq("item_id", itemId)
        .eq("user_id", user.id)
        .single();

      return !!data;
    },
    enabled: !!user && !!itemId,
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast.error("Please log in to like items");
        return;
      }
      if (!itemId) return;

      if (userLiked) {
        await (supabase as any)
          .from("digital_product_likes")
          .delete()
          .eq("item_id", itemId)
          .eq("user_id", user.id);
      } else {
        await (supabase as any)
          .from("digital_product_likes")
          .insert({ item_id: itemId, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item-user-liked", itemId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["item-engagement-counts", itemId] });
      toast.success(userLiked ? "Removed from favorites" : "Added to favorites");
    },
  });

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast.error("Please log in to bookmark items");
        return;
      }
      if (!itemId) return;

      if (userBookmarked) {
        await (supabase as any)
          .from("digital_product_bookmarks")
          .delete()
          .eq("item_id", itemId)
          .eq("user_id", user.id);
      } else {
        await (supabase as any)
          .from("digital_product_bookmarks")
          .insert({ item_id: itemId, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item-user-bookmarked", itemId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["item-engagement-counts", itemId] });
      toast.success(userBookmarked ? "Removed from bookmarks" : "Bookmarked!");
    },
  });

  // Share mutation
  const shareMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast.error("Please log in to share");
        return;
      }
      if (!itemId) return;

      await (supabase as any)
        .from("digital_product_shares")
        .insert({ item_id: itemId, user_id: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item-engagement-counts", itemId] });
      // Copy link to clipboard
      const url = `${window.location.origin}/marketplace/${itemId}`;
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    },
  });

  // Get media type icon
  const getMediaIcon = () => {
    const format = item?.file_format?.toLowerCase() || "";
    if (format.includes("mp3") || format.includes("wav") || format.includes("flac")) {
      return <Music size={48} className="text-primary" />;
    } else if (format.includes("mp4") || format.includes("mov") || format.includes("avi")) {
      return <Video size={48} className="text-primary" />;
    } else if (format.includes("jpg") || format.includes("png") || format.includes("webp")) {
      return <ImageIcon size={48} className="text-primary" />;
    }
    return <DownloadIcon size={48} className="text-primary" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse space-y-3">
            <div className="h-8 w-32 bg-muted rounded mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Item not found</p>
          <Button onClick={() => navigate("/marketplace")}>Back to Marketplace</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/marketplace")}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Media Display */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-border/50 overflow-hidden">
                <div className="h-96 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center overflow-hidden relative">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      {getMediaIcon()}
                      <p className="text-sm text-muted-foreground">{item.file_format}</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Title & Description */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 font-semibold">
                  {item.category}
                </p>
                <h1 className="font-display text-3xl font-bold mb-3">{item.title}</h1>
                <p className="text-lg font-semibold text-foreground mb-4">
                  ${item.price} <span className="text-sm text-muted-foreground">{item.currency}</span>
                </p>

                {item.description && (
                  <div className="space-y-2">
                    <h2 className="font-semibold">Description</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="space-y-4">
                {/* Basic Specifications */}
                <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">License</p>
                    <p className="font-medium text-sm">{item.license_type || "Personal"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Format</p>
                    <p className="font-medium text-sm">{item.file_format}</p>
                  </div>
                  {item.language && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Language</p>
                      <p className="font-medium text-sm">{item.language}</p>
                    </div>
                  )}
                  {item.quality && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Quality</p>
                      <p className="font-medium text-sm">{item.quality}</p>
                    </div>
                  )}
                  {item.duration && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Duration</p>
                      <p className="font-medium text-sm">{item.duration}</p>
                    </div>
                  )}
                  {item.resolution && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Resolution</p>
                      <p className="font-medium text-sm">{item.resolution}</p>
                    </div>
                  )}
                  {item.version && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Version</p>
                      <p className="font-medium text-sm">{item.version}</p>
                    </div>
                  )}
                  {item.skill_level && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Skill Level</p>
                      <p className="font-medium text-sm">{item.skill_level}</p>
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                {(item.software_used || item.usage_rights || item.artist_name) && (
                  <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                    {item.software_used && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Software Used</p>
                        <p className="font-medium text-sm">{item.software_used}</p>
                      </div>
                    )}
                    {item.usage_rights && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Usage Rights</p>
                        <p className="font-medium text-sm">{item.usage_rights}</p>
                      </div>
                    )}
                    {item.artist_name && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Artist Name</p>
                        <p className="font-medium text-sm">{item.artist_name}</p>
                      </div>
                    )}
                    {item.collaborators && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Collaborators</p>
                        <p className="font-medium text-sm">{item.collaborators}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Rights & Policies */}
                {(item.commercial_use || item.resale_allowed || item.sample_available || item.warranty || item.refund_policy) && (
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase">Rights & Policies</p>
                    <div className="space-y-2">
                      {item.commercial_use && <div className="text-sm">✓ Commercial Use Allowed</div>}
                      {item.resale_allowed && <div className="text-sm">✓ Resale Rights Included</div>}
                      {item.sample_available && <div className="text-sm">✓ Sample Available</div>}
                      {item.warranty && <div className="text-sm">✓ Product Warranty Included</div>}
                      {item.support_included && <div className="text-sm">✓ Customer Support Included</div>}
                      {item.refund_policy && <div className="text-sm">Refund Policy: {item.refund_policy}</div>}
                    </div>
                  </div>
                )}

                {item.tags && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {item.tags.split(",").map((tag: string) => (
                        <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Seller Notes */}
              {item.seller_notes && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-xs font-bold text-blue-700 mb-1">💡 Seller Notes</p>
                  <p className="text-sm text-blue-600">{item.seller_notes}</p>
                </div>
              )}
            </motion.div>

            {/* Engagement Stats */}
            <div className="grid grid-cols-5 gap-2 p-4 bg-muted/30 rounded-lg">
              <button onClick={() => setEngagementMenuOpen(true)} className="text-center hover:bg-muted/50 p-2 rounded transition-colors cursor-pointer">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Eye size={16} />
                  <span className="text-xs font-semibold">{engagementCounts.views_count || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">Views</p>
              </button>
              <button onClick={() => setEngagementMenuOpen(true)} className="text-center hover:bg-muted/50 p-2 rounded transition-colors cursor-pointer">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Heart size={16} />
                  <span className="text-xs font-semibold">{engagementCounts.likes_count || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">Likes</p>
              </button>
              <button onClick={() => setEngagementMenuOpen(true)} className="text-center hover:bg-muted/50 p-2 rounded transition-colors cursor-pointer">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MessageCircle size={16} />
                  <span className="text-xs font-semibold">{engagementCounts.interactions_count || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">Comments</p>
              </button>
              <button onClick={() => setEngagementMenuOpen(true)} className="text-center hover:bg-muted/50 p-2 rounded transition-colors cursor-pointer">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Share2 size={16} />
                  <span className="text-xs font-semibold">{engagementCounts.shares_count || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">Shares</p>
              </button>
              <button onClick={() => setEngagementMenuOpen(true)} className="text-center hover:bg-muted/50 p-2 rounded transition-colors cursor-pointer">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Bookmark size={16} />
                  <span className="text-xs font-semibold">{engagementCounts.bookmarks_count || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">Saves</p>
              </button>
            </div>

            {/* Comments Section */}
            <CommentSection
              itemId={itemId!}
              allowComments={item?.allow_comments ?? true}
              commentsVisibleToAll={item?.comments_visible_to_all ?? false}
              sellerId={item?.seller_id!}
            />
          </div>

          {/* Sidebar - Seller & Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Seller Card */}
            <Card className="border-border/50 p-6">
              <h3 className="font-semibold mb-4">Seller</h3>
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={item.seller?.avatar_url} />
                  <AvatarFallback>{item.seller?.display_name?.[0] ?? "S"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{item.seller?.display_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">@{item.seller?.username}</p>
                </div>
              </div>
              {item.seller?.bio && <p className="text-sm text-muted-foreground mb-4">{item.seller.bio}</p>}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/profile/${item.seller?.id}`)}
              >
                View Profile
              </Button>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                className="w-full gap-2"
                onClick={() => {
                  if (!item.file_url) {
                    toast.error("Download link not available");
                    return;
                  }
                  
                  // If password protected, show dialog
                  if (item.download_password) {
                    setPasswordDialogOpen(true);
                    setDownloadPassword("");
                  } else {
                    // Direct download if no password
                    window.open(item.file_url, "_blank");
                    toast.success("Download started!");
                  }
                }}
              >
                <Download size={16} />
                Download Now
              </Button>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={userLiked ? "default" : "outline"}
                  onClick={() => likeMutation.mutate()}
                  disabled={likeMutation.isPending}
                  className="gap-1"
                >
                  <Heart size={16} fill={userLiked ? "currentColor" : "none"} />
                  <span className="hidden sm:inline text-xs">Like</span>
                </Button>
                <Button
                  variant={userBookmarked ? "default" : "outline"}
                  onClick={() => bookmarkMutation.mutate()}
                  disabled={bookmarkMutation.isPending}
                  className="gap-1"
                >
                  <Bookmark size={16} fill={userBookmarked ? "currentColor" : "none"} />
                  <span className="hidden sm:inline text-xs">Save</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => shareMutation.mutate()}
                  disabled={shareMutation.isPending}
                  className="gap-1"
                >
                  <Share2 size={16} />
                  <span className="hidden sm:inline text-xs">Share</span>
                </Button>
              </div>
            </div>

            {/* Payment Methods */}
            {item.accepted_payment_methods && (
              <Card className="border-border/50 p-4">
                <p className="text-xs text-muted-foreground mb-2 font-semibold">Payment Methods</p>
                <div className="flex flex-wrap gap-1">
                  {item.accepted_payment_methods.map((method: string) => (
                    <span key={method} className="text-xs bg-muted px-2 py-1 rounded">
                      {method}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </motion.div>
        </div>
      </div>

      {/* Engagement Menu Modal */}
      <EngagementMenu itemId={itemId!} open={engagementMenuOpen} onOpenChange={setEngagementMenuOpen} />

      {/* Download Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Lock size={24} className="text-primary" />
              <div>
                <DialogTitle>Password Protected</DialogTitle>
                <DialogDescription className="mt-1">
                  This download requires a password. Please enter the password provided by the seller.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={downloadPassword}
              onChange={(e) => setDownloadPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && downloadPassword.trim()) {
                  handleVerifyPassword();
                }
              }}
              autoFocus
              className="bg-muted/50"
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setPasswordDialogOpen(false);
                  setDownloadPassword("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleVerifyPassword()}
                disabled={!downloadPassword.trim()}
                className="flex-1"
              >
                Verify & Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
