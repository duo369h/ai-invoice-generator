# Function privilege before / after

Before R56B2A, R56B2's forward migration had re-granted `get_user_active_document_cycle(UUID)` to `authenticated`. R56B2A explicitly revokes PUBLIC, anon, and authenticated for the cycle function and both atomic creation RPCs, then grants service_role only.

The new `get_user_document_usage(UUID)` read RPC follows the same service-only boundary. Sandbox introspection after migration returned false for PUBLIC/anon/authenticated and true for service_role for all four functions.
