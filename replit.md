# XRT.LLC Sports Betting App

A mobile-first sports betting and financial platform with live football fixtures, wallet management, VIP tiers, agency/referral system, and USDT withdrawals.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/sports-app run dev` — run the frontend (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`, `FOOTBALL_API_KEY`

## Where things live

- `artifacts/api-server/src/routes/` — all API route handlers
- `artifacts/sports-app/src/pages/` — all frontend pages
- `artifacts/sports-app/src/hooks/` — custom React hooks (useFixtures, etc.)
- `lib/db/src/schema/` — Drizzle ORM schema (users, bets, deposits, withdrawals, wallets, vip_rewards, referral_bonuses)
- `lib/api-spec/src/openapi.yaml` — OpenAPI spec (source of truth for codegen)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod schemas

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite, Tailwind CSS 4, Radix UI, Framer Motion, wouter
- API: Express 5, express-session (cookie-based auth), bcryptjs
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## API Endpoints (all working)

### Public
- `GET /api/healthz` — health check
- `GET /api/fixtures?date=YYYY-MM-DD` — football fixtures (cached, rate-limited)
- `GET /api/exchange-rate` — USD→PKR rate (cached 12h)
- `POST /api/auth/register` — register with username/password
- `POST /api/auth/login` — login
- `POST /api/auth/logout` — logout
- `POST /api/auth/send-code` — send OTP (returns devCode in development)
- `POST /api/auth/forgot-password` — reset password via OTP

### Authenticated (session cookie required)
- `GET /api/auth/me` — current user
- `POST /api/auth/change-password`
- `POST /api/auth/update-phone`
- `POST /api/auth/update-email`
- `GET/POST /api/deposits`
- `GET/POST /api/withdrawals`
- `GET/POST/DELETE /api/wallets` — USDT wallet addresses
- `GET/POST/DELETE /api/bets`
- `GET /api/transactions`
- `GET /api/wallet/balance`
- `GET /api/wallet/subordinates`
- `POST /api/wallet/transfer-self`
- `POST /api/wallet/transfer-subordinate`
- `GET /api/agency/stats`
- `GET /api/rebate/stats`
- `GET /api/vip/status`
- `GET /api/vip/history`

## Architecture decisions

- **Session auth**: Cookie-based sessions via `express-session` — no JWT/external auth provider. Session secret from `SESSION_SECRET` env var.
- **Deposit flow**: Deposits are created as `pending` and must be manually approved (no auto-credit) to prevent fraud.
- **Referral rebates**: 3-level rebate chain credited on bet placement (8%/5%/3% of estimated profit).
- **Fixtures caching**: In-memory cache (1h TTL) + 50 request/day hard cap to stay within Football API free tier.
- **Exchange rate**: Cached 12h via exchangerate-api.com free tier (key hardcoded in URL).

## Product

Mobile-optimized sports betting platform with: user registration/login with CAPTCHA, live football match listings, bet slip, wallet & balance management, USDT deposit/withdrawal, VIP rewards system, 3-level referral/agency system, and rebate center.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Football API free plan only serves fixtures within ~2 days of today — historical dates return empty results.
- `SESSION_SECRET` must be set or the API server throws on startup.
- `pnpm --filter @workspace/db run push` must be run after any schema changes.
- OTP codes are in-memory only (restart clears them) — replace with DB storage for production.
- The `/api/health` path returns 404; the correct path is `/api/healthz`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
