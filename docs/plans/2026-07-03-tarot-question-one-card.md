# Tarot Question One-Card Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a question-based one-card tarot flow that is separate from daily tarot, uses the full 78-card deck, and is ready for a future rewarded-ad unlock model.

**Architecture:** Reuse the existing tarot card data, draw, LLM, persistence, and share pipeline. Add `question_one_card` as a new spread with explicit question metadata and its own usage key. Keep the UI on a separate `/tarot/question` route so `DailyTarotClient` does not absorb another large state machine.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Vitest, Supabase SQL migrations, existing `@manyang/backend` tarot LLM prompt builder.

---

## Context Notes

- There are unrelated unstaged changes in the working tree. Do not stage or revert them unless they are part of this task.
- Some required files already have unstaged edits: `backend/src/services/llm-tarot-reading.ts`, `backend/src/services/tarot-reading-prompt.ts`, `frontend/package.json`, and sharing-related files. Read their current contents before editing and preserve the existing user changes.
- The existing database has `tarot_readings.spread` constrained to `daily_one_card` and `daily_three_card`.
- The existing `tarot_readings` uniqueness is `(user_id, app_date, spread)`. Question tarot needs a future-proof `reading_key` so later rewarded-ad readings can create distinct rows.

## Task 1: Add Question Prompt Runtime Data

**Files:**
- Create: `frontend/src/lib/tarot-question-prompts.ts`
- Create: `frontend/src/lib/tarot-question-prompts.test.ts`

**Step 1: Write the failing test**

Create `frontend/src/lib/tarot-question-prompts.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import {
  getTarotQuestionByKey,
  getTarotQuestionStateByKey,
  tarotQuestionStates,
} from "./tarot-question-prompts";

describe("tarot question prompts", () => {
  test("defines six user states with five questions each", () => {
    expect(tarotQuestionStates).toHaveLength(6);
    for (const state of tarotQuestionStates) {
      expect(state.key).toMatch(/^[a-z_]+$/);
      expect(state.label.trim().length).toBeGreaterThan(0);
      expect(state.questions).toHaveLength(5);
      expect(new Set(state.questions.map((question) => question.key)).size).toBe(5);
      for (const question of state.questions) {
        expect(question.text).toContain("?");
        expect(question.text.length).toBeLessThanOrEqual(36);
      }
    }
  });

  test("looks up states and questions by stable keys", () => {
    expect(getTarotQuestionStateByKey("mind_complex")).toMatchObject({
      label: "마음이 복잡해",
    });
    expect(getTarotQuestionByKey("mind_complex", "held_feeling")).toMatchObject({
      text: "오늘 내 마음이 붙잡고 있는 건 뭐야?",
    });
    expect(getTarotQuestionByKey("mind_complex", "missing")).toBeNull();
    expect(getTarotQuestionStateByKey("missing")).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm --prefix frontend test -- src/lib/tarot-question-prompts.test.ts
```

Expected: FAIL because `tarot-question-prompts.ts` does not exist.

**Step 3: Write minimal implementation**

Create `frontend/src/lib/tarot-question-prompts.ts`:

```ts
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

export const tarotQuestionStates = [
  {
    key: "mind_complex",
    label: "마음이 복잡해",
    representativeQuestion: "오늘 내 마음이 붙잡고 있는 건 뭐야?",
    questions: [
      { key: "held_feeling", text: "오늘 내 마음이 붙잡고 있는 건 뭐야?" },
      { key: "unrecognized_feeling", text: "내가 인정하지 않고 있는 감정은?" },
      { key: "tiring_thought", text: "지금 나를 지치게 하는 생각은 어디서 오고 있을까?" },
      { key: "ease_point", text: "내 마음이 편해지려면 무엇을 봐야 할까?" },
      { key: "needed_attitude", text: "오늘 나에게 필요한 태도는?" },
    ],
  },
  {
    key: "relationship_concern",
    label: "관계가 신경 쓰여",
    representativeQuestion: "지금 이 관계에서 내가 봐야 할 마음은?",
    questions: [
      { key: "relationship_heart", text: "지금 이 관계에서 내가 봐야 할 마음은?" },
      { key: "between_us", text: "상대와 나 사이에 놓인 감정은?" },
      { key: "careful_feeling", text: "이 관계에서 조심해야 할 감정은?" },
      { key: "ease_clue", text: "관계를 더 편하게 만들 단서는?" },
      { key: "missed_part", text: "내가 이 관계에서 놓치고 있는 건?" },
    ],
  },
  {
    key: "work_blocked",
    label: "일이 막힌 느낌이야",
    representativeQuestion: "지금 이 일에서 가장 중요한 흐름은?",
    questions: [
      { key: "main_flow", text: "지금 이 일에서 가장 중요한 흐름은?" },
      { key: "focus_point", text: "오늘 내가 집중해야 할 핵심은?" },
      { key: "blocked_point", text: "막힌 일을 풀기 위해 봐야 할 지점은?" },
      { key: "next_direction", text: "이 프로젝트에서 다음으로 움직일 방향은?" },
      { key: "overholding", text: "지금 내가 너무 붙잡고 있는 건?" },
    ],
  },
  {
    key: "reality_anxiety",
    label: "돈이나 현실이 불안해",
    representativeQuestion: "지금 내 현실에서 점검해야 할 건 뭐야?",
    questions: [
      { key: "reality_check", text: "지금 내 현실에서 점검해야 할 건 뭐야?" },
      { key: "missed_resource", text: "돈이나 자원에서 놓치고 있는 부분은?" },
      { key: "stability_attitude", text: "안정감을 만들기 위해 필요한 태도는?" },
      { key: "keep_release", text: "지금 지켜야 할 것과 내려놓을 것은?" },
      { key: "next_practical_check", text: "현실적으로 다음에 확인해야 할 건?" },
    ],
  },
  {
    key: "decision_point",
    label: "선택을 앞두고 있어",
    representativeQuestion: "이 선택에서 내가 진짜 봐야 할 기준은?",
    questions: [
      { key: "real_criterion", text: "이 선택에서 내가 진짜 봐야 할 기준은?" },
      { key: "heart_or_reality", text: "마음과 현실 중 어디가 더 크게 말하고 있어?" },
      { key: "rushed_decision", text: "지금 성급하게 정하고 있는 건 없을까?" },
      { key: "before_next_step", text: "다음 한 걸음을 정하기 전에 확인할 것은?" },
      { key: "required_responsibility", text: "이 선택이 나에게 요구하는 책임은?" },
    ],
  },
  {
    key: "daily_signal",
    label: "그냥 오늘의 신호가 궁금해",
    representativeQuestion: "오늘 내가 놓치지 말아야 할 신호는?",
    questions: [
      { key: "missed_signal", text: "오늘 내가 놓치지 말아야 할 신호는?" },
      { key: "light_day", text: "오늘 하루를 가볍게 지나가려면 뭘 봐야 해?" },
      { key: "needed_attitude", text: "지금 나에게 필요한 태도는?" },
      { key: "helpful_energy", text: "오늘 나를 도와줄 에너지는?" },
      { key: "careful_flow", text: "오늘 조심해서 봐야 할 흐름은?" },
    ],
  },
] as const satisfies readonly TarotQuestionState[];

export function getTarotQuestionStateByKey(key: string): TarotQuestionState | null {
  return tarotQuestionStates.find((state) => state.key === key) ?? null;
}

export function getTarotQuestionByKey(stateKey: string, questionKey: string): TarotQuestionPrompt | null {
  return getTarotQuestionStateByKey(stateKey)?.questions.find((question) => question.key === questionKey) ?? null;
}
```

**Step 4: Run test to verify it passes**

Run:

```bash
npm --prefix frontend test -- src/lib/tarot-question-prompts.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/lib/tarot-question-prompts.ts frontend/src/lib/tarot-question-prompts.test.ts
git commit -m "feat(tarot): add question prompt catalog"
```

## Task 2: Extend Tarot Reading Types and Local Storage Validation

**Files:**
- Modify: `frontend/src/lib/daily-tarot.ts`
- Modify: `frontend/src/lib/daily-tarot.test.ts`

**Step 1: Write failing tests**

Add tests to `frontend/src/lib/daily-tarot.test.ts`:

```ts
test("loads question one-card readings only when question metadata is present", () => {
  const questionReading = createGeneratedReading("2026-07-03", "question_one_card", {
    questionContext: {
      stateKey: "mind_complex",
      stateLabel: "마음이 복잡해",
      questionKey: "held_feeling",
      questionText: "오늘 내 마음이 붙잡고 있는 건 뭐야?",
    },
    unlockMethod: "daily_free",
  });
  const invalidQuestionReading = {
    ...questionReading,
    id: "invalid-question-reading",
    questionContext: undefined,
  };
  const storage = createMemoryStorage({
    [dailyTarotStorageKey]: JSON.stringify([invalidQuestionReading, questionReading]),
  });

  expect(getDailyTarotReadings(storage)).toEqual([questionReading]);
  expect(getDailyTarotReading(storage, "2026-07-03", "question_one_card")).toEqual(questionReading);
});

test("keeps existing daily and three-card readings valid without question metadata", () => {
  const storage = createMemoryStorage({
    [dailyTarotStorageKey]: JSON.stringify([
      createGeneratedReading("2026-07-03", "daily_one_card"),
      createGeneratedReading("2026-07-03", "daily_three_card"),
    ]),
  });

  expect(getDailyTarotReadings(storage)).toHaveLength(2);
});
```

Update the local `createGeneratedReading` test helper to accept optional overrides:

```ts
function createGeneratedReading(
  appDate: string,
  spread: DailyTarotReading["spread"] = "daily_one_card",
  overrides: Partial<DailyTarotReading> = {},
): DailyTarotReading {
  return {
    // existing helper body
    ...overrides,
  };
}
```

**Step 2: Run tests to verify failure**

Run:

```bash
npm --prefix frontend test -- src/lib/daily-tarot.test.ts
```

Expected: FAIL because `question_one_card` and question metadata types are missing.

**Step 3: Implement the model**

In `frontend/src/lib/daily-tarot.ts`, add:

```ts
export type TarotSpread = "daily_one_card" | "question_one_card" | "daily_three_card";
export type TarotUnlockMethod = "daily_free" | "rewarded_ad" | "moon_pass" | "admin";

export type DailyTarotQuestionContext = {
  stateKey: string;
  stateLabel: string;
  questionKey: string;
  questionText: string;
};
```

Extend `DailyTarotReading`:

```ts
export type DailyTarotReading = {
  // existing fields
  questionContext?: DailyTarotQuestionContext;
  unlockMethod?: TarotUnlockMethod;
};
```

Update spread parsing:

```ts
function isTarotSpread(value: unknown): value is TarotSpread {
  return value === "daily_one_card" || value === "question_one_card" || value === "daily_three_card";
}
```

Update `resolveGetDailyTarotReadingOptions` to accept `question_one_card`.

Add validators:

```ts
function isDailyTarotQuestionContext(value: unknown): value is DailyTarotQuestionContext {
  return (
    isRecord(value) &&
    typeof value.stateKey === "string" &&
    value.stateKey.trim().length > 0 &&
    typeof value.stateLabel === "string" &&
    value.stateLabel.trim().length > 0 &&
    typeof value.questionKey === "string" &&
    value.questionKey.trim().length > 0 &&
    typeof value.questionText === "string" &&
    value.questionText.trim().length > 0
  );
}

function isTarotUnlockMethod(value: unknown): value is TarotUnlockMethod {
  return value === "daily_free" || value === "rewarded_ad" || value === "moon_pass" || value === "admin";
}
```

In `isStoredDailyTarotReading`, require question metadata only for `question_one_card`:

```ts
const hasValidQuestionContext =
  spread === "question_one_card"
    ? isDailyTarotQuestionContext(value.questionContext) && isTarotUnlockMethod(value.unlockMethod)
    : value.questionContext === undefined && (value.unlockMethod === undefined || isTarotUnlockMethod(value.unlockMethod));
```

Include `hasValidQuestionContext` in the final return condition.

**Step 4: Run tests**

Run:

```bash
npm --prefix frontend test -- src/lib/daily-tarot.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/lib/daily-tarot.ts frontend/src/lib/daily-tarot.test.ts
git commit -m "feat(tarot): support question one-card readings"
```

## Task 3: Add Database Migration for Question Spread and Future Reading Keys

**Files:**
- Create: `supabase/migrations/20260703000100_extend_tarot_question_readings.sql`
- Modify: `frontend/src/lib/server/manyang-db.ts`
- Modify: `frontend/src/lib/server/manyang-db.test.ts`

**Step 1: Write failing server persistence tests**

In `frontend/src/lib/server/manyang-db.test.ts`, add assertions that:

- `persistCompletedTarotReading` inserts `reading_key`.
- question readings use a question-based reading key.
- `findCompletedTarotReadingForUser` can query by reading key.
- `ReadingUsageFeatureKey` accepts `tarot_question_one_card`.

Use expected query snippets:

```ts
expect(joinedQueries).toContain("reading_key");
expect(joinedQueries).toContain("on conflict (user_id, app_date, spread, reading_key)");
```

**Step 2: Run focused tests**

Run:

```bash
npm --prefix frontend test -- src/lib/server/manyang-db.test.ts
```

Expected: FAIL because `reading_key` is not implemented.

**Step 3: Add migration**

Create `supabase/migrations/20260703000100_extend_tarot_question_readings.sql`:

```sql
alter table manyang.tarot_readings
  add column if not exists reading_key text not null default 'daily';

alter table manyang.tarot_readings
  drop constraint if exists tarot_readings_spread_check;

alter table manyang.tarot_readings
  add constraint tarot_readings_spread_check
  check (spread in ('daily_one_card', 'question_one_card', 'daily_three_card'));

alter table manyang.tarot_readings
  drop constraint if exists tarot_readings_user_id_app_date_spread_key;

alter table manyang.tarot_readings
  add constraint tarot_readings_user_date_spread_key_unique
  unique (user_id, app_date, spread, reading_key);

alter table manyang.reading_usage
  drop constraint if exists reading_usage_feature_key_check;

alter table manyang.reading_usage
  add constraint reading_usage_feature_key_check
  check (feature_key in ('dream_basic', 'dream_premium', 'tarot_one_card', 'tarot_question_one_card', 'tarot_three_card'));
```

**Step 4: Update persistence helpers**

In `frontend/src/lib/server/manyang-db.ts`, extend the type:

```ts
export type ReadingUsageFeatureKey =
  | "dream_basic"
  | "dream_premium"
  | "tarot_one_card"
  | "tarot_question_one_card"
  | "tarot_three_card";
```

Add:

```ts
export function createTarotReadingPersistenceKey(reading: DailyTarotReading): string {
  if (reading.spread !== "question_one_card") {
    return "daily";
  }

  const context = reading.questionContext;
  const unlockMethod = reading.unlockMethod ?? "daily_free";

  return context
    ? `question:${context.stateKey}:${context.questionKey}:${unlockMethod}`
    : `question:unknown:${unlockMethod}`;
}
```

Update `persistCompletedTarotReading` SQL:

```sql
insert into manyang.tarot_readings (
  user_id,
  app_date,
  spread,
  reading_key,
  cards,
  title,
  overview,
  card_readings,
  advice,
  raw_reading
)
values ($1, $2::date, $3, $4, $5::jsonb, $6, $7, $8::jsonb, $9, $10::jsonb)
on conflict (user_id, app_date, spread, reading_key) do update
```

Update parameters so `$4` is `createTarotReadingPersistenceKey(input.reading)`.

Update `findCompletedTarotReadingForUser`:

```ts
export async function findCompletedTarotReadingForUser(
  userId: string,
  appDate: string,
  spread: TarotSpread,
  readingKey = "daily",
  pool = getManyangDbPool(),
): Promise<DailyTarotReading | null>
```

Query with `and reading_key = $4`.

**Step 5: Run focused tests**

Run:

```bash
npm --prefix frontend test -- src/lib/server/manyang-db.test.ts
```

Expected: PASS.

**Step 6: Commit**

```bash
git add supabase/migrations/20260703000100_extend_tarot_question_readings.sql frontend/src/lib/server/manyang-db.ts frontend/src/lib/server/manyang-db.test.ts
git commit -m "feat(tarot): persist question readings with stable keys"
```

## Task 4: Extend Backend Tarot Prompt Contract

**Files:**
- Modify: `backend/src/services/tarot-reading-prompt.ts`
- Modify: `backend/src/services/llm-tarot-reading.ts`
- Modify: `backend/src/services/llm-tarot-reading.test.ts`

**Step 1: Write failing backend tests**

In `backend/src/services/llm-tarot-reading.test.ts`, add a `questionOneCardInput`:

```ts
const questionOneCardInput = {
  ...oneCardInput,
  spread: "question_one_card",
  questionContext: {
    stateKey: "mind_complex",
    stateLabel: "마음이 복잡해",
    questionKey: "held_feeling",
    questionText: "오늘 내 마음이 붙잡고 있는 건 뭐야?",
  },
} satisfies TarotReadingInput;
```

Add tests:

```ts
test("builds question one-card prompts with selected question context", async () => {
  const provider = createCapturingProvider({
    title: "질문을 비추는 카드",
    overview: "선택한 질문을 카드의 장면과 연결해 읽는 본문입니다. 질문의 맥락을 벗어나지 않고 오늘 확인할 기준을 보여줍니다.",
    keywords: ["질문", "기준", "마음"],
    cardReadings: [],
  });

  await expect(generateTarotReadingForUser(questionOneCardInput, { provider })).resolves.toMatchObject({
    status: "ok",
    reading: { cardReadings: [] },
  });

  const request = provider.requests[0];
  expect(request?.input).toContain("오늘 내 마음이 붙잡고 있는 건 뭐야?");
  expect(request?.instructions).toContain("선택한 질문");
});
```

**Step 2: Run backend focused test**

Run:

```bash
npm --prefix backend test -- src/services/llm-tarot-reading.test.ts
```

Expected: FAIL because `question_one_card` is not accepted.

**Step 3: Implement prompt types and contracts**

In `backend/src/services/tarot-reading-prompt.ts`:

```ts
export type TarotReadingSpread = "daily_one_card" | "question_one_card" | "daily_three_card";

export type TarotQuestionPromptContext = {
  stateKey: string;
  stateLabel: string;
  questionKey: string;
  questionText: string;
};

export type TarotReadingPromptInput = {
  appDate: string;
  locale?: "ko" | "en";
  spread: TarotReadingSpread;
  cards: TarotReadingPromptCardInput[];
  questionContext?: TarotQuestionPromptContext;
};
```

Update `getSpreadContract`:

```ts
if (spread === "question_one_card") {
  return "Use cardReadings as an empty array for question_one_card; answer the selected question through the one selected card in overview.";
}
```

Update `getLengthContract` to treat `question_one_card` like one-card length.

Update `getStyleContract` one-card branch:

```ts
if (spread === "question_one_card") {
  return [
    ...baseStyle,
    "질문형 한 장 리딩은 선택한 질문을 직접 답하되, 예/아니오나 미래 단정으로 답하지 마세요.",
    "overview 안에서 카드 장면, 질문의 맥락, 오늘 확인할 기준을 자연스럽게 이어 쓰세요.",
  ];
}
```

Update `getInstructionContract`:

```ts
spread === "question_one_card"
  ? [
      "한 장 리딩에서는 cardReadings를 만들지 마세요. overview가 사용자에게 보이는 본문입니다.",
      "선택한 질문을 카드의 상징과 방향으로 읽되, 예/아니오나 확정 예언으로 답하지 마세요.",
      "결론은 행동 명령이 아니라 오늘 확인할 기준으로 마무리하세요.",
    ]
```

Add `questionContext` to `promptPayload`.

In `backend/src/services/llm-tarot-reading.ts`, keep `expectedPositionsForInput` returning an empty array for both one-card spreads:

```ts
function expectedPositionsForInput(input: TarotReadingInput): TarotReadingPosition[] {
  return input.spread === "daily_three_card" ? ["situation", "flow", "advice"] : [];
}
```

**Step 4: Run backend tests**

Run:

```bash
npm --prefix backend test -- src/services/llm-tarot-reading.test.ts
npm --prefix backend run typecheck
```

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/src/services/tarot-reading-prompt.ts backend/src/services/llm-tarot-reading.ts backend/src/services/llm-tarot-reading.test.ts
git commit -m "feat(tarot): add question one-card prompt contract"
```

## Task 5: Extend Tarot Reading API Validation and Usage Policy

**Files:**
- Modify: `frontend/src/app/api/tarot/readings/route.ts`
- Modify: `frontend/src/app/api/tarot/readings/route.test.ts`

**Step 1: Write failing API tests**

Add helpers:

```ts
function createQuestionOneCardBody(overrides: Record<string, unknown> = {}) {
  return {
    appDate: "2026-07-03",
    spread: "question_one_card",
    selectedAt: "2026-07-03T10:00:00.000Z",
    questionContext: {
      stateKey: "mind_complex",
      stateLabel: "마음이 복잡해",
      questionKey: "held_feeling",
      questionText: "오늘 내 마음이 붙잡고 있는 건 뭐야?",
    },
    unlockMethod: "daily_free",
    selections: [{ cardId: 22, orientation: "upright", position: "today" }],
    ...overrides,
  };
}
```

Add tests:

```ts
test("rejects question tarot without question context", async () => {
  const response = await handleTarotReadingRequest(
    createJsonRequest(createQuestionOneCardBody({ questionContext: undefined })),
    { generateTarotReadingForUser: vi.fn() },
  );

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "questionContext is required for question_one_card",
  });
});

test("uses a separate usage key for question one-card tarot", async () => {
  const incrementReadingUsageForGuest = vi.fn(async () => undefined);
  const generateTarotReadingForUser = vi.fn(async () => ({ status: "ok" as const, reading: generatedOneCard }));

  const response = await handleTarotReadingRequest(createJsonRequest(createQuestionOneCardBody()), {
    getAuthenticatedUserId: async () => null,
    getAccessPlanForUser: async () => "guest",
    hasReadingUsageForGuestOnDate: async () => false,
    incrementReadingUsageForGuest,
    createGuestId: () => "00000000-0000-4000-8000-000000000abc",
    createProvider: () => ({ generateJson: async () => generatedOneCard }),
    generateTarotReadingForUser,
    persistCompletedTarotReading: async () => undefined,
  });

  expect(response.status).toBe(200);
  expect(incrementReadingUsageForGuest).toHaveBeenCalledWith(
    "00000000-0000-4000-8000-000000000abc",
    "2026-07-03",
    "tarot_question_one_card",
  );
});
```

Add a test that a second question tarot returns an ad-required response:

```ts
test("returns rewarded-ad required when question tarot daily free use is spent", async () => {
  const response = await handleTarotReadingRequest(createJsonRequest(createQuestionOneCardBody()), {
    getAuthenticatedUserId: async () => null,
    getAccessPlanForUser: async () => "guest",
    hasReadingUsageForGuestOnDate: async () => true,
    createGuestId: () => "00000000-0000-4000-8000-000000000abc",
    createProvider: () => ({ generateJson: async () => generatedOneCard }),
    generateTarotReadingForUser: vi.fn(),
  });

  expect(response.status).toBe(403);
  await expect(response.json()).resolves.toMatchObject({
    reason: "rewarded_ad_required",
    rewardedAdAvailable: false,
  });
});
```

**Step 2: Run API tests**

Run:

```bash
npm --prefix frontend test -- src/app/api/tarot/readings/route.test.ts
```

Expected: FAIL.

**Step 3: Implement validation and policy**

In `route.ts`, extend request types:

```ts
type TarotUnlockMethod = "daily_free" | "rewarded_ad" | "moon_pass" | "admin";
type QuestionTarotAccessMode = "daily_free_then_ad" | "ad_only";

type TarotQuestionContextRequest = {
  stateKey: string;
  stateLabel: string;
  questionKey: string;
  questionText: string;
};
```

Add to `TarotReadingRequestBody`:

```ts
questionContext?: TarotQuestionContextRequest;
unlockMethod?: TarotUnlockMethod;
```

Update `isTarotSpread` error message:

```ts
return value === "daily_one_card" || value === "question_one_card" || value === "daily_three_card";
```

Add validation:

```ts
function isQuestionContext(value: unknown): value is TarotQuestionContextRequest {
  return (
    isRecord(value) &&
    typeof value.stateKey === "string" &&
    value.stateKey.trim().length > 0 &&
    typeof value.stateLabel === "string" &&
    value.stateLabel.trim().length > 0 &&
    typeof value.questionKey === "string" &&
    value.questionKey.trim().length > 0 &&
    typeof value.questionText === "string" &&
    value.questionText.trim().length > 0
  );
}
```

Inside `validateTarotReadingRequestBody`:

```ts
if (body.spread === "question_one_card" && !isQuestionContext(body.questionContext)) {
  return { ok: false, error: "questionContext is required for question_one_card" };
}
```

Set default unlock method:

```ts
const unlockMethod = body.unlockMethod === "rewarded_ad" ? "rewarded_ad" : "daily_free";
```

Map usage key:

```ts
function tarotUsageFeatureKey(spread: TarotSpread): ReadingUsageFeatureKey {
  if (spread === "daily_three_card") return "tarot_three_card";
  if (spread === "question_one_card") return "tarot_question_one_card";
  return "tarot_one_card";
}
```

When question free usage is spent, return:

```ts
return createJsonResponse(
  {
    error: "question tarot requires rewarded ad",
    reason: "rewarded_ad_required",
    rewardedAdAvailable: false,
    message: "오늘의 질문 타로는 이미 열었어요. 다음에는 광고를 보고 한 번 더 볼 수 있게 준비할게요.",
  },
  { status: 403 },
  guestSession,
);
```

Use user usage helpers for authenticated users too:

```ts
hasReadingUsageForUserOnDate
incrementReadingUsageForUser
```

Do this only for `question_one_card` initially so existing daily tarot behavior is not changed.

Pass question context to backend input:

```ts
questionContext: requestBody.questionContext,
```

Add `questionContext` and `unlockMethod` to `DailyTarotReading` when creating the generated reading.

**Step 4: Run tests**

Run:

```bash
npm --prefix frontend test -- src/app/api/tarot/readings/route.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/app/api/tarot/readings/route.ts frontend/src/app/api/tarot/readings/route.test.ts
git commit -m "feat(tarot): add question reading API policy"
```

## Task 6: Update Share and Result Helpers

**Files:**
- Modify: `frontend/src/lib/share-records.ts`
- Modify: `frontend/src/lib/share-records.test.ts`
- Modify: `frontend/src/lib/result-actions.ts`
- Modify: `frontend/src/lib/result-actions.test.ts`

**Step 1: Write failing tests**

Add test cases that:

- `isSharedTarotPayload` accepts `question_one_card` with `questionContext`.
- `createTarotReadingShareText` includes the selected question for question tarot.
- `createTarotReadingFileName` remains stable.

Expected share text snippet:

```ts
expect(createTarotReadingShareText(questionReading)).toContain("질문: 오늘 내 마음이 붙잡고 있는 건 뭐야?");
```

**Step 2: Run tests**

```bash
npm --prefix frontend test -- src/lib/share-records.test.ts src/lib/result-actions.test.ts
```

Expected: FAIL.

**Step 3: Implement helper updates**

In `share-records.ts`, accept `question_one_card` and require question metadata only for that spread:

```ts
const isTarotSpread =
  value.spread === "daily_one_card" ||
  value.spread === "question_one_card" ||
  value.spread === "daily_three_card";
```

In `result-actions.ts`, change title/share text:

```ts
function getTarotDisplayTitle(reading: DailyTarotReading): string {
  return reading.spread === "question_one_card" ? "질문 타로" : dailyTarotDisplayTitle;
}
```

Add question line when present:

```ts
const questionLine = reading.questionContext ? `질문: ${reading.questionContext.questionText}` : null;
```

Filter null lines before joining.

**Step 4: Run tests**

```bash
npm --prefix frontend test -- src/lib/share-records.test.ts src/lib/result-actions.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/lib/share-records.ts frontend/src/lib/share-records.test.ts frontend/src/lib/result-actions.ts frontend/src/lib/result-actions.test.ts
git commit -m "feat(tarot): share question tarot results"
```

## Task 7: Build Question Tarot UI

**Files:**
- Create: `frontend/src/components/question-tarot-client.tsx`
- Create: `frontend/src/components/question-tarot-client.test.tsx`
- Modify: `frontend/src/components/daily-tarot-client.tsx`

**Step 1: Write failing UI tests**

Create `frontend/src/components/question-tarot-client.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { QuestionTarotClient } from "./question-tarot-client";

describe("QuestionTarotClient", () => {
  test("starts with state choices instead of raw question choices", () => {
    const markup = renderToStaticMarkup(
      <QuestionTarotClient appDate="2026-07-03" initialReading={null} initialUserId="user-1" />,
    );

    expect(markup).toContain('data-question-tarot-state="state-select"');
    expect(markup).toContain("마음이 복잡해");
    expect(markup).toContain("관계가 신경 쓰여");
    expect(markup).not.toContain("오늘 내 마음이 붙잡고 있는 건 뭐야?");
  });

  test("uses the question one-card spread in API request body", () => {
    const source = require("node:fs").readFileSync(
      require("node:path").join(process.cwd(), "src", "components", "question-tarot-client.tsx"),
      "utf8",
    );

    expect(source).toContain('spread: "question_one_card"');
    expect(source).toContain("questionContext");
    expect(source).toContain('unlockMethod: "daily_free"');
  });
});
```

**Step 2: Run UI test**

```bash
npm --prefix frontend test -- src/components/question-tarot-client.test.tsx
```

Expected: FAIL.

**Step 3: Export reusable draw pieces**

In `frontend/src/components/daily-tarot-client.tsx`, export `DailyTarotFanDeck` if needed:

```ts
export function DailyTarotFanDeck(...)
```

Keep props unchanged.

**Step 4: Implement `QuestionTarotClient`**

Build a client component with these states:

```ts
type QuestionTarotStep = "state-select" | "question-select" | "draw" | "revealing" | "generating" | "result" | "limited" | "error";
```

Flow:

- render state buttons from `tarotQuestionStates`
- after state selection, render the five questions for that state
- after question selection, create 78-card options using:

```ts
createDailyTarotOptions(appDate, {
  drawIdentityKey: `${drawIdentityKey}:question:${state.key}:${question.key}`,
});
```

- pick one prepared selection at `position: "today"`
- POST:

```ts
{
  appDate,
  spread: "question_one_card",
  selectedAt,
  questionContext: {
    stateKey: state.key,
    stateLabel: state.label,
    questionKey: question.key,
    questionText: question.text,
  },
  unlockMethod: "daily_free",
  selections: [{ cardId, orientation, position: "today" }],
}
```

- save successful readings with `saveDailyTarotReadingToBrowser`
- show `DailyTarotResult` when complete
- when API returns `rewarded_ad_required`, show a compact limit message instead of an ad button

**Step 5: Run UI test**

```bash
npm --prefix frontend test -- src/components/question-tarot-client.test.tsx
```

Expected: PASS.

**Step 6: Commit**

```bash
git add frontend/src/components/question-tarot-client.tsx frontend/src/components/question-tarot-client.test.tsx frontend/src/components/daily-tarot-client.tsx
git commit -m "feat(tarot): add question one-card UI"
```

## Task 8: Add Question Tarot Route and Entry Points

**Files:**
- Create: `frontend/src/app/tarot/question/page.tsx`
- Create: `frontend/src/app/tarot/question/page.test.tsx`
- Modify: `frontend/src/app/tarot/page.tsx`
- Modify: `frontend/src/app/tarot/page.test.tsx`

**Step 1: Write failing page tests**

Create `frontend/src/app/tarot/question/page.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import TarotQuestionPage from "./page";

describe("/tarot/question", () => {
  test("renders the question tarot shell", async () => {
    const markup = renderToStaticMarkup(await TarotQuestionPage({}));

    expect(markup).toContain("질문 타로");
    expect(markup).toContain('data-question-tarot-page');
    expect(markup).toContain('data-question-tarot-state="state-select"');
  });
});
```

Update `/tarot` page test to expect a link to `/tarot/question`.

**Step 2: Run tests**

```bash
npm --prefix frontend test -- src/app/tarot/page.test.tsx src/app/tarot/question/page.test.tsx
```

Expected: FAIL.

**Step 3: Implement route and entry link**

Create `frontend/src/app/tarot/question/page.tsx`:

```tsx
import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { QuestionTarotClient } from "@/components/question-tarot-client";
import { manyangAssets } from "@/lib/manyang-assets";
import { getPawprintAppDate } from "@/lib/pawprints";
import { getAuthenticatedUserId } from "@/lib/supabase/server";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function TarotQuestionPage() {
  const appDate = getPawprintAppDate();
  const initialUserId = await getAuthenticatedUserId();

  return (
    <AppShell
      background={manyangAssets.backgrounds.default}
      title="질문 타로"
      subtitle="지금 궁금한 마음을 고르고 한 장으로 비춰봐요."
      titleIconSrc={manyangAssets.pageIcons.tarot}
      backHref="/tarot"
      rightAction="none"
      showBottomNav={false}
    >
      <section data-question-tarot-page className="flex min-h-full flex-col px-1 pb-4 pt-1 text-[#fff3d7]">
        <QuestionTarotClient appDate={appDate} initialReading={null} initialUserId={initialUserId} />
      </section>
    </AppShell>
  );
}
```

In `/tarot`, add a small route link above `DailyTarotClient`:

```tsx
<Link href="/tarot/question">질문별 한 장</Link>
```

Keep the entry compact. Do not make a marketing section.

**Step 4: Run tests**

```bash
npm --prefix frontend test -- src/app/tarot/page.test.tsx src/app/tarot/question/page.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/app/tarot/page.tsx frontend/src/app/tarot/page.test.tsx frontend/src/app/tarot/question/page.tsx frontend/src/app/tarot/question/page.test.tsx
git commit -m "feat(tarot): route question one-card reading"
```

## Task 9: Update Archive/Calendar Awareness if Needed

**Files:**
- Inspect: `frontend/src/components/archive-calendar.tsx`
- Inspect: `frontend/src/components/archive-records-client.tsx`
- Inspect: `frontend/src/lib/archive-records.ts`
- Modify tests only if current archive assumptions reject `question_one_card`.

**Step 1: Search for spread assumptions**

Run:

```bash
rg -n "daily_one_card|daily_three_card|TarotSpread|tarot_readings" frontend/src/components frontend/src/lib -S
```

**Step 2: Add narrow tests only where needed**

If archive display only checks existence of tarot readings by date, no implementation is required.

If a validator rejects `question_one_card`, add a focused test and update it to accept the new spread.

**Step 3: Commit only if files changed**

```bash
git add <changed archive files>
git commit -m "fix(tarot): include question readings in archive views"
```

## Task 10: Update Sprint Docs

**Files:**
- Modify: `vault/09-Implementation/plans/2026-07-03-tarot-content-expansion-sprint.md`
- Modify: `vault/09-Implementation/plans/ACTIVE_SPRINT.md`

**Step 1: Update statuses**

Mark or clarify:

- `TAROT-01`: done if the 78-card model is already complete.
- `TAROT-02`: done if today tarot already uses the full 78-card deck.
- `TAROT-03`: doing during implementation, done after verification.

Add a note that question tarot uses:

- `question_one_card`
- `tarot_question_one_card`
- future `rewarded_ad` unlock method

**Step 2: Commit**

```bash
git add vault/09-Implementation/plans/2026-07-03-tarot-content-expansion-sprint.md vault/09-Implementation/plans/ACTIVE_SPRINT.md
git commit -m "docs(tarot): track question one-card implementation"
```

## Task 11: Full Verification

**Files:**
- No direct edits unless a test reveals a real issue.

**Step 1: Run backend verification**

```bash
npm --prefix backend test
npm --prefix backend run typecheck
```

Expected: PASS.

**Step 2: Run frontend verification**

```bash
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
```

Expected: PASS.

**Step 3: Manual smoke**

Start dev server if needed:

```bash
npm --prefix frontend run dev
```

Check:

- `/tarot` still opens daily tarot.
- `/tarot/question` opens state selection.
- state selection reveals five questions.
- selecting a question reaches card draw.
- one card result includes the selected question.
- second question tarot after daily free use shows the limit/ad-ready message.

**Step 4: Final commit if verification required small fixes**

```bash
git add <fix files>
git commit -m "fix(tarot): stabilize question one-card flow"
```

## Task 12: Push

**Step 1: Check status**

```bash
git status --short
```

Expected: only unrelated pre-existing unstaged changes remain.

**Step 2: Push**

```bash
git push origin main
```

Expected: push succeeds.

## Rollback Notes

- If the API change breaks existing tarot, revert the API task commit first.
- If the DB migration has not been applied remotely, reverting code is enough locally.
- If the DB migration was applied, do not drop data. Add a follow-up migration only after inspecting current rows.
