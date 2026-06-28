# Pricing Intelligence Engine v1

## Core Principles

The Pricing Intelligence Engine is an isolated pricing estimation and risk assessment engine. It is designed to optimize quote values, upsell opportunities, and manage risk dynamically based on project parameters.

1. **Deterministic Calculation**: Calculations are based on deterministic base prices multiplied by client, urgency, and clarity multipliers. Hardcoding final prices without multiplier logic is forbidden.
2. **Strict Isolation**: The pricing engine does not import UI code and has no dependencies on UI components or pages. It remains 100% testable in headless node environments.
3. **Consolidated Integrations**:
   - **Proposal Generation API**: Estimating optimized prices and upsells during proposal scoping.
   - **Quote Generation API**: Recommending milestone rates dynamically.
   - **Invoice Generation API**: Reusing pricing recommendation layers during invoice parses.
