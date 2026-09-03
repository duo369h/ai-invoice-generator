# Server Quota Helper

`getDocumentQuota` now resolves the canonical limit, resolves the real subscription cycle for Pro, counts current-cycle Quote and Invoice rows, and reports `documentsUsed=quotesUsed+invoicesUsed`. For Pro it returns `documentsLimit=100` and `documentsAllowed=totalUsed < 100`.

Atomic helper metadata for Quote, Invoice, and approved Quote→Invoice conversion uses the same canonical limit. Quota errors are neutral finite-limit messages; they do not promise unlimited access or inject a Studio upgrade promise.
