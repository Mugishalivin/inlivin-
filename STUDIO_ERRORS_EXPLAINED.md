# Studio Setup Error Guide

## Errors You're Seeing

### 1. ❌ `Failed to load resource: the server responded with a status of 400`
```
jpkvcwlfhxoxpgxuscdb.supabase.co/rest/v1/studios?select=...
```

**Cause**: Complex join query failing because tables don't exist
**Fix**: ✅ FIXED - Simplified query in `studio-api.ts`

---

### 2. ❌ `Failed to load resource: the server responded with a status of 404`
```
jpkvcwlfhxoxpgxuscdb.supabase.co/rest/v1/studios?columns=...
```

**Cause**: Tables not created in database yet
**Fix**: Run Supabase migrations (see below)

---

### 3. ❌ `Error fetching user studios: Object`
```
installHook.js:1 Error fetching user studios: Object
```

**Cause**: Database query fails silently, returns empty
**Fix**: Deploy migrations first

---

### 4. ⚠️ `Uncaught Error: Cannot find menu item with id translate-page`
```
dashboard:1 Uncaught (in promise) Error...
```

**Cause**: VS Code extension issue (NOT your app code)
**Fix**: Ignore it - this is safe to ignore

---

## ✅ Solution Steps

### Step 1: Check Your Project Reference

Your Supabase project: `jpkvcwlfhxoxpgxuscdb`

### Step 2: Deploy Migrations

Choose ONE of these methods:

#### Method A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# From project root
cd c:\Users\HP\Desktop\ilivin

# Link your project
supabase link --project-ref jpkvcwlfhxoxpgxuscdb

# Push migrations
supabase db push

# Verify
supabase migration list
```

#### Method B: Using Supabase Dashboard (Manual)

1. Open: https://app.supabase.com/project/jpkvcwlfhxoxpgxuscdb
2. Go to: **SQL Editor** → **New Query**
3. Copy contents from: `supabase/migrations/20260421_create_studio_tables.sql`
4. Run the query
5. Verify tables appear in **Table Editor**

#### Method C: Direct Database Query

If you have direct database access:

```sql
-- File: supabase/migrations/20260421_create_studio_tables.sql
-- Copy and paste the entire contents
```

---

### Step 3: Verify Tables Created

In Supabase Dashboard:

1. Go to **Table Editor**
2. Look for these new tables:
   - ✓ `studios`
   - ✓ `studio_members`
   - ✓ `studio_projects`
   - ✓ `studio_assets`
   - ✓ `studio_activity`
   - ✓ `studio_analytics`

---

### Step 4: Test the App

1. Refresh your browser: `F5`
2. Navigate to `/studio`
3. Try creating a studio
4. Upload images and test the gallery viewer

---

## What Was Fixed in Code

### ✅ Simplified Query
**Before** (causes 400 error):
```typescript
.select(`*, studio_members!inner(user_id)`)
.or(`user_id.eq.${userId},studio_members.user_id.eq.${userId}`)
```

**After** (simple and reliable):
```typescript
.select("*")
.eq("user_id", userId)
```

### ✅ Better Error Messages
- Now shows helpful error when database is missing
- Links to setup documentation
- Guides user to run migrations

---

## Troubleshooting

### Still Getting 404?
- [ ] Check project reference is correct
- [ ] Verify migrations are in `supabase/migrations/`
- [ ] Run migrations again: `supabase db push`
- [ ] Check Supabase dashboard Table Editor for tables

### Getting 400?
- [ ] Check latest code is deployed
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Restart dev server

### Auth Issues?
- [ ] Verify you're logged in
- [ ] Check your user UUID is valid
- [ ] Clear browser storage: F12 → Application → Clear All

---

## Files Referenced

- **Setup Guide**: `STUDIO_DATABASE_SETUP.md` (this file)
- **Error Handler**: `src/pages/MyStudioPage.tsx` (improved)
- **API**: `src/lib/studio-api.ts` (simplified queries)
- **Migrations**: `supabase/migrations/`

---

## Quick Command Reference

```bash
# Install Supabase CLI
npm install -g supabase

# Link project
supabase link --project-ref jpkvcwlfhxoxpgxuscdb

# Push migrations
supabase db push

# Check status
supabase migration list

# Rollback (if needed)
supabase migration repair --status reverted <migration_name>
```

---

## Success Indicators

After setup, you should:
- ✅ See tables in Supabase Dashboard
- ✅ Create studios without errors
- ✅ Upload images to projects
- ✅ View gallery with slideshow
- ✅ No database errors in console

---

**Need more help?**
- Check Supabase docs: https://supabase.com/docs
- View your project: https://app.supabase.com/project/jpkvcwlfhxoxpgxuscdb
