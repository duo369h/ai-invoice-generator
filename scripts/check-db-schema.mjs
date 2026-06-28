import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.substring(0, idx).trim();
    const val = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  });
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('Checking database columns for public.entitlements...');
  const { data: entData, error: entError } = await supabase
    .from('entitlements')
    .select('*')
    .limit(1);

  if (entError) {
    console.error('Error fetching entitlements:', entError.message);
  } else {
    console.log('Entitlements row columns:', entData.length > 0 ? Object.keys(entData[0]) : 'No rows found to inspect');
  }

  console.log('\nChecking database columns for public.billing_events...');
  const { data: billData, error: billError } = await supabase
    .from('billing_events')
    .select('*')
    .limit(1);

  if (billError) {
    console.error('Error fetching billing_events:', billError.message);
  } else {
    console.log('Billing events row columns:', billData.length > 0 ? Object.keys(billData[0]) : 'No rows found to inspect');
  }
}

checkSchema().catch(console.error);
