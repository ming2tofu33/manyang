# Symbol Disambiguation and Food Expansion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add optional encyclopedia-driven disambiguation rules and expand the dream symbol encyclopedia with apple, fruit, rice, egg, and eye.

**Architecture:** Keep disambiguation metadata inside existing symbol encyclopedia entries as an optional field. The runtime matcher reads that metadata through a shared helper, rejects clear false positives, and leaves unambiguous entries unchanged. New food/body symbols are normal encyclopedia entries with localized readings, aliases, scene modifiers, and safety wording.

**Tech Stack:** TypeScript, Vitest, Next.js backend service code, local TypeScript symbol encyclopedia.

---

### Task 1: Add Disambiguation Contract Types

**Files:**
- Modify: `backend/src/contracts/symbol-encyclopedia.ts`
- Modify: `backend/src/data/symbol-encyclopedia.ts`
- Test: `backend/tests/symbol-encyclopedia-contract.test.ts`

**Step 1: Write the failing test**

Add a test case that accepts an entry with optional disambiguation:

```ts
expect(() =>
  SymbolEntrySchema.parse({
    id: "horse",
    status: "active",
    category: "animal",
    subcategory: "domestic_animal",
    facets: ["movement"],
    universalMeanings: ["movement"],
    sourceBasis: ["traditional symbol"],
    relatedIds: [],
    locales: {
      ko: {
        label: "말",
        aliases: ["말", "백마"],
        searchText: "말, 백마",
        coreMeanings: ["전진"],
        lightReadings: ["앞으로 나아감"],
        shadowReadings: ["성급함"],
        sceneModifiers: {},
        contextQuestions: ["말을 타고 있었나요?"],
        metaphorHooks: ["달리는 말"],
        cardTitleSeeds: ["달리는 말"],
        smallPrescriptions: ["오늘 움직일 방향을 하나 정해보세요."],
        safeReading: "말은 전진과 활력을 보여줄 수 있어요.",
        avoidExpressions: ["무조건 성공한다"],
      },
      en: {
        label: "Horse",
        aliases: ["horse"],
        searchText: "horse",
        coreMeanings: ["movement"],
        lightReadings: ["momentum"],
        shadowReadings: ["restlessness"],
        sceneModifiers: {},
        contextQuestions: ["Were you riding it?"],
        metaphorHooks: ["the running horse"],
        cardTitleSeeds: ["The Running Horse"],
        smallPrescriptions: ["Choose one direction for today."],
        safeReading: "A horse can point to movement and vitality.",
        avoidExpressions: ["you will certainly succeed"],
      },
    },
    disambiguation: {
      ko: [
        {
          alias: "말",
          confirmWhen: ["말을 타", "백마"],
          rejectWhen: ["말을 걸", "말을 하", "대화"],
          fallback: "candidate_only",
        },
      ],
    },
  }),
).not.toThrow();
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm.cmd --prefix backend test -- tests/symbol-encyclopedia-contract.test.ts
```

Expected: FAIL because `disambiguation` is not in the contract.

**Step 3: Implement minimal types**

Add `SymbolDisambiguationRule` and optional `disambiguation` to the encyclopedia contract and local data types.

**Step 4: Run test to verify it passes**

Run:

```bash
npm.cmd --prefix backend test -- tests/symbol-encyclopedia-contract.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/src/contracts/symbol-encyclopedia.ts backend/src/data/symbol-encyclopedia.ts backend/tests/symbol-encyclopedia-contract.test.ts
git commit -m "feat(dream): add symbol disambiguation contract"
```

### Task 2: Replace Horse-Specific Guard With Generic Disambiguation

**Files:**
- Modify: `backend/src/services/symbol-matcher.ts`
- Test: `backend/tests/runtime-symbol-matcher.test.ts`

**Step 1: Write failing matcher tests**

Add tests:

```ts
expect(ids("돼지가 나한테 말을 거는 꿈")).not.toContain("horse");
expect(ids("말을 타고 들판을 달렸어")).toContain("horse");
expect(ids("백마가 나왔어")).toContain("horse");
expect(ids("망아지를 봤어")).toContain("horse");
```

Also add a regression assertion that speech context still allows other symbols:

```ts
const matches = findRuntimeSymbolMatches({
  dreamText: "꿈에서 돼지가 나한테 말을 걸었어.",
  locale: "ko",
});
expect(matches.map((match) => match.id)).toContain("pig");
expect(matches.map((match) => match.id)).not.toContain("horse");
```

**Step 2: Run test to verify it fails or catches current local guard dependency**

Run:

```bash
npm.cmd --prefix backend test -- tests/runtime-symbol-matcher.test.ts
```

Expected: The test should pass only after the generic metadata-driven path exists.

**Step 3: Implement generic helper**

Add a helper near matcher normalization logic:

```ts
function shouldRejectByDisambiguation(
  entry: RuntimeSymbolEntry,
  matchedText: string[],
  normalizedText: string,
  locale: SupportedLocale,
): boolean {
  const rules = entry.disambiguation?.[locale] ?? [];

  return rules.some((rule) => {
    const matchedRiskyAlias = matchedText.some((term) => normalizeForMatch(term, locale) === normalizeForMatch(rule.alias, locale));
    if (!matchedRiskyAlias) return false;

    const hasRejectContext = rule.rejectWhen?.some((term) => normalizedText.includes(normalizeForMatch(term, locale))) ?? false;
    if (hasRejectContext) return true;

    const hasConfirmContext = rule.confirmWhen?.some((term) => normalizedText.includes(normalizeForMatch(term, locale))) ?? false;
    return !hasConfirmContext && rule.fallback === "reject";
  });
}
```

Then remove the horse-only function and call the helper before pushing a match.

**Step 4: Run tests**

Run:

```bash
npm.cmd --prefix backend test -- tests/runtime-symbol-matcher.test.ts tests/dream-rag-retriever.test.ts tests/structured-dream-analysis.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/src/services/symbol-matcher.ts backend/tests/runtime-symbol-matcher.test.ts
git commit -m "feat(dream): apply encyclopedia disambiguation in matcher"
```

### Task 3: Add First Disambiguation Rules to Existing Symbols

**Files:**
- Modify: `backend/src/data/symbol-encyclopedia.ts`
- Test: `backend/tests/runtime-symbol-matcher.test.ts`

**Step 1: Add failing false-positive tests**

Test these cases:

```ts
expect(ids("차를 마시는 꿈")).not.toContain("car");
expect(ids("차를 운전하는 꿈")).toContain("car");
expect(ids("배가 아픈 꿈")).not.toContain("boat");
expect(ids("배를 타는 꿈")).toContain("boat");
expect(ids("눈이 아픈 꿈")).not.toContain("snow");
expect(ids("눈이 펑펑 오는 꿈")).toContain("snow");
expect(ids("커피를 마시는 꿈")).not.toContain("blood");
expect(ids("피가 나는 꿈")).toContain("blood");
```

**Step 2: Run tests to verify failures**

Run:

```bash
npm.cmd --prefix backend test -- tests/runtime-symbol-matcher.test.ts
```

Expected: FAIL until data rules are added.

**Step 3: Add rules**

Add `disambiguation.ko` to:

- `car`: alias `차`, reject tea/drinking context, confirm driving/riding/accident context.
- `boat`: alias `배`, reject stomach and pear context, confirm riding/sailing/sea/river context.
- `snow`: alias `눈`, reject eye/body context, confirm falling snow/winter/white-covered context.
- `blood`: alias `피`, reject `커피`, `피곤`, `피아노`, confirm bleeding/wound context.
- `horse`: alias `말`, speech rejection and horse riding/animal confirmation.

**Step 4: Run tests**

Run:

```bash
npm.cmd --prefix backend test -- tests/runtime-symbol-matcher.test.ts tests/symbol-encyclopedia-data.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/src/data/symbol-encyclopedia.ts backend/tests/runtime-symbol-matcher.test.ts
git commit -m "feat(dream): add Korean homonym disambiguation rules"
```

### Task 4: Add New Symbols Apple, Fruit, Rice, Egg, Eye

**Files:**
- Modify: `backend/src/data/symbol-encyclopedia.ts`
- Test: `backend/tests/symbol-encyclopedia-data.test.ts`
- Test: `backend/tests/runtime-symbol-matcher.test.ts`

**Step 1: Add failing coverage tests**

Add new required IDs to the encyclopedia data coverage test:

```ts
"apple",
"fruit",
"rice",
"egg",
"eye",
```

Add matcher tests:

```ts
expect(ids("사과를 먹는 꿈")).toContain("apple");
expect(ids("과일이 가득 열린 꿈")).toContain("fruit");
expect(ids("밥을 차려주는 꿈")).toContain("rice");
expect(ids("달걀이 깨지는 꿈")).toContain("egg");
expect(ids("눈이 나를 바라보는 꿈")).toContain("eye");
```

**Step 2: Run tests to verify failures**

Run:

```bash
npm.cmd --prefix backend test -- tests/symbol-encyclopedia-data.test.ts tests/runtime-symbol-matcher.test.ts
```

Expected: FAIL because symbols do not exist.

**Step 3: Add encyclopedia entries**

Add full localized entries:

- `apple`, category `object`, subcategory `food`
- `fruit`, category `object`, subcategory `food`
- `rice`, category `object`, subcategory `food`
- `egg`, category `object`, subcategory `food`
- `eye`, category `body`, subcategory `sense`

Each entry needs:

- `label`
- `aliases`
- `searchText`
- `coreMeanings`
- `lightReadings`
- `shadowReadings`
- `sceneModifiers`
- `contextQuestions`
- `metaphorHooks`
- `cardTitleSeeds`
- `smallPrescriptions`
- `safeReading`
- `avoidExpressions`
- `cultureNotes`

**Step 4: Add apple and eye disambiguation**

`apple` should reject apology context:

```ts
disambiguation: {
  ko: [
    {
      alias: "사과",
      confirmWhen: ["사과를 먹", "사과나무", "빨간 사과", "사과가 열"],
      rejectWhen: ["사과를 받", "사과했", "사과하", "미안", "용서"],
      fallback: "candidate_only",
    },
  ],
}
```

`eye` should reject snow context if needed, and `snow` should reject eye context.

**Step 5: Run focused tests**

Run:

```bash
npm.cmd --prefix backend test -- tests/symbol-encyclopedia-data.test.ts tests/runtime-symbol-matcher.test.ts tests/structured-dream-analysis.test.ts
```

Expected: PASS.

**Step 6: Commit**

```bash
git add backend/src/data/symbol-encyclopedia.ts backend/tests/symbol-encyclopedia-data.test.ts backend/tests/runtime-symbol-matcher.test.ts
git commit -m "feat(dream): add food and eye dream symbols"
```

### Task 5: Verify Retrieval and LLM Evidence Behavior

**Files:**
- Test: `backend/tests/dream-rag-retriever.test.ts`
- Test: `backend/tests/llm-dream-analysis.test.ts`

**Step 1: Add retrieval regression tests**

Test:

```ts
// Speech should not retrieve horse as confirmed evidence.
// Apple apology should not retrieve apple as confirmed evidence.
// Eating apple should retrieve apple.
```

**Step 2: Run tests**

Run:

```bash
npm.cmd --prefix backend test -- tests/dream-rag-retriever.test.ts tests/llm-dream-analysis.test.ts
```

Expected: PASS after matcher and data changes.

**Step 3: Run typecheck**

Run:

```bash
npm.cmd --prefix backend run typecheck
```

Expected: PASS.

**Step 4: Commit**

```bash
git add backend/tests/dream-rag-retriever.test.ts backend/tests/llm-dream-analysis.test.ts
git commit -m "test(dream): cover disambiguated retrieval evidence"
```

### Task 6: Final Full Verification

**Files:**
- No code changes expected.

**Step 1: Run focused backend test suite**

Run:

```bash
npm.cmd --prefix backend test -- tests/runtime-symbol-matcher.test.ts tests/symbol-encyclopedia-data.test.ts tests/symbol-encyclopedia-contract.test.ts tests/dream-rag-retriever.test.ts tests/structured-dream-analysis.test.ts tests/llm-dream-analysis.test.ts
```

Expected: PASS.

**Step 2: Run backend typecheck**

Run:

```bash
npm.cmd --prefix backend run typecheck
```

Expected: PASS.

**Step 3: Inspect git diff**

Run:

```bash
git diff --stat
git status --short
```

Expected: only intended files changed.

**Step 4: Final commit if needed**

If verification fixes were needed:

```bash
git add backend/src backend/tests
git commit -m "chore(dream): verify symbol disambiguation coverage"
```
