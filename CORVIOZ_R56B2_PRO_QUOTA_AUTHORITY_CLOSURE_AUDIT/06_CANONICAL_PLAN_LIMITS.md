# Canonical Plan Limits

`src/core/state/documentQuota.js` is the single source-level definition:

```text
free=5
starter=30
pro=100
agency/studio=null (legacy compatibility / no current public quota authority)
```

The helper is consumed by entitlements and server quota metadata. Pro never receives `Infinity`, `NULL`, or a zeroed usage value from the current helper.
