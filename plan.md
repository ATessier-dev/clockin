# Clockin — employee clock-in/schedule app for galerie l'original

## Context

`/home/toto/loriginal/clockin` is a brand-new, empty repo (only `ideas.md` exists) that will become a
realistic working prototype for gallery employees to view their schedule, clock in/out, and reach
useful docs — while a superuser (manager) manages shifts and corrects logged time. It's meant to sit
alongside the existing `artur` project (`/home/toto/loriginal/react/artur`) as a sibling app, reusing
its stack and conventions so it "fits into the structure" the team already works in, and will deploy
on its own subdomain (e.g. `schedule.loriginal.org`).

This plan recovers a prior planning session that was lost to a computer crash right as it was
presented for approval — nothing has been implemented yet, so this restarts from the same point.

Key decisions already made with the user, driving this plan:
- **Location gating is IP-based only** (no GPS/browser geolocation) — clock-in/out is only allowed from
  a known workplace IP/subnet.
- **Separate database** from artur — artur's shared MariaDB/ProxySQL instance currently has an open
  connection-churn investigation (see `artur/doc/database-connection-churn-audit-2026-09-09.md` on the
  `ali/artist-auto-closer` branch of the `react` repo); clockin gets its own MariaDB instance to avoid
  that risk and to keep a clean security boundary for an internal tool.
- **Workplace registry mirrors artur's `GalleryLocation`** (`mont-royal`, `vieux-port` — see
  `artur/lib/admin-inventory/gallery-card-qr.ts`), copied (not shared) into clockin's own `Workplace`
  table with an IP allowlist per location.
- **Phone/call-dispatcher registry is mocked** for now — a plain free-text field, no real validation.
  `artur/lib/utils/phone.ts` (libphonenumber-js) is available to wire in properly later.
- Stack matches artur wherever sensible (see below) so code/conventions transfer between the two repos,
  but auth is redesigned (code-based login + JWT, not artur's email/password cookie session) since
  clockin's login and role model are genuinely different from artur's.

## Stack (matching artur's conventions)

- Next.js 16, App Router, React 19, TypeScript 5.8 strict, `@/*` path alias.
- UI: shadcn/ui (`components.json`, style "default", neutral base, lucide icons, Radix underneath) +
  Tailwind v3 with a **small** token file (a dozen tokens — brand color, neutral scale, radius), not
  artur's full design-token system.
- State/data: zustand (client UI state) + `@tanstack/react-query` (server state).
- Forms: `react-hook-form` + `@hookform/resolvers` + `zod` v4.
- i18n: `next-intl` for locale routing (`en`/`fr`, default `fr`) + a homegrown `translations/*.ts`
  dictionary (artur's pattern, not next-intl message catalogs), scoped to clockin's ~5 pages only.
- DB: Prisma 7 + `@prisma/adapter-mariadb`, discrete env vars (`DATABASE_HOST/USER/PASSWORD/NAME/PORT`,
  **not** `DATABASE_URL`), own MariaDB instance. `lib/withPrisma.ts` copies artur's lazy-singleton pool
  shape (`connectionLimit`/`minimumIdle` 2/2, connect/acquire timeouts) but drops artur's Discord-alert
  instrumentation in favor of plain `console.error`/`warn`.
- Auth: no next-auth. Employee logs in with an `id`/`code` (not email/password). Code is argon2-hashed
  (reuse the hash/verify shape from `artur/lib/auth-utils.ts`, **without** its legacy WordPress-hash
  compatibility shim). Session is a `jose` JWT (mirrors artur's `proxy.ts` "investors gate" pattern, not
  its plain-cookie session) carrying `{ employeeId, role, scope: "clockin" }`, httpOnly cookie, short TTL
  (12h — a work-tool session, easy to tune later). Route protection is per-layout Server Component
  guards (artur's `dashboard/layout.tsx` pattern) rather than centralized in middleware.
- `proxy.ts` (Next 16's middleware-equivalent) stays minimal: just next-intl locale routing, no
  multi-tenant/domain logic, no auth.
- Config patterns copied lightly: `site.config.ts`, a small role-aware `menu.config.ts` (4–5 items),
  fresh `eslint.config.mjs` (artur's is explicitly "DO NOT EDIT" and shared, not importable) + artur's
  exact `.prettierrc` settings (100 col, 2-space, double quotes, semi, trailing comma es5, arrowParens
  always).
- Testing: Jest + ts-jest, `tests/` mirroring feature folders.
- Deploy: own Vercel project (not folded into artur's tenant routing), custom domain attach the same way
  artur's extra domains are (Vercel domain + Cloudflare DNS-only CNAME) — an infra step, not designed in
  depth here.

## Data model (`prisma/schema.prisma`)

Dropping ideas.md's separate `schedule` table — `Shift` already carries its own start/end, so a
date→shift join table is redundant; a calendar view is just `Shift` rows filtered by date range. Revisit
only if shifts become recurring templates needing materialization.

- **`Employee`** — `id (cuid)`, `code` (unique login id), `codeHash` (argon2), `firstName`, `lastName`,
  `role: EmployeeRole` (`EMPLOYEE`/`SUPERUSER`), `phone?` (free text, mock), `preferredWorkplaceId?` →
  `Workplace`, `availabilityNote?` (freeform text — see open question below), `locale` (`fr` default),
  `active` (soft-disable), `createdAt`/`updatedAt`. Users and employees are the same entity per ideas.md.
- **`Workplace`** — `id`, `key` (`"mont-royal" | "vieux-port"`), `label`, `allowedCidr` (single
  CIDR/subnet string for v1), `color` (hex string, `@default("#0ea5e9")` — not in the original plan,
  added on request so shifts/clock events are visually distinguishable by location), timestamps. Seeded
  with the two gallery locations. Managed (add/edit) by a superuser from `/settings`, via
  `app/api/workplaces` (see API routes below).
- **`Shift`** — `id`, `employeeId` → `Employee`, `workplaceId` → `Workplace`, `startAt`/`endAt`
  (combined date+time `DateTime`, not a separate `date`+`timeStart`+`timeEnd` triplet — simpler, avoids
  timezone-split bugs), timestamps, indexes on `[employeeId, startAt]` and `[workplaceId, startAt]`.
- **`ClockEvent`** — the actual clock-in/out ledger (superuser "reads and modifies time worked" against
  this, not `Shift`): `id`, `employeeId`, `shiftId?` (best-effort link, nullable), `type`
  (`CLOCK_IN`/`CLOCK_OUT`), `at` (default now), `workplaceId?` (which location's IP matched), `ip`,
  `source` (`EMPLOYEE_SELF`/`SUPERUSER_EDIT`), `editedByEmployeeId?` (self-relation, stamped when a
  superuser touches someone else's row), `note?`, timestamps, index on `[employeeId, at]`. "Hours
  worked" is derived from IN/OUT pairs at read time, not stored as a redundant duration.
- **`Link`** — `id`, `title`, `url`, `category?`, `sortOrder`, timestamps — backs the docs/links page.
- **`ChecklistItem`** — `id`, `label`, `recurrence: ChecklistRecurrence` (`ONE_TIME`/`DAILY`/`WEEKLY`/
  `MONTHLY`), `completed` (single shared boolean, not per-employee), `completedAt?`,
  `completedByEmployeeId?` → `Employee` (`completedChecklistItems` back-relation), `sortOrder`,
  timestamps — backs `/checklist`. Not in the original plan, added on request. Recurring items are
  never reset by a background job: `completed`/`completedAt`/`completedByEmployeeId` just record the
  last check-off (who and when), and `lib/checklist/effectiveCompletion.ts` computes at read time
  whether that check-off still counts for the current day/week/month
  (`isSameDay`/`isSameWeek`(Monday-start)/`isSameMonth`) — a `ONE_TIME` item stays checked until someone
  unchecks it or deletes it. Anyone can check an item; only the employee who checked it, or a
  superuser, can uncheck it (`PATCH .../checklist/[id]` returns 403 `not_owner` otherwise). A stale
  `completedByEmployee` from a since-reset cycle is never returned once the item is no longer
  effectively completed.

All models: PascalCase names, camelCase fields mapped via `@map(...)` to snake_case columns, `@@map`
table names, `created_at`/`updated_at` timestamps, `///` doc comments explaining non-obvious rules —
matching artur's Prisma-native (not its legacy-introspected) schema style.

## Auth & IP-gating design

- **Login**: `POST /api/auth/login { code }` → `Employee.findUnique({ code })` → `argon2.verify` →
  issue JWT cookie `clockin_session` (httpOnly, secure in prod, sameSite lax, 12h TTL).
- **Guards**: `lib/auth/requireSession.ts` (`requireEmployee()`/`requireSuperuser()`) used at the top of
  every protected API route; `(app)/layout.tsx` guards all authenticated pages, superuser-only pages
  add a role check.
- **Clock-in/out gate** lives in a Route Handler (`app/api/clock/route.ts`), not a Server Action — an
  explicit HTTP boundary is easier to test with fabricated headers. Logic split into small testable
  units: `lib/clock/getClientIp.ts` (reads `x-forwarded-for` — **first** entry is the real client IP on
  Vercel; falls back to `x-real-ip`; dev override via env var since local dev has no proxy headers),
  `lib/clock/matchWorkplace.ts` (CIDR match against all seeded `Workplace.allowedCidr` values, small
  hand-rolled IPv4 checker — no new dependency needed), `lib/clock/recordClockEvent.ts` (the actual DB
  write, called by the route handler). On mismatch: `403 { error: "not_on_workplace_network" }`, no
  `ClockEvent` written, translated message shown in the UI. Employee ID always comes from the session,
  never the request body, so nobody can clock in as someone else. An employee can clock in at *any*
  matching workplace, not just their preferred one (covering shifts at the other location).

## API routes (`app/api/*`)

`auth/login`, `auth/logout`, `clock` (POST, self, IP-gated), `clock-events` (GET by `?employeeId` +
optional `startAtFrom&startAtTo`, POST manual entry — both superuser-only; powers `/timesheets`),
`clock-events/[id]` (PATCH/DELETE, superuser-only corrections — manual rows use a `"manual"` `ip`
placeholder since the schema's `ip` column is required), `employees` (GET list /
POST create, superuser), `employees/[id]` (PATCH — self can edit their own profile fields, powering
`/settings`; `role`/`active`/`code` stay superuser-only even on a self-edit, to block privilege
escalation; DELETE never hard-deletes — Shift/ClockEvent cascade off Employee, so it just sets
`active: false`, and PATCH `{ active: true }` reactivates), `shifts` (GET all + optional
`?employeeId&startAtFrom&startAtTo` filters via `request.nextUrl.searchParams`, POST superuser),
`shifts/[id]` (GET one by id — 404 if missing — /PATCH/DELETE, mutations superuser-only), `workplaces`
(GET list, POST create — both superuser-only; not in the original plan, which only had GET for
dropdowns), `workplaces/[id]` (PATCH, superuser-only), `links` (GET all / POST superuser), `links/[id]`
(PATCH/DELETE superuser), `checklist` (GET, any employee — computes effective `completed` per item;
POST, superuser-only, accepts `recurrence`) and `checklist/[id]` (PATCH — any employee can check an
item, but only its `completedByEmployeeId` or a superuser can uncheck it — 403 `not_owner` otherwise;
only a superuser can change `label`/`recurrence`; DELETE, superuser-only — hard delete, no
historical data hangs off a checklist item) — not in the original plan.

## Frontend routes (`app/[locale]/*`)

```
login/page.tsx                — public, code entry
(app)/layout.tsx              — auth guard + shell/nav
(app)/dashboard/page.tsx      — time worked summary, upcoming shift, clock-in/out button
(app)/schedule/page.tsx       — shift calendar/list; superuser adds/edits/deletes shifts here (matches
                                 ideas.md: "Superuser can add, modify and delete on this page")
(app)/timesheets/page.tsx     — superuser-only; view/correct actual ClockEvent records (kept separate
                                 from /schedule since "planned" vs "actual" time are distinct concerns)
(app)/employees/page.tsx      — superuser-only; add/edit employees, deactivate/reactivate (soft-delete —
                                 not in the original plan, added on request)
(app)/links/page.tsx          — docs/links list (+ superuser inline edit)
(app)/checklist/page.tsx      — shared team checklist, open to every employee; check/uncheck is shared
                                 state (not per-employee); add/edit/delete is superuser-only — not in
                                 the original plan, added on request
(app)/settings/page.tsx       — availability note, locale, personal info, phone (mock text field),
                                 preferred workplace; also hosts workplace add/edit (key, label,
                                 allowedCidr, color) for a superuser — not in the original plan
```

Nav: `dashboard`, `schedule`, `checklist`, `timesheets` (superuser-only), `employees` (superuser-only),
`links`, `settings`.

## Build order

1. **Scaffold + DB + auth** — `package.json`/`tsconfig`/`.prettierrc`/`eslint.config.mjs`, full
   `prisma/schema.prisma`, `prisma db push` against a real MariaDB instance + seed (2 workplaces, 1
   EMPLOYEE, 1 SUPERUSER test account), `lib/withPrisma.ts`, `lib/session-secret.ts`,
   `lib/auth-utils.ts`, `lib/auth/session.ts`, bare login route + page.
   **Verify**: `npm run dev`, log in with a seeded code, confirm cookie set and a temporary protected
   route returns the right employee/role; wrong code → 401.
2. **IP gate + dashboard** — `lib/clock/*`, `app/api/clock/route.ts`, `(app)/layout.tsx` guard,
   dashboard page with working clock-in/out button.
   **Verify**: with a `DEV_CLOCK_IP` override matching the seeded workplace's CIDR, clock-in creates a
   `ClockEvent` row with correct fields; an out-of-range override → 403 + UI message. Decide and encode
   double-clock-in handling (recommend: block a second clock-in while one is open) before building
   `recordClockEvent.ts`.
3. **Remaining pages** — schedule (+ superuser CRUD), links, timesheets, settings, plus their API
   routes and translation files; verify `en`/`fr` both render and locale persists via `Employee.locale`.
   **Verify**: superuser creates a shift for the test employee, it shows up after logging in as them;
   superuser edits a `ClockEvent`, `editedByEmployeeId` gets stamped.
4. **Polish + tests + deploy** — shadcn components + token-lite theme, Jest tests (`getClientIp`
   header-parsing edge cases, CIDR matching, login/JWT round-trip), `typecheck`/`lint`/`test` green,
   Vercel project + env vars + custom domain attach.
   **Verify**: deployed URL, real login, real clock-in from an actual/whitelisted workplace IP succeeds,
   off-network clock-in fails with the expected message.

## Critical files

- `prisma/schema.prisma` — all models above
- `lib/withPrisma.ts` — DB connection singleton
- `lib/auth/session.ts` — JWT create/verify
- `app/api/clock/route.ts` — IP-gated clock-in/out
- `proxy.ts` — locale routing only
- `i18n/routing.ts` — locale config

Reference files in artur that informed conventions to match: `lib/withPrisma.ts`, `proxy.ts`,
`lib/auth-utils.ts`, `lib/auth/sessions.ts`, `lib/session-secret.ts`,
`lib/admin-inventory/gallery-card-qr.ts`, `prisma/schema.prisma` (Prisma-native models),
`app/[locale]/dashboard/layout.tsx`, `i18n/routing.ts`, `translations/index.ts`, `menu.config.ts`,
`site.config.ts`, `components.json`, `tailwind.config.ts`, `eslint.config.mjs`, `.prettierrc`,
`jest.config.js`, `lib/utils/phone.ts`.

## Open questions (flagged, not silently decided)

1. **IP gating is inherently weak off-network** — no path for legitimate remote/WFH clock-ins today
   beyond a superuser manual correction in `/timesheets`. Acceptable for v1 per the explicit "IP-only"
   decision; revisit if remote work becomes a real need.
2. **Single CIDR per workplace** — if a location has a dynamic or multiple egress IPs, one string may be
   too rigid; can widen to a string list later without a breaking migration.
3. **`availabilityNote` is freeform text**, not structured day/time rows — fine for "log a preference",
   but won't support querying/filtering (e.g. "who's free Tuesday mornings") without a later redesign.
4. **Double clock-in / missing clock-out** — not specified in ideas.md; recommend blocking a second
   clock-in while one is open, confirm before implementing `recordClockEvent.ts`.
5. **Session TTL (12h)** — a judgment call for a work-hours tool; trivial to change later.
