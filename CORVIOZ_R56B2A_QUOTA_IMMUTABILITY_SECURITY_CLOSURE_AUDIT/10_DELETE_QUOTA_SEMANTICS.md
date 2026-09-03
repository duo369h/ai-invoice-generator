# Delete quota semantics

Deletion removes only the business document. Because `document_usage_events.document_id` is intentionally not an FK to Quote/Invoice, the corresponding creation event remains. The next creation sees the unchanged event count and cannot bypass Free=5, Starter=30, Pro=100, or the combined Pro 60Q+40I limit.
