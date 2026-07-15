# Shared Tarot Contract and Content Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract the public tarot contract, 78-card source data, question prompts, and platform-neutral image keys into shared workspace packages without changing current web behavior, API payloads, or stored readings.

**Architecture:** `@manyang/contracts` owns runtime value sets and public tarot types. A new `@manyang/content` package owns platform-neutral card and question data, while small web adapters attach the existing public image URLs and preserve current module APIs. Backend runtime services depend on contracts; the backend-only tarot evaluation script may use content as a development dependency instead of importing frontend code.

**Tech Stack:** npm workspaces, TypeScript, Vitest, Next.js 16, React 19, Node.js 24

---

## Scope and constraints

- Follow `@test-driven-development` for each behavioral or boundary change.
- Use `@systematic-debugging` for unexpected test, typecheck, or build failures.
- Preserve all current tarot routes, payload field names, optional fields, `localStorage` keys, IDs, `cardKey` values, image URLs, and stored-reading compatibility.
- Keep browser storage, browser events, draw algorithms, access rules, and UI components in `frontend/`.
- Do not create `mobile/`, relationship logic, moon-piece logic, payment code, CMS code, or new card copy.
- Shared packages must not import frontend, backend, Next.js, React, DOM, or browser storage.
- Keep the 22 major and 56 minor card texts byte-for-byte equivalent during the move.
- Commit after every task with the messages specified below.

## Baseline already verified

The isolated worktree was created at:

```text
C:\Users\amy\Desktop\manyang\.worktrees\shared-tarot-contract-content
```

Baseline `npm run verify` passed on 2026-07-15:

- contracts: 2 tests passed
- backend: 299 passed, 2 skipped
- frontend: 630 passed
- all typechecks, frontend lint, and production build passed

Ignored local reference assets were copied only to the worktree for existing asset tests and must never be staged.

## Target package structure

```text
packages/
├─ contracts/
│  └─ src/
│     ├─ dream.ts
│     ├─ tarot.ts
│     └─ index.ts
└─ content/
   ├─ package.json
   ├─ tsconfig.json
   └─ src/
      ├─ index.ts
      └─ tarot/
         ├─ cards.ts
         ├─ major.ts
         ├─ minor.ts
         ├─ questions.ts
         └─ index.ts
```

## Task 1: Add the public tarot contract

**Files:**

- Create: `packages/contracts/src/tarot.ts`
- Create: `packages/contracts/src/tarot.test.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `packages/contracts/package.json`

### Step 1: Write the failing contract test

Create `packages/contracts/src/tarot.test.ts`:

```ts
import { describe, expect, expectTypeOf, test } from "vitest";

import {
  TAROT_ARCANAS,
  TAROT_ORIENTATIONS,
  TAROT_POSITIONS,
  TAROT_SPREADS,
  TAROT_UNLOCK_METHODS,
  type TarotCard,
  type DailyTarotReading,
  type TarotCardContent,
  type TarotMajorCardContent,
  type TarotReadingRequest,
} from "./tarot";

describe("tarot transport contract", () => {
  test("exposes the current accepted runtime values once", () => {
    expect(TAROT_SPREADS).toEqual(["daily_one_card", "question_one_card", "daily_three_card"]);
    expect(TAROT_ORIENTATIONS).toEqual(["upright", "reversed"]);
    expect(TAROT_POSITIONS).toEqual(["today", "situation", "flow", "advice"]);
    expect(TAROT_UNLOCK_METHODS).toEqual(["daily_free", "rewarded_ad", "moon_pass", "admin"]);
    expect(TAROT_ARCANAS).toEqual(["major", "minor"]);

    for (const values of [
      TAROT_SPREADS,
      TAROT_ORIENTATIONS,
      TAROT_POSITIONS,
      TAROT_UNLOCK_METHODS,
      TAROT_ARCANAS,
    ]) {
      expect(new Set(values).size).toBe(values.length);
    }
  });

  test("exports platform-neutral card and reading shapes", () => {
    expectTypeOf<TarotCardContent>().toBeObject();
    expectTypeOf<TarotReadingRequest>().toBeObject();
    expectTypeOf<DailyTarotReading>().toBeObject();
  });

  test("accepts legacy stored major snapshots without additive shared keys", () => {
    type LegacyStoredMajorCard = Omit<
      TarotMajorCardContent,
      "arcana" | "cardKey" | "imageKey"
    > & {
      arcana?: "major";
      cardKey?: string;
      imageKey?: string;
      image: string;
    };

    expectTypeOf<LegacyStoredMajorCard>().toMatchTypeOf<TarotCard>();
  });
});
```

### Step 2: Run the focused test and confirm RED

Run:

```powershell
npm run test --workspace @manyang/contracts -- src/tarot.test.ts
```

Expected: FAIL because `./tarot` does not exist.

### Step 3: Add the minimal shared contract

Create `packages/contracts/src/tarot.ts` with the existing values and shapes:

```ts
export const TAROT_SPREADS = ["daily_one_card", "question_one_card", "daily_three_card"] as const;
export type TarotSpread = (typeof TAROT_SPREADS)[number];

export const TAROT_ORIENTATIONS = ["upright", "reversed"] as const;
export type TarotOrientation = (typeof TAROT_ORIENTATIONS)[number];

export const TAROT_POSITIONS = ["today", "situation", "flow", "advice"] as const;
export type DailyTarotPosition = (typeof TAROT_POSITIONS)[number];

export const TAROT_UNLOCK_METHODS = ["daily_free", "rewarded_ad", "moon_pass", "admin"] as const;
export type TarotUnlockMethod = (typeof TAROT_UNLOCK_METHODS)[number];

export const TAROT_ARCANAS = ["major", "minor"] as const;
export type TarotArcana = (typeof TAROT_ARCANAS)[number];

export const TAROT_MINOR_SUITS = ["wands", "cups", "swords", "pentacles"] as const;
export type TarotMinorSuit = (typeof TAROT_MINOR_SUITS)[number];

export const TAROT_MINOR_RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as const;
export type TarotMinorRank = (typeof TAROT_MINOR_RANKS)[number];

export type TarotCardSymbolMeaning = {
  symbol: string;
  meaning: string;
};

export type TarotCardMeaning = {
  summary: string;
  dailyFlow: string;
  cardMessage: string;
  readingScene: string;
};

export type TarotCardContexts = {
  love: string;
  career: string;
  money: string;
  general: string;
};

type TarotCardContentBase = {
  id: number;
  cardKey: string;
  imageKey: string;
  slug: string;
  nameEn: string;
  nameKo: string;
  keywords: readonly string[];
  visualSymbols: readonly string[];
  symbolMeanings: readonly TarotCardSymbolMeaning[];
  mood: string;
  upright: TarotCardMeaning;
  reversed: TarotCardMeaning;
  contexts: TarotCardContexts;
};

export type TarotMajorCardContent = TarotCardContentBase & {
  arcana: "major";
  roman: string;
};

export type TarotMinorCardContent = TarotCardContentBase & {
  arcana: "minor";
  suit: TarotMinorSuit;
  rank: TarotMinorRank;
};

export type TarotCardContent = TarotMajorCardContent | TarotMinorCardContent;

// Stored readings are snapshots. Additive shared-content fields stay optional
// here so readings created before this extraction remain readable.
export type TarotMajorCardSnapshot = Omit<
  TarotMajorCardContent,
  "arcana" | "cardKey" | "imageKey"
> & {
  arcana?: "major";
  cardKey?: string;
  imageKey?: string;
  image: string;
};

export type TarotMinorCardSnapshot = Omit<TarotMinorCardContent, "imageKey"> & {
  imageKey?: string;
  image: string;
};

export type TarotCard = TarotMajorCardSnapshot | TarotMinorCardSnapshot;

export type TarotQuestionStateKey =
  | "mind_complex"
  | "relationship_concern"
  | "work_blocked"
  | "reality_anxiety"
  | "decision_point"
  | "daily_signal";

export type TarotQuestionPrompt = {
  key: string;
  text: string;
};

export type TarotQuestionState = {
  key: TarotQuestionStateKey;
  label: string;
  representativeQuestion: string;
  questions: readonly TarotQuestionPrompt[];
};

export type DailyTarotOption = {
  id: string;
  cardId: number;
  orientation: TarotOrientation;
};

export type DailyTarotCardSelection = {
  position: DailyTarotPosition;
  card: TarotCard;
  orientation: TarotOrientation;
};

export type DailyTarotGeneratedCardReading = {
  position: DailyTarotPosition;
  heading: string;
  reading: string;
};

export type DailyTarotGeneratedReading = {
  title: string;
  overview: string;
  keywords?: string[];
  cardReadings: DailyTarotGeneratedCardReading[];
  advice: string;
};

export type DailyTarotQuestionContext = {
  stateKey: string;
  stateLabel: string;
  questionKey: string;
  questionText: string;
};

export type DailyTarotReading = {
  id: string;
  spread: TarotSpread;
  source?: "local" | "llm";
  drawIdentityKey?: string;
  appDate: string;
  selectedAt: string;
  card: TarotCard;
  orientation: TarotOrientation;
  position: DailyTarotPosition;
  cards?: DailyTarotCardSelection[];
  generated?: DailyTarotGeneratedReading;
  keywords: string[];
  title: string;
  message: string;
  advice: string;
  questionContext?: DailyTarotQuestionContext;
  unlockMethod?: TarotUnlockMethod;
};

export type TarotReadingSelectionRequest = {
  cardId: number;
  orientation: TarotOrientation;
  position: DailyTarotPosition;
};

export type TarotReadingRequest = {
  appDate: string;
  spread: TarotSpread;
  selectedAt: string;
  selections: TarotReadingSelectionRequest[];
  questionContext?: DailyTarotQuestionContext;
  unlockMethod?: TarotUnlockMethod;
};

export type TarotReadingSpread = TarotSpread;
export type TarotReadingPosition = DailyTarotPosition;
export type TarotReadingOrientation = TarotOrientation;
export type TarotPromptCardMeaning = TarotCardMeaning;
```

Do not add AI provider errors or provider options to this package; they remain backend service types.

### Step 4: Publish the new entry point

In `packages/contracts/package.json`, add:

```json
"./tarot": "./src/tarot.ts"
```

In `packages/contracts/src/index.ts`, re-export all tarot runtime constants and public types from `./tarot`. Keep all dream exports unchanged.

### Step 5: Verify GREEN

Run:

```powershell
npm run test --workspace @manyang/contracts -- src/tarot.test.ts
npm run typecheck --workspace @manyang/contracts
git diff --check
```

Expected: PASS.

### Step 6: Commit

```powershell
git add packages/contracts/package.json packages/contracts/src/index.ts packages/contracts/src/tarot.ts packages/contracts/src/tarot.test.ts
git commit -m "feat(contracts): add shared tarot contract"
```

## Task 2: Create the content package and move question content

**Files:**

- Create: `packages/content/package.json`
- Create: `packages/content/tsconfig.json`
- Create: `packages/content/src/index.ts`
- Create: `packages/content/src/tarot/index.ts`
- Create: `packages/content/src/tarot/questions.ts`
- Create: `packages/content/src/tarot/questions.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `frontend/package.json`
- Modify: `frontend/src/lib/tarot-question-prompts.ts`
- Test: `frontend/src/lib/tarot-question-prompts.test.ts`

### Step 1: Write the failing shared question test

Create `packages/content/src/tarot/questions.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import {
  getTarotQuestionByKey,
  getTarotQuestionStateByKey,
  tarotQuestionStates,
} from "./questions";

describe("shared tarot question content", () => {
  test("defines six unique states with five unique questions each", () => {
    expect(tarotQuestionStates).toHaveLength(6);
    expect(new Set(tarotQuestionStates.map((state) => state.key)).size).toBe(6);

    for (const state of tarotQuestionStates) {
      expect(state.questions).toHaveLength(5);
      expect(new Set(state.questions.map((question) => question.key)).size).toBe(5);
    }
  });

  test("looks up the current stable state and question keys", () => {
    expect(getTarotQuestionStateByKey("mind_complex")?.key).toBe("mind_complex");
    expect(getTarotQuestionByKey("mind_complex", "held_feeling")?.key).toBe("held_feeling");
    expect(getTarotQuestionByKey("mind_complex", "missing")).toBeNull();
  });
});
```

### Step 2: Add the package skeleton without `questions.ts`

Create `packages/content/package.json`:

```json
{
  "name": "@manyang/content",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./tarot": "./src/tarot/index.ts",
    "./tarot/questions": "./src/tarot/questions.ts"
  },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@manyang/contracts": "0.1.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "vitest": "^4.1.7"
  }
}
```

Create `packages/content/tsconfig.json` using the contracts package settings:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*.ts"]
}
```

Add empty export shells in `packages/content/src/index.ts` and `packages/content/src/tarot/index.ts` only after the RED run, so module resolution fails for the intended missing implementation.

### Step 3: Add content to root verification and install

Change root scripts to:

```json
"test": "npm run test --workspace @manyang/contracts && npm run test --workspace @manyang/content && npm run test --workspace @manyang/backend && npm run test --workspace frontend",
"typecheck": "npm run typecheck --workspace @manyang/contracts && npm run typecheck --workspace @manyang/content && npm run typecheck --workspace @manyang/backend && npm run typecheck --workspace frontend"
```

Add to `frontend/package.json` dependencies:

```json
"@manyang/content": "0.1.0"
```

Run:

```powershell
npm install
npm run test --workspace @manyang/content -- src/tarot/questions.test.ts
```

Expected: FAIL because `./questions` does not exist.

### Step 4: Move the static question content

Create `packages/content/src/tarot/questions.ts` by moving these items verbatim from `frontend/src/lib/tarot-question-prompts.ts`:

- `tarotQuestionStates`
- `getTarotQuestionStateByKey`
- `getTarotQuestionByKey`

Import the types from `@manyang/contracts/tarot`:

```ts
import type {
  TarotQuestionPrompt,
  TarotQuestionState,
  TarotQuestionStateKey,
} from "@manyang/contracts/tarot";
```

Keep the six labels, representative questions, thirty question keys, and thirty question strings exactly unchanged.

Export from both package indexes:

```ts
export {
  getTarotQuestionByKey,
  getTarotQuestionStateByKey,
  tarotQuestionStates,
} from "./questions";

export type {
  TarotQuestionPrompt,
  TarotQuestionState,
  TarotQuestionStateKey,
} from "@manyang/contracts/tarot";
```

### Step 5: Convert the web file to a compatibility wrapper

In `frontend/src/lib/tarot-question-prompts.ts`:

- import and re-export the shared state data and lookup helpers
- import and re-export the three shared question types
- keep `maxCustomTarotQuestionLength`, stable hashing, whitespace normalization, and `createCustomTarotQuestionPrompt` in this web file with unchanged behavior
- remove the duplicated six-state array and duplicated shared lookup implementations

The public imports used by `question-tarot-client.tsx` must remain valid.

### Step 6: Verify question compatibility

Run:

```powershell
npm run test --workspace @manyang/content -- src/tarot/questions.test.ts
npm run typecheck --workspace @manyang/content
npm run test --workspace frontend -- src/lib/tarot-question-prompts.test.ts src/components/question-tarot-client.test.tsx
npm run typecheck --workspace frontend
git diff --check
```

Expected: PASS with the existing question copy and custom-question behavior unchanged.

### Step 7: Commit

```powershell
git add package.json package-lock.json frontend/package.json frontend/src/lib/tarot-question-prompts.ts packages/content
git commit -m "feat(content): add shared tarot questions"
```

## Task 3: Move major arcana content and add the web image adapter

**Files:**

- Create: `packages/content/src/tarot/major.ts`
- Create: `packages/content/src/tarot/major.test.ts`
- Modify: `packages/content/package.json`
- Modify: `packages/content/src/tarot/index.ts`
- Create: `frontend/src/lib/tarot-web-assets.ts`
- Create: `frontend/src/lib/tarot-web-assets.test.ts`
- Modify: `frontend/src/lib/tarot-major-cards.ts`
- Test: `frontend/src/lib/tarot-major-cards.test.ts`

### Step 1: Write the failing major content test

Create `packages/content/src/tarot/major.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import { getTarotMajorCardContentById, tarotMajorCardContent } from "./major";

describe("shared major arcana content", () => {
  test("defines 22 ordered major arcana cards with stable platform-neutral keys", () => {
    expect(tarotMajorCardContent).toHaveLength(22);
    expect(tarotMajorCardContent.map((card) => card.id)).toEqual(
      Array.from({ length: 22 }, (_, id) => id),
    );
    expect(new Set(tarotMajorCardContent.map((card) => card.cardKey)).size).toBe(22);
    expect(new Set(tarotMajorCardContent.map((card) => card.imageKey)).size).toBe(22);

    for (const card of tarotMajorCardContent) {
      expect(card.arcana).toBe("major");
      expect(card.cardKey).toBe(`major:${String(card.id).padStart(2, "0")}`);
      expect(card.imageKey).not.toMatch(/^\//);
    }
  });

  test("keeps current lookup behavior", () => {
    expect(getTarotMajorCardContentById(0)?.slug).toBe("the-fool");
    expect(getTarotMajorCardContentById(21)?.slug).toBe("the-world");
    expect(getTarotMajorCardContentById(22)).toBeNull();
  });
});
```

### Step 2: Run RED

```powershell
npm run test --workspace @manyang/content -- src/tarot/major.test.ts
```

Expected: FAIL because `./major` does not exist.

### Step 3: Move the major data without changing copy

Create `packages/content/src/tarot/major.ts` from the current `frontend/src/lib/tarot-major-cards.ts` using these exact mechanical transformations:

1. Remove the `manyangAssets` import.
2. Import `TarotMajorCardContent` from `@manyang/contracts/tarot`.
3. Rename the raw array to `majorCardDefinitions`.
4. Remove each of the 22 `image: manyangAssets.tarot.major.*` fields.
5. Keep every existing ID, roman numeral, slug, name, keyword, symbol, meaning, mood, upright/reversed text, and context verbatim.
6. Derive shared identity and image keys in one mapper:

```ts
function createMajorImageKey(id: number, slug: string): string {
  return `major/${String(id).padStart(2, "0")}-${slug}.png`;
}

export const tarotMajorCardContent = majorCardDefinitions.map((card) => ({
  ...card,
  arcana: "major" as const,
  cardKey: `major:${String(card.id).padStart(2, "0")}`,
  imageKey: createMajorImageKey(card.id, card.slug),
})) as readonly TarotMajorCardContent[];

export function getTarotMajorCardContentById(id: number): TarotMajorCardContent | null {
  return tarotMajorCardContent.find((card) => card.id === id) ?? null;
}
```

Export the new module from `packages/content/src/tarot/index.ts` and add `./tarot/major` to the package export map.

### Step 4: Write the web asset adapter test

Create `frontend/src/lib/tarot-web-assets.test.ts`:

```ts
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { tarotMajorCardContent } from "@manyang/content/tarot";
import { resolveTarotWebImage } from "./tarot-web-assets";

describe("tarot web assets", () => {
  test("resolves every shared major image key to the existing public asset", () => {
    for (const card of tarotMajorCardContent) {
      const image = resolveTarotWebImage(card.imageKey);
      expect(image).toBe(`/manyang/tarot/${card.imageKey}`);
      expect(existsSync(path.join(process.cwd(), "public", image.slice(1)))).toBe(true);
    }
  });
});
```

Run it before creating the resolver. Expected: FAIL because `./tarot-web-assets` does not exist.

### Step 5: Add the minimal resolver and compatibility adapter

Create `frontend/src/lib/tarot-web-assets.ts`:

```ts
export function resolveTarotWebImage(imageKey: string): string {
  if (!imageKey || imageKey.startsWith("/") || imageKey.includes("..")) {
    throw new Error(`Invalid tarot image key: ${imageKey}`);
  }

  return `/manyang/tarot/${imageKey}`;
}
```

Replace `frontend/src/lib/tarot-major-cards.ts` with a compatibility adapter:

```ts
import {
  getTarotMajorCardContentById,
  tarotMajorCardContent,
} from "@manyang/content/tarot";
import type {
  TarotCardMeaning,
  TarotCardSymbolMeaning,
  TarotMajorCardContent,
} from "@manyang/contracts/tarot";

import { resolveTarotWebImage } from "./tarot-web-assets";

export type TarotMajorCardMeaning = TarotCardMeaning;
export type { TarotCardSymbolMeaning };
export type TarotMajorCard = TarotMajorCardContent & { image: string };

export const tarotMajorCards = tarotMajorCardContent.map((card) => ({
  ...card,
  image: resolveTarotWebImage(card.imageKey),
})) as readonly TarotMajorCard[];

export function getTarotMajorCardById(id: number): TarotMajorCard | null {
  const content = getTarotMajorCardContentById(id);
  return content ? tarotMajorCards.find((card) => card.cardKey === content.cardKey) ?? null : null;
}
```

### Step 6: Verify major compatibility

Run:

```powershell
npm run test --workspace @manyang/content -- src/tarot/major.test.ts
npm run test --workspace frontend -- src/lib/tarot-web-assets.test.ts src/lib/tarot-major-cards.test.ts
npm run typecheck --workspace @manyang/content
npm run typecheck --workspace frontend
git diff --check
```

Expected: PASS. Existing public major image URLs and all major-card copy tests remain unchanged.

### Step 7: Commit

```powershell
git add packages/content frontend/src/lib/tarot-major-cards.ts frontend/src/lib/tarot-web-assets.ts frontend/src/lib/tarot-web-assets.test.ts
git commit -m "refactor(content): share major arcana data"
```

## Task 4: Move minor arcana and the combined 78-card deck

**Files:**

- Create: `packages/content/src/tarot/minor.ts`
- Create: `packages/content/src/tarot/cards.ts`
- Create: `packages/content/src/tarot/cards.test.ts`
- Modify: `packages/content/package.json`
- Modify: `packages/content/src/tarot/index.ts`
- Modify: `frontend/src/lib/tarot-minor-cards.ts`
- Modify: `frontend/src/lib/tarot-cards.ts`
- Modify: `frontend/src/lib/tarot-web-assets.test.ts`
- Modify: `backend/package.json`
- Modify: `backend/src/scripts/run-tarot-model-ab-check.ts`
- Modify: `package-lock.json`
- Test: `frontend/src/lib/tarot-cards.test.ts`

### Step 1: Write the failing 78-card content test

Create `packages/content/src/tarot/cards.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import {
  getTarotCardContentById,
  getTarotCardContentByKey,
  tarotCardContent,
  tarotMinorCardContent,
} from "./cards";

describe("shared tarot deck content", () => {
  test("combines 22 major and 56 minor cards into one stable deck", () => {
    expect(tarotCardContent).toHaveLength(78);
    expect(tarotMinorCardContent).toHaveLength(56);
    expect(tarotCardContent.map((card) => card.id)).toEqual(Array.from({ length: 78 }, (_, id) => id));
    expect(new Set(tarotCardContent.map((card) => card.cardKey)).size).toBe(78);
    expect(new Set(tarotCardContent.map((card) => card.imageKey)).size).toBe(78);
  });

  test("preserves stable major, minor, and legacy numeric lookup", () => {
    expect(getTarotCardContentByKey("major:00")?.id).toBe(0);
    expect(getTarotCardContentByKey("minor:wands:01")?.id).toBe(22);
    expect(getTarotCardContentById(75)?.cardKey).toBe("minor:pentacles:12");
    expect(getTarotCardContentByKey("missing")).toBeNull();
  });
});
```

Run it. Expected: FAIL because `./cards` does not exist.

### Step 2: Move minor data without changing copy or IDs

Create `packages/content/src/tarot/minor.ts` from the existing `frontend/src/lib/tarot-minor-cards.ts` using these transformations:

1. Import `TarotCardMeaning`, `TarotCardSymbolMeaning`, `TarotMinorCardContent`, `TarotMinorRank`, and `TarotMinorSuit` from `@manyang/contracts/tarot`.
2. Keep `minorCardDefinitions`, suit profiles, rank profiles, Korean particle helpers, meaning builders, IDs, slugs, names, keywords, symbols, and all reading copy verbatim.
3. Rename the current `createMinorImagePath` helper to `createMinorImageKey` and change only its returned prefix: remove `/manyang/tarot/` so it returns a key beginning with `minor-cutout/`. Keep the helper's existing rank-name mapping and filename construction unchanged, so all resulting file names exactly match current public assets.

4. In `createMinorCard`, set `imageKey` instead of `image` and keep `cardKey`, `arcana`, suit, rank, and numeric IDs unchanged.
5. Export `tarotMinorCardContent` and `getTarotMinorCardContentById`.

### Step 3: Add the shared combined deck

Create `packages/content/src/tarot/cards.ts`:

```ts
import type { TarotCardContent } from "@manyang/contracts/tarot";

import { tarotMajorCardContent } from "./major";
import { tarotMinorCardContent } from "./minor";

export { tarotMinorCardContent };

export const tarotCardContent = [
  ...tarotMajorCardContent,
  ...tarotMinorCardContent,
] as const satisfies readonly TarotCardContent[];

export function getTarotCardContentById(id: number): TarotCardContent | null {
  return tarotCardContent.find((card) => card.id === id) ?? null;
}

export function getTarotCardContentByKey(cardKey: string): TarotCardContent | null {
  return tarotCardContent.find((card) => card.cardKey === cardKey) ?? null;
}
```

Export major, minor, combined deck, and question APIs from `packages/content/src/tarot/index.ts`. Add `./tarot/minor` and `./tarot/cards` package export entries.

### Step 4: Convert web minor and combined files to adapters

Replace `frontend/src/lib/tarot-minor-cards.ts` with the same adapter pattern used for major cards:

- shared source: `tarotMinorCardContent`
- attach `image: resolveTarotWebImage(card.imageKey)`
- re-export `TarotMinorSuit` and `TarotMinorRank`
- keep `TarotMinorCard` public type and `getTarotMinorCardById`

Replace `frontend/src/lib/tarot-cards.ts` so it maps `tarotCardContent` into current web `TarotCard` objects and preserves:

- `tarotCards`
- `tarotMinorCards`
- `getTarotCardById`
- `getTarotCardByKey`

Every newly created web card must include the same existing `image` URL plus the additive `imageKey` field. Keep the shared content objects strict (`cardKey` and `imageKey` required), while the `TarotCard` stored/transport snapshot type permits legacy major snapshots without `cardKey` and legacy snapshots without `imageKey`.

### Step 5: Expand the asset adapter test

Update `frontend/src/lib/tarot-web-assets.test.ts` to iterate all shared 78 cards, resolve every key, assert every public asset exists, and assert the two known examples remain:

```ts
expect(resolveTarotWebImage("major/00-the-fool.png")).toBe(
  "/manyang/tarot/major/00-the-fool.png",
);
expect(resolveTarotWebImage("minor-cutout/wands/01-ace-of-wands.png")).toBe(
  "/manyang/tarot/minor-cutout/wands/01-ace-of-wands.png",
);
```

### Step 6: Remove the backend-to-frontend content import

In `backend/package.json`, add `@manyang/content: 0.1.0` under `devDependencies`, not runtime dependencies. The production backend service remains contracts-only; only the evaluation CLI needs deck content.

Change `backend/src/scripts/run-tarot-model-ab-check.ts`:

```ts
import { getTarotCardContentByKey } from "@manyang/content/tarot";
```

Replace the current frontend `getTarotCardByKey` call with `getTarotCardContentByKey`. The prompt accepts the same structural content fields and does not need a web image URL.

Run `npm install` to update the root lockfile.

### Step 7: Verify the shared deck and all current web behavior

Run:

```powershell
npm run test --workspace @manyang/content
npm run typecheck --workspace @manyang/content
npm run test --workspace frontend -- src/lib/tarot-cards.test.ts src/lib/tarot-major-cards.test.ts src/lib/tarot-web-assets.test.ts src/lib/daily-tarot.test.ts
npm run typecheck --workspace frontend
npm run typecheck --workspace @manyang/backend
git diff --check
```

Expected: 22/56/78 counts, legacy lookup, current URLs, current copy, and daily draw/storage tests all pass, including fixtures saved before `imageKey` existed and major-card fixtures saved before `cardKey` existed.

### Step 8: Commit

```powershell
git add package-lock.json backend/package.json backend/src/scripts/run-tarot-model-ab-check.ts packages/content frontend/src/lib/tarot-minor-cards.ts frontend/src/lib/tarot-cards.ts frontend/src/lib/tarot-web-assets.test.ts
git commit -m "feat(content): add shared 78-card tarot deck"
```

## Task 5: Make web and backend consume the shared tarot contract

**Files:**

- Create: `frontend/src/lib/shared-tarot-boundary.test.ts`
- Modify: `frontend/src/lib/daily-tarot.ts`
- Modify: `frontend/src/app/api/tarot/readings/route.ts`
- Modify: `frontend/src/app/api/tarot/readings/route.test.ts`
- Modify: `backend/src/services/tarot-reading-prompt.ts`
- Modify: `backend/src/services/llm-tarot-reading.ts`
- Modify: `backend/src/index.ts`
- Modify: `backend/tests/public-api.test.ts`

### Step 1: Write failing source-boundary tests

Create `frontend/src/lib/shared-tarot-boundary.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

describe("shared tarot boundary", () => {
  test("daily tarot no longer defines public transport unions locally", () => {
    const source = readFileSync(new URL("./daily-tarot.ts", import.meta.url), "utf8");

    expect(source).not.toMatch(/export type Tarot(?:Orientation|Spread|UnlockMethod)\s*=/);
    expect(source).not.toMatch(/export type DailyTarot(?:Position|QuestionContext|Reading)\s*=/);
    expect(source).toContain('from "@manyang/contracts/tarot"');
  });

  test("frontend tarot card and question modules contain adapters, not source data", () => {
    const major = readFileSync(new URL("./tarot-major-cards.ts", import.meta.url), "utf8");
    const minor = readFileSync(new URL("./tarot-minor-cards.ts", import.meta.url), "utf8");
    const questions = readFileSync(new URL("./tarot-question-prompts.ts", import.meta.url), "utf8");

    expect(major).toContain("@manyang/content/tarot");
    expect(minor).toContain("@manyang/content/tarot");
    expect(questions).toContain("@manyang/content/tarot");
    expect(major).not.toContain("manyangAssets.tarot.major");
    expect(questions).not.toContain("representativeQuestion:");
  });
});
```

Add a backend public-boundary test to `backend/tests/public-api.test.ts` that asserts `backend/src/index.ts` directly re-exports public tarot contract types from `@manyang/contracts/tarot`.

Run the focused tests before changing production files. Expected: FAIL because the web and backend still define tarot unions/types locally.

### Step 2: Replace local frontend type definitions with compatibility exports

At the top of `frontend/src/lib/daily-tarot.ts`, import the shared types used by the implementation and re-export the existing public names:

```ts
import type {
  DailyTarotCardSelection,
  DailyTarotGeneratedCardReading,
  DailyTarotGeneratedReading,
  DailyTarotOption,
  DailyTarotPosition,
  DailyTarotQuestionContext,
  DailyTarotReading,
  TarotOrientation,
  TarotSpread,
  TarotUnlockMethod,
} from "@manyang/contracts/tarot";

export type {
  DailyTarotCardSelection,
  DailyTarotGeneratedCardReading,
  DailyTarotGeneratedReading,
  DailyTarotOption,
  DailyTarotPosition,
  DailyTarotQuestionContext,
  DailyTarotReading,
  TarotOrientation,
  TarotSpread,
  TarotUnlockMethod,
} from "@manyang/contracts/tarot";
```

Remove only the duplicate local type blocks. Keep `StorageLike`, input/config helper types, constants, storage parsing, draw logic, browser functions, and events in place.

### Step 3: Use shared request types and runtime constants in the web route

In `frontend/src/app/api/tarot/readings/route.ts`, import:

```ts
import {
  TAROT_ORIENTATIONS,
  TAROT_POSITIONS,
  TAROT_SPREADS,
  TAROT_UNLOCK_METHODS,
  type DailyTarotReading,
  type TarotReadingRequest,
  type TarotSpread,
} from "@manyang/contracts/tarot";
```

Use `TarotReadingRequest` for the validated request shape and replace duplicate equality chains with `Set<string>` instances derived from the shared readonly constants. Preserve exact validation error strings and the current question-only unlock behavior.

Update `frontend/src/app/api/tarot/readings/route.test.ts` to iterate every shared spread/orientation/position/unlock value through the existing validator or route harness. Do not create a second route harness.

### Step 4: Remove duplicate backend prompt types

In `backend/src/services/tarot-reading-prompt.ts`:

- import `TarotReadingSpread`, `TarotReadingPosition`, `TarotReadingOrientation`, `TarotCardSymbolMeaning`, and `TarotPromptCardMeaning` from `@manyang/contracts/tarot`
- remove the local duplicate union and meaning type definitions
- define `TarotPromptCard` as the structural subset needed by the prompt; do not add image requirements
- set the JSON schema position enum from `TAROT_POSITIONS` if the resulting schema remains byte-equivalent for tests
- re-export the imported public type names for current internal imports only if required

In `backend/src/services/llm-tarot-reading.ts`, keep provider result/error/options types local. Only its shared input/card/spread/orientation dependencies move to contracts.

### Step 5: Point the backend public API at contracts

In `backend/src/index.ts`:

- directly re-export tarot runtime constants and public transport types from `@manyang/contracts/tarot`
- keep `buildTarotReadingPrompt`, schema constants, AI-only prompt frame types, `generateTarotReadingForUser`, provider options, result, and unavailable reason on backend exports
- preserve current public alias names used by callers

### Step 6: Run focused and full package verification

Run:

```powershell
npm run test --workspace frontend -- src/lib/shared-tarot-boundary.test.ts src/app/api/tarot/readings/route.test.ts src/lib/daily-tarot.test.ts src/components/daily-tarot-client.test.tsx src/components/question-tarot-client.test.tsx
npm run test --workspace @manyang/backend -- tests/public-api.test.ts src/services/llm-tarot-reading.test.ts
npm run typecheck --workspace @manyang/contracts
npm run typecheck --workspace @manyang/content
npm run typecheck --workspace @manyang/backend
npm run typecheck --workspace frontend
npm run lint --workspace frontend
npm run build --workspace frontend
git diff --check
```

Expected: PASS with no route, payload, storage, or UI behavior change.

### Step 7: Commit

```powershell
git add frontend/src/lib/shared-tarot-boundary.test.ts frontend/src/lib/daily-tarot.ts frontend/src/app/api/tarot/readings/route.ts frontend/src/app/api/tarot/readings/route.test.ts backend/src/services/tarot-reading-prompt.ts backend/src/services/llm-tarot-reading.ts backend/src/index.ts backend/tests/public-api.test.ts
git commit -m "refactor(tarot): consume shared contract and content"
```

## Task 6: Enforce final boundaries and record progress

**Files:**

- Modify: `vault/02-Architecture/Web-Mobile-Shared-Architecture.md`
- Modify: `vault/09-Implementation/plans/ACTIVE_SPRINT.md`
- Test: repository verification and boundary searches

### Step 1: Run final boundary searches

Run:

```powershell
rg -n "window\.|document\.|localStorage|next/|react" packages/contracts packages/content
rg -n "frontend/src|@/lib|@manyang/backend" packages/contracts packages/content
rg -n "manyangAssets|representativeQuestion:|minorCardDefinitions|majorCardDefinitions" frontend/src/lib/tarot-major-cards.ts frontend/src/lib/tarot-minor-cards.ts frontend/src/lib/tarot-question-prompts.ts
rg -n "frontend/src/lib/tarot-cards" backend
```

Expected:

- no browser/framework/backend/frontend imports in either shared package
- no card or question source arrays remain in frontend compatibility files
- no backend file imports frontend tarot content
- `daily-tarot.ts` retains browser globals because browser storage is explicitly deferred

### Step 2: Record the completed foundation

Append a dated progress item to `vault/02-Architecture/Web-Mobile-Shared-Architecture.md`:

```markdown
- 2026-07-15: `@manyang/contracts`의 타로 계약과 `@manyang/content`의 78장 카드·질문 콘텐츠를 공용 원본으로 전환했다. 웹은 `imageKey`를 기존 URL로 변환하는 호환 어댑터를 사용하며, 브라우저 저장소와 뽑기 규칙 분리는 후속 스프린트로 남긴다.
```

Update the active sprint with a completed shared-tarot-foundation item and set the next recommended sprint to:

```text
타로 순수 규칙과 브라우저 저장 어댑터 분리
```

Do not mark Expo or relationship implementation as started.

### Step 3: Run final verification

Use a shell timeout of at least 360000 ms:

```powershell
npm run verify
git diff --check
git status --short
```

Expected:

- contracts and content package tests pass first
- backend and frontend tests pass
- all typechecks, lint, and production build pass
- only the two intended documentation files remain before the final commit

### Step 4: Commit

```powershell
git add vault/02-Architecture/Web-Mobile-Shared-Architecture.md vault/09-Implementation/plans/ACTIVE_SPRINT.md
git commit -m "docs: record shared tarot foundation"
```

## Completion criteria

- `@manyang/contracts/tarot` is the only definition site for shared tarot runtime values and public transport types.
- `@manyang/content/tarot` is the only definition site for all 78 card records and six question states.
- All shared cards have stable `cardKey` and platform-neutral `imageKey` values.
- Web adapters reproduce every current public image URL and existing card object API.
- The backend tarot evaluation script no longer imports frontend source.
- Current API requests/responses, storage records, routes, card draw behavior, access rules, and UI remain unchanged.
- Root tests, typechecks, lint, production build, boundary searches, and `git diff --check` pass.

## Follow-up sprint order

1. Separate pure tarot draw rules from browser storage.
2. Split browser storage adapters for tarot and selected cat.
3. Implement relationship domain and server persistence.
4. Add cookie/Bearer unified API authentication.
5. Add app-only moon-piece ledger and purchase verification contracts.
6. Create the Expo client foundation.
