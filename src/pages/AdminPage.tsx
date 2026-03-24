import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Megaphone, Tag, Image, Trash2, Plus, ExternalLink, Users, Share2, Calendar, FolderOpen, BarChart3, FileText, MessageCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SocialPlatformCard } from "@/components/admin/SocialPlatformCard";
import { UnifiedInbox } from "@/components/admin/UnifiedInbox";
import { ContentCalendar } from "@/components/admin/ContentCalendar";
import { AssetLibrary } from "@/components/admin/AssetLibrary";
import { CompetitorBenchmark } from "@/components/admin/CompetitorBenchmark";
import { ReportGenerator } from "@/components/admin/ReportGenerator";
import { mockSocialPlatforms } from "@/lib/admin-mocks";

async function uploadAdminMedia(userId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `admin-content/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("project-files").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("project-files").getPublicUrl(path);
  return {
    media_url: data.publicUrl,
    media_type: file.type || (ext === "mp4" ? "video/mp4" : "image/*"),
  };
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  media_url?: string | null;
  media_type?: string | null;
  is_active: boolean;
  created_at: string;
}

interface Promotion {
  id: string;
  title: string;
  content: string;
  discount_percentage?: number;
  valid_until?: string;
  media_url?: string | null;
  media_type?: string | null;
  is_active: boolean;
  created_at: string;
}

interface Ad {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  link_url?: string;
  target_audience?: string;
  media_url?: string | null;
  media_type?: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminPage() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (!user || role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You need admin privileges to access this page.</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Announcements
  const { data: announcements = [], isLoading: loadingAnnouncements } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; mediaFile?: File | null }) => {
      let media: { media_url?: string | null; media_type?: string | null } = {};
      if (data.mediaFile) {
        media = await uploadAdminMedia(user.id, data.mediaFile);
      }
      const { data: result, error } = await supabase
        .from("announcements")
        .insert([{ title: data.title, content: data.content, created_by: user.id, ...media }])
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create announcement: " + error.message);
    },
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Announcement> }) => {
      const { data: result, error } = await supabase
        .from("announcements")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update announcement: " + error.message);
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete announcement: " + error.message);
    },
  });

  // Similar mutations for promotions and ads
  const { data: promotions = [], isLoading: loadingPromotions } = useQuery({
    queryKey: ["promotions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("promotions")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const createPromotionMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; discount_percentage?: number; valid_until?: string; mediaFile?: File | null }) => {
      let media: { media_url?: string | null; media_type?: string | null } = {};
      if (data.mediaFile) {
        media = await uploadAdminMedia(user.id, data.mediaFile);
      }
      const { data: result, error } = await supabase
        .from("promotions")
        .insert([{
          title: data.title,
          content: data.content,
          discount_percentage: data.discount_percentage,
          valid_until: data.valid_until,
          created_by: user.id,
          ...media
        }])
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast.success("Promotion created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create promotion: " + error.message);
    },
  });

  const updatePromotionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Promotion> }) => {
      const { data: result, error } = await supabase
        .from("promotions")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast.success("Promotion updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update promotion: " + error.message);
    },
  });

  const deletePromotionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("promotions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast.success("Promotion deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete promotion: " + error.message);
    },
  });

  const { data: ads = [], isLoading: loadingAds } = useQuery({
    queryKey: ["ads"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ads")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const createAdMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; image_url?: string; link_url?: string; target_audience?: string; mediaFile?: File | null }) => {
      let media: { media_url?: string | null; media_type?: string | null } = {};
      if (data.mediaFile) {
        media = await uploadAdminMedia(user.id, data.mediaFile);
      }
      const { data: result, error } = await supabase
        .from("ads")
        .insert([{ ...data, created_by: user.id, ...media }])
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      toast.success("Ad created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create ad: " + error.message);
    },
  });

  const updateAdMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Ad> }) => {
      const { data: result, error } = await supabase
        .from("ads")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      toast.success("Ad updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update ad: " + error.message);
    },
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ads")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      toast.success("Ad deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete ad: " + error.message);
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-5xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Ilivinn Platform Admin
          </h1>
          <p className="text-xl text-gray-600 font-medium">Unified management, analytics, publishing &amp; workflows</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-8">
              <div className="text-4xl font-black text-primary mb-2">Sprinklr + Coupler.io</div>
              <p className="text-lg text-muted-foreground">Core operational features, advanced analytics, workflow automation</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-2">Key Metrics</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-black text-primary">12.5k</div>
                  <div className="text-sm text-muted-foreground">Total Followers</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-destructive">3.8%</div>
                  <div className="text-sm text-muted-foreground">Avg Engagement</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-green-600">24h</div>
                  <div className="text-sm text-muted-foreground">Response Time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="social" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
            <TabsTrigger value="social" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Social
            </TabsTrigger>
            <TabsTrigger value="inbox" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="assets" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Assets
            </TabsTrigger>
            <TabsTrigger value="competitors" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Competitors
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="promotions" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Promotions
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Ads
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="social" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockSocialPlatforms.map((platform) => (
                <SocialPlatformCard key={platform.id} platform={platform as any} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="inbox">
            <UnifiedInbox />
          </TabsContent>

          <TabsContent value="calendar">
            <ContentCalendar />
          </TabsContent>

          <TabsContent value="assets">
            <AssetLibrary />
          </TabsContent>

          <TabsContent value="competitors">
            <CompetitorBenchmark />
          </TabsContent>

          <TabsContent value="reports">
            <ReportGenerator />
          </TabsContent>

          <TabsContent value="announcements">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Announcements</CardTitle>
                  <CreateAnnouncementDialog onCreate={(data) => createAnnouncementMutation.mutateAsync(data)} />
                </div>
              </CardHeader>
              <CardContent>
                {loadingAnnouncements ? (
                  <div>Loading...</div>
                ) : (
                  <div className="space-y-4">
                    {announcements.map((announcement: Announcement) => (
                      <AnnouncementCard
                        key={announcement.id}
                        announcement={announcement}
                        onUpdate={(data) => updateAnnouncementMutation.mutate({ id: announcement.id, data })}
                        onDelete={() => deleteAnnouncementMutation.mutate(announcement.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="promotions">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Promotions</CardTitle>
                  <CreatePromotionDialog onCreate={(data) => createPromotionMutation.mutateAsync(data)} />
                </div>
              </CardHeader>
              <CardContent>
                {loadingPromotions ? (
                  <div>Loading...</div>
                ) : (
                  <div className="space-y-4">
                    {promotions.map((promotion: Promotion) => (
                      <PromotionCard
                        key={promotion.id}
                        promotion={promotion}
                        onUpdate={(data) => updatePromotionMutation.mutate({ id: promotion.id, data })}
                        onDelete={() => deletePromotionMutation.mutate(promotion.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ads">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Advertisements</CardTitle>
                  <CreateAdDialog onCreate={(data) => createAdMutation.mutateAsync(data)} />
                </div>
              </CardHeader>
              <CardContent>
                {loadingAds ? (
                  <div>Loading...</div>
                ) : (
                  <div className="space-y-4">
                    {ads.map((ad: Ad) => (
                      <AdCard
                        key={ad.id}
                        ad={ad}
                        onUpdate={(data) => updateAdMutation.mutate({ id: ad.id, data })}
                        onDelete={() => deleteAdMutation.mutate(ad.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );

}

// Component definitions
function CreateAnnouncementDialog({ onCreate }: { onCreate: (data: { title: string; content: string; mediaFile?: File | null }) => void | Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreate({ title, content, mediaFile });
    setTitle("");
    setContent("");
    setMediaFile(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Announcement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Announcement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="announcementMedia">Image or Video</Label>
            <Input
              id="announcementMedia"
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button type="submit">Create</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AnnouncementCard({
  announcement,
  onUpdate,
  onDelete
}: {
  announcement: Announcement;
  onUpdate: (data: Partial<Announcement>) => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold">{announcement.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
            {announcement.media_url && (
              announcement.media_type?.startsWith("video/") ? (
                <video src={announcement.media_url} controls className="w-full max-w-sm mt-2 rounded" />
              ) : (
                <img src={announcement.media_url} alt={announcement.title} className="w-full max-w-sm mt-2 rounded object-cover" />
              )
            )}
            <p className="text-xs text-gray-500 mt-2">
              Created: {new Date(announcement.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={announcement.is_active}
              onCheckedChange={(checked) => onUpdate({ is_active: checked })}
            />
            <Button variant="outline" size="sm" asChild>
              <Link to={`/content/announcement/${announcement.id}`}>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Similar components for Promotion and Ad
function CreatePromotionDialog({ onCreate }: { onCreate: (data: { title: string; content: string; discount_percentage?: number; valid_until?: string; mediaFile?: File | null }) => void | Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [discount, setDiscount] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreate({
      title,
      content,
      discount_percentage: discount ? parseInt(discount) : undefined,
      valid_until: validUntil || undefined,
      mediaFile
    });
    setTitle("");
    setContent("");
    setDiscount("");
    setValidUntil("");
    setMediaFile(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Promotion
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Promotion</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="discount">Discount Percentage</Label>
            <Input
              id="discount"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="validUntil">Valid Until</Label>
            <Input
              id="validUntil"
              type="datetime-local"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="promotionMedia">Image or Video</Label>
            <Input
              id="promotionMedia"
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button type="submit">Create</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PromotionCard({
  promotion,
  onUpdate,
  onDelete
}: {
  promotion: Promotion;
  onUpdate: (data: Partial<Promotion>) => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold">{promotion.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{promotion.content}</p>
            {promotion.discount_percentage && (
              <p className="text-sm text-green-600 mt-1">Discount: {promotion.discount_percentage}%</p>
            )}
            {promotion.valid_until && (
              <p className="text-xs text-gray-500 mt-1">
                Valid until: {new Date(promotion.valid_until).toLocaleDateString()}
              </p>
            )}
            {promotion.media_url && (
              promotion.media_type?.startsWith("video/") ? (
                <video src={promotion.media_url} controls className="w-full max-w-sm mt-2 rounded" />
              ) : (
                <img src={promotion.media_url} alt={promotion.title} className="w-full max-w-sm mt-2 rounded object-cover" />
              )
            )}
            <p className="text-xs text-gray-500 mt-2">
              Created: {new Date(promotion.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={promotion.is_active}
              onCheckedChange={(checked) => onUpdate({ is_active: checked })}
            />
            <Button variant="outline" size="sm" asChild>
              <Link to={`/content/promotion/${promotion.id}`}>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateAdDialog({ onCreate }: { onCreate: (data: { title: string; content: string; image_url?: string; link_url?: string; target_audience?: string; mediaFile?: File | null }) => void | Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreate({
      title,
      content,
      image_url: imageUrl || undefined,
      link_url: linkUrl || undefined,
      target_audience: targetAudience || undefined,
      mediaFile
    });
    setTitle("");
    setContent("");
    setImageUrl("");
    setLinkUrl("");
    setTargetAudience("");
    setMediaFile(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Ad
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Advertisement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="linkUrl">Link URL</Label>
            <Input
              id="linkUrl"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="targetAudience">Target Audience</Label>
            <Input
              id="targetAudience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="adMedia">Image or Video</Label>
            <Input
              id="adMedia"
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button type="submit">Create</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AdCard({
  ad,
  onUpdate,
  onDelete
}: {
  ad: Ad;
  onUpdate: (data: Partial<Ad>) => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold">{ad.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{ad.content}</p>
            {ad.image_url && (
              <img src={ad.image_url} alt={ad.title} className="w-32 h-20 object-cover mt-2 rounded" />
            )}
            {ad.link_url && (
              <p className="text-sm text-blue-600 mt-1">Link: {ad.link_url}</p>
            )}
            {ad.target_audience && (
              <p className="text-xs text-gray-500 mt-1">Target: {ad.target_audience}</p>
            )}
            {ad.media_url && (
              ad.media_type?.startsWith("video/") ? (
                <video src={ad.media_url} controls className="w-full max-w-sm mt-2 rounded" />
              ) : (
                <img src={ad.media_url} alt={ad.title} className="w-full max-w-sm mt-2 rounded object-cover" />
              )
            )}
            <p className="text-xs text-gray-500 mt-2">
              Created: {new Date(ad.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={ad.is_active}
              onCheckedChange={(checked) => onUpdate({ is_active: checked })}
            />
            <Button variant="outline" size="sm" asChild>
              <Link to={`/content/ad/${ad.id}`}>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UsersManagement() {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select(`
          *,
          user_roles(role)
        `)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'moderator' | 'user' }) => {
      // First, delete existing role
      await supabase.from("user_roles").delete().eq("user_id", userId);
      // Then insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert([{ user_id: userId, role }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      toast.success("User role updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update user role: " + error.message);
    },
  });

  if (isLoading) return <div>Loading users...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <p className="text-sm text-gray-600">Manage user roles and inspect user accounts</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((userProfile: any) => (
            <UserCard
              key={userProfile.id}
              user={userProfile}
              onRoleChange={(role) => updateRoleMutation.mutate({ userId: userProfile.user_id, role })}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function UserCard({
  user,
  onRoleChange
}: {
  user: any;
  onRoleChange: (role: 'admin' | 'moderator' | 'user') => void;
}) {
  const currentRole = user.user_roles?.[0]?.role || 'user';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.display_name || user.username} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-lg font-semibold text-primary">
                  {(user.display_name || user.username || 'U')[0].toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-semibold">{user.display_name || user.username}</h3>
              <p className="text-sm text-gray-600">{user.bio}</p>
              <p className="text-xs text-gray-500">Joined: {new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={currentRole} onValueChange={onRoleChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
