import { supabase } from "@/integrations/supabase/client";

/**
 * Note: Bucket creation requires Supabase admin access
 * This cannot be done from the browser client
 * Users must create buckets manually in Supabase dashboard
 */

/**
 * Upload item image to storage (same way as events)
 * Uses the "project-files" bucket that already exists
 */
export async function uploadItemImage(
  userId: string,
  file: File
): Promise<string | null> {
  try {
    console.log("📸 Starting image upload:", file.name);
    
    if (file.size > 50 * 1024 * 1024) {
      throw new Error("File size exceeds 50MB limit");
    }

    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `marketplace/${userId}/${Date.now()}.${fileExt}`;

    console.log("📁 Upload path:", path);

    // Upload to project-files bucket (same as events use)
    const { error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "application/octet-stream",
      });

    if (uploadError) {
      console.error("❌ Upload error:", uploadError.message);
      return null;
    }

    console.log("✅ File uploaded successfully");

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from("project-files")
      .getPublicUrl(path);

    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) {
      throw new Error("Failed to generate image URL");
    }

    console.log("🔗 Image public URL:", publicUrl);
    return publicUrl;
  } catch (error) {
    console.error("📸 Image upload error:", error instanceof Error ? error.message : error);
    return null;
  }

}

/**
 * Upload digital product file to storage
 * Note: The bucket must exist in Supabase (digital_products)
 */
export async function uploadDigitalFile(
  userId: string,
  file: File
): Promise<string | null> {
  try {
    console.log("📦 Starting digital file upload:", file.name);
    
    if (file.size > 1024 * 1024 * 1024) {
      throw new Error("File size exceeds 1GB limit");
    }

    const fileExt = file.name.split(".").pop()?.toLowerCase() || "zip";
    const path = `digital-products/${userId}/${Date.now()}_${file.name}`;

    console.log("📁 Upload path:", path);

    // Upload to project-files bucket (same as events)
    const { error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "application/octet-stream",
      });

    if (uploadError) {
      console.error("❌ Digital file upload error:", uploadError.message);
      return null;
    }

    console.log("✅ Digital file uploaded successfully");

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from("project-files")
      .getPublicUrl(path);

    if (!urlData?.publicUrl) {
      throw new Error("Failed to generate file URL");
    }

    console.log("🔗 File URL:", urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error("📦 Digital file upload error:", error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Initialize storage bucket (checks if it exists)
 * Uses "project-files" bucket that already exists (same as events)
 */
export async function initializeStorageBuckets() {
  try {
    // Try to list buckets to check access
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.warn("⚠ Could not verify storage buckets:", error.message);
      return false;
    }

    const hasProjectFilesBucket = buckets?.some(b => b.name === "project-files");

    if (hasProjectFilesBucket) {
      console.log("%c✓ Storage ready! Using project-files bucket", "color: #22C55E; font-weight: bold");
      return true;
    } else {
      console.warn("%c⚠ project-files bucket not found", "color: #FF9500; font-size: 13px; font-weight: bold");
      return false;
    }
  } catch (error) {
    console.error("💥 Error checking buckets:", error);
    return false;
  }

}
