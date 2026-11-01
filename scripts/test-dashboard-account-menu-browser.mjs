// Local component regression only: real account JSX/sign-out callback and CSS,
// synthetic identity/service, fresh browser profiles, loopback HTTP only.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import crypto from 'node:crypto';

const root = process.cwd();
const require = createRequire(path.join(root, 'package.json'));
const ts = require('typescript');
const pw = require('playwright');
const webpackRuntime = require('next/dist/compiled/webpack/webpack');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'c47-12-account-menu-'));
const output = process.env.C47_ACCOUNT_MENU_OUTPUT;
const serveOnly = process.argv.includes('--serve');
const layerOnly = process.argv.includes('--layer-only');
const focusOnly = process.argv.includes('--focus-only');
const footerOnly = process.argv.includes('--footer-only');
const records = [];
const blockedExternal = [];
const source = fs.readFileSync(path.join(root, 'src/components/dashboard/Dashboard.js'), 'utf8');
const ast = ts.createSourceFile('Dashboard.jsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
let accountMarkup;
let footerMarkup;
let signOut;
function visit(node) {
  if (ts.isJsxElement(node) && node.openingElement.attributes.properties.some((p) =>
    p.name?.text === 'className' && p.initializer?.text === 'dashboard-sidebar-footer')) {
    accountMarkup = node.children.find(ts.isJsxElement)?.getText(ast);
    footerMarkup = node.getText(ast);
  }
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'handleSignOut') {
    signOut = node.getText(ast);
  }
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(accountMarkup && signOut, 'Use actual Dashboard account fragment and sign-out function');
const portalFile = path.join(root, 'src/components/dashboard/DashboardAccountMenu.js');
const portalImport = fs.existsSync(portalFile)
  ? `import DashboardAccountMenu from ${JSON.stringify(portalFile)};` : '';
const mobileFile=path.join(root,'src/components/dashboard/HarborMobileNavigation.js');
const mobileImport=fs.existsSync(mobileFile)?`import HarborMobileNavigation from ${JSON.stringify(mobileFile)};`:'';
const mobileMarkup=fs.existsSync(mobileFile)?'<HarborMobileNavigation activeTab="overview" onNavigate={()=>{}} signedIn={true} accountOpen={accountMenuOpen} onAccountOpenChange={setAccountMenuOpen} accountEmail={session.user.email} isSigningOut={isSigningOut} onSignOut={handleSignOut} />':'';
const fixture = `import React,{useState,useRef} from 'react';
import {createRoot} from 'react-dom/client';
${portalImport}
${mobileImport}
function Fixture(){
 const query=new URLSearchParams(location.search);
 const [sidebarCollapsed,setSidebarCollapsed]=useState(query.get('collapsed')!=='false');
 const [accountMenuOpen,setAccountMenuOpen]=useState(false);
 const [isSigningOut,setIsSigningOut]=useState(false);
 const isSigningOutRef=useRef(false);const accountButtonRef=useRef(null);
 const feedbackBtnRef=useRef(null);
 const isEntitlementLoading=false,isFreePlan=true,entitlementReady=true,planStatusLabel='Free';
 const kernelUi={cta:()=> 'Upgrade your business'};
 const trackUpgradeClick=()=>{};const trackEvent=()=>{};const saveSelectedPlan=()=>{};const evaluateAction=(_,fn)=>fn();
 const openFeedbackModal=()=>{window.__feedbackCalls=(window.__feedbackCalls||0)+1;};
 const session={user:{email:query.has('long')?'very.long.account.identifier.'.repeat(6)+'@example.test':'founder.beta@example.test'}};
 const Icons={account:()=>React.createElement('svg',{'aria-hidden':true,width:18,height:18})};
 const Link=({href,children,...rest})=>React.createElement('a',{href,...rest},children);
 window.__accountResult ||= {signOutCalls:0,clearAnalytics:0,clearData:0,route:null};
 window.__accountNavigationResults ||= {quoteChecks:0,invoiceChecks:0,resets:0};
 const requestQuoteNavigation=()=>{window.__accountNavigationResults.quoteChecks++;return query.get('blockNavigation')!=='quote';};
 const requestInvoiceNavigation=()=>{window.__accountNavigationResults.invoiceChecks++;return query.get('blockNavigation')!=='invoice';};
 const resetAccountScopedState=()=>{window.__accountNavigationResults.resets++;};
 const supabaseClient={auth:{signOut:async()=>{window.__accountResult.signOutCalls++;return {error:null};}}};
 const clearAnalyticsUserId=()=>{window.__accountResult.clearAnalytics++;};
 const clearDashboardData=()=>{window.__accountResult.clearData++;};
 const router={replace:(route)=>{window.__accountResult.route=route;}};
 const triggerToast=()=>{throw new Error('Unexpected sign-out error');};
 const ${signOut};
 return <div className="fixture-clip dashboard-shell" style={{height:'100vh',overflow:'hidden',transform:'translateZ(0)'}}>
  <div className={'dashboard-layout'+(sidebarCollapsed?' dashboard-sidebar-layout-collapsed':'')}>
   <aside className={'dashboard-sidebar-aside'+(sidebarCollapsed?' dashboard-sidebar-collapsed':'')}>
    <div><button data-testid="test-toggle" onClick={()=>setSidebarCollapsed(x=>!x)}>Toggle sidebar</button></div>
    ${footerOnly ? footerMarkup : `<div className="dashboard-sidebar-footer">${accountMarkup}</div>`}
   </aside><main className="dashboard-main-content">Local synthetic fixture only</main>${mobileMarkup}
  </div></div>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);`;
fs.writeFileSync(path.join(work, 'fixture.js'), fixture);
fs.writeFileSync(path.join(work, 'jsx-loader.cjs'), `const ts=require(${JSON.stringify(require.resolve('typescript'))});module.exports=function(src){return ts.transpileModule(src,{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020,allowJs:true}}).outputText;};`);
await new Promise((resolve, reject) => webpackRuntime.webpack({
  mode: 'development', target: 'web', devtool: false,
  entry: path.join(work, 'fixture.js'), output: { path: work, filename: 'bundle.js' },
  resolve: { extensions: ['.js', '.mjs'], alias: {'@':path.join(root,'src')}, modules: [path.join(root, 'node_modules')] },
  module: { rules: [{ test: /\.js$/, exclude: /node_modules/, use: path.join(work, 'jsx-loader.cjs') }] },
}, (error, stats) => error || stats.hasErrors()
  ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
const styleNames = ['tokens', 'base', 'utilities', 'components', 'layouts'];
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  if (url.pathname === '/bundle.js') {
    res.writeHead(200, { 'content-type': 'text/javascript' });
    return res.end(fs.readFileSync(path.join(work, 'bundle.js')));
  }
  if (styleNames.some((n) => url.pathname === `/${n}.css`)) {
    res.writeHead(200, { 'content-type': 'text/css' });
    return res.end(fs.readFileSync(path.join(root, 'src/app/styles', url.pathname.slice(1))));
  }
  if (url.pathname === '/') {
    res.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-store',
      'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; font-src 'self'" });
    return res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">${styleNames.map((n) => `<link rel="stylesheet" href="/${n}.css">`).join('')}</head><body><div id="root"></div><script src="/bundle.js"></script></body></html>`);
  }
  res.writeHead(404);res.end();
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
if (serveOnly) {
  console.log(JSON.stringify({ origin, mode: 'LOCAL_SYNTHETIC_COMPONENT_ONLY', pid: process.pid }));
  await new Promise((resolve) => { process.on('SIGTERM', resolve); process.on('SIGINT', resolve); });
} else {
  const engines = [
    ['chrome', () => pw.chromium.launch({ channel: 'chrome', headless: true })],
    ['webkit', () => pw.webkit.launch({ headless: true })],
  ];
  const cases = layerOnly || focusOnly || footerOnly ? [] : [
    ['collapsed_desktop', 1280, 900, true, false],
    ['expanded_desktop', 1280, 900, false, false],
    ['collapsed_breakpoint', 769, 500, true, false],
    ['mobile_persisted_collapsed', 375, 667, true, false],
    ['narrow_long_identity', 320, 240, true, true],
    ['short_desktop_long_identity', 900, 220, true, true],
  ];
  for (const [engine, launch] of engines) {
    const browser = await launch();
    try {
      if (footerOnly) {
        for (const [width,height,collapsed] of [[1280,900,true],[1280,500,true],[1024,500,true],[900,600,true],[769,500,true],[1280,900,false],[900,600,false]]) {
          const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
          await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
          try {
            await page.goto(`${origin}/?collapsed=${collapsed}`);
            const feedback=page.getByRole('button',{name:'Share Feedback',exact:true});
            assert.equal(await feedback.isVisible(),true,'feedback must remain visible');
            assert.equal(await feedback.locator('svg').count(),1,'feedback must have a message-square icon');
            assert.equal(await feedback.getAttribute('title'),'Share Feedback');
            assert.equal(await feedback.locator('.dashboard-sidebar-feedback-label').isVisible(),!collapsed,'only the collapsed state hides the label');
            const plan=page.locator('.dashboard-sidebar-plan-row');
            assert.equal(await plan.locator('svg,img').count(),0,'FREE has no decorative icon');
            assert.match(await plan.innerText(),/Free/i);
            const geometry=await page.evaluate(()=>{
              const aside=document.querySelector('aside').getBoundingClientRect();
              return ['.dashboard-sidebar-plan-row','.dashboard-sidebar-feedback','.dashboard-sidebar-account-action'].map(selector=>{
                const el=document.querySelector(selector),b=el.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);
                return {selector,x:b.x,y:b.y,right:b.right,bottom:b.bottom,inside:b.x>=aside.x&&b.right<=aside.right&&b.y>=aside.y&&b.bottom<=aside.bottom,hit:el===hit||el.contains(hit),noOverflow:el.scrollWidth<=el.clientWidth+1};
              });
            });
            for(const box of geometry) assert.ok(box.inside&&box.hit&&box.noOverflow&&box.bottom<=height,JSON.stringify(box));
            await feedback.hover();
            await feedback.click();
            assert.equal(await page.evaluate(()=>window.__feedbackCalls),1,'original feedback callback remains usable');
            await page.getByRole('button',{name:'Account',exact:true}).click();
            const signOut=page.getByRole('menuitem',{name:'Sign out',exact:true});
            await signOut.waitFor({state:'visible'});
            await signOut.click();
            assert.equal(await page.evaluate(()=>window.__accountResult.signOutCalls),1);
            records.push({engine,name:`footer_${width}x${height}_${collapsed?'collapsed':'expanded'}`,passed:true,geometry});
          } catch(error) {records.push({engine,name:`footer_${width}x${height}_${collapsed?'collapsed':'expanded'}`,passed:false,error:error.message});}
          finally {await page.close();}
        }
      }
      for (const [name, width, height, collapsed, long] of cases) {
        const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
        await page.route('**/*', (route) => {
          if (route.request().url().startsWith(origin + '/')) return route.continue();
          blockedExternal.push(route.request().url());return route.abort();
        });
        try {
          const mobile = width < 768;
          await page.goto(`${origin}/?collapsed=${collapsed}${long ? '&long=1' : ''}`);
          if (mobile) await page.getByRole('button',{name:'More',exact:true}).click();
          const trigger = page.getByRole('button', { name: 'Account', exact: true });
          await trigger.click();
          const menu = page.getByRole('menu', { name: 'Account menu' });
          await menu.waitFor({ state: 'visible' });
          if (mobile) await page.getByRole('menuitem',{name:'Sign out',exact:true}).scrollIntoViewIfNeeded();
          await page.waitForTimeout(450); // Only settle the existing CSS animation for geometry measurement.
          const geometry = await menu.evaluate((el) => {
            const box = el.getBoundingClientRect();
            const aside = document.querySelector('.dashboard-sidebar-aside').getBoundingClientRect();
            const anchor = document.querySelector('[aria-label="Account"]').getBoundingClientRect();
            const button = el.querySelector('[role="menuitem"]');
            const buttonBox = button.getBoundingClientRect();
            const hit = document.elementFromPoint(buttonBox.x + buttonBox.width / 2, buttonBox.y + buttonBox.height / 2);
            const text = el.querySelector('.dashboard-account-menu-email') || el.querySelector('p') || el.querySelector('div > div');
            return { x: box.x, y: box.y, right: box.right, bottom: box.bottom,
              asideRight: aside.right, anchorRight: anchor.right, anchorTop: anchor.top,
              hit: !!hit && (hit === button || button.contains(hit)),
              emailScrollWidth: text.scrollWidth, emailClientWidth: text.clientWidth,
              textOverflow: getComputedStyle(text).textOverflow, whiteSpace: getComputedStyle(text).whiteSpace };
          });
          assert.ok(mobile || (geometry.x >= 7 && geometry.y >= 7 && geometry.right <= width - 7 && geometry.bottom <= height - 7),
            `menu must fit viewport: ${JSON.stringify(geometry)}`);
          if (collapsed && geometry.asideRight > 0 && geometry.asideRight <= 100) assert.ok(geometry.x >= geometry.asideRight + 7, 'rendered collapsed rail menu must open to its right');
          if (!collapsed && width > 768) assert.ok(Math.abs(geometry.right - geometry.anchorRight) <= 1, 'expanded right alignment unchanged');
          assert.ok(geometry.hit, 'Sign out must be hit-testable, not clipped or covered');
          if (long) {
            assert.notEqual(geometry.whiteSpace, 'nowrap', 'full account information must wrap');
            assert.ok(geometry.emailScrollWidth <= geometry.emailClientWidth + 1, 'long identity must not be horizontally clipped');
          }
          if (output && name === 'collapsed_desktop') await page.screenshot({ path: path.join(output, `${engine}-${name}.png`) });
          await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click();
          await page.waitForFunction(() => window.__accountResult.route === '/auth', null, { timeout: 3000 });
          assert.deepEqual(await page.evaluate(() => window.__accountNavigationResults), {quoteChecks:1,invoiceChecks:1,resets:1});
          assert.deepEqual(await page.evaluate(() => window.__accountResult), { signOutCalls: 1, clearAnalytics: 1, clearData: 1, route: '/auth' });
          await menu.waitFor({ state: 'detached' });
          records.push({ engine, name, passed: true, geometry, sign_out_original_callback: 'PASS_LOCAL_STUB_ONLY' });
        } catch (error) {
          records.push({ engine, name, passed: false, error: error.message });
        } finally { await page.close(); }
      }
      if (!layerOnly && !focusOnly && !footerOnly) {
        for (const guard of ['quote', 'invoice']) {
          const guardPage = await browser.newPage({ viewport: {width:1280,height:900} });
          await guardPage.route('**/*', (route) => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
          try {
            await guardPage.goto(origin + '/?blockNavigation=' + guard);
            await guardPage.getByRole('button', {name:'Account',exact:true}).click();
            await guardPage.getByRole('menuitem', {name:'Sign out',exact:true}).click();
            const actual = await guardPage.evaluate(() => ({action:window.__accountResult,navigation:window.__accountNavigationResults}));
            assert.equal(actual.action.signOutCalls,0);
            assert.equal(actual.action.route,null);
            assert.equal(actual.navigation.quoteChecks,1);
            assert.equal(actual.navigation.invoiceChecks,guard==='quote'?0:1);
            assert.equal(actual.navigation.resets,0);
            assert.equal(await guardPage.getByRole('menu', {name:'Account menu'}).isVisible(),true);
            records.push({engine,name:'existing_'+guard+'_leave_guard_preserved',passed:true});
          } catch(error) {records.push({engine,name:'existing_'+guard+'_leave_guard_preserved',passed:false,error:error.message});}
          finally {await guardPage.close();}
        }
      }
      if (!layerOnly && !focusOnly && !footerOnly) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.route('**/*', (route) => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
      try {
        await page.goto(origin + '/');
        await page.getByRole('button', { name: 'Account', exact: true }).click();
        await page.setViewportSize({ width: 320, height: 360 });
        await page.getByRole('button',{name:'More',exact:true}).click();
        const menu = page.getByRole('menu', { name: 'Account menu' });
        await page.waitForTimeout(250);
        const box = await menu.boundingBox();
        assert.ok(box.x >= 7 && box.x + box.width <= 313 && box.y >= 7 && box.y + box.height <= 353);
        await page.getByRole('menuitem', { name: 'Sign out', exact: true }).focus();
        await page.keyboard.press('Escape');
        await menu.waitFor({ state: 'detached', timeout: 1000 });
        if (await page.getByRole('button', {name:'Account',exact:true}).isVisible()) assert.equal(await page.getByRole('button', { name: 'Account', exact: true }).evaluate((el) => el === document.activeElement), true);
        assert.equal(await page.evaluate(() => window.__accountResult.signOutCalls), 0);
        records.push({ engine, name: 'open_menu_live_resize_and_escape_focus', passed: true });
      } catch (error) { records.push({ engine, name: 'open_menu_live_resize_and_escape_focus', passed: false, error: error.message }); }
      finally { await page.close(); }
      }
      if (!focusOnly && !footerOnly) {
      const modalPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await modalPage.route('**/*', (route) => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
      try {
        await modalPage.goto(origin + '/');
        await modalPage.getByRole('button', { name: 'Account', exact: true }).click();
        const coveredByModal = await modalPage.getByRole('menuitem', { name: 'Sign out', exact: true }).evaluate((button) => {
          const modal = document.createElement('div');
          modal.id = 'existing-modal-layer';
          Object.assign(modal.style, { position: 'fixed', inset: '0', zIndex: '1000', background: 'white' });
          document.getElementById('root').append(modal);
          const box = button.getBoundingClientRect();
          return document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2) === modal;
        });
        assert.ok(coveredByModal, 'account popup must stay below existing Dashboard modal layer1000');
        records.push({ engine, name: 'existing_modal_stays_above_account_popup', passed: true });
      } catch (error) { records.push({ engine, name: 'existing_modal_stays_above_account_popup', passed: false, error: error.message }); }
      finally { await modalPage.close(); }
      }
      if (!layerOnly && !footerOnly) {
      const focusPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await focusPage.route('**/*', (route) => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
      try {
        await focusPage.goto(origin + '/');
        const trigger = focusPage.getByRole('button', { name: 'Account', exact: true });
        await trigger.click();
        const item = focusPage.getByRole('menuitem', { name: 'Sign out', exact: true });
        await item.waitFor({ state: 'visible' });
        assert.equal(await item.evaluate((el) => el === document.activeElement), true, 'opening a portal menu must focus its action after becoming visible');
        await focusPage.keyboard.press('Escape');
        await focusPage.getByRole('menu', { name: 'Account menu' }).waitFor({ state: 'detached', timeout: 1000 });
        assert.equal(await trigger.evaluate((el) => el === document.activeElement), true);
        records.push({ engine, name: 'initial_visible_focus_and_escape_without_manual_focus', passed: true });
      } catch (error) { records.push({ engine, name: 'initial_visible_focus_and_escape_without_manual_focus', passed: false, error: error.message }); }
      finally { await focusPage.close(); }
      }
    } finally { await browser.close(); }
  }
  const result = { status: records.every((r) => r.passed) ? 'PASS_SCOPED_LOCAL_COMPONENT_BROWSER' : 'FAIL',
    at_utc: new Date().toISOString(), environment: 'LOCAL_SYNTHETIC_NO_AUTH_PROVIDER_NO_PRODUCTION',
    records, blocked_external_requests: blockedExternal, full_dashboard_or_hosted_acceptance: false,
    source_sha256: Object.fromEntries(['src/components/dashboard/Dashboard.js', 'src/app/styles/components.css', 'src/app/styles/layouts.css', ...(fs.existsSync(portalFile) ? ['src/components/dashboard/DashboardAccountMenu.js'] : [])]
      .map((n) => [n, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, n))).digest('hex')])),
    extracted_sign_out_sha256: crypto.createHash('sha256').update(signOut).digest('hex'),
  };
  if (output) fs.writeFileSync(path.join(output, 'browser-results.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
  if (!records.every((r) => r.passed)) process.exitCode = 1;
}
await new Promise((resolve) => server.close(resolve));
fs.rmSync(work, { recursive: true, force: true });
