# AvenBuild — Architecture (Demo Prototype)

**Status:** Phase 0 planning document · **Date:** 2026-10-24
Companion docs: `product-spec.md` (entities and rules), `ux-and-route-map.md` (routes), `acceptance-checklist.md`.

---

## 1. Repository audit (Phase 0 findings)

| Item | Finding |
|---|---|
| Git | Branch `main`, **no commits yet**. Only untracked file: `evan_build_claude_code_phase_prompts.md`. |
| Source code, package.json, configs, assets | **None.** Repository is empty apart from the prompt pack. |
| Local toolchain | Node **v22.19.0**, npm **10.9.3**. pnpm not installed → use **npm**. |
| Existing conventions to preserve | None yet. The prompt pack file stays untouched. |

The Master Instructions say to scaffold the recommended stack when the repository is empty. Versions were checked against the npm registry on 2026-10-24 (`npm view <pkg> version engines peerDependencies`), and **compatibility constraints were found**:

- `react-router@8.5.0` requires Node ≥ 22.22.0 → **incompatible** with the installed Node 22.19.0. Use **`react-router@7.18.x`** (Node ≥ 20), imported from `react-router` (v7 merges `react-router-dom` into `react-router`).
- `typescript@7.0.2` is newer than `typescript-eslint@8.72.0` supports (`>=4.8.4 <6.1.0`). Use **`typescript@~6.0.3`**.
- `jsdom@30` requires Node ≥ 22.22.2 → use **`jsdom@29.1.x`** (Node ^22.13).
- `vitest@5.0.5` requires Node ^22.12 ✓. `vite@8.3.5` requires ^22.12 ✓. `eslint@10` requires ^22.13 ✓.

If the team upgrades Node to ≥ 22.22, react-router 8 and jsdom 30 become options. Re-check before upgrading.

## 2. Recommended minimal scaffold (Phase 1 executes this)

The project is created by hand-writing config files instead of running an interactive template (`npm create vite` prompts and could overwrite the root), so nothing existing gets clobbered.

**Runtime dependencies**

| Package | Version range | Purpose |
|---|---|---|
| react, react-dom | ^19.3.1 | UI |
| react-router | ^7.18.4 | Routing (data router, `createBrowserRouter`) |
| zustand | ^5.0.16 | Single client-side store |
| zod | ^4.6.7 | Schemas for forms **and** persisted-state validation |
| react-hook-form | ^7.91.0 | Forms |
| @hookform/resolvers | ^6.0.0 | Zod resolver for RHF |
| lucide-react | ^1.61.0 | Icon system |
| @fontsource-variable/archivo | ^5.3.0 | Display/UI typeface, self-hosted (no Google Fonts request) |
| @fontsource/ibm-plex-mono | ^5.3.0 | Figures, quantities, IDs, money columns |

**Dev dependencies**

| Package | Version range | Purpose |
|---|---|---|
| vite | ^8.3.5 | Build/dev server |
| @vitejs/plugin-react | ^6.1.2 | React plugin (peer: vite ^8) |
| tailwindcss, @tailwindcss/vite | ^4.3.3 | Styling with CSS-first `@theme` tokens |
| typescript | ~6.0.3 | Strict typing (see constraint above) |
| @types/react, @types/react-dom | ^19.3.0 | Types |
| vitest | ^5.0.5 | Unit/integration tests |
| jsdom | ^29.1.1 | DOM test environment |
| @testing-library/react, @testing-library/dom, @testing-library/user-event, @testing-library/jest-dom | 16.3.x / 10.4.x / 14.6.x / 7.0.x | Component/flow tests |
| eslint, @eslint/js | ^10.x | Lint |
| typescript-eslint | ^8.72.0 | TS lint rules |
| eslint-plugin-react-hooks | ^7.1.1 | Hooks rules |
| eslint-plugin-react-refresh | ^0.5.7 | Fast-refresh safety |
| globals | ^17.x | ESLint globals |
| @playwright/test | ^1.64.x | **Added in Phase 7 only** (needs a browser binary download, so ask before installing) |

No other dependencies are planned. Date math uses native `Intl`/`Date` with small helpers. Dialogs use the native `<dialog>` element wrapped in an accessible component, with no UI-kit dependency. Before Phase 1 installs anything, re-check these versions to make sure they still resolve together.

**package.json scripts (Phase 1)**

```
dev        vite
build      tsc -b && vite build
preview    vite preview
typecheck  tsc -b --noEmit   (or tsc -p tsconfig.app.json --noEmit)
lint       eslint .
test       vitest run
test:watch vitest
check      npm run typecheck && npm run lint && npm run test && npm run build
e2e        playwright test   (Phase 7)
```

**TypeScript:** `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` (drop it only if it causes real friction, and document why), `noImplicitOverride`, `verbatimModuleSyntax`. Path alias `@/` → `src/`.

## 3. Layered architecture

```
┌──────────────────────────────────────────────────────────────┐
│ UI  (src/app, src/components, src/features/*)                │
│  React components, routes, forms (RHF+Zod), view hooks       │
└──────────────▲───────────────────────────────┬───────────────┘
               │ selectors (read)              │ commands (write)
┌──────────────┴───────────────────────────────▼───────────────┐
│ Store  (src/app/store)                                       │
│  Zustand: holds DemoState; dispatch(cmd) → domain → new state │
│  Subscribes persistence; exposes recovery notices            │
└──────────────▲───────────────────────────────┬───────────────┘
               │ pure functions                │ persist / load
┌──────────────┴──────────────┐  ┌─────────────▼───────────────┐
│ Domain  (src/domain)        │  │ Storage (src/lib/storage)   │
│  types, state machines,     │  │  StorageAdapter interface   │
│  commands, quote math,      │  │  LocalStorageAdapter        │
│  matching, selectors,       │  │  MemoryAdapter (tests,      │
│  event→notification rules   │  │   quota fallback)           │
│  NO React, NO storage       │  │  envelope + migrations      │
└──────────────▲──────────────┘  └─────────────▲───────────────┘
               │ schemas                        │ validates with
┌──────────────┴────────────────────────────────┴──────────────┐
│ Validation (src/lib/validation) — Zod schemas, shared by     │
│ forms, domain command inputs and persisted-state parsing     │
└──────────────────────────────────────────────────────────────┘
               Seed data (src/data) — deterministic fixtures
```

**Rules**
- `src/domain` and `src/lib/validation` import nothing from React, the DOM or storage. They are the parts a future Expo app or server can reuse.
- UI components never touch `localStorage`. They only read through selectors and write through `dispatch(command)`.
- Each domain command is a pure function: `(state, input, ctx) → Result<{ state, events }>`, where `ctx = { now: () => string, newId: (prefix) => string, actorId }`. Tests inject a fixed clock and a deterministic ID generator.
- State is **normalized** (`Record<Id, Entity>` tables), with a single source of truth. Derived values (quote totals, unread counts, progress, rating aggregates, pipeline stage, lead matches) are computed by selectors and never stored as authoritative data.
- State is immutable: commands return new objects. Zustand's `set` receives the new state.

## 4. State shape

```ts
interface DemoState {
  meta: { schemaVersion: 1; seedId: string; seedAnchor: string /* ISO date */; activePersonaId: UserId | null };
  users: Record<UserId, User>;
  ownerSettings: Record<UserId, OwnerSettings>;
  contractorProfiles: Record<UserId, ContractorProfile>;
  portfolio: Record<PortfolioItemId, PortfolioItem>;
  projects: Record<ProjectId, Project>;
  leadStates: Record<string /* `${contractorId}:${projectId}` */, LeadState>;
  invitations: Record<string, QuoteInvitation>;
  shortlist: Record<string, ShortlistEntry>;
  quotes: Record<QuoteId, Quote>;
  workspaces: Record<WorkspaceId, Workspace>;
  milestones: Record<MilestoneId, Milestone>;
  siteUpdates: Record<SiteUpdateId, SiteUpdate>;
  documents: Record<DocumentId, WorkspaceDocument>;
  changeRequests: Record<ChangeRequestId, ChangeRequest>;
  activity: Record<ActivityId, ActivityEvent>;
  conversations: Record<ConversationId, Conversation>;
  messages: Record<MessageId, Message>;
  notifications: Record<NotificationId, Notification>;
  reviews: Record<ReviewId, Review>;
}
```

IDs are branded string types (`type ProjectId = string & { __brand: 'ProjectId' }`). Seed IDs are fixed strings (`prj_seed_waterproof_kothrud`). New IDs use `${prefix}_${crypto.randomUUID()}`. Array indexes are never used as IDs.

## 5. Persistence: versioned localStorage adapter

```ts
interface StorageAdapter {
  load(): LoadResult;                 // never throws
  save(state: DemoState): SaveResult; // never throws
  clear(): void;
  subscribe(onExternalChange: () => void): () => void; // cross-tab
}
type LoadResult =
  | { kind: 'ok'; state: DemoState }
  | { kind: 'empty' }                                   // first run
  | { kind: 'recovered'; reason: 'malformed' | 'invalid' | 'unknown_version' | 'unavailable'; detail: string };
type SaveResult = { kind: 'ok' } | { kind: 'failed'; reason: 'quota' | 'unavailable' };
```

- **Key:** `avenbuild.demo` (a single key). **Envelope:** `{ schemaVersion: number, savedAt: string, data: unknown }`.
- **Load pipeline:** read → `JSON.parse` (in try/catch) → check envelope shape → `migrate(fromVersion → CURRENT)` via an ordered `migrations` map → validate `data` with `demoStateSchema` (Zod) → referential-integrity check (e.g. every quote's project exists) → `ok`. Any failure → `recovered`, and the store loads the seed.
- **Recovery UX:** a non-blocking banner/toast such as "Saved demo data couldn't be read (invalid format), so the original demo data was restored." The broken raw string is copied to `avenbuild.demo.corrupt-backup` (best effort, ignored if quota fails) for debugging.
- **Save:** the store subscribes and saves after every committed command, coalesced with `queueMicrotask`/a short debounce. On `quota`/`unavailable` the app keeps working in memory and shows a persistent notice: "Changes in this session can't be saved in this browser." It never shows a false "saved".
- **Cross-tab:** a `storage` event on the key → reload through the same validated pipeline → replace the store state → keep the current route. If the record the user is viewing has disappeared (for example after a reset in another tab), the page shows its not-found state with a link back.
- **Reset demo data:** confirm dialog → `clear()` → build the seed with a new anchor → save → navigate to `/start` with a toast. The active persona is cleared.
- **Binary files:** never persisted. `AttachmentMeta` is persisted. User-selected image previews use `URL.createObjectURL` kept in an in-memory `sessionPreviewRegistry` (Map id → url, revoked on unmount/reset). After a refresh the metadata row remains and says "Preview not available after refresh — files aren't stored in this demo." Seeded images point to bundled static assets.
- **Why not `zustand/persist`:** the prompt pack requires schema validation, integrity checks, quota handling and recovery notices. A ~100-line adapter with an explicit interface is clearer than overriding `persist`'s `merge`/`migrate`/storage hooks, and it is the seam a real API will replace. Persistence is still versioned.

### Deterministic seed and the demo clock
- The seed is built by `buildSeed(anchor: Date)`. Every seeded timestamp is a fixed offset from `anchor` (e.g. "published anchor −6d 10:30"). Content, IDs and relationships are fully deterministic. Absolute dates follow the anchor, so seeded quote validity dates don't go stale.
- `seedAnchor` is set to local midnight on first run/reset and stored in `meta`. Tests use a fixed anchor (`2026-10-20`) and get byte-identical seeds (snapshot-tested).
- New user actions use the real clock through `ctx.now()`.
- No `Math.random` anywhere in seed or displayed metrics.

## 6. State machines

Each machine is a transition table in `src/domain/<entity>/machine.ts`: `{ [from]: { [event]: { to, guard?, actor } } }`. `canTransition(entity, event, actor, state)` is used by commands (which enforce it) and by UI (which disables a control and shows the reason). Invalid transitions return a typed `DomainError` such as `{ code: 'INVALID_TRANSITION', message }`; they never throw into React.

### 6.1 Project

```
            publish (owner, valid brief)
  draft ───────────────────────────────► open ◄──────────────┐
    │ delete (owner, confirm + undo)       │ first quote       │ last live quote
    ▼                                      │ submitted (system)│ withdrawn/declined
  (removed)                                ▼                   │ (system)
                                        reviewing ─────────────┘
              pause (owner)  ┌──────────── │ ────────────┐
   open/reviewing ──────────►│  paused     │             │
                 ◄───────────┘ reopen →    │ accept quote (owner; project not paused;
                   (back to open or        │  quote acceptable; no workspace exists)
                    reviewing by quote     ▼
                    count)              awarded ── first milestone started (system) ──► in_progress
                                           │                                              │
                                           │ cancel (owner, reason, confirm)              │ complete (owner;
                                           ▼                                              │  all milestones approved)
  draft/open/reviewing/paused ─ close (owner: "stop collecting quotes") ─► closed         ▼
  open/reviewing/paused/awarded/in_progress ── cancel (owner, reason) ──► cancelled     completed
```

| From | Event | To | Guard / side effects |
|---|---|---|---|
| draft | `publish` | open | Brief passes `projectPublishSchema`. Sets `publishedAt`. Matching contractors get a "new lead" notification. |
| draft | `delete` | — | Owner only. Confirmation, then an undo toast (restores the snapshot within the toast lifetime). |
| draft | `updateDraft` | draft | Partial schema (`projectDraftSchema`). |
| open | `quoteSubmitted` (system) | reviewing | Triggered by a quote `submit`. |
| reviewing | `liveQuotesDroppedToZero` (system) | open | When every quote is withdrawn/declined/expired. |
| open, reviewing | `pause` | paused | Stores `pausedFromStatus`. Removed from feeds. Quotes kept, not acceptable. |
| paused | `reopen` | open \| reviewing | Recomputed from live quote count. |
| open, reviewing | `acceptQuote` | awarded | Runs **acceptQuote transaction** (§6.6). |
| awarded | `milestoneStarted` (system) | in_progress | — |
| in_progress | `complete` | completed | All milestones `approved`. Workspace → `completed`. Review prompt notification to owner. |
| draft, open, reviewing, paused | `close` | closed | Live quotes → `declined(project_closed)`. Contractors notified. |
| open, reviewing, paused, awarded, in_progress | `cancel` | cancelled | Reason required. Live quotes declined. Active workspace → `cancelled`. Both parties notified. |
| closed, cancelled, completed | — | — | Terminal. |

Editing a published brief: allowed for non-structural fields (scope text, notes, attachments, site-visit info) while `open`/`reviewing`. Each edit is recorded as an activity event, and contractors with live quotes are notified. Changing category or city after publishing is **not allowed** (it would invalidate matching and quotes). The owner must close the project and create a new one. (Decision; noted in the UI.)

### 6.2 Quote

```
            submit                       owner opens        owner requests
  draft ─────────────► submitted ───────────────────► viewed ──── revision ────► revision_requested
    │ discard (confirm)   │  ▲                           │                            │
    ▼                     │  └──────── resubmit (rev+1) ─┴────────────────────────────┘
  (removed)               │
                          ├── accept (owner) ─────────► accepted        (from submitted | viewed)
                          ├── decline (owner) ────────► declined(owner)
                          ├── withdraw (contractor) ──► withdrawn  ── resubmit (rev+1, project eligible) ─► submitted
                          ├── validUntil passed ──────► expired (derived) ── owner requests revision ─► revision_requested
                          └── project closed/cancelled/awarded elsewhere ─► declined(project_closed | awarded_elsewhere)
```

| From | Event | To | Actor | Guard |
|---|---|---|---|---|
| — | `createDraft` | draft | contractor | Project `open`/`reviewing`. No existing quote for (project, contractor); otherwise open the existing one. |
| draft | `updateDraft` | draft | contractor | Partial validation. |
| draft | `discard` | — | contractor | Confirmation. |
| draft | `submit` | submitted | contractor | `quoteSubmitSchema` passes. Project eligible (P3). Owner notified. Project → reviewing if open. |
| submitted | `ownerViewed` | viewed | system (owner opens detail) | Sets `viewedAt`. No notification spam: one "viewed" activity entry only. |
| submitted, viewed, expired* | `requestRevision` | revision_requested | owner | Message required (10–1000 chars). Contractor notified. |
| revision_requested, withdrawn | `resubmit` | submitted | contractor | Snapshot previous version to `history`. `revision += 1`. Revalidate. Project eligible. |
| submitted, viewed | `accept` | accepted | owner | Project `open`/`reviewing` (not paused). Not expired. No workspace for the project. → transaction §6.6. |
| submitted, viewed, revision_requested | `decline` | declined(owner) | owner | Confirmation. Optional reason. Contractor notified. |
| submitted, viewed, revision_requested | `withdraw` | withdrawn | contractor | Confirmation. Owner notified. |
| any live | `projectClosed` / `awardedElsewhere` | declined(reason) | system | — |

\* `expired` is **derived**: `isExpired = status ∈ {submitted, viewed} && today > validUntil`. Selectors expose `effectiveStatus`. Commands check expiry as a guard, so stored data never goes stale.
Terminal: `accepted`, `declined`. `withdrawn` is terminal unless resubmitted (Q4).

### 6.3 Milestone

```
  pending ── start (contractor) ──► in_progress ── submit (contractor, evidence note) ──► submitted
                                        ▲                                                  │
                                        │                                    approve (owner)│ request_changes (owner, note)
                                        │                                                  ▼            ▼
                                        └──── resume (contractor) ─── changes_requested ◄──┘         approved (terminal)
```

| From | Event | To | Actor | Guard / effects |
|---|---|---|---|---|
| pending | `start` | in_progress | contractor | Workspace `active`. The first start moves the project awarded → in_progress. |
| in_progress | `submit` | submitted | contractor | Evidence note 10–1000 chars. Owner notified. |
| submitted | `approve` | approved | owner | Contractor notified. Progress recomputed. If all approved, owner gets a "ready to complete" prompt. |
| submitted | `requestChanges` | changes_requested | owner | Note required. Contractor notified. |
| changes_requested | `resume` | in_progress | contractor | — |
| pending | `edit` | pending | contractor | Title, description and target date only (not share %). Owner notified on date change. |

Share % and agreed totals change only via a **change request**:

```
  proposed ── accept (other party) ──► accepted  → agreement.revision += 1, new total/end date, activity event, both notified
     │    ── reject (other party, reason) ──► rejected
     └──── withdraw (proposer) ─────────────► withdrawn
```
Guard: at most one `proposed` change request per workspace at a time (keeps the agreement unambiguous). Either party may propose.

### 6.4 Conversation & notification read state

**Conversation** (per participant, derived from `lastReadAt[userId]` vs. message timestamps):

```
  read ── other party sends message ──► unread(n) ── participant opens thread / thread visible & focused ──► read
```
- Sending a message updates the sender's own `lastReadAt` (your own messages never count as unread).
- The conversation list sorts by latest message. The unread badge per conversation is a selector. The global "Messages" badge = conversations with unread > 0.
- `kind`: `enquiry` (created when a contractor asks a question about a lead or an owner invites a contractor) → `project` once that contractor's quote is accepted. Conversations with non-awarded contractors become read-only after award or close, with a banner "This enquiry is closed because the project was awarded / closed."

**Notification:**

```
  unread ── open (click deep link) | "mark read" | "mark all read" ──► read
  read   ── "mark unread" ─────────────────────────────────────────────► unread
```
- Opening the deep-linked target does **not** automatically mark other notifications read. Only the clicked one changes.
- Opening a conversation also marks that conversation's `new_message` notifications as read for the viewer, so the two badges stay consistent.

### 6.5 Contractor lead / pipeline stage (derived)

`pipelineStage(contractorId, projectId)` is computed, in priority order:
1. Quote `accepted` → **Accepted**
2. Quote `declined(owner)` → **Declined**
3. Quote `declined(awarded_elsewhere | project_closed)`, or project closed/cancelled/awarded to someone else → **Closed**
4. Quote `withdrawn` → **Withdrawn**
5. Quote `revision_requested` → **Revision requested**
6. Quote `submitted`/`viewed` (incl. derived expired → shows "Submitted · expired") → **Submitted**
7. Quote `draft` → **Quote draft**
8. LeadState `saved` → **Saved**
9. LeadState `ignored` → **Ignored** (hidden from the default feed; restorable)
10. Otherwise → **New** (or **Invited** when a QuoteInvitation exists)

Each stage shows the timestamp of the event that produced it.

### 6.6 acceptQuote transaction (atomic, pure)

Input: `quoteId`, actor = owner. In one command:
1. Guards: actor owns the project; project `open`/`reviewing`; quote `submitted`/`viewed` and not expired; `workspaces` has no entry for `projectId`.
2. Quote → `accepted` (snapshot frozen as `acceptedQuoteRevision`).
3. Every other live quote on the project → `declined(awarded_elsewhere)`.
4. Project → `awarded`.
5. Create a `Workspace` (unique per project), with agreement total = quote total and dates from the quote's start window + duration.
6. Create milestones (M1).
7. Conversation for (project, winning contractor) → `kind: project` (created if missing). Other contractors' enquiries → read-only.
8. Activity events and notifications: winner "Quote accepted", others "Project awarded to another contractor", owner toast.

Every step happens in one new state object or none does. Tests assert exactly one workspace even after a repeated accept.

## 7. Domain events → notifications

| Event | Recipient | Category | Deep link |
|---|---|---|---|
| Project published (matching) | matching contractors | project | `/contractor/leads/:projectId` |
| Owner invites contractor to quote | contractor | project | `/contractor/leads/:projectId` |
| Brief edited after publish | contractors with live quotes | project | `/contractor/leads/:projectId` |
| Quote submitted / resubmitted | owner | quote | `/owner/projects/:projectId/quotes/:quoteId` |
| Quote withdrawn | owner | quote | same |
| Revision requested | contractor | quote | `/contractor/quotes/:quoteId` |
| Quote accepted | contractor | quote | `/workspace/:workspaceId` |
| Quote declined / awarded elsewhere / project closed | contractor | quote | `/contractor/quotes/:quoteId` |
| New message | other participant | message | `/messages/:conversationId` |
| Milestone submitted | owner | milestone | `/workspace/:workspaceId/milestones` |
| Milestone approved / changes requested | contractor | milestone | `/workspace/:workspaceId/milestones` |
| Milestone target date changed | owner | milestone | same |
| Change request proposed / resolved | other party | change | `/workspace/:workspaceId/changes` |
| Site update posted | owner | milestone | `/workspace/:workspaceId/updates` |
| Project completed → review prompt | owner | review | `/workspace/:workspaceId/review` |
| Review received | contractor | review | `/contractor/profile#reviews` |
| Project cancelled | other party | project | `/workspace/:workspaceId` or lead |

Notifications are only ever created inside domain commands (`events → deriveNotifications(events, state)`). They are recorded even for seeded non-persona recipients so the data stays coherent.

## 8. Matching, filtering and sorting (pure, in `src/domain/matching`)

`matchProject(profile, project, today) → { eligible: boolean; reasons: MatchReason[]; misses: MatchReason[] }`
- **Required for the feed:** project status `open`/`reviewing`; `project.category ∈ profile.services`; `project.location.city ∈ profile.serviceAreas[].city` (if the area lists localities, a locality match is shown as a stronger reason, but city is enough); profile `visibility = listed`.
- **Reasons (informational, shown as text):** "Service match: Waterproofing", "Service area: Pune · Kothrud", "Budget fits your typical range" (ranges overlap), "Start date fits your availability" (`availableFrom ≤ target start`), "You were invited".
- No scores, no randomness. Sort options: newest, start soonest, budget high→low, budget low→high, fewest quotes.
- Contractor discovery for owners uses the same module: filter by category, city, min rating (computed aggregate), min years, availability, has portfolio. Sort: best rated (avg, then count), most reviews, most experience, recently active. Hidden profiles are excluded. Profile edits change results immediately because everything reads the same store.

## 9. Validation (`src/lib/validation`)

- One Zod schema per form, plus stricter "publish/submit" variants: `projectDraftSchema` (partial) vs. `projectPublishSchema`; `quoteDraftSchema` vs. `quoteSubmitSchema`; `messageSchema`; `reviewSchema`; `contractorProfileSchema`; `ownerSettingsSchema`; `changeRequestSchema`.
- Money input: rupee strings parsed to integer paise with a strict regex (`^\d{1,9}(\.\d{1,2})?$`). No `parseFloat` rounding surprises. Quantity: `^\d{1,7}(\.\d{1,2})?$`, > 0.
- The persisted-state schema (`demoStateSchema`) is composed from the entity schemas, so stored data is validated the same way input is.
- User text is rendered as text only (no `dangerouslySetInnerHTML`, no `eval`).

## 10. UI system notes (detailed in Phase 1)

- **Brand config:** `src/config/brand.ts` (name, wordmark text, tagline) plus `src/styles/tokens.css` (Tailwind v4 `@theme`: colors, type scale, spacing, radii, shadows). Changing the product name or accent means editing just those two files.
- **Direction:** warm off-white paper surfaces, charcoal ink, one restrained warm accent (a brick/terracotta family, tuned to ≥ 4.5:1 contrast for text use), muted status palette (green/amber/red/slate), small radii (2–6px), hairline borders over shadows. Archivo for headings/UI and IBM Plex Mono for figures. Editorial layouts: rows, tables, timelines and split panes; cards only where grouping needs them.
- **Imagery:** no hotlinked images (they would be a hidden network dependency). Phase 1 uses **original** inline-SVG/CSS construction illustrations (section drawings, blueprint line art, material textures) bundled in the repo. Real photos can replace them later through `src/data/media.ts` once a licensed source is approved (open decision, product-spec §9).
- **Components:** Button, IconButton, TextField, TextArea, Select, Checkbox/Radio group, SegmentedControl, Chip, StatusBadge (text + color + icon, never color alone), Tabs, Dialog (native `<dialog>`, focus trap and restore), ConfirmDialog, Menu/Dropdown, Toast region (`aria-live`) with undo action, Skeleton, EmptyState, ErrorState, Avatar (initials), ProgressBar/Meter, DataList (table on ≥ md, stacked rows on mobile), Stepper, MoneyText, DateText, DemoBanner, PersonaSwitcher.

## 11. Feature boundaries (folder plan)

```
src/
  main.tsx, app/               router.tsx, AppShell, RootErrorBoundary, RequirePersona guard, store/
  config/                      brand.ts, locale.ts (en-IN, INR, date formats)
  styles/                      tokens.css, base.css
  components/                  ui/ (design-system primitives), layout/ (PageHeader, Breadcrumbs, BottomNav, Sidebar)
  domain/
    types.ts, ids.ts, result.ts, errors.ts, clock.ts
    projects/  (machine.ts, commands.ts, selectors.ts)
    quotes/    (machine.ts, math.ts, commands.ts, selectors.ts)
    leads/     (pipeline.ts, commands.ts)
    matching/  (match.ts, filters.ts, sort.ts)
    workspace/ (accept.ts, milestones.ts, changeRequests.ts, progress.ts, siteUpdates.ts)
    messages/  (commands.ts, unread.ts)
    notifications/ (derive.ts, commands.ts)
    reviews/   (eligibility.ts, aggregate.ts, commands.ts)
    profile/   (completeness.ts, commands.ts)
  data/                        seed/ (users.ts, contractors.ts, projects.ts, quotes.ts, workspace.ts, messages.ts, reviews.ts, index.ts → buildSeed), categories.ts, cities.ts, media.ts
  lib/
    storage/                   adapter.ts, localStorageAdapter.ts, memoryAdapter.ts, envelope.ts, migrations.ts, sessionPreviews.ts
    validation/                money.ts, project.ts, quote.ts, message.ts, review.ts, profile.ts, demoState.ts
    format/                    money.ts, date.ts, number.ts (use config/locale.ts)
  features/
    public/       (Landing, StartPersona, Help)
    owner/        (Dashboard, Settings)
    projects/     (CreateProjectWizard, MyProjects, ProjectDetail, EditDraft)
    contractors/  (Discover, ContractorProfileView, Shortlist)
    quotes/       (ReceivedQuotes, QuoteDetail, CompareQuotes, QuoteComposer, Pipeline)
    contractor/   (Dashboard, LeadFeed, LeadDetail, Settings)
    profile/      (ContractorProfileEditor, PortfolioManager, OwnerProfile)
    workspace/    (Overview, Milestones, SiteUpdates, Documents, ChangeRequests, Activity, Review)
    messages/     (ConversationList, Thread)
    notifications/(NotificationCenter)
  tests/                       setup.ts, test-utils (renderWithStore, fixed clock), flows/
```

Domain unit tests live next to the code (`*.test.ts`). Flow tests (RTL) live in `src/tests/flows`.

## 12. Error handling
- `RootErrorBoundary` at the router root and a route-level `errorElement` give a friendly recovery screen ("Something went wrong on this page" + Go to dashboard + Reset demo data) instead of a white screen.
- Domain commands return `Result<T, DomainError>`. The UI shows field errors, inline errors or toasts. No errors are swallowed silently.
- Unknown IDs in routes show a not-found state with navigation back.

## 13. Future replacement and reuse
| Layer | Demo | Future |
|---|---|---|
| `StorageAdapter` | localStorage | Replaced by an API-backed repository. Commands become server calls, and the server re-runs the same transition rules authoritatively (client checks are UX only). |
| `src/domain` | Pure TS | Shared package (`@avenbuild/domain`) used by web, Expo and server. |
| `src/lib/validation` | Zod | Shared with server (request validation) and Expo forms. |
| Persona selector | Local only | Real auth + session + server-side role authorization. |
| Notifications/messages | Local events | Server events + realtime channel + push/email adapters. |
| Attachments | Metadata + session previews | Object storage with signed uploads and server-side type/size scanning. |
| Design tokens | Tailwind `@theme` | Exported to a JSON token file for React Native styling. The web components themselves are **not** reusable in React Native. |

Nothing in this prototype is a security control. All authorization, privacy, upload validation and rate limiting must be implemented server-side before production (Phase 8 documents this).

## 14. Phased build order
| Phase | Delivers | Key files |
|---|---|---|
| 0 | These four docs | `docs/*` |
| 1 | Scaffold (§2), tokens, brand config, UI primitives, app shell, demo banner, persona selector, landing page, `/help` stub, placeholder routes for every route in the route map, error boundaries | `package.json`, configs, `src/app`, `src/components`, `src/config`, `src/styles`, `src/features/public` |
| 2 | Domain types, machines, quote math, matching, notifications derivation, storage adapter, seed, store wiring, unit tests | `src/domain`, `src/lib`, `src/data`, `src/app/store` |
| 3 | Owner journey | `src/features/{owner,projects,contractors,quotes}` |
| 4 | Contractor journey | `src/features/{contractor,quotes,profile}` |
| 5 | Workspace, messages, notifications, milestones, documents, change requests | `src/features/{workspace,messages,notifications}` |
| 6 | Reviews, reputation, settings, help/FAQ, formatting config, polish | various |
| 7 | Playwright E2E, responsive and a11y audit, checklist results | `e2e/`, `docs/acceptance-checklist.md` |
| 8 | Mobile roadmap and handoff docs | `docs/*` |
