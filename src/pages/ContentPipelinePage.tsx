import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Megaphone, Tag, Image as ImageIcon, Send } from "lucide-react";

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  created_by: string;
  media_url: string | null;
  media_type: string | null;
  is_active: boolean;
  created_at: string;
}

interface PromotionItem {
  id: string;
  title: string;
  content: string;
  discount_percentage: number | null;
  valid_until: string | null;
  created_by: string;
  media_url: string | null;
  media_type: string | null;
  is_active: boolean;
  created_at: string;
}

interface AdItem {
  id: string;
  title: string;
  content: string;
  created_by: string;
  target_audience: string | null;
  link_url: string | null;
  image_url: string | null;
  media_url: string | null;
  media_type: string | null;
  is_active: boolean;
  created_at: string;
}

async function uploadPipelineMedia(userId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `content-pipeline/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("project-files").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("project-files").getPublicUrl(path);
  return {
    media_url: data.publicUrl,
    media_type: file.type || (ext === "mp4" ? "video/mp4" : "image/*"),
  };
}

function formatSubmitError(error: Error, typeLabel: string) {
  if (error.message.includes("Could not find the table")) {
    return `Failed to submit ${typeLabel}: database table is missing. Apply latest Supabase migrations, then retry.`;
  }
  return `Failed to submit ${typeLabel}: ${error.message}`;
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return <Badge className="bg-emerald-600 hover:bg-emerald-700">Live</Badge>;
  }
  return <Badge variant="secondary">Pending Review</Badge>;
}

export default function ContentPipelinePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementMedia, setAnnouncementMedia] = useState<File | null>(null);

  const [promotionTitle, setPromotionTitle] = useState("");
  const [promotionContent, setPromotionContent] = useState("");
  const [promotionDiscount, setPromotionDiscount] = useState("");
  const [promotionValidUntil, setPromotionValidUntil] = useState("");
  const [promotionMedia, setPromotionMedia] = useState<File | null>(null);

  const [adTitle, setAdTitle] = useState("");
  const [adContent, setAdContent] = useState("");
  const [adAudience, setAdAudience] = useState("");
  const [adLink, setAdLink] = useState("");
  const [adImage, setAdImage] = useState("");
  const [adMedia, setAdMedia] = useState<File | null>(null);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>You need an account to submit content for review.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/login")}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: announcements = [] } = useQuery({
    queryKey: ["pipeline-announcements", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, content, created_by, media_url, media_type, is_active, created_at")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AnnouncementItem[];
    },
  });

  const { data: promotions = [] } = useQuery({
    queryKey: ["pipeline-promotions", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("id, title, content, discount_percentage, valid_until, created_by, media_url, media_type, is_active, created_at")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PromotionItem[];
    },
  });

  const { data: ads = [] } = useQuery({
    queryKey: ["pipeline-ads", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("id, title, content, created_by, target_audience, link_url, image_url, media_url, media_type, is_active, created_at")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdItem[];
    },
  });

  const createAnnouncement = useMutation({
    mutationFn: async () => {
      let media: { media_url: string | null; media_type: string | null } = { media_url: null, media_type: null };
      if (announcementMedia) {
        media = await uploadPipelineMedia(user.id, announcementMedia);
      }
      const { error } = await supabase.from("announcements").insert({
        title: announcementTitle.trim(),
        content: announcementContent.trim(),
        created_by: user.id,
        is_active: false,
        media_url: media.media_url,
        media_type: media.media_type,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-announcements", user.id] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setAnnouncementTitle("");
      setAnnouncementContent("");
      setAnnouncementMedia(null);
      toast.success("Announcement submitted for admin review.");
    },
    onError: (error: Error) => toast.error(formatSubmitError(error, "announcement")),
  });

  const createPromotion = useMutation({
    mutationFn: async () => {
      const discount = promotionDiscount.trim() ? Number(promotionDiscount) : null;
      let media: { media_url: string | null; media_type: string | null } = { media_url: null, media_type: null };
      if (promotionMedia) {
        media = await uploadPipelineMedia(user.id, promotionMedia);
      }
      const { error } = await supabase.from("promotions").insert({
        title: promotionTitle.trim(),
        content: promotionContent.trim(),
        discount_percentage: Number.isFinite(discount) ? discount : null,
        valid_until: promotionValidUntil || null,
        created_by: user.id,
        is_active: false,
        media_url: media.media_url,
        media_type: media.media_type,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-promotions", user.id] });
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      setPromotionTitle("");
      setPromotionContent("");
      setPromotionDiscount("");
      setPromotionValidUntil("");
      setPromotionMedia(null);
      toast.success("Promotion submitted for admin review.");
    },
    onError: (error: Error) => toast.error(formatSubmitError(error, "promotion")),
  });

  const createAd = useMutation({
    mutationFn: async () => {
      let media: { media_url: string | null; media_type: string | null } = { media_url: null, media_type: null };
      if (adMedia) {
        media = await uploadPipelineMedia(user.id, adMedia);
      }
      const { error } = await supabase.from("ads").insert({
        title: adTitle.trim(),
        content: adContent.trim(),
        target_audience: adAudience.trim() || null,
        link_url: adLink.trim() || null,
        image_url: adImage.trim() || null,
        created_by: user.id,
        is_active: false,
        media_url: media.media_url,
        media_type: media.media_type,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-ads", user.id] });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      setAdTitle("");
      setAdContent("");
      setAdAudience("");
      setAdLink("");
      setAdImage("");
      setAdMedia(null);
      toast.success("Ad submitted for admin review.");
    },
    onError: (error: Error) => toast.error(formatSubmitError(error, "ad")),
  });

  const pendingCount =
    announcements.filter((item) => !item.is_active).length +
    promotions.filter((item) => !item.is_active).length +
    ads.filter((item) => !item.is_active).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-6 md:p-8">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground">
              Content Pipeline<span className="text-primary">.</span>
            </h1>
            <p className="text-sm text-muted-foreground">Submit announcements, promotions, and ads for admin approval.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Pending: {pendingCount}</Badge>
            <Button variant="outline" onClick={() => navigate("/admin")}>
              Open Admin Queue
            </Button>
          </div>
        </div>

        <Tabs defaultValue="announcements" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="announcements" className="gap-2">
              <Megaphone className="h-4 w-4" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="promotions" className="gap-2">
              <Tag className="h-4 w-4" />
              Promotions
            </TabsTrigger>
            <TabsTrigger value="ads" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Ads
            </TabsTrigger>
          </TabsList>

          <TabsContent value="announcements">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Submit Announcement</CardTitle>
                <CardDescription>These are submitted as pending until an admin enables them.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="announcement-title">Title</Label>
                  <Input
                    id="announcement-title"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    placeholder="New feature release update"
                  />
                </div>
                <div>
                  <Label htmlFor="announcement-content">Content</Label>
                  <Textarea
                    id="announcement-content"
                    value={announcementContent}
                    onChange={(e) => setAnnouncementContent(e.target.value)}
                    placeholder="Write the announcement details..."
                  />
                </div>
                <div>
                  <Label htmlFor="announcement-media">Image or Video</Label>
                  <Input
                    id="announcement-media"
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => setAnnouncementMedia(e.target.files?.[0] ?? null)}
                  />
                </div>
                <Button
                  onClick={() => createAnnouncement.mutate()}
                  disabled={!announcementTitle.trim() || !announcementContent.trim() || createAnnouncement.isPending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {createAnnouncement.isPending ? "Submitting..." : "Submit for Review"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Announcements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {announcements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No submissions yet.</p>
                ) : (
                  announcements.map((item) => (
                    <div key={item.id} className="rounded-lg border p-3">
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <Link to={`/content/announcement/${item.id}`} className="font-medium hover:text-primary">
                          {item.title}
                        </Link>
                        <StatusBadge isActive={item.is_active} />
                      </div>
                      <p className="text-sm text-muted-foreground">{item.content}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="promotions">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Submit Promotion</CardTitle>
                <CardDescription>Share campaign details and let admin approve before going live.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="promotion-title">Title</Label>
                  <Input
                    id="promotion-title"
                    value={promotionTitle}
                    onChange={(e) => setPromotionTitle(e.target.value)}
                    placeholder="Spring launch offer"
                  />
                </div>
                <div>
                  <Label htmlFor="promotion-content">Content</Label>
                  <Textarea
                    id="promotion-content"
                    value={promotionContent}
                    onChange={(e) => setPromotionContent(e.target.value)}
                    placeholder="Describe your promo details..."
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="promotion-discount">Discount %</Label>
                    <Input
                      id="promotion-discount"
                      type="number"
                      value={promotionDiscount}
                      onChange={(e) => setPromotionDiscount(e.target.value)}
                      placeholder="20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="promotion-valid-until">Valid Until</Label>
                    <Input
                      id="promotion-valid-until"
                      type="datetime-local"
                      value={promotionValidUntil}
                      onChange={(e) => setPromotionValidUntil(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="promotion-media">Image or Video</Label>
                  <Input
                    id="promotion-media"
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => setPromotionMedia(e.target.files?.[0] ?? null)}
                  />
                </div>
                <Button
                  onClick={() => createPromotion.mutate()}
                  disabled={!promotionTitle.trim() || !promotionContent.trim() || createPromotion.isPending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {createPromotion.isPending ? "Submitting..." : "Submit for Review"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Promotions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {promotions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No submissions yet.</p>
                ) : (
                  promotions.map((item) => (
                    <div key={item.id} className="rounded-lg border p-3">
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <Link to={`/content/promotion/${item.id}`} className="font-medium hover:text-primary">
                          {item.title}
                        </Link>
                        <StatusBadge isActive={item.is_active} />
                      </div>
                      <p className="text-sm text-muted-foreground">{item.content}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {item.discount_percentage !== null && <span>Discount: {item.discount_percentage}%</span>}
                        {item.valid_until && <span>Valid until: {new Date(item.valid_until).toLocaleString()}</span>}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ads">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Submit Ad</CardTitle>
                <CardDescription>Ads are queued for admin review before activation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ad-title">Title</Label>
                  <Input
                    id="ad-title"
                    value={adTitle}
                    onChange={(e) => setAdTitle(e.target.value)}
                    placeholder="Homepage banner campaign"
                  />
                </div>
                <div>
                  <Label htmlFor="ad-content">Content</Label>
                  <Textarea
                    id="ad-content"
                    value={adContent}
                    onChange={(e) => setAdContent(e.target.value)}
                    placeholder="Write ad copy..."
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="ad-audience">Target Audience</Label>
                    <Input
                      id="ad-audience"
                      value={adAudience}
                      onChange={(e) => setAdAudience(e.target.value)}
                      placeholder="Artists in LA"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ad-link">Link URL</Label>
                    <Input
                      id="ad-link"
                      value={adLink}
                      onChange={(e) => setAdLink(e.target.value)}
                      placeholder="https://example.com/campaign"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="ad-image">Image URL</Label>
                  <Input
                    id="ad-image"
                    value={adImage}
                    onChange={(e) => setAdImage(e.target.value)}
                    placeholder="https://example.com/banner.png"
                  />
                </div>
                <div>
                  <Label htmlFor="ad-media">Image or Video</Label>
                  <Input
                    id="ad-media"
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => setAdMedia(e.target.files?.[0] ?? null)}
                  />
                </div>
                <Button onClick={() => createAd.mutate()} disabled={!adTitle.trim() || !adContent.trim() || createAd.isPending}>
                  <Send className="mr-2 h-4 w-4" />
                  {createAd.isPending ? "Submitting..." : "Submit for Review"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Ads</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ads.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No submissions yet.</p>
                ) : (
                  ads.map((item) => (
                    <div key={item.id} className="rounded-lg border p-3">
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <Link to={`/content/ad/${item.id}`} className="font-medium hover:text-primary">
                          {item.title}
                        </Link>
                        <StatusBadge isActive={item.is_active} />
                      </div>
                      <p className="text-sm text-muted-foreground">{item.content}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {item.target_audience && <span>Target: {item.target_audience}</span>}
                        {item.link_url && <span>Link: {item.link_url}</span>}
                        {item.image_url && <span>Image attached</span>}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
