# Corvioz Sidebar Icon Semantic Fix Report

Date: 2026-06-20

## Scope

Reviewed the dashboard sidebar navigation icons and fixed only the ambiguous icon mapping for Clients and Client Portal.

## Changes

- `Clients` now uses a group/users outline icon, matching the SaaS convention for a client list or account group.
- `Client Portal` now uses a portal/door-entry outline icon instead of reusing the group/users icon.

## Constraints Confirmed

- No layout changes.
- No text changes.
- No navigation order changes.
- No route changes.

## Files Changed

- `src/app/dashboard/DashboardClient.js`
- `corvioz-sidebar-icon-fix-report.md`

## Result

The sidebar now separates the two concepts visually:

- `Clients` = multiple client records.
- `Client Portal` = external portal entry/access.
