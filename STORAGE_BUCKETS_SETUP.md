# Storage Buckets Setup for Digital Marketplace

To enable file uploads for digital products, you need to create two storage buckets in Supabase.

## Required Buckets

### 1. `item_images` - For Product Thumbnails
- **Purpose:** Store product cover images/thumbnails
- **Visibility:** Public
- **Max file size:** 5MB (checked in app)
- **Allowed types:** Images (PNG, JPG, WebP)

### 2. `digital_products` - For Actual Digital Files
- **Purpose:** Store the actual digital product files
- **Visibility:** Public (for direct downloads)
- **File types:** Any (MP3, MP4, ZIP, PSD, etc.)
- **Max file size:** No limit (or set to your preference)

## Setup Steps

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Storage** in the left sidebar
4. Click **Create new bucket**
5. Create bucket named: `item_images`
   - Set to **Public** (toggle the visibility switch)
   - Click **Create bucket**
6. Repeat step 4-5 for `digital_products` bucket

## Bucket Policies

### For `item_images` bucket:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload item images" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'item_images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public viewing
CREATE POLICY "Item images are publicly readable" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'item_images');
```

### For `digital_products` bucket:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload digital products" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'digital_products' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public download
CREATE POLICY "Digital products are publicly readable" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'digital_products');
```

## Testing

After creating the buckets:
1. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Open the "Sell Your Digital Content" dialog
3. You should see:
   - File upload option in the "File Details" tab
   - No warning messages about missing storage

## Troubleshooting

### "Storage bucket not found" error
- Check that both buckets exist and are set to Public
- Hard refresh the browser to clear cache
- Check Supabase console for any permission issues

### Files uploading to wrong bucket
- Verify `item_images` for thumbnails (images only)
- Verify `digital_products` for actual files (any format)

### RLS Policy Issues
- If uploads fail, check the bucket's RLS policies
- Ensure your user ID matches the folder path: `{userId}/{filename}`
