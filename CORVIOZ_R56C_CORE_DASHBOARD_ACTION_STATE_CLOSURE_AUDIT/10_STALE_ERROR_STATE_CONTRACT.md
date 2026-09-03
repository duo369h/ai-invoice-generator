# Stale / Error State Contract

Quote and Invoice HTTP failures use clearOnHttpError: false, preserving the last-known-good collection. Each resource records its own error. Dashboard Overview receives the aggregate dashboardDataError || quotesError || invoicesError and retains a retry action.

The runtime test simulates simultaneous 503 responses and verifies that neither collection is cleared, both errors are disclosed, and stale mode remains renderable.
