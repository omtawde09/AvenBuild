# AvenBuild — Product Specification (Demo Prototype)

**Status:** Phase 0 planning document · **Date:** 2026-10-24
**Source of requirements:** `evan_build_claude_code_phase_prompts.md` (the prompt pack). Where this spec makes a choice the prompt pack leaves open, it is marked **Decision** and can be revised.

"AvenBuild" is a working product name only. No trademark clearance is implied.

---

## 1. Product summary

AvenBuild is a marketplace web app connecting **Property Owners** who need construction work done with **Contractors** who do it. It covers the full lifecycle, not just lead discovery:

1. Owner posts a structured project brief.
2. Contractors whose services and service areas match discover the lead.
3. Contractors ask questions or submit itemized quotes.
4. Owner compares quotes on cost, inclusions/exclusions, timeline, validity and contractor evidence.
5. Owner accepts exactly one quote → a shared project **workspace** is created.
6. Both parties exchange messages, documents and schedule updates in the workspace.
7. Contractor records milestones and site updates; owner approves or requests changes.
8. Owner marks the project complete and leaves a review.

Product differentiators: **clarity** (structured briefs and itemized quotes), **honest trust evidence** (no invented verification), and a **visible lifecycle** where every state is labelled and explained.

### Market evidence (public sources only)

The prompt pack's market analysis (Buildbrixz, BuildWize, Houzz/Houzz Pro, Build Buddy) is based on public store listings and websites only. This product does not reproduce any competitor's branding, copy, screenshots or private behaviour, and makes no claims about how those products work internally. Unknown details stay unknown.

---

## 2. Roles

There are exactly two roles. **No admin role.**

| Role | Primary goals | Owns |
|---|---|---|
| **Property Owner** | Describe work clearly, find credible contractors, compare quotes fairly, track work, close out and review | Project briefs, shortlist, quote decisions, milestone approvals, change-request decisions, reviews |
| **Contractor** | Find relevant leads, quote accurately, win work, deliver against milestones, build reputation | Contractor profile, portfolio, lead states, quotes, milestone progress, site updates |

### Demo personas

- **Owner persona:** one fictional owner account (Decision: "Meera Kulkarni", Pune). Has seeded projects in several states.
- **Contractor persona:** one fictional contractor business (Decision: "Sahyadri Waterproofing & Civil Works", Pune). Has seeded leads, quotes, and one active workspace.
- **Other seeded users:** about 7 more fictional contractors (for discovery and comparison) and 3 fictional non-persona owners (so the contractor lead feed shows projects from more than one owner). These cannot be signed into. They exist only as seed content.

All seeded names, businesses, localities and reviews are fictional. No phone numbers or email addresses are shown. Where a contact field is needed, it reads "Contact via in-app messages (demo)".

---

## 3. No-backend constraint and demo-mode messaging

### What this prototype is

- A single-page web app that runs entirely in the browser.
- All data lives in one browser profile's `localStorage`, behind a versioned storage adapter (see `architecture.md`).
- Owner and contractor experiences are linked because both personas read and write the **same local state** in the same browser profile.

### What this prototype is not (must stay simulated or absent)

| Area | Prototype behaviour | Never |
|---|---|---|
| Authentication | Persona selector ("Continue as Property Owner / Contractor"). No password, no OTP. | Called "sign in", "secure", or "account verified" |
| Identity, licence, GST verification | Seeded profiles show **"Sample verification · demo data"**. Fields a user edits show **"Not submitted"**. | Any claim that a real check happened |
| Payments | **Not included in this prototype (Decision).** Milestone values are shown as "Agreed value — no payment is processed in this demo". | Card/bank entry, escrow, "funds protected" |
| Messaging | Messages are written to local state immediately. | "Delivered", "sent to their phone", real-time network language |
| Notifications | In-app notification centre generated from domain events | Email, SMS or push delivery |
| Files | File **metadata** is stored. Image previews use session-only object URLs and are lost on refresh; the UI says so. | "Uploaded", "stored securely", cloud storage |
| Sync | None. | Any suggestion that another device or person sees the change |

### Required demo-mode UI

- A persistent, compact **Demo mode** banner in the app shell: "Demo mode — data is stored only in this browser and doesn't sync to other devices or people." It links to `/help` and to **Reset demo data**.
- **Reset demo data** is in the banner menu and in both personas' settings. It asks for confirmation, then restores the original deterministic seed.
- A **Switch persona** control, always reachable, labelled as a testing affordance.
- An **About this demo** page (`/help`) listing every limitation above.
- Storage recovery notice: if stored data is malformed, incompatible or the quota is exceeded, the app falls back to seed (or keeps working in memory) and shows a non-blocking explanation.

---

## 4. In-scope features

### 4.1 Public
- Landing page: value proposition, entry points for both roles, "How it works" for each role, service-category discovery, process imagery, honest trust principles, call to action.
- Persona selection (`/start`).
- Help / FAQ / About this demo (`/help`).

### 4.2 Owner
- Dashboard: project summary by status, latest messages, quote activity, next actions, recent site updates.
- Create project: multi-step validated form with draft save, back/next, review step and publish confirmation. Fields are listed in §6.2.
- My projects: search, status filter, list/card view toggle; project detail; edit draft; pause, reopen, cancel and close within valid states; delete draft (with undo).
- Discover contractors: search, category, city, minimum rating, minimum experience, availability, sort.
- Contractor profile detail: services, areas, experience, portfolio, review breakdown, response-time sample, demo verification label, "Invite to quote" action.
- Shortlist (bookmarks).
- Received quotes for a project: view details, request revision, accept, decline (all with confirmations).
- Side-by-side quote comparison: total, line items, inclusions, exclusions, assumptions, timeline, validity, contractor evidence.
- Reviews after completion.
- Profile and settings: name, contact preference, city/locality, notification preferences, demo data controls.

### 4.3 Contractor
- Dashboard: relevant lead count, saved leads, quotes awaiting response, active jobs, upcoming milestones, a few honest metrics derived from local data.
- Lead feed: matched leads with matching reasons; search, filters, sort; save and ignore.
- Lead detail: scope, locality, type, budget, schedule, attachment metadata, owner notes, lead status. **No owner personal contact details are shown.** Communication goes through in-app messages.
- Quote composer: line items (description, quantity, unit, rate), discount, tax, live totals, start window, duration, proposed milestones, inclusions, exclusions, assumptions, validity date, note. Save draft, submit, revise, withdraw.
- Pipeline / quote inbox with stages New, Saved, Quote draft, Submitted, Revision requested, Accepted, Declined, Withdrawn, Closed, each showing the date of its last event.
- Profile editor: business name, bio, services, experience, service areas, availability, typical project range, team size, contact preferences, optional licence/GST sample fields (status "Not submitted").
- Portfolio manager: add, edit and remove entries, with local image previews.
- Settings: profile visibility, quote defaults (validity days, tax %, standard inclusions/exclusions), notification preferences, demo controls.

### 4.4 Shared (both roles)
- Project workspace: summary, activity timeline, milestones, site updates, documents, change requests, project conversation.
- Messages: conversation list and thread, unread state, send with validation, scroll to latest.
- Notification centre: read/unread, mark all read, deep links, category and time labels.

### 4.5 Explicitly out of scope (this prototype)
Database, backend, API server, Firebase/Supabase or any hosted or third-party data service; real auth/OTP/password recovery; payments, escrow or money movement; real identity, licence or GST checks; email/SMS/push; voice/video; live maps; cross-device sync; admin role; native mobile app.

---

## 5. Lifecycle overview

```
Owner                          Contractor
─────                          ──────────
Draft project
  │ publish
  ▼
Open ──────────────► appears in matching lead feeds
  │                    │ save / ignore / message
  │                    ▼
  │                  Quote draft ── submit ──► Owner notified
  ▼                                             │
Reviewing quotes ◄──────────────────────────────┘
  │ request revision ──► Contractor revises ──► resubmits
  │ decline ──────────► Contractor sees "Declined"
  │ accept (one quote)
  ▼
Awarded ── workspace created; other live quotes closed ("Awarded elsewhere")
  │ contractor starts first milestone
  ▼
In progress ── milestones: start → submit → approve / request changes
  │            site updates, documents, change requests, messages
  │ all milestones approved → owner marks complete
  ▼
Completed ── owner leaves one review → contractor profile aggregates update
```

Full state machines and transition guards are in `architecture.md` §6.

---

## 6. Domain entities

Field lists are the planned minimum. Exact TypeScript types are defined in Phase 2. Money is stored as **integer paise**. Dates are ISO-8601 strings.

### 6.1 People and profiles
- **User**: `id`, `role` (`owner` | `contractor`), `displayName`, `city`, `locality`, `isPersona` (true only for the two demo personas), `isSeed`.
- **OwnerSettings**: `contactPreference`, `notificationPrefs` (per category on/off).
- **ContractorProfile**: `userId`, `businessName`, `bio`, `services: ServiceCategoryId[]`, `serviceAreas: ServiceArea[]`, `yearsExperience`, `teamSize`, `availability` (`available` | `limited` | `unavailable`, plus `availableFrom`), `typicalProjectRange` (min/max paise), `contactPreferences`, `qualifications` (optional licence/GST sample fields with `verificationStatus`: `sample_demo` | `not_submitted`), `responseTimeSampleHours` (seeded sample value, labelled as such), `visibility` (`listed` | `hidden`), `quoteDefaults`.
- **ServiceCategory** (static): `id`, `label`, `description`, `defaultUnits`. The planned set: RCC work, brickwork, waterproofing, plumbing, electrical, excavation, tile work, fabrication sheds, PEB structures, paver blocks, RCC wells, trimix flooring.
- **ServiceArea**: `city`, optional `localities[]`.
- **PortfolioItem**: `id`, `contractorId`, `title`, `category`, `description`, `approxValueRange`, `completedOn`, `city`, `images: AttachmentMeta[]`.
- **Review**: `id`, `projectId`, `workspaceId`, `ownerId`, `contractorId`, `rating` (1–5), dimension ratings (`communication`, `quality`, `scheduleClarity`, optional), `text`, `createdAt`, `isSeed`.

### 6.2 Project brief
**Project**: `id`, `ownerId`, `status`, `category`, `title`, `scope` (free text), `scopeItems[]` (short structured list), `propertyType` (`apartment` | `independent_house` | `commercial` | `industrial` | `plot` | `other`), `location` (`city`, `locality`, optional `landmark`; no full street address), `budget` (`minPaise`, `maxPaise`, or `undisclosed`), `startPreference` (`asap` | `within_month` | `flexible` | `specific_date` with `targetStartDate`), `durationEstimate` (optional, days or weeks), `siteVisit` (availability windows text and allowed days), `materialResponsibility` (`contractor` | `owner` | `shared`), `attachments: AttachmentMeta[]`, `accessNotes`, `publishedAt`, `pausedFromStatus`, `closedReason`, `createdAt`, `updatedAt`, `draftStep`.

### 6.3 Leads, shortlist and quotes
- **LeadState**: keyed by `(contractorId, projectId)`, `disposition` (`saved` | `ignored`; no record means "new"), `updatedAt`. Pipeline stage is **derived** from the lead state and the contractor's quote (see architecture §6.5).
- **ShortlistEntry**: `ownerId`, `contractorId`, optional `projectId`, `createdAt`.
- **QuoteInvitation**: `projectId`, `contractorId`, `createdAt`. Created when an owner uses "Invite to quote". It marks the lead as "Invited" for that contractor.
- **Quote**: `id`, `projectId`, `contractorId`, `status`, `revision` (1-based), `lineItems[]`, `discount` (`none` | `percent` | `flat`), `taxPercent`, computed `totals` (always recomputed by the domain, never trusted from storage), `startWindow` (earliest/latest), `durationDays`, `proposedMilestones[]` (title, share %), `inclusions[]`, `exclusions[]`, `assumptions[]`, `validUntil`, `note`, `revisionRequest` (owner message, requested at), `history: QuoteRevision[]` (snapshots of prior submitted revisions), `declineReason` (`owner` | `awarded_elsewhere` | `project_closed`), timestamps per event.
- **LineItem**: `id`, `description`, `quantity` (≤ 2 decimals, > 0), `unit` (`sq_ft`, `sq_m`, `cu_m`, `rft`, `nos`, `kg`, `lump_sum`, `day`), `ratePaise` (integer ≥ 0).

### 6.4 Shared workspace
- **Workspace**: `id`, `projectId` (**unique**), `ownerId`, `contractorId`, `acceptedQuoteId`, `acceptedQuoteRevision`, `agreement` (current agreed total, start date, end date, agreement revision number), `status` (`active` | `completed` | `cancelled`), `createdAt`, `completedAt`.
- **Milestone**: `id`, `workspaceId`, `order`, `title`, `description`, `targetDate`, `sharePercent` (the demo rule: shares sum to 100; value = share × agreed total, display only), `status`, `evidenceNote`, `changeRequestNote`, timestamps.
- **SiteUpdate**: `id`, `workspaceId`, `authorId`, `date`, `notes`, `progressPercent`, `attachments[]`.
- **Document**: `AttachmentMeta` plus `workspaceId`, `addedBy`, `addedAt`.
- **AttachmentMeta**: `id`, `name`, `mimeType`, `sizeBytes`, `addedAt`, `previewKind` (`session_image` | `seed_image` | `none`). Binary content is **never** stored in `localStorage`.
- **ChangeRequest**: `id`, `workspaceId`, `proposedBy`, `kind` (`scope` | `date` | `price`), `reason`, `proposed` (new total and/or new end date, plus a scope note), `status` (`proposed` | `accepted` | `rejected` | `withdrawn`), `resolvedAt`, `resultingAgreementRevision`.
- **ActivityEvent**: `id`, `workspaceId` or `projectId`, `type`, `actorId`, `at`, `refs`. This is an append-only log.

### 6.5 Communication
- **Conversation**: `id`, `projectId`, `ownerId`, `contractorId`, `kind` (`enquiry` before award, `project` after; same record, `kind` updates on award), `lastReadAt: { [userId]: iso }`. Unique by `(projectId, contractorId)`.
- **Message**: `id`, `conversationId`, `senderId`, `body` (1–2000 chars, trimmed, plain text), `sentAt`.
- **Notification**: `id`, `recipientId`, `category` (`project` | `quote` | `message` | `milestone` | `change` | `review` | `system`), `type`, `title`, `body`, `link` (an internal route), `createdAt`, `readAt`.

---

## 7. Key business rules

### Projects
- P1. Drafts are visible only to their owner. They never appear in lead feeds and cannot receive quotes.
- P2. Publishing requires every required field to pass validation (the same Zod schema as the form).
- P3. Contractors can see and quote a project only when its status is `open` or `reviewing`.
- P4. Paused projects disappear from lead feeds. Existing quotes are kept but cannot be accepted until the project is reopened.
- P5. `cancelled`, `closed` and `completed` are terminal. On entering `cancelled` or `closed`, every live quote becomes `declined` with reason `project_closed`.
- P6. Only one quote per project can be accepted (single-contractor model). Acceptance creates exactly one workspace. A second acceptance is rejected by the domain.
- P7. A project can be completed only when the workspace is active and every milestone is `approved`.

### Quotes
- Q1. One quote record per `(projectId, contractorId)`. Revising increments `revision` and snapshots the previous submitted version into `history`.
- Q2. At least one line item. Quantity > 0 with at most 2 decimals. Rate ≥ 0 whole paise, entered in rupees with at most 2 decimals. Discount ≤ subtotal. Tax 0–28%. Validity date must be after the submission date. Duration ≥ 1 day. Milestone shares, if given, must be positive integers that sum to 100.
- Q3. Totals use integer paise: `line = round(quantity × rate)`, `subtotal = Σ line`, `discount = flat or round(subtotal × pct / 100)`, `taxable = subtotal − discount`, `tax = round(taxable × taxPct / 100)`, `total = taxable + tax`. Rounding is half-up at each listed step and documented in the UI ("Rounded to the nearest paisa").
- Q4. A contractor can withdraw from `submitted`, `viewed` or `revision_requested`. Withdrawn quotes cannot be accepted. In this prototype a contractor can resubmit after withdrawing by creating a new revision, as long as the project is still eligible (Decision).
- Q5. A quote whose `validUntil` is before today is treated as `expired` and cannot be accepted. The owner can request a revision, which lets the contractor set a new validity date.
- Q6. Tax and GST fields are informational demo inputs. The UI does not claim tax compliance.

### Milestones and workspace
- M1. On acceptance, milestones are created from the quote's proposed milestones. If it has none, a default plan is used: "Mobilisation & site preparation" 20%, "Main works" 60%, "Finishing & handover" 20%.
- M2. Only the contractor starts, updates and submits milestones. Only the owner approves milestones or requests changes.
- M3. Milestones may be worked in any order, but the UI recommends sequence order.
- M4. Workspace progress = Σ(share% of approved milestones) + ½ × Σ(share% of submitted milestones). It is never set by hand. Site updates record the contractor's own progress estimate, which is shown separately and labelled "Contractor-reported".
- M5. Agreed price and dates change **only** through an accepted change request. The original accepted quote snapshot is never edited.

### Messaging and notifications
- N1. Only the project's owner and that conversation's contractor can post in a conversation.
- N2. Opening a conversation sets `lastReadAt[viewer] = now`. Unread count = messages from the other party with `sentAt > lastReadAt[viewer]`.
- N3. Notifications are created only by domain events (catalogue in architecture §7). Badge counts are derived from unread notifications, never hard-coded.
- N4. Notification preferences can mute categories. Muted notifications are still recorded but do not raise the badge (Decision).

### Reviews
- R1. Only the owner of a `completed` project can review its contractor, and only once per project.
- R2. Profile rating aggregates (average, count, per-star breakdown, dimension averages) are always computed from review records.

### Reputation signals (definitions shown in the UI)
- **Portfolio completeness:** share of these profile parts that are filled in: bio, at least 1 service, at least 1 service area, at least 3 portfolio items, at least 1 portfolio item with images.
- **Response-time sample:** a seeded illustrative value for seeded profiles, labelled "Sample"; for the persona it is computed from local quote and message timestamps, labelled "Based on activity in this demo".
- **Verification:** `Sample verification · demo data` (seeded) or `Not submitted` (user-edited). The app never shows plain "Verified".

---

## 8. Formatting
- Locale `en-IN`, currency INR (₹, Indian digit grouping such as ₹12,34,567), dates such as "24 Oct 2026". All of this lives in one formatting module so another market can be configured later.

## 9. Open decisions needing the product owner
1. **Imagery:** real-looking construction photos must be bundled locally (no hotlinking, so there is no network dependency). Their source and licence need approval. Until then, use designed, original illustration/blueprint-style placeholders. See `architecture.md` §10.
2. **Simulated payment ledger:** excluded by default. It can be added in Phase 5 if wanted, under the prompt pack's labelling rules.
3. **Persona names and city focus:** defaults above (Pune-centred, plus Mumbai, Nashik, Bengaluru, Hyderabad). Can be changed in seed data.
