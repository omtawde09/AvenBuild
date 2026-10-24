# Evan Build — Demo Limitations and Backend Replacement

**Status:** Phase 8 handoff · **Date:** 2026-10-24

## 1. What the prototype is today

- A Vite + React 19 single-page app. **All state lives in one browser profile's `localStorage`** under the key `evanbuild.demo`.
- Both personas (Property Owner "Meera Kulkarni" and Contractor "Sahyadri Waterproofing & Civil Works") read and write the same local state; persona switching is a testing shortcut.
- Domain rules run in the browser as pure functions (`src/domain`). There is no server and no network traffic beyond loading static assets.

### Current state model

`DemoState` (`src/domain/types.ts`) is normalised: one `Record<id, entity>` table per entity plus `meta`:

```
meta { schemaVersion: 1, seedAnchor: 'YYYY-MM-DD', activePersonaId }
users, ownerSettings, contractorProfiles, portfolio, projects, leadStates, invitations, shortlist,
quotes, workspaces, milestones, siteUpdates, documents, changeRequests, activity,
conversations, messages, notifications, reviews
```

Derived values (quote totals, unread counts, progress, rating aggregates, pipeline stage, lead matches) are **never stored**; selectors recompute them.

### Persistence and versioning

- The envelope is `{ schemaVersion, savedAt, data }`. On load: JSON parse → envelope check → ordered migrations (`src/lib/storage/migrations.ts`, currently none) → Zod schema validation (`src/lib/validation/demoState.ts`) → referential checks. Any failure restores the seed, backs up the bad payload to `evanbuild.demo.corrupt-backup`, and shows a notice.
- Save failures (quota exceeded or storage blocked) keep the session working in memory and show a persistent "can't save" notice.
- A `storage` event listener refreshes other tabs in the same profile and keeps each tab's own persona.
- To change the schema: bump `SCHEMA_VERSION`, add `migrations[n]`, update the Zod schema, and add a test in `src/tests/domain/storage.test.ts`.

### Exact limitations

| Area | Demo behaviour | Production requirement |
|---|---|---|
| Identity | Persona picker, no password | Real authentication and sessions |
| Authorisation | Client-side checks inside commands (`forbidden()`) | Server-side checks on every request |
| Data | One browser's `localStorage`, about 100 KB | Database with backups |
| Sync | None across devices or people; tabs in one profile only | Server is the source of truth, plus realtime updates |
| Files | Metadata only; image previews are session-only object URLs | Object storage, virus scanning, signed URLs |
| Messaging and notifications | Local records; in-app only | Realtime delivery plus push/email/SMS with opt-outs |
| Verification | "Sample verification · demo data" labels; user entries "not checked" | A real verification workflow, or remove the badges |
| Payments | None. Milestone values are planning figures | Payment provider integration (only if the product decides to take payments) |
| Time | Real clock; seed anchored to the reset day | Server time, time zones stored per user |
| IDs | `crypto.randomUUID()` with prefixes | Server-generated IDs (UUIDv7 or ULID) |

## 2. Must never ship to production as-is

1. The persona selector and **Reset demo data**.
2. `localStorage` as the system of record, or any client-trusted authorisation.
3. Seed data, sample reviews, and the "Sample verification" badges.
4. Client-computed totals accepted without server recomputation.
5. GST, licence and tax inputs presented without a defined compliance owner.
6. The `vite preview` server. Serve the static build from a CDN with security headers (CSP, HSTS).

## 3. Backend replacement seams

The key seam is that UI code only calls `useCommand()` → `run(command)` and reads through selectors. To move to a backend:

1. Replace `run(command)` with API mutations (for example, TanStack Query `useMutation`) that send **command inputs**, not resulting state.
2. The server runs the same domain command (shared package) inside a database transaction, then persists and emits events.
3. Read models come from API queries. Selectors keep working on the same shapes, scoped to what the user is allowed to see.

### 3.1 Authentication, sessions and roles
- Phone OTP or email magic link through a provider. HttpOnly secure session cookie on web; secure storage on mobile.
- A user has one role in v1 (owner or contractor). Role is checked on every route and command. Keep the "no admin role" product rule. If internal tooling is needed, build it as a separate back-office app with audited access.

### 3.2 Database schema and migrations
- PostgreSQL. Tables mirror the entities in `docs/data-model-and-api-contract.md`, with foreign keys and these constraints:
  - `UNIQUE(workspaces.project_id)` (exactly one workspace per project)
  - `UNIQUE(quotes.project_id, contractor_id)`
  - `UNIQUE(reviews.project_id)`
  - `UNIQUE(conversations.project_id, contractor_id)`
  - partial unique index for one open change request per workspace
  - money as `BIGINT` paise
- Migrations through a tool such as Drizzle, Prisma or sqitch, run in CI. Never edit data by hand in production.
- Indexes: `projects(status, category, city)`, `quotes(project_id)`, `messages(conversation_id, sent_at)`, `notifications(recipient_id, read_at)`.

### 3.3 Object storage for photos and documents
- Pre-signed upload URLs (S3 or GCS). Check MIME type and size server-side, scan for malware, strip EXIF location from site photos, and serve through short-lived signed URLs.
- `AttachmentMeta` stays the same shape, plus `storageKey` and `scanStatus`.

### 3.4 Server-side transactions and authorisation
- Each command maps to one endpoint (see the API contract) wrapped in a transaction. `acceptQuote` must lock the project row (`SELECT … FOR UPDATE`) so two accepts can't both succeed; the unique constraint is the backstop.
- Recompute quote totals server-side from line items. Ignore any client total.
- Use optimistic concurrency (`version` column or `If-Match`) on projects, quotes and milestones to avoid lost updates.

### 3.5 Real-time messaging and notifications
- WebSocket or SSE channel per user for new messages and notifications. Use the outbox pattern: write an event row in the same transaction, then a worker fans out to realtime, push and email.
- Respect per-category preferences (already modelled as `notificationPrefs`) and add quiet hours.

### 3.6 Identity and licence verification
- If verification is offered: a workflow table (`submitted → under_review → verified/rejected`) with document upload, reviewer audit trail and expiry dates. Display "Verified" only from that workflow, with the date and what was checked. Until then, remove the badges.

### 3.7 Payments (only if the product chooses to support them)
- Use a regulated payment provider (for example, a payment-gateway escrow or marketplace product). Never handle card data directly.
- Milestone-linked payment intents, webhook-driven state, and **idempotency keys** on every create call. Store provider event IDs to deduplicate webhooks, and reconcile daily.
- Legal review is needed for any "funds protected" wording.

### 3.8 Rate limits, audit trail, abuse reporting, privacy and security
- Per-user and per-IP rate limits on auth, messaging, quote submission and invitations.
- An audit log for every state change. The current `activity` table is a good start; make it append-only server-side.
- Report and block flows for messages and profiles, plus a moderation queue.
- Privacy: keep phone numbers and addresses hidden until the owner chooses to share; document retention periods; support data export and deletion on request (DPDP Act 2023 in India).
- Security: CSP, CSRF protection for cookie sessions, input validation with the shared Zod schemas, output encoding (React already escapes; keep the no-`dangerouslySetInnerHTML` lint), and dependency scanning in CI.

## 4. Next five engineering tasks before a private beta

1. **Extract `packages/domain`** (domain, validation, format) and add an import-boundary lint, so the server, web and mobile share one rules engine.
2. **Stand up the API and database:** auth (OTP), projects, quotes, accept-quote transaction, using the constraints in §3.2, with the existing domain tests run against the server.
3. **Replace the storage adapter with API queries and mutations** in the web app. Remove the persona selector and reset from production builds behind a build flag.
4. **File uploads to object storage** (pre-signed URLs, scanning, signed reads) for project photos, documents and site updates.
5. **Realtime messages and notifications with push**, plus rate limits, an append-only audit log and abuse reporting.
