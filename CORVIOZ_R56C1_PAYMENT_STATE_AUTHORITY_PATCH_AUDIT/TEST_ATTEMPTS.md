# Test Attempts

1. R56C1 red test was run before the implementation and failed at Draft Invoice exclusion: actual eligible invoiceCount was 1, expected 0.
2. After implementation, the first test revision used a case-sensitive check for “May be out of date” while the UI copy was the equivalent lowercase sentence. The test was corrected to a case-insensitive contract check; no product behavior was weakened.
3. Final R56C1 and R56C regression tests passed.

No failure was hidden or converted into success.
