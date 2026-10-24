# Evan Build — Acceptance Checklist

**Status:** Phase 0 baseline · **Date:** 2026-10-24
Every item starts as **Not run**. An item may be marked **Pass** only after it has actually been executed, either by an automated test (name the test file) or by a manual run (date, viewport, browser). **Fail** items must link to an issue or note. Phase 7 completes this document.

Result column values: `Not run` · `Pass (auto: <file>)` · `Pass (manual: <date, viewport>)` · `Fail: <note>` · `Blocked: <reason>`

---

## A. Prototype boundaries

| ID | Criterion | Phase | Result |
|---|---|---|---|
| A1 | Exactly two personas, Property Owner and Contractor. No admin role or route exists. | 1–2 | Not run |
| A2 | No database, backend, API client, Firebase/Supabase or external data request. The network tab shows only same-origin static assets after load. | 1–7 | Not run |
| A3 | The demo banner is visible on every app-shell screen and links to About this demo and Reset. | 1 | Not run |
| A4 | The persona selector never uses the words "sign in", "secure" or "verified account", and explains that it is a local demo. | 1 | Not run |
| A5 | Seeded profiles show "Sample verification · demo data". User-edited licence/GST fields show "Not submitted". The plain word "Verified" never appears. | 2, 4, 6 | Not run |
| A6 | No payment, card or bank inputs anywhere. Milestone values carry the "no payment is processed" note. | 5 | Not run |
| A7 | File features say that files are not uploaded and previews don't survive refresh. | 5 | Not run |
| A8 | `/help` lists: no backend, no real verification, no payments, no email/SMS/push, no cross-device sync. | 6 | Not run |
| A9 | No real people's names, phone numbers, emails or street addresses in seed data. | 2, 6 | Not run |

## B. Persistence and recovery

| ID | Criterion | Phase | Result |
|---|---|---|---|
| B1 | First run (empty storage) loads the deterministic seed. Every main view is non-empty. | 2 | Not run |
| B2 | A structured change (e.g. edit a draft) survives a page refresh. | 2 | Not run |
| B3 | Reset demo data asks for confirmation. Cancelling changes nothing. Confirming restores the seed exactly (same IDs and content) and returns to `/start`. | 2 | Not run |
| B4 | Malformed JSON in the storage key → the app loads the seed and shows a non-blocking recovery notice. No crash. | 2 | Not run |
| B5 | Valid JSON with an invalid schema or unknown version → same recovery behaviour. | 2 | Not run |
| B6 | Quota exceeded or storage unavailable on save → the app keeps working in memory and shows a persistent "can't save" notice. No false "saved". | 2 | Not run |
| B7 | A change in tab A appears in tab B of the same profile without manual refresh. | 2 | Not run |
| B8 | No component reads or writes `localStorage` directly (grep check: only `src/lib/storage` touches it). | 2, 7 | Not run |
| B9 | Binary file content is never written to storage (only metadata). | 5 | Not run |

## C. Domain rules (automated unit tests required)

| ID | Criterion | Phase | Result |
|---|---|---|---|
| C1 | Project transitions: every valid transition succeeds; every invalid one returns `INVALID_TRANSITION` (table-driven). | 2 | Not run |
| C2 | Quote transitions, including: accepting a withdrawn, declined or expired quote fails; accepting on a paused project fails. | 2 | Not run |
| C3 | Milestone transitions, including the change-request loop. | 2 | Not run |
| C4 | Quote math: integer paise, quantities with 2 decimals, percent/flat discount, tax, rounding half-up, discount > subtotal rejected, negative/zero quantity rejected, empty line items rejected. | 2 | Not run |
| C5 | acceptQuote creates exactly one workspace, declines competing quotes (`awarded_elsewhere`), and a second accept fails. | 2 | Not run |
| C6 | Matching: category + city required; reasons listed; draft, paused, closed and cancelled projects excluded; hidden profiles excluded from discovery. | 2 | Not run |
| C7 | Filters and sorts produce the expected order and contents (lead feed and discovery). | 2 | Not run |
| C8 | Domain events produce the notifications in architecture §7 with correct recipients and deep links. | 2, 5 | Not run |
| C9 | Unread counts derive from `lastReadAt`. Sending doesn't create unread for the sender. | 5 | Not run |
| C10 | Change request accept bumps the agreement revision and keeps the original quote snapshot unchanged. | 5 | Not run |
| C11 | Review eligibility: only for a completed project, only its owner, only once. | 6 | Not run |
| C12 | Rating aggregates are recomputed from review records. | 6 | Not run |
| C13 | Seed is deterministic: `buildSeed(fixedAnchor)` gives identical output on every run (snapshot). No `Math.random` in `src/`. | 2 | Not run |

## D. Owner journey

| ID | Criterion | Phase | Result |
|---|---|---|---|
| D1 | Wizard validates per step with field-level errors. Back/Next preserves values. | 3 | Not run |
| D2 | Save draft → refresh → resume at the same step with the same values. | 3 | Not run |
| D3 | Publish shows a confirmation. The project becomes "Open for quotes" and appears in the matching contractor feed. | 3 | Not run |
| D4 | Drafts never appear in any lead feed. | 3 | Not run |
| D5 | My projects search, status filter and list/card toggle all change the displayed data. | 3 | Not run |
| D6 | Pause / reopen / close / cancel available only in valid states. Each has a confirmation, and disabled actions show a reason. | 3 | Not run |
| D7 | Discover contractors: each filter and sort changes results. The no-results state has a working "Clear filters". | 3 | Not run |
| D8 | Contractor profile shows services, areas, experience, portfolio, review breakdown, response-time sample (labelled) and the demo verification label. "Invite to quote" works. | 3 | Not run |
| D9 | Shortlist add/remove (with undo) persists. | 3 | Not run |
| D10 | Compare 2–4 quotes: total, line items, includes, excludes, assumptions, timeline, validity, evidence. | 3 | Not run |
| D11 | Request revision (message required), accept and decline each have confirmations. State updates everywhere (dashboard, project, contractor pipeline, notifications). | 3 | Not run |
| D12 | Unsaved-change warning when leaving the wizard with edits. | 3 | Not run |

## E. Contractor journey

| ID | Criterion | Phase | Result |
|---|---|---|---|
| E1 | Lead feed shows only eligible matched projects, with written matching reasons. | 4 | Not run |
| E2 | Search, filters and sort change the feed. A clear empty state appears when nothing matches. | 4 | Not run |
| E3 | Save / ignore / restore leads (ignore has undo). Persists. | 4 | Not run |
| E4 | Lead detail shows no owner personal contact details. | 4 | Not run |
| E5 | Composer: live totals. Invalid numbers show field errors. Draft save, submit, revise and withdraw all work. | 4 | Not run |
| E6 | Cannot quote on draft, paused, closed, cancelled or awarded projects (UI disabled with a reason; the domain also rejects it). | 4 | Not run |
| E7 | Pipeline stages and event dates are correct for every seeded and created quote. | 4 | Not run |
| E8 | Profile edits persist and change owner discovery results (e.g. adding a service area makes the profile appear in that city's search). | 4 | Not run |
| E9 | Portfolio add/edit/remove with local preview (session-only notice). | 4 | Not run |

## F. Collaboration

| ID | Criterion | Phase | Result |
|---|---|---|---|
| F1 | Accepted quote → one workspace visible to both personas with the same agreed amount and schedule. | 5 | Not run |
| F2 | Milestones: contractor start/submit, owner approve/request changes, contractor resume. Progress is computed. | 5 | Not run |
| F3 | Site update with progress % and optional session image preview. Author attributed. | 5 | Not run |
| F4 | Documents list metadata. Image preview works in-session. The refresh limitation is stated. | 5 | Not run |
| F5 | Change request propose/accept/reject/withdraw. Accepting creates an auditable revision event. | 5 | Not run |
| F6 | Activity timeline lists the events in architecture §6–7 in time order. | 5 | Not run |
| F7 | Messaging: an empty or whitespace-only message is rejected. Send appends the message, notifies the other persona, and their unread state clears when the thread is opened. | 5 | Not run |
| F8 | Notification centre: read/unread, mark all read, and each deep link opens the right screen. | 5 | Not run |
| F9 | Persona switch + refresh: both sides see the same workspace, messages and history. | 5 | Not run |
| F10 | Complete project (only when all milestones are approved) → review prompt. | 5–6 | Not run |

## G. Trust, settings and completeness

| ID | Criterion | Phase | Result |
|---|---|---|---|
| G1 | Owner can review only after completion. A duplicate review is blocked. Profile aggregates update. | 6 | Not run |
| G2 | Owner settings persist (name, contact preference, city/locality, notification preferences). | 6 | Not run |
| G3 | Contractor settings persist (services, areas, availability, visibility, quote defaults, notifications). Visibility "hidden" removes the profile from discovery. | 6 | Not run |
| G4 | INR, number and date formatting consistent (`en-IN`) and centralized in one module. | 6 | Not run |
| G5 | No dead links, `href="#"` or no-op controls (automated link crawl + manual pass). | 6–7 | Not run |
| G6 | Dashboard counts match the underlying lists after every scenario step. | 6–7 | Not run |

## H. End-to-end scenarios (Phase 7, from a reset seed)

| ID | Scenario | Result |
|---|---|---|
| H1 | Mobile landing → Owner → create draft → refresh → resume → publish → visible in contractor feed | Not run |
| H2 | Contractor → filter feed → open new lead → save → multi-line quote, verify arithmetic → submit | Not run |
| H3 | Owner → open notification → compare → request revision → Contractor resubmits revision | Not run |
| H4 | Owner accepts → workspace created; project state, contractor pipeline, agreed amount and schedule consistent for both | Not run |
| H5 | Messages both ways, unread/notifications, milestone and site update, approve/request changes, refresh between actions | Not run |
| H6 | Complete project → review → aggregate updates → duplicate review prevented | Not run |
| H7 | Reset → all user-created content gone, seed restored | Not run |
| H8 | No-result searches, invalid forms, empty message, invalid quote numbers, cancelled dialogs, malformed/full storage recovery | Not run |

## I. Responsive and accessibility

| ID | Criterion | Result |
|---|---|---|
| I1 | No horizontal page overflow at 320, 375, 390, 430, 768, 1024, 1280 and 1440px on every route | Not run |
| I2 | Dialogs, sheets, menus and toasts aren't clipped on 320px. Sticky bars don't cover form actions or content. | Not run |
| I3 | Wide tables become stacked rows on mobile with no critical facts hidden | Not run |
| I4 | Touch targets ≈ 44×44px for primary navigation and actions | Not run |
| I5 | Keyboard-only: every action reachable. Visible focus. Dialog focus trapped and restored. | Not run |
| I6 | Landmarks, one H1 per page, labelled form controls, meaningful alt text | Not run |
| I7 | Status conveyed by text and icon, not color alone. Text contrast ≥ 4.5:1. | Not run |
| I8 | `prefers-reduced-motion` respected | Not run |
| I9 | No clickable `div`s; semantic buttons and links | Not run |

## J. Engineering quality

| ID | Criterion | Result |
|---|---|---|
| J1 | `npm run typecheck` passes (strict) | Not run |
| J2 | `npm run lint` passes with no global rule disables | Not run |
| J3 | `npm run test` passes | Not run |
| J4 | `npm run build` passes | Not run |
| J5 | Fresh clone → `npm ci` → `npm run dev` works per the README | Not run |
| J6 | No console errors on any route during the H scenarios | Not run |
| J7 | No `any`, `eval`, `dangerouslySetInnerHTML`, or `Math.random` in `src/` (grep) | Not run |
