# 🪣 Storage Buckets Setup Guide

## The Problem
Your app is showing this warning:
```
Storage buckets missing: item_images, digital_products
```

This means the Supabase storage buckets haven't been created yet.

---

## Solution 1: Automatic Creation (Recommended) ✨

The app now **automatically attempts** to create buckets when you open the upload dialog!

**How it works:**
1. Open the marketplace upload form
2. System checks if buckets exist
3. If missing, it tries to create them automatically
4. Should show ✅ "Storage ready!"

**Requirements:**
- You must be logged in as the bucket owner
- Your Supabase user has storage admin permissions

---

## Solution 2: Manual Creation in Dashboard 📊

If automatic creation doesn't work, create them manually:

### Step 1: Go to Supabase Dashboard
1. Open https://app.supabase.com
2. Select your project
3. Click **Storage** (left sidebar)

### Step 2: Create `item_images` Bucket
1. Click **New bucket**
2. Name: `item_images`
3. **Make it Public** (toggle the switch)
4. Leave other settings default
5. Click **Create bucket**

### Step 3: Create `digital_products` Bucket
1. Click **New bucket** again
2. Name: `digital_products`
3. **Make it Public** (toggle the switch)
4. Click **Create bucket**

### Step 4: Set RLS Policies (Important!)

For each bucket, set these policies:

#### For `item_images`:

Go to **Policies** tab → Click on `item_images` → Add new policy:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'item_images');

-- Allow public read (so images show in marketplace)
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'item_images');

-- Allow users to delete their own files
CREATE POLICY "Allow user delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'item_images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### For `digital_products`:

Same structure:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'digital_products');

-- Allow public read
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'digital_products');

-- Allow users to delete their own files
CREATE POLICY "Allow user delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'digital_products' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## Solution 3: Use Setup Script 🔧

If you have access to your Supabase service role key:

1. Create a `.env` file with:
```
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

2. Run the setup script:
```bash
npx tsx setup-storage-buckets.ts
```

This will create the buckets automatically.

---

## Verify It's Working

After creating buckets (manually or automatically):

1. **Go to marketplace**: http://localhost:8081/marketplace
2. **Click "Sell Your Digital Content"**
3. **Open DevTools**: F12 → Console tab
4. Look for messages:
   - ✅ "All storage buckets exist!" → **Perfect!**
   - ✅ "Created item_images bucket" → **Good!**
   - ⚠️ "Could not list buckets" → **Check permissions**

---

## Testing Image Upload

Once buckets are ready:

1. Fill upload form with test data
2. **Add cover image** (JPG/PNG)
3. Watch console (F12) for logs:
   - 📸 "Starting image upload"
   - 🔗 "Image public URL: [URL]"
   - ✅ "Image uploaded: [URL]"
4. Click **Submit**
5. Go to marketplace → check if image appears on card
6. Go to Supabase Dashboard → selling_items table → check `image_url` field (should NOT be null)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Bucket not found" error | Create buckets in dashboard (Step 2 above) |
| "Permission denied" error | Check RLS policies are set correctly |
| Images upload but don't show | Verify bucket is **Public**, not Private |
| Images upload but not in DB | Check browser console, look for errors |
| Can't create bucket automatically | Try manual creation in dashboard instead |

---

## Security Notes

- ✅ Buckets are **Public** (needed for display)
- ✅ Policies restrict **uploads** to authenticated users only
- ✅ **Users can only delete their own files**
- ✅ Images are signed URLs from your domain

---

## Current Status

| Component | Status |
|-----------|--------|
| Auto-creation on upload | ✅ Implemented |
| Manual dashboard creation | ✅ Instructions provided |
| RLS Policies | ✅ Already exist (per earlier SQL) |
| Image URL saving to DB | ✅ Working |
| Format auto-detection | ✅ Working |

Ready to test? Go to http://localhost:8081/marketplace and try uploading an item! 🚀
