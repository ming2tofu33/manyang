# Dream Seed Screen Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a "꿈 씨앗 심기" bedtime screen where users choose a dream intention, optionally leave a short note, and save it locally for tonight.

**Architecture:** Add a `/seed` App Router page backed by a small client component and a localStorage helper. Keep it as a secondary "오늘" flow instead of adding a fifth bottom navigation item, so `/seed` is reached from the Today screen and highlights the existing Today tab. Use the committed reference assets from `ref/dreamseed_background.png` as the visual direction, but keep controls as real DOM for accessibility and state.

**Tech Stack:** Next.js App Router, React client component, Tailwind CSS classes, Vitest, localStorage.

---

### Task 1: Define Dream Seed Storage

**Files:**
- Create: `frontend/src/lib/dream-seed.ts`
- Create: `frontend/src/lib/dream-seed.test.ts`

**Step 1: Write the failing tests**

Add tests for the desired storage behavior:

```ts
import { describe, expect, test } from "vitest";

import {
  createDreamSeedRecord,
  dreamSeedKey,
  getDreamSeed,
  saveDreamSeed,
  type DreamSeedInput,
  type StorageLike,
} from "./dream-seed";

function createMemoryStorage(initialEntries: Record<string, string> = {}): StorageLike {
  const data = new Map(Object.entries(initialEntries));

  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

describe("dream seed storage", () => {
  test("creates a dated dream seed record", () => {
    const input: DreamSeedInput = {
      intentId: "comfort",
      intentLabel: "아무것도 무섭지 않고 편안했으면",
      note: "오늘은 밝은 장면을 보고 싶어.",
      seedDate: "2026-05-24",
    };

    expect(createDreamSeedRecord(input)).toMatchObject(input);
  });

  test("saves and returns the latest dream seed", () => {
    const storage = createMemoryStorage();
    const record = createDreamSeedRecord({
      intentId: "question",
      intentLabel: "지금 내 마음이 궁금해",
      note: "",
      seedDate: "2026-05-24",
    });

    saveDreamSeed(storage, record);

    expect(getDreamSeed(storage)).toEqual(record);
  });

  test("returns null when stored JSON is corrupted", () => {
    const storage = createMemoryStorage({ [dreamSeedKey]: "{not-json" });

    expect(getDreamSeed(storage)).toBeNull();
  });
});
```

**Step 2: Verify the tests fail**

Run:

```powershell
cd frontend
npm test -- dream-seed.test.ts
```

Expected: FAIL because `dream-seed.ts` does not exist yet.

**Step 3: Implement the storage helper**

Create `frontend/src/lib/dream-seed.ts` with:

```ts
export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type DreamSeedInput = {
  intentId: string;
  intentLabel: string;
  note: string;
  seedDate: string;
};

export type DreamSeedRecord = DreamSeedInput & {
  savedAt: string;
};

export const dreamSeedKey = "manyang:dream-seed";

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;

  return window.localStorage;
}

export function createDreamSeedRecord(input: DreamSeedInput): DreamSeedRecord {
  return {
    ...input,
    note: input.note.trim(),
    savedAt: new Date().toISOString(),
  };
}

export function getDreamSeed(storage: StorageLike): DreamSeedRecord | null {
  return parseJson<DreamSeedRecord | null>(storage.getItem(dreamSeedKey), null);
}

export function saveDreamSeed(storage: StorageLike, record: DreamSeedRecord): void {
  storage.setItem(dreamSeedKey, JSON.stringify(record));
}

export function getDreamSeedFromBrowser(): DreamSeedRecord | null {
  const storage = getBrowserStorage();

  return storage ? getDreamSeed(storage) : null;
}

export function saveDreamSeedToBrowser(record: DreamSeedRecord): void {
  const storage = getBrowserStorage();

  if (storage) {
    saveDreamSeed(storage, record);
  }
}
```

**Step 4: Verify the focused tests pass**

Run:

```powershell
cd frontend
npm test -- dream-seed.test.ts
```

Expected: PASS.

**Step 5: Commit**

```powershell
git add frontend/src/lib/dream-seed.ts frontend/src/lib/dream-seed.test.ts
git commit -m "feat(frontend): add dream seed storage"
```

### Task 2: Copy Dream Seed Background Asset

**Files:**
- Create: `frontend/public/manyang/dreamseed-background.png`

**Step 1: Copy the committed reference asset**

Run:

```powershell
Copy-Item -LiteralPath ref/dreamseed_background.png -Destination frontend/public/manyang/dreamseed-background.png
```

**Step 2: Confirm the asset exists**

Run:

```powershell
Test-Path frontend/public/manyang/dreamseed-background.png
```

Expected: `True`.

**Step 3: Commit**

```powershell
git add frontend/public/manyang/dreamseed-background.png
git commit -m "chore(frontend): add dream seed screen asset"
```

### Task 3: Build the Dream Seed Form

**Files:**
- Create: `frontend/src/components/dream-seed-form.tsx`

**Step 1: Create the client component**

Use real form controls and keep the UI close to `ref/beforebedtime.png`:

- Header copy: `꿈 씨앗 심기`
- Helper copy: `오늘 밤 꿈에게 작은 질문을 맡겨보자냥.`
- Six selectable intent buttons:
  - `지금 내 마음이 궁금해`
  - `프로젝트 힌트가 필요해`
  - `누군가를 다시 만나고 싶어`
  - `그냥 이상한 꿈을 보고 싶어`
  - `아무것도 무섭지 않고 편안했으면`
  - `직접 적을래`
- Optional textarea label: `꿈에게 남길 말`
- CTA: `오늘 밤 씨앗 심기`
- Saved state CTA: `씨앗을 심었어요`

Implementation shape:

```tsx
"use client";

import { useEffect, useState } from "react";

import {
  createDreamSeedRecord,
  getDreamSeedFromBrowser,
  saveDreamSeedToBrowser,
  type DreamSeedRecord,
} from "@/lib/dream-seed";
import { cn, ui } from "@/lib/styles";

const intents = [
  { id: "question", label: "지금 내 마음이 궁금해" },
  { id: "project", label: "프로젝트 힌트가 필요해" },
  { id: "meet", label: "누군가를 다시 만나고 싶어" },
  { id: "strange", label: "그냥 이상한 꿈을 보고 싶어" },
  { id: "comfort", label: "아무것도 무섭지 않고 편안했으면" },
  { id: "custom", label: "직접 적을래" },
];

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function DreamSeedForm() {
  const [selectedIntentId, setSelectedIntentId] = useState(intents[0].id);
  const [note, setNote] = useState("");
  const [savedSeed, setSavedSeed] = useState<DreamSeedRecord | null>(null);

  useEffect(() => {
    setSavedSeed(getDreamSeedFromBrowser());
  }, []);

  const selectedIntent = intents.find((intent) => intent.id === selectedIntentId) ?? intents[0];

  function handleSubmit() {
    const record = createDreamSeedRecord({
      intentId: selectedIntent.id,
      intentLabel: selectedIntent.label,
      note,
      seedDate: getTodayDate(),
    });

    saveDreamSeedToBrowser(record);
    setSavedSeed(record);
  }

  return (
    <div className="mt-auto space-y-4 pb-5">
      {/* Build the visual form here using ui.panel, ui.chip, ui.primaryAction, and textarea styles. */}
    </div>
  );
}
```

**Step 2: Style the component**

Use these layout constraints:

- No nested cards.
- Keep the main controls in one full-width panel.
- Use `ui.chip` for selectable intents with a brighter selected state.
- Use `maxLength={100}` on the textarea and show `note.length / 100`.
- Use `ui.primaryAction` for the CTA.
- If `savedSeed` exists for today, show a compact saved summary above the CTA.

**Step 3: Run lint locally**

Run:

```powershell
cd frontend
npm run lint
```

Expected: no lint errors.

### Task 4: Add the `/seed` Page

**Files:**
- Create: `frontend/src/app/seed/page.tsx`

**Step 1: Create the route**

```tsx
import { AppShell } from "@/components/app-shell";
import { DreamSeedForm } from "@/components/dream-seed-form";

export default function SeedPage() {
  return (
    <AppShell
      background="/manyang/dreamseed-background.png"
      backgroundClassName="object-cover opacity-85"
      title="꿈 씨앗 심기"
      subtitle="오늘 밤 꿈에게 작은 질문을 맡겨보자냥"
      backHref="/"
    >
      <DreamSeedForm />
    </AppShell>
  );
}
```

**Step 2: Run the build**

Run:

```powershell
cd frontend
npm run build
```

Expected: `/seed` appears as a static route in the build output.

**Step 3: Commit**

```powershell
git add frontend/src/components/dream-seed-form.tsx frontend/src/app/seed/page.tsx
git commit -m "feat(frontend): add dream seed screen"
```

### Task 5: Connect Entry Points

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/lib/navigation.ts`
- Modify: `frontend/src/lib/navigation.test.ts`

**Step 1: Add a failing navigation test**

In `frontend/src/lib/navigation.test.ts`, add:

```ts
it("treats the dream seed page as part of today", () => {
  expect(getActiveNavItem("/seed")?.key).toBe("today");
});
```

Run:

```powershell
cd frontend
npm test -- navigation.test.ts
```

Expected: FAIL until `/seed` is included in the today matcher.

**Step 2: Update the today matcher**

Modify `frontend/src/lib/navigation.ts`:

```ts
match: (pathname) => pathname === "/" || pathname.startsWith("/morning") || pathname.startsWith("/seed"),
```

Run the focused test again and verify it passes.

**Step 3: Add the Today page CTA**

In `frontend/src/app/page.tsx`, add a compact link below the existing morning CTA:

```tsx
<Link
  href="/seed"
  className="mx-auto flex min-h-12 w-[78%] items-center justify-center rounded-full border border-[#b98255]/75 bg-[rgba(5,4,11,0.62)] px-4 text-center text-base font-semibold text-[#f2c27d] shadow-[0_0_22px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:border-[#ffd08a]/75 focus:outline-none focus:ring-2 focus:ring-[#f7d58b]"
>
  꿈 씨앗 심기
</Link>
```

Keep it visually secondary to `꿈 기록하기` and `아침기분 기록하기`.

**Step 4: Commit**

```powershell
git add frontend/src/app/page.tsx frontend/src/lib/navigation.ts frontend/src/lib/navigation.test.ts
git commit -m "feat(frontend): link dream seed flow"
```

### Task 6: Verification

**Files:**
- Modify if needed: `vault/09-Implementation/plans/ACTIVE_SPRINT.md`

**Step 1: Run automated checks**

Run:

```powershell
cd frontend
npm test
npm run lint
npm run build
```

Expected:

- All Vitest files pass.
- ESLint passes.
- Next build includes `/seed`.

**Step 2: Browser verification**

Use Playwright or the in-app browser at mobile viewport `390x844`.

Verify:

- `/` shows the `꿈 씨앗 심기` entry button.
- Tapping it opens `/seed`.
- `/seed` background renders and text does not overlap the bottom navigation.
- Selecting each intent visibly changes selected state.
- Typing a note updates the counter and stops at 100 chars.
- Tapping `오늘 밤 씨앗 심기` saves `manyang:dream-seed` in localStorage.
- Reloading `/seed` still shows the saved seed summary.
- Bottom nav active state remains Today on `/seed`.
- Console has no errors.

**Step 3: Update sprint notes**

In `vault/09-Implementation/plans/ACTIVE_SPRINT.md`, add a new row:

```md
| SEED-01 | 자기 전 꿈 씨앗 화면 | review | P1 | `/seed` 화면, 저장 루프, 홈 진입점 구현 |
```

Add evidence after verification:

```md
- SEED-01: `/seed` 화면과 localStorage 저장 구현. `frontend`의 `npm test`, `npm run lint`, `npm run build` 통과. 모바일 브라우저에서 홈 진입, 저장, reload persistence 확인.
```

**Step 4: Commit verification notes**

```powershell
git add vault/09-Implementation/plans/ACTIVE_SPRINT.md
git commit -m "docs(sprint): record dream seed screen progress"
```

