# UI_VS_LOGIC_BOUNDARY_AUDIT.md — Corvioz Final Snapshot

## 1. UI components containing business logic
*   `Dashboard.js` directly manages and sets raw local storage indicators (`corvioz_user_plan_${user.id}`) and checks overdue bill structures inline, bypassing clean hooks/controllers.
*   `UIComponents.js` embeds custom feature mapping rules (such as checking `variant === 'featured'` to render "MOST POPULAR" badges) instead of consuming properties calculated by the view model.

## 2. Pricing logic inside rendering layer
*   `layouts.css` media queries contain responsive rules targeting specific pricing card states rather than keeping structure separate from commercial rules.

## 3. Layout vs decision coupling
*   Components inside `UIComponents.js` contain hardcoded padding values and text sizes, overriding design system layout rules.
