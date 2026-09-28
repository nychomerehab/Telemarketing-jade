# Supabase deployment

This project now uses Drizzle with PostgreSQL and is compatible with the Supabase `telemarketing` project (`ivaxmaadjnfslwiahzki`).

## Database

The additive migration `drizzle/0007_supabase_postgres_compatibility.sql` has been applied to Supabase. It adds payment, delivery-status, commission, and soft-delete fields while preserving the existing `users`, `sales_categories`, `sales`, and `audit_logs` tables and data.

## Runtime

Configure these environment variables in the server deployment:

- `DATABASE_URL`: Supabase PostgreSQL connection string; use the Supabase session pooler URL with `sslmode=require` for serverless hosting.
- Existing Manus authentication variables: `JWT_SECRET`, `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `OWNER_OPEN_ID`, and `OWNER_NAME`.
- Existing Manus built-in API variables: `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_URL`, and `VITE_FRONTEND_FORGE_API_KEY`.

## Hosting

`vercel.json` already points Vercel at the serverless Express adapter in `server/_core/vercelApp.ts`. Set the variables above in the hosting provider, then deploy the `main` branch from GitHub.

## Validation

Run:

```bash
pnpm check
pnpm test
pnpm build
```
