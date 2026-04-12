import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const url = "https://jpkvcwlfhxoxpgxuscdb.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwa3Zjd2xmaHhveHBneHVzY2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3ODkyNjgsImV4cCI6MjA4OTM2NTI2OH0.rvbYhm-tJkQcir8qIWBxvaQH_jMDHo5bT2xWHoO8bBI";

const supabase = createClient(url, key);

async function applyMigration() {
  try {
    console.log('📋 Applying professional marketplace features migration...');
    
    // Direct SQL that adds the necessary columns
    const migrationSQL = `
-- Add professional marketplace features to selling_items table
DO $$ BEGIN
  -- Password Protection
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'download_password') THEN
    ALTER TABLE public.selling_items ADD COLUMN download_password text;
  END IF;

  -- Comment Controls
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'allow_comments') THEN
    ALTER TABLE public.selling_items ADD COLUMN allow_comments boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'comments_visible_to_all') THEN
    ALTER TABLE public.selling_items ADD COLUMN comments_visible_to_all boolean DEFAULT false;
  END IF;

  -- Views Tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'views_count') THEN
    ALTER TABLE public.selling_items ADD COLUMN views_count integer DEFAULT 0;
  END IF;

END $$;

-- Create index for views tracking
CREATE INDEX IF NOT EXISTS idx_selling_items_views_count ON public.selling_items(views_count);
    `;

    console.log('🔗 Connecting to Supabase...');
    
    try {
      // Attempt to execute via RPC or direct SQL
      const { error } = await supabase.rpc('execute_sql', { sql: migrationSQL }).catch(() => ({ error: 'RPC unavailable' }));
      
      if (error) {
        throw new Error(error);
      }
      
      console.log('✅ Migration applied successfully!');
      console.log('✨ Added columns: download_password, allow_comments, comments_visible_to_all, views_count');
      process.exit(0);
    } catch (rpcError) {
      console.log('⚠️  Note: To apply migrations via CLI, you need a Supabase service role key.');
      console.log('\n📝 Please apply this migration manually:');
      console.log('   1. Go to: https://app.supabase.com/project/jpkvcwlfhxoxpgxuscdb/sql/new');
      console.log('   2. Copy and paste the SQL below');
      console.log('   3. Click "Execute"');
      console.log('\n' + '='.repeat(60));
      console.log(migrationSQL);
      console.log('='.repeat(60));
      console.log('\n✅ After applying, the marketplace listing will work!');
      process.exit(0);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

applyMigration();
