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
  ShoppingBag, Search, Filter, Upload, Star, MapPin, Clock, DollarSign, Heart
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
      let query = (supabase as any)
        .from("selling_items")
        .select(
          `
          *,
          seller:profiles(
            id,
            display_name,
            username,
            avatar_url
          )
        `
        )
        .eq("is_available", true);

      // Apply category filter
      if (selectedCategory !== "All Categories") {
        query = query.eq("category", selectedCategory);
      }

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(
          `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
        );
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

      const { data, error } = await query.order(orderBy, { ascending }).limit(50);

      if (error) {
        console.error("Error fetching items:", error);
        return [];
      }

      return data ?? [];
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
      {/* Header */}
      <div className="border-b border-border/50 sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShoppingBag size={24} className="text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold">Marketplace</h1>
            </div>
            {user && (
              <Button
                onClick={() => setUploadOpen(true)}
                className="flex items-center gap-2"
              >
                <Upload size={16} />
                Sell Something
              </Button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search items, sellers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-muted/50 border-border/50"
              />
            </div>

            {/* Category and Sort */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-muted/50 border-border/50">
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
                <SelectTrigger className="bg-muted/50 border-border/50">
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
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <ShoppingBag size={40} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Loading items...</p>
            </div>
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleItemClick(item.id)}
                className="cursor-pointer group"
              >
                <Card className="border-border/50 hover:border-primary/40 hover:shadow-lg transition-all overflow-hidden h-full flex flex-col">
                  {/* Image Section */}
                  <div className="relative h-40 bg-secondary overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={40} className="text-muted-foreground/30" />
                      </div>
                    )}

                    {/* Price Badge */}
                    <div className="absolute top-2 right-2 bg-primary/90 backdrop-blur px-3 py-1.5 rounded-lg text-[13px] font-bold text-primary-foreground flex items-center gap-1">
                      <DollarSign size={14} />
                      {item.price}
                    </div>

                    {/* Stock Badge */}
                    {item.stock_count && item.stock_count > 0 && (
                      <div className="absolute bottom-2 left-2 bg-emerald-500/90 backdrop-blur px-2 py-1 rounded text-[11px] text-white font-medium">
                        {item.stock_count} in stock
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <h3 className="text-sm font-bold truncate mb-1 line-clamp-2">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
                        {item.description}
                      </p>
                    )}

                    <p className="text-[11px] text-muted-foreground capitalized mb-3 flex-1">
                      {item.category}
                    </p>

                    {/* Seller Info */}
                    {item.seller && (
                      <div
                        className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        onClick={(e) => handleSellerClick(e, item.seller.id)}
                      >
                        {item.seller.avatar_url ? (
                          <img
                            src={item.seller.avatar_url}
                            alt={item.seller.display_name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                            {item.seller.display_name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {item.seller.display_name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            @{item.seller.username}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/30">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {item.created_at
                          ? formatDistanceToNow(new Date(item.created_at), {
                              addSuffix: true,
                            })
                          : "recently"}
                      </div>
                      {item.likes_count && item.likes_count > 0 && (
                        <div className="flex items-center gap-1 text-red-500">
                          <Heart size={12} fill="currentColor" />
                          {item.likes_count}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <ShoppingBag size={40} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory !== "All Categories"
                  ? "No items found matching your search"
                  : "No items in marketplace yet"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <UploadItemDialog open={uploadOpen} onOpenChange={setUploadOpen} onSuccess={refetch} />
    </div>
  );
}
