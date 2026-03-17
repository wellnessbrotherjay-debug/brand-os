#!/usr/bin/env node

/**
 * Enable Supabase Real-time for global_timer table
 */

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function enableRealtime() {
  try {
    console.log('🔧 Enabling real-time for global_timer...');

    // Run the SQL commands
    const sql = `
      -- Drop and recreate publication
      DROP PUBLICATION IF EXISTS supabase_realtime;
      CREATE PUBLICATION supabase_realtime;

      -- Add tables to publication
      ALTER PUBLICATION supabase_realtime ADD TABLE workouts;
      ALTER PUBLICATION supabase_realtime ADD TABLE global_timer;

      -- Verify
      SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
    `;

    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('❌ Error enabling real-time:', error);
    } else {
      console.log('✅ Real-time enabled successfully!');
      console.log('Data:', data);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

enableRealtime().then(() => {
  console.log('🎉 Done!');
  process.exit(0);
});
