# Home Performance LCP Images Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve the home page Lighthouse web performance score by fixing the lazy-loaded LCP button image and reducing above-the-fold image payload.

**Architecture:** Keep the current asset registry and component structure, but add explicit image priority support to reusable image buttons. Convert the heaviest home/footer PNG assets to WebP and point the asset registry at the optimized files while keeping the source PNGs as references.

**Tech Stack:** Next.js 16, React 19, `next/image`, Vitest, Sharp via `frontend/scripts/convert-to-webp.mjs`.

---

### Task 1: Add Priority Support To Image Text Buttons

**Files:**
- Modify: `frontend/src/components/asset-primitives.tsx`
- Modify: `frontend/src/components/today-home-actions.tsx`
- Test: `frontend/src/components/today-home-actions.test.tsx`

**Step 1: Write the failing test**

Add assertions that the home primary CTA image is rendered eagerly and receives a high fetch priority:

```ts
expect(markup).toContain('fetchpriority="high"');
expect(markup).not.toContain('loading="lazy"');
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/components/today-home-actions.test.tsx`

Expected: FAIL because `AssetImageTextButton` does not currently expose priority behavior for home CTA images.

**Step 3: Write minimal implementation**

Add a `priority?: boolean` prop to `AssetImageTextButtonProps`, forward it to `Image`, and pass `fetchPriority="high"` only when priority is true:

```tsx
<Image
  src={frame}
  alt=""
  width={width}
  height={height}
  sizes={sizes}
  priority={priority}
  fetchPriority={priority ? "high" : undefined}
  unoptimized
  className={cn("pointer-events-none h-auto w-full select-none object-contain", imageClassName)}
/>
```

Then set `priority` on `PrimaryDreamButton` and `DailyTarotButton` because both appear above the fold in the home action group.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/components/today-home-actions.test.tsx`

Expected: PASS.

### Task 2: Convert Heavy Runtime PNG Assets To WebP

**Files:**
- Create: `frontend/public/manyang/ui/buttons/dreammemory-write-frame-slim.webp`
- Create: `frontend/public/manyang/ui/footer/footer-frame.webp`
- Create: `frontend/public/manyang/ui/footer/footer-icon-today.webp`
- Create: `frontend/public/manyang/ui/footer/footer-icon-write.webp`
- Create: `frontend/public/manyang/ui/footer/footer-icon-archive.webp`
- Create: `frontend/public/manyang/ui/footer/footer-icon-encyclopedia.webp`
- Create: `frontend/public/manyang/ui/footer/footer-icon-profile.webp`
- Create: `frontend/public/manyang/ui/action-icons/action-bell.webp`
- Create: `frontend/public/manyang/ui/action-icons/action-settings.webp`
- Modify: `frontend/public/manyang/backgrounds/home-black-cat.webp`
- Modify: `frontend/public/manyang/backgrounds/home-white-cat-ref.webp`
- Modify: `frontend/public/manyang/backgrounds/home-cheese-cat.webp`
- Modify: `frontend/public/manyang/backgrounds/home-gray-cat.webp`

**Step 1: Convert assets**

Run each conversion with Sharp at quality 80:

```bash
node scripts/convert-to-webp.mjs --input public/manyang/ui/buttons/dreammemory-write-frame-slim.png --out public/manyang/ui/buttons/dreammemory-write-frame-slim.webp --quality 80
node scripts/convert-to-webp.mjs --input public/manyang/ui/footer/footer-frame.png --out public/manyang/ui/footer/footer-frame.webp --quality 80
node scripts/convert-to-webp.mjs --input public/manyang/ui/footer/footer-icon-today.png --out public/manyang/ui/footer/footer-icon-today.webp --quality 80
node scripts/convert-to-webp.mjs --input public/manyang/ui/footer/footer-icon-write.png --out public/manyang/ui/footer/footer-icon-write.webp --quality 80
node scripts/convert-to-webp.mjs --input public/manyang/ui/footer/footer-icon-archive.png --out public/manyang/ui/footer/footer-icon-archive.webp --quality 80
node scripts/convert-to-webp.mjs --input public/manyang/ui/footer/footer-icon-encyclopedia.png --out public/manyang/ui/footer/footer-icon-encyclopedia.webp --quality 80
node scripts/convert-to-webp.mjs --input public/manyang/ui/footer/footer-icon-profile.png --out public/manyang/ui/footer/footer-icon-profile.webp --quality 80
node scripts/convert-to-webp.mjs --input public/manyang/ui/action-icons/action-bell.png --out public/manyang/ui/action-icons/action-bell.webp --quality 80
node scripts/convert-to-webp.mjs --input public/manyang/ui/action-icons/action-settings.png --out public/manyang/ui/action-icons/action-settings.webp --quality 80
node scripts/convert-to-webp.mjs --input public/manyang/backgrounds/home-black-cat.png --out public/manyang/backgrounds/home-black-cat.webp --quality 80
node scripts/convert-to-webp.mjs --input public/manyang/backgrounds/home-white-cat-ref.png --out public/manyang/backgrounds/home-white-cat-ref.webp --quality 80
node scripts/convert-to-webp.mjs --input public/manyang/backgrounds/home-cheese-cat.png --out public/manyang/backgrounds/home-cheese-cat.webp --quality 80
node scripts/convert-to-webp.mjs --input public/manyang/backgrounds/home-gray-cat.png --out public/manyang/backgrounds/home-gray-cat.webp --quality 80
```

**Step 2: Verify size reduction**

Run: `Get-Item frontend/public/manyang/ui/buttons/dreammemory-write-frame-slim.* , frontend/public/manyang/ui/footer/footer-frame.*`

Expected: WebP files are materially smaller than their PNG sources.

### Task 3: Point The Asset Registry At Optimized Runtime Assets

**Files:**
- Modify: `frontend/src/lib/manyang-assets.ts`
- Test: `frontend/src/lib/manyang-assets.test.ts`

**Step 1: Write failing asset registry expectations**

Update the expected paths for the LCP button, footer frame, footer icons, and above-fold header icons from `.png` to `.webp`.

Add a size-ratio assertion for the optimized runtime UI assets:

```ts
[
  ["/manyang/ui/buttons/dreammemory-write-frame-slim.png", manyangAssets.buttons.dreammemoryWrite, 0.2],
  ["/manyang/ui/footer/footer-frame.png", manyangAssets.footer.frame, 0.2],
].forEach(([sourceAssetPath, optimizedAssetPath, maxRatio]) => {
  expect(statSync(publicAssetPath(optimizedAssetPath as string)).size).toBeLessThan(
    statSync(publicAssetPath(sourceAssetPath as string)).size * (maxRatio as number),
  );
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/lib/manyang-assets.test.ts`

Expected: FAIL until registry paths point to the generated WebP files.

**Step 3: Update registry**

Change:

```ts
buttons.dreammemoryWrite
footer.frame
footer.icons.*
actionIcons.bell
actionIcons.settings
```

to their `.webp` equivalents.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/lib/manyang-assets.test.ts`

Expected: PASS.

### Task 4: Verify Build And Performance-Relevant Markup

**Files:**
- Verify only.

**Step 1: Run focused tests**

Run:

```bash
npm test -- --run src/components/today-home-actions.test.tsx src/lib/manyang-assets.test.ts
```

Expected: PASS.

**Step 2: Run production build**

Run: `npm run build`

Expected: PASS with no Next image or type errors.

**Step 3: Review diff**

Run: `git diff --stat`

Expected: Changes are limited to the plan document, image priority code/tests, asset registry/tests, and generated WebP files.
