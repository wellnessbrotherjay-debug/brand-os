const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const today = new Date().toISOString().split('T')[0];
  const { data: s } = await supabase.from('schedules')
    .select('*, program:programs(*)')
    .eq('scheduled_day', today)
    .eq('studio_id', 'studio-a')
    .order('start_time', {ascending: false});
  console.log("SCHEDULES FOUND:", s ? s.length : 0);
  if (!s || s.length === 0) return;

  const ls = s[0];
  console.log("LATEST SCHEDULE ID:", ls.id, "PROGRAM ID:", ls.program_id);

  if (ls.program_id) {
    const { data: pd } = await supabase.from('program_days')
      .select('*')
      .eq('program_id', ls.program_id)
      .eq('day_number', 1)
      .single();
    
    console.log("PROGRAM DAY NAME:", pd?.workout_name || pd?.name);
    if (pd?.data && pd.data.exercises) {
      console.log("EXERCISES:", pd.data.exercises.map(e => ({name: e.name, stationId: e.stationId, type: typeof e.stationId})));
    } else {
      console.log("NO EXERCISES IN PROGRAM DAY");
    }
  }
}

check().catch(console.error);
