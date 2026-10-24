# AvenBuild — Mobile Roadmap (React Native / Expo)

**Status:** Phase 8 handoff · **Date:** 2026-10-24
No mobile app exists yet. This document describes a realistic path from the web prototype to native iOS/Android clients. The web UI **cannot** be reused in React Native as-is: it renders DOM elements styled with Tailwind CSS. What can be reused is the framework-independent core.

## 1. What can be shared

| Layer | Location today | Reuse in Expo | Notes |
|---|---|---|---|
| Domain types and IDs | `src/domain/types.ts`, `ids.ts`, `status.ts`, `roles.ts` | ✅ As-is | Pure TypeScript, no DOM or React. |
| State machines and commands | `src/domain/**/machine.ts`, `**/commands.ts`, `tx.ts` | ✅ As-is (client-side checks) | Once a backend exists these become **UX pre-checks**; the server must re-run the same rules authoritatively. |
| Quote maths | `src/domain/quotes/math.ts`, `src/domain/money.ts` | ✅ As-is | Integer-paise arithmetic, no float rounding. Share it with the server too, so totals match exactly. |
| Matching, filters, selectors | `src/domain/matching`, `leads`, `projects/selectors.ts`, `workspace/selectors.ts`, `messages/selectors.ts` | ✅ As-is | Lead matching should move server-side for scale; the code can be shared. |
| Validation schemas | `src/lib/validation/*.ts` (Zod) | ✅ As-is | The same schemas validate API requests on the server. |
| Formatting | `src/lib/format`, `src/config/locale.ts` | ✅ Mostly | `Intl` works in Hermes; check `en-IN` currency output on Android. |
| Status labels | `src/domain/status.ts` | ✅ As-is | Single source of wording. |
| Design tokens | `src/styles/index.css` (`@theme`) | ⚠️ Export | Move colours, radii and the type scale into a JSON token file, consumed by Tailwind on web and by a theme object (or NativeWind) on mobile. |
| Seed data | `src/data/seed` | ⚠️ Dev only | Useful for Storybook/fixtures; production data comes from the API. |
| React components, router, dialogs | `src/components`, `src/features`, `src/app` | ❌ Rebuild | DOM, `<dialog>`, CSS and React Router don't exist in RN. Rebuild with RN primitives and Expo Router. |
| Storage adapter | `src/lib/storage` | ❌ Replace | Mobile uses the API, plus an offline cache (e.g. SQLite or MMKV) behind the same adapter idea. |

## 2. Recommended structure

```
packages/
  domain/       ← src/domain + src/lib/validation + src/lib/format + config/locale (no React)
  tokens/       ← design tokens as JSON
apps/
  web/          ← this Vite app, importing @avenbuild/domain
  mobile/       ← Expo (Expo Router, React Native, TanStack Query for API data)
  api/          ← server (see demo-limitations-and-backend-replacement.md)
```

Step 1 is purely mechanical: move `src/domain` and `src/lib/validation` into `packages/domain` (they import nothing from React or the DOM; an ESLint boundary rule should keep it that way), then point the web app at the package.

## 3. What must be built natively

- **Navigation:** Expo Router tabs mirroring the web bottom bar (Owner: Home, Projects, Find pros, Messages, More · Contractor: Home, Leads, Quotes, Messages, More), with stacks per tab.
- **Forms:** the project wizard and quote composer rebuilt with RN inputs. React Hook Form + the shared Zod schemas work unchanged. Numeric keyboards (`decimal-pad`) for quantities and rates.
- **Lists:** `FlatList`/`FlashList` for leads, projects, pipeline and messages (virtualised; the web uses plain lists).
- **Dialogs and sheets:** native modals and bottom sheets in place of `<dialog>`.
- **Files and photos:** `expo-image-picker` / `expo-document-picker`, uploaded with pre-signed URLs to object storage (the web demo only keeps metadata).
- **Push notifications:** Expo Notifications fed by server events (the demo's notification catalogue in `architecture.md` §7 maps one-to-one to push categories).
- **Auth:** a real session (OTP or email link) stored in `expo-secure-store`. The demo persona selector must not ship.
- **Offline:** cache read models; queue writes such as messages and site updates with idempotency keys (see the backend doc).

## 4. Suggested sequence

1. Extract `packages/domain` and `packages/tokens`; keep the web app green (its 83 unit tests and the e2e suite are the safety net).
2. Stand up the API with auth, projects, quotes and accept (backend doc, tasks 1–4).
3. Build the Expo **contractor** app first (lead feed, quote composer, site updates with photos), because contractors are on site and benefit most from native camera and push.
4. Build the owner flows (post project, compare, approve milestones).
5. Add push notifications, offline queueing and deep links (`avenbuild://workspace/:id`) using the same route shapes as `src/domain/links.ts`.

## 5. Risks

- Shared domain code must stay free of DOM/React imports. Add an ESLint `no-restricted-imports` rule to the package.
- The `Intl` and date-handling differences between Hermes and browsers need tests on real devices.
- Rules duplicated between client and server can drift. The server must be authoritative, and the shared package should be versioned.
