# Studio Setup & Deployment Guide

## Current Issues

Your application is working, but the Supabase database tables need to be created. Here's what to fix:

### ❌ Errors You're Seeing
1. **400 Bad Request** on studio queries → Tables don't exist yet
2. **404 Not Found** on column queries → API trying to query non-existent tables
3. **"Cannot find menu item translate-page"** → VS Code extension issue (ignore it)

### ✅ Solution: Deploy Supabase Migrations

## Quick Start

### Option 1: Deploy Locally (Development)

If you have a local Supabase setup:

```bash
# From project root
cd supabase

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations to development
supabase db push

# Check status
supabase migration list
```

### Option 2: Deploy to Production Supabase

```bash
# Install Supabase CLI
npm install -g supabase

# Set your access token
export SUPABASE_ACCESS_TOKEN=your_token_here

# Link project
supabase link --project-ref jpkvcwlf

# Push migrations
supabase db push
```

### Option 3: Manual SQL Deployment

Go to your Supabase Dashboard:

1. **Open SQL Editor** in Supabase Dashboard
2. **Create new query**
3. **Copy contents** from: `supabase/migrations/20260421_create_studio_tables.sql`
4. **Run the query**

Then optionally run the other migrations:
- `20260324195500_add_studio_workspace.sql`
- `20260324201000_add_studio_folders_and_storage.sql`

## What Gets Created

After deployment, you'll have these tables:

- `studios` - Main studio data
- `studio_members` - Team member access
- `studio_projects` - Projects within studios
- `studio_assets` - Files and media
- `studio_activity` - Activity logs
- `studio_analytics` - View/engagement stats

## Verify It Worked

In Supabase Dashboard:

1. Go to **Table Editor**
2. You should see all new tables in the list
3. Go back to your app and try creating a studio

## Troubleshooting

### Still Getting 404 Errors?
- Migrations haven't been run
- Check Supabase project is correct: `jpkvcwlfhxoxpgxuscdb`
- Verify tables exist in Table Editor

### Getting 400 Errors?
- Complex join queries failing
- **Fixed** in latest code - simplified `getUserStudios()`

### Tables Exist but Still Getting Errors?
- Check RLS (Row Level Security) policies
- Verify auth token is valid
- Check user_id is correct UUID format

## Next Steps

1. ✅ Deploy migrations (choose one option above)
2. ✅ Refresh your app (browser F5)
3. ✅ Try creating a studio from `/studio` page
4. ✅ Upload images and test gallery viewer

## Files Reference

- **Migrations**: `supabase/migrations/`
- **API Methods**: `src/lib/studio-api.ts`
- **Pages**: 
  - `src/pages/MyStudioPage.tsx`
  - `src/pages/StudioPage.tsx`
  - `src/pages/StudioProjectPage.tsx`
- **Components**: `src/components/studio/`

---

**Need help?** Check your Supabase project status at:
https://app.supabase.com/project/jpkvcwlfhxoxpgxuscdb
