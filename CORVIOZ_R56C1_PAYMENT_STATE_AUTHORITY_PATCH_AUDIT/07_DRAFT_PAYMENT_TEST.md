# Draft Payment Test

The explicit R56C1 test verifies:

- Draft unpaid USD 20000 -> eligible invoiceCount 0, paid 0, outstanding 0, needs payment 0.
- The same row with status sent -> invoiceCount 1, outstanding 20000, needs payment 1.
- Mixed draft/unpaid/partial/paid fixture -> eligible invoiceCount 3, paid 35000, outstanding 25000, needs payment 2.

Result: DRAFT_INVOICE_PAYMENT_EXCLUDED=PASS.
