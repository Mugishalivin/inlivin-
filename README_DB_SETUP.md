# Supabase DB Setup for Powerful Admin

## Critical Step 1: Run Seed Migration
1. Go to your Supabase Dashboard (project: jpkvcwlfhxoxpgxuscdb)
2. SQL Editor → Paste ALL content from `supabase/migrations/20260410020000_seed_powerful_admin.sql`
3. Run → Confirm 'admin_global_config' and 'feature_flags' tables exist with data

## Verify
```
SELECT * FROM admin_global_config LIMIT 5;
SELECT * FROM feature_flags LIMIT 5;
```
Expect 5+ rows each.

## Test Admin Page
`npm run dev` → Login as admin → /admin/settings → See populated tabs/data toggles!

DB connected = page powerful.
