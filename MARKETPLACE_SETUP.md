# Marketplace Setup Guide

## Quick Start

The ilivin marketplace is fully functional! To enable image uploads, you need to set up one storage bucket in Supabase.

## Required Setup: Storage Bucket

### Step 1: Create Storage Bucket

1. Open your **Supabase Dashboard** → Storage
2. Click **Create a new bucket**
3. Name it: `item_images` (exactly, lowercase)
4. **Enable "Public bucket"** toggle
5. Click **Create bucket**

### Step 2: Set Up Storage Policies (Optional)

For better security, add these RLS policies in Storage → Policies:

```sql
-- Allow public to read
CREATE POLICY "Public read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'item_images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'item_images');

-- Allow users to delete their own uploads
CREATE POLICY "User delete own"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'item_images' AND owner = auth.uid());
```

### Step 3: Test

1. Start your app
2. Login and go to Marketplace
3. Click "Sell Something"
4. Try uploading an image ✓

## Features

### For Buyers
- 🔍 **Search** items by title/description
- 🏷️ **Filter** by category
- ↕️ **Sort** by latest, price, or popularity
- ❤️ **Like** favorite items
- 💬 **Contact** sellers directly
- 👤 **View** seller profiles

### For Sellers
- 📤 **Upload** item images
- 📝 **Add** descriptions, category, price
- 💰 **Set** currency (USD/EUR/GBP)
- 📦 **Manage** stock count
- 📊 **Track** item views and likes

## Database Tables

```
selling_items (marketplace products)
├── id, seller_id, title, description
├── category, price, currency
├── image_url, stock_count
└── likes_count, created_at

item_likes (user favorites)
├── id, item_id, user_id
└── created_at (unique per item/user)

posts (user content)
├── id, creator_id, content, title
├── is_public, likes_count, created_at
└── ...

Events (from main platform)
├── cover_url, event_type, location
└── ...
```

## Routes

| Route | Purpose |
|-------|---------|
| `/marketplace` | Browse all items |
| `/marketplace/:itemId` | View item details |
| `/selling/:itemId` | Alias (from user profile) |

## Troubleshooting

### "Bucket not found" Error
- ❌ Bucket doesn't exist or has wrong name
- ✅ Solution: Create `item_images` bucket in Supabase

### "Can't upload image"
- Check bucket is **Public**
- Verify RLS policies allow authenticated users
- Try with a different image file
- Clear browser cache (Ctrl+Shift+R)

### Images not displaying
- Check image URL in database
- Verify bucket signature/permissions
- Try accessing image URL directly in browser

## File Structure

Uploaded images are stored as:
```
item_images/marketplace/{user_id}/{timestamp}_{random}.{ext}
```

Example:
```
item_images/marketplace/
  550e8400-e29b-41d4-a716-446655440000/
    1712681234_abc123.jpg
    1712681245_def456.png
```

## Next Steps

### Coming Soon (Optional)
- [ ] Shopping cart & checkout
- [ ] Seller ratings & reviews
- [ ] Advanced search filters
- [ ] Wishlist functionality
- [ ] Payment processing
- [ ] Order tracking
- [ ] Shipping integration

## Support

For issues:
1. Check STORAGE_SETUP.md
2. Verify bucket configuration in Supabase dashboard
3. Review browser console for errors
4. Check database RLS policies

## API Reference

### Upload Item Image
```typescript
import { uploadItemImage } from "@/lib/storage-init";

const imageUrl = await uploadItemImage(userId, file);
```

### Initialize Storage
```typescript
import { initializeStorageBuckets } from "@/lib/storage-init";

const available = await initializeStorageBuckets();
```

## Security Notes

- ✅ Files stored with user folder isolation
- ✅ RLS policies control access
- ✅ Image validation on frontend
- ✅ Authenticated uploads only
- ✅ MIME type restrictions

## Performance

- Images compressed to ~5MB max
- CDN delivery via Supabase
- Lazy loading in marketplace grid
- Optimized thumbnails

---

For detailed setup instructions, see **STORAGE_SETUP.md**
