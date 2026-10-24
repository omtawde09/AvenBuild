# Evan Build — Property Owner ↔ Contractor Marketplace
## Buildbrixz market review + phased Claude Code prompts

**Prepared:** 24 October 2026  
**Scope:** A polished, responsive web app prototype that can later inform a full mobile app.  
**Hard constraint:** No database or backend in this phase. Use a realistic local-only demo environment with seeded data and browser persistence.

---

# 1. Product and market analysis

## 1.1 Buildbrixz: what the public product evidence says

Buildbrixz positions itself as an Indian construction marketplace that connects property owners with contractors. Its Google Play listing shows **100K+ downloads** and, in the listing snapshot reviewed for this document, an update dated **16 September 2026**. The public listing describes contractor discovery, project posting, daily contractor leads, contractor portfolios, and broad construction-service coverage. The public app-store description covers:

- RCC work, brickwork, waterproofing, plumbing, electrical work, excavation, tile work, fabrication sheds, PEB work, paver blocks, RCC wells and trimix flooring.
- Owners posting project requirements and searching for local contractors.
- Contractors discovering work leads, connecting directly with owners, expanding service locations and showcasing completed work.
- A platform model where the parties make their own project decisions and agreements.

The public Google Play screenshots add useful interface evidence. They depict:

1. **Manage projects:** active/history views and individual project rows.
2. **Find contractors:** a service/category search and contractor cards with ratings, location/service details and contact-oriented actions.
3. **Monitor site progress:** project/status summaries and quotation-request items.
4. **Post a construction project:** a form for project type, budget and property/location details.
5. **Get new site opportunities:** a contractor-facing list of local opportunities with project/site context and status labels.

**What is and is not verified:** this is an analysis of public store copy and screenshots—not a logged-in teardown of all screens, the server, matching algorithm, or payment/message infrastructure. Do not assume that a feature not shown in public material definitely does not exist. Instead, treat the public evidence as strongest for discovery, project posting, lead generation, contractor profiles and basic project/status tracking. Public descriptions are not proof that every advertised outcome is guaranteed.

Sources:
- Google Play listing: https://play.google.com/store/apps/details?id=com.buildbrixz.app
- Apple App Store listing: https://apps.apple.com/in/app/buildbrixz/id6762256257
- Buildbrixz public website: https://buildbrixz.com/

## 1.2 Relevant market patterns to learn from

### BuildWize (India): lead transparency
Its public site describes a marketplace for construction/renovation requirements, verified professionals, quote requests and a no-commission positioning. It also promotes lead-quality signals, service-area preferences and refunds for invalid leads. The product lesson is that professionals need to understand *why* a lead is relevant, what it costs them, and what happens when a lead is poor—not merely see an endless list of enquiries.

Source: https://www.buildwize.in/

### Houzz / Houzz Pro: reputation plus a professional workflow
Houzz combines a professional directory with photos, portfolios and customer reviews. Houzz Pro's public feature pages describe lead management, messaging, appointments, estimates/proposals, schedules, files and mobile project workflows. The lesson is that discovery is only the start: contractor conversion improves when leads can move through a clear pipeline, and owners gain confidence when reputation evidence and project communication sit together.

Sources:
- https://www.houzz.in/
- https://pro.houzz.com/for-pros/houzz-pro-features

### Build Buddy (Australia): project coordination after matching
Build Buddy publicly describes pre-verified trades, reviews, quote comparison, scheduling, in-platform messages/calls, shared documents, team coordination and payment workflows. Its FAQ also describes construction planning and reporting. The lesson is that selecting a contractor is a consequential decision; the platform becomes more valuable when it maintains one shared place for scope, dates, messages, documents and progress after a quote is accepted.

Sources:
- https://www.buildbuddy.au/connect
- https://www.buildbuddy.au/faqs

## 1.3 Product opportunity

Build a product that is as easy to understand as a lead marketplace, but that supports the owner and contractor from first discovery through quote comparison and project completion. Differentiate through **clarity, trust evidence, and a visible project lifecycle** rather than by adding more decorative cards or making unsupported trust claims.

The core loop should be:

1. Owner posts a clear, structured project brief.
2. Matching contractors discover the lead using service, location, project size and timing filters.
3. Contractors ask questions or submit structured, itemized quotes.
4. Owner compares proposals on total cost, inclusions/exclusions, timeline, availability and profile evidence.
5. Owner accepts one proposal; a shared project workspace is created.
6. Both parties exchange messages, documents and schedule updates.
7. Contractor records milestones/site updates; owner acknowledges them.
8. The project is completed, closed and reviewed.

Every important state must be visible, reversible where appropriate, and understandable without technical knowledge.

## 1.4 Scope for this prototype

### Include
- Exactly two product roles: **Property Owner** and **Contractor**.
- Demo sign-in/persona selection; no real authentication.
- Public landing page and a usable signed-in application shell.
- Owner and contractor dashboards.
- Project creation, editing, drafts, publishing, pausing and closure.
- Contractor discovery, search, filters, profile pages, shortlisting and comparisons.
- Contractor lead feed, lead details, save/ignore actions and pipeline states.
- Quotes/proposals with itemized line items, totals, assumptions, inclusions, exclusions, validity, schedule and revision/withdraw actions.
- Quote comparison, acceptance and rejection/closure states.
- A shared project workspace after an accepted quote.
- Milestones, site updates, progress percentages, activity timeline and file metadata/preview where feasible.
- In-app messaging and notifications simulated locally.
- Reviews/ratings after a project is completed in the demo.
- Profile, service categories, experience, location/service areas, pricing preferences, availability and portfolio editing.
- Search/filter/sort, empty states, validation, confirmations, loading feedback, toasts and responsive navigation.
- Seed data, role switching, a clear **Demo mode** indicator and a **Reset demo data** action.
- Browser persistence through a versioned local-storage adapter.
- Tests and a documented end-to-end demo path.

### Do not include yet
- A database, backend, API server, Firebase, Supabase or third-party data service.
- Real online authentication, OTP, password recovery, or permissions that imply production security.
- Real payment processing, escrow, card entry or money movement. A clearly labelled simulated payment/milestone ledger is acceptable if it helps demonstrate a future flow.
- Real identity/license/GST verification. Sample status indicators must be labelled as demo data and must not imply that real checks occurred.
- Real email/SMS/push delivery, video/voice calls, live maps or online cross-device synchronization.
- An admin role. The app has owner and contractor personas only.

### Important meaning of “fully functional” here
The prototype should have working UI flows, state transitions, validation, filters, sorting, local persistence and linked owner/contractor experiences in the **same browser profile**. It must not pretend that localStorage is a backend. State clearly that changes are local to this demo browser and do not synchronize between different devices or real users. No button may be decorative or silently do nothing.

## 1.5 Product risks and principles

- **Trust cannot be faked:** mark seeded profiles and sample verification signals as demo examples. Build the UX so real verification can be connected later.
- **Scope ambiguity causes disputes:** every quote should show what is included, excluded, assumed, and when the price expires.
- **Lead quality matters:** filter leads by relevant trade, city/service area, budget, timing and project status. Avoid random matching.
- **Construction work is not a simple one-click booking:** show enquiry → quote → revision → selection → project → milestones → completion.
- **Avoid false payment promises:** mark any simulated record as “Demo only — no payment processed.”
- **Mobile is a primary constraint:** design narrow-screen layouts first, not as a final responsive pass. Plan for future thumb-friendly React Native/Expo clients by keeping domain rules independent from web components.
- **Do not use an AI-generated SaaS template aesthetic:** avoid excessive rounded cards, glassmorphism, purple/blue gradient hero panels, identical card grids and oversized decorative stats. Use strong typography, deliberate spacing, real construction imagery, restrained color, clear hierarchy, useful tables/lists and purposeful details.

---

# 2. Master instructions for Claude Code

Paste this section before starting the phase prompts below.

```text
You are the senior product engineer, UX designer and QA engineer for Evan Build, a professional property-owner/contractor marketplace. Build a real, coherent, responsive web application—not a static mockup or a collection of disconnected screens.

First inspect the current repository and follow its existing conventions when sensible. If it is empty, scaffold a clean project. Never overwrite working code blindly. Work only within the current repository. Do not stop at recommendations: implement the phase requested, run the relevant checks, fix problems introduced by the phase, and report exactly what changed and what remains.

PRODUCT ROLES
- Property Owner
- Contractor
There are exactly these two roles. Do not add an admin role.

NO-BACKEND CONSTRAINT
- No database, server API, backend service, Firebase, Supabase or hosted data store in this phase.
- Use deterministic seeded demo data and a versioned localStorage persistence adapter.
- All functional workflows must operate locally in one browser profile. Make owner-created projects visible in the contractor lead feed; contractor-submitted proposals visible to the owner; accepted proposals create a shared project; both personas can exchange messages and see milestone updates.
- Add a visible “Demo mode” notice and a “Reset demo data” action.
- Clearly communicate that demo changes are local to this browser and do not sync across devices/users.
- Do not call simulated payment processing, identity checks, notifications or messaging a real external service. Never request real card details.
- Do not write pretend API clients that return fake network success. Put storage behind a small adapter/interface so a backend can replace it later without rewriting the domain rules.

TECHNICAL APPROACH
- If starting from an empty repository, use a stable, compatible React + TypeScript web stack: Vite, React Router, Tailwind CSS, Zustand (with versioned persistence), React Hook Form + Zod, Lucide icons, and Vitest/React Testing Library. Use current compatible stable versions rather than pinning arbitrary old versions. If the repository already has a suitable stack, keep it unless there is a clear reason not to.
- Keep domain logic and types separate from UI and storage. Suggested areas: src/app, src/components, src/features/owner, src/features/contractor, src/features/projects, src/features/quotes, src/features/messages, src/features/profile, src/domain, src/data, src/lib/storage, src/lib/validation, src/tests.
- Keep business rules framework-independent where possible so they can later be shared with a React Native/Expo client. Do not build the mobile app now.
- Use strict TypeScript. Avoid `any`, giant component files, duplicated role-specific logic and hard-coded cross-component state.
- Do not add a dependency when the existing stack can handle the job simply.

DESIGN DIRECTION
Create a credible construction-tech brand, not a generic AI dashboard. Use an editorial layout, strong typography, real-looking construction/project imagery, calm neutral surfaces, dark ink/charcoal text, one restrained warm construction accent and a clear success/status palette. Use cards only when they improve grouping. Mix project rows, timelines, side panels, tables/lists, compact statistics and image-led project details. Keep shadows subtle; avoid glassmorphism, neon gradients, decorative blobs, oversized pill buttons, excessive rounded rectangles, emoji icons, and repetitive 3-column cards. Use Lucide icons consistently and accessible labels.

Design mobile-first. At minimum verify widths around 320, 375, 430, 768, 1024 and 1440 pixels. No horizontal page overflow. Use bottom navigation or a compact drawer on small screens; use a clear sidebar/top-bar layout on desktop. Important actions must be easy to reach with a thumb. Do not rely on hover to reveal essential actions. Keep touch targets approximately 44×44 CSS pixels where practical.

FUNCTIONAL QUALITY BAR
- Every visible button, tab, menu item, link, filter, form, status action and modal must work or be explicitly disabled with a useful reason.
- Implement complete loading/empty/error/success/confirmation states even when the operation is local.
- Forms require useful validation and visible field-level errors. Prevent invalid lifecycle transitions.
- Destructive actions need confirmation and a sensible undo/recovery option when feasible.
- Search/filter/sort must change the real displayed data.
- Use semantic HTML, keyboard navigation, focus states, accessible names, sufficient contrast and reduced-motion support.
- Avoid fake metrics that change randomly. Seed data should be deterministic and coherent.
- Every screen must work on mobile, tablet and desktop.

WORKING METHOD
- Complete only the phase prompt I provide next; do not attempt all later phases early.
- Before changing files, inspect relevant files and dependencies.
- After implementation, run type-check/lint/tests/build available in the repository. Fix all failures you caused.
- If a command fails because a script is missing, add an appropriate script or document why it cannot run; do not claim it passed.
- Add or update tests when introducing domain rules or important user flows.
- Do not claim success for anything that was not run or manually verified.
- At the end of each phase, report: files/features changed, checks actually run and results, known limitations, the most direct manual test path, and the exact next phase to run.
```

---

# 3. Phase-by-phase prompts

Run one phase at a time in Claude Code. Do not paste every phase in one giant request. Keep the Master Instructions in context, then paste the next phase.

## Phase 0 — Repository audit, product specification and architecture

```text
PHASE 0: DISCOVERY AND IMPLEMENTATION PLAN ONLY.

Inspect the repository, current framework, package scripts, installed dependencies, routes, components and any existing design assets. Do not make broad code changes yet. If the repository is empty, recommend the exact minimal scaffold for the Master Instructions' stack.

Create or update these planning files:
- docs/product-spec.md
- docs/architecture.md
- docs/ux-and-route-map.md
- docs/acceptance-checklist.md

The product spec must define the two roles, the core owner → contractor lifecycle, every in-scope feature, all no-backend limitations, demo-mode messaging, domain entities and key business rules. The route map must list public routes, owner routes, contractor routes, shared project/message routes and mobile navigation behavior. The architecture must explain the localStorage adapter, versioned persisted state, seed data, pure domain rules, validation, feature boundaries and how a future real API/Expo app could replace/reuse layers.

Also define the state machines for:
1. Project: draft → published/open → quote review → awarded/in progress → completed, with valid pause/cancel/close paths.
2. Quote: draft → submitted → viewed/revision requested → accepted or declined/withdrawn/expired.
3. Milestone: pending → in progress → submitted for review → approved, with a change-request path.
4. Conversation and notification read/unread states.

Do not claim real verification, payments or external messaging. Explain what must remain simulated. Finish with a short dependency/file plan and a phased build order. Do not implement the product UI in this phase.
```

**Phase 0 exit criteria:** the route map and acceptance checklist are concrete enough to build against; no scope ambiguity about the local-only demo.

## Phase 1 — Scaffold, brand system, responsive shell and public landing page

```text
PHASE 1: FOUNDATION AND VISUAL SYSTEM.

Use the plan from docs and scaffold the application only as needed. Configure routing, strict TypeScript, styling, icon system, test scripts and error boundaries. Add a single editable brand configuration file so the working product name, logo treatment and design tokens can be changed later without hunting through the code. Use “Evan Build” as the working product name and do not imply trademark clearance.

Create a reusable visual system:
- Typography scale, page widths, spacing, borders, radius, shadows and restrained color tokens.
- Buttons, text inputs, selects, segmented controls, chips, badges, tabs, dialogs, dropdowns, toasts, skeletons, empty states, avatars, progress indicators and responsive data lists.
- Consistent status colors and labels for projects, quotes, leads and milestones.
- Form labels, descriptions, error messages and focus states.

Build the public landing page with an editorial, credible construction-tech aesthetic: concise value proposition, owner and contractor entry points, clear “How it works” steps for both roles, service-category discovery, project/process imagery, trust principles without false claims, and a clear call to action. Make it feel intentionally art-directed—not an AI dashboard template. Do not overuse cards or gradients. Avoid lorem ipsum and generic fake testimonials.

Create a responsive app shell with role-aware navigation placeholders, profile menu, notification affordance, breadcrumb/page heading pattern and mobile navigation. Add a clearly visible demo-mode banner. Create a functional demo persona selector for Property Owner or Contractor; it should be possible to switch personas for testing without signing up. Make it clear this is a local demo, not secure authentication.

Do not implement complete domain workflows yet; use small, clearly marked route placeholders only where a later phase will fill them in. No dead links: each navigation item must point to a real route or be disabled with a clear explanation.

Run the available type-check, lint, tests and production build. Inspect layout at 320px, 375px, 768px and desktop width. Fix overflow, unreadable text and broken navigation before finishing.
```

**Phase 1 exit criteria:** landing page, role selection, design system and responsive shell are coherent and navigable.

## Phase 2 — Domain model, seed data and local persistence

```text
PHASE 2: BUILD THE DEMO DOMAIN AND LOCAL DATA LAYER.

Implement typed domain models and a local repository/storage adapter. Keep domain logic separate from React UI. Use a versioned localStorage schema with safe parse/validation, default seed fallback, migration/version handling, reset support and a storage-event listener so multiple tabs of the same browser profile can refresh coherently. Do not add a database or API.

Model at least:
- User/persona, contractor profile, service category, service area, portfolio project and review.
- Owner project brief, address/location summary, scope item, budget range, target start date, duration, media metadata, access/site-visit information and project status.
- Contractor lead state and saved/ignored lead.
- Quote/proposal, revision history, itemized line item (quantity, unit, rate, tax/discount where applicable), totals, inclusions, exclusions, assumptions, validity and schedule.
- Shared project, milestones, milestone updates, progress/site log, documents/attachments metadata, conversation, message, notification, shortlist and review.

Use stable IDs and deterministic dates/data. Seed enough believable, fictional profiles/projects/messages/quotes to make every view non-empty and demonstrate multiple statuses, locations, budgets and categories. Avoid using identifiable real people's details. Include two easy demo personas/accounts—one owner and one contractor—plus several seeded contractors and leads for realistic searching and comparisons. All sample profiles and verification states must be clearly recognized as demo content somewhere in the app.

Implement typed selectors and pure functions for:
- Matching contractor services/service areas to project briefs.
- Filtering and sorting lead lists and contractor discovery.
- Computing quote totals safely.
- Validating allowed project, quote and milestone transitions.
- Creating a shared project after quote acceptance.
- Creating notifications when the other persona has a meaningful event.

Persistence rules:
- Persist structured demo data locally, but don't store giant binary files in localStorage. Store attachment metadata; use session object URLs for user-selected local previews where feasible and explain refresh limitations in the demo.
- Add Reset demo data with confirmation; it restores the original deterministic seed set.
- If storage is full or malformed, recover to a safe seed state and show a non-blocking explanation rather than crashing.
- Do not persist secrets or real identity documents.

Add unit tests for the domain transitions, quote math, matching/filter logic and storage recovery. Run type-check, tests and build, fixing failures. Do not build all feature screens yet except a temporary developer view if needed to validate data operations.
```

**Phase 2 exit criteria:** the data layer is typed/tested; local changes survive refresh where supported; reset returns the app to a known state.

## Phase 3 — Property Owner experience

```text
PHASE 3: COMPLETE THE PROPERTY OWNER JOURNEY.

Build a polished owner experience wired to real local state—not static mock screens.

Required routes/views:
- Owner dashboard with project summary, latest messages, quote activity, next actions and recent site updates.
- Create project as a validated multi-step form with progress indicator, draft save, back/next, review step and publish confirmation. Capture service category, project title, scope/details, property type, city/locality, budget range, timeline/start preference, duration if known, site-visit availability, material responsibility, photos/attachments metadata and contact/access notes.
- My projects with search/status filters and list/card views; project details; edit draft; pause/reopen/cancel/close within valid states.
- Discover contractors with search, service/category and location filters, rating/experience/portfolio signals, availability and sort controls. Include useful no-results and clear-filter states.
- Contractor profile detail with services, areas served, years of experience, portfolio, review breakdown, response-time sample, verification status explicitly labelled as demo data, and an actionable request-quote/contact action.
- Shortlist/bookmarks and side-by-side quote comparison. Comparison must clearly show total price, line items, what's included/excluded, timeline, quote validity and contractor evidence—not just a star rating.
- Received quotes view with view details, request revision, accept proposal, decline proposal and confirmation dialogs. Acceptance must run the domain transaction and create the shared active project. Avoid accepting multiple competing quotes for the same project unless the product rules explicitly support multiple contractors.
- Notifications and messages should link to the relevant project, quote or conversation.

Functional rules:
- Publishing an owner project makes it eligible to appear in the contractor lead feed using the current matching logic.
- Draft projects are not visible as open leads.
- Every filter/search/sort must change the displayed list.
- An owner can revisit/edit a draft after refresh.
- Owner project state and quote state must stay consistent across dashboard, project detail, contractor lead feed and notifications.
- Use strong validation, accessible forms, progress preservation, useful errors and unsaved-change warnings where practical.
- Keep the interface mobile-first with one-column forms, sticky bottom primary actions where useful, responsive lists and no horizontal overflow.

Seed enough coherent demo scenarios to test project creation, quotes arriving, revision requested, quote accepted and active project. Add tests for the most important owner-side actions and state consistency. Run checks and fix defects before finishing.
```

**Phase 3 exit criteria:** an owner can post a project, find/shortlist contractors, compare quotes and accept one; the contractor side sees the resulting state.

## Phase 4 — Contractor experience

```text
PHASE 4: COMPLETE THE CONTRACTOR JOURNEY.

Build a contractor experience connected to the same persisted local state used by the owner.

Required routes/views:
- Contractor dashboard with relevant lead count, saved leads, quotes awaiting response, active jobs, upcoming milestones and a small set of honest demo metrics derived from seeded/local data.
- Lead feed with service category, location/service area, project size/budget, target timing and project status. Add search, filters, sorting, saved/ignored states and matching reasons (for example: service matches, service area matches, budget fit). Do not use random lead scores. Make it obvious when no leads match filters.
- Lead details with scope, property/locality, project type, budget range, target schedule, attachment metadata, owner-provided notes and current lead status. Do not expose private personal contact details before the prototype's intended contact/quote stage.
- Quote/proposal composer with editable line items, quantity/unit/rate, tax and discount inputs if used, automatic subtotal/total, estimated duration/start window, inclusions, exclusions, assumptions, quote validity date and optional note. Validate all numeric values; no negative quantities or silent rounding errors. Allow draft, submit, revise after owner request and withdraw before acceptance.
- Lead pipeline/quote inbox with statuses such as New, Saved, Quote Draft, Submitted, Revision Requested, Accepted, Declined, Withdrawn and Closed. Use consistent transitions and visible event dates.
- Editable contractor profile: business name, bio, services, experience, service areas, availability, typical project range, team size, contact preferences and qualifications/licence/GST fields as optional sample data. A field being present does not mean it has been verified.
- Portfolio manager to add/edit/remove fictional demo portfolio entries, descriptions, categories, approximate project size, completion date and local image previews.
- Active project view after quote acceptance, with agreed scope/quote reference, milestones, schedule, project messages, site updates and documents.

Functional rules:
- Published owner projects appear in the feed only when their lifecycle permits contractor responses; filters use actual project data.
- Submitting a quote creates a quote record and owner notification; the owner can view it without refreshing or losing consistency.
- A quote acceptance on the owner side updates the contractor pipeline and active project.
- A contractor cannot submit a quote to a draft, cancelled, closed or otherwise ineligible project.
- Profile edits persist locally and affect discovery/search results.
- Every action has visible success/error feedback and no dead controls.

Add tests for quote totals, invalid proposal rejection, project eligibility and profile-driven discovery changes. Run checks and fix issues.
```

**Phase 4 exit criteria:** a contractor can find a relevant project, submit a quote, update their profile and see it reflected on the owner side.

## Phase 5 — Shared project workspace, messages, notifications, milestones and documents

```text
PHASE 5: COMPLETE THE SHARED COLLABORATION WORKFLOW.

Implement the collaboration layer so an accepted proposal becomes a shared project workspace visible to both personas. Keep all operations local and clearly labelled as demo functionality.

Shared project workspace:
- Summary: owner, contractor, agreed proposal, agreed budget, schedule, current status and project progress.
- Activity timeline with events such as project published, quote submitted/revised/accepted, milestone started/submitted/approved, message sent and project completed.
- Milestone plan with title, description, target date, amount/percentage only if a clear demo rule is used, status and evidence/notes. Support contractor start/update/submit and owner approve/request changes.
- Daily/site progress updates with date, notes, progress percentage, optional demo attachment preview and clear author attribution. Progress should be computed/updated consistently and not jump randomly.
- Shared document area with file name/type/size/added date metadata and preview for supported locally selected images. Avoid pretending files are stored remotely. If local file preview is session-only, state that plainly.
- Change request workflow for scope/date/price changes: proposer, reason, requested change, status and accept/reject action. Never silently alter the agreed quote; accepted change requests should create an auditable revision/event.

Messaging:
- One conversation per owner-contractor-project context (and a pre-project enquiry conversation where appropriate).
- Message list with timestamps, sender identity, unread state, text input validation, send action, empty state and scroll-to-latest. Store messages locally; create a notification for the other persona.
- Make switching persona an explicit demo/testing affordance so the user can inspect both sides of the same conversation. Unread state should change coherently when a conversation is opened.
- Do not imply real-time network messaging. The interface should feel immediate because local state updates synchronously; label it as a local demo.

Notifications:
- In-app notification center with read/unread state, mark all read, relevant deep links and category/time labels. Generate notifications from domain events rather than hard-coded visual counters.
- Notifications for new project/quote, revision request, quote accepted/declined, new message, milestone submitted/approved/change requested, date change and completion/review prompt.

Simulated payments (only if included): use a simple clearly labelled milestone/payment record with statuses such as Not recorded, Demo recorded and Cancelled. It must prominently say “Demo only — no payment processed”; do not collect card/bank information or suggest funds are protected.

Add tests for message persistence/read state, notification creation/deep links, milestone transitions, change requests and accepted quote → shared project creation. Verify owner and contractor see the same locally stored project and event history after persona switching and page refresh.
```

**Phase 5 exit criteria:** the accepted quote workflow functions end-to-end and both roles can collaborate through messages, updates, milestones and notifications.

## Phase 6 — Trust, reputation, profile settings and product completeness

```text
PHASE 6: FINISH THE TWO ROLE EXPERIENCES AND EDGE CASES.

Complete the experience around trust, account/profile preferences and project closure.

- Reviews/ratings: allow an owner to review a contractor only after the corresponding project is completed; include score, text, date and optional category dimensions (communication, quality, schedule clarity). Prevent duplicate reviews for the same completed project. Update visible profile aggregates from actual local review records. All seeded reviews must be fictional demo content.
- Contractor reputation: portfolio completeness, service area, response-time sample and review summaries should have clear definitions. Never invent a real verification result. Use “Sample verification” / “Demo profile” on seeded data and a “Not submitted”/“Pending” state for user-edited sample fields.
- Owner profile/settings: name, contact preferences, city/locality, notification preferences and demo data controls.
- Contractor settings: service categories, service areas, availability, profile visibility, quote defaults and notification preferences.
- Add accessible help/FAQ/about-demo page that explains no backend, no real account verification, no payments, no email/SMS and no cross-device sync.
- Add useful confirmations for publish/accept/decline/cancel/close/delete actions. Preserve data on modal cancellation. Add undo where easy and safe.
- Empty states should explain what action creates content; error states should explain how to recover; all toast/dialog interactions should be keyboard accessible.
- Make dates, INR/currency and number formatting consistent and configurable. Use Indian locale formatting as the default demo configuration, but keep formatting centralized for a future deployment to another market.
- Ensure no seeded names, phone numbers, addresses or verification claims accidentally appear to represent actual customers or contractors.

Review the whole product for dead links, inconsistent status labels, unhandled empty states, invalid state transitions, forms that lose values, stale dashboard counts and broken mobile layouts. Fix discovered defects. Add tests for review eligibility/duplicates and key settings persistence. Run checks and report real results.
```

**Phase 6 exit criteria:** lifecycle, reviews, profiles, settings, help and demo limitations are explicit and coherent.

## Phase 7 — QA hardening, accessibility, responsive audit and end-to-end acceptance

```text
PHASE 7: TEST AND HARDEN THE FULL APPLICATION.

Treat the product as a real acceptance test, not a visual review. Inspect the complete route map and docs/acceptance-checklist.md. Add or finish automated tests using the test setup already chosen. Use Playwright if supported by the repository; otherwise create the closest reliable integration tests and clearly document what requires manual verification.

Run these end-to-end scenarios from a reset seed state:
1. Open landing page on mobile, choose Owner demo persona, create a draft, refresh, resume it, publish it and confirm it appears in the Contractor lead feed.
2. Switch to Contractor, search/filter the lead feed, open the new project, save it, compose a quote with multiple line items, verify arithmetic and submit.
3. Switch to Owner, open the notification, compare the received quote, request a revision, then switch back to Contractor and submit the revision.
4. Switch to Owner, accept one quote and confirm the shared project was created, the project state changed, the contractor pipeline updated and both roles see the same agreed amount and schedule.
5. Exchange messages from both roles, verify notification/unread state, add a milestone/site update and approve or request changes. Refresh between actions and verify persisted local state.
6. Complete the project, submit a review, verify the profile aggregate updates and verify duplicate review is prevented.
7. Reset demo data and confirm all user-created content returns to the original seed scenario.
8. Exercise no-result searches, invalid form submissions, empty messages, invalid quote numbers, cancelled dialogs and malformed/full local storage recovery.

Responsive audit widths: 320, 375, 390, 430, 768, 1024, 1280 and 1440 CSS px. Check for horizontal overflow, clipped popovers/dialogs, inaccessible navigation, tiny touch targets, fixed controls obscuring form actions and unreadable data tables. Convert wide tables to stacked rows/cards on mobile without hiding critical facts.

Accessibility audit:
- Keyboard-only navigation and visible focus.
- Appropriate headings/landmarks, labels and dialog focus management.
- Status is conveyed by text as well as color.
- Contrast, reduced motion and meaningful image alt text.
- No clickable divs where semantic buttons/links belong.

Performance/quality:
- Remove unused components/dependencies and console errors.
- Add error boundaries and safe storage recovery.
- Ensure stable IDs and deterministic seed data; don't use Math.random for displayed metrics.
- Confirm a fresh install/build works from the documented commands.
- Run lint, type-check, tests and production build; report exact output and any remaining warning honestly.

Fix defects found. Update docs/acceptance-checklist.md with pass/fail per scenario, including any manual steps not automated. Do not mark a scenario as passed unless it was actually executed.
```

**Phase 7 exit criteria:** documented end-to-end flows pass, important regressions are covered by tests, and layout works on narrow mobile screens.

## Phase 8 — Future mobile-app readiness and handoff

```text
PHASE 8: MOBILE READINESS AND HANDOFF DOCUMENTATION. Do not build a mobile app in this phase.

Review the completed web app architecture and create:
- docs/mobile-roadmap.md
- docs/demo-limitations-and-backend-replacement.md
- docs/manual-test-guide.md
- docs/data-model-and-api-contract.md

Explain a sensible future mobile path using React Native with Expo, including what can be shared (domain types, Zod schemas, transition rules, quote math, selectors and design tokens where practical) and what should be rebuilt with native components. Do not claim the web UI itself can be reused unchanged in React Native.

Document the future backend replacement seams for:
- Authentication/session management and role authorization.
- Database schema and migrations.
- Object storage for photos/documents.
- Server-side project/quote/milestone transactions and authorization checks.
- Real-time messaging and notifications.
- Identity/license verification workflow.
- Payment provider and webhook/idempotency design, if the product chooses to support payments.
- Rate limits, audit trail, abuse reporting and privacy/security controls.

Write down the current demo state model, localStorage versioning, exact limitations and what must never be shipped to production as-is. Include setup, run, test, build and reset-demo commands. Make the handoff actionable for another engineer.

Run the final project checks once more. End with an accurate summary of what is complete, what works only in local demo mode, and the next 5 engineering tasks required before a private beta. Do not add a database or build the mobile client.
```

**Phase 8 exit criteria:** another engineer can run the web prototype, reproduce the demo, and understand a realistic path to backend and mobile development.

---

# 4. Definition of done for this prototype

Do not call the app complete until all are true:

- [ ] Two personas exist: Property Owner and Contractor; no admin role.
- [ ] The landing page and app shell are polished and responsive.
- [ ] Demo persona switching is obvious and does not masquerade as secure auth.
- [ ] No database, backend, external auth or external data dependency exists.
- [ ] Seeded demo content appears on first run; reset restores it reliably.
- [ ] LocalStorage persists normal structured changes across refresh, with safe recovery.
- [ ] Owner can create/publish/edit/manage projects.
- [ ] Contractor can discover appropriate leads, save leads and submit/revise/withdraw quotes.
- [ ] Owner can compare, revise-request, accept and decline quotes.
- [ ] Accepting a quote creates exactly one consistent shared project in the normal single-contractor flow.
- [ ] Messages, unread state and notifications behave coherently across persona switching.
- [ ] Milestones, site updates, project status changes, reviews and profile aggregates work.
- [ ] Quote arithmetic and state transitions have automated tests.
- [ ] Simulated uploads/payments/verification are truthfully labelled and never imply external processing.
- [ ] All controls are functional, or clearly disabled with a reason.
- [ ] No horizontal overflow at 320px; mobile screens are not desktop screens squeezed down.
- [ ] Keyboard/focus/accessibility basics are verified.
- [ ] Lint, type-check, tests and production build are run and their actual results documented.
- [ ] Setup, test, reset and demo instructions are documented.

# 5. Recommended demo script

Use this sequence when showing the prototype to someone else:

1. Reset demo data and open the landing page on a phone-sized viewport.
2. Enter as Property Owner, create and publish a project (for example, bathroom waterproofing or a small RCC job).
3. Switch to Contractor, find the new lead, inspect the scope and submit an itemized quote.
4. Switch back to Owner, compare the quote and ask for one revision.
5. Return to Contractor, revise and resubmit the quote.
6. Return to Owner and accept the quote. Open the new shared workspace.
7. Switch back to Contractor, send a message and submit a milestone/site update.
8. Switch to Owner, read the message, review the update and approve/request changes.
9. Complete the project and leave a review.
10. Refresh the browser and verify that local demo state persists. Then reset the demo to return to the original scenario.

# 6. Research links

- Buildbrixz on Google Play: https://play.google.com/store/apps/details?id=com.buildbrixz.app
- Buildbrixz on Apple App Store: https://apps.apple.com/in/app/buildbrixz/id6762256257
- Buildbrixz website: https://buildbrixz.com/
- BuildWize: https://www.buildwize.in/
- Houzz India: https://www.houzz.in/
- Houzz Pro features: https://pro.houzz.com/for-pros/houzz-pro-features
- Build Buddy Connect: https://www.buildbuddy.au/connect
- Build Buddy FAQ: https://www.buildbuddy.au/faqs

---

# 7. Negative prompting — mandatory constraints for Claude Code

Append and apply these negative instructions throughout every phase. They supplement the existing requirements above; **they do not replace, shorten, reinterpret, or remove any previous requirement or phase**. When a proposed implementation conflicts with one of these constraints, stop and choose the most conservative implementation that preserves the product requirements. If the conflict cannot be resolved safely, document it instead of silently guessing.

## 7.1 Do not invent facts, capabilities, or requirements

- Do not hallucinate Buildbrixz features, private application behavior, APIs, business rules, partner integrations, pricing policies, or verification processes. Treat the research in this document as public-source evidence only, and label uncertain matters as unknown.
- Do not invent requirements and present them as user-approved decisions. Use the documented scope and sensible, clearly documented defaults for non-critical details.
- Do not invent package names, APIs, component props, framework features, CLI commands, test results, routes, environment variables, or file paths. Inspect the repository and installed package versions, use the actual documentation or type definitions available locally, and verify the implementation.
- Do not pretend that a feature is complete merely because its screen exists. Verify its real interaction and state changes.
- Do not claim that lint, type-check, tests, production builds, accessibility checks, or manual test scenarios passed unless you ran them and observed the result. Report blocked, skipped, and failing checks honestly.

## 7.2 Do not violate the prototype boundary

- Do not add a database, backend, API server, Firebase, Supabase, hosted service, third-party data service, or hidden network dependency in any phase of this prototype.
- Do not implement production authentication, OTP, password reset, authorization enforcement, identity verification, contractor-license verification, GST checks, escrow, payments, money transfer, email, SMS, push notifications, live video/voice calls, or genuine real-time cross-device messaging.
- Do not ask for or collect real passwords, card details, identity documents, bank details, or sensitive personal data in the demo.
- Do not label local demo persona selection as secure authentication. Do not describe seeded contractor records, ratings, reviews, credentials or verification badges as real or verified. Mark simulated or seed-only indicators clearly.
- Do not imply that a local message was sent to another real person, that a document was uploaded to a server, or that a payment or verification actually occurred.
- Do not make direct browser-local persistence look like a secure multi-user data store. Retain clear demo-mode and local-only limitations.
- Do not introduce an admin role. The only product personas are Property Owner and Contractor.

## 7.3 Do not build fake or disconnected functionality

- Do not leave dead buttons, links with `href="#"`, controls that have no effect, empty event handlers, TODO-only critical paths, fake save confirmations, or navigation to unfinished screens.
- Do not use hardcoded success states when an action should validate input, change domain state, create a record, update a related view, or surface an error.
- Do not implement multiple disconnected copies of the same project, quote, message, notification, review, or milestone in separate components. Use a coherent shared state model and a single source of truth.
- Do not allow impossible transitions, such as accepting a withdrawn quote, submitting a quote to a closed project, leaving a review before completion, or creating duplicate accepted-project workspaces.
- Do not silently drop invalid input, silently swallow errors, display success after a failed operation, or let malformed local data crash the entire app.
- Do not create fake upload, payment, messaging, verification, or notification integrations. Where simulation is in scope, implement the local behavior and label its limitations.
- Do not stop at the happy path. Implement validation, loading/working feedback where appropriate, empty states, error states, confirmation for consequential actions, and graceful behavior when data is missing or outdated.

## 7.4 Do not damage the existing repository

- Do not overwrite, delete, rename, or wholesale replace existing files, components, configuration, documentation, assets, or project setup without first inspecting their purpose and confirming that a change is necessary for the requested phase.
- Do not replace the existing framework, package manager, routing solution, styling approach, or build system just because another option is familiar. If the repository is already established, work with it unless a demonstrated technical blocker justifies a change; document that blocker first.
- Do not remove existing behavior, tests, scripts, dependencies, or features to make a check pass.
- Do not run destructive shell commands, clear unrelated directories, reset Git history, discard user changes, or rewrite lockfiles unnecessarily.
- Do not assume the repository is empty. Inspect `git status`, project files, package scripts, and existing conventions before making changes. Preserve any user modifications.
- Do not dump the entire project into one giant component or put all business logic, seed data, validation, and persistence into a single file. Keep modules small, cohesive, and consistent with the repository's conventions.

## 7.5 Do not create an AI-generated template aesthetic

- Do not use generic AI-dashboard patterns as a substitute for product design: repetitive rounded-card grids, oversized decorative KPI cards, excessive pills, glassmorphism, neon or purple/blue gradients, floating blobs, random illustrations, gratuitous shadows, and identical layouts on every page.
- Do not use emoji as a substitute for a consistent icon system. Use the selected icon library consistently and only when an icon improves comprehension.
- Do not fill the interface with placeholder copy, lorem ipsum, meaningless statistics, arbitrary ratings, fake testimonials presented as real, or stock content unrelated to construction.
- Do not make every section a card. Use the layout that best communicates the content: lists, tables, split views, timelines, compact summaries, forms, photo galleries, and whitespace where appropriate.
- Do not add animations just for decoration, autoplaying media, cursor-dependent interactions, hover-only actions, or effects that reduce readability or performance.
- Do not sacrifice clarity for visual novelty. Every screen must have an obvious hierarchy, useful empty states, legible statuses, purposeful calls to action, consistent spacing and typography, and sufficient contrast.
- Do not copy Buildbrixz branding, screenshots, proprietary text, or another competitor's distinctive visual identity. Use market patterns as research input and create an original brand system.

## 7.6 Do not treat mobile responsiveness as an afterthought

- Do not design only for desktop and simply shrink the same layout for phones. Make the mobile information hierarchy and navigation deliberate from the beginning.
- Do not permit horizontal page overflow at a 320px viewport. Do not allow tables, dialogs, forms, project timelines, navigation bars, images, or action groups to become clipped or unusable on small screens.
- Do not rely on hover to reveal essential actions. Support keyboard, touch, visible focus, and appropriately sized touch targets.
- Do not use fixed widths or heights that truncate meaningful content on small displays. Avoid fixed bottom bars that cover form actions, messages, or page content; account for mobile browser safe areas where relevant.
- Do not introduce unoptimized, oversized images, layout shifts, excessive client-side bundles, or animations that impair lower-powered mobile devices.
- Do not claim that a responsive web prototype is already a native mobile app. Keep domain logic reusable where practical and document what must be implemented separately for React Native/Expo.

## 7.7 Do not weaken data integrity or security hygiene

- Do not scatter direct `localStorage` reads and writes through UI components. Use the planned storage adapter, schema validation, versioning, safe parsing, migration/reset behavior and graceful recovery.
- Do not trust localStorage content as valid. Validate stored records before use and handle missing, stale, malformed or incompatible data with a safe fallback that explains what happened where useful.
- Do not mutate shared state in place, bypass the central state/update flow, or let derived totals and profile aggregates drift from their source records.
- Do not use array indexes as durable entity IDs. Use stable IDs and deterministic seed data so relationships remain consistent after refresh and reset.
- Do not use unsafe HTML injection, `eval`, dynamically executed strings, or unescaped user-generated content. Do not expose secrets or add secret values to source control.
- Do not present client-side demo checks as security controls. Document all authorization, privacy, upload validation, rate limiting and server-side checks still required before production.
- Do not install new dependencies without a clear need. Prefer existing packages and native platform features when sufficient, and avoid abandoned or unnecessary packages.

## 7.8 Do not skip phase discipline, verification, or documentation

- Do not implement all phases at once when asked to complete one phase. Complete only the requested phase and preserve a clear boundary between finished and future work.
- Do not bypass a phase's acceptance criteria, leave known regressions unresolved, or move on while a critical end-to-end workflow is broken. If an issue cannot be fixed safely in the current phase, record it explicitly with evidence and impact.
- Do not hide failing tests, suppress TypeScript errors with broad `any` casts, disable lint rules globally, weaken assertions, or delete tests to make the build appear successful.
- Do not claim that an automated test proves a workflow that the test does not exercise. Add tests for meaningful domain transitions, calculations, validation and persistence recovery, then verify the integrated user journey.
- Do not state that a route, form, filter, sort, dialog, notification, message, or action is functional until it has been exercised.
- Do not leave undocumented commands or undocumented demo limitations. Update the appropriate product, architecture, testing or handoff documents when behavior or a technical decision changes.
- Do not stop after writing code. Inspect the resulting diff, run the available relevant checks, fix regressions caused by the phase, and summarize exact files changed, verified functionality, commands executed, failures and remaining limitations.

## 7.9 Required response whenever uncertain or blocked

When instructions, existing code, or test results are ambiguous:

1. Inspect the relevant files and surrounding implementation before deciding.
2. Prefer the smallest reversible change that satisfies the documented requirement.
3. Do not infer that an external service or undocumented feature exists.
4. If a decision materially affects scope, data integrity, user trust, security, or future mobile/backend compatibility, record the uncertainty and the chosen assumption in the relevant documentation.
5. If the requirement cannot be implemented within the no-backend constraint, implement only a clearly labelled local simulation when the specification permits it; otherwise explain the blocker and leave no misleading placeholder.
6. Report what is verified, what is simulated, what is incomplete, and what needs a backend or human decision.

**Final non-negotiable rule:** correctness, honest demo boundaries, a coherent end-to-end workflow, responsive usability and maintainable code take priority over speed, visual spectacle, fabricated completeness or unnecessary scope. Preserve every existing requirement in this prompt pack and append improvements rather than deleting or weakening requirements.
