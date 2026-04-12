import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { uploadItemImage, uploadDigitalFile, initializeStorageBuckets } from "@/lib/storage-init";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, X, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Digital product categories
const CATEGORIES = [
  "Audio",
  "Video", 
  "Images",
  "Projects",
];

// License types for digital products
const LICENSE_TYPES = [
  "Personal Use",
  "Commercial Use",
  "Both",
  "Custom License",
];

// File formats
const FILE_FORMATS = [
  "MP3",
  "WAV",
  "FLAC",
  "MP4",
  "MOV",
  "AVI",
  "JPG",
  "PNG",
  "PSD",
  "AI",
  "ZIP",
  "RAR",
  "Other",
];

// Category-based defaults
const CATEGORY_DEFAULTS = {
  "Audio": {
    file_format: "MP3",
    quality: "High",
    duration: "",
    resolution: "",
    software_used: "Logic Pro, Ableton, FL Studio",
    skill_level: "All Levels",
  },
  "Video": {
    file_format: "MP4",
    quality: "High",
    duration: "",
    resolution: "1080p",
    software_used: "Premiere Pro, Final Cut Pro, DaVinci Resolve",
    skill_level: "All Levels",
  },
  "Images": {
    file_format: "JPG",
    quality: "Ultra HD",
    duration: "",
    resolution: "4K",
    software_used: "Photoshop, Lightroom, GIMP",
    skill_level: "All Levels",
  },
  "Projects": {
    file_format: "ZIP",
    quality: "High",
    duration: "",
    resolution: "",
    software_used: "Various",
    skill_level: "Intermediate",
  },
};

// Detect file format from file extension
const detectFileFormat = (filename: string): string => {
  const ext = filename.split(".").pop()?.toUpperCase() || "Other";
  const formatMap: { [key: string]: string } = {
    "MP3": "MP3", "WAV": "WAV", "FLAC": "FLAC", "OGG": "WAV",
    "MP4": "MP4", "MOV": "MOV", "AVI": "AVI", "MKV": "MP4", "WMV": "AVI",
    "JPG": "JPG", "JPEG": "JPG", "PNG": "PNG", "GIF": "PNG", "WEBP": "PNG",
    "PSD": "PSD", "AI": "AI", "EPS": "AI",
    "ZIP": "ZIP", "RAR": "RAR", "7Z": "ZIP",
    "DOCX": "ZIP", "XLSX": "ZIP", "PDF": "ZIP",
  };
  return formatMap[ext] || "Other";
};

const PAYMENT_METHODS = [
  "Credit Card",
  "PayPal",
  "Bank Transfer",
  "Crypto",
  "Apple Pay",
  "Google Pay",
  "Stripe",
];

const VISIBILITY_OPTIONS = ["Public", "Private", "Friends Only"];

interface UploadItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UploadItemDialog({
  open,
  onOpenChange,
  onSuccess,
}: UploadItemDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    // Basic Info
    title: "",
    description: "",
    category: "Audio",
    
    // Pricing
    price: "",
    currency: "USD",

    // Digital Product Fields
    file_url: "",
    file_format: "MP3",
    license_type: "Personal Use",
    tags: "",
    seller_notes: "",
    
    // Distribution
    visibility: "Public",
    accepted_payment_methods: ["Credit Card", "PayPal"],

    // NEW: Extended Fields
    keywords: "",
    version: "1.0",
    language: "English",
    quality: "High",
    duration: "",
    resolution: "",
    software_used: "",
    skill_level: "All Levels",
    usage_rights: "Single License",
    commercial_use: false,
    resale_allowed: false,
    sample_available: false,
    discount_percentage: "0",
    bulk_pricing: false,
    warranty: false,
    support_included: false,
    artist_name: "",
    collaborators: "",
    contact_email: "",
    refund_policy: "30 Days",
    // NEW: Security
    download_password: "",
    allow_comments: true,
    comments_visible_to_all: false,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [digitalFileName, setDigitalFileName] = useState<string>("");
  const [storageAvailable, setStorageAvailable] = useState(true);

  // Check storage buckets when dialog opens
  useEffect(() => {
    if (open) {
      (async () => {
        try {
          console.log("🪣 Checking storage buckets...");
          const available = await initializeStorageBuckets();
          
          setStorageAvailable(available);
          
          if (!available) {
            console.warn("⚠️ Storage buckets not found. You can still upload - files will be saved when buckets are created.");
            toast.warning("📋 To enable image uploads, create 'item_images' and 'digital_products' buckets in Supabase Storage.");
          } else {
            console.log("✅ Storage ready for uploads!");
          }
        } catch (err) {
          console.error("Failed to check storage buckets:", err);
          setStorageAvailable(false);
        }
      })();
    }
  }, [open]);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("You must be logged in to sell items");
      }

      if (!formData.title.trim()) {
        throw new Error("Item title is required");
      }

      if (!formData.price || isNaN(parseFloat(formData.price))) {
        throw new Error("Valid price is required");
      }

      if (formData.accepted_payment_methods.length === 0) {
        throw new Error("Select at least one payment method");
      }

      let imageUrl: string | null = null;
      let fileUrl: string | null = formData.file_url || null;

      // Upload image if provided (optional)
      if (imageFile) {
        try {
          console.log("🖼️ Uploading image:", imageFile.name);
          imageUrl = await uploadItemImage(user.id, imageFile);
          if (imageUrl) {
            console.log("✅ Image uploaded:", imageUrl);
          } else {
            console.warn("⚠️ Image upload returned null - storage bucket may not exist");
            // Continue without image - don't throw error
          }
        } catch (error) {
          console.error("📸 Image upload error:", error);
          // Log but don't throw - let item creation continue
          toast.warning("⚠️ Image upload failed - item will be created without image");
        }
      }

      // Upload digital file if provided
      if (digitalFile) {
        try {
          console.log("📦 Uploading digital file:", digitalFile.name);
          fileUrl = await uploadDigitalFile(user.id, digitalFile);
          if (fileUrl) {
            console.log("✅ File uploaded:", fileUrl);
          } else {
            console.warn("⚠️ File URL is null");
          }
        } catch (error) {
          console.error("📦 File upload error:", error);
          // Keep the manual URL if provided, don't throw
          fileUrl = formData.file_url || null;
        }
      }

      // Create item record with digital product fields
      const { error, data } = await (supabase as any)
        .from("selling_items")
        .insert({
          seller_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          price: parseFloat(formData.price),
          currency: formData.currency,
          image_url: imageUrl,
          is_available: true,
          // Digital Product Fields
          file_url: fileUrl,
          file_format: formData.file_format,
          license_type: formData.license_type,
          tags: formData.tags || null,
          seller_notes: formData.seller_notes || null,
          visibility: formData.visibility,
          accepted_payment_methods: formData.accepted_payment_methods,
          // Extended metadata (stored as-is)
          ...(formData.artist_name && { artist_name: formData.artist_name }),
          ...(formData.version && { version: formData.version }),
          ...(formData.language && { language: formData.language }),
          ...(formData.quality && { quality: formData.quality }),
          ...(formData.duration && { duration: formData.duration }),
          ...(formData.resolution && { resolution: formData.resolution }),
          ...(formData.software_used && { software_used: formData.software_used }),
          ...(formData.skill_level && { skill_level: formData.skill_level }),
          ...(formData.keywords && { keywords: formData.keywords }),
          ...(formData.usage_rights && { usage_rights: formData.usage_rights }),
          ...(formData.commercial_use && { commercial_use: formData.commercial_use }),
          ...(formData.resale_allowed && { resale_allowed: formData.resale_allowed }),
          ...(formData.sample_available && { sample_available: formData.sample_available }),
          ...(formData.discount_percentage !== "0" && { discount_percentage: parseFloat(formData.discount_percentage) }),
          ...(formData.refund_policy && { refund_policy: formData.refund_policy }),
          ...(formData.support_included && { support_included: formData.support_included }),
          ...(formData.warranty && { warranty: formData.warranty }),
          ...(formData.bulk_pricing && { bulk_pricing: formData.bulk_pricing }),
          ...(formData.contact_email && { contact_email: formData.contact_email }),
          ...(formData.collaborators && { collaborators: formData.collaborators }),
          // NEW: Security & Comments
          ...(formData.download_password && { download_password: formData.download_password }),
          allow_comments: formData.allow_comments,
          comments_visible_to_all: formData.comments_visible_to_all,
          likes_count: 0,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create listing: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      toast.success("✓ Item listed successfully!");
      // Refetch marketplace and user profile selling items
      queryClient.invalidateQueries({ queryKey: ["marketplace-items"] });
      queryClient.invalidateQueries({ queryKey: ["user-selling"] });
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      // If bucket not found, still create the item but warn user
      if (error.message.includes("Bucket") || error.message.includes("bucket")) {
        console.warn("⚠️ Storage bucket issue - item created but without image/file URLs");
        toast.warning("⚠️ Item created, but image/file upload failed. Create buckets in Supabase to enable file storage.");
        // Still refetch and close
        queryClient.invalidateQueries({ queryKey: ["marketplace-items"] });
        queryClient.invalidateQueries({ queryKey: ["user-selling"] });
        resetForm();
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(error.message);
      }
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "Audio",
      price: "",
      currency: "USD",
      file_url: "",
      file_format: "MP3",
      license_type: "Personal Use",
      tags: "",
      seller_notes: "",
      visibility: "Public",
      accepted_payment_methods: ["Credit Card", "PayPal"],
      keywords: "",
      version: "1.0",
      language: "English",
      quality: "High",
      duration: "",
      resolution: "",
      software_used: "",
      skill_level: "All Levels",
      usage_rights: "Single License",
      commercial_use: false,
      resale_allowed: false,
      sample_available: false,
      discount_percentage: "0",
      bulk_pricing: false,
      warranty: false,
      support_included: false,
      artist_name: "",
      collaborators: "",
      contact_email: "",
      refund_policy: "30 Days",
      download_password: "",
      allow_comments: true,
      comments_visible_to_all: false,
    });
    setImageFile(null);
    setImagePreview("");
    setDigitalFile(null);
    setDigitalFileName("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Auto-populate fields when category changes
    if (name === "category" && CATEGORY_DEFAULTS[value as keyof typeof CATEGORY_DEFAULTS]) {
      const defaults = CATEGORY_DEFAULTS[value as keyof typeof CATEGORY_DEFAULTS];
      setFormData((prev) => ({
        ...prev,
        category: value,
        file_format: defaults.file_format,
        quality: defaults.quality,
        software_used: defaults.software_used,
        skill_level: defaults.skill_level,
      }));
    }
  };

  const handlePaymentMethodChange = (method: string) => {
    setFormData((prev) => {
      const methods = prev.accepted_payment_methods.includes(method)
        ? prev.accepted_payment_methods.filter((m) => m !== method)
        : [...prev.accepted_payment_methods, method];
      return { ...prev, accepted_payment_methods: methods };
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDigitalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDigitalFile(file);
      setDigitalFileName(file.name);
      
      // Auto-detect and set file format
      const detectedFormat = detectFileFormat(file.name);
      setFormData((prev) => ({ ...prev, file_format: detectedFormat }));
      
      toast.success(`✓ File selected: ${file.name} (Format: ${detectedFormat})`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0 gap-0 w-[95vw]">
        {/* Header with close button */}
        <div className="sticky top-0 z-10 bg-background border-b border-border/50 px-6 py-4 flex items-center justify-between">
          <DialogTitle className="text-lg font-bold">Sell Your Digital Content</DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* File Upload Section - Instagram Style */}
          <div className="space-y-3">
            {/* Digital File Upload */}
            {!digitalFileName ? (
              <label className="block cursor-pointer group">
                <input
                  type="file"
                  onChange={handleDigitalFileChange}
                  className="hidden"
                  accept="*/*"
                />
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-xl p-12 text-center transition-all bg-primary/5 hover:bg-primary/10"
                >
                  <Upload size={48} className="mx-auto mb-3 text-primary/60 group-hover:text-primary transition-colors" />
                  <p className="text-lg font-bold text-foreground mb-1">Choose your digital file</p>
                  <p className="text-sm text-muted-foreground">Audio, Video, Images, Projects, ZIP, PSDs...</p>
                  <p className="text-xs text-muted-foreground mt-2">or drag and drop</p>
                </motion.div>
              </label>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                      <Upload size={24} className="text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold truncate text-sm">{digitalFileName}</p>
                      <p className="text-xs text-muted-foreground">File selected</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setDigitalFile(null);
                      setDigitalFileName("");
                    }}
                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                  >
                    <X size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Cover Image - Optional */}
            {!imagePreview ? (
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className="border border-border/50 hover:border-primary/40 rounded-xl p-4 text-center transition-all hover:bg-muted/50">
                  <div className="flex items-center justify-center gap-2">
                    <Upload size={18} className="text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Add cover image (optional)</span>
                  </div>
                </div>
              </label>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative rounded-xl overflow-hidden border border-primary/20 h-40 group"
              >
                <img src={imagePreview} alt="Cover" className="w-full h-full object-cover" />
                <button
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview("");
                  }}
                  className="absolute top-2 right-2 p-2 bg-black/40 hover:bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X size={16} className="text-white" />
                </button>
              </motion.div>
            )}
          </div>

          {/* Product Details Section */}
          <div className="space-y-4 pt-4 border-t border-border/50">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-bold block">Title *</label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Make it catchy and clear..."
                className="bg-muted/50 border-border/50 h-11 text-sm font-medium"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-bold block">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tell buyers what they're getting..."
                className="w-full px-3 py-2.5 rounded-lg border border-border/50 bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                rows={3}
              />
            </div>

            {/* Category & Price in 2 columns */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-bold block">Category *</label>
                <Select value={formData.category} onValueChange={(val) => handleSelectChange("category", val)}>
                  <SelectTrigger className="bg-muted/50 border-border/50 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold block">Price *</label>
                <div className="flex gap-2">
                  <Input
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    className="bg-muted/50 border-border/50 h-11 text-sm flex-1"
                  />
                  <Select value={formData.currency} onValueChange={(val) => handleSelectChange("currency", val)}>
                    <SelectTrigger className="bg-muted/50 border-border/50 h-11 w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["USD", "EUR", "GBP"].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* License & Format */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-bold block">License</label>
                <Select value={formData.license_type} onValueChange={(val) => handleSelectChange("license_type", val)}>
                  <SelectTrigger className="bg-muted/50 border-border/50 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LICENSE_TYPES.map((lic) => (
                      <SelectItem key={lic} value={lic}>{lic}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold block">Format</label>
                <Select value={formData.file_format} onValueChange={(val) => handleSelectChange("file_format", val)}>
                  <SelectTrigger className="bg-muted/50 border-border/50 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILE_FORMATS.map((fmt) => (
                      <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-bold block">Tags</label>
              <Input
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="e.g., lofi, ambient, royalty-free"
                className="bg-muted/50 border-border/50 h-11 text-sm"
              />
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              <label className="text-sm font-bold block">Accept payments via *</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <label key={method} className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                    <Checkbox
                      checked={formData.accepted_payment_methods.includes(method)}
                      onCheckedChange={() => handlePaymentMethodChange(method)}
                    />
                    <span className="text-sm font-medium">{method}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div className="space-y-2">
              <label className="text-sm font-bold block">Visibility</label>
              <Select value={formData.visibility} onValueChange={(val) => handleSelectChange("visibility", val)}>
                <SelectTrigger className="bg-muted/50 border-border/50 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seller Notes */}
            <div className="space-y-2">
              <label className="text-sm font-bold block">Seller notes</label>
              <textarea
                name="seller_notes"
                value={formData.seller_notes}
                onChange={handleInputChange}
                placeholder="Installation tips, usage rights, support info..."
                className="w-full px-3 py-2.5 rounded-lg border border-border/50 bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                rows={2}
              />
            </div>

            {/* ADVANCED OPTIONS - Expandable Section */}
            <details className="group pt-4 border-t border-border/50">
              <summary className="cursor-pointer text-sm font-bold text-foreground hover:text-primary transition-colors flex items-center gap-2">
                <span className="group-open:rotate-90 transition-transform">▶</span>
                Advanced Options (Optional)
              </summary>

              <div className="space-y-4 mt-4 pt-4 border-t border-border/50/30">
                {/* Artist & Collaborators */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-bold block">Artist Name</label>
                    <Input
                      name="artist_name"
                      value={formData.artist_name}
                      onChange={handleInputChange}
                      placeholder="Your name or artist alias"
                      className="bg-muted/50 border-border/50 h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold block">Version</label>
                    <Input
                      name="version"
                      value={formData.version}
                      onChange={handleInputChange}
                      placeholder="e.g., 1.0, 2.1"
                      className="bg-muted/50 border-border/50 h-10 text-sm"
                    />
                  </div>
                </div>

                {/* Language & Quality */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-bold block">Language</label>
                    <Select value={formData.language} onValueChange={(val) => handleSelectChange("language", val)}>
                      <SelectTrigger className="bg-muted/50 border-border/50 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["English", "Spanish", "French", "German", "Chinese", "Japanese", "Multiple"].map((lang) => (
                          <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold block">Quality</label>
                    <Select value={formData.quality} onValueChange={(val) => handleSelectChange("quality", val)}>
                      <SelectTrigger className="bg-muted/50 border-border/50 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Low", "Medium", "High", "Ultra HD", "Lossless"].map((q) => (
                          <SelectItem key={q} value={q}>{q}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Duration & Resolution */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-bold block">Duration</label>
                    <Input
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      placeholder="e.g., 3:45 or 120 min"
                      className="bg-muted/50 border-border/50 h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold block">Resolution</label>
                    <Input
                      name="resolution"
                      value={formData.resolution}
                      onChange={handleInputChange}
                      placeholder="e.g., 4K, 1080p, 300dpi"
                      className="bg-muted/50 border-border/50 h-10 text-sm"
                    />
                  </div>
                </div>

                {/* Software & Skill Level */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-bold block">Software Used</label>
                    <Input
                      name="software_used"
                      value={formData.software_used}
                      onChange={handleInputChange}
                      placeholder="e.g., Photoshop, Blender, Logic Pro"
                      className="bg-muted/50 border-border/50 h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold block">Skill Level</label>
                    <Select value={formData.skill_level} onValueChange={(val) => handleSelectChange("skill_level", val)}>
                      <SelectTrigger className="bg-muted/50 border-border/50 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Beginner", "Intermediate", "Advanced", "All Levels"].map((level) => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Keywords & Usage Rights */}
                <div className="space-y-2">
                  <label className="text-sm font-bold block">Keywords (SEO)</label>
                  <Input
                    name="keywords"
                    value={formData.keywords}
                    onChange={handleInputChange}
                    placeholder="Comma-separated keywords for discovery"
                    className="bg-muted/50 border-border/50 h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold block">Usage Rights</label>
                  <Select value={formData.usage_rights} onValueChange={(val) => handleSelectChange("usage_rights", val)}>
                    <SelectTrigger className="bg-muted/50 border-border/50 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Single License", "Multiple License", "Site License", "Corporate License", "Unlimited"].map((right) => (
                        <SelectItem key={right} value={right}>{right}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rights & Pricing Options */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleSelectChange("commercial_use", !formData.commercial_use)}>
                    <Checkbox
                      checked={formData.commercial_use}
                      onCheckedChange={(checked) => handleSelectChange("commercial_use", checked)}
                      className="cursor-pointer"
                    />
                    <label className="text-sm font-medium cursor-pointer flex-1">Allow commercial use</label>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleSelectChange("resale_allowed", !formData.resale_allowed)}>
                    <Checkbox
                      checked={formData.resale_allowed}
                      onCheckedChange={(checked) => handleSelectChange("resale_allowed", checked)}
                      className="cursor-pointer"
                    />
                    <label className="text-sm font-medium cursor-pointer flex-1">Allow resale</label>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleSelectChange("sample_available", !formData.sample_available)}>
                    <Checkbox
                      checked={formData.sample_available}
                      onCheckedChange={(checked) => handleSelectChange("sample_available", checked)}
                      className="cursor-pointer"
                    />
                    <label className="text-sm font-medium cursor-pointer flex-1">Free sample available</label>
                  </div>
                </div>

                {/* Pricing & Support Options */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-bold block">Discount %</label>
                    <Input
                      name="discount_percentage"
                      type="number"
                      value={formData.discount_percentage}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      placeholder="0"
                      className="bg-muted/50 border-border/50 h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold block">Refund Policy</label>
                    <Select value={formData.refund_policy} onValueChange={(val) => handleSelectChange("refund_policy", val)}>
                      <SelectTrigger className="bg-muted/50 border-border/50 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["7 Days", "14 Days", "30 Days", "No Refund", "Custom"].map((policy) => (
                          <SelectItem key={policy} value={policy}>{policy}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Support Checkboxes */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleSelectChange("support_included", !formData.support_included)}>
                    <Checkbox
                      checked={formData.support_included}
                      onCheckedChange={(checked) => handleSelectChange("support_included", checked)}
                      className="cursor-pointer"
                    />
                    <label className="text-sm font-medium cursor-pointer flex-1">Include customer support</label>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleSelectChange("warranty", !formData.warranty)}>
                    <Checkbox
                      checked={formData.warranty}
                      onCheckedChange={(checked) => handleSelectChange("warranty", checked)}
                      className="cursor-pointer"
                    />
                    <label className="text-sm font-medium cursor-pointer flex-1">Include warranty</label>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleSelectChange("bulk_pricing", !formData.bulk_pricing)}>
                    <Checkbox
                      checked={formData.bulk_pricing}
                      onCheckedChange={(checked) => handleSelectChange("bulk_pricing", checked)}
                      className="cursor-pointer"
                    />
                    <label className="text-sm font-medium cursor-pointer flex-1">Bulk pricing available</label>
                  </div>
                </div>

                {/* Contact & Collaborators */}
                <div className="space-y-2">
                  <label className="text-sm font-bold block">Contact Email</label>
                  <Input
                    name="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                    placeholder="Support email for buyers"
                    className="bg-muted/50 border-border/50 h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold block">Collaborators</label>
                  <Input
                    name="collaborators"
                    value={formData.collaborators}
                    onChange={handleInputChange}
                    placeholder="Credits, co-creators (comma-separated)"
                    className="bg-muted/50 border-border/50 h-10 text-sm"
                  />
                </div>

                {/* Security & Engagement */}
                <div className="pt-4 border-t border-border/50/30 space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-bold block">🔒 Download Password (Optional)</label>
                    <Input
                      name="download_password"
                      type="password"
                      value={formData.download_password}
                      onChange={handleInputChange}
                      placeholder="Set password for buyers to enter when downloading"
                      className="bg-muted/50 border-border/50 h-10 text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Buyers will need this password to download your content</p>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleSelectChange("allow_comments", !formData.allow_comments)}>
                    <Checkbox
                      checked={formData.allow_comments}
                      onCheckedChange={(checked) => handleSelectChange("allow_comments", checked)}
                      className="cursor-pointer"
                    />
                    <label className="text-sm font-medium cursor-pointer flex-1">Allow buyer comments & reviews</label>
                  </div>

                  {formData.allow_comments && (
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer ml-4"
                      onClick={() => handleSelectChange("comments_visible_to_all", !formData.comments_visible_to_all)}>
                      <Checkbox
                        checked={formData.comments_visible_to_all}
                        onCheckedChange={(checked) => handleSelectChange("comments_visible_to_all", checked)}
                        className="cursor-pointer"
                      />
                      <label className="text-sm font-medium cursor-pointer flex-1">Show comments to all users</label>
                    </div>
                  )}
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* Action Buttons - Sticky Bottom */}
        <div className="sticky bottom-0 bg-background border-t border-border/50 px-6 py-3 flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            className="flex-1 h-11 font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={
              uploadMutation.isPending ||
              !formData.title.trim() ||
              !formData.price ||
              formData.accepted_payment_methods.length === 0
            }
            className="flex-1 h-11 font-semibold gap-2"
          >
            {uploadMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Check size={18} />
                Publish
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
