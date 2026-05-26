# SEO Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the dream encyclopedia into an indexable SEO acquisition surface that can bring symbol-search users into the dream receipt flow.

**Architecture:** Use the backend encyclopedia seed as the source of truth for indexable symbol pages. Render each symbol page from data, generate stable metadata/canonicals/sitemap entries from the same source, and mark personal app flows as noindex. Keep analytics as lightweight local or future-facing hooks until a real analytics provider is selected.

**Tech Stack:** Next.js App Router, TypeScript, React, `Metadata` API, `MetadataRoute`, backend encyclopedia seed, Vitest.

---

## Execution Checklist

- [x] Document SEO content strategy in `vault/06-Business/SEO-Content-Strategy.md`
- [x] Add SEO metadata helpers
- [x] Convert encyclopedia detail pages from hardcoded content to entry-based rendering
- [x] Add `generateStaticParams` and `generateMetadata`
- [x] Add sitemap and robots
- [x] Add noindex metadata to private/app flow pages
- [x] Add dream receipt CTA from symbol pages
- [x] Update tests, lint, and build

---

### Task 1: SEO Metadata Helpers

**Files:**
- Create: `frontend/src/lib/seo-encyclopedia.ts`
- Create: `frontend/src/lib/seo-encyclopedia.test.ts`

**Step 1: Write failing tests**

Cover:

- `createSymbolSeoTitle(catEntry)` returns `고양이 꿈 해몽 | 마냥 꿈해몽`.
- `createSymbolSeoDescription(catEntry)` contains `직감`, `독립성`, and `꿈 영수증`.
- `createSymbolCanonicalPath(catEntry)` returns `/encyclopedia/cat`.
- `getIndexableEncyclopediaEntries()` excludes entries with missing slug or symbol.

**Step 2: Run RED**

Run:

```powershell
cd frontend
npm test -- seo-encyclopedia.test.ts
```

Expected: FAIL because the module does not exist.

**Step 3: Implement helpers**

Implement:

```ts
import type { EncyclopediaEntry } from "@manyang/backend";
import { encyclopediaEntries } from "@manyang/backend";

export const siteName = "마냥 꿈해몽";
export const defaultSiteUrl = "https://manyang-dream.vercel.app";

export function getSiteUrl(): string;
export function createSymbolSeoTitle(entry: EncyclopediaEntry): string;
export function createSymbolSeoDescription(entry: EncyclopediaEntry): string;
export function createSymbolCanonicalPath(entry: EncyclopediaEntry): string;
export function getIndexableEncyclopediaEntries(entries?: EncyclopediaEntry[]): EncyclopediaEntry[];
```

Description format:

```text
{symbol} 꿈은 {coreMeanings.slice(0, 3).join(", ")}와 연결되어 읽을 수 있어요. 고양이 해몽사가 꿈속 상징을 꿈 영수증으로 정리해드립니다.
```

**Step 4: Run GREEN**

Run:

```powershell
cd frontend
npm test -- seo-encyclopedia.test.ts
```

Expected: PASS.

---

### Task 2: Entry-Based Encyclopedia Detail Page

**Files:**
- Modify: `frontend/src/app/encyclopedia/[slug]/page.tsx`
- Modify: `frontend/src/components/encyclopedia-detail-page-client.tsx`
- Modify: `frontend/src/components/encyclopedia-detail-content.tsx`
- Test: `frontend/src/components/encyclopedia-detail-content.test.tsx`

**Step 1: Write/adjust component tests**

Cover:

- Detail content for `cat` renders `고양이 꿈 해몽`.
- It renders core meanings, positive readings, negative readings, context questions, and related symbols.
- It renders the selected cat reader hint.
- It renders a CTA to `/write?symbol=cat`.

**Step 2: Pass entry into the client shell**

In `page.tsx`:

- Find entry by `slug`.
- `notFound()` if missing.
- Pass `entry` to `EncyclopediaDetailPageClient`.

**Step 3: Remove hardcoded corridor content**

In detail components:

- title: `{entry.symbol} 꿈 해몽`
- subtitle: first 2 core meanings joined with ` · `
- body: `entry.body`
- chips/sections from entry arrays
- CTA link: `/write?symbol=${entry.slug}`

**Step 4: Run tests**

Run:

```powershell
cd frontend
npm test -- encyclopedia-detail-content.test.tsx
```

Expected: PASS.

---

### Task 3: Static Params And Metadata

**Files:**
- Modify: `frontend/src/app/encyclopedia/[slug]/page.tsx`
- Modify: `frontend/src/app/encyclopedia/page.tsx`
- Modify: `frontend/src/app/layout.tsx`

**Step 1: Add root metadata base**

Update root metadata:

- `metadataBase: new URL(getSiteUrl())`
- updated description mentions `꿈 영수증`, not card.

**Step 2: Add encyclopedia hub metadata**

In `/encyclopedia/page.tsx`:

- title: `꿈해몽 백과 | 마냥 꿈해몽`
- description: `고양이 해몽사와 함께 꿈속 상징의 의미를 찾아보고, 내 꿈을 꿈 영수증으로 정리해보세요.`
- alternates canonical: `/encyclopedia`

**Step 3: Add symbol metadata**

In `/encyclopedia/[slug]/page.tsx`:

- `generateStaticParams()` from `getIndexableEncyclopediaEntries()`
- `generateMetadata({ params })`
- title/description from helpers
- canonical from helper
- Open Graph title/description/url/type

**Step 4: Build check**

Run:

```powershell
cd frontend
npm run build
```

Expected: build passes and static params are generated.

---

### Task 4: Sitemap And Robots

**Files:**
- Create: `frontend/src/app/sitemap.ts`
- Create: `frontend/src/app/robots.ts`

**Step 1: Add sitemap**

Include:

- `/`
- `/encyclopedia`
- every indexable `/encyclopedia/[slug]`

Use `getSiteUrl()` for absolute URLs.

**Step 2: Add robots**

Allow the site generally, but disallow app/private flows:

- `/write`
- `/result`
- `/archive`
- `/morning`
- `/seed`
- `/loading`

Add sitemap URL.

**Step 3: Verify routes**

Run dev server and check:

```text
http://127.0.0.1:3000/sitemap.xml
http://127.0.0.1:3000/robots.txt
```

Expected: sitemap lists public SEO pages only, robots references sitemap and disallows private/app flows.

---

### Task 5: Noindex Private App Pages

**Files:**
- Modify: `frontend/src/app/write/page.tsx`
- Modify: `frontend/src/app/result/page.tsx`
- Modify: `frontend/src/app/archive/page.tsx`
- Modify: `frontend/src/app/morning/page.tsx`
- Modify: `frontend/src/app/seed/page.tsx`
- Modify: `frontend/src/app/loading/page.tsx`

**Step 1: Add per-page metadata**

For each app/private route export:

```ts
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
```

**Step 2: Verify build**

Run:

```powershell
cd frontend
npm run build
```

Expected: PASS.

---

### Task 6: Verification

Run:

```powershell
cd frontend
npm test -- seo-encyclopedia.test.ts encyclopedia-content.test.tsx encyclopedia-detail-content.test.tsx
npm run lint
npm run build
```

Expected:

- Focused tests pass.
- Lint passes.
- Build passes.

Manual checks:

- `/encyclopedia/cat` renders 고양이 content, not hardcoded 복도.
- Missing slug returns 404.
- `/sitemap.xml` includes `/encyclopedia/cat`.
- `/robots.txt` disallows private/app flows.
