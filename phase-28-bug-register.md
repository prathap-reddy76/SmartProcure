# SmartProcure — Phase 28 Bug Register

This document tracks bugs and regressions discovered during the Phase 28 Quality Engineering process.
If bugs were discovered, they are logged here with their resolution status.

## Test Infrastructure Bugs

| ID | Component | Description | Root Cause | Resolution | Status |
|---|---|---|---|---|---|
| B-28-001 | Test Runner (Auth/Marketplace) | Missing slug on Shop/Product/Category | Legacy test scripts lacked required fields added in recent schemas. | Added string interpolations and generated unique slugs. | RESOLVED |
| B-28-002 | Test Runner (Orders) | Nested `create` failing on Cart | Cannot connect existing products via IDs in nested writes. | Rewrote test logic to construct cart items explicitly using `connect`. | RESOLVED |
| B-28-003 | Test Runner (Machinery) | Unauthorized error during `createMachineryListing` | Phase 27 hardened the server actions to drop the direct `testUserId` parameter in favour of a `process.env.TEST_AUTH_USER_ID` based `getEffectiveUserId()` but test script still passed arguments directly. | Updated integration test runner (`run-all-tests.ts`) to inject `NODE_ENV=test`, properly setting the environment for `getEffectiveUserId(testUserId)`. | RESOLVED |

## Application Bugs (Logic / Regressions)

Extensive integration testing verified the backend logic. No regressions or authorization bypasses were found. Phase 27 successfully hardened the backend without breaking operational flows.

* **Status:** 0 functional regressions detected.
* **IDOR Status:** 0 regressions detected (All cross-tenant mutations correctly rejected).

*Note: E2E Browser testing was aborted due to network timeout limitations downloading Playwright binaries. Backend database integration scripts were executed instead.*
