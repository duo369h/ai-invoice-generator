# Internal Route Runtime

Authenticated local production-mode direct requests passed:

- `/dashboard/control-plane` -> 307 `/dashboard`
- `/dashboard/evolution` -> 307 `/dashboard`
- `/dashboard/early-access` -> 307 `/dashboard`

INTERNAL_ROUTE_RUNTIME=PASS
INTERNAL_PAGE_EXPOSURE=NO

The runtime check found that the effective root middleware still returned 404 for two routes and omitted early-access from the same boundary. The narrow correction aligned the effective middleware with the R56D redirect contract.
