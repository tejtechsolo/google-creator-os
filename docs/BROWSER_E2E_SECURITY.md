# Browser E2E Security Verification

This milestone adds a real Chromium browser path over PostgreSQL for authentication and workspace authorization.

## Coverage

- Public homepage smoke check.
- Registration form submits to the registration API.
- Email verification is explicitly marked as test-only email-sink behavior under NODE_ENV=test + E2E_TEST_MODE=true; production email delivery remains unchanged.
- Login creates an MFA challenge for an MFA-enabled user.
- Recovery-code MFA completes the login challenge and creates a session.
- Workspace member administration loads only the authenticated user's workspace.
- Cross-tenant workspace access is denied server-side from an authenticated browser session.
- Ownership transfer is rejected before step-up authentication.
- Ownership transfer succeeds only after explicit MFA step-up.

## Test data

`npm run seed:e2e` creates:

- one verified owner with MFA and ten one-time recovery codes;
- one verified workspace member;
- one separate outsider and outsider workspace.

The seed is intended only for the isolated PostgreSQL test database.

## CI

`.github/workflows/browser-e2e.yml`:

1. starts PostgreSQL 16;
2. installs dependencies;
3. generates Prisma client;
4. applies migrations;
5. runs typecheck/unit tests/build;
6. seeds deterministic E2E users;
7. installs Chromium;
8. runs Playwright;
9. uploads the Playwright report on success or failure.

## Security constraints

- No production environment should set E2E_TEST_MODE=true.
- The E2E email sink is additionally gated by NODE_ENV=test.
- Recovery codes are stored hashed even in the test database.
- The browser suite uses the same login, MFA, workspace authorization, step-up, and ownership APIs as the application.
- No test secret or real provider credential is committed.

## Remaining verification

A green GitHub Actions run is required before this PR is considered verified. Local execution alone is not sufficient evidence for CI readiness.