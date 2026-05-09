## Cursor Cloud specific instructions

### Project overview

iHeartEcho — a clinical cardiac echocardiography companion platform (React 19 + Express/tRPC + MySQL via Drizzle ORM). Deployed to Railway.

### Quick reference

| Task | Command |
|---|---|
| Install deps | `pnpm install --frozen-lockfile` |
| Type-check | `pnpm run check` |
| Tests | `pnpm test` |
| Build | `pnpm run build` |
| Dev server | `pnpm dev` (starts Express + Vite HMR on port 3000) |
| Format | `pnpm run format` |

### Dev server notes

- The dev server starts without `DATABASE_URL`; DB-dependent routes return empty/null but the app loads.
- A minimal `.env` with `JWT_SECRET=<any-string>` is sufficient to boot the dev server locally.
- Vite runs in middleware mode inside the Express server (not a separate process).
- The server auto-finds an available port starting at 3000 if it's busy.

### Railway deployment

- Project: **Echo-Assist** (ID `da65fe92-119e-46a9-b4c5-691bb4d436d8`), service `echo-assist`, environment `production`.
- The Railway CLI (`~/.railway/bin/railway`) does not support `whoami`/`link`/`list` with the current `RAILWAY_TOKEN`; use the **GraphQL API** at `https://backboard.railway.app/graphql/v2` with `Authorization: Bearer $RAILWAY_TOKEN` instead.
- Auto-deploys from `main` branch. Env var changes also trigger redeployment.
- Config: `railway.json` (Nixpacks builder), `nixpacks.toml` (Node 22).
- Health check: `GET /api/health` on both `echo-assist-production.up.railway.app` and `app.iheartecho.com`.
- Key env vars for magic links: `JWT_SECRET`, `PUBLIC_APP_URL`, `SENDGRID_API_KEY`, `DATABASE_URL`.

### Member count on dashboard

The public member count (`stats.userCount`) returns `getThinkificMemberCount() + 3992`. The Thinkific count is fetched live via API (cached 10 min). Without `THINKIFIC_API_KEY`/`THINKIFIC_SUBDOMAIN`, only the 3992 offset is shown.

### Welcome email policy

Welcome emails are sent ONLY on:
- **Purchase**: Thinkific `order.created` webhook (complete status) for direct iHeartEcho products
- **Login attempt**: Email/password registration (`emailAuthRouter.ts`)

NOT sent on enrollment events, subscription re-activations, or `user.signup` (Thinkific registration without purchase).

### CI (GitHub Actions)

Workflow `.github/workflows/ci.yml` runs: type-check → test → build on Node 22 with pnpm.
