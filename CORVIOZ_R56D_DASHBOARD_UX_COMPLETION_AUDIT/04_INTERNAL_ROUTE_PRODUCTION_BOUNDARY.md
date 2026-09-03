# Internal route production boundary

`src/middleware.js` covers all nine enumerated dashboard routes. In production, each is redirected to `/dashboard`; development access remains available for diagnostics. The matcher is a static literal array so Next 16 can recognize it during build.

CONTROL_PLANE_PRODUCTION_VISIBLE=NO
EVOLUTION_PRODUCTION_VISIBLE=NO
OPTIMIZATION_PRODUCTION_VISIBLE=NO
REVENUE_VALIDATION_PRODUCTION_VISIBLE=NO
SIMULATION_PRODUCTION_VISIBLE=NO
AUDIT_PRODUCTION_VISIBLE=NO
VALIDATION_PRODUCTION_VISIBLE=NO
PRODUCT_FUNNEL_PRODUCTION_VISIBLE=NO
EARLY_ACCESS_CLASSIFIED=INTERNAL_ONLY
