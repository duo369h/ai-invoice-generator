# Action Authority Matrix

| Surface state | Primary action | Exact target / authority |
|---|---|---|
| Draft Quote | Open quote | openQuotes, exact Quote ID |
| Sent Quote | Open quote | openQuotes, exact Quote ID |
| Approved Quote | Create invoice | createInvoiceFromQuote, exact Quote ID, POST invoice-draft |
| Past-due Invoice | Open invoice | openInvoices, exact Invoice ID |
| Partial Invoice | Open invoice | openInvoices, exact Invoice ID |
| Unpaid Invoice | Open invoice | openInvoices, exact Invoice ID |
| Create Quote | Create Quote | canonical Dashboard create flow |
| Create Invoice | Create Invoice | canonical Dashboard create flow |
| Record Payment | Record payment | canonical Invoice payment API/RPC |
| Export PDF | Export PDF | canonical branded PDF export |

The executable map is CORE_DASHBOARD_ACTION_AUTHORITY.
