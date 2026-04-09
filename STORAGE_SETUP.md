# Storage Bucket Setup Guide

## Problem
The marketplace image upload requires a Supabase Storage bucket named `item_images`. If this bucket doesn't exist, uploads will fail with "Bucket not found" error.

## Solution: Create Storage Bucket in Supabase Dashboard

### Manual Setup (Recommended)

Follow these steps to create the required storage bucket:

1. **Go to Supabase Dashboard**
   - Open your Supabase project: https://supabase.com/dashboard
   - Navigate to **Storage** in the left sidebar

2. **Create New Bucket**
   - Click the **"Create a new bucket"** button
   - Name it: `item_images`
   - **Enable "Public bucket"** toggle (so images are publicly accessible)
   - Click **Create bucket**

3. **Set Access Policies (Optional but Recommended)**
   
   Go to **Storage > Policies** and add these rules:
   
   **Policy 1: Allow authenticated users to upload**
   ```sql
   CREATE POLICY "Users can upload to their own folder"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'item_images' 
     AND (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

   **Policy 2: Allow public read access**
   ```sql
   CREATE POLICY "Public read access"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'item_images');
   ```

4. **Test the Upload**
   - Go to the Marketplace page
   - Click "Sell Something"
   - Try uploading an image
   - If successful, you'll see the image preview ✓

### Automated Setup with CLI

If you have the Supabase CLI installed:

```bash
npm install -g supabase
supabase storage create-bucket item_images --public
```

### Docker Setup

If running locally with Docker, use this SQL in the Supabase dashboard editor:

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('item_images', 'item_images', true);

-- Set basic policies
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'item_images');

CREATE POLICY "Authenticated upload access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'item_images');

CREATE POLICY "Users can delete own objects"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'item_images' 
  AND owner = auth.uid()
);
```

## Troubleshooting

### Still getting "Bucket not found" error?

1. **Verify the bucket exists:**
   - Go to Storage > Buckets in Supabase dashboard
   - Look for "item_images" in the list
   - Check if "Public" is enabled

2. **Clear browser cache:**
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Try uploading again

3. **Check RLS policies:**
   - Make sure your authenticated user has INSERT permission
   - Verify no policies are blocking uploads

4. **Check bucket name:**
   - Must be exactly `item_images` (lowercase, no spaces)
   - Check for typos

### Can't find Storage section?

- Make sure you're in the right Supabase project
- Your project must have Storage enabled
- If you have free tier, you get 1 GB of storage

## After Setup

Once the bucket is created, the marketplace will work:
- ✅ Users can upload item images
- ✅ Images are publicly displayed
- ✅ Upload form validates images
- ✅ Failed uploads show clear error messages

## File Structure

Uploaded images are organized as:
```
item_images/
├── marketplace/
│   ├── {user_id}/
│   │   ├── 1712681234_abc123.jpg
│   │   ├── 1712681245_def456.png
│   │   └── ...
```

This keeps user uploads organized by seller ID.
