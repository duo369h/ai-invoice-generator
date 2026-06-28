import fs from 'fs';

const sql = fs.readFileSync('supabase/schema.sql', 'utf8');

const requiredSnippets = [
  'CREATE EXTENSION IF NOT EXISTS pgcrypto',
  'CREATE TABLE IF NOT EXISTS public.profiles',
  'CREATE TABLE IF NOT EXISTS public.clients',
  'CREATE TABLE IF NOT EXISTS public.invoices',
  'CREATE TABLE IF NOT EXISTS public.quotes',
  'CREATE TABLE IF NOT EXISTS public.leads',
  'CREATE TABLE IF NOT EXISTS public.card_profiles',
  'CREATE TABLE IF NOT EXISTS public.portal_tokens',
  'CREATE TABLE IF NOT EXISTS public.audit_logs',
  'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE public.card_profiles ENABLE ROW LEVEL SECURITY',
  'ON public.invoices FOR SELECT USING (auth.uid() = user_id)',
  'ON public.quotes FOR SELECT USING (auth.uid() = user_id)',
  'ON public.leads FOR SELECT USING (auth.uid() = freelancer_id)',
  'Anyone can insert leads for public profiles',
  'cp.user_id = freelancer_id',
  'cp.is_public = true',
  'ON public.card_profiles FOR SELECT USING (is_public = true OR auth.uid() = user_id)',
  'GRANT USAGE ON SCHEMA public TO anon, authenticated',
  'GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated',
  'GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated',
  'GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated',
  'GRANT SELECT, UPDATE ON public.leads TO authenticated',
  'GRANT SELECT ON public.card_profiles TO anon',
  'GRANT INSERT ON public.leads TO anon',
  'GRANT ALL PRIVILEGES ON public.portal_tokens TO service_role',
  'GRANT ALL PRIVILEGES ON public.audit_logs TO service_role',
  'payment_link TEXT DEFAULT',
  'paddle_customer_id TEXT DEFAULT',
  'paddle_subscription_id TEXT DEFAULT',
];

const forbiddenPatterns = [
  /stripe/i,
  /demo/i,
  /mock/i,
  /WITH CHECK\s*\(\s*true\s*\)/i,
  /sarahdesign/i,
  /alexdev/i,
];

const missing = requiredSnippets.filter((snippet) => !sql.includes(snippet));
const forbidden = forbiddenPatterns
  .filter((pattern) => pattern.test(sql))
  .map((pattern) => pattern.toString());

if (missing.length || forbidden.length) {
  console.error('Schema static verification failed.');
  if (missing.length) {
    console.error('Missing required snippets:');
    for (const item of missing) console.error(`- ${item}`);
  }
  if (forbidden.length) {
    console.error('Forbidden legacy patterns found:');
    for (const item of forbidden) console.error(`- ${item}`);
  }
  process.exit(1);
}

const createTableCount = (sql.match(/CREATE TABLE IF NOT EXISTS public\./g) || []).length;
const createPolicyCount = (sql.match(/CREATE POLICY /g) || []).length;

console.log('Schema static verification passed.');
console.log(`CREATE TABLE statements: ${createTableCount}`);
console.log(`CREATE POLICY statements: ${createPolicyCount}`);
console.log('Stripe legacy patterns: none');
