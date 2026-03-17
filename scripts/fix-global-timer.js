#!/usr/bin/env node

/**
 * Fix Global Timer Script
 *
 * This script ensures the global_timer is active and properly configured.
 * Run with: node scripts/fix-global-timer.js
 */

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixGlobalTimer() {
  try {
    console.log('🔧 Fixing global timer...');

    // Check if timer exists
    const { data: existingTimer, error: fetchError } = await supabase
      .from('global_timer')
      .select('*')
      .eq('id', 'active')
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching timer:', fetchError);
      return;
    }

    const targetEndTime = new Date(Date.now() + 45000); // 45 seconds from now

    if (existingTimer) {
      console.log('✅ Timer exists, updating...');
      const { error: updateError } = await supabase
        .from('global_timer')
        .update({
          is_active: true,
          phase: 'work',
          time_left: 45,
          work_time: 45,
          rest_time: 15,
          target_end_time: targetEndTime.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'active');

      if (updateError) {
        console.error('❌ Error updating timer:', updateError);
      } else {
        console.log('✅ Timer updated successfully!');
      }
    } else {
      console.log('📝 Timer does not exist, creating...');
      const { error: insertError } = await supabase
        .from('global_timer')
        .insert({
          id: 'active',
          is_active: true,
          phase: 'work',
          time_left: 45,
          work_time: 45,
          rest_time: 15,
          target_end_time: targetEndTime.toISOString(),
        });

      if (insertError) {
        console.error('❌ Error creating timer:', insertError);
      } else {
        console.log('✅ Timer created successfully!');
      }
    }

    // Verify the fix
    const { data: verifyTimer, error: verifyError } = await supabase
      .from('global_timer')
      .select('*')
      .eq('id', 'active')
      .single();

    if (verifyError) {
      console.error('❌ Error verifying timer:', verifyError);
    } else {
      console.log('✅ Verification successful!');
      console.log('Timer state:', {
        is_active: verifyTimer.is_active,
        phase: verifyTimer.phase,
        time_left: verifyTimer.time_left,
        target_end_time: verifyTimer.target_end_time,
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixGlobalTimer().then(() => {
  console.log('🎉 Fix complete!');
  process.exit(0);
});
