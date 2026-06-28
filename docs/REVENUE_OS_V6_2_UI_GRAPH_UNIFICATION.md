# Revenue OS v6.2 UI Graph Unification

Corvioz v6.2 moves the dashboard from a hybrid SaaS UI into a Stripe-style Graph Renderer.

## Contract

- UI is a pure render engine.
- Dashboard UI components do not compute business state.
- Dashboard UI components do not accept raw domain records.
- UI Graph is the single source of truth for dashboard rendering.
- Dashboard is a deterministic renderer of `getDashboardUI(data)`.

## Boundaries

No changes are required in:

- Kernel
- Orchestrator
- Revenue Engine

The UI layer consumes the graph produced by `src/core/ui/GET_DASHBOARD_UI.ts`.

## Forbidden In Dashboard

- Raw `quotes`, `invoices`, or `leads` component props.
- `.filter()` or `.reduce()` business logic.
- Direct status inference for invoices, quotes, or leads.
- Local next-action calculation.
- Local revenue impact calculation.

## Required Flow

```txt
workspace data
  -> getDashboardUI(data)
  -> dashboardUI graph
  -> DashboardOverview pure render
```

## Dashboard Graph Shape

```txt
dashboardUI = {
  header,
  revenueUI,
  leadsUI,
  invoicesUI,
  quotesUI,
  activityUI,
  onboardingUI,
  actionsUI,
  emptyStateUI
}
```

## Enforcement

`src/core/ui/UI_GRAPH_ENFORCER.ts` blocks dashboard regressions by detecting:

- raw domain props
- `.filter()` / `.reduce()` usage
- direct domain object access keywords
- local `getNextBestAction` logic

`scripts/validate-launch-system.ts` runs the UI Graph Only Rule as part of launch validation.
