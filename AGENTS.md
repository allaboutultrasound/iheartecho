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

- Requires a valid `RAILWAY_TOKEN` secret. Use `railway` CLI (installed at `~/.railway/bin/railway`).
- Add `~/.railway/bin` to `PATH` before using the CLI.
- Config: `railway.json` (Nixpacks builder), `nixpacks.toml` (Node 22).
- Health check: `GET /api/health`.

### Member count on dashboard

The public member count on the homepage is `countUsers() + DISPLAY_OFFSET` (currently 3997 in `server/routers.ts`). The offset represents the Thinkific LMS member base. Without a database, the dashboard shows only the offset value.

### CI (GitHub Actions)

Workflow `.github/workflows/ci.yml` runs: type-check → test → build on Node 22 with pnpm.
