# AvenBuild — demo prototype

A responsive web prototype of a property-owner ↔ contractor construction marketplace.
**Local-only demo:** there is no backend, database, real sign-in, payment or messaging service. All data lives in this browser's
`localStorage` and does not sync between devices or people.

"AvenBuild" is a working name; no trademark clearance is implied. All people, businesses and reviews are fictional sample data.

## Requirements

- Node.js ≥ 22.13 (developed on 22.19) and npm

## Commands

```bash
npm install          # install dependencies
npm run dev          # start the dev server at http://localhost:5173
npm run typecheck    # strict TypeScript check
npm run lint         # ESLint
npm run test         # unit + component tests (Vitest)
npm run build        # production build to dist/
npm run check        # all of the above in sequence
npm run e2e          # Playwright: acceptance (375px), responsive (8 widths) and accessibility suites
```

End-to-end tests use the Microsoft Edge already installed on the machine (`PW_CHANNEL=chrome` to use Chrome instead),
so no browser download is needed. They build the app and serve it with `vite preview` on port 4174.

## Using the demo

1. Open the app and choose **Property Owner** or **Contractor** on `/start` (no password — this is not authentication).
2. Use **Switch persona** in the top bar to act on the other side of the same project.
3. **Reset demo data** (banner, persona menu or `/help`) restores the original sample scenario.

## Documentation

- `docs/product-spec.md` — roles, lifecycle, entities and business rules
- `docs/architecture.md` — layers, storage adapter, state machines, build order
- `docs/ux-and-route-map.md` — routes and navigation
- `docs/acceptance-checklist.md` — acceptance criteria and their verified status
- `docs/manual-test-guide.md` — demo script, failure-path and accessibility checks, reset steps
- `docs/demo-limitations-and-backend-replacement.md` — what is simulated, what must never ship, backend seams, next tasks
- `docs/data-model-and-api-contract.md` — entities, constraints and the proposed API
- `docs/mobile-roadmap.md` — what can be shared with a future React Native / Expo app
