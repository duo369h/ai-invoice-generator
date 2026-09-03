# Debug UI production exclusion

Dashboard event diagnostics, export counters, and the existing debug overlay are guarded by `process.env.NODE_ENV === 'development'`. Production optimized rendering cannot expose those diagnostic controls.

PRODUCTION_DEBUG_UI_RENDERED=NO
