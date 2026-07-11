# Web Mobile Shared Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert the repository to an npm workspace and extract the public dream API contract into `@manyang/contracts` without changing current web behavior.

**Architecture:** Keep `frontend/` and `backend/` in place while introducing a root npm workspace and a platform-neutral contracts package. The backend keeps a temporary compatibility re-export, while web client code imports shared transport types directly instead of importing the server package. This sprint deliberately does not create the Expo app or move tarot/content/domain logic.

**Tech Stack:** npm workspaces, TypeScript, Next.js 16, React 19, Vitest, Supabase, Node.js 24

---

## Scope and constraints

- Use `@test-driven-development` for every behavior change.
- Use `@systematic-debugging` if an existing test or build fails unexpectedly.
- Preserve all current web routes, API response shapes, localStorage keys, database tables, and SEO behavior.
- Do not create `mobile/` in this sprint.
- Do not move tarot card data, relationship logic, currency logic, or design tokens yet.
- Do not change the meaning of `catReaderType`; this sprint only centralizes the existing contract.
- Keep `services/korean-analyzer/` on its current standalone package lock.
- Commit after every task using the messages below.

## Target state

```text
manyang/
├─ package.json
├─ package-lock.json
├─ frontend/
├─ backend/
├─ packages/
│  └─ contracts/
│     ├─ package.json
│     ├─ tsconfig.json
│     └─ src/
│        ├─ dream.ts
│        ├─ dream.test.ts
│        └─ index.ts
└─ services/korean-analyzer/package-lock.json
```

## Task 1: Establish the root npm workspace

**Files:**

- Create: `package.json`
- Create: `package-lock.json` via npm
- Modify: `frontend/package.json`
- Delete: `frontend/package-lock.json`
- Delete: `backend/package-lock.json`
- Keep: `services/korean-analyzer/package-lock.json`

**Step 1: Capture the current baseline**

Run:

```powershell
npm --prefix backend test
npm --prefix backend run typecheck
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
```

Expected: all commands pass. If an unrelated pre-existing failure appears, stop and record it before changing workspace files.

**Step 2: Create the root workspace manifest**

Create `package.json`:

```json
{
  "name": "manyang",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "backend",
    "frontend",
    "packages/*"
  ],
  "scripts": {
    "test": "npm run test --workspace @manyang/backend && npm run test --workspace frontend",
    "typecheck": "npm run typecheck --workspace @manyang/backend && npm run typecheck --workspace frontend",
    "lint": "npm run lint --workspace frontend",
    "build": "npm run build --workspace frontend",
    "verify": "npm run test && npm run typecheck && npm run lint && npm run build"
  },
  "engines": {
    "node": ">=22"
  }
}
```

**Step 3: Add an explicit frontend typecheck script**

In `frontend/package.json`, add:

```json
"typecheck": "tsc --noEmit"
```

Keep all existing scripts unchanged.

**Step 4: Use workspace version linking for the backend**

In `frontend/package.json`, replace:

```json
"@manyang/backend": "file:../backend"
```

with:

```json
"@manyang/backend": "0.1.0"
```

npm will link the matching private workspace package locally.

**Step 5: Consolidate package locks**

Delete only:

```text
frontend/package-lock.json
backend/package-lock.json
```

Then run from the repository root:

```powershell
npm install
```

Expected:

- root `package-lock.json` is created
- `node_modules/@manyang/backend` resolves to the workspace package
- `services/korean-analyzer/package-lock.json` is unchanged

**Step 6: Verify workspace commands**

Run:

```powershell
npm run test
npm run typecheck
npm run lint
npm run build
```

Expected: all commands pass with the same behavior as the baseline.

**Step 7: Commit**

```powershell
git add package.json package-lock.json frontend/package.json frontend/package-lock.json backend/package-lock.json
git commit -m "build: add npm workspace foundation"
```

## Task 2: Create the platform-neutral contracts package

**Files:**

- Create: `packages/contracts/package.json`
- Create: `packages/contracts/tsconfig.json`
- Create: `packages/contracts/src/index.ts`
- Create: `packages/contracts/src/dream.ts`
- Create: `packages/contracts/src/dream.test.ts`
- Modify: `package.json`

**Step 1: Write the failing contract test**

Create `packages/contracts/src/dream.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import { CAT_READER_TYPES, DREAM_LOCALES } from "./dream";

describe("dream transport contract", () => {
  test("exposes the supported reader ids once", () => {
    expect(CAT_READER_TYPES).toEqual([
      "black_cat",
      "white_cat",
      "cheese_cat",
      "gray_cat",
    ]);
    expect(new Set(CAT_READER_TYPES).size).toBe(CAT_READER_TYPES.length);
  });

  test("exposes the supported dream locales", () => {
    expect(DREAM_LOCALES).toEqual(["ko", "en"]);
  });
});
```

**Step 2: Create the package manifest**

Create `packages/contracts/package.json`:

```json
{
  "name": "@manyang/contracts",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./dream": "./src/dream.ts"
  },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5",
    "vitest": "^4.1.7"
  }
}
```

**Step 3: Create the package TypeScript config**

Create `packages/contracts/tsconfig.json`:

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

**Step 4: Add the contracts package to root verification**

Change the root scripts to run contracts first:

```json
"test": "npm run test --workspace @manyang/contracts && npm run test --workspace @manyang/backend && npm run test --workspace frontend",
"typecheck": "npm run typecheck --workspace @manyang/contracts && npm run typecheck --workspace @manyang/backend && npm run typecheck --workspace frontend"
```

**Step 5: Run the focused test to verify it fails**

Run:

```powershell
npm install
npm run test --workspace @manyang/contracts
```

Expected: FAIL because `CAT_READER_TYPES` and `DREAM_LOCALES` do not exist yet.

**Step 6: Add the minimal runtime constants and types**

Create `packages/contracts/src/dream.ts` with the full current contents of `backend/src/contracts/dream.ts`, but define the reader and locale types from runtime constants:

```ts
export const CAT_READER_TYPES = [
  "black_cat",
  "white_cat",
  "cheese_cat",
  "gray_cat",
] as const;

export type CatReaderType = (typeof CAT_READER_TYPES)[number];

export const DREAM_LOCALES = ["ko", "en"] as const;

export type DreamLocale = (typeof DREAM_LOCALES)[number];

export type DreamSymbolCategory =
  | "place"
  | "person"
  | "animal"
  | "nature"
  | "object"
  | "body"
  | "action"
  | "event"
  | "food"
  | "emotion"
  | "abstract";

export type CatReaderAccess = "free" | "annual_premium";

export type CatReaderResponse = {
  id: CatReaderType;
  name: string;
  access: CatReaderAccess;
};

export type DreamNightContext = {
  checkInDate: string;
  moodLabel: string;
  conditionLabel: string;
  note?: string;
};

export type EncyclopediaEntry = {
  symbol: string;
  slug: string;
  category: DreamSymbolCategory;
  aliases: string[];
  coreMeanings: string[];
  positiveReadings: string[];
  negativeReadings: string[];
  contextQuestions: string[];
  relatedSymbols: string[];
  catInterpretationHint: string;
  body: string;
};

export type DreamAnalysisRequest = {
  dreamText: string;
  dreamDate?: string;
  wakeMood?: string;
  dreamMood?: string;
  dreamAtmospheres?: string[];
  dreamSensations?: string[];
  dreamSensationOther?: string;
  nightContext?: DreamNightContext;
  catReaderType?: CatReaderType;
  locale?: DreamLocale;
  userTimeZone?: string;
};

export type DreamCardResponse = {
  name: string;
  type: string;
  keywords: string[];
  summary: string;
  message: string;
  theme: string;
};

export type DreamAnalysisResponse = {
  dreamId: string;
  analysisId: string;
  cardId: string;
  reader: CatReaderResponse;
  summary: string;
  symbols: string[];
  emotions: string[];
  themes: string[];
  interpretation: string;
  symbolReadings: {
    symbol: string;
    reading: string;
  }[];
  smallPrescription: string;
  readingBasis: {
    usedSymbols: string[];
    mainThemes: string[];
    confidence: number;
  };
  readerNote?: string;
  safetyNotice?: string;
  card: DreamCardResponse;
};
```

Create `packages/contracts/src/index.ts`:

```ts
export {
  CAT_READER_TYPES,
  DREAM_LOCALES,
} from "./dream";

export type {
  CatReaderAccess,
  CatReaderResponse,
  CatReaderType,
  DreamAnalysisRequest,
  DreamAnalysisResponse,
  DreamCardResponse,
  DreamLocale,
  DreamNightContext,
  DreamSymbolCategory,
  EncyclopediaEntry,
} from "./dream";
```

**Step 7: Run package tests and typecheck**

Run:

```powershell
npm run test --workspace @manyang/contracts
npm run typecheck --workspace @manyang/contracts
```

Expected: PASS.

**Step 8: Commit**

```powershell
git add package.json package-lock.json packages/contracts
git commit -m "feat(contracts): add shared dream transport contract"
```

## Task 3: Make the backend consume the shared dream contract

**Files:**

- Modify: `backend/package.json`
- Modify: `backend/src/contracts/dream.ts`
- Modify: `backend/src/index.ts`
- Test: `backend/tests/public-api.test.ts`

**Step 1: Write the failing public API test**

In `backend/tests/public-api.test.ts`, add a source-boundary assertion that the backend public entry point re-exports dream types from the shared contract package:

```ts
test("re-exports shared dream transport contracts", () => {
  const source = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");

  expect(source).toContain('from "@manyang/contracts/dream"');
});
```

If `readFileSync` is not already imported, add:

```ts
import { readFileSync } from "node:fs";
```

**Step 2: Run the focused test to verify it fails**

Run:

```powershell
npm run test --workspace @manyang/backend -- tests/public-api.test.ts
```

Expected: FAIL because `backend/src/index.ts` still re-exports from `./contracts/dream`.

**Step 3: Add the workspace dependency**

In `backend/package.json`, add:

```json
"dependencies": {
  "@manyang/contracts": "0.1.0"
}
```

Do not put this under `devDependencies`; the backend imports the package at runtime for constants in later tasks.

**Step 4: Replace the local dream contract with a compatibility shim**

Replace `backend/src/contracts/dream.ts` with:

```ts
export {
  CAT_READER_TYPES,
  DREAM_LOCALES,
} from "@manyang/contracts/dream";

export type {
  CatReaderAccess,
  CatReaderResponse,
  CatReaderType,
  DreamAnalysisRequest,
  DreamAnalysisResponse,
  DreamCardResponse,
  DreamLocale,
  DreamNightContext,
  DreamSymbolCategory,
  EncyclopediaEntry,
} from "@manyang/contracts/dream";
```

This shim keeps current relative imports working while the rest of the backend migrates gradually.

**Step 5: Point the public backend entry at the shared contract**

In `backend/src/index.ts`, replace the first dream type export block so it imports from:

```ts
export type {
  CatReaderAccess,
  CatReaderResponse,
  CatReaderType,
  DreamAnalysisRequest,
  DreamAnalysisResponse,
  DreamCardResponse,
  DreamLocale,
  DreamNightContext,
  DreamSymbolCategory,
  EncyclopediaEntry,
} from "@manyang/contracts/dream";
```

Also export the runtime constants:

```ts
export { CAT_READER_TYPES, DREAM_LOCALES } from "@manyang/contracts/dream";
```

**Step 6: Install and verify the backend**

Run:

```powershell
npm install
npm run test --workspace @manyang/backend
npm run typecheck --workspace @manyang/backend
```

Expected: PASS with no response-shape changes.

**Step 7: Commit**

```powershell
git add package-lock.json backend/package.json backend/src/contracts/dream.ts backend/src/index.ts backend/tests/public-api.test.ts
git commit -m "refactor(backend): consume shared dream contracts"
```

## Task 4: Move web dream type imports off the server package

**Files:**

- Modify: `frontend/package.json`
- Modify: `frontend/src/components/dream-entry-form.tsx`
- Modify: `frontend/src/components/dream-result-page-client.tsx`
- Modify: `frontend/src/lib/dream-storage.ts`
- Modify: `frontend/src/lib/server/manyang-db.ts`
- Modify: `frontend/src/app/api/dreams/analyze/route.ts`
- Modify: `frontend/src/app/api/dreams/analyze/route.test.ts`
- Create: `frontend/src/lib/shared-contract-boundary.test.ts`

**Step 1: Write the failing boundary test**

Create `frontend/src/lib/shared-contract-boundary.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const clientContractConsumers = [
  "../components/dream-entry-form.tsx",
  "../components/dream-result-page-client.tsx",
  "./dream-storage.ts",
] as const;

describe("shared transport contract boundary", () => {
  test.each(clientContractConsumers)("%s does not import dream types from the backend", (relativePath) => {
    const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");

    expect(source).not.toMatch(
      /import\s+type\s+\{[^}]*Dream(?:Analysis|Night)[^}]*\}\s+from\s+["']@manyang\/backend["']/s,
    );
  });
});
```

**Step 2: Run the focused test to verify it fails**

Run:

```powershell
npm run test --workspace frontend -- src/lib/shared-contract-boundary.test.ts
```

Expected: FAIL because the three client modules import dream types from `@manyang/backend`.

**Step 3: Add the shared package dependency**

In `frontend/package.json`, add:

```json
"@manyang/contracts": "0.1.0"
```

**Step 4: Update client and persistence type imports**

Change dream transport type imports in these files to `@manyang/contracts/dream`:

```text
frontend/src/components/dream-entry-form.tsx
frontend/src/components/dream-result-page-client.tsx
frontend/src/lib/dream-storage.ts
frontend/src/lib/server/manyang-db.ts
```

Keep server implementation imports such as `analyzeDreamWithLlm` and provider factories on `@manyang/backend`.

For example, split the imports in `dream-entry-form.tsx` into:

```ts
import type {
  DreamAnalysisResponse,
  DreamNightContext,
} from "@manyang/contracts/dream";
import type { DreamReadingUnavailableReason } from "@manyang/backend";
```

`DreamReadingUnavailableReason` stays on the backend for this sprint because it is an AI service result type, not yet part of the transport contract.

**Step 5: Split route implementation and contract imports**

In `frontend/src/app/api/dreams/analyze/route.ts`, import these types from `@manyang/contracts/dream`:

```ts
import type {
  CatReaderType,
  DreamAnalysisRequest,
  DreamAnalysisResponse,
} from "@manyang/contracts/dream";
```

Keep executable AI functions and AI-only types imported from `@manyang/backend`.

In `frontend/src/app/api/dreams/analyze/route.test.ts`, change the setup to:

```ts
import type { DreamAnalysisResponse } from "@manyang/contracts/dream";
import { analyzeDream } from "@manyang/backend";
```

**Step 6: Install and run focused tests**

Run:

```powershell
npm install
npm run test --workspace frontend -- src/lib/shared-contract-boundary.test.ts src/app/api/dreams/analyze/route.test.ts src/lib/dream-storage.test.ts
```

Expected: PASS.

**Step 7: Run full web verification**

Run:

```powershell
npm run test --workspace frontend
npm run typecheck --workspace frontend
npm run lint --workspace frontend
npm run build --workspace frontend
```

Expected: PASS.

**Step 8: Commit**

```powershell
git add package-lock.json frontend/package.json frontend/src/components/dream-entry-form.tsx frontend/src/components/dream-result-page-client.tsx frontend/src/lib/dream-storage.ts frontend/src/lib/server/manyang-db.ts frontend/src/app/api/dreams/analyze/route.ts frontend/src/app/api/dreams/analyze/route.test.ts frontend/src/lib/shared-contract-boundary.test.ts
git commit -m "refactor(web): use shared dream transport contracts"
```

## Task 5: Use shared runtime values at dream API boundaries

**Files:**

- Modify: `frontend/src/app/api/dreams/analyze/route.ts`
- Modify: `frontend/src/app/api/dreams/route.ts`
- Modify: `frontend/src/app/api/dreams/analyze/route.test.ts`
- Modify: `frontend/src/app/api/dreams/route.test.ts`

**Step 1: Add a failing validator regression test**

In both route test files, add or update a test that iterates over the shared reader IDs and confirms each is accepted by validation:

```ts
import { CAT_READER_TYPES } from "@manyang/contracts/dream";

test.each(CAT_READER_TYPES)("accepts the shared reader id %s", async (catReaderType) => {
  // Use the route's existing valid request helper.
  const response = await callRouteWithValidBody({ catReaderType });

  expect(response.status).not.toBe(400);
});
```

Adapt `callRouteWithValidBody` to the existing helper names in each test. Do not introduce a second route harness.

**Step 2: Run the focused tests**

Run:

```powershell
npm run test --workspace frontend -- src/app/api/dreams/analyze/route.test.ts src/app/api/dreams/route.test.ts
```

Expected: tests may pass before implementation because the lists currently match. Confirm that the new tests execute four cases; then proceed with the refactor as behavior-preserving TDD.

**Step 3: Replace duplicate reader and locale lists**

In `frontend/src/app/api/dreams/analyze/route.ts`, import:

```ts
import {
  CAT_READER_TYPES,
  DREAM_LOCALES,
  type CatReaderType,
  type DreamAnalysisRequest,
  type DreamAnalysisResponse,
} from "@manyang/contracts/dream";
```

Replace local literals with:

```ts
const validLocales = new Set<string>(DREAM_LOCALES);
const validCatReaderTypes = new Set<string>(CAT_READER_TYPES);
```

In `frontend/src/app/api/dreams/route.ts`, replace the local reader set with:

```ts
import { CAT_READER_TYPES } from "@manyang/contracts/dream";

const validCatReaderTypes = new Set<string>(CAT_READER_TYPES);
```

**Step 4: Run route and full verification**

Run:

```powershell
npm run test --workspace frontend -- src/app/api/dreams/analyze/route.test.ts src/app/api/dreams/route.test.ts
npm run verify
```

Expected: PASS.

**Step 5: Commit**

```powershell
git add frontend/src/app/api/dreams/analyze/route.ts frontend/src/app/api/dreams/route.ts frontend/src/app/api/dreams/analyze/route.test.ts frontend/src/app/api/dreams/route.test.ts
git commit -m "refactor(api): centralize dream transport values"
```

## Task 6: Record the completed foundation and enforce final boundaries

**Files:**

- Modify: `vault/02-Architecture/Web-Mobile-Shared-Architecture.md`
- Modify: `vault/09-Implementation/plans/ACTIVE_SPRINT.md`
- Test: repository verification only

**Step 1: Run boundary searches**

Run:

```powershell
rg -n "DreamAnalysisRequest|DreamAnalysisResponse|DreamNightContext" frontend/src/components frontend/src/lib
rg -n "from \"@manyang/backend\"" frontend/src/components frontend/src/lib
rg -n "window\.|document\.|localStorage" packages/contracts
```

Expected:

- client dream transport types come from `@manyang/contracts/dream`
- remaining frontend imports from `@manyang/backend` are server implementation or encyclopedia migration work explicitly deferred to a later sprint
- no browser globals exist in `packages/contracts`

**Step 2: Update architecture progress**

In `vault/02-Architecture/Web-Mobile-Shared-Architecture.md`, add a dated progress note:

```markdown
## Progress

- 2026-07-__: 루트 npm workspace와 `@manyang/contracts`를 도입하고 꿈 transport 계약을 웹·백엔드에서 공유하도록 전환했다. 타로·관계·달조각·content 분리는 후속 스프린트로 남긴다.
```

Use the actual completion date.

**Step 3: Update the active sprint**

Add a completed item for the shared foundation and list the next recommended sprint as:

```text
공통 타로 계약과 content/domain 분리
```

Do not mark the Expo client as started.

**Step 4: Run final verification**

Run:

```powershell
npm run verify
git diff --check
git status --short
```

Expected:

- all tests, typechecks, lint, and build pass
- no whitespace errors
- only intended documentation changes remain

**Step 5: Commit**

```powershell
git add vault/02-Architecture/Web-Mobile-Shared-Architecture.md vault/09-Implementation/plans/ACTIVE_SPRINT.md
git commit -m "docs: record shared contract foundation"
```

## Completion criteria

- Root npm workspace commands are the canonical way to verify the repository.
- `services/korean-analyzer` retains its independent lockfile and workflow.
- `@manyang/contracts` contains the public dream request and response contract.
- Backend dream services compile against the shared contract.
- Web client modules no longer import dream transport types from `@manyang/backend`.
- Dream API reader and locale validation use shared runtime constants.
- Existing web behavior, routes, API payloads, tests, lint, and production build remain unchanged.
- No Expo app, tarot migration, relationship system, or currency implementation has been started prematurely.

## Follow-up sprint order

After this plan is complete, create separate plans in this order:

1. Shared tarot contract and tarot content package
2. Browser storage adapter split for tarot and selected cat
3. Relationship domain and server persistence
4. Cookie/Bearer unified API authentication
5. App-only moon-piece ledger and purchase verification contracts
6. Expo client foundation
