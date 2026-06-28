import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.substring(0, idx).trim();
    const val = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) {
      process.env[key] = val;
    }
  });
}

loadEnv();

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
};

async function main() {
  const supabaseUrl = required('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY');
  const email = process.env.CORVIOZ_TEST_EMAIL || 'corvioz-e2e-test-user@gmail.com';
  const password = process.env.CORVIOZ_TEST_PASSWORD || 'Corvioz-Test-Password-123!';

  console.log(`Creating/confirming test user: ${email}...`);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // Try creating the user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    if (error.message.includes('already exists') || error.code === 'email_exists') {
      console.log(`User already exists. Updating password...`);
      // Update password and confirm email just in case
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      const user = listData.users.find(u => u.email === email);
      if (user) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
          password,
          email_confirm: true,
        });
        if (updateError) throw updateError;
        console.log(`User updated successfully.`);
      } else {
        throw new Error(`User with email ${email} not found in user list despite conflict error.`);
      }
    } else {
      throw error;
    }
  } else {
    console.log(`User created and confirmed successfully:`, data.user.id);
  }
}

main().catch((err) => {
  console.error('Failed to create/confirm test user:', err);
  process.exit(1);
});
