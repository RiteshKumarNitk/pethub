# PawStore — Dev Run Guide (preview)

Single Next.js 14 app (storefront + API + admin) in `backend/`.

## 1. Reproduce environment artifacts

- **Dependencies** (`backend/node_modules` already installed in this worktree):
  ```
  cd backend && npm install
  ```
  If `node_modules` is missing, this is the install step. There is no lockfile-driven CI install beyond `npm install`.

- **Env file** — the repo has NO `.env.local` in the main checkout (checked: only `.env.example` exists).
  For preview/dev purposes we generate `backend/.env.local` from `.env.example` values with a local
  dev JWT secret. Razorpay/Cloudinary/SMS keys are left blank:
  - the app renders fully without them,
  - the cart/orders UI works, and Razorpay calls fail gracefully at the API layer (order is created, payment setup is reported as not configured),
  - OTP login works in dev because `send-otp` returns `devOtp` when `NODE_ENV !== "production"` (check the server log or the API response).

  Command used:
  ```
  cd backend && cp .env.example .env.local
  ```
  then replace the secret placeholders with dev values (JWT secret is a random dev string; DATABASE_URL stays as in `.env.example` for this Neon dev database).

## 2. Run the server

Port: **3100** (project default is 3000, but on this machine something races the bind and `next dev`
falls back to a random port — observed repeatedly. Pass an explicit free port instead:
`npm run dev -- -p 3100`).

```
cd backend && npm run dev
```

`npm run dev` = `next dev` (see `backend/package.json`).

- **DB schema** — if the target database predates the current `src/db/schema.ts` (e.g. the legacy DB whose `products` table still had a `category` text column), push it into shape once with:
  ```
  cd backend && node --env-file=.env.local scripts/schema-bootstrap.cjs
  ```
  It idempotently creates all 32 tables, adds missing columns (incl. `users.email`, `products.pet_type`), backfills `category_id`, and relaxes the legacy NOT NULL on `products.category`. Skip it on a fresh DB — `npm run db:push` alone is enough there.

Optional sanity checks before serving:
```
cd backend && npx tsc --noEmit       # typecheck (passes clean)
cd backend && npm run build          # production build (passes; needs no live DB)
npm run db:push                      # push Drizzle schema to the Neon DB (mutates DB)
npm run db:seed                      # seed admin/products/services/pets (mutates DB)
```

Seeded admin: phone `+911234567890` at `/admin`. Customer login at `/login` (OTP in dev response/log).

## 3. Start detached (Windows, used for the Preview tab)

```
powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev','--','-p','3100' -WorkingDirectory '<abs path>/backend' -RedirectStandardOutput '<log>' -RedirectStandardError '<log>.err' -WindowStyle Hidden -PassThru).Id"
```

- **Sprint 1 taxonomy** — if the target database predates the category tree, apply once with
  ```
  cd backend && node --env-file=.env.local scripts/sprint1-taxonomy.cjs
  ```
  (adds `categories.parent_id`, the `needs` table, `products.store_stock/life_stages/need_slugs`,
  `pet_listings.intent`; idempotent). Seed with `npm run db:seed` (runs tsx directly is fine on Windows:
  `node --env-file=.env.local ./node_modules/tsx/dist/cli.mjs src/db/seed.ts`).
stdout/stderr MUST go to different files or Start-Process fails. Verify with `Get-Process -Id <pid>`, then `curl http://localhost:3000` until it answers (first compile takes a few seconds).
