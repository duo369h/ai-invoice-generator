# Server quota-read authority

`getDocumentQuota` no longer counts live Quote or Invoice rows. It calls the service-only `get_user_document_usage(UUID)` RPC and maps its immutable `quotes_used`, `invoices_used`, and cycle fields into the existing compatibility response shape.

The `/api/user` route now obtains a service client for this read. Invoice UX precheck also uses the service client when available; authoritative Invoice creation remains the service-backed atomic RPC. No browser role receives direct ledger access.
