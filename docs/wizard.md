
# What-If Wizard Architecture

This document outlines the architecture, rollout plan, and testing strategy for the Reverse-Squeeze "What-If" Wizard feature.

## 1. Architecture

The feature is built as an isolated route (`/wizard`) to minimize impact on the existing application. Its core components are:

- **UI Layer (`/app/wizard`)**: A set of React Server Components and Client Components that manage the multi-step user flow. State is managed client-side for immediate feedback.
- **Math Engine (`/lib/profit-engine.ts`)**: A single, pure TypeScript module that contains all business logic for profit calculations. It is shared between the client and the backend to ensure consistency. It performs no rounding.
- **Formatting Layer (`/lib/formatting.ts`)**: A set of utilities for display-only formatting of numbers, currency, and percentages.
- **Backend Function (`/functions/src/verifyAndSaveRun.ts`)**: A 2nd-gen Firebase Callable Function responsible for server-side verification of calculations, data persistence, and security enforcement.

## 2. Rollout & Feature Flagging

The entire feature is guarded by a Firebase Remote Config flag: `wizard.enabled`.

- **Default Value**: `false`
- **Behavior**: When `false`, the `/wizard` route renders a "Coming Soon" page. When `true`, it renders the wizard.
- **Rollout Strategy**:
  1. All development and testing will be done on **Firebase Hosting preview channels**.
  2. The feature will be deployed to production with the flag turned **off**.
  3. The flag can be enabled for internal testing, a percentage of users, or specific audiences via Remote Config conditions.
  4. To roll back, simply set `wizard.enabled` to `false`.

## 3. Local Development & Emulators

To run the full stack locally, use the Firebase Emulators.

```bash
# Start the emulators and the Next.js dev server
firebase emulators:start
```

This will start emulators for Functions, Firestore, Auth, and Hosting, allowing you to test the `verifyAndSaveRun` function and Firestore rules locally.

## 4. Testing Strategy

- **Unit Tests**: The core math in `profit-engine.ts` is covered by unit tests located in `tests/profit-engine.test.ts`. Run with `npm test`.
- **Integration Tests**: Firestore rules are tested via the emulator suite.
- **E2E Tests**: The user flow is tested with Playwright/Cypress tests in `tests/wizard.e2e.spec.ts`.

## 5. Acceptance Criteria

Before enabling for production users, the following must be true:

- [ ] The `wizard.enabled` flag successfully gates the feature.
- [ ] The end-to-end wizard flow can be completed without errors.
- [ ] Server-side verification in the callable function correctly validates client calculations.
- [ ] Firestore rules correctly enforce security (demo is public-read, user data is private).
- [ ] App Check is enforced on the callable function.
- [ ] All unit and E2E tests are passing in CI/CD.
