Testing conventions for Gallery Pavilion

This project uses Vitest for unit/integration tests and a small "prisma test client" for DB-backed integration tests.

Key points

- A global Vitest setup file exists at `src/__tests__/vitest.setup.ts` which provides safe test-time mocks for email sending (`@/lib/email`). This prevents nodemailer from being loaded during tests.
- Integration helpers live under `src/__tests__/integration-helpers.ts`. It exposes `testPrisma` (the Prisma test client) and `resetTestDb()` used by tests to clear tables.
- Some API route handlers use dynamic imports for `@/lib/prisma` and `@/lib/email` to ensure Vitest mocks are respected at test time.

Running tests locally (Windows / PowerShell)

Open PowerShell in the project root and run:

```powershell
# install deps (if you use npm)
npm ci
# run the test suite
npx vitest run --reporter default
# or run in watch mode during development
npx vitest --watch
```

Troubleshooting

- If tests fail with Prisma errors (P2025), ensure the test DB is configured. The test client uses `TEST_DATABASE_URL` from environment. For CI we use a sqlite file. Locally, you can set:

```powershell
$env:TEST_DATABASE_URL = "file:./dev-test.db"
```

- If tests still attempt to send real emails, confirm `src/__tests__/vitest.setup.ts` exists and is referenced by Vitest. The project sets the `vitest.setup.ts` file via `package.json` -> `vitest.setupFiles`.

- When editing API route handlers, prefer dynamic imports for heavy dependencies (email, Prisma client caching helpers) so Vitest module mocks are applied reliably.

Want help fixing a specific failing test? Open an issue or ask in the repo and include the failing test name and the Vitest output.

