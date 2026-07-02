import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => { const idx=l.indexOf('='); return [l.substring(0,idx).trim(), l.substring(idx+1).trim()] }));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('analytics_events').select('*').limit(1);
  console.log('Error:', error?.message);
  console.log('Data:', data);
}
test();
