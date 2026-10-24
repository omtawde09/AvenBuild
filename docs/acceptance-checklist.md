# AvenBuild — Acceptance Checklist

> **2026-10-25:** at the owner's request the app no longer presents itself as a demo (no banner, no “sample/demo” labels). The technical limits in `demo-limitations-and-backend-replacement.md` still apply.

**Status:** Phase 7 results · **Last run:** 2026-10-24
An item is **Pass** only when it was actually executed: by an automated test (file named) or a manual check (described). Items that were implemented but not exercised are marked **Not run**.

**How results were produced**
- Unit + component tests: `npm run test` (Vitest + Testing Library, jsdom) — 83 tests, all passing.
- End-to-end: `npm run e2e` (Playwright 1.64, installed Microsoft Edge channel, production build served by `vite preview`).
  - `e2e/acceptance.spec.ts` — scenarios H1–H8 in sequence on a 375 × 812 touch viewport, failing on any console error.
  - `e2e/responsive.spec.ts` — 31 routes at 320/375/390/430/768/1024/1280/1440 px, plus touch-target and navigation checks.
  - `e2e/a11y.spec.ts` — axe-core (WCAG 2.0/2.1 A + AA) on 24 pages, keyboard/focus, headings, reduced motion.
- Static checks: `npm run typecheck`, `npm run lint`, `npm run build` (all passing), plus source greps noted below.

Result values: `Pass (auto: <file>)` · `Pass (manual: <how>)` · `Fail: <note>` · `Not run: <reason>`

---

## A. Prototype boundaries

| ID | Criterion | Result |
|---|---|---|
| A1 | Exactly two personas; no admin role or route | Pass (auto: `src/tests/shell.test.tsx`; manual: route table in `src/app/router.tsx` has only public/owner/contractor/shared routes) |
| A2 | No backend, API client or external data request | Pass (manual: source grep finds no `fetch`, `XMLHttpRequest`, `axios`, `WebSocket` or `http(s)://` URLs in `src/`; fonts are self-hosted) |
| A3 | Demo banner on every shell screen, linking to About and Reset | Changed 2026-10-25 by product decision: demo wording removed from the UI (no banner; reset lives in Help and Settings) |
| A4 | Persona selector isn’t described as sign-in or security | Changed 2026-10-25 by product decision: demo wording removed from the UI (account chooser: “Welcome to AvenBuild”) |
| A5 | Seeded profiles show “Sample verification · demo data”; user-entered fields “Not submitted” / “not checked”; never plain “Verified” | Changed 2026-10-25 by product decision: demo wording removed from the UI. Verification badges were removed rather than relabelled, so the UI makes no verification claim |
| A6 | No payment, card or bank inputs; milestone values say no payment is processed | Pass (manual: source grep; milestone tab copy) |
| A7 | File features say files aren’t uploaded and previews don’t survive refresh | Pass (manual: Documents tab, file picker and attachment rows in the browser) |
| A8 | `/help` lists every limitation | Changed 2026-10-25 by product decision: demo wording removed from the UI (Help is now a how-to and FAQ) |
| A9 | No real-looking names, phones, emails, addresses in seed | Pass (auto: `storage.test.ts`) |

## B. Persistence and recovery

| ID | Criterion | Result |
|---|---|---|
| B1 | First run loads the deterministic seed; main views non-empty | Pass (auto: `storage.test.ts`; e2e H7 “5 of 5 projects”) |
| B2 | Changes survive refresh | Pass (auto: `storage.test.ts`; e2e H1, H5 reloads) |
| B3 | Reset confirms; cancel changes nothing; confirm restores exact seed and goes to `/start` | Pass (auto: `shell.test.tsx`, `storage.test.ts`, e2e H7) |
| B4 | Malformed JSON → seed + non-blocking notice | Pass (auto: `storage.test.ts`; e2e H8) |
| B5 | Invalid schema / unknown version → recovery | Pass (auto: `storage.test.ts`) |
| B6 | Quota/unavailable → keeps working in memory with a “can’t save” notice | Pass (auto: `storage.test.ts`; e2e H8 with a simulated quota error) |
| B7 | Another tab’s change appears without refresh (persona kept) | Pass (auto: `storage.test.ts` via the adapter’s change event). Not run in two real browser tabs. |
| B8 | Only `src/lib/storage` touches localStorage | Pass (auto: ESLint `no-restricted-globals` / `no-restricted-properties`) |
| B9 | No binary file content stored | Pass (manual: `AttachmentMeta` holds metadata only; previews are in-memory object URLs) |

## C. Domain rules

| ID | Criterion | Result |
|---|---|---|
| C1 | Project transitions table-driven | Pass (auto: `src/tests/domain/lifecycle.test.ts`) |
| C2 | Quote transitions incl. withdrawn/declined/expired/paused | Pass (auto: `lifecycle.test.ts`) |
| C3 | Milestone transitions incl. change loop | Pass (auto: `lifecycle.test.ts`, `src/tests/flows/collaboration.test.tsx`) |
| C4 | Quote math: integer paise, 2-decimal quantities, discounts, tax, half-up, invalid input rejected | Pass (auto: `src/tests/domain/quoteMath.test.ts`; e2e H2 checks ₹16,529.15) |
| C5 | acceptQuote: one workspace, competitors declined, second accept fails | Pass (auto: `lifecycle.test.ts`, `flows/owner.test.tsx`) |
| C6 | Matching rules and exclusions | Pass (auto: `matching.test.ts`) |
| C7 | Filters and sorts | Pass (auto: `matching.test.ts`, `flows/owner.test.tsx`, `flows/contractor.test.tsx`) |
| C8 | Events create correct notifications and deep links | Pass (auto: `communication.test.ts`, `lifecycle.test.ts`) |
| C9 | Unread from `lastReadAt`; sender never unread | Pass (auto: `communication.test.ts`) |
| C10 | Change request bumps agreement revision; quote snapshot unchanged | Pass (auto: `lifecycle.test.ts`, `collaboration.test.tsx`) |
| C11 | Review eligibility and duplicates | Pass (auto: `communication.test.ts`, `flows/trust.test.tsx`) |
| C12 | Rating aggregates from records | Pass (auto: `matching.test.ts`, `communication.test.ts`; e2e H6) |
| C13 | Deterministic seed; no `Math.random` | Pass (auto: `storage.test.ts`; ESLint rule bans `Math.random`) |

## D. Owner journey

| ID | Criterion | Result |
|---|---|---|
| D1 | Wizard per-step validation; values kept between steps | Pass (auto: e2e H1, H8; manual browser run) |
| D2 | Draft save → refresh → resume at the same step | Pass (auto: e2e H1) |
| D3 | Publish confirmation; open; appears in contractor feed | Pass (auto: e2e H1, `lifecycle.test.ts`) |
| D4 | Drafts never in lead feeds | Pass (auto: `matching.test.ts`, `flows/contractor.test.tsx`) |
| D5 | My projects search/status/layout | Pass (auto: `flows/owner.test.tsx`; layout toggle manual in browser) |
| D6 | Pause/reopen/close/cancel only when valid, with confirmations and reasons | Pass (auto: `lifecycle.test.ts` for rules; manual: dialogs in browser). Not every dialog has a UI test. |
| D7 | Discovery filters/sort and clear-filters | Pass (auto: `flows/owner.test.tsx`, e2e H8) |
| D8 | Contractor profile content and Invite to quote | Pass (manual: browser — invite created and notified) |
| D9 | Shortlist add/remove with undo persists | Pass (auto: e2e H8 toggles it; manual undo in browser) |
| D10 | Compare 2–4 quotes on all attributes | Pass (auto: e2e H3; manual desktop table + stacked mobile layout) |
| D11 | Revision/accept/decline with confirmations; consistent everywhere | Pass (auto: `flows/owner.test.tsx`, e2e H3–H4) |
| D12 | Unsaved-change warning when leaving the wizard | Not run: implemented (`useBlocker` + `beforeunload`) but not exercised by a test or manually |

## E. Contractor journey

| ID | Criterion | Result |
|---|---|---|
| E1 | Feed shows eligible matches with reasons | Pass (auto: `flows/contractor.test.tsx`) |
| E2 | Search/filters/sort and empty state | Pass (auto: e2e H2, `matching.test.ts`) |
| E3 | Save / ignore / restore with undo | Pass (auto: `flows/contractor.test.tsx`, e2e H2) |
| E4 | No owner contact details on lead detail | Pass (manual: lead page shows first name + “contact through in-app messages” only) |
| E5 | Composer totals, field errors, draft/submit/revise/withdraw | Pass (auto: `flows/contractor.test.tsx`, e2e H2–H3, H8) |
| E6 | Can’t quote on ineligible projects (disabled with reason; domain rejects) | Pass (auto: `flows/contractor.test.tsx`, `lifecycle.test.ts`) |
| E7 | Pipeline stages and dates | Pass (auto: `matching.test.ts`; e2e H4) |
| E8 | Profile edits change discovery | Pass (auto: `flows/contractor.test.tsx`, `matching.test.ts`) |
| E9 | Portfolio add/edit/remove with local preview | Pass for add/remove/undo (auto: `flows/contractor.test.tsx`). Not run: selecting a real image file for preview |

## F. Collaboration

| ID | Criterion | Result |
|---|---|---|
| F1 | One workspace, same agreement for both personas | Pass (auto: e2e H4, `collaboration.test.tsx`) |
| F2 | Milestone loop and computed progress | Pass (auto: `collaboration.test.tsx`, e2e H5–H6) |
| F3 | Site update with progress and author | Pass (auto: e2e H5). Not run: attaching an image to an update |
| F4 | Documents metadata and in-session preview | Pass for metadata list (manual browser). Not run: picking a real file |
| F5 | Change request propose/accept/reject/withdraw → revision event | Pass for propose/accept (auto: `collaboration.test.tsx`); reject/withdraw covered by domain rules only |
| F6 | Activity timeline | Pass (auto: `collaboration.test.tsx`) |
| F7 | Messaging validation, notify, unread clears | Pass (auto: `collaboration.test.tsx`, e2e H5, H8) |
| F8 | Notification centre and deep links | Pass (auto: `collaboration.test.tsx`, e2e H3) |
| F9 | Persona switch + refresh show same data | Pass (auto: `collaboration.test.tsx`, e2e H4–H5) |
| F10 | Complete only when all approved → review | Pass (auto: `lifecycle.test.ts`, e2e H6) |

## G. Trust, settings and completeness

| ID | Criterion | Result |
|---|---|---|
| G1 | Review after completion only, no duplicates, aggregates update | Pass (auto: `flows/trust.test.tsx`, e2e H6) |
| G2 | Owner settings persist | Pass (auto: `flows/trust.test.tsx`) |
| G3 | Contractor settings persist; hidden removes from discovery | Pass (auto: `flows/trust.test.tsx`) |
| G4 | en-IN formatting, centralised | Pass (manual: all formatting goes through `src/lib/format` + `src/config/locale.ts`) |
| G5 | No dead links / `href="#"` / no-op controls | Pass (manual: source grep; all placeholder routes removed; `trust.test.tsx` asserts no “Coming in Phase”) |
| G6 | Dashboard counts match lists | Pass (manual: counts are selectors over the same state; spot-checked in browser) |

## H. End-to-end scenarios (from a reset seed, 375 px, Edge)

| ID | Scenario | Result |
|---|---|---|
| H1 | Landing → owner → draft → refresh → resume → publish → in contractor feed | Pass (auto: `e2e/acceptance.spec.ts`) |
| H2 | Contractor filters, saves, quotes two lines (₹16,529.15 verified), submits | Pass (auto) |
| H3 | Owner opens notification, compares (seeded project with 3 quotes), requests revision; contractor resubmits | Pass (auto). Note: the new project has one quote, so comparison is exercised on the seeded terrace project. |
| H4 | Accept → workspace, pipeline Accepted, same agreed amount for both | Pass (auto) |
| H5 | Messages both ways, unread clears, site update, milestone changes loop, refreshes | Pass (auto) |
| H6 | Complete → review → aggregate +1 → duplicate blocked | Pass (auto) |
| H7 | Reset restores seed | Pass (auto) |
| H8 | No results, invalid forms, empty message, invalid quote numbers, cancelled dialog, malformed and full storage | Pass (auto); no console errors across H1–H8 |

## I. Responsive and accessibility

| ID | Criterion | Result |
|---|---|---|
| I1 | No horizontal overflow at 320–1440 px on every route | Pass (auto: `e2e/responsive.spec.ts`, 31 routes × 8 widths). Fixed during Phase 7: dashboard/detail grids overflowing, document thumbnails, compare buttons at 320 px |
| I2 | Dialogs/sheets not clipped; sticky bars don’t cover actions | Pass (auto: responsive spec checks the wizard’s Next button is in view on 320 × 640; manual dialogs at 375 px) |
| I3 | Wide tables become stacked rows on mobile | Pass (manual: quote lines, comparison, pipeline, landing sample quote) |
| I4 | Primary touch targets ≥ 44 px | Pass (auto: responsive spec measures the bottom navigation) |
| I5 | Keyboard: skip link, visible focus, dialog focus contained and restored | Pass (auto: `e2e/a11y.spec.ts`) |
| I6 | Landmarks, one h1, labels, alt text | Pass (auto: a11y spec + axe) |
| I7 | Status as text and icon; contrast | Pass (auto: axe colour-contrast; badges always carry text) |
| I8 | Reduced motion | Pass (auto: a11y spec) |
| I9 | Semantic buttons/links | Pass (auto: axe; manual review) |

## J. Engineering quality

| ID | Criterion | Result |
|---|---|---|
| J1 | Type-check passes | Pass (`npm run typecheck`) |
| J2 | Lint passes with no global disables | Pass (`npm run lint`) |
| J3 | Tests pass | Pass (`npm run test`, 83/83; `npm run e2e`, see H/I) |
| J4 | Build passes | Pass (`npm run build`, no chunk-size warning) |
| J5 | Fresh clone → `npm ci` → `npm run dev` | Not run: only the working checkout was used |
| J6 | No console errors during H scenarios | Pass (auto: acceptance spec fails on any console error) |
| J7 | No `any`, `eval`, `dangerouslySetInnerHTML`, `Math.random` | Pass (manual grep; ESLint bans `any` and `Math.random`) |

## Known gaps (honest list)

- D12, E9/F3/F4 file-picking and B7 two-real-tab sync were not exercised end to end.
- Change-request reject/withdraw and several project dialogs (close, cancel, delete-with-undo) are covered by domain tests and manual clicks, not by UI tests.
- Testing used Edge only; Safari/Firefox were not tested.
