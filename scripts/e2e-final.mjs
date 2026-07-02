import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runVerification() {
  console.log('--- STARTING SYSTEM CONSISTENCY FINAL VERIFICATION ---\n');
  let results = {
    decisionEngine: false,
    uiIsolation: false,
    dashboardGuard: false,
    dbWrite: false,
    e2eAnalytics: false
  };

  // 1. Decision Engine
  console.log('1. Verifying Decision Engine Consistency...');
  try {
    const { execSync } = await import('child_process');
    execSync('npm run verify:decision-single-source', { stdio: 'pipe' });
    console.log('✅ Decision Engine test passed.');
    results.decisionEngine = true;
  } catch (err) {
    console.log('❌ Decision Engine test failed.');
  }

  // 2. UI Isolation
  console.log('\n2. Verifying UI Isolation...');
  try {
    const { execSync } = await import('child_process');
    execSync('npm run verify:ui-isolation', { stdio: 'pipe' });
    console.log('✅ UI Isolation test passed.');
    results.uiIsolation = true;
  } catch (err) {
    console.log('❌ UI Isolation test failed.');
  }

  // 3. Dashboard Guard Check
  console.log('\n3. Verifying Dashboard API Guard...');
  const hookFile = fs.readFileSync(path.resolve(__dirname, '../src/hooks/useDashboardData.js'), 'utf8');
  if (hookFile.includes('!token && !session')) {
    console.log('✅ Dashboard API Guard is present.');
    results.dashboardGuard = true;
  } else {
    console.log('❌ Dashboard API Guard is missing.');
  }

  // 4. DB Table Check
  console.log('\n4. Verifying Supabase DB Table (analytics_events)...');
  const { error: readErr } = await supabase.from('analytics_events').select('id').limit(1);
  if (readErr) {
    console.log('❌ DB read failed:', readErr.message);
  } else {
    console.log('✅ DB table exists and is readable.');
    const { data: insertData, error: insertErr } = await supabase
      .from('analytics_events')
      .insert([{ event: 'SYSTEM_TEST' }])
      .select();
    
    if (insertErr) {
      console.log('❌ DB write failed:', insertErr.message);
    } else {
      console.log('✅ DB table is writable.');
      results.dbWrite = true;
    }
  }

  // 5. E2E Analytics POST
  console.log('\n5. Verifying E2E Analytics API...');
  try {
    const events = ['LANDING_VIEW', 'CTA_CLICK', 'PRODUCT_VIEW'];
    let allSuccess = true;
    for (const event of events) {
      const res = await fetch('http://localhost:3000/api/product/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          path: '/',
          userAgent: 'Test Agent'
        })
      });
      if (!res.ok) {
        console.log(`❌ API rejected event ${event} with status ${res.status}`);
        allSuccess = false;
      }
    }
    if (allSuccess) {
      console.log('✅ E2E Analytics API accepts all canonical events without 400 errors.');
      results.e2eAnalytics = true;
    }
  } catch (err) {
    console.log('❌ E2E API check failed (is the dev server running?):', err.message);
  }

  console.log('\n--- VERIFICATION COMPLETE ---');
  console.log(JSON.stringify(results, null, 2));
}

runVerification();
