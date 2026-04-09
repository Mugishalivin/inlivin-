# 🛍️ Marketplace Storage Setup - Quick Reference

## What's the error?
```
❌ Upload failed: Bucket not found
```

## What do I do?

### In 3 Steps:

**Step 1:** Open Supabase Dashboard
- Go to https://supabase.com/dashboard
- Select your project (ilivin)

**Step 2:** Create Storage Bucket
- Click **Storage** in left menu
- Click **Create new bucket**
- Type: `item_images` (exactly this)
- Toggle **Public bucket** ON
- Click **Create bucket**

**Step 3:** Done! 
- Go back to marketplace
- Hard refresh browser (Ctrl+Shift+R)
- Try uploading again ✓

---

## Visual Guide

**Supabase Dashboard > Storage:**
```
┌─ Storage
│  ├─ Buckets
│  │  ├─ [Create new bucket] ← Click here
│  │  ├─ profile_pictures
│  │  ├─ event_images
│  │  └─ [item_images] ← Create this
│  └─ Policies
```

**Storage Setup Form:**
```
Bucket name: item_images
Allowed MIME: (default)
🔵 Public bucket (toggle ON)
[Create bucket]
```

---

## If Still Not Working

1. **Verify bucket exists**
   - Storage > Buckets
   - Should see `item_images` in list
   - Should have "Public" badge

2. **Clear cache**
   - Ctrl+Shift+R (hard refresh)
   - Or in DevTools: Settings > Clear site data

3. **Check permissions**
   - Make sure you're logged in as authenticated user
   - Marketplace requires authentication

4. **Check file size**
   - Image files should be < 5MB
   - Try reducing image size

---

## Still Stuck?

See detailed docs:
- **STORAGE_SETUP.md** - Full setup guide
- **MARKETPLACE_SETUP.md** - Feature overview

Console will show error details:
1. Open DevTools (F12)
2. Go to Console tab
3. Look for storage/upload errors
4. Share screenshot in support

---

## Image Upload Test Checklist

- [ ] Created `item_images` bucket
- [ ] Bucket is set to **Public**
- [ ] Logged in to app
- [ ] Went to /marketplace page
- [ ] Clicked "Sell Something"
- [ ] No error warning at top
- [ ] Selected image file
- [ ] Clicked "List Item"
- [ ] Wait for upload...
- [ ] ✓ Success!

---

## Details

| Setting | Value |
|---------|-------|
| Bucket Name | `item_images` |
| Public | ✓ Yes |
| Upload Path | `marketplace/{user_id}/{timestamp}_{random}.ext` |
| Max File Size | 5 MB |
| Image Types | JPG, PNG, WebP, GIF |

---

**Marketplace requires this bucket to work!**

Create it once, and it works forever.
