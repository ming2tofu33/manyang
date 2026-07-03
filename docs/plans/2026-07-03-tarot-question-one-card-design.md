# Tarot Question One-Card Design

> Approved direction for adding question-based one-card tarot as a lightweight content loop.

## Goal

Build a question-based one-card tarot flow that is separate from the daily tarot routine. The user chooses a current state, picks one of five prepared questions, draws one card from the full 78-card deck, and receives a short reading grounded in that question.

The feature should support a future rewarded-ad model without requiring a storage or API rewrite.

## Product Positioning

Daily tarot and question tarot serve different user intentions.

- Daily tarot: a once-a-day ritual for checking the tone of the day.
- Question tarot: a situation-based check-in for a current concern.
- Three-card tarot: a deeper paid or premium reading.

Question tarot should feel useful without becoming a repeated anxiety loop. The result should end with a criterion to look at today, not a fixed prediction or command.

## Access Model

Question tarot has its own usage key and should not consume the same quota as daily one-card tarot.

Recommended feature keys:

- `tarot_one_card`: daily one-card tarot.
- `tarot_question_one_card`: question-based one-card tarot.
- `tarot_three_card`: three-card tarot.

Initial policy:

- One question tarot reading per day is free.
- Additional question tarot readings are reserved for a future rewarded-ad unlock.
- The first implementation may show only a limit message after the free reading is used.

The policy should be configurable so the free read can later be removed:

```ts
type QuestionTarotAccessMode = "daily_free_then_ad" | "ad_only";
```

The reading should record how it was unlocked:

```ts
type TarotUnlockMethod = "daily_free" | "rewarded_ad" | "moon_pass" | "admin";
```

With this contract, switching from `daily_free_then_ad` to `ad_only` can be handled by policy/config instead of reworking the feature.

## User Flow

```text
/tarot/question
-> choose current state
-> choose one of five questions
-> draw one card from the 78-card deck
-> receive question-context reading
-> save/share entry point
-> optional three-card CTA
```

The first screen should show state cards, not raw question lists. The state copy should read like the user's actual situation rather than product categories.

Initial states and questions come from:

- `vault/03-Features/Tarot-Question-Based-One-Card.md`
- `vault/05-Content/Tarot-Question-Prompts.md`

Runtime copy should live in TypeScript, not be parsed from Markdown.

## Data Contract

Extend the existing tarot reading model instead of creating a separate storage system.

```ts
type TarotSpread =
  | "daily_one_card"
  | "question_one_card"
  | "daily_three_card";

type TarotQuestionContext = {
  stateKey: string;
  stateLabel: string;
  questionKey: string;
  questionText: string;
};
```

Question tarot readings should include:

- `spread: "question_one_card"`
- `questionContext`
- `unlockMethod`
- one selected card at `position: "today"`

Existing stored daily tarot readings must continue to load. Validation should accept old readings without question fields for daily and three-card spreads, while requiring question metadata for `question_one_card`.

## API Contract

The tarot reading API should accept `questionContext` only for `question_one_card`.

For future rewarded ads, the API should be shaped to accept an unlock method and eventually an ad verification token:

```ts
type TarotReadingRequestBody = {
  appDate: string;
  spread: TarotSpread;
  selectedAt: string;
  selections: TarotReadingSelectionRequest[];
  questionContext?: TarotQuestionContext;
  unlockMethod?: TarotUnlockMethod;
  rewardedAdToken?: string;
};
```

Initial implementation can reject `rewarded_ad` unless a future verification path exists. It should still keep the type boundary clear.

## LLM Prompt Contract

For `question_one_card`, the LLM prompt should receive the selected state and question. The generated text should answer the question through the selected card's symbols and orientation.

Question one-card output should keep `cardReadings` empty like daily one-card readings. The visible reading should live in `overview`.

Prompt constraints:

- Do not answer yes/no.
- Do not predict a fixed future.
- Do not give medical, legal, financial, or relationship decisions as authority.
- Do not tell the user to repeatedly draw cards.
- End around "today's criterion to notice" rather than a command.

## UI Architecture

Prefer a separate page and client component:

- Create `frontend/src/app/tarot/question/page.tsx`.
- Create `frontend/src/components/question-tarot-client.tsx`.
- Create `frontend/src/lib/tarot-question-prompts.ts`.

Reuse existing pieces where practical:

- card draw option generation from `daily-tarot.ts`
- card reveal/loading/result visual components from `daily-tarot-client.tsx`
- share/download helpers from `result-actions.ts`

Avoid folding all question flow state into `DailyTarotClient`; it is already responsible for daily one-card, three-card, prefetch, reveal, loading, stored readings, and sharing.

## Result UI

Question tarot result should show:

- selected question
- card image, name, orientation
- short question-context reading
- "today's criterion" or fixed card message
- save/share actions
- optional three-card CTA

The result should not look like a long report. It should feel like a compact answer to the selected question.

## Testing Strategy

Add focused tests before implementation:

- prompt data contains 6 states and 5 questions per state.
- `question_one_card` is accepted by storage validation with required question metadata.
- existing `daily_one_card` and `daily_three_card` readings still load.
- API rejects question tarot without `questionContext`.
- API uses `tarot_question_one_card` usage key.
- prompt builder includes the selected question for `question_one_card`.
- question page renders state selection and does not show raw questions before state selection.

Run after implementation:

```bash
npm --prefix backend test
npm --prefix backend run typecheck
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
```

## Non-Goals

- User-entered freeform questions.
- Full rewarded-ad SDK integration.
- Full archive/review redesign.
- New share image design.
- Three-card question spread.

## Open Follow-Up

When rewarded ads are introduced, add ad verification before accepting `unlockMethod: "rewarded_ad"`. Until then, the API should not trust client-only rewarded-ad claims.
