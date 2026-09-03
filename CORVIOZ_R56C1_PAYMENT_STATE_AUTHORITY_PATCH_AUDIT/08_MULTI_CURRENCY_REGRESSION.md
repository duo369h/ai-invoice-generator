# Multi-Currency Regression

A Draft EUR Invoice plus a sent USD Invoice produces one active USD group, not a multi-currency summary. Draft rows cannot create spurious currency groups.

Result: DRAFT_CURRENCY_GROUP_EXCLUDED=PASS and MULTI_CURRENCY_FALSE_SUM=NO.
