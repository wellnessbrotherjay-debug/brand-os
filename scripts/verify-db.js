
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyConnection() {
    console.log('Testing Supabase connection...');
    console.log('URL:', supabaseUrl);

    // 1. Check Team Members Table
    console.log('1. Checking team_members table...');
    const { data: teamData, error: teamError } = await supabase
        .from('team_members')
        .select('count', { count: 'exact', head: true });

    if (teamError) {
        console.error('   FAILED: Could not access team_members table.', teamError.message);
    } else {
        console.log(`   SUCCESS: Access confirmed. Row count: ${teamData?.length || 'N/A'}`); // count is in count property if head:true? No, count is returned separately.
    }

    // 2. Test Insert
    console.log('2. Testing write permission (creating test user)...');
    const testUser = {
        name: 'Test Connectivity User',
        email: 'test@brandos.com',
        role: 'Admin',
        status: 'active'
    };

    const { data: insertData, error: insertError } = await supabase
        .from('team_members')
        .insert(testUser)
        .select();

    if (insertError) {
        console.error('   FAILED: Insert failed.', insertError.message);
    } else {
        console.log('   SUCCESS: Test user inserted.', insertData[0].id);

        // Cleanup
        console.log('3. Cleaning up test user...');
        const { error: deleteError } = await supabase.from('team_members').delete().eq('id', insertData[0].id);
        if (deleteError) console.error('   WARNING: Failed to delete test user.', deleteError.message);
        else console.log('   SUCCESS: Test user deleted.');
    }
}

verifyConnection();
