import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const layouts = readFileSync('src/app/styles/layouts.css', 'utf8');
const components = readFileSync('src/app/styles/components.css', 'utf8');

const topbar = layouts.slice(layouts.indexOf('.professional-editor-header'), layouts.indexOf('.professional-back,', layouts.indexOf('.professional-editor-header')));
assert.match(topbar, /background:\s*#fff/);
assert.doesNotMatch(topbar, /rgba\(255,\s*255,\s*255,\s*0\.88\)/);
assert.match(topbar, /border-bottom:\s*1px solid rgba\(17,\s*24,\s*39,\s*0\.1[0-9]\)/);

const primary = layouts.slice(layouts.indexOf('.professional-primary-action {'), layouts.indexOf('.professional-primary-action:hover', layouts.indexOf('.professional-primary-action {')));
assert.match(primary, /border:\s*1px solid var\(--primary-hover\)/);
assert.match(primary, /background:\s*var\(--primary\)/);
assert.match(primary, /box-shadow:\s*0 1px 2px/);
assert.doesNotMatch(primary, /background:\s*#5e57c2/);

assert.match(components, /\.dashboard-sidebar-nav-item\.is-active[\s\S]{0,180}font-weight:\s*560/);
assert.match(components, /\.dashboard-sidebar-nav-item\.is-active[\s\S]{0,220}border-left-color:\s*var\(--primary/);
assert.match(components, /\.dashboard-sidebar-nav-item \.dashboard-sidebar-nav-icon[\s\S]{0,120}color:\s*#5f6b7a/);
assert.match(components, /\.dashboard-sidebar-account-action[\s\S]{0,260}color:\s*#5f6b7a/);
assert.match(layouts, /\.professional-back[\s\S]{0,180}color:\s*#536072/);
assert.match(layouts, /\.professional-preview-action[\s\S]{0,160}color:\s*#536072/);

console.log('R56E-G APP SHELL VISUAL LANGUAGE FIX1 CONTRACT: PASS');
