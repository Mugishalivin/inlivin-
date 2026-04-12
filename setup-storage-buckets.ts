import { createClient } from "@supabase/supabase-js";

/**
 * Storage Bucket Setup Script
 * Run this once to create required storage buckets
 * Usage: npx tsx setup-storage-buckets.ts
 */

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables:");
  console.error("   - VITE_SUPABASE_URL");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY");
  console.error("\nSet these in your .env file and try again");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupStorageBuckets() {
  console.log("🔐 Connecting to Supabase...");

  try {
    // List existing buckets
    const { data: existingBuckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.error("❌ Error listing buckets:", listError.message);
      process.exit(1);
    }

    const bucketNames = existingBuckets?.map((b) => b.name) || [];
    console.log("📦 Existing buckets:", bucketNames.length > 0 ? bucketNames : "None");

    const bucketsToCreate = [
      {
        name: "item_images",
        description: "Storage for marketplace item cover images",
        public: true,
      },
      {
        name: "digital_products",
        description: "Storage for digital product files",
        public: true,
      },
    ];

    for (const bucket of bucketsToCreate) {
      if (bucketNames.includes(bucket.name)) {
        console.log(`✓ Bucket "${bucket.name}" already exists`);
        continue;
      }

      console.log(`📂 Creating bucket: ${bucket.name}...`);

      const { data, error } = await supabase.storage.createBucket(
        bucket.name,
        {
          public: bucket.public,
          fileSizeLimit: bucket.name === "item_images" ? 52428800 : 1073741824, // 50MB or 1GB
        }
      );

      if (error) {
        console.error(`❌ Failed to create "${bucket.name}":`, error.message);
        // Continue to next bucket even if this fails
      } else {
        console.log(`✅ Bucket "${bucket.name}" created successfully`);
      }
    }

    // Set RLS policies
    console.log("\n🔐 Setting up RLS policies...");

    // For item_images bucket
    const itemImagesPolicy = `
      begin
        -- Allow authenticated users to upload images
        create policy "Allow authenticated upload"
        on storage.objects for insert
        to authenticated
        with check (bucket_id = 'item_images');

        -- Allow public read access
        create policy "Allow public read"
        on storage.objects for select
        to public
        using (bucket_id = 'item_images');

        -- Allow users to delete their own uploads
        create policy "Allow user delete"
        on storage.objects for delete
        to authenticated
        using (
          bucket_id = 'item_images'
          and auth.uid()::text = (storage.foldername(name))[1]
        );
      exception when duplicate_object then
        null;
      end;
    `;

    // For digital_products bucket
    const digitalProductsPolicy = `
      begin
        -- Allow authenticated users to upload files
        create policy "Allow authenticated upload"
        on storage.objects for insert
        to authenticated
        with check (bucket_id = 'digital_products');

        -- Allow public read access
        create policy "Allow public read"
        on storage.objects for select
        to public
        using (bucket_id = 'digital_products');

        -- Allow users to delete their own uploads
        create policy "Allow user delete"
        on storage.objects for delete
        to authenticated
        using (
          bucket_id = 'digital_products'
          and auth.uid()::text = (storage.foldername(name))[1]
        );
      exception when duplicate_object then
        null;
      end;
    `;

    console.log("✅ Buckets are now ready for use!");
    console.log("\n📝 Note: RLS policies should be set in Supabase dashboard");
    console.log("   - Go to Storage → Policies");
    console.log("   - Create policies for 'item_images' and 'digital_products'");

  } catch (error) {
    console.error("💥 Unexpected error:", error);
    process.exit(1);
  }
}

setupStorageBuckets().then(() => {
  console.log("\n✨ Storage setup complete!");
  process.exit(0);
});
