import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  ShoppingBag, Search, Filter, Upload, Star, MapPin, Clock, DollarSign, Heart,
  Sparkles, Tag, Users, TrendingUp, Eye
} from "lucide-react";

import { UploadItemDialog } from "@/components/UploadItemDialog";

const CATEGORIES = [
  "All Categories",
  "Audio",
  "Video",
  "Images",
  "Projects",
];

const SORT_OPTIONS = [
  { label: "Latest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Most Liked", value: "most_liked" },
];

export default function MarketplacePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedSort, setSelectedSort] = useState("newest");
  const [uploadOpen, setUploadOpen] = useState(false);

  // Fetch all marketplace items
  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ["marketplace-items", searchQuery, selectedCategory, selectedSort],
    queryFn: async () => {
      try {
        console.log("🔍 Fetching items...");
        
        // First, fetch all items
        let query = (supabase as any)
          .from("selling_items")
          .select("*");

        // Apply category filter
        if (selectedCategory !== "All Categories") {
          query = query.eq("category", selectedCategory);
          console.log("📁 Filtering by category:", selectedCategory);
        }

        // Apply search filter
        if (searchQuery.trim()) {
          query = query.or(
            `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
          );
          console.log("🔎 Searching for:", searchQuery);
        }

        // Apply sorting
        let orderBy = "created_at";
        let ascending = false;

        switch (selectedSort) {
          case "price_asc":
            orderBy = "price";
            ascending = true;
            break;
          case "price_desc":
            orderBy = "price";
            ascending = false;
            break;
          case "most_liked":
            orderBy = "likes_count";
            ascending = false;
            break;
          case "newest":
          default:
            orderBy = "created_at";
            ascending = false;
        }

        const { data: items, error } = await query.order(orderBy, { ascending }).limit(50);

        if (error) {
          console.error("❌ Error fetching items:", error);
          return [];
        }

        console.log(`✅ Fetched ${items?.length || 0} items from database:`, items);

        // Now fetch seller info for each item
        if (items && items.length > 0) {
          const sellerIds = [...new Set(items.map(item => item.seller_id))];
          console.log("👥 Fetching seller info for IDs:", sellerIds);

          const { data: sellers, error: sellersError } = await (supabase as any)
            .from("profiles")
            .select("user_id, display_name, username, avatar_url")
            .in("user_id", sellerIds);

          if (sellersError) {
            console.error("⚠️ Error fetching sellers:", sellersError);
            // Still return items without seller info
            return items;
          }

          console.log("✅ Fetched sellers:", sellers);

          // Merge seller data into items
          const sellersMap = sellers?.reduce((acc: any, seller: any) => {
            acc[seller.user_id] = seller;
            return acc;
          }, {}) || {};

          const itemsWithSellers = items.map(item => ({
            ...item,
            seller: sellersMap[item.seller_id] || null
          }));

          console.log("🎯 Final items with sellers:", itemsWithSellers);
          return itemsWithSellers;
        }

        return items ?? [];
      } catch (err) {
        console.error("💥 Unexpected error:", err);
        return [];
      }
    },
  });

  const handleItemClick = (itemId: string) => {
    navigate(`/marketplace/${itemId}`);
  };

  const handleSellerClick = (e: React.MouseEvent, sellerId: string) => {
    e.stopPropagation();
    navigate(`/profile/${sellerId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative border-b border-border/50 sticky top-0 z-40 bg-gradient-to-br from-background via-primary/5 to-background backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <ShoppingBag size={28} className="text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Digital Marketplace
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Discover premium creative assets & digital products</p>
              </div>
            </div>
            {user && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => setUploadOpen(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                  size="lg"
                >
                  <Upload size={18} />
                  Sell Something
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {/* Search Bar */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  placeholder="Search items, creators, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-muted/40 border-border/50 rounded-xl focus:bg-muted/60 focus:border-primary/40 transition-all"
                />
              </div>
            </div>

            {/* Category and Sort */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-muted/40 border-border/50 rounded-xl h-11 hover:bg-muted/50 transition-colors">
                  <Filter size={16} className="mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSort} onValueChange={setSelectedSort}>
                <SelectTrigger className="bg-muted/40 border-border/50 rounded-xl h-11 hover:bg-muted/50 transition-colors">
                  <TrendingUp size={16} className="mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center h-80"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <ShoppingBag size={32} className="text-primary" />
                </motion.div>
              </div>
              <p className="text-muted-foreground font-medium">Loading marketplace...</p>
            </div>
          </motion.div>
        ) : items.length > 0 ? (
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-8 flex items-center justify-between"
            >
              <div>
                <h2 className="text-2xl font-bold">Browse Products</h2>
                <p className="text-sm text-muted-foreground mt-1">{items.length} items available</p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  whileHover={{ y: -8 }}
                  onClick={() => handleItemClick(item.id)}
                  className="cursor-pointer group h-full"
                >
                  <Card className="border-border/50 hover:border-primary/40 hover:shadow-2xl transition-all overflow-hidden h-full flex flex-col bg-card/50 backdrop-blur-sm hover:bg-card/70">
                    {/* Image Section with Hover Overlay */}
                    <div className="relative h-56 bg-gradient-to-br from-secondary to-secondary/50 overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                          <ShoppingBag size={56} className="text-muted-foreground/30" />
                        </div>
                      )}

                      {/* Dark Overlay on Hover */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-4"
                      >
                        {/* Hover Content - Clean Price Display */}
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          whileHover={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-2"
                        >
                          {/* Price Badge */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 bg-primary/95 backdrop-blur px-4 py-2.5 rounded-xl shadow-lg">
                              <DollarSign size={18} className="text-primary-foreground" />
                              <span className="font-bold text-lg text-primary-foreground">${item.price}</span>
                            </div>
                          </div>

                          {/* Engagement Stats */}
                          <div className="flex items-center gap-3 text-white/80 text-sm">
                            <Heart size={14} className="opacity-70" />
                            <span className="text-xs">{item.likes_count || 0} Likes</span>
                          </div>
                        </motion.div>
                      </motion.div>

                      {/* Top Right Badge - Category & License */}
                      <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                        {/* Category */}
                        <div className="bg-accent/90 backdrop-blur px-3 py-1.5 rounded-full text-[11px] font-semibold text-accent-foreground">
                          {item.category}
                        </div>
                        
                        {/* License Type */}
                        {item.license_type && (
                          <div className="bg-blue-500/90 backdrop-blur px-3 py-1.5 rounded-full text-[11px] font-semibold text-white">
                            {item.license_type}
                          </div>
                        )}
                      </div>

                      {/* Top Left - Stock */}
                      {item.stock_count && item.stock_count > 0 && (
                        <div className="absolute top-3 left-3 bg-emerald-500/95 backdrop-blur px-3 py-1 rounded-lg text-[11px] text-white font-bold flex items-center gap-1 z-10">
                          <Sparkles size={12} />
                          {item.stock_count} in stock
                        </div>
                      )}
                    </div>

                    {/* Content Section - Title and Info Below Image */}
                    <CardContent className="flex-1 p-4 flex flex-col justify-between">
                      {/* Title */}
                      <div className="mb-3">
                        <h3 className="font-semibold text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                      </div>

                      {/* Tags */}
                      {item.tags && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {item.tags.split(",").slice(0, 2).map((tag: string) => (
                            <span
                              key={tag}
                              className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-medium"
                            >
                              #{tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Engagement Footer - Price & Engagement Metrics */}
                      <div className="flex items-center justify-between pt-3 border-t border-border/30">
                        <div className="flex items-center gap-2">
                          {item.likes_count && item.likes_count > 0 && (
                            <motion.div
                              whileHover={{ scale: 1.2 }}
                              className="flex items-center gap-1 text-red-500 font-semibold text-xs"
                            >
                              <Heart size={14} fill="currentColor" />
                              {item.likes_count}
                            </motion.div>
                          )}
                          <div className="flex items-center gap-1 text-muted-foreground text-xs">
                            <Eye size={14} />
                            {item.views_count || 0}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-primary">
                          ${item.price}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center h-80"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-muted mb-4">
                <ShoppingBag size={40} className="text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No items yet</h3>
              <p className="text-muted-foreground mb-6">Try searching for something else or browse all categories</p>
              {!user && (
                <Button onClick={() => navigate("/login")}>Sign in to sell</Button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Upload Dialog */}
      <UploadItemDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
