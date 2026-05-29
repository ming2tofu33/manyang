# Frontend Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish measurable frontend performance, asset, animation, and layout stability improvements for the Manyang mobile web app.

**Architecture:** Treat Manyang as an asset-heavy mobile stage UI, not a generic responsive website. Start by capturing baseline metrics, then reduce runtime image payload, stabilize background/UI coordinates, tune animation cost, and narrow client component boundaries only where evidence supports it.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, Vitest, Playwright CLI, local static assets under `frontend/public/manyang`.

---

## Rules

- Measure before changing production code.
- Keep visual quality unless the metric gain is meaningful.
- Use TDD for code behavior changes.
- Keep each task small enough to review independently.
- Store screenshots under `output/playwright/optimization/`.
- Do not remove user-created reference assets unless they are clearly runtime-unused and the user approves.

## Task 1: Create Baseline Evidence Folder

**Files:**
- Create: `output/playwright/optimization/`
- Read: `vault/09-Implementation/Frontend-Optimization-Guide.md`
- Read: `vault/08-Design/Layout-Contract.md`

**Step 1: Create artifact directory**

Run:

```powershell
New-Item -ItemType Directory -Force output\playwright\optimization
```

Expected: directory exists.

**Step 2: Run production build**

Run:

```powershell
cd frontend
npm run build
```

Expected: build passes and route table prints.

**Step 3: Capture image size baseline**

Run from repo root:

```powershell
Get-ChildItem -Path frontend\public\manyang -Recurse -File |
  Sort-Object Length -Descending |
  Select-Object -First 40 FullName,Length |
  Out-File output\playwright\optimization\asset-size-baseline.txt -Encoding utf8
```

Expected: top image sizes are saved.

**Step 4: Commit evidence only if requested**

Do not commit generated screenshots or measurement artifacts by default.

## Task 2: Capture Mobile Layout Baseline

**Files:**
- Read: `frontend/src/components/app-shell.tsx`
- Read: `frontend/src/components/today-home-scene.tsx`
- Read: `frontend/src/components/today-home-actions.tsx`
- Read: `frontend/src/lib/home-background-effect-layout.ts`

**Step 1: Start local production server**

Run:

```powershell
cd frontend
npm run start
```

Expected: local server responds on `http://127.0.0.1:3000`.

**Step 2: Capture home screenshots**

Run from repo root:

```powershell
npx playwright screenshot --viewport-size=375,667 --wait-for-timeout=1800 "http://127.0.0.1:3000/?opt=baseline-home-375" "output\playwright\optimization\home-375x667-before.png"
npx playwright screenshot --viewport-size=390,844 --wait-for-timeout=1800 "http://127.0.0.1:3000/?opt=baseline-home-390" "output\playwright\optimization\home-390x844-before.png"
npx playwright screenshot --viewport-size=430,932 --wait-for-timeout=1800 "http://127.0.0.1:3000/?opt=baseline-home-430" "output\playwright\optimization\home-430x932-before.png"
```

Expected: screenshots reveal current CTA, nav, background, and effect positions.

**Step 3: Capture production comparison**

Run:

```powershell
npx playwright screenshot --viewport-size=390,844 --wait-for-timeout=1800 "https://manyang.vercel.app/?opt=baseline-prod" "output\playwright\optimization\home-vercel-390x844-before.png"
```

Expected: production screenshot exists for comparison.

## Task 3: Add Performance DoD to Vault

**Files:**
- Modify: `vault/09-Implementation/Checklists-&-DoD.md`
- Modify: `vault/09-Implementation/Implementation-Plan.md`

**Step 1: Add checklist section**

Add a `Frontend Optimization DoD` section:

```markdown
## Frontend Optimization DoD

- [ ] `npm test` 통과
- [ ] `npm run lint` 통과
- [ ] `npm run build` 통과
- [ ] `375x667`, `390x844`, `430x932` 모바일 스크린샷 확인
- [ ] 가로 스크롤 없음
- [ ] Fixed 화면 내부 세로 스크롤 없음
- [ ] LCP 후보 이미지가 의도한 에셋인지 확인
- [ ] 큰 PNG가 runtime path에 불필요하게 남지 않음
- [ ] `prefers-reduced-motion` 회귀 없음
- [ ] Vercel production과 local production 차이 확인
```

**Step 2: Link guide**

Add `[[Frontend-Optimization-Guide]]` to implementation related docs.

**Step 3: Verify links**

Run:

```powershell
rg -n "Frontend-Optimization-Guide|Frontend Optimization DoD" vault
```

Expected: links appear in implementation docs.

## Task 4: Classify Runtime vs Reference Assets

**Files:**
- Read: `frontend/src/lib/manyang-assets.ts`
- Read: `frontend/public/manyang/**`
- Modify if needed: `vault/08-Design/Asset-Inventory.md`

**Step 1: Write asset classification table**

Create an evidence table with:

```markdown
| Asset | Size | Runtime Used | Screen | Action |
| --- | ---: | --- | --- | --- |
```

**Step 2: Identify top runtime images**

Use `manyangAssets` and route components to decide which large assets are actually loaded by app routes.

**Step 3: Do not delete yet**

Only mark candidates:

- keep runtime
- compress candidate
- resize candidate
- reference-only candidate
- delete candidate after approval

Expected: no production code changes yet.

**Progress 2026-05-28:** Completed. Classification document created at `vault/09-Implementation/Frontend-Optimization-Asset-Classification-2026-05-28.md`; `Asset-Inventory` and `Frontend-Optimization-Guide` now link to it. No runtime files were deleted or changed.

## Task 5: Image Optimization Spike

**Files:**
- Read: `frontend/public/manyang/backgrounds/*`
- Read: `frontend/public/manyang/ui/buttons/*`
- Read: `frontend/public/manyang/ui/footer/*`
- Test: `frontend/src/lib/manyang-assets.test.ts`

**Step 1: Pick one image class**

Start with home backgrounds or button frames, not both.

**Step 2: Generate optimized candidates outside runtime path**

Store candidates under a temporary review folder such as:

```text
output/playwright/optimization/assets/
```

**Step 3: Compare visual quality**

Capture before/after screenshots at:

- `375x667`
- `390x844`
- `430x932`

**Step 4: Update runtime assets only after visual approval**

If replacing files, update tests that assert asset paths or dimensions.

**Step 5: Verify**

Run:

```powershell
cd frontend
npm test -- src/lib/manyang-assets.test.ts
npm run lint
npm run build
```

Expected: tests, lint, build pass.

**Progress 2026-05-29:** Home background candidates generated under `output/playwright/optimization/assets/home-backgrounds/`. WebP q84 reduces the four home backgrounds from 8.11 MiB to 0.87 MiB; AVIF q56 reduces them to 0.53 MiB. WebP q84 is now connected to the runtime home background paths and verified with tests, lint, build, and mobile screenshots. See `vault/09-Implementation/Frontend-Optimization-Image-Spike-2026-05-29.md`.

**Progress 2026-05-29 follow-up:** `receipts/empty.png` and `ui/calendar.png` were converted to WebP q86 and connected to runtime components. Combined payload changed from 4.67 MiB to 0.27 MiB, a 94.2% reduction. Verification passed with component tests, full test suite, lint, build, static content-type checks, and mobile screenshots for `/archive` and `/result`.

**Progress 2026-05-29 follow-up 2:** Remaining large runtime images were converted and connected as WebP: default page background, interpretation backgrounds, dream seed and morning illustrations, cat reader profile portraits, and loading orb assets. Combined payload changed from 28.66 MiB to 3.00 MiB, an 89.5% reduction. Verification passed with targeted tests, full test suite, lint, build, static content-type checks, and Playwright runtime checks across `/write`, `/loading`, `/seed`, `/morning`, `/archive`, and `/result`.

## Task 6: Home Layout Stability Spike

**Files:**
- Modify: `frontend/src/lib/home-background-effect-layout.ts`
- Modify: `frontend/src/components/home-background-effects.tsx`
- Modify if needed: `frontend/src/components/today-home-actions.tsx`
- Test: `frontend/src/components/home-background-effects.test.tsx`
- Test: `frontend/src/app/globals.test.ts`

**Step 1: Write failing tests for layout contract**

Add tests that make the intended contract explicit:

```ts
it("keeps home effect targets inside the design stage", () => {
  const targets = getHomeBackgroundEffectTargets("black_cat");

  expect(targets.every((target) => target.x >= 0 && target.x <= 100)).toBe(true);
  expect(targets.every((target) => target.y >= 0 && target.y <= 100)).toBe(true);
});
```

**Step 2: Verify test fails if a new contract field is missing**

If adding a new layout preset API, first assert the new field exists and watch the test fail.

**Step 3: Implement minimal layout preset**

Introduce a stable stage-oriented API only if it directly solves measured drift.

**Step 4: Capture screenshots**

Run:

```powershell
npx playwright screenshot --viewport-size=375,667 --wait-for-timeout=1800 "http://127.0.0.1:3000/?opt=home-layout-after-375" "output\playwright\optimization\home-375x667-after.png"
npx playwright screenshot --viewport-size=390,844 --wait-for-timeout=1800 "http://127.0.0.1:3000/?opt=home-layout-after-390" "output\playwright\optimization\home-390x844-after.png"
npx playwright screenshot --viewport-size=430,932 --wait-for-timeout=1800 "http://127.0.0.1:3000/?opt=home-layout-after-430" "output\playwright\optimization\home-430x932-after.png"
```

Expected: no horizontal scroll, no internal home scroll, CTA and nav do not overlap.

**Progress 2026-05-29:** Home layout stability contract started. The home screen now declares a `390x844` stage contract in `homeStageLayout`, uses a fixed `AppShell` content mode for `/`, exposes `data-home-action-stage="root"`, and marks the live effect layer with `data-home-effect-stage="390x844"`. Verification passed with targeted tests, full test suite, lint, build, and Playwright checks at `375x667`, `390x844`, and `430x932`; each viewport had no horizontal scroll, no page vertical scroll, and a 12px action-to-nav gap.

## Task 7: Animation Cost Review

**Files:**
- Read: `frontend/src/app/globals.css`
- Read: `frontend/src/components/home-cat-background-transition.tsx`
- Read: `frontend/src/components/home-background-effects.tsx`
- Test: `frontend/src/app/globals.test.ts`

**Step 1: List persistent animations**

Record all infinite animations and expensive filters:

- `home-flame-breathe`
- `home-orb-bloom`
- `home-smoke-drift`
- `home-twinkle-glint`
- cat transition mist/glow
- receipt animation if result screen is in scope

**Step 2: Check reduced motion**

Write or update CSS tests to assert reduced motion covers any new animation class.

**Step 3: Tune one animation group at a time**

Do not adjust home effects and receipt animation in the same commit.

**Step 4: Verify**

Run:

```powershell
cd frontend
npm test -- src/app/globals.test.ts
npm run lint
npm run build
```

Expected: reduced-motion coverage remains intact.

**Progress 2026-05-29:** Home animation cost review started. Persistent home animations are `home-flame-breathe`, `home-orb-bloom`, `home-smoke-drift`, and `home-twinkle-glint`; cat background switching uses temporary mist/glow transition animations. The home animation layers no longer pre-promote `filter` through `will-change`, and `prefers-reduced-motion` now removes home animation filters and layer hints. Result receipt animations were intentionally left unchanged for a separate pass.

## Task 8: Client Boundary Review

**Files:**
- Read: `frontend/src/app/**/*.tsx`
- Read: `frontend/src/components/**/*.tsx`
- Read: `frontend/src/lib/*.ts`

**Step 1: Inventory client components**

Run:

```powershell
rg -n '"use client"|useSyncExternalStore|localStorage|useEffect|useState' frontend/src -g "*.tsx" -g "*.ts"
```

**Step 2: Classify each client component**

Use:

```markdown
| Component | Reason for client | Can split? | Action |
| --- | --- | --- | --- |
```

**Step 3: Refactor only obvious cases**

Do not refactor broad component trees without measured JS or hydration benefit.

**Step 4: Verify**

Run:

```powershell
cd frontend
npm test
npm run lint
npm run build
```

Expected: no behavior regression.

**Progress 2026-05-29:** Client boundary review completed for current high-confidence scope. Encyclopedia list/detail routes now render `AppShell` and static encyclopedia content as Server Components, while selected-cat guide UI moved into the small `encyclopedia-reader-guide-client.tsx` island. Inventory and deferred candidates are documented in `vault/09-Implementation/Frontend-Optimization-Client-Boundary-Review-2026-05-29.md`.

## Task 9: Final Report

**Files:**
- Modify: `vault/09-Implementation/Frontend-Optimization-Guide.md`
- Optional: create `vault/09-Implementation/Frontend-Optimization-Evidence-YYYY-MM-DD.md`

**Step 1: Fill before/after table**

Use:

```markdown
| Metric | Before | After | Notes |
| --- | ---: | ---: | --- |
| Home first-screen image payload |  |  |  |
| Largest image request |  |  |  |
| LCP |  |  |  |
| CLS |  |  |  |
| INP |  |  |  |
```

**Step 2: Link screenshots**

Use Obsidian-friendly links or file paths to screenshots.

**Step 3: Summarize decisions**

Include:

- kept visual quality
- replaced assets
- deferred work
- production verification status

**Step 4: Final verification**

Run:

```powershell
cd frontend
npm test
npm run lint
npm run build
```

Expected: all pass.

**Progress 2026-05-29:** Final optimization evidence was consolidated in `vault/09-Implementation/Frontend-Optimization-Evidence-2026-05-29.md`. The tracked large runtime image set now documents a reduction from 41.44 MiB to 4.15 MiB, with links to screenshot evidence, layout/animation/client-boundary decisions, deferred Lighthouse metrics, and final verification commands.

---

## Handoff

Start with Task 1 and Task 2 only. Do not optimize images or refactor components until baseline evidence is saved.
