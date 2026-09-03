# Absorption Ledger

This ledger tracks how the accepted knowledge is related to current and future Corvioz product work. Ledger status does not grant implementation or runtime authority.

Allowed statuses: `CAPTURED`, `PARTIALLY_ABSORBED`, `ABSORBED`, `DEFERRED`, `REJECTED`.

| Knowledge identifier | Status | Current absorption | Next consumer / decision |
|---|---|---|---|
| `BRIEF_IS_NOT_SCOPE` | PARTIALLY_ABSORBED | Photography Scope V2 | Photography Template Usability |
| `QUANTIFY_BEFORE_FINAL_QUOTE` | CAPTURED | Knowledge only | Future Quote intelligence decision |
| `REQUIREMENT_CREATES_DEPENDENCIES` | CAPTURED | Knowledge only | Photography Template Usability |
| `INTERNAL_DETAIL_AND_CLIENT_PRESENTATION_ARE_DIFFERENT_CONCERNS` | CAPTURED | Knowledge only | Future Quote presentation decision |
| `CLIENT_REQUIREMENT_AND_AI_RECOMMENDATION_MUST_BE_SEPARATED` | PARTIALLY_ABSORBED | R55D authority separation | Intelligence UI polish |
| `USAGE_IS_PART_OF_COMMERCIAL_SCOPE` | PARTIALLY_ABSORBED | Usage remains a separate business variable | Future authorized integration |
| `SCOPE_CHANGE_REQUIRES_COMMERCIAL_REVIEW` | CAPTURED | Knowledge only | Future Scope Change decision |
| `PERSONAL_HISTORY_IS_MORE_TRUSTWORTHY_THAN_FAKE_MARKET_AVERAGES` | DEFERRED | Not implemented | Personal Pricing Intelligence |
| `REGIONAL_RULES_MATTER` | DEFERRED | Not implemented | Regional Knowledge Layer |
| `INTERNAL_BUDGET` | CAPTURED | Knowledge only | Future design track |
| `CLIENT_PRESENTATION_GROUPING` | CAPTURED | Knowledge only | Future Quote presentation decision |
| `BRIEF_MATURITY` | CAPTURED | Knowledge only | Photography Template Usability |
| `PRELIMINARY_ESTIMATE` | CAPTURED | Knowledge only | Future Quote intelligence decision |
| `ESTIMATE_VERSION_HISTORY` | CAPTURED | Knowledge only | Future Scope/Estimate decision |
| `SCOPE_DELTA_TRACKING` | CAPTURED | Knowledge only | Future Scope Change decision |
| `REQUIREMENT_DEPENDENCY_COST` | CAPTURED | Knowledge only | Photography Template Usability |
| `PRODUCTION_COMPLEXITY` | CAPTURED | Knowledge only | Future Production intelligence decision |
| `EVENT_SERVICE_MODE` | CAPTURED | Knowledge only | Future Event workflow decision |
| `KNOWN_VS_UNKNOWN_BUDGET` | CAPTURED | Knowledge only | Future Quote intelligence decision |
| `USAGE_LICENSING` | PARTIALLY_ABSORBED | Usage remains a separate business variable | Future authorized integration |
| `ESTIMATE_BID_QUOTE_SEMANTIC_DIFFERENCE` | CAPTURED | Knowledge only | Future commercial model decision |
| `PRICE_OBJECTION_DIAGNOSIS` | CAPTURED | Knowledge only | Future negotiation intelligence decision |
| `REVISION_VS_ADDITIONAL_POST_VS_RESHOOT` | CAPTURED | Knowledge only | Future Scope Change decision |
| `APPROVAL_TYPES` | CAPTURED | Knowledge only | Future approval workflow decision |
| `PRODUCTION_TIME_COMPONENTS` | CAPTURED | Knowledge only | Future production model decision |
| `OVERTIME_STRUCTURE` | CAPTURED | Knowledge only | Future commercial model decision |
| `PERSONAL_PRICING_BASELINE` | DEFERRED | Not implemented | Personal Pricing Intelligence |
| `REGIONAL_KNOWLEDGE_LAYER` | DEFERRED | Not implemented | Regional Knowledge Layer |
| `REGIONAL_MARKET_PRICING` | DEFERRED | Not implemented | Regional Knowledge Layer |
| `AUTONOMOUS_PRICE_ENGINE` | REJECTED | No autonomous market pricing | Remains prohibited unless separately authorized |
| `GLOBAL_SINGLE_PRICING_RULEBOOK` | REJECTED | No global hardcoded pricing rulebook | Remains prohibited |
| `GLOBAL_DEFAULT_ONE_YEAR_USAGE` | REJECTED | No universal usage duration | Remains prohibited |
| `FIXED_PERPETUAL_LICENSE_PERCENTAGE` | REJECTED | No fixed universal license percentage | Remains prohibited |
| `UNIVERSAL_CREW_THRESHOLD` | REJECTED | No universal staffing threshold | Remains prohibited |
| `UNIVERSAL_EVENT_STAFFING_RULE` | REJECTED | No universal event staffing rule | Remains prohibited |
| `CLIENT_QUOTE_ALWAYS_AGGREGATED` | REJECTED | Client disclosure remains configurable | Remains prohibited |
| `AUTONOMOUS_MARKET_PRICE` | REJECTED | No autonomous market price | Remains prohibited |
| `LLM_AS_PRICE_SOURCE_OF_TRUTH` | REJECTED | LLM does not own business truth | Remains prohibited |
| `AUTOMATIC_LEGAL_DECISION` | REJECTED | No automatic legal decision | Remains prohibited |

## Interpretation

- `CAPTURED` means the concept is recorded as a design input only.
- `PARTIALLY_ABSORBED` means an explicitly named current product boundary exists, but the full concept is not implemented.
- `DEFERRED` means the concept is retained for future evaluation.
- `REJECTED` means the assumption or direction is explicitly prohibited from being hardcoded.
- `ABSORBED` is available for future use; no item in this package is claimed as fully absorbed.
