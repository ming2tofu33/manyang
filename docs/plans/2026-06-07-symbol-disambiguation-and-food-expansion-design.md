# Symbol Disambiguation and Food Expansion Design

## Goal

Dream symbol matching should recognize common food symbols such as apple, fruit, rice, egg, and eye while avoiding false matches from short Korean homonyms such as `말`, `배`, `차`, and `눈`.

## Problem

The encyclopedia currently uses aliases as strong evidence. This works for clear words like `돼지` or `엘리베이터`, but it breaks on short ambiguous Korean words.

Examples:

- `말을 거는 꿈` should mean speech, not the horse symbol.
- `사과를 받았다` can mean receiving an apology, not eating an apple.
- `배가 아팠다` should not automatically wake the boat symbol.
- `차를 마셨다` should not automatically wake the car symbol.
- `눈이 아팠다` should not automatically wake the snow symbol.

RAG and embeddings help recover semantically related symbols, but they should not be the only disambiguation mechanism. The deterministic matcher still needs structured rules so only grounded symbols become confirmed evidence.

## Design

Add an optional `disambiguation` field to encyclopedia entries. Only symbols with risky aliases need this field.

```ts
type SymbolDisambiguationRule = {
  alias: string;
  confirmWhen?: string[];
  rejectWhen?: string[];
  fallback: "candidate_only" | "reject";
};

type SymbolDisambiguation = Partial<Record<SupportedLocale, SymbolDisambiguationRule[]>>;
```

Recommended behavior:

- If a risky alias appears with `rejectWhen`, the symbol is rejected.
- If a risky alias appears with `confirmWhen`, the symbol can remain confirmed.
- If the alias is risky and no confirming context exists, the symbol should be downgraded to candidate when the caller supports candidates. For the current runtime matcher, the first implementation can reject ambiguous matches until candidate plumbing is available.
- Entries without `disambiguation` keep the current behavior.

## First Batch

Add new encyclopedia symbols:

- `apple`: apple as fruit, sweetness, temptation, health, gift, spoiled apple. Must not match apology usage.
- `fruit`: broad fruit symbol for harvest, ripeness, appetite, sweetness, and seasonal outcome.
- `rice`: Korean everyday food symbol for care, livelihood, family routine, and being fed.
- `egg`: potential, fragile beginning, birth, hatching, or broken possibility.
- `eye`: seeing, attention, self-awareness, being watched, perception. Must be separated from snow.

Add disambiguation to existing entries:

- `horse`: `말` as animal vs speech.
- `boat`: `배` as vessel vs stomach or pear.
- `car`: `차` as vehicle vs tea.
- `snow`: `눈` as snow vs eye.
- `blood`: `피` as blood vs common word fragments such as coffee or tiredness.

## Data Flow

1. The matcher gathers alias and scene modifier matches.
2. It checks optional disambiguation rules for matched aliases.
3. Rejected matches are removed before evidence ranking.
4. Confirmed evidence continues into RAG/evidence gate.
5. The LLM prompt receives cleaner evidence and does not need one-off warnings for each homonym.

## Testing Strategy

Use TDD before implementation:

- Add runtime matcher tests for false positives and true positives.
- Add encyclopedia contract tests for the optional field shape.
- Add retrieval tests proving ambiguous words do not become confirmed evidence.
- Add smoke tests for new symbols: apple, fruit, rice, egg, eye.

## Non-Goals

- Do not build a full Korean morphological analyzer in this phase.
- Do not move the encyclopedia to Supabase in this phase.
- Do not force every symbol to carry disambiguation metadata.
- Do not solve every homonym at once. This starts with the highest-risk first batch.
