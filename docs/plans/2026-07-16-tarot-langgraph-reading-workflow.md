# Tarot LangGraph Reading Workflow Pilot Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build and evaluate a feature-flagged LangGraph workflow for preset and free-form question one-card tarot, using 12 reviewed card profiles before authoring the full 78-card production corpus.

**Architecture:** Keep the existing API route as the owner of authentication, entitlement, persistence, and HTTP responses. Add a request-scoped backend graph that resolves a typed question brief, applies scope policy, builds exact-card grounding, generates a structured interpretation and display draft, validates it, and permits at most one repair or regeneration. Production remains on the legacy prompt until the pilot evaluation is approved and all 78 profiles are complete.

**Tech Stack:** TypeScript, Node.js 22, Vitest, `@langchain/langgraph` 1.x `StateGraph`/`StateSchema`, Zod 4, existing OpenAI Responses API provider, Next.js App Router, React 19.

---

## Scope and Guardrails

This plan implements Phase 1 of the approved design in
`docs/plans/2026-07-16-tarot-langgraph-reading-workflow-design.md`.

Included:

- canonical preset/free-form request contracts
- canonical preset question catalog with reusable intent keys
- free-form structured question resolution with category-default fallback
- deterministic scope policy
- 12-card reviewed interpretation-profile pilot
- selected-orientation grounding
- structured generation draft and validator
- bounded LangGraph repair/regeneration
- feature-flagged backend and API integration
- same-card retry UI
- repeatable quality evaluation

Not included:

- production activation for all users
- the remaining 66 card profiles
- daily one-card migration
- three-card synthesis migration
- chat memory, checkpoints, tools, or follow-up questions
- local dictionary or template fallback

Before implementation, use `@test-driven-development`. Run commands from
`C:\Users\amy\Desktop\manyang` unless a step gives another working directory.

## Task 1: Disable Provider-Side Response Storage

**Files:**

- Modify: `backend/tests/openai-responses-provider.test.ts`
- Modify: `backend/src/services/openai-responses-provider.ts:101-137`

**Step 1: Add the failing provider-body assertion**

In the existing structured-output request test, add:

```ts
expect(body.store).toBe(false);
```

**Step 2: Run the focused test**

Run:

```bash
npm test --workspace @manyang/backend -- tests/openai-responses-provider.test.ts
```

Expected: FAIL because `store` is currently omitted.

**Step 3: Add the provider option**

Add `store: false` beside `model`, `instructions`, and `input` in the Responses API request body:

```ts
body: JSON.stringify({
  model: request.model ?? this.model,
  store: false,
  instructions: request.instructions,
  input: request.input,
  reasoning: { effort: this.reasoningEffort },
  text: {
    format: {
      type: "json_schema",
      name: request.schemaName,
      strict: true,
      schema: request.jsonSchema,
    },
  },
}),
```

**Step 4: Verify the provider**

Run:

```bash
npm test --workspace @manyang/backend -- tests/openai-responses-provider.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/src/services/openai-responses-provider.ts backend/tests/openai-responses-provider.test.ts
git commit -m "fix(llm): disable responses api storage"
```

## Task 2: Add the Shared Tarot Request Contract

**Files:**

- Create: `packages/contracts/src/tarot.ts`
- Create: `packages/contracts/src/tarot.test.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `packages/contracts/package.json`

**Step 1: Write failing contract tests**

Create `packages/contracts/src/tarot.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import {
  MAX_CUSTOM_TAROT_QUESTION_LENGTH,
  TAROT_QUESTION_STATE_KEYS,
  isTarotQuestionStateKey,
} from "./tarot";

describe("tarot contracts", () => {
  test("keeps the six supported question state keys stable", () => {
    expect(TAROT_QUESTION_STATE_KEYS).toEqual([
      "mind_complex",
      "relationship_concern",
      "work_blocked",
      "reality_anxiety",
      "decision_point",
      "daily_signal",
    ]);
  });

  test("validates question state keys and the free-form limit", () => {
    expect(isTarotQuestionStateKey("relationship_concern")).toBe(true);
    expect(isTarotQuestionStateKey("unknown")).toBe(false);
    expect(MAX_CUSTOM_TAROT_QUESTION_LENGTH).toBe(80);
  });
});
```

**Step 2: Run the contract test**

Run:

```bash
npm test --workspace @manyang/contracts -- src/tarot.test.ts
```

Expected: FAIL because `tarot.ts` does not exist.

**Step 3: Implement transport-safe types**

Create `packages/contracts/src/tarot.ts`:

```ts
export const TAROT_QUESTION_STATE_KEYS = [
  "mind_complex",
  "relationship_concern",
  "work_blocked",
  "reality_anxiety",
  "decision_point",
  "daily_signal",
] as const;

export type TarotQuestionStateKey = (typeof TAROT_QUESTION_STATE_KEYS)[number];

export const TAROT_QUESTION_DOMAINS = [
  "self",
  "relationship",
  "work",
  "money",
  "choice",
  "daily",
] as const;

export type TarotQuestionDomain = (typeof TAROT_QUESTION_DOMAINS)[number];

export const MAX_CUSTOM_TAROT_QUESTION_LENGTH = 80;

export type TarotQuestionRequestContext =
  | {
      kind: "preset";
      stateKey: TarotQuestionStateKey;
      questionKey: string;
    }
  | {
      kind: "freeform";
      stateKey: TarotQuestionStateKey;
      questionText: string;
    };

export function isTarotQuestionStateKey(value: unknown): value is TarotQuestionStateKey {
  return (
    typeof value === "string" &&
    (TAROT_QUESTION_STATE_KEYS as readonly string[]).includes(value)
  );
}
```

Export the values and types from `packages/contracts/src/index.ts` and add
`"./tarot": "./src/tarot.ts"` to package exports.

**Step 4: Verify contracts**

Run:

```bash
npm test --workspace @manyang/contracts -- src/tarot.test.ts
npm run typecheck --workspace @manyang/contracts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/contracts
git commit -m "feat(tarot): add shared question request contract"
```

## Task 3: Create the Shared Tarot Content Package

**Files:**

- Create: `packages/content/package.json`
- Create: `packages/content/tsconfig.json`
- Create: `packages/content/src/index.ts`
- Create: `packages/content/src/tarot/questions.ts`
- Create: `packages/content/src/tarot/questions.test.ts`
- Modify: `package.json`
- Modify: `backend/package.json`
- Modify: `frontend/package.json`
- Modify: `frontend/src/lib/tarot-question-prompts.ts`
- Modify: `frontend/src/lib/tarot-question-prompts.test.ts`
- Modify: `package-lock.json`

**Step 1: Write the question-catalog tests**

The shared catalog test must assert:

```ts
expect(tarotQuestionStates).toHaveLength(6);
expect(tarotQuestionStates.every((state) => state.questions.length === 5)).toBe(true);
expect(new Set(tarotQuestionStates.flatMap((state) =>
  state.questions.map((question) => `${state.key}:${question.key}`),
)).size).toBe(30);
expect(tarotQuestionStates.flatMap((state) => state.questions)
  .every((question) => question.intentKey.length > 0)).toBe(true);
```

Also test that `getTarotQuestionByKey` returns canonical text and rejects an
unknown state/question pair.

**Step 2: Run the missing-package test**

Run:

```bash
npm test --workspace @manyang/content
```

Expected: FAIL because the workspace package does not exist.

**Step 3: Create the package**

Use this package manifest:

```json
{
  "name": "@manyang/content",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./tarot": "./src/tarot/questions.ts"
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

Copy the strict compiler settings from `packages/contracts/tsconfig.json`.

**Step 4: Move the canonical catalog**

Move the six visible states and 30 questions from
`frontend/src/lib/tarot-question-prompts.ts` into
`packages/content/src/tarot/questions.ts`.

Add one of these stable intent keys to every question:

```ts
export const TAROT_QUESTION_INTENT_KEYS = [
  "inner_focus",
  "hidden_emotion",
  "draining_pattern",
  "relief_point",
  "needed_attitude",
  "relationship_current",
  "relationship_caution",
  "relationship_blind_spot",
  "work_bottleneck",
  "next_focus",
  "overholding",
  "practical_check",
  "choice_criterion",
  "daily_signal",
  "supportive_energy",
] as const;
```

The catalog owns visible labels, question text, and `intentKey`. It does not
own backend prompt instructions.

Keep `createCustomTarotQuestionPrompt` in the frontend adapter because it is a
UI helper. Re-export shared catalog values and types from that adapter so
existing UI imports do not change broadly.

**Step 5: Wire workspace dependencies**

Add `@manyang/content: "0.1.0"` to backend and frontend dependencies. Update
root scripts so `test` and `typecheck` include `@manyang/content` between
contracts and backend.

Run:

```bash
npm install
```

Expected: `package-lock.json` records the new workspace.

**Step 6: Verify content and compatibility**

Run:

```bash
npm test --workspace @manyang/content
npm test --workspace frontend -- src/lib/tarot-question-prompts.test.ts
npm run typecheck --workspace @manyang/content
npm run typecheck --workspace frontend
```

Expected: PASS with the same visible six states and 30 questions.

**Step 7: Commit**

```bash
git add package.json package-lock.json packages/content backend/package.json frontend/package.json frontend/src/lib/tarot-question-prompts.ts frontend/src/lib/tarot-question-prompts.test.ts
git commit -m "refactor(tarot): centralize question content"
```

## Task 4: Canonicalize Preset and Free-Form API Requests

**Files:**

- Modify: `frontend/src/app/api/tarot/readings/route.ts:167-363`
- Modify: `frontend/src/app/api/tarot/readings/route.test.ts`
- Modify: `frontend/src/lib/daily-tarot.ts:40-66`

**Step 1: Add failing route tests**

Add tests for:

1. a preset request containing only `kind`, `stateKey`, and `questionKey`
2. canonical label/text resolution on the backend
3. rejection of an unknown preset question key
4. normalization and acceptance of a free-form question up to 80 characters
5. rejection of an empty or 81-character free-form question
6. ignoring tampered legacy `stateLabel` and `questionText` for a preset

Use the new request shape:

```ts
question: {
  kind: "preset",
  stateKey: "mind_complex",
  questionKey: "held_feeling",
}
```

and:

```ts
question: {
  kind: "freeform",
  stateKey: "relationship_concern",
  questionText: "친구에게 먼저 연락해도 괜찮을까?",
}
```

**Step 2: Run the focused route tests**

Run:

```bash
npm test --workspace frontend -- src/app/api/tarot/readings/route.test.ts
```

Expected: FAIL because the route only accepts the expanded legacy
`questionContext`.

**Step 3: Add a request-only parser**

Replace the permissive `isDailyTarotQuestionContext` request check with a
normalizer that returns:

```ts
type ResolvedTarotQuestionRequest = {
  request: TarotQuestionRequestContext;
  context: DailyTarotQuestionContext;
};
```

Rules:

- preset: resolve state, label, question text, and intent from
  `@manyang/content`; ignore client labels/text
- free-form: normalize repeated whitespace, enforce 1..80 characters, create
  the stable `custom_<hash>` storage key server-side
- legacy preset payload: accept `questionContext.stateKey/questionKey` for one
  compatibility release, but canonicalize label/text from shared content
- legacy custom payload: accept only a `custom_` key with valid state and
  valid 1..80 character text

Do not trust a client-supplied `intentKey`.

**Step 4: Separate request and stored context types**

Keep `DailyTarotQuestionContext` as the expanded display/storage shape. Add
the request union from `@manyang/contracts/tarot` only to the HTTP request
type.

`createTarotReadingInput` must pass both the canonical expanded context and
the request source needed by the backend resolver.

**Step 5: Re-run route tests**

Run:

```bash
npm test --workspace frontend -- src/app/api/tarot/readings/route.test.ts
npm run typecheck --workspace frontend
```

Expected: PASS.

**Step 6: Commit**

```bash
git add frontend/src/app/api/tarot/readings/route.ts frontend/src/app/api/tarot/readings/route.test.ts frontend/src/lib/daily-tarot.ts
git commit -m "fix(tarot): canonicalize question requests"
```

## Task 5: Define Question Contracts and Preset Resolution

**Files:**

- Create: `backend/src/services/tarot-question-contracts.ts`
- Create: `backend/src/services/tarot-question-contracts.test.ts`
- Create: `backend/src/services/tarot-question-resolver.ts`
- Create: `backend/src/services/tarot-question-resolver.test.ts`
- Create: `backend/src/services/tarot-scope-policy.ts`
- Create: `backend/src/services/tarot-scope-policy.test.ts`

**Step 1: Write failing contract-completeness tests**

Test that every `intentKey` used by the shared 30-question catalog has exactly
one backend contract:

```ts
const usedIntentKeys = new Set(
  tarotQuestionStates.flatMap((state) =>
    state.questions.map((question) => question.intentKey),
  ),
);

expect(new Set(Object.keys(tarotQuestionContracts))).toEqual(usedIntentKeys);
```

Each contract must have:

- one primary domain
- one ask type
- a direct-answer target
- at least two required answer elements
- at least one allowed interpretation mode
- a closing mode
- explicit forbidden claims

**Step 2: Run the missing-module tests**

Run:

```bash
npm test --workspace @manyang/backend -- src/services/tarot-question-contracts.test.ts
```

Expected: FAIL because the module does not exist.

**Step 3: Implement reusable contracts**

Import the shared `TarotQuestionDomain` type from
`@manyang/contracts/tarot`. Define the backend-only ask type and
interpretation mode as unions:

```ts
type TarotQuestionAskType =
  | "emotion"
  | "cause"
  | "action"
  | "choice"
  | "outlook"
  | "reflection";

type TarotInterpretationMode =
  | "direct_answer"
  | "hidden_cause"
  | "inner_conflict"
  | "question_reversal"
  | "developing_process"
  | "boundary";
```

Do not add phrase palettes or sentence templates. Contracts describe semantic
requirements only.

**Step 4: Write preset resolver tests**

Test that preset resolution:

- never calls the provider
- preserves canonical question text
- copies required elements from the mapped contract
- returns `source: "preset"`
- uses the selected category default when an intent mapping is unavailable

The returned type is:

```ts
type QuestionBrief = {
  source: "preset" | "freeform" | "category_default";
  originalQuestion: string;
  primaryDomain: TarotQuestionDomain;
  secondaryDomains: TarotQuestionDomain[];
  askType: TarotQuestionAskType;
  subject: string;
  directAnswerTarget: string;
  emotionalContext?: string;
  timeHorizon: "now" | "near" | "general";
  answerMode: TarotAnswerMode;
  sensitivity: "normal" | "bounded" | "crisis";
  needsReframing: boolean;
  requiredElements: TarotAnswerElement[];
  allowedModes: TarotInterpretationMode[];
  forbiddenClaims: TarotForbiddenClaim[];
};
```

**Step 5: Implement deterministic preset resolution**

Preset resolution combines:

- canonical catalog record
- reusable backend intent contract
- category-specific default subject and time horizon

It must not invoke an LLM.

**Step 6: Implement and test scope policy**

Test deterministic transformations for:

- third-party feeling certainty -> relationship dynamics/user perspective
- fixed future -> pressures/direction/decision criteria
- medical/legal/financial authority -> reflective bounded mode
- supernatural certainty -> personal meaning/memory
- crisis -> dedicated blocked scope

The policy returns a new brief and a list of applied policy codes. It does not
mutate the input.

**Step 7: Verify**

Run:

```bash
npm test --workspace @manyang/backend -- src/services/tarot-question-contracts.test.ts src/services/tarot-question-resolver.test.ts src/services/tarot-scope-policy.test.ts
npm run typecheck --workspace @manyang/backend
```

Expected: PASS.

**Step 8: Commit**

```bash
git add backend/src/services/tarot-question-contracts.ts backend/src/services/tarot-question-contracts.test.ts backend/src/services/tarot-question-resolver.ts backend/src/services/tarot-question-resolver.test.ts backend/src/services/tarot-scope-policy.ts backend/src/services/tarot-scope-policy.test.ts
git commit -m "feat(tarot): resolve preset question intent"
```

## Task 6: Resolve Free-Form Questions with Structured Output

**Files:**

- Modify: `backend/src/services/tarot-question-resolver.ts`
- Modify: `backend/src/services/tarot-question-resolver.test.ts`

**Step 1: Add failing free-form tests**

Test:

- a colloquial relationship question resolves to relationship + choice
- a mixed work/money question keeps one primary and one secondary domain
- a statement without a question mark resolves to reflective mode
- malformed classifier JSON uses the selected category default
- provider timeout uses the selected category default
- injected text such as `ignore previous instructions` remains quoted user data
- the original normalized question remains unchanged in the brief

Use a fake provider that records requests.

**Step 2: Run the resolver tests**

Run:

```bash
npm test --workspace @manyang/backend -- src/services/tarot-question-resolver.test.ts
```

Expected: FAIL because only preset resolution exists.

**Step 3: Add the classifier schema**

The classifier output must be bounded:

```ts
const TAROT_QUESTION_CLASSIFICATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    primaryDomain: { enum: ["self", "relationship", "work", "money", "choice", "daily"] },
    secondaryDomains: {
      type: "array",
      maxItems: 2,
      items: { enum: ["self", "relationship", "work", "money", "choice", "daily"] },
    },
    askType: { enum: ["emotion", "cause", "action", "choice", "outlook", "reflection"] },
    subject: { type: "string", minLength: 1, maxLength: 80 },
    directAnswerTarget: { type: "string", minLength: 1, maxLength: 140 },
    emotionalContext: { type: "string", maxLength: 140 },
    timeHorizon: { enum: ["now", "near", "general"] },
    sensitivity: { enum: ["normal", "bounded", "crisis"] },
    needsReframing: { type: "boolean" },
  },
  required: [
    "primaryDomain",
    "secondaryDomains",
    "askType",
    "subject",
    "directAnswerTarget",
    "emotionalContext",
    "timeHorizon",
    "sensitivity",
    "needsReframing",
  ],
} as const;
```

**Step 4: Implement the free-form resolver**

Call the existing `DreamReadingLlmProvider.generateJson` with:

- a dedicated schema name
- an optional classifier model
- a shorter classifier timeout than the main reading
- instructions that classify and extract only
- JSON input containing `selectedCategory` and `userQuestion`

The classifier must not receive card data.

Parse every enum and bounded string locally. On any provider or parse failure,
return `source: "category_default"` and preserve the original question.

**Step 5: Verify classifier behavior**

Run:

```bash
npm test --workspace @manyang/backend -- src/services/tarot-question-resolver.test.ts
npm run typecheck --workspace @manyang/backend
```

Expected: PASS.

**Step 6: Commit**

```bash
git add backend/src/services/tarot-question-resolver.ts backend/src/services/tarot-question-resolver.test.ts
git commit -m "feat(tarot): classify free-form questions"
```

## Task 7: Add the 12-Card Interpretation-Profile Pilot

**Files:**

- Create: `packages/content/src/tarot/reading-profiles.ts`
- Create: `packages/content/src/tarot/reading-profiles.test.ts`
- Modify: `packages/content/src/index.ts`
- Modify: `packages/content/package.json`
- Reference: `docs/tarot/original-major-arcana-deck-guide.md`
- Reference: `docs/tarot/original-minor-arcana-deck-guide.md`
- Reference images: `ref/tarot cards/*.png`
- Reference images: `ref/tarot cards minor/*.png`

**Step 1: Write the profile-schema tests**

Use this exact pilot key set:

```ts
export const PILOT_TAROT_CARD_KEYS = [
  "major:04",
  "major:14",
  "major:17",
  "major:18",
  "minor:cups:11",
  "minor:pentacles:01",
  "minor:pentacles:03",
  "minor:pentacles:09",
  "minor:swords:02",
  "minor:swords:07",
  "minor:swords:14",
  "minor:wands:01",
] as const;
```

Tests must require:

- exactly 12 profiles and no duplicate key
- two to four unique scene evidence IDs per card
- non-empty core dynamic, human pattern, healthy/distorted expression, and tension
- complete self/relationship/work/money/choice/daily applications
- complete upright and reversed movement/behavior/caution
- reversed text not equal to or mechanically prefixed from upright text
- a shared content version

**Step 2: Run the missing-profile test**

Run:

```bash
npm test --workspace @manyang/content -- src/tarot/reading-profiles.test.ts
```

Expected: FAIL because the profile module does not exist.

**Step 3: Implement the profile types and lookup**

Export:

```ts
export type TarotCardInterpretationProfile = {
  cardKey: string;
  coreDynamic: string;
  humanPattern: string;
  emotionalTone: readonly string[];
  sceneEvidence: readonly {
    id: string;
    visual: string;
    interpretiveUse: string;
  }[];
  uprightExpression: TarotOrientationExpression;
  reversedExpression: TarotOrientationExpression;
  healthyExpression: string;
  distortedExpression: string;
  tensions: readonly string[];
  domainApplications: Readonly<Record<TarotQuestionDomain, string>>;
  contentVersion: string;
};
```

Import `TarotQuestionDomain` from `@manyang/contracts/tarot`; the content
package must not depend on backend service types.

Add `getTarotCardInterpretationProfile(cardKey)` returning the canonical
profile or `null`.

**Step 4: Author four major profiles**

Author Emperor, Temperance, Star, and Moon using the guide and each exact deck
image. Do not copy generic symbolism that is absent from the image.

For each card, record image review in a nearby source comment:

```ts
// Source reviewed: exact deck image + original major arcana guide.
```

Run the profile test after these four entries. Expected: FAIL only on missing
pilot keys.

**Step 5: Author four numbered/ace minor profiles**

Add Ace of Pentacles, Three of Pentacles, Nine of Pentacles, and Two of
Swords. Use the exact image, not suit/rank defaults.

Run the profile test. Expected: FAIL only on the remaining four keys.

**Step 6: Author the final four minor profiles**

Add Page of Cups, Seven of Swords, King of Swords, and Ace of Wands.

Run:

```bash
npm test --workspace @manyang/content -- src/tarot/reading-profiles.test.ts
npm run typecheck --workspace @manyang/content
```

Expected: PASS.

**Step 7: Commit**

```bash
git add packages/content/src/tarot/reading-profiles.ts packages/content/src/tarot/reading-profiles.test.ts packages/content/src/index.ts packages/content/package.json
git commit -m "feat(tarot): add pilot interpretation profiles"
```

## Task 8: Build Selected-Orientation Card Grounding

**Files:**

- Create: `backend/src/services/tarot-grounding-builder.ts`
- Create: `backend/src/services/tarot-grounding-builder.test.ts`
- Modify: `backend/src/services/tarot-reading-prompt.ts:54-88`
- Modify: `backend/src/services/llm-tarot-reading.test.ts`

**Step 1: Write failing grounding tests**

For a pilot card, assert:

- the requested orientation expression is present
- the opposite orientation expression is absent from serialized grounding
- only the primary and supported secondary domain applications are present
- two or three scene evidence records are selected
- every evidence ID exists in the profile
- `cardMessage`, `dailyFlow`, `phrasePalette`, and opposite orientation names
  are absent

For a non-pilot card, assert a typed `profile_missing` result. Do not fall back
to generic suit/rank content.

**Step 2: Run the grounding tests**

Run:

```bash
npm test --workspace @manyang/backend -- src/services/tarot-grounding-builder.test.ts
```

Expected: FAIL because the builder does not exist.

**Step 3: Require stable card identity**

Update `TarotPromptCard` so `cardKey` is required. The frontend route already
resolves cards from `tarotCards`, where major and minor deck entries have a
stable key.

Update test fixtures to include `cardKey`.

**Step 4: Implement deterministic grounding**

Return:

```ts
type TarotCardGrounding = {
  cardKey: string;
  nameKo: string;
  orientation: TarotReadingOrientation;
  coreDynamic: string;
  humanPattern: string;
  emotionalTone: string[];
  orientationExpression: TarotOrientationExpression;
  healthyExpression: string;
  distortedExpression: string;
  tensions: string[];
  domainApplications: Partial<Record<TarotQuestionDomain, string>>;
  sceneEvidence: TarotSceneEvidence[];
  forbiddenClaims: TarotForbiddenClaim[];
  profileVersion: string;
};
```

Evidence selection is deterministic and stable for the same card/question
brief. Do not use randomness.

**Step 5: Verify**

Run:

```bash
npm test --workspace @manyang/backend -- src/services/tarot-grounding-builder.test.ts src/services/llm-tarot-reading.test.ts
npm run typecheck --workspace @manyang/backend
```

Expected: PASS.

**Step 6: Commit**

```bash
git add backend/src/services/tarot-grounding-builder.ts backend/src/services/tarot-grounding-builder.test.ts backend/src/services/tarot-reading-prompt.ts backend/src/services/llm-tarot-reading.test.ts
git commit -m "feat(tarot): build card-specific grounding"
```

## Task 9: Add the Structured Workflow Generation Contract

**Files:**

- Modify: `backend/src/services/tarot-reading-prompt.ts`
- Create: `backend/src/services/tarot-reading-prompt.workflow.test.ts`

**Step 1: Write failing workflow-prompt tests**

Assert that the new question workflow prompt:

- includes the exact `QuestionBrief`
- includes selected-orientation grounding only
- lists allowed interpretation modes
- requires `answeredTarget` to copy `directAnswerTarget`
- requires `overview` to start with `thesis`
- requires one or two known evidence IDs
- omits `phrasePalette`, old question frames, full upright/reversed data,
  `cardMessage`, and fixed four-sentence instructions
- treats the original free-form question as quoted data

Keep existing legacy prompt tests green for daily and three-card spreads.

**Step 2: Run the prompt tests**

Run:

```bash
npm test --workspace @manyang/backend -- src/services/tarot-reading-prompt.workflow.test.ts
```

Expected: FAIL because the workflow prompt does not exist.

**Step 3: Add the workflow schema**

Add a separate schema without replacing the legacy schema:

```ts
export const TAROT_WORKFLOW_READING_DRAFT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    interpretation: {
      type: "object",
      additionalProperties: false,
      properties: {
        mode: {
          enum: [
            "direct_answer",
            "hidden_cause",
            "inner_conflict",
            "question_reversal",
            "developing_process",
            "boundary",
          ],
        },
        thesis: { type: "string", minLength: 20, maxLength: 220 },
        usedSymbolIds: {
          type: "array",
          minItems: 1,
          maxItems: 2,
          uniqueItems: true,
          items: { type: "string" },
        },
        answeredTarget: { type: "string", minLength: 1, maxLength: 160 },
      },
      required: ["mode", "thesis", "usedSymbolIds", "answeredTarget"],
    },
    display: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string", minLength: 1, maxLength: 80 },
        keywords: {
          type: "array",
          minItems: 3,
          maxItems: 3,
          items: { type: "string", minLength: 1, maxLength: 24 },
        },
        overview: { type: "string", minLength: 180, maxLength: 900 },
        cardReadings: { type: "array", maxItems: 0 },
      },
      required: ["title", "keywords", "overview", "cardReadings"],
    },
  },
  required: ["interpretation", "display"],
} as const;
```

**Step 4: Implement initial and retry prompt builders**

Export:

```ts
buildQuestionTarotWorkflowPrompt(input)
buildQuestionTarotRetryPrompt(input, mode, validationIssues)
```

Repair input includes the accepted thesis and evidence and prohibits changing
them. Regeneration input excludes the rejected prose and includes only issue
codes plus original brief/grounding.

**Step 5: Verify**

Run:

```bash
npm test --workspace @manyang/backend -- src/services/tarot-reading-prompt.workflow.test.ts src/services/llm-tarot-reading.test.ts
npm run typecheck --workspace @manyang/backend
```

Expected: PASS.

**Step 6: Commit**

```bash
git add backend/src/services/tarot-reading-prompt.ts backend/src/services/tarot-reading-prompt.workflow.test.ts
git commit -m "feat(tarot): add structured workflow prompt"
```

## Task 10: Validate Grounding, Scope, and Display Quality

**Files:**

- Create: `backend/src/services/tarot-reading-validator.ts`
- Create: `backend/src/services/tarot-reading-validator.test.ts`

**Step 1: Write failing validator tests**

Add fixtures for:

- valid draft -> `pass`
- unknown symbol ID -> `grounding_error`
- disallowed interpretation mode -> `grounding_error`
- mismatched `answeredTarget` -> `grounding_error`
- overview not beginning with thesis -> `style_error`
- repeated keyword/ending language -> `style_error`
- specific fabricated amount/date/transaction -> `safety_error`
- certain third-party hidden-thought claim -> `safety_error`
- leaked internal field name -> `style_error`
- malformed display shape -> `grounding_error`

**Step 2: Run the validator tests**

Run:

```bash
npm test --workspace @manyang/backend -- src/services/tarot-reading-validator.test.ts
```

Expected: FAIL because the validator does not exist.

**Step 3: Implement parsing and issue codes**

Use:

```ts
type TarotReadingValidation =
  | { status: "pass"; draft: TarotReadingDraft }
  | {
      status: "style_error" | "grounding_error" | "safety_error";
      issues: TarotReadingValidationIssue[];
    };
```

Validate:

- exact target copy
- `overview.startsWith(thesis)`
- allowed mode membership
- symbol ID subset
- unique three keywords
- required fields and limits
- internal field leaks
- unsupported certainty and concrete-claim patterns

Keep claim patterns narrow. A general reference to money or a contract is not
itself an error; a fabricated exact amount, date, approval, diagnosis, or
private thought is.

**Step 4: Add repetition checks**

Reject:

- duplicate compacted keywords
- the same sentence repeated
- consecutive sentences with the same normalized opening
- known legacy frame endings repeated in more than one sentence

Do not maintain an ever-growing list of awkward Korean examples. Check
structure and repetition instead.

**Step 5: Verify**

Run:

```bash
npm test --workspace @manyang/backend -- src/services/tarot-reading-validator.test.ts
npm run typecheck --workspace @manyang/backend
```

Expected: PASS.

**Step 6: Commit**

```bash
git add backend/src/services/tarot-reading-validator.ts backend/src/services/tarot-reading-validator.test.ts
git commit -m "feat(tarot): validate generated reading grounding"
```

## Task 11: Assemble the Bounded LangGraph Workflow

**Files:**

- Modify: `backend/package.json`
- Modify: `package-lock.json`
- Create: `backend/src/services/tarot-reading-workflow.ts`
- Create: `backend/src/services/tarot-reading-workflow.test.ts`

**Step 1: Install graph dependencies**

Run:

```bash
npm install --workspace @manyang/backend @langchain/langgraph@^1.4.8 @langchain/core@^1.1.48 zod@^4.2.0
```

Expected: backend dependencies and lockfile update without changing unrelated
packages.

**Step 2: Write failing workflow branch tests**

Inject fake node dependencies and test:

- preset path resolves without a classifier call
- free-form path uses one classifier call
- classifier failure still reaches generation with `category_default`
- valid generation completes with one generation call
- style error performs one repair and preserves thesis/evidence
- grounding error performs one regeneration from original brief/grounding
- failed retry stops after two generation attempts
- provider failure does not run validation retry
- profile missing fails without a local reading
- card, orientation, and original question never change

**Step 3: Run the workflow tests**

Run:

```bash
npm test --workspace @manyang/backend -- src/services/tarot-reading-workflow.test.ts
```

Expected: FAIL because the workflow does not exist.

**Step 4: Define request-scoped state**

Use the current LangGraph 1.x Graph API:

```ts
import {
  END,
  START,
  StateGraph,
  StateSchema,
  type ConditionalEdgeRouter,
  type GraphNode,
} from "@langchain/langgraph";
import { z } from "zod/v4";

const TarotWorkflowState = new StateSchema({
  request: z.custom<ValidatedTarotRequest>(),
  questionBrief: z.custom<QuestionBrief>().optional(),
  scopeDecision: z.custom<TarotScopeDecision>().optional(),
  grounding: z.custom<TarotCardGrounding>().optional(),
  draft: z.custom<TarotReadingDraft>().optional(),
  validation: z.custom<TarotReadingValidation>().optional(),
  retryMode: z.enum(["repair", "regenerate"]).optional(),
  attemptCount: z.number().int().min(0).default(0),
  finalReading: z.custom<TarotGeneratedReading>().optional(),
  failure: z.custom<TarotReadingFailure>().optional(),
});
```

Do not add a checkpointer or invoke configuration with a `thread_id`.

**Step 5: Add deterministic nodes and edges**

Build:

```text
START
-> resolveQuestion
-> applyScopePolicy
-> buildGrounding
-> generateReading
-> validateReading
   pass -> finalize -> END
   style_error + attempt 0 -> repairReading -> validateReading
   grounding/safety_error + attempt 0 -> regenerateReading -> validateReading
   otherwise -> fail -> END
```

The repair and regeneration nodes both set `attemptCount: 1`. The validation
router must never route to either retry node when `attemptCount >= 1`.

**Step 6: Verify graph behavior**

Run:

```bash
npm test --workspace @manyang/backend -- src/services/tarot-reading-workflow.test.ts
npm run typecheck --workspace @manyang/backend
```

Expected: PASS with no snapshot/checkpoint files.

**Step 7: Commit**

```bash
git add backend/package.json package-lock.json backend/src/services/tarot-reading-workflow.ts backend/src/services/tarot-reading-workflow.test.ts
git commit -m "feat(tarot): add bounded langgraph workflow"
```

## Task 12: Integrate the Workflow Behind a Feature Flag

**Files:**

- Modify: `backend/src/services/llm-tarot-reading.ts:27-330`
- Modify: `backend/src/services/llm-tarot-reading.test.ts`
- Modify: `backend/src/index.ts`
- Modify: `frontend/src/app/api/tarot/readings/route.ts:198-750`
- Modify: `frontend/src/app/api/tarot/readings/route.test.ts`

**Step 1: Add failing facade and route tests**

Test:

- default mode continues using the legacy path
- `langgraph_pilot` uses the graph for question one-card
- `langgraph_pilot` rejects non-pilot cards with retryable
  `profile_missing`
- daily and three-card spreads remain on the legacy path
- route resolves `MANYANG_TAROT_WORKFLOW_MODE`
- route resolves `MANYANG_TAROT_CLASSIFIER_MODEL`
- workflow failure does not persist or increment user/guest usage
- successful workflow persists and increments exactly once
- telemetry excludes raw free-form text

**Step 2: Run focused integration tests**

Run:

```bash
npm test --workspace @manyang/backend -- src/services/llm-tarot-reading.test.ts
npm test --workspace frontend -- src/app/api/tarot/readings/route.test.ts
```

Expected: FAIL because the options and feature flag do not exist.

**Step 3: Extend facade options**

Add:

```ts
type TarotWorkflowMode = "legacy" | "langgraph_pilot";

type GenerateTarotReadingOptions = {
  provider?: DreamReadingLlmProvider;
  model?: string;
  classifierModel?: string;
  providerTimeoutMs?: number;
  classifierTimeoutMs?: number;
  workflowMode?: TarotWorkflowMode;
  onProviderError?: (error: unknown) => void;
  onWorkflowEvent?: (event: TarotWorkflowTelemetry) => void;
};
```

The public `generateTarotReadingForUser` remains the only facade imported by
the frontend route.

**Step 4: Route only the pilot spread**

Use the graph only when:

```ts
options.workflowMode === "langgraph_pilot" &&
input.spread === "question_one_card"
```

Otherwise execute the existing code unchanged.

Map the graph's validated display object back to the current
`TarotGeneratedReading` transport shape.

**Step 5: Add route environment resolution**

Supported values:

```text
MANYANG_TAROT_WORKFLOW_MODE=legacy|langgraph_pilot
MANYANG_TAROT_CLASSIFIER_MODEL=<small structured-output model>
MANYANG_TAROT_CLASSIFIER_TIMEOUT_MS=<bounded milliseconds>
```

Default workflow mode is `legacy`. Do not activate the pilot in committed
`.env` files.

**Step 6: Preserve failure and usage policy**

Map graph failures to product-safe unavailable reasons. Do not return a local
reading. Existing route behavior must continue to:

- persist only `status: "ok"`
- increment usage only after `status: "ok"`
- return retryable 503 for generation/validation failures
- avoid technical provider text in the response

**Step 7: Verify**

Run:

```bash
npm test --workspace @manyang/backend -- src/services/llm-tarot-reading.test.ts
npm test --workspace frontend -- src/app/api/tarot/readings/route.test.ts
npm run typecheck --workspace @manyang/backend
npm run typecheck --workspace frontend
```

Expected: PASS.

**Step 8: Commit**

```bash
git add backend/src/services/llm-tarot-reading.ts backend/src/services/llm-tarot-reading.test.ts backend/src/index.ts frontend/src/app/api/tarot/readings/route.ts frontend/src/app/api/tarot/readings/route.test.ts
git commit -m "feat(tarot): integrate workflow pilot"
```

## Task 13: Send Typed Questions and Retry the Same Card

**Files:**

- Modify: `frontend/src/components/question-tarot-client.tsx`
- Modify: `frontend/src/components/question-tarot-client.test.tsx`
- Modify: `frontend/src/lib/tarot-question-prompts.ts`
- Modify: `frontend/src/lib/tarot-question-prompts.test.ts`

**Step 1: Add failing UI contract tests**

Test source or extracted pure helpers for:

- preset selection sends `{ kind: "preset", stateKey, questionKey }`
- custom input sends `{ kind: "freeform", stateKey, questionText }`
- request body no longer sends client-owned `stateLabel`
- generation failure keeps `pendingSelections`
- error UI exposes `data-question-tarot-retry-reading`
- retry calls the API with the same card ID, orientation, state, and question
- retry does not call `createDailyTarotOptions` again

**Step 2: Run the component tests**

Run:

```bash
npm test --workspace frontend -- src/components/question-tarot-client.test.tsx src/lib/tarot-question-prompts.test.ts
```

Expected: FAIL because the component sends expanded context and resets to
question selection.

**Step 3: Build the typed request context**

Preset:

```ts
{
  kind: "preset",
  stateKey: selectedState.key,
  questionKey: selectedQuestion.key,
}
```

Free-form:

```ts
{
  kind: "freeform",
  stateKey: selectedState.key,
  questionText: selectedQuestion.text,
}
```

Track whether the selected question is preset or free-form without relying
only on display text.

**Step 4: Preserve the failed draw**

On a retryable reading failure:

- keep `pendingSelections`
- keep selected state and question
- show the already selected card in the error state
- label the primary command `리딩 다시 받기`
- call `submitQuestionReading` with `pendingSelections[0]`
- change to `generating` without returning to the fan deck

Keep a secondary command for returning to question selection.

**Step 5: Verify UI behavior**

Run:

```bash
npm test --workspace frontend -- src/components/question-tarot-client.test.tsx src/lib/tarot-question-prompts.test.ts
npm run typecheck --workspace frontend
npm run lint --workspace frontend
```

Expected: PASS.

**Step 6: Commit**

```bash
git add frontend/src/components/question-tarot-client.tsx frontend/src/components/question-tarot-client.test.tsx frontend/src/lib/tarot-question-prompts.ts frontend/src/lib/tarot-question-prompts.test.ts
git commit -m "feat(tarot): retry readings with the same card"
```

## Task 14: Upgrade the Tarot Quality Evaluation

**Files:**

- Modify: `backend/src/services/tarot-model-ab-eval.ts`
- Modify: `backend/tests/tarot-model-ab-eval.test.ts`
- Modify: `backend/src/scripts/run-tarot-model-ab-check.ts`
- Create: `backend/src/services/tarot-reading-quality-rubric.ts`
- Create: `backend/src/services/tarot-reading-quality-rubric.test.ts`

**Step 1: Write failing rubric tests**

Score or flag:

- direct answer
- card grounding
- question specificity
- card specificity
- natural Korean
- symbolic contribution
- bounded claims
- non-repetition

Add card-swap and question-swap fixture pairs. A generic reading should fail
specificity when it remains valid after either swap.

**Step 2: Add repeated-run report tests**

Extend reports with:

```ts
type TarotEvalVariant = "legacy" | "langgraph_pilot";

type TarotModelAbResult = {
  caseId: string;
  variant: TarotEvalVariant;
  model: string;
  runIndex: number;
  durationMs: number;
  automaticFlags: string[];
  // existing output fields
};
```

Test three runs per case and side-by-side legacy/workflow Markdown sections.

**Step 3: Run evaluation tests**

Run:

```bash
npm test --workspace @manyang/backend -- tests/tarot-model-ab-eval.test.ts src/services/tarot-reading-quality-rubric.test.ts
```

Expected: FAIL because variants, runs, and rubric do not exist.

**Step 4: Implement the rubric and report**

Automatic checks may flag objective properties. Keep naturalness and overall
tarot quality as explicit human-review columns rather than pretending a regex
can judge them.

Markdown must include a 1..5 human score table for:

```text
directness | card grounding | question fit | natural Korean |
symbolic value | boundedness | non-repetition | overall
```

**Step 5: Use the 12 pilot cases**

Update the CLI seed set to cover all pilot card keys, all six question
domains, both orientations, and at least these free-form shapes:

- colloquial relationship question
- mixed work/money question
- vague emotional statement
- future-certainty request
- third-party hidden-thought request
- prompt-injection-like text

Add `--runs` and `--variants` CLI options. Default to three runs and both
variants for pilot evaluation.

**Step 6: Verify offline evaluation code**

Run:

```bash
npm test --workspace @manyang/backend -- tests/tarot-model-ab-eval.test.ts src/services/tarot-reading-quality-rubric.test.ts
npm run typecheck --workspace @manyang/backend
```

Expected: PASS.

**Step 7: Run the live pilot when an API key is available**

Run:

```bash
npm run quality:tarot-ab --workspace @manyang/backend -- --models gpt-5-mini,gpt-5 --variants legacy,langgraph_pilot --runs 3 --timeout-ms 70000
```

Expected: JSON and Markdown reports under `output/eval`, with every requested
case/model/variant/run represented. Do not commit generated reports containing
private user text.

**Step 8: Commit**

```bash
git add backend/src/services/tarot-model-ab-eval.ts backend/tests/tarot-model-ab-eval.test.ts backend/src/scripts/run-tarot-model-ab-check.ts backend/src/services/tarot-reading-quality-rubric.ts backend/src/services/tarot-reading-quality-rubric.test.ts
git commit -m "test(tarot): add repeatable workflow quality eval"
```

## Task 15: Full Verification and Pilot Gate

**Files:**

- Modify only files required by verification fixes
- Do not enable `langgraph_pilot` by default

**Step 1: Run package tests**

```bash
npm test
```

Expected: contracts, content, backend, and frontend tests all PASS.

**Step 2: Run type checks**

```bash
npm run typecheck
```

Expected: PASS with strict optional-property and unchecked-index settings.

**Step 3: Run frontend static verification**

```bash
npm run lint
npm run build
```

Expected: PASS.

**Step 4: Check repository hygiene**

```bash
git diff --check
git status --short
```

Expected: no whitespace errors, generated eval output untracked/ignored, and
no `.env` changes.

**Step 5: Review the pilot gate**

Do not plan the remaining 66 profiles until:

- all graph branch tests pass
- no fallback path can return a successful reading
- pilot reports contain three runs per case
- human reviewers score the workflow against the legacy path
- latency and retry rate are acceptable
- the profile schema needs no further structural change

After approval, create a separate implementation plan for the remaining 66
profiles, full-deck completeness, sampled rollout, and production activation.

**Step 6: Commit verification fixes if any**

```bash
git add <only-files-changed-by-verification>
git commit -m "test(tarot): complete workflow pilot verification"
```

Skip this commit when verification required no code changes.

## Expected Pilot Outcome

- Production behavior remains unchanged by default.
- Preset questions use no classification call.
- Free-form questions use one bounded classification call and preserve the
  selected category as fallback.
- The main model receives one orientation, a typed question brief, and exact
  deck evidence.
- A valid result normally needs one generation call.
- A failed draft receives at most one repair or regeneration.
- A second failure returns no reading and consumes no usage.
- The UI retries with the same card, orientation, and question.
- The pilot produces comparable evidence before full 78-card authoring starts.
