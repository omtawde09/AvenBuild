# Evan Build — Manual Test Guide

**Status:** Phase 8 handoff · **Date:** 2026-10-24
Use this guide to demo the prototype or verify a release by hand. Automated coverage is listed in `acceptance-checklist.md`.

## Setup

```bash
npm install
npm run dev            # http://localhost:5173
```

Other commands: `npm run check` (type-check, lint, unit tests, build) · `npm run e2e` (Playwright; uses the installed Edge, or `PW_CHANNEL=chrome`) · `npm run build && npm run preview` (production build).

**Reset to a known state:** click **Reset** in the yellow demo banner (or go to `/help` → *Reset demo data*), then confirm. This restores the original sample scenario and returns you to `/start`. To recover from a broken state by hand: open DevTools → Application → Local Storage and delete `evanbuild.demo`.

Test on a phone-sized viewport (375 px) first, then desktop. Watch the browser console: there should be no errors.

## Demo script (about 10 minutes)

| # | Persona | Steps | Expected |
|---|---|---|---|
| 1 | — | Reset demo data. Open `/` at 375 px. | Landing page fits the screen; demo banner visible. |
| 2 | Owner | *Post a project* → choose **Meera Kulkarni** → *Post a project*. Pick **Waterproofing**, enter a title, choose *Apartment*, **Next**. Add a scope description. **Next**. | A draft is created; the URL changes to `/owner/projects/<id>/edit?step=2`. |
| 3 | Owner | Refresh the page. | You return to the *Location* step with your text intact. |
| 4 | Owner | Complete Location (Pune, Kothrud), Budget (₹50,000–80,000, *As soon as possible*), Site (Sat, hours, *Contractor supplies materials*), skip Files, then **Publish** → confirm. | Status "Open for quotes"; toast "Published…". |
| 5 | Contractor | Top bar **Switch persona** (phone: *More → Switch demo persona*) → **Sahyadri**. Open **Leads**. | The new project appears with "✓ Service match: Waterproofing" and other reasons. |
| 6 | Contractor | Open it → **Save lead** → **Start a quote**. Line 1: qty `120.5`, rate `95.50`. Add line 2: qty `1`, rate `2500`. | Subtotal ₹14,007.75 · GST ₹2,521.40 · Total ₹16,529.15. |
| 7 | Contractor | **Submit quote** → confirm. | Redirect to the quote page; pipeline shows "Submitted". |
| 8 | Owner | Switch to Meera. **Notifications** → *New quote received*. **Request a revision** with a message. | Quote shows "Revision requested". Also open `/owner/projects/prj_seed_terrace/compare` to see a 3-way comparison. |
| 9 | Contractor | Switch. **Quotes** → open the project → change a rate → **Send revision** → confirm. | Revision 2; the owner is notified. |
| 10 | Owner | Switch. Open the quote → **Accept quote** → confirm. | Redirect to the new workspace; the other quotes on the project are declined. |
| 11 | Contractor | Switch. Workspace → **Messages** → send a message. **Site updates** → post one. **Milestones** → *Start* → *Submit for approval* with a note. | Both persist after refresh; the owner's badges increase. |
| 12 | Owner | Switch. Open the message (unread clears). **Milestones** → *Request changes* or *Approve*. | Progress updates; the contractor is notified. |
| 13 | Both | Repeat until every milestone is approved. Owner → **Overview → Mark project complete** → leave a 5-star review. | Review shows on the contractor profile; review count +1; the review form is gone (no duplicates). |
| 14 | — | Refresh, then **Reset demo data**. | Everything returns to the seed: Meera has 5 projects and the new one is gone. |

## Failure-path checks

- Empty search on **Find contractors** (`zzzz`) → "No contractors match these filters" with **Clear filters**.
- Wizard **Next** with nothing filled → field errors, focus on the first invalid field.
- Quote composer: quantity `-5` or rate `12.345` → field errors; nothing is submitted.
- Empty message → "Write a message before sending."
- Open **Accept quote** and press **Cancel** → nothing changes.
- DevTools: set `evanbuild.demo` to `{bad` and reload → a recovery notice is shown and the sample data is restored.
- Make a contractor profile **Hidden** in settings → it disappears from owner search.
- Pause a project as the owner → it leaves the contractor feed and quotes can't be accepted until it's reopened.

## Accessibility spot checks

- Press **Tab** on any app page: "Skip to content" appears first; focus outlines are visible.
- Open a dialog with the keyboard: focus stays inside; **Esc** closes it and returns focus to the trigger.
- With OS "reduce motion" on, sheets and toasts don't animate.
- Statuses always read as text (for example "Awaiting approval"), not colour alone.

## Seed scenario reference

| Persona | Highlights |
|---|---|
| Owner (Meera) | Terrace project reviewing 3 quotes (one revision requested) · bathroom job in progress (milestone 2 awaiting approval, accepted change request) · compound-wall draft · paused paver project · completed plumbing job awaiting a review |
| Contractor (Sahyadri) | Invited lead (terrace garden) · saved lead with a quote draft (basement) · ignored lead · submitted, declined, withdrawn and closed quotes · active bathroom workspace |
