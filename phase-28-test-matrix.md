# SmartProcure — Phase 28 Test Matrix

## Roles vs Features Tested

| Feature Subsystem | Farmer | Shop Owner | Machinery Owner | Procurement Officer | Delivery Partner | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Authentication & Registration** | ✅ | ✅ | ➖ | ➖ | ➖ | ➖ |
| **Marketplace Catalog (CRUD)** | ❌ | ✅ | ➖ | ➖ | ➖ | ➖ |
| **Shopping Cart & Checkout** | ✅ | ❌ | ➖ | ➖ | ➖ | ➖ |
| **Order Tracking** | ✅ | ✅ | ➖ | ➖ | ➖ | ➖ |
| **Procurement Scheduling** | ✅ | ➖ | ➖ | ✅ | ➖ | ➖ |
| **Procurement Transactions** | ✅ | ➖ | ➖ | ✅ | ➖ | ➖ |
| **Machinery Discovery & Rental** | ✅ | ➖ | ✅ | ➖ | ➖ | ➖ |
| **Machinery Booking Approvals** | ✅ | ➖ | ✅ | ➖ | ➖ | ➖ |
| **Delivery Assignment** | ➖ | ➖ | ➖ | ➖ | ✅ | ➖ |
| **Delivery State Machine** | ✅ | ✅ | ✅ | ➖ | ✅ | ➖ |
| **Real-time Notifications** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Advanced Analytics** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Profile & Address Mgmt** | ✅ | ➖ | ➖ | ➖ | ✅ | ➖ |
| **Maps & Geolocation** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Tenant Isolation (IDOR Checks)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Legend
* ✅ : Fully Tested & Verified via Integration Scripts
* ❌ : Tested & Correctly Rejected (Role Authorization)
* ➖ : Not Applicable for this Role

## Coverage Gaps Identified

The integration test suite was heavily augmented during Phase 28 to backfill coverage on legacy systems (Phases 1-10). While coverage is strong for database transactional safety, we explicitly note the following gap:

* **E2E Browser Testing:** Skipped due to network restrictions downloading browser binaries (`@playwright/test` timed out). The UI components rely strictly on the tested backend API.
