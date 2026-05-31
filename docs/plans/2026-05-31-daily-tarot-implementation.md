# Daily Tarot V1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a standalone one-card daily tarot feature using the 22 major arcana cards, with upright/reversed orientation chosen through the face-down card selection interaction.

**Architecture:** Keep tarot card data, daily draw logic, and UI separate. Card metadata lives in a plain TypeScript module, browser persistence lives in a deterministic localStorage helper, and the `/tarot` page renders a client component that reveals or resumes the current app day's reading. V1 uses local data only; no LLM call and no server persistence.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, localStorage, existing Manyang asset primitives and tarot PNG assets.

---

## Prerequisite: Tarot Assets

Run this plan on a clean feature branch or worktree if possible. The repository may contain unrelated in-progress work; stage and commit only the files listed in each task.

The major arcana transparent PNGs should already exist under:

```txt
frontend/public/manyang/tarot/major/
```

If missing, run:

```bash
npm --prefix frontend run tarot:cutouts
```

The face-down card back should be copied from:

```txt
ref/tarot cards/tarotcard-cutout.png
```

to:

```txt
frontend/public/manyang/tarot/card-back.png
```

Do not reference `ref/` assets from runtime code.

---

### Task 1: Expose Tarot Assets

**Files:**
- Modify: `frontend/src/lib/manyang-assets.ts`
- Modify: `frontend/src/lib/manyang-assets.test.ts`
- Create/copy: `frontend/public/manyang/tarot/card-back.png`

**Step 1: Write the failing test**

Add assertions to `frontend/src/lib/manyang-assets.test.ts`:

```ts
test("exposes tarot card back and major arcana assets", () => {
  expect(manyangAssets.tarot.cardBack).toBe("/manyang/tarot/card-back.png");
  expect(manyangAssets.tarot.major.fool).toBe("/manyang/tarot/major/00-the-fool.png");
  expect(manyangAssets.tarot.major.world).toBe("/manyang/tarot/major/21-the-world.png");

  [
    manyangAssets.tarot.cardBack,
    ...Object.values(manyangAssets.tarot.major),
  ].forEach((assetPath) => {
    expect(publicAssetExists(assetPath)).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm --prefix frontend test -- src/lib/manyang-assets.test.ts
```

Expected: FAIL because `manyangAssets.tarot` does not exist.

**Step 3: Add assets to `manyangAssets`**

Copy the card back asset:

```powershell
Copy-Item -LiteralPath "ref\tarot cards\tarotcard-cutout.png" -Destination "frontend\public\manyang\tarot\card-back.png"
```

Add this object to `frontend/src/lib/manyang-assets.ts`:

```ts
tarot: {
  cardBack: "/manyang/tarot/card-back.png",
  major: {
    fool: "/manyang/tarot/major/00-the-fool.png",
    magician: "/manyang/tarot/major/01-the-magician.png",
    highPriestess: "/manyang/tarot/major/02-the-high-priestess.png",
    empress: "/manyang/tarot/major/03-the-empress.png",
    emperor: "/manyang/tarot/major/04-the-emperor.png",
    hierophant: "/manyang/tarot/major/05-the-hierophant.png",
    lovers: "/manyang/tarot/major/06-the-lovers.png",
    chariot: "/manyang/tarot/major/07-the-chariot.png",
    strength: "/manyang/tarot/major/08-strength.png",
    hermit: "/manyang/tarot/major/09-the-hermit.png",
    wheelOfFortune: "/manyang/tarot/major/10-wheel-of-fortune.png",
    justice: "/manyang/tarot/major/11-justice.png",
    hangedMan: "/manyang/tarot/major/12-the-hanged-man.png",
    death: "/manyang/tarot/major/13-death.png",
    temperance: "/manyang/tarot/major/14-temperance.png",
    devil: "/manyang/tarot/major/15-the-devil.png",
    tower: "/manyang/tarot/major/16-the-tower.png",
    star: "/manyang/tarot/major/17-the-star.png",
    moon: "/manyang/tarot/major/18-the-moon.png",
    sun: "/manyang/tarot/major/19-the-sun.png",
    judgement: "/manyang/tarot/major/20-judgement.png",
    world: "/manyang/tarot/major/21-the-world.png",
  },
},
```

**Step 4: Run test to verify it passes**

Run:

```bash
npm --prefix frontend test -- src/lib/manyang-assets.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/lib/manyang-assets.ts frontend/src/lib/manyang-assets.test.ts frontend/public/manyang/tarot
git commit -m "feat: expose tarot card assets"
```

---

### Task 2: Add Major Arcana Data

**Files:**
- Create: `frontend/src/lib/tarot-major-cards.ts`
- Create: `frontend/src/lib/tarot-major-cards.test.ts`

**Step 1: Write the failing test**

Create `frontend/src/lib/tarot-major-cards.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";

import { tarotMajorCards, getTarotMajorCardById } from "./tarot-major-cards";

function publicAssetExists(assetPath: string): boolean {
  return existsSync(path.join(process.cwd(), "public", assetPath.replace(/^\//, "")));
}

describe("tarot major cards", () => {
  test("defines the 22 major arcana cards in order", () => {
    expect(tarotMajorCards).toHaveLength(22);
    expect(tarotMajorCards.map((card) => card.id)).toEqual([...Array(22).keys()]);
    expect(tarotMajorCards[0]).toMatchObject({ slug: "the-fool", nameKo: "바보", nameEn: "THE FOOL" });
    expect(tarotMajorCards[21]).toMatchObject({ slug: "the-world", nameKo: "세계", nameEn: "THE WORLD" });
  });

  test("every card has usable text for upright and reversed readings", () => {
    tarotMajorCards.forEach((card) => {
      expect(card.keywords.length).toBeGreaterThanOrEqual(3);
      expect(card.visualSymbols.length).toBeGreaterThanOrEqual(2);
      expect(card.upright.summary.length).toBeGreaterThan(8);
      expect(card.upright.dailyFlow.length).toBeGreaterThan(12);
      expect(card.upright.advice.length).toBeGreaterThan(6);
      expect(card.reversed.summary.length).toBeGreaterThan(8);
      expect(card.reversed.dailyFlow.length).toBeGreaterThan(12);
      expect(card.reversed.advice.length).toBeGreaterThan(6);
    });
  });

  test("every card image exists in public assets", () => {
    tarotMajorCards.forEach((card) => {
      expect(publicAssetExists(card.image)).toBe(true);
    });
  });

  test("finds cards by id", () => {
    expect(getTarotMajorCardById(18)?.nameKo).toBe("달");
    expect(getTarotMajorCardById(999)).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm --prefix frontend test -- src/lib/tarot-major-cards.test.ts
```

Expected: FAIL because `tarot-major-cards.ts` does not exist.

**Step 3: Implement the data module**

Create `frontend/src/lib/tarot-major-cards.ts` with:

```ts
import { manyangAssets } from "./manyang-assets";

export type TarotMajorCard = {
  id: number;
  roman: string;
  slug: string;
  nameEn: string;
  nameKo: string;
  image: string;
  keywords: string[];
  visualSymbols: string[];
  mood: string;
  upright: {
    summary: string;
    dailyFlow: string;
    advice: string;
  };
  reversed: {
    summary: string;
    dailyFlow: string;
    advice: string;
  };
  contexts: {
    love: string;
    career: string;
    money: string;
    general: string;
  };
};
```

Add all 22 cards using `ref/tarot cards/major_arcana_tarot_reading_guide_ko.md` as source. Keep the entries concise for app display. For example:

```ts
export const tarotMajorCards = [
  {
    id: 0,
    roman: "0",
    slug: "the-fool",
    nameEn: "THE FOOL",
    nameKo: "바보",
    image: manyangAssets.tarot.major.fool,
    keywords: ["시작", "가능성", "모험", "순수함", "미지의 길"],
    visualSymbols: ["절벽", "흰 꽃", "작은 개", "보따리"],
    mood: "밝고 자유로운 출발이 아직 무겁게 정해지지 않은 분위기",
    upright: {
      summary: "새로운 시작과 열린 가능성이 자연스럽게 움직이는 상태입니다.",
      dailyFlow: "오늘은 모든 답을 알고 움직이기보다, 첫걸음을 내딛으며 감각을 확인하기 좋은 흐름입니다.",
      advice: "시작하되 발밑도 확인하세요.",
    },
    reversed: {
      summary: "준비 부족, 충동, 책임 회피가 드러나기 쉬운 상태입니다.",
      dailyFlow: "오늘은 마음이 앞서면서 세부 확인을 놓치기 쉬우니, 즉흥적인 선택 전에 한 번 멈춰야 합니다.",
      advice: "설레는 선택일수록 최소한의 안전선을 확인하세요.",
    },
    contexts: {
      love: "새로운 만남이나 아직 정의되지 않은 관계의 가능성",
      career: "새 프로젝트, 첫 시도, 경험을 통해 배우는 단계",
      money: "충동 지출을 조심하고 작게 실험할 때",
      general: "미지의 길 앞에서 가능성과 주의가 함께 필요한 하루",
    },
  },
  // Add cards 1-21 in the same shape.
] as const satisfies TarotMajorCard[];

export function getTarotMajorCardById(id: number): TarotMajorCard | null {
  return tarotMajorCards.find((card) => card.id === id) ?? null;
}
```

Do not leave placeholder comments in the final file. The final implementation must include all 22 cards.

**Step 4: Run test to verify it passes**

Run:

```bash
npm --prefix frontend test -- src/lib/tarot-major-cards.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/lib/tarot-major-cards.ts frontend/src/lib/tarot-major-cards.test.ts
git commit -m "feat: add major arcana tarot data"
```

---

### Task 3: Add Daily Tarot Draw And Storage Logic

**Files:**
- Create: `frontend/src/lib/daily-tarot.ts`
- Create: `frontend/src/lib/daily-tarot.test.ts`

**Step 1: Write the failing test**

Create `frontend/src/lib/daily-tarot.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import {
  createDailyTarotOptions,
  createDailyTarotReading,
  dailyTarotChangedEvent,
  dailyTarotStorageKey,
  getDailyTarotReading,
  saveDailyTarotReading,
  type StorageLike,
} from "./daily-tarot";

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike {
  const state = new Map(Object.entries(initial));

  return {
    getItem: (key) => state.get(key) ?? null,
    setItem: (key, value) => state.set(key, value),
    removeItem: (key) => state.delete(key),
  };
}

describe("daily tarot", () => {
  test("creates face-down options with hidden cards and visible orientation", () => {
    const options = createDailyTarotOptions("2026-05-31", 6);

    expect(options).toHaveLength(6);
    expect(options.some((option) => option.orientation === "upright")).toBe(true);
    expect(options.some((option) => option.orientation === "reversed")).toBe(true);
    expect(new Set(options.map((option) => option.cardId)).size).toBe(6);
  });

  test("creates an orientation-specific reading from a selected option", () => {
    const option = { id: "option-1", cardId: 18, orientation: "reversed" as const };
    const reading = createDailyTarotReading({
      appDate: "2026-05-31",
      selectedAt: "2026-05-31T10:00:00.000Z",
      option,
    });

    expect(reading.id).toBe("daily-tarot-2026-05-31");
    expect(reading.card.nameKo).toBe("달");
    expect(reading.orientation).toBe("reversed");
    expect(reading.message).toBe(reading.card.reversed.dailyFlow);
    expect(reading.advice).toBe(reading.card.reversed.advice);
  });

  test("saves and returns the same reading for the same app date", () => {
    const storage = createMemoryStorage();
    const reading = createDailyTarotReading({
      appDate: "2026-05-31",
      selectedAt: "2026-05-31T10:00:00.000Z",
      option: { id: "option-1", cardId: 0, orientation: "upright" },
    });

    saveDailyTarotReading(storage, reading);

    expect(getDailyTarotReading(storage, "2026-05-31")).toEqual(reading);
    expect(getDailyTarotReading(storage, "2026-06-01")).toBeNull();
  });

  test("ignores malformed storage", () => {
    const storage = createMemoryStorage({ [dailyTarotStorageKey]: "{bad-json" });

    expect(getDailyTarotReading(storage, "2026-05-31")).toBeNull();
  });

  test("exposes storage constants", () => {
    expect(dailyTarotStorageKey).toBe("manyang:daily-tarot-readings");
    expect(dailyTarotChangedEvent).toBe("manyang:daily-tarot-changed");
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm --prefix frontend test -- src/lib/daily-tarot.test.ts
```

Expected: FAIL because `daily-tarot.ts` does not exist.

**Step 3: Implement minimal logic**

Create `frontend/src/lib/daily-tarot.ts`. Use a deterministic seeded shuffle based on `appDate` so the option set is stable during the day until selection.

Required exports:

```ts
export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type TarotOrientation = "upright" | "reversed";

export type DailyTarotOption = {
  id: string;
  cardId: number;
  orientation: TarotOrientation;
};

export type DailyTarotReading = {
  id: string;
  spread: "daily_one_card";
  appDate: string;
  selectedAt: string;
  card: TarotMajorCard;
  orientation: TarotOrientation;
  position: "today";
  keywords: string[];
  title: string;
  message: string;
  advice: string;
};
```

Implementation rules:

- `createDailyTarotOptions(appDate, count = 6)` returns unique card ids.
- Options alternate enough to include at least one upright and one reversed when count is greater than 1.
- `createDailyTarotReading` maps orientation to the correct `upright` or `reversed` text.
- `saveDailyTarotReading` stores newest first and replaces the same `appDate`.
- `getDailyTarotReading` returns the matching app date or `null`.
- Add browser helpers after the pure functions:
  - `getDailyTarotReadingFromBrowser(appDate)`
  - `saveDailyTarotReadingToBrowser(reading)`
  - `subscribeToDailyTarot(onStoreChange)`
  - `getEmptyDailyTarotReadingSnapshot()`

**Step 4: Run test to verify it passes**

Run:

```bash
npm --prefix frontend test -- src/lib/daily-tarot.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/lib/daily-tarot.ts frontend/src/lib/daily-tarot.test.ts
git commit -m "feat: add daily tarot draw logic"
```

---

### Task 4: Build The Daily Tarot Client Component

**Files:**
- Create: `frontend/src/components/daily-tarot-client.tsx`
- Create: `frontend/src/components/daily-tarot-client.test.tsx`

**Step 1: Write the failing test**

Create `frontend/src/components/daily-tarot-client.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { DailyTarotClient } from "./daily-tarot-client";

describe("DailyTarotClient", () => {
  test("renders hidden tarot card options before selection", () => {
    const markup = renderToStaticMarkup(<DailyTarotClient appDate="2026-05-31" initialReading={null} />);

    expect(markup).toContain("data-daily-tarot-state=\"draw-ready\"");
    expect(markup).toContain("오늘의 타로");
    expect(markup).toContain("aria-label=\"정방향 카드 선택지");
    expect(markup).toContain("aria-label=\"역방향 카드 선택지");
  });

  test("renders an existing daily reading without showing draw buttons", () => {
    const markup = renderToStaticMarkup(
      <DailyTarotClient
        appDate="2026-05-31"
        initialReading={{
          id: "daily-tarot-2026-05-31",
          spread: "daily_one_card",
          appDate: "2026-05-31",
          selectedAt: "2026-05-31T10:00:00.000Z",
          card: {
            id: 0,
            roman: "0",
            slug: "the-fool",
            nameEn: "THE FOOL",
            nameKo: "바보",
            image: "/manyang/tarot/major/00-the-fool.png",
            keywords: ["시작", "가능성", "모험"],
            visualSymbols: ["절벽", "흰 꽃"],
            mood: "밝은 시작",
            upright: { summary: "새 시작", dailyFlow: "오늘은 시작의 흐름입니다.", advice: "발밑을 확인하세요." },
            reversed: { summary: "준비 부족", dailyFlow: "오늘은 서두르지 않는 흐름입니다.", advice: "한 번 멈추세요." },
            contexts: { love: "", career: "", money: "", general: "" },
          },
          orientation: "upright",
          position: "today",
          keywords: ["시작", "가능성", "모험"],
          title: "바보 정방향",
          message: "오늘은 시작의 흐름입니다.",
          advice: "발밑을 확인하세요.",
        }}
      />,
    );

    expect(markup).toContain("data-daily-tarot-state=\"result\"");
    expect(markup).toContain("바보");
    expect(markup).toContain("정방향");
    expect(markup).not.toContain("data-daily-tarot-option");
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm --prefix frontend test -- src/components/daily-tarot-client.test.tsx
```

Expected: FAIL because the component does not exist.

**Step 3: Implement the component**

Create `frontend/src/components/daily-tarot-client.tsx`.

Implementation requirements:

- Mark as `"use client"`.
- Props:
  ```ts
  type DailyTarotClientProps = {
    appDate: string;
    initialReading: DailyTarotReading | null;
  };
  ```
- Use `createDailyTarotOptions(appDate, 6)` for the draw choices.
- Use `useSyncExternalStore` with `subscribeToDailyTarot`.
- On click, call `createDailyTarotReading`, save with `saveDailyTarotReadingToBrowser`, then render result.
- Render card backs using `manyangAssets.tarot.cardBack`.
- Rotate reversed face-down cards with a CSS class or inline `transform: rotate(180deg)`.
- Keep button labels generic:
  - `정방향 카드 선택지 1`
  - `역방향 카드 선택지 2`
- Do not reveal hidden card names before click.
- Render result image with `next/image`.
- Include the safety sentence:
  ```txt
  타로는 오늘의 흐름을 상징적으로 비춰보는 참고용 안내입니다.
  ```

**Step 4: Run test to verify it passes**

Run:

```bash
npm --prefix frontend test -- src/components/daily-tarot-client.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/components/daily-tarot-client.tsx frontend/src/components/daily-tarot-client.test.tsx
git commit -m "feat: build daily tarot draw component"
```

---

### Task 5: Add The `/tarot` Page

**Files:**
- Create: `frontend/src/app/tarot/page.tsx`
- Create: `frontend/src/app/tarot/page.test.tsx`

**Step 1: Write the failing test**

Create `frontend/src/app/tarot/page.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import TarotPage from "./page";

describe("tarot page", () => {
  test("renders the daily tarot surface", () => {
    const markup = renderToStaticMarkup(<TarotPage />);

    expect(markup).toContain("오늘의 타로");
    expect(markup).toContain("data-daily-tarot-page");
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm --prefix frontend test -- src/app/tarot/page.test.tsx
```

Expected: FAIL because the route does not exist.

**Step 3: Implement the page**

Create `frontend/src/app/tarot/page.tsx`:

```tsx
import { AppShell } from "@/components/app-shell";
import { DailyTarotClient } from "@/components/daily-tarot-client";
import { manyangAssets } from "@/lib/manyang-assets";
import { getPawprintAppDate } from "@/lib/pawprints";

export default function TarotPage() {
  const appDate = getPawprintAppDate();

  return (
    <AppShell
      background={manyangAssets.backgrounds.default}
      title="오늘의 타로"
      subtitle="카드의 방향까지 직접 골라 오늘의 흐름을 확인해요."
      titleIconSrc={manyangAssets.semanticIcons.crystalBall}
      backHref="/"
      rightAction="none"
      showBottomNav={false}
    >
      <section data-daily-tarot-page className="flex min-h-full flex-col px-1 pb-4 pt-1 text-[#fff3d7]">
        <DailyTarotClient appDate={appDate} initialReading={null} />
      </section>
    </AppShell>
  );
}
```

This follows the existing page pattern used by `frontend/src/app/morning/page.tsx` and `frontend/src/app/write/page.tsx`.

**Step 4: Run test to verify it passes**

Run:

```bash
npm --prefix frontend test -- src/app/tarot/page.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/app/tarot/page.tsx frontend/src/app/tarot/page.test.tsx
git commit -m "feat: add daily tarot route"
```

---

### Task 6: Link Tarot From Today Home

**Files:**
- Modify: `frontend/src/components/today-home-actions.tsx`
- Modify: `frontend/src/components/today-home-actions.test.tsx`

**Step 1: Write the failing test**

Add a test to `frontend/src/components/today-home-actions.test.tsx`:

```tsx
test("links to the daily tarot ritual from the today actions", () => {
  const markup = renderToStaticMarkup(<TodayHomeActions />);

  expect(markup).toContain("href=\"/tarot\"");
  expect(markup).toContain("오늘의 타로");
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm --prefix frontend test -- src/components/today-home-actions.test.tsx
```

Expected: FAIL because no tarot link exists.

**Step 3: Add the link**

Add a compact action using existing button/frame assets. Prefer reusing `manyangAssets.buttons.mediumSecondary` or another existing frame rather than creating a new visual asset.

The link should not replace the primary dream action. Add it as a secondary/tertiary ritual entry in the existing action group:

```tsx
<AssetImageTextButton
  href="/tarot"
  frame={manyangAssets.buttons.mediumSecondary}
  width={850}
  height={150}
  sizes="240px"
  className="mx-auto -my-1 block w-[57%] max-w-[240px] px-2 py-1"
  imageClassName="manyang-button-glow-soft"
  contentClassName="text-[0.93rem]"
>
  오늘의 타로
</AssetImageTextButton>
```

Check mobile spacing after adding a fourth action. If the home action stack becomes too tall, make tarot the tertiary action only in the morning or move it near the existing archive/seed button.

**Step 4: Run test to verify it passes**

Run:

```bash
npm --prefix frontend test -- src/components/today-home-actions.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/components/today-home-actions.tsx frontend/src/components/today-home-actions.test.tsx
git commit -m "feat: link daily tarot from home"
```

---

### Task 7: Final Verification

**Files:**
- No new files unless visual polish requires targeted CSS in `frontend/src/app/globals.css`.

**Step 1: Run focused tests**

Run:

```bash
npm --prefix frontend test -- src/lib/manyang-assets.test.ts src/lib/tarot-major-cards.test.ts src/lib/daily-tarot.test.ts src/components/daily-tarot-client.test.tsx src/app/tarot/page.test.tsx src/components/today-home-actions.test.tsx
```

Expected: PASS.

**Step 2: Run lint**

Run:

```bash
npm --prefix frontend run lint
```

Expected: PASS or only pre-existing unrelated warnings. Fix any warnings introduced by this work.

**Step 3: Start dev server**

Run:

```bash
npm --prefix frontend run dev
```

Open:

```txt
http://localhost:3000/tarot
```

**Step 4: Manual browser checks**

Verify:

- card backs render
- reversed choices are visibly rotated
- clicking a card reveals one major arcana card
- same-day reload shows the saved result
- result card image has transparent corners over the page background
- text does not overlap on mobile width
- hidden card buttons do not reveal card names to assistive labels

**Step 5: Final commit if polish was needed**

```bash
git add frontend/src/app/globals.css
git commit -m "style: polish daily tarot layout"
```

Skip this commit if no polish changes were needed.
