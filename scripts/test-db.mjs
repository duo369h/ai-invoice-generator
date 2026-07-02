import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('Testing Supabase analytics_events table...');
  const { data, error } = await supabase
    .from('analytics_events')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching from analytics_events:', error.message);
  } else {
    console.log('Success! Table exists and is readable. Rows found:', data.length);
  }

  // Test insert
  const { data: insertData, error: insertError } = await supabase
    .from('analytics_events')
    .insert([{
      event: 'SYSTEM_TEST',
      session_id: 'test-session',
      metadata: { test: true }
    }])
    .select();

  if (insertError) {
    console.error('Error inserting into analytics_events:', insertError.message);
  } else {
    console.log('Success! Table is writable. Inserted:', insertData[0].id);
  }
}

testDatabase();
