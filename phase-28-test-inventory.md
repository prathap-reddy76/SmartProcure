# Phase 28 Test Inventory

## Existing Tests

| Area | Existing Tests | Missing Coverage | Priority |
| ---- | -------------- | ---------------- | -------- |
| Auth & Profiles | None | Registration, Login, Profile creation, RBAC checks | High |
| Marketplace (Shop) | None | Product creation, Stock update, Order lifecycle | High |
| Procurement Booking | `test-phase11.ts` | Complete | Medium |
| Procurement Weighing | `test-phase12.ts` | Complete | Medium |
| Quality Inspection | `test-phase13.ts` | Complete | Medium |
| Procurement Payment | `test-phase14.ts` | Complete | Medium |
| Finance/Reconciliation | `test-phase15.ts` | Complete | Medium |
| Notifications | `test-phase16.ts` | Complete | Medium |
| Maps & Location | `test-phase17.ts` | Complete | Medium |
| Market Prices | `test-phase18.ts` | Complete | Medium |
| Weather | `test-phase19.ts` | Complete | Medium |
| AI Chat/Tools | `test-phase22.ts` | Security checks against AI identity overriding | High |
| Real-time SSE | `test-phase23.ts` | Complete | Medium |
| Machinery Marketplace | `test-phase24.ts` | Complete | Medium |
| Logistics/Delivery | `test-phase25.ts` | Complete | Medium |
| Analytics | `tests/test-phase26.ts` | Complete | Medium |
| Security Regression | None | Phase 27 IDOR tests | High |
| E2E/Browser | None | Complete End-to-End flow via UI | High |

## Plan
1. Validate existing integration tests sequentially.
2. Develop a comprehensive test script for `Auth`, `Profiles`, and `Marketplace` (Phase 1-10 features).
3. Introduce minimal automated tests for Security Regression (Phase 27).
4. Integrate a Playwright suite for Browser E2E Testing for the highest priority workflows.
5. Validate Database integrity and performance issues manually and through targeted scripts.
