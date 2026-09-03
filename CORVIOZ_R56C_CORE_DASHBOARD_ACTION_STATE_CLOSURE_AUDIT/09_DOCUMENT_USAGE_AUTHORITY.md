# Document Usage Authority

The Overview consumes user.quota supplied by /api/user. R56B2A's server quota helper reads immutable usage through get_user_document_usage; the UI only projects that result.

Free, Starter, and Pro limits are therefore displayed as server-provided documentsUsed / documentsLimit (5, 30, and 100 under the active plan authority). Missing, invalid, or unavailable quota renders Usage unavailable; it never guesses zero and never blocks creation client-side.
