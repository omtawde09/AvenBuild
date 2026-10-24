# AvenBuild — UX and Route Map

**Status:** Phase 0 planning document · **Date:** 2026-10-24
Router: React Router 7 data router (`createBrowserRouter`). Every route below exists from Phase 1. Routes whose screens arrive in a later phase render a clearly marked placeholder ("Coming in Phase N of this demo build") with a working link back. They are never dead links.

Legend: **Phase** = the phase that delivers the full screen. **Guard**: `public` (anyone), `owner` / `contractor` (an active persona of that role is required), `participant` (owner or contractor who is a party to the record).

---

## 1. Route table

### 1.1 Public

| Path | Screen | Guard | Phase |
|---|---|---|---|
| `/` | Landing page | public | 1 |
| `/start` | Choose demo persona (Owner / Contractor), with the local-demo explanation | public | 1 |
| `/help` | Help, FAQ and About this demo (limitations, reset) | public | 1 stub → 6 full |
| `*` | Not found, with links to `/` and the persona's dashboard | public | 1 |

### 1.2 Property Owner (`/owner`)

| Path | Screen | Phase |
|---|---|---|
| `/owner` | Owner dashboard | 3 |
| `/owner/projects` | My projects: search, status filter, list/card toggle | 3 |
| `/owner/projects/new` | Create project wizard. Creates a draft on the first "Save draft"/"Next", then redirects to `/owner/projects/:projectId/edit?step=N` | 3 |
| `/owner/projects/:projectId` | Project detail: brief, status, lifecycle actions (pause/reopen/close/cancel), quote summary, link to workspace if awarded | 3 |
| `/owner/projects/:projectId/edit` | Edit draft (wizard, `?step=` keeps the position) or edit allowed fields after publish | 3 |
| `/owner/projects/:projectId/quotes` | Received quotes list for the project | 3 |
| `/owner/projects/:projectId/quotes/:quoteId` | Quote detail: request revision, accept, decline, message contractor | 3 |
| `/owner/projects/:projectId/compare?ids=a,b,c` | Side-by-side comparison, 2–4 quotes | 3 |
| `/owner/contractors` | Discover contractors: search, filters, sort | 3 |
| `/owner/contractors/:contractorId` | Contractor public profile and "Invite to quote" | 3 |
| `/owner/shortlist` | Shortlisted contractors | 3 |
| `/owner/settings` | Owner profile and settings, notification preferences, demo data controls | 6 (basic in 3) |

### 1.3 Contractor (`/contractor`)

| Path | Screen | Phase |
|---|---|---|
| `/contractor` | Contractor dashboard | 4 |
| `/contractor/leads` | Lead feed: tabs **Matched** / **Saved** / **Ignored**, search, filters, sort | 4 |
| `/contractor/leads/:projectId` | Lead detail, save/ignore, ask a question, start or continue a quote | 4 |
| `/contractor/leads/:projectId/quote` | Quote composer (creates or continues this contractor's quote for the project; revise mode when revision requested or withdrawn) | 4 |
| `/contractor/quotes` | Pipeline / quote inbox grouped by stage, with event dates | 4 |
| `/contractor/quotes/:quoteId` | Quote detail (contractor view): history, withdraw, revise | 4 |
| `/contractor/profile` | Profile editor, plus a preview of how owners see it; `#reviews` anchor | 4 (reviews in 6) |
| `/contractor/portfolio` | Portfolio manager | 4 |
| `/contractor/settings` | Visibility, quote defaults, notification preferences, demo controls | 6 (basic in 4) |

### 1.4 Shared (either persona; data scoped to participation)

| Path | Screen | Guard | Phase |
|---|---|---|---|
| `/workspace` | List of the persona's workspaces (active, completed, cancelled) | owner/contractor | 5 |
| `/workspace/:workspaceId` | Workspace overview: summary, agreement, progress, next actions | participant | 4 (basic) → 5 |
| `/workspace/:workspaceId/milestones` | Milestone plan and actions | participant | 5 |
| `/workspace/:workspaceId/updates` | Site/progress updates | participant | 5 |
| `/workspace/:workspaceId/documents` | Documents (metadata and session previews) | participant | 5 |
| `/workspace/:workspaceId/changes` | Change requests | participant | 5 |
| `/workspace/:workspaceId/activity` | Activity timeline | participant | 5 |
| `/workspace/:workspaceId/review` | Leave review (owner, completed only) / view review | participant | 6 |
| `/messages` | Conversation list | owner/contractor | 5 (enquiry threads usable from 3/4 via the same route) |
| `/messages/:conversationId` | Thread | participant | 5 |
| `/notifications` | Notification centre | owner/contractor | 5 (the badge is real from Phase 3) |

### 1.5 Guard behaviour
- No active persona on a guarded route → redirect to `/start?next=<path>`. After choosing a persona, continue to `next` **only if** that path belongs to the chosen role or is a shared route.
- Wrong role (e.g. contractor opens `/owner/...`) → an inline "This page is for Property Owners" state with **Switch to Owner persona** and **Go to my dashboard** buttons. It is never a silent redirect, because switching persona is a deliberate testing action.
- Non-participant opens a workspace or conversation → "You're not part of this project" state. This is a demo guard, not a security control.
- Unknown entity ID → in-page not-found state.

---

## 2. App shell and navigation

### 2.1 Persistent elements
- **Demo banner** (top, single line on mobile, dismissible to a compact chip but never fully hidden): "Demo mode · data stays in this browser". Opens a menu with About this demo, Switch persona, Reset demo data.
- **Top bar:** wordmark (→ dashboard), page title/breadcrumbs (desktop), notification bell with unread count, messages icon with unread count, profile menu (persona name + role label, Switch persona, Settings, Help, Reset demo data).
- **Page heading pattern:** breadcrumb (≥ md) → H1 → one-line context/status → primary action placed right on desktop and in a sticky bottom action bar on mobile when the page's main purpose is that action (wizard, composer, quote decision).

### 2.2 Navigation by breakpoint

| Breakpoint | Owner nav | Contractor nav |
|---|---|---|
| < 1024px (phones and tablets) | **Bottom nav, 5 items:** Home, Projects, Find pros, Messages, More (sheet: Shortlist, Workspaces, Notifications, Settings, Help, Switch persona, Reset). The primary "Post project" action is on Home and Projects (sticky). | **Bottom nav, 5 items:** Home, Leads, Quotes, Messages, More (sheet: Workspaces, Profile, Portfolio, Notifications, Settings, Help, Switch persona, Reset) |
| ≥ 1024px | Fixed left sidebar with labelled sections, top bar with breadcrumbs | same |

Mobile rules:
- Bottom nav items are ≥ 44×44px with icon + text label. The active item uses `aria-current="page"`. The bar respects `env(safe-area-inset-bottom)`.
- The bottom nav **hides** on full-focus flows (create-project wizard, quote composer, message thread) and is replaced by that flow's sticky action bar or composer. The page gets bottom padding equal to the bar height so nothing is covered.
- "More" is a bottom sheet dialog (focus trapped, Esc/close button, focus restored to trigger).
- No hover-only actions. Row actions on lists are visible buttons or an overflow menu button.

### 2.3 Persona switch
`Switch persona` opens a dialog listing the two demo personas with role labels and a reminder that this is a local demo with no authentication. Switching keeps the current route only if it is a shared route the new persona participates in (e.g. the same workspace or conversation). Otherwise it goes to the new persona's dashboard. A toast confirms the switch: "Now viewing as Sahyadri Waterproofing (Contractor)".

---

## 3. Key screen layouts (mobile-first intent)

| Screen | Mobile | Desktop |
|---|---|---|
| Landing | Single column: headline, two role entry buttons, how-it-works as numbered steps per role (segmented control toggles Owner/Contractor), categories as a wrapping list, process illustration, trust principles as a plain list, CTA | Editorial grid: large type left, illustration right; steps as two columns; category index as a multi-column list |
| Owner dashboard | Next actions list first, then projects by status (compact rows), latest messages, recent site updates | Two-column: main (next actions, projects table) + side (messages, updates) |
| Create project wizard | One field group per step (Basics → Scope → Location & property → Budget & timing → Site & materials → Attachments → Review). Sticky footer: Back / Save draft / Next. Step indicator "Step 3 of 7" + progress bar | Same steps; step list in a left column; footer inline |
| My projects / lead feed | Stacked rows with status badge, key facts, chevron link; filter button opens a sheet; active filters shown as removable chips with "Clear all" | Table (projects) or rows (leads) with an inline filter bar |
| Contractor profile | Header (name, demo label, rating text, areas), action bar (Invite to quote, Shortlist, Message), sections as anchors | Two columns: profile content + sticky facts panel |
| Quote comparison | One quote per horizontally swipeable panel is **not** used (it hides facts). Instead, a stacked comparison by attribute: for each attribute (Total, Timeline, Validity, Includes, Excludes, Assumptions, Line items, Contractor evidence), list each quote's value under the contractor name | Column table, one column per quote, sticky first column of attribute labels, horizontally scrollable **inside its container only** if 4 quotes exceed the width |
| Quote composer | Line items as stacked editable groups (description, qty, unit, rate, line total), "Add line item"; totals summary sticky at the bottom showing Total with expandable breakdown | Line-item table with inline inputs; totals panel on the right |
| Workspace | Header (project, counterpart, status, progress) + tab list that scrolls horizontally within the tab bar (Overview, Milestones, Updates, Documents, Changes, Activity, Messages) | Header + tabs; overview shows timeline beside milestones |
| Message thread | Full-height thread, composer pinned above the keyboard/safe area, "Jump to latest" button when scrolled up | Split view: conversation list + thread |

---

## 4. Cross-cutting UX states (every data screen)
- **Loading:** reads are synchronous from the store, so there are no artificial spinners. Commands that do visible work (reset, file preview generation) show a short "working" state on the triggering button (`aria-busy`). Skeletons are used only for image previews.
- **Empty:** explains what creates content and offers that action (e.g. "No quotes yet. Quotes appear here when contractors respond to your published project.").
- **No results:** names the active filters and offers **Clear filters**.
- **Error:** says what failed and how to recover (retry, reset, go back).
- **Success:** a toast plus a visible state change on the page. Undo is offered for deleting drafts, removing a shortlist entry, ignoring a lead and removing a portfolio item.
- **Disabled controls:** always carry a visible reason (helper text or `aria-describedby`), e.g. "Reopen the project to accept quotes".
- **Unsaved changes:** the wizard, composer and profile editor warn on navigation (router `useBlocker` + `beforeunload`).

## 5. Status labels (single source: `src/domain/*/labels.ts`)

| Entity | Status → label |
|---|---|
| Project | draft → Draft · open → Open for quotes · reviewing → Reviewing quotes · paused → Paused · awarded → Awarded · in_progress → In progress · completed → Completed · closed → Closed · cancelled → Cancelled |
| Quote | draft → Draft · submitted → Submitted · viewed → Viewed by owner · revision_requested → Revision requested · accepted → Accepted · declined → Declined · withdrawn → Withdrawn · (derived) expired → Expired |
| Pipeline | New · Invited · Saved · Ignored · Quote draft · Submitted · Revision requested · Accepted · Declined · Withdrawn · Closed |
| Milestone | pending → Not started · in_progress → In progress · submitted → Awaiting approval · changes_requested → Changes requested · approved → Approved |
| Change request | proposed → Awaiting response · accepted → Accepted · rejected → Rejected · withdrawn → Withdrawn |

Badges always show the text label (plus an icon). Color is never the only signal.

## 6. Responsive and accessibility targets
- Verify at 320, 375, 390, 430, 768, 1024, 1280 and 1440px. No horizontal page overflow at 320px.
- Touch targets ≈ 44×44px. Visible focus ring (2px, offset) on every interactive element.
- Landmarks: `header`, `nav` (labelled "Primary"), `main`, `footer` (public). One H1 per page.
- `prefers-reduced-motion`: disables transitions on sheets, toasts and progress bars.
