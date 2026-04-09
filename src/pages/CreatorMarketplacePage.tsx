import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ShoppingCart, Upload, TrendingUp, DollarSign, Copy, Download, Lock, Globe } from "lucide-react";

export default function CreatorMarketplacePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [licenseType, setLicenseType] = useState("personal");
  const [file, setFile] = useState<File | null>(null);

  const { data: listings = [] } = useQuery({
    queryKey: ["marketplace", "my-listings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("marketplace_listings")
        .select("*")
        .eq("creator_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: allListings = [] } = useQuery({
    queryKey: ["marketplace", "all-listings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("marketplace_listings")
        .select("*")
        .eq("is_active", true)
        .order("sales_count", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const createListingMutation = useMutation({
    mutationFn: async () => {
      let fileUrl = null;
      if (file) {
        const path = `${user!.id}/marketplace/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage.from("project-files").upload(path, file);
        if (uploadErr) throw uploadErr;
        const { data } = supabase.storage.from("project-files").getPublicUrl(path);
        fileUrl = data.publicUrl;
      }

      const { error } = await supabase.from("marketplace_listings").insert({
        creator_id: user!.id,
        title: title.trim(),
        description: description.trim() || null,
        price: parseFloat(price),
        license_type: licenseType,
        file_url: fileUrl,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace", "my-listings"] });
      toast.success("Listing created!");
      setOpen(false);
      setTitle("");
      setDescription("");
      setPrice("");
      setFile(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6 p-6 md:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground">
            Creator Marketplace<span className="text-primary">.</span>
          </h1>
          <p className="text-muted-foreground mt-2">Sell beats, samples, templates & exclusive assets.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" size="sm"><Upload className="w-4 h-4 mr-2" /> List Asset</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Marketplace Listing</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-sm">Asset Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Lo-Fi Beat Pack" className="mt-1.5" />
              </div>
              <div>
                <Label className="text-sm">Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What's included?" rows={3} className="mt-1.5" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Price ($)</Label>
                  <Input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="9.99" className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm">License</Label>
                  <Select value={licenseType} onValueChange={setLicenseType}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal Use</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="exclusive">Exclusive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-sm">Upload File</Label>
                <label className="mt-1.5 flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition">
                  <Upload className="w-4 h-4" />
                  {file?.name || "Choose file..."}
                  <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="hero" onClick={() => createListingMutation.mutate()} disabled={!title || !price || createListingMutation.isPending}>
                {createListingMutation.isPending ? "Creating..." : "Create Listing"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* My Listings */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            My Listings ({listings.length})
          </CardTitle>
          <CardDescription>Assets you're selling on the marketplace</CardDescription>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No listings yet. Create your first one!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((listing: any) => (
                <div key={listing.id} className="border border-border/50 rounded-lg p-4 space-y-3 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{listing.title}</h3>
                      <p className="text-xs text-muted-foreground">{listing.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-primary">${listing.price}</div>
                    <Badge variant="outline" className="capitalize">{listing.license_type}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TrendingUp className="w-4 h-4" /> {listing.sales_count} sales
                    <DollarSign className="w-4 h-4 ml-2" /> ${listing.revenue || 0}
                  </div>
                  <Button size="sm" variant="outline" className="w-full">Copy Link</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Browse All */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Discover Assets ({allListings.length})</CardTitle>
          <CardDescription>Top selling assets from the community</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {allListings.slice(0, 8).map((listing: any) => (
              <div key={listing.id} className="border border-border/50 rounded-lg p-4 space-y-3 hover:border-primary/30 transition-colors group cursor-pointer">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm line-clamp-1">{listing.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{listing.description}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <div className="text-lg font-bold text-primary">${listing.price}</div>
                  <Badge variant="secondary" className="capitalize text-xs">{listing.license_type}</Badge>
                </div>
                <Button size="sm" className="w-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <ShoppingCart className="w-3 h-3 mr-1" /> Buy Now
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
