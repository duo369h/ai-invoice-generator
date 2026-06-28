# Revenue OS v6.9 — Growth Rebalance

## Core Principles

The growth and presentation layer is rebalanced to support bounded local mutations and signal-only feedback loops, maintaining the strict stability of the central Control Plane.

1. **Stable Control Plane**: The core pipeline of `Signal` → `Intent` → `Governance` → `Execution Decision` → `Composer` remains the single point of truth.
2. **Bounded Local Mutation**: Mutations are restricted to the section-level scope via the **Local Mutation Authority** (`UI_LOCAL_MUTATION_AUTHORITY.ts`). Global layout rewrites or unauthorized section rearrangement are forbidden.
3. **Signal-Only Feedback Loop**: The Feedback Loop is isolated from the UI graph directly. Telemetry events only adjust signal weights and metrics via the **Feedback Signal Bridge** (`UI_FEEDBACK_SIGNAL_BRIDGE.ts`).
4. **Light Decision Composer**: The Composer (`UI_GRAPH_COMPOSER.ts`) is upgraded to a light decision renderer that supports priority hints, emphasis weights, and soft section reordering, while remaining free of filter operations and data transformations.
