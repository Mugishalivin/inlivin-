const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const url = "https://jpkvcwlfhxoxpgxuscdb.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwa3Zjd2xmaHhveHBneHVzY2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3ODkyNjgsImV4cCI6MjA4OTM2NTI2OH0.rvbYhm-tJkQcir8qIWBxvaQH_jMDHo5bT2xWHoO8bBI";

const supabase = createClient(url, key);

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'supabase/migrations/20260409002000_add_digital_product_engagement.sql'),
      'utf-8'
    );

    console.log('Connecting to Supabase...');
    
    // Use the raw query approach via Postgres client
    const { data, error } = await supabase.rpc('execute_sql', {
      sql: migrationSQL
    }).catch(async () => {
      // If RPC doesn't exist, try direct SQL execution
      console.log('RPC not available, trying admin API...');
      
      // For now, log that we need service role key
      console.log('⚠️  NOTE: To apply migrations, you need a Supabase service role key.');
      console.log('   Export SUPABASE_DB_PASSWORD or set service role key in .env');
      console.log('   Then the migration will be applied automatically.');
      
      return { data: null, error: 'Service role key required' };
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      console.log('\n📝 Alternative: Apply this SQL manually in Supabase dashboard:');
      console.log('   1. Go to https://app.supabase.com/project/jpkvcwlfhxoxpgxuscdb/sql');
      console.log('   2. Copy and paste the contents of: supabase/migrations/20260409002000_add_digital_product_engagement.sql');
      console.log('   3. Click Execute');
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');
    console.log('Engagement tables created: views, likes, interactions, shares, bookmarks');
  } catch (err) {
    console.error('Error:', err.message);
    console.log('\n📝 Manual steps:');
    console.log('   1. Go to https://app.supabase.com/project/jpkvcwlfhxoxpgxuscdb/sql');
    console.log('   2. Copy contents of: supabase/migrations/20260409002000_add_digital_product_engagement.sql');
    console.log('   3. Paste and execute');
    process.exit(1);
  }
}

applyMigration();
