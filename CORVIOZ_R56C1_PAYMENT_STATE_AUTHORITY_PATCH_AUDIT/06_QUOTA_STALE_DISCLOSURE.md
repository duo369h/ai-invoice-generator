# Quota Stale Disclosure

useDashboardData now exposes quotaError from the authoritative /api/user resource. On user/quota failure, the Dashboard passes quotaError separately to DashboardOverview. The Usage card shows Usage unavailable and Retry when that resource fails, rather than presenting a prior quota value as current.

No zero is guessed and no local Quote/Invoice count becomes quota authority. R56B2A's immutable server usage and Free/Starter/Pro limits remain unchanged.
