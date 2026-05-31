# Daily Tarot V1 Design

**Goal:** Add an independent "today's tarot" feature that uses the 22 major arcana cards, lets the user choose a hidden card with an already-set upright or reversed orientation, and returns a concise daily reading that can later be reused inside dream-reading results.

**Product Decision:** Build this as a standalone daily ritual first, not as part of the dream receipt. The tarot card data, draw logic, and result model should be reusable so a later dream-reading integration can attach a tarot card without redesigning the system.

---

## User Experience

The first version is a one-card daily draw.

1. The user enters the today's tarot surface from the home screen or a dedicated route.
2. The screen presents several hidden tarot card backs.
3. Each hidden card is already laid either upright or reversed. Reversed cards appear rotated 180 degrees before selection.
4. The user chooses one card. They can intentionally pick an upright-looking or reversed-looking card, but they cannot know which major arcana card is hidden underneath.
5. The selected card flips/reveals into the result.
6. The result shows:
   - card image
   - Korean and English card name
   - orientation label: upright or reversed
   - 3-5 keywords
   - today's flow
   - one advice sentence
   - light disclaimer language that frames tarot as symbolic guidance, not fixed prediction

This keeps the "I chose this card" feeling while preserving uncertainty around the card identity.

Use the transparent tarot back reference from `ref/tarot cards/tarotcard-cutout.png` as the source for the face-down card asset. It should be copied or generated into `frontend/public/manyang/tarot/` during implementation rather than referenced from `ref/` at runtime.

---

## Interaction Model

The selected card result is determined by two hidden values:

- `cardId`: one of the 22 major arcana ids.
- `orientation`: `upright` or `reversed`.

The orientation is not chosen from a button after the card is revealed. It is attached to the face-down card before selection and visible through the card's physical rotation. This avoids making the reading feel like a settings form.

For v1, the spread is always:

```ts
type TarotSpread = "daily_one_card";
type TarotPosition = "today";
```

Three-card spreads are out of scope for v1, but the result shape should leave room for `position` so `past/present/future` or `situation/obstacle/advice` can be added later.

---

## Data Model

Create a structured major arcana data module from `ref/tarot cards/major_arcana_tarot_reading_guide_ko.md`.

Each card should have:

```ts
type TarotMajorCard = {
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

The `image` field should point to the generated transparent assets under:

```txt
/manyang/tarot/major/00-the-fool.png
```

The data module should be plain TypeScript and deterministic. It should not depend on React or browser APIs.

---

## Draw Result Model

The frontend should use a stable result shape:

```ts
type TarotOrientation = "upright" | "reversed";

type DailyTarotReading = {
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

`title`, `message`, and `advice` are derived from local card data in v1. No LLM call is required for the first version.

---

## Draw Logic

The draw should feel random but behave predictably once completed for the app day.

Recommended v1 behavior:

- Before selection, generate a shuffled set of hidden card options.
- Each option has a hidden `cardId` and a visible `orientation`.
- When the user selects one, persist that exact result for the current app date.
- If the user returns on the same app date, show the already selected card instead of drawing again.

Storage:

- Guest/local v1: browser localStorage.
- Authenticated DB persistence: out of scope for v1, but the result model includes fields that can map cleanly to a future `daily_tarot_readings` table.

The app should use the same app-date convention as the existing morning/dream routines so daily reset behavior stays consistent.
In current code, that means reusing or extracting the `getPawprintAppDate()` behavior: a new app day starts at 05:00 in the user's local time, not at midnight.

---

## Frontend Placement

V1 can use a dedicated route, for example:

```txt
/tarot
```

Home can link into it through the existing daily action area after the feature exists. The first screen should be the actual draw interface, not a marketing page.

Expected screens/states:

- draw-ready: face-down card options are visible
- revealing: selected card animates/flips into place
- result: the saved daily reading is visible
- unavailable/error: assets or local storage are unavailable, with a retry path

The visual direction should stay within Manyang's existing mystical nighttime style, using the generated tarot card cutouts and existing UI frame assets where useful.

---

## Accessibility And Safety

- Hidden cards need accessible button names that do not reveal card identity.
- Orientation can be announced as "upright card option" or "reversed card option" before selection.
- Result text must be available without relying on animation.
- Tarot copy must avoid fixed predictions, medical/financial/legal certainty, or fear-based claims.
- Use symbolic, reflective language: "today's flow suggests..." instead of "this will happen."

---

## Testing

Unit tests:

- verify there are exactly 22 major arcana cards
- verify every card has an existing image path
- verify upright and reversed reading text exist for every card
- verify daily storage returns the same reading for the same app date
- verify a new app date can produce a new draw
- verify orientation is attached before reveal and preserved in the result

Component tests:

- draw surface renders hidden card buttons
- reversed options are visually/semantically distinguishable
- selecting a card renders the result
- returning with a saved reading skips the draw state

Manual visual check:

- desktop and mobile card layout
- transparent card edges over the Manyang background
- text fit in result panels

---

## Out Of Scope For V1

- three-card spreads
- minor arcana cards
- LLM-generated tarot readings
- authenticated server persistence
- sharing/downloading tarot result cards
- attaching tarot to dream receipt
- paid tarot limits or premium spreads

These should be easier to add once the standalone data and result contract are stable.
