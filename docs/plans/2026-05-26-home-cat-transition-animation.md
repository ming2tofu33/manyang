# Home Cat Transition Animation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a soft, mystical transition when the selected home cat changes so the background and reader state do not snap instantly.

**Architecture:** Keep the selected cat data flow unchanged. Add a reusable home-only transition layer that preserves the previous background, crossfades to the next background, and overlays a short orb mist effect. Keep animation state inside `TodayHomeScene` or a small child component so non-home pages using `AppShell` stay unaffected.

**Tech Stack:** Next.js, React, Tailwind CSS utilities, CSS keyframes, Vitest, Playwright.

---

### Task 1: Define Transition Copy-Free Motion Rules

**Files:**
- Create: `frontend/src/lib/home-cat-transition-theme.ts`
- Test: `frontend/src/lib/home-cat-transition-theme.test.ts`

**Step 1: Write the failing test**

Test that each `CatReaderId` maps to an accent palette for the transition mist:

```ts
expect(getHomeCatTransitionTheme("white_cat")).toEqual({
  mistClassName: "home-cat-transition-mist-white",
  glowClassName: "home-cat-transition-glow-white",
});
```

Also test black, cheese, and gray variants.

**Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/lib/home-cat-transition-theme.test.ts
```

Expected: fail because the module does not exist.

**Step 3: Implement minimal theme map**

Create `getHomeCatTransitionTheme(readerId)` with four stable class names:

- black: violet/gold
- white: pink/white
- cheese: amber/gold
- gray: silver/violet

**Step 4: Run test to verify it passes**

Run:

```bash
npm test -- src/lib/home-cat-transition-theme.test.ts
```

Expected: pass.

---

### Task 2: Build Home Background Transition Layer

**Files:**
- Create: `frontend/src/components/home-cat-background-transition.tsx`
- Test: `frontend/src/components/home-cat-background-transition.test.tsx`
- Modify later: `frontend/src/components/today-home-scene.tsx`

**Step 1: Write the failing test**

Render the transition component with:

```tsx
<HomeCatBackgroundTransition
  background="/manyang/backgrounds/home-white-cat-ref.png"
  readerId="white_cat"
  backgroundClassName="object-cover"
/>
```

Assert:

- current image src is rendered
- transition wrapper has `aria-hidden="true"`
- no previous image is rendered on first render
- reduced motion fallback class exists in markup or CSS target class names are used

**Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/components/home-cat-background-transition.test.tsx
```

Expected: fail because the component does not exist.

**Step 3: Implement component behavior**

Implement a client component that:

- accepts `background`, `readerId`, `backgroundClassName`
- stores `previousBackground` when `background` changes
- renders previous background above current background for about `720ms`
- renders current background underneath with a soft scale/opacity entrance
- renders one non-interactive mist/glow overlay during transition
- clears previous background after animation ends or timeout

Use only `opacity`, `transform`, and `filter` for animation.

**Step 4: Run test to verify it passes**

Run:

```bash
npm test -- src/components/home-cat-background-transition.test.tsx
```

Expected: pass.

---

### Task 3: Move Home Background Rendering Out Of AppShell For Home Only

**Files:**
- Modify: `frontend/src/components/app-shell.tsx`
- Modify: `frontend/src/components/today-home-scene.tsx`
- Test: `frontend/src/components/app-shell.test.tsx`
- Test: `frontend/src/components/today-home-scene.test.tsx`

**Step 1: Write failing tests**

Add a test that `AppShell` can render without its own background image when `background={null}` or a new `renderBackground={false}` prop is set.

Add a `TodayHomeScene` test that the home scene renders `HomeCatBackgroundTransition`.

**Step 2: Run tests to verify failure**

Run:

```bash
npm test -- src/components/app-shell.test.tsx src/components/today-home-scene.test.tsx
```

Expected: fail because `AppShell` always renders the background image and `TodayHomeScene` does not use the transition component.

**Step 3: Implement minimal integration**

Recommended approach:

- Add optional `backgroundLayer?: ReactNode` to `AppShell`.
- If `backgroundLayer` exists, render it instead of the direct `Image`.
- Keep existing `background` behavior unchanged for all other pages.
- In `TodayHomeScene`, pass:

```tsx
backgroundLayer={
  <HomeCatBackgroundTransition
    background={manyangAssets.backgrounds[selectedReader.homeBackgroundKey]}
    readerId={selectedReader.id}
    backgroundClassName="object-cover opacity-100 brightness-[1.06] contrast-[1.08] saturate-[1.08]"
  />
}
```

**Step 4: Run tests**

Run:

```bash
npm test -- src/components/app-shell.test.tsx src/components/today-home-scene.test.tsx
```

Expected: pass.

---

### Task 4: Add CSS Keyframes And Reduced Motion

**Files:**
- Modify: `frontend/src/app/globals.css`

**Step 1: Write or extend tests**

If CSS text tests already exist, add assertions for:

- `home-cat-transition-current`
- `home-cat-transition-previous`
- `home-cat-transition-mist`
- `@media (prefers-reduced-motion: reduce)`

If no CSS test exists, rely on Playwright visual verification in Task 6.

**Step 2: Implement CSS**

Add keyframes:

- `homeCatCurrentReveal`: opacity `0.24 -> 1`, scale `1.018 -> 1`
- `homeCatPreviousFade`: opacity `1 -> 0`
- `homeCatMistBloom`: opacity `0 -> 0.7 -> 0`, scale `0.72 -> 1.18`, slight blur
- `homeCatCardGlimmer`: short shimmer for selected picker trigger

Use timing:

- background crossfade: `680ms`
- mist bloom: `760ms`
- card glimmer: `420ms`
- easing: `cubic-bezier(0.22, 1, 0.36, 1)`

Add reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  .home-cat-transition-current,
  .home-cat-transition-previous,
  .home-cat-transition-mist {
    animation: none !important;
    transition: none !important;
  }
}
```

---

### Task 5: Add Selection Feedback Before Closing Sheet

**Files:**
- Modify: `frontend/src/components/cat-reader-picker.tsx`
- Test: `frontend/src/components/cat-reader-picker.test.tsx`

**Step 1: Write failing test**

Test that reader buttons expose a selected/transitioning class or data attribute when pressed.

**Step 2: Implement small delayed close**

When a user selects a cat:

- set `pendingReaderId`
- call `onChange(reader.id)` immediately
- keep sheet open for `140ms`
- add a short selected-card glow class
- close sheet after delay

Do not delay the data change too long. The visual feedback should feel immediate.

**Step 3: Run tests**

Run:

```bash
npm test -- src/components/cat-reader-picker.test.tsx
```

Expected: pass.

---

### Task 6: Visual Verification With Playwright

**Files:**
- Output only: `output/playwright/home-cat-transition-*.png`

**Step 1: Start or reuse dev server**

Use existing `http://127.0.0.1:3000` if running.

**Step 2: Capture before/after states**

Create storage states for each cat:

- `black_cat`
- `white_cat`
- `cheese_cat`
- `gray_cat`

Capture:

```bash
npx playwright screenshot --viewport-size=390,844 --load-storage "..\output\playwright\whitecat-storage.json" --wait-for-timeout=1800 "http://127.0.0.1:3000/?fresh=cat-transition-white" "..\output\playwright\home-cat-transition-white.png"
```

**Step 3: Interactive transition check**

Use Playwright MCP:

- open home
- click `오늘의 고양이`
- click a different cat
- verify the old background fades out and mist overlay appears
- verify no horizontal or vertical unintended scroll appears

**Step 4: Reduced motion check**

Use browser emulation or CSS inspection to verify `prefers-reduced-motion` disables the decorative animation.

---

### Final Verification

Run:

```bash
npm test -- src/lib/home-cat-transition-theme.test.ts src/components/home-cat-background-transition.test.tsx src/components/app-shell.test.tsx src/components/today-home-scene.test.tsx src/components/cat-reader-picker.test.tsx
npm run lint
npm run build
```

Expected:

- all targeted tests pass
- lint passes
- production build passes
- Playwright screenshots show smooth home transition without layout shift

