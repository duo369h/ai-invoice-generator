# Payment Stale Disclosure

DashboardOverview receives invoicesError separately from the overall document error. With cached non-Draft Invoice data, the Payments card keeps the summary and shows “Payment data may be out of date.” with the existing Retry action.

With Invoice refresh failure and no eligible cached Invoice data, the card shows “Payment status unavailable” and Retry instead of “No invoice payments yet.”

Quote refresh errors do not drive the Payments card state.
