# PDF Branding Correction

Current contract:

| Plan | `export_pdf` | `pdf_branding` | Watermark |
|---|---:|---|---|
| Free | true | branded | yes |
| Starter | true | clean | no |
| Pro | true | clean | no |

Dashboard state preserves `pdf_branding`. The export path uses separate `canExportPdf` and `hasCleanPdf` decisions; it no longer derives plan or clean-PDF authority from `export_pdf || client_portal`.
