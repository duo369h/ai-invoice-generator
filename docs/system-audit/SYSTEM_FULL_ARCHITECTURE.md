# SYSTEM_FULL_ARCHITECTURE.md — Corvioz Final Snapshot

## 1. Complete System Layer Map
1. **Decision Layer (v4/authority):** Defines semantic design tokens and pricing bounds.
2. **Global CSS & Reset Layer (base & tokens):** Translates design values to custom variables.
3. **Layout & Grid Layer (layouts.css):** Governs structural page containers.
4. **Component Layer (components.css):** Standardizes visual components.
5. **Logic / React Layer (page.js):** Standardizes UI rendering.

## 2. UI / Decision / Revenue / Kernel Relationships
```
[User Session & Usage] (Supabase Auth / LocalStorage)
          |
          v
[globalOrchestrator] (Resolves AppState)
          |
          v
[CorviozKernel] (Resolves Copy, Trust, Layout Variables)
          |
          v
[UnifiedDecisionEngine] (Maps Metrics to Card badges & Banner states)
          |
          v
[Pure UI Layer] (page.js components render computed values)
```
