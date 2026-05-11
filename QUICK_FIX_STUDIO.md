# 🚀 QUICK FIX: Studio Database Setup (3 Minutes)

## The Problem
Your app is working but database tables don't exist yet. All those 400/404 errors are because Supabase hasn't been set up.

## The Solution
Run these commands in your terminal:

```bash
# 1. Install Supabase CLI (skip if already installed)
npm install -g supabase

# 2. Go to project directory
cd c:\Users\HP\Desktop\ilivin

# 3. Link your Supabase project
supabase link --project-ref jpkvcwlfhxoxpgxuscdb

# 4. Deploy the migrations
supabase db push

# 5. Done! Refresh your app
```

## Verify It Worked

Open Supabase Dashboard: https://app.supabase.com/project/jpkvcwlfhxoxpgxuscdb

1. Click **Table Editor** on left menu
2. You should see these tables:
   - `studios`
   - `studio_members`
   - `studio_projects`
   - `studio_assets`
   - `studio_activity`
   - `studio_analytics`

## Test It

1. Refresh browser (F5)
2. Go to `/studio` in your app
3. Click "Create New Studio"
4. Should work now! ✅

## If That Doesn't Work

Try the manual method:

1. Open: https://app.supabase.com/project/jpkvcwlfhxoxpgxuscdb/editor
2. Click **SQL Editor**
3. Click **New Query**
4. Open this file and copy ALL the SQL:
   - `supabase/migrations/20260421_create_studio_tables.sql`
5. Paste it into the query editor
6. Click **Run**

## That's It!

All errors will go away once the database tables exist. The app is already built and working - just needs the database.

---

**Time to fix**: ~3 minutes  
**Difficulty**: Easy  
**Requirements**: Supabase CLI

For more details, see: `STUDIO_DATABASE_SETUP.md` and `STUDIO_ERRORS_EXPLAINED.md`
