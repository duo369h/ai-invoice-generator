# Strict Review Defect

R56C review identified that derivePaymentProgressState counted Draft Invoices as active payment obligations. The correction uses the workflow document authority invoice.status === draft before reading payment truth.

The same review identified that the Payments card had no Invoice-specific stale/error disclosure and that a failed user/quota refresh could leave an old quota value visible without an explicit unavailable state.
