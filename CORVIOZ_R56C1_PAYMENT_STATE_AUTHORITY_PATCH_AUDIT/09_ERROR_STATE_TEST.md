# Error State Test

The existing R56C stale-data runtime test remains passing. The new R56C1 source contract verifies separate invoicesError and quotaError props, the Payment unavailable path, the stale Payment disclosure, and the existing retryDashboard action.

Results:

- PAYMENT_STALE_DISCLOSURE=PASS
- PAYMENT_ERROR_EMPTY_FALSE_ZERO=PASS
- QUOTA_ERROR_FALSE_CURRENT=NO
