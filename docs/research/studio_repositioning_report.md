# Corvioz Studio Repositioning Report v1.5

This report outlines the structural repositioning of the **Studio Space** tier, shifting it from a "feature list upgrade" to an "operational scale center".

---

## 1. Paradigm Shift

| Old Positioning (Pro Upgrade) | New Positioning (Studio Space Command Center) |
| :--- | :--- |
| Focuses on individual feature limits (e.g. number of templates, PDF options). | Focuses on multi-client relationship operations, overdue accounts logs, and team/agency projections. |
| Felt like a pricing penalty for power users. | Feels like an operational upgrade for professionals who are successfully growing their client list. |
| Evaluated by technical feature checkboxes. | Evaluated by workflow convenience and administrative time savings. |

---

## 2. Repositioned Workspace Features

The **Service Business Studio** workspace has been aligned to represent a control tower for active business metrics:

1. **Client Status Board (Pipeline)**
   - Maps active quotes, pending invoices, active projects, and overdue status into a visual CRM pipeline.
   - Highlights client lifecycle states: Inbound lead $\rightarrow$ Proposal Sent $\rightarrow$ Active Project $\rightarrow$ Overdue Collection.

2. **Client Tracking Directory**
   - Renders a list of relationships sorted by Life Time Value (LTV).
   - Displays real-time unpaid balance aggregations and relationship health indicators.

3. **Overdue Tracker**
   - Automatically surfaces invoices past their due date.
   - Calculates key metrics such as "Avg Days Overdue" to monitor billing efficiency.

4. **Follow-up Reminders Center**
   - Couples directly with our `/api/invoices/remind` endpoint.
   - Selects soft, firm, or urgent reminder email copy tailored to invoice details and days past due, allowing direct communication from the app.

---

## 3. Premium Studio Preview Banner Design

To maintain a premium, behavior-driven monetization experience, the Studio space under preview displays a modern top-bar banner. 

- **Styling**: Glassmorphism using standard dashboard CSS tokens. A semi-transparent purple/indigo backdrop (`rgba(79, 70, 229, 0.15)`) with a blur filter and subtle borders.
- **Messaging**: "Studio Command Center Preview Active — As your client operations scale past a single relationship, the Studio Space unlocks to provide centralized status tracking, overdue intelligence, and automated reminder sequences."
- **CTA**: "Unlock Studio Plan" triggers the payment modal redirecting to the $29/mo tier.
