# Test attempts and recovery record

PATCH_TOOL_404_OCCURRED=YES
PATCH_TOOL_404_CAUSED_SOURCE_MUTATION=NO
EDIT_RECOVERY_METHOD=SUPPORTED_APPLY_PATCH_RETRY_SUCCEEDED

The prior controlled patch backend returned 404 twice before this resume; no source mutation or commit resulted. The supported patch path succeeded on resume. The first red-test attempt exposed a missing-file fixture issue, which was corrected without changing production source; the next run was properly red against the missing production boundary. A direct Node import of `next/server` was not used as runtime evidence because the local ESM resolver rejected the package subpath; the test was kept as source/build contract coverage.

The legacy R40 visual test was not used as a R56D pass/fail signal because its historical four-file allowlist rejects the authorized R56D Proposal API boundary change after all its visual assertions passed: `NOT_RUN_WITH_REASON=legacy allowlist conflicts with R56D changed file scope`. The existing exact-open browser test was rerun with its temporary local server and passed.

The first R56D build failed because the new middleware matcher used `.map(...)` inside an exported static config. Root-cause inspection of Next 16's local static extractor confirmed this; the matcher was expanded to literals and the final build passed.
