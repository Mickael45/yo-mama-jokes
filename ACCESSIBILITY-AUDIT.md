# Accessibility — yo-mama-jokes

**Target standard:** WCAG 2.2 AA
**Status:** Passes all automated and agent-executable manual checks; human screen-reader verification pending. Not a legal conformance certification.
**Latest run:** [`audits/web-accessibility/2026-07-18-report.md`](audits/web-accessibility/2026-07-18-report.md) · machine sidecar: `audits/web-accessibility/latest.json`

## Project profile

Astro 6 static content site (Tailwind v4), deployed to Cloudflare Workers serving prebuilt `dist/`. Content: 21 Yo-Mama joke categories + info pages. No HTML forms (contact is a `mailto:` link), no video/audio, single language (`lang="en"`). Native widgets only: `<details>` FAQ, copy-to-clipboard button, social share links, prod-only non-modal PWA install bar.

## Enforcement harness (deterministic gate)

| Artifact | Purpose |
|---|---|
| `e2e/a11y.spec.ts` | axe-core on every route + state; keyboard skip-link & share-focus; 320px reflow; reduced-motion |
| `playwright.config.ts` | builds + serves the prod bundle (`npm run build && npm run preview`) |
| `.github/workflows/a11y.yml` | blocks push/PR to `main` on any a11y regression |

Run locally: `npx playwright test a11y`.

## Scope decisions (applicability)

| Area | Disposition |
|---|---|
| Keyboard, focus, contrast, reflow, motion, landmarks, naming, alt, targets, status, links | **In scope** — audited every run |
| Forms (`form-labels`, `form-errors-associated`, `autocomplete-tokens`) | **N/A** — no HTML forms; contact is a `mailto:` link |
| Captions / time-based media | **N/A** — no video or audio content |
| Lighthouse a11y score | **Skipped** — a strict subset of the axe rules already run (0 violations); adds no signal |

## Definition of Done — latest run (2026-07-18)

- axe: **0 violations** (`wcag2a…wcag22aa`) across 8 routes + 2 states.
- Keyboard: skip-link first & focuses `<main>`; share/copy controls reachable with visible focus.
- Reflow: no horizontal scroll at 320px on any route.
- Reduced motion: 0 long-running animations under `prefers-reduced-motion: reduce`.
- `astro check`: 0 errors / 0 warnings.
- Full WCAG 2.2 A/AA checklist dispositioned (Pass / N/A) — see the dated report.

## Active suppressions

None.

## Human-verification handover (cannot be agent-certified)

- Screen-reader passes: NVDA + Chrome (Windows) and VoiceOver + Safari (macOS/iOS) on the top flows (skip-link, share-button names, copy-link announcement, FAQ, PWA bar).
- Judgment: aptness of the logo `alt` text and overall reading order.
- Third-party audit if formal EAA / ADA conformance evidence is ever required — agent output is not legal evidence.

## Compliance notes

No accessibility statement is published and none is fabricated here. If a statement becomes required (e.g. EU-consumer exposure under the EAA), draft it from the template in the skill's `references/compliance.md` and fill the human-only facts (audit date, auditor identity, jurisdiction, feedback SLA, enforcement-body links).
