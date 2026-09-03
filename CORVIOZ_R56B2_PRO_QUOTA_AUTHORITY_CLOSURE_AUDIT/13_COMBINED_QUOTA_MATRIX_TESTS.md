# Combined Quota Matrix

```text
Free:    4 -> allow, 5 -> block
Starter: 29 -> allow, 30 -> block
Pro:     99 -> allow, 100 -> block
Pro mixed 60Q+39I=99: next -> allow; then 60Q+40I=100 -> block
Pro 0Q+100I: next -> block
Pro 100Q+0I: next -> block
```

`scripts/test-combined-quota-boundary-r1.mjs` passed all cases using the same Quote/Invoice helper boundary.
