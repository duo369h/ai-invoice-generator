# PDF Export Business Context Model

This document specifies the expanded telemetry data model and workflow for PDF exports in Corvioz. Rather than simple operation counts, exports now capture explicit business intent and client relationship parameters.

## 1. Context Payload Specifications

Every `export_attempt` telemetry payload now includes the following parameters:

| Field Name | Type | Value Options / Source | Description |
| :--- | :--- | :--- | :--- |
| `purpose` | `string` | `'draft'`, `'client send'`, `'final invoice'`, `'revision export'` | Selected by the user in the pre-export modal. |
| `sent_to_client` | `boolean` | `true` or `false` | Indicates whether this specific export is intended for the client. |
| `client_context_id` | `string` | Database `client_id` or Client Name/Email | Links the export to a specific client record in the database. |
| `follow_up_state` | `string` | Current document `status` (e.g. `'pending'`, `'paid'`, `'overdue'`) | Captures the stage of the document at the time of export. |
| `document_type` | `string` | `'quote'` or `'invoice'` | Identifies whether a quote proposal or invoice is being exported. |
| `watermark_free` | `boolean` | `true` (Pro/Studio) or `false` (Free) | Indicates if the clean PDF generation is active. |

## 2. Export Workflow Diagram

Below is the sequence of user options and telemetry dispatches:

```mermaid
graph TD
    A[User clicks 'Export PDF'] --> B{Is Preview Mode?}
    B -- Yes --> C[Download PDF Immediately]
    B -- No --> D[Show 'Specify Export Context' Modal]
    D --> E[User selects Purpose & toggles Sent to Client]
    E --> F[Click 'Confirm & Export']
    F --> G[Extract client_context_id & follow_up_state]
    G --> H[Emit 'export_attempt' Event with payload]
    H --> I[Trigger PDF Download]
    I --> J{Is Free plan?}
    J -- No --> K[Export Clean PDF - Complete]
    J -- Yes --> L{Check Export Count}
    L -- Count = 1 --> M[Show watermark tip]
    L -- Count = 2 --> N[Open Upsell Modal]
    L -- Count >= 3 --> O[Show Export Gate Modal]
```
