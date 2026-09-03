# PDF Runtime Tests

The contract test directly invokes `getDashboardPdfExportDecision()` with each current plan's entitlement result and asserts:

- Free: PDF allowed, clean branding false, watermark present;
- Starter: PDF allowed, clean branding true, watermark absent;
- Pro: PDF allowed, clean branding true, watermark absent.

The Dashboard export callback passes the clean-branding decision to PDF generation. The final production build also compiled this path successfully.
