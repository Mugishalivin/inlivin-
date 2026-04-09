import { supabase } from "@/integrations/supabase/client";

/**
 * Upload item image to storage
 * Note: The bucket must exist in Supabase (item_images)
 * If bucket doesn't exist, images will fail to upload
 */
export async function uploadItemImage(
  userId: string,
  file: File
): Promise<string | null> {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `marketplace/${userId}/${fileName}`;

    // Upload file to storage bucket
    const { error: uploadError, data } = await supabase.storage
      .from("item_images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      // Better error messages
      if (uploadError.message.includes("Bucket not found")) {
        throw new Error(
          "Storage bucket is not configured. Please contact support or try again later."
        );
      }
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from("item_images")
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error("Failed to generate image URL");
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error("Error uploading item image:", error);
    throw error;
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
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload file to storage bucket
    const { error: uploadError, data } = await supabase.storage
      .from("digital_products")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      if (uploadError.message.includes("Bucket not found")) {
        throw new Error(
          "Digital products storage not configured. Contact support."
        );
      }
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from("digital_products")
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error("Failed to generate file URL");
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error("Error uploading digital file:", error);
    throw error;
  }
}

/**
 * Initialize storage bucket (checks if it exists)
 * This is informational only - bucket must be created in Supabase dashboard
 */
export async function initializeStorageBuckets() {
  try {
    // Try to list buckets to check access
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.warn("Could not verify storage buckets:", error.message);
      return false;
    }

    const hasItemBucket = buckets?.some(b => b.name === "item_images");
    const hasDigitalBucket = buckets?.some(b => b.name === "digital_products");

    if (hasItemBucket && hasDigitalBucket) {
      console.log("✓ Storage buckets available: item_images, digital_products");
      return true;
    } else {
      const missing = [];
      if (!hasItemBucket) missing.push("item_images");
      if (!hasDigitalBucket) missing.push("digital_products");
      console.warn(
        `⚠ Storage buckets missing: ${missing.join(", ")}. Please create them in Supabase dashboard.`
      );
      return false;
    }
  } catch (error) {
    console.error("Error checking storage buckets:", error);
    return false;
  }
}
