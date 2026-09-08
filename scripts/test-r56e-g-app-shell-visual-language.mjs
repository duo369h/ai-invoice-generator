import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dashboard = readFileSync('src/components/dashboard/Dashboard.js', 'utf8');
const layouts = readFileSync('src/app/styles/layouts.css', 'utf8');
const components = readFileSync('src/app/styles/components.css', 'utf8');

assert.match(dashboard, /dashboard-sidebar-nav-item/);
assert.match(dashboard, /dashboard-create-quote-action/);
assert.match(dashboard, /dashboard-sidebar-account-action/);
assert.match(dashboard, /dashboard-sidebar-plan-action/);

assert.match(components, /\.dashboard-sidebar-nav-item\.is-active/);
assert.match(components, /border-left:\s*2px solid/);
assert.doesNotMatch(components, /\.dashboard-sidebar-nav-item\.is-active[\s\S]{0,500}box-shadow:\s*0\s/);
assert.match(components, /\.dashboard-create-quote-action/);
assert.match(components, /\.dashboard-sidebar-account-action/);
assert.match(components, /\.dashboard-sidebar-plan-action/);
assert.match(components, /\.dashboard-sidebar-feedback/);

assert.match(layouts, /\.professional-back[\s\S]{0,800}font-weight:\s*400/);
assert.match(layouts, /\.professional-preview-action[\s\S]{0,800}background:\s*transparent/);
assert.match(layouts, /\.professional-primary-action[\s\S]{0,800}box-shadow:\s*0 1px 2px/);
assert.doesNotMatch(layouts, /\.professional-primary-action[\s\S]{0,800}box-shadow:\s*0 [7-9]px/);
assert.match(layouts, /\.professional-editor-title > span[\s\S]{0,300}font-size:\s*0\.72rem/);

console.log('R56E-G APP SHELL VISUAL LANGUAGE CONTRACT: PASS');
