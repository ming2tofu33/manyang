# Night Check-In Replacement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current "꿈 씨앗" product surface with a grounded "밤의 기록" flow that captures nightly mood, body condition, and one note, then uses it as optional dream-reading context.

**Architecture:** Introduce a new `night-checkin` domain across frontend storage, UI, API client, API route, Supabase persistence, archive rendering, and dream-analysis request context. Keep `/seed` only as a redirect to `/night` for compatibility, but remove all user-facing "씨앗/심기" language and all runtime imports of `dream-seed`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Supabase/Postgres via `pg`, existing Manyang backend package, localStorage, RLS SQL migrations.

---

## Product Decisions

Use these terms everywhere in UI and docs:

| Old | New |
| --- | --- |
| 꿈 씨앗 | 밤의 기록 |
| 꿈 씨앗 심기 | 밤의 기록 남기기 |
| 씨앗을 심었어요 | 오늘 밤의 기록을 남겼어요 |
| 어젯밤의 꿈 씨앗 | 어젯밤의 기록 |
| `seedDate` | `checkInDate` |
| `intentId/intentLabel` | `moodId/moodLabel` |
| `atmosphere` | `conditionId/conditionLabel` |

Primary copy:

```text
오늘의 기분이 내일 꿈 해몽의 작은 단서가 돼요.
```

Supporting copy:

```text
잠들기 전의 마음을 남겨두면,
내일 아침 꿈을 읽을 때 하루의 맥락을 함께 볼 수 있어요.
```

Do not use:

```text
꿈을 정해요
꿈에게 물어봐요
원하는 꿈을 꿔요
꿈해몽이 더 정확해져요
```

## Migration Policy

- Do not migrate old `dream_seeds` data into `night_checkins`; the product meaning changed.
- Do not drop the old `manyang.dream_seeds` table in this change. It can remain unused for rollback until a later cleanup migration.
- Remove runtime reads/writes to `/api/seeds`, `dream_seeds`, `dream-seed`, and `DreamSeed*`.
- Keep `/seed` route as a server redirect to `/night` only.
- `seed` may remain in unrelated contexts such as `cardTitleSeeds`, `Encyclopedia Seed Data`, and backend symbol seed scripts.

---

### Task 1: Add Night Check-In Options

**Files:**
- Create: `frontend/src/lib/night-checkin-options.ts`
- Create: `frontend/src/lib/night-checkin-options.test.ts`
- Delete later: `frontend/src/lib/dream-seed-options.ts`
- Delete later: `frontend/src/lib/dream-seed-options.test.ts`

**Step 1: Write the failing test**

Create `frontend/src/lib/night-checkin-options.test.ts`:

```ts
import {
  defaultNightCheckInCondition,
  defaultNightCheckInMood,
  getNightCheckInConditionById,
  getNightCheckInMoodById,
  nightCheckInConditions,
  nightCheckInCopy,
  nightCheckInMoods,
  nightCheckInNoteMaxLength,
  nightCheckInRoute,
} from "./night-checkin-options";

describe("night check-in options", () => {
  test("uses the new night check-in route and safe copy", () => {
    expect(nightCheckInRoute).toBe("/night");
    expect(nightCheckInCopy.pageTitle).toBe("밤의 기록");
    expect(nightCheckInCopy.submit).toBe("밤의 기록 남기기");
    expect(nightCheckInCopy.helper).toContain("내일 꿈 해몽의 작은 단서");
    expect(JSON.stringify(nightCheckInCopy)).not.toMatch(/씨앗|심기|원하는 꿈|정확해져요/);
  });

  test("provides mood and condition options", () => {
    expect(nightCheckInMoods.map((option) => option.label)).toEqual([
      "편안함",
      "지침",
      "불안함",
      "설렘",
      "가라앉음",
      "복잡함",
    ]);
    expect(nightCheckInConditions.map((option) => option.label)).toEqual([
      "가벼움",
      "무거움",
      "긴장됨",
      "졸림",
      "예민함",
      "괜찮음",
    ]);
    expect(defaultNightCheckInMood).toBe(nightCheckInMoods[0]);
    expect(defaultNightCheckInCondition).toBe(nightCheckInConditions[5]);
  });

  test("looks up options by id", () => {
    expect(getNightCheckInMoodById("anxious")?.label).toBe("불안함");
    expect(getNightCheckInConditionById("tense")?.label).toBe("긴장됨");
    expect(getNightCheckInMoodById("missing")).toBeUndefined();
    expect(getNightCheckInConditionById("missing")).toBeUndefined();
  });

  test("keeps the note short", () => {
    expect(nightCheckInNoteMaxLength).toBe(100);
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```powershell
npm --prefix frontend test -- src/lib/night-checkin-options.test.ts
```

Expected: FAIL because `night-checkin-options.ts` does not exist.

**Step 3: Implement the options module**

Create `frontend/src/lib/night-checkin-options.ts`:

```ts
export const nightCheckInRoute = "/night";
export const legacyDreamSeedRoute = "/seed";
export const nightCheckInBackground = "/manyang/backgrounds/dreamseed.webp";
export const nightCheckInNoteMaxLength = 100;

export const nightCheckInCopy = {
  homeCta: "밤의 기록 남기기",
  pageTitle: "밤의 기록",
  pageSubtitle: "잠들기 전의 마음과 몸 상태를 짧게 남겨요.",
  heroKicker: "하루의 마지막 체크인",
  heroTitleLines: ["오늘의 기분이", "내일 꿈 해몽의 단서가 돼요"],
  helper: "오늘의 기분이 내일 꿈 해몽의 작은 단서가 돼요.",
  moodTitle: "오늘 하루의 기분은 어땠나요?",
  conditionTitle: "지금 몸 컨디션은 어떤가요?",
  noteLabel: "오늘 마음에 남은 한 줄",
  optionalLabel: "(선택)",
  notePlaceholder: "오늘 가장 오래 남은 장면이나 감정을 적어주세요.",
  noteHint: "꿈을 정하는 기록이 아니라, 내일 꿈을 읽을 때 참고할 하루의 맥락이에요.",
  savedTitle: "오늘 밤의 기록을 남겼어요.",
  submit: "밤의 기록 남기기",
  submitAgain: "밤의 기록 다시 남기기",
  footer: "아침에 꿈이 떠오르면, 이 기록과 함께 꿈 영수증을 풀어볼 수 있어요.",
} as const;

export const nightCheckInMoods = [
  { id: "calm", label: "편안함" },
  { id: "tired", label: "지침" },
  { id: "anxious", label: "불안함" },
  { id: "excited", label: "설렘" },
  { id: "low", label: "가라앉음" },
  { id: "mixed", label: "복잡함" },
] as const;

export const nightCheckInConditions = [
  { id: "light", label: "가벼움" },
  { id: "heavy", label: "무거움" },
  { id: "tense", label: "긴장됨" },
  { id: "sleepy", label: "졸림" },
  { id: "sensitive", label: "예민함" },
  { id: "okay", label: "괜찮음" },
] as const;

export type NightCheckInMoodId = (typeof nightCheckInMoods)[number]["id"];
export type NightCheckInConditionId = (typeof nightCheckInConditions)[number]["id"];

export const defaultNightCheckInMood = nightCheckInMoods[0];
export const defaultNightCheckInCondition = nightCheckInConditions[5];

export function getNightCheckInMoodById(moodId: string) {
  return nightCheckInMoods.find((mood) => mood.id === moodId);
}

export function getNightCheckInConditionById(conditionId: string) {
  return nightCheckInConditions.find((condition) => condition.id === conditionId);
}
```

**Step 4: Run test to verify it passes**

Run:

```powershell
npm --prefix frontend test -- src/lib/night-checkin-options.test.ts
```

Expected: PASS.

**Step 5: Commit**

```powershell
git add frontend/src/lib/night-checkin-options.ts frontend/src/lib/night-checkin-options.test.ts
git commit -m "feat(frontend): add night check-in options"
```

---

### Task 2: Add Night Check-In Storage Domain

**Files:**
- Create: `frontend/src/lib/night-checkin.ts`
- Create: `frontend/src/lib/night-checkin.test.ts`
- Later replace imports from: `frontend/src/lib/dream-seed.ts`
- Later delete: `frontend/src/lib/dream-seed.ts`
- Later delete: `frontend/src/lib/dream-seed.test.ts`

**Step 1: Write the failing test**

Create `frontend/src/lib/night-checkin.test.ts`:

```ts
import {
  canPersistNightCheckIn,
  countMonthlyNightCheckIns,
  createNightCheckInRecord,
  getNightCheckIn,
  getNightCheckInRecords,
  isNightCheckInRelatedToDreamDate,
  nightCheckInChangedEvent,
  nightCheckInKey,
  nightCheckInRecordsKey,
  saveNightCheckIn,
  type NightCheckInInput,
  type StorageLike,
} from "./night-checkin";

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike {
  const data = new Map(Object.entries(initial));

  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

describe("night check-in storage", () => {
  test("creates a dated night check-in record", () => {
    const input: NightCheckInInput = {
      checkInDate: "2026-05-31",
      moodId: "anxious",
      moodLabel: "불안함",
      conditionId: "tense",
      conditionLabel: "긴장됨",
      note: "회의가 계속 마음에 남았다.",
    };

    expect(createNightCheckInRecord(input)).toMatchObject(input);
    expect(createNightCheckInRecord(input).savedAt).toMatch(/^\d{4}-/);
  });

  test("trims and limits note", () => {
    const record = createNightCheckInRecord({
      checkInDate: "2026-05-31",
      moodId: "calm",
      moodLabel: "편안함",
      conditionId: "okay",
      conditionLabel: "괜찮음",
      note: ` ${"가".repeat(140)} `,
    });

    expect(record.note).toHaveLength(100);
  });

  test("saves latest record and replaces same date in history", () => {
    const storage = createMemoryStorage();
    const first = createNightCheckInRecord({
      checkInDate: "2026-05-31",
      moodId: "calm",
      moodLabel: "편안함",
      conditionId: "okay",
      conditionLabel: "괜찮음",
      note: "첫 기록",
    });
    const second = createNightCheckInRecord({
      ...first,
      moodId: "tired",
      moodLabel: "지침",
      note: "다시 남긴 기록",
    });

    saveNightCheckIn(storage, first);
    saveNightCheckIn(storage, second);

    expect(getNightCheckIn(storage)).toEqual(second);
    expect(getNightCheckInRecords(storage)).toHaveLength(1);
    expect(storage.getItem(nightCheckInKey)).toContain("다시 남긴 기록");
    expect(storage.getItem(nightCheckInRecordsKey)).toContain("다시 남긴 기록");
  });

  test("counts unique monthly night check-ins", () => {
    const records = [
      createNightCheckInRecord({
        checkInDate: "2026-05-01",
        moodId: "calm",
        moodLabel: "편안함",
        conditionId: "okay",
        conditionLabel: "괜찮음",
        note: "",
      }),
      createNightCheckInRecord({
        checkInDate: "2026-06-01",
        moodId: "calm",
        moodLabel: "편안함",
        conditionId: "okay",
        conditionLabel: "괜찮음",
        note: "",
      }),
    ];

    expect(countMonthlyNightCheckIns(records, 2026, 5)).toBe(1);
  });

  test("relates same-day and previous-night records to a dream date", () => {
    const record = createNightCheckInRecord({
      checkInDate: "2026-05-30",
      moodId: "calm",
      moodLabel: "편안함",
      conditionId: "okay",
      conditionLabel: "괜찮음",
      note: "",
    });

    expect(isNightCheckInRelatedToDreamDate(record, "2026-05-31")).toBe(true);
    expect(isNightCheckInRelatedToDreamDate(record, "2026-06-02")).toBe(false);
  });

  test("guests cannot persist night check-ins", () => {
    expect(canPersistNightCheckIn({ isAuthenticated: false })).toBe(false);
    expect(canPersistNightCheckIn({ isAuthenticated: true })).toBe(true);
  });

  test("uses the new event name", () => {
    expect(nightCheckInChangedEvent).toBe("manyang:night-checkin-changed");
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```powershell
npm --prefix frontend test -- src/lib/night-checkin.test.ts
```

Expected: FAIL because `night-checkin.ts` does not exist.

**Step 3: Implement storage**

Create `frontend/src/lib/night-checkin.ts` using the current `dream-seed.ts` structure, but with these exported names:

```ts
import { nightCheckInNoteMaxLength } from "./night-checkin-options";

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type NightCheckInInput = {
  moodId: string;
  moodLabel: string;
  conditionId: string;
  conditionLabel: string;
  note: string;
  checkInDate: string;
};

export type NightCheckInRecord = NightCheckInInput & {
  savedAt: string;
};

export type NightCheckInPersistenceInput = {
  isAuthenticated: boolean;
};

export const nightCheckInKey = "manyang:night-checkin";
export const nightCheckInRecordsKey = "manyang:night-checkins";
export const nightCheckInChangedEvent = "manyang:night-checkin-changed";

const emptyNightCheckInRecords: NightCheckInRecord[] = [];

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeNote(note: string): string {
  return note.trim().slice(0, nightCheckInNoteMaxLength);
}

function normalizeStoredNightCheckIn(record: NightCheckInRecord | null): NightCheckInRecord | null {
  if (!record) return null;
  return {
    ...record,
    note: normalizeNote(record.note),
  };
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPreviousDateString(dateString: string): string | null {
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return formatLocalDate(date);
}

function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function notifyNightCheckInChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(nightCheckInChangedEvent));
  }
}

export function createNightCheckInRecord(input: NightCheckInInput): NightCheckInRecord {
  return {
    ...input,
    note: normalizeNote(input.note),
    savedAt: new Date().toISOString(),
  };
}

export function canPersistNightCheckIn(input: NightCheckInPersistenceInput): boolean {
  return input.isAuthenticated;
}

export function getNightCheckIn(storage: StorageLike): NightCheckInRecord | null {
  return normalizeStoredNightCheckIn(parseJson<NightCheckInRecord | null>(storage.getItem(nightCheckInKey), null));
}

export function getNightCheckInRecords(storage: StorageLike): NightCheckInRecord[] {
  const records = parseJson<NightCheckInRecord[]>(storage.getItem(nightCheckInRecordsKey), []);
  return Array.isArray(records)
    ? records.map((record) => normalizeStoredNightCheckIn(record)).filter((record): record is NightCheckInRecord => Boolean(record))
    : [];
}

export function saveNightCheckIn(storage: StorageLike, record: NightCheckInRecord): void {
  const records = getNightCheckInRecords(storage).filter((storedRecord) => storedRecord.checkInDate !== record.checkInDate);
  storage.setItem(nightCheckInKey, JSON.stringify(record));
  storage.setItem(nightCheckInRecordsKey, JSON.stringify([record, ...records]));
}

export function countMonthlyNightCheckIns(records: NightCheckInRecord[], year: number, month: number): number {
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;
  const checkInDates = new Set(records.map((record) => record.checkInDate));
  return [...checkInDates].filter((date) => date.startsWith(monthPrefix)).length;
}

export function isNightCheckInRelatedToDreamDate(record: NightCheckInRecord | null, dreamDate: string): boolean {
  if (!record) return false;
  const previousDreamDate = getPreviousDateString(dreamDate);
  return record.checkInDate === dreamDate || record.checkInDate === previousDreamDate;
}

export function subscribeToNightCheckIn(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(nightCheckInChangedEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(nightCheckInChangedEvent, onStoreChange);
  };
}

export function getNightCheckInSnapshotFromBrowser(): NightCheckInRecord | null {
  const storage = getBrowserStorage();
  return storage ? getNightCheckIn(storage) : null;
}

export function getNightCheckInRecordsSnapshotFromBrowser(): NightCheckInRecord[] {
  const storage = getBrowserStorage();
  return storage ? getNightCheckInRecords(storage) : emptyNightCheckInRecords;
}

export function getEmptyNightCheckInRecordsSnapshot(): NightCheckInRecord[] {
  return emptyNightCheckInRecords;
}

export function saveNightCheckInToBrowser(
  record: NightCheckInRecord,
  persistence: NightCheckInPersistenceInput = { isAuthenticated: false },
): boolean {
  if (!canPersistNightCheckIn(persistence)) return false;
  const storage = getBrowserStorage();
  if (!storage) return false;
  saveNightCheckIn(storage, record);
  notifyNightCheckInChanged();
  return true;
}
```

If snapshot caching from `dream-seed.ts` is still needed, add it after the tests pass; do not optimize before the domain rename works.

**Step 4: Run test to verify it passes**

Run:

```powershell
npm --prefix frontend test -- src/lib/night-checkin.test.ts
```

Expected: PASS.

**Step 5: Commit**

```powershell
git add frontend/src/lib/night-checkin.ts frontend/src/lib/night-checkin.test.ts
git commit -m "feat(frontend): add night check-in storage"
```

---

### Task 3: Replace Home State and Navigation Route

**Files:**
- Modify: `frontend/src/lib/home-mode.ts`
- Modify: `frontend/src/lib/home-mode.test.ts`
- Modify: `frontend/src/lib/navigation.ts`
- Modify: `frontend/src/lib/navigation.test.ts`
- Modify: `frontend/src/components/today-home-actions.tsx`
- Modify: `frontend/src/components/today-home-actions.test.tsx`

**Step 1: Write the failing tests**

Update `frontend/src/lib/home-mode.test.ts` to import `NightCheckInRecord` from `./night-checkin` and assert:

```ts
expect(getHomeState(new Date("2026-05-31T21:00:00+09:00"), null)).toMatchObject({
  mode: "night",
  question: "오늘 하루의 기분을 남겨둘까요?",
  secondary: { label: "밤의 기록 남기기", href: "/night" },
});
```

Add recent record assertions:

```ts
expect(state.seedBadge).toBeUndefined();
expect(state.nightCheckInBadge).toBe("밤 기록: 불안함 · 긴장됨");
```

Update `HomeState` expectations so the field is `nightCheckInBadge`, not `seedBadge`.

Update `frontend/src/lib/navigation.test.ts`:

```ts
import { legacyDreamSeedRoute, nightCheckInRoute } from "./night-checkin-options";

test("treats the night check-in routes as Today", () => {
  expect(getActiveNavItem(nightCheckInRoute)?.key).toBe("today");
  expect(getActiveNavItem(legacyDreamSeedRoute)?.key).toBe("today");
});
```

Update `frontend/src/components/today-home-actions.test.tsx` to expect the visible CTA text `밤의 기록 남기기` and href `/night`.

**Step 2: Run focused tests to verify they fail**

Run:

```powershell
npm --prefix frontend test -- src/lib/home-mode.test.ts src/lib/navigation.test.ts src/components/today-home-actions.test.tsx
```

Expected: FAIL because code still imports `dream-seed` and uses `/seed` copy.

**Step 3: Implement route/state changes**

In `frontend/src/lib/home-mode.ts`:

- Replace `DreamSeedRecord` with `NightCheckInRecord`.
- Replace `seedBadge` field with `nightCheckInBadge`.
- Replace helper names with `getNightCheckInBadge`, `isMorningNightCheckInVisible`, `isTonightNightCheckInVisible`.
- Use `/night` for CTA href.

Expected shape:

```ts
import type { NightCheckInRecord } from "./night-checkin";

export type HomeState = {
  mode: HomeMode;
  question: string;
  primary: HomeAction;
  secondary: HomeAction;
  tertiary: HomeAction;
  nightCheckInBadge: string | null;
};

function getNightCheckInBadge(record: NightCheckInRecord | null): string | null {
  return record ? `밤 기록: ${record.moodLabel} · ${record.conditionLabel}` : null;
}
```

Night mode copy:

```ts
question: hasTonightRecord ? "오늘 밤의 기록을 남겼어요" : "오늘 하루의 기분을 남겨둘까요?",
secondary: { label: "밤의 기록 남기기", href: "/night" },
```

Morning mode copy:

```ts
question: hasRecentRecord ? "어젯밤 기록이 있어요. 꿈에 어떤 장면이 남았나요?" : "어젯밤 꿈을 기억하나요?",
tertiary: { label: "밤의 기록 남기기", href: "/night" },
```

In `frontend/src/lib/navigation.ts`, import routes from `night-checkin-options` and match both:

```ts
pathname === "/" ||
pathname.startsWith("/morning") ||
pathname.startsWith(nightCheckInRoute) ||
pathname.startsWith(legacyDreamSeedRoute)
```

In `frontend/src/components/today-home-actions.tsx`, subscribe to `night-checkin` storage and pass that record to `getHomeState`.

**Step 4: Run focused tests**

Run:

```powershell
npm --prefix frontend test -- src/lib/home-mode.test.ts src/lib/navigation.test.ts src/components/today-home-actions.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```powershell
git add frontend/src/lib/home-mode.ts frontend/src/lib/home-mode.test.ts frontend/src/lib/navigation.ts frontend/src/lib/navigation.test.ts frontend/src/components/today-home-actions.tsx frontend/src/components/today-home-actions.test.tsx
git commit -m "feat(frontend): route home to night check-ins"
```

---

### Task 4: Build Night Check-In Page and Redirect Legacy `/seed`

**Files:**
- Create: `frontend/src/components/night-checkin-form.tsx`
- Create: `frontend/src/components/night-checkin-form.test.tsx`
- Create: `frontend/src/app/night/page.tsx`
- Modify: `frontend/src/app/seed/page.tsx`
- Delete later: `frontend/src/components/dream-seed-form.tsx`
- Delete later: `frontend/src/components/dream-seed-form.test.tsx`

**Step 1: Write the failing component test**

Create `frontend/src/components/night-checkin-form.test.tsx`:

```ts
import { renderToStaticMarkup } from "react-dom/server";

import { NightCheckInForm } from "./night-checkin-form";

describe("NightCheckInForm", () => {
  test("renders grounded night record copy", () => {
    const markup = renderToStaticMarkup(<NightCheckInForm />);

    expect(markup).toContain("오늘 하루의 기분은 어땠나요?");
    expect(markup).toContain("지금 몸 컨디션은 어떤가요?");
    expect(markup).toContain("오늘 마음에 남은 한 줄");
    expect(markup).toContain("밤의 기록 남기기");
    expect(markup).toContain('data-routine-login-cta="night-checkin"');
    expect(markup).not.toMatch(/씨앗|심기|꿈에게|원하는 꿈/);
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```powershell
npm --prefix frontend test -- src/components/night-checkin-form.test.tsx
```

Expected: FAIL because component does not exist.

**Step 3: Implement component from the existing form**

Copy the layout approach from `frontend/src/components/dream-seed-form.tsx`, but:

- Import from `@/lib/night-checkin` and `@/lib/night-checkin-options`.
- Replace intent buttons with mood buttons.
- Replace atmosphere buttons with condition buttons.
- Replace `saveDreamSeedToApi` with `saveNightCheckInToApi` after Task 7 is available. Until Task 7, leave a TODO or use local only only in a temporary branch. Prefer implementing Task 7 before wiring final save.
- Use `data-routine-login-cta="night-checkin"`.
- Use this guest prompt:

```text
로그인하면 밤의 기록을 달력에 남길 수 있어요.
비로그인 상태에서는 밤 기록을 누적하지 않고, 로그인하면 내 꿈 기록과 함께 이어볼 수 있어요.
```

Button text:

```tsx
{hasSavedNightCheckInToday ? "밤의 기록 다시 남기기" : "밤의 기록 남기기"}
```

**Step 4: Create `/night` page**

Create `frontend/src/app/night/page.tsx`:

```tsx
import { AppScreen } from "@/components/app-screen";
import { NightCheckInForm } from "@/components/night-checkin-form";
import { nightCheckInBackground, nightCheckInCopy } from "@/lib/night-checkin-options";

export const metadata = {
  title: "밤의 기록 | 마냥 꿈해몽",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NightPage() {
  return (
    <AppScreen
      background={nightCheckInBackground}
      title={nightCheckInCopy.pageTitle}
      subtitle={nightCheckInCopy.pageSubtitle}
      activeNavKey="today"
    >
      <NightCheckInForm />
    </AppScreen>
  );
}
```

Adjust prop names to match the actual `AppScreen` API in `frontend/src/components/app-screen.tsx`.

**Step 5: Redirect `/seed`**

Modify `frontend/src/app/seed/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export const metadata = {
  title: "밤의 기록 | 마냥 꿈해몽",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SeedRedirectPage() {
  redirect("/night");
}
```

**Step 6: Run focused tests**

Run:

```powershell
npm --prefix frontend test -- src/components/night-checkin-form.test.tsx
npm --prefix frontend build
```

Expected: component test PASS and build includes `/night`. `/seed` should remain as a route that redirects.

**Step 7: Commit**

```powershell
git add frontend/src/components/night-checkin-form.tsx frontend/src/components/night-checkin-form.test.tsx frontend/src/app/night/page.tsx frontend/src/app/seed/page.tsx
git commit -m "feat(frontend): replace dream seed page with night check-in"
```

---

### Task 5: Add Night Check-In API Route and Client

**Files:**
- Create: `frontend/src/app/api/night-checkins/route.ts`
- Create: `frontend/src/app/api/night-checkins/route.test.ts`
- Modify: `frontend/src/lib/routine-record-api.ts`
- Modify: `frontend/src/lib/routine-record-api.test.ts`
- Later delete: `frontend/src/app/api/seeds/route.ts`
- Later delete: `frontend/src/app/api/seeds/route.test.ts`

**Step 1: Write route tests**

Create `frontend/src/app/api/night-checkins/route.test.ts` mirroring the old seeds route tests but with new fields:

```ts
import type { NightCheckInRecord } from "@/lib/night-checkin";
import { handleNightCheckInsRequest, validateNightCheckInRequestBody } from "./route";

function createNightCheckInRecord(): NightCheckInRecord {
  return {
    checkInDate: "2026-05-31",
    moodId: "anxious",
    moodLabel: "불안함",
    conditionId: "tense",
    conditionLabel: "긴장됨",
    note: "회의가 마음에 남았다.",
    savedAt: "2026-05-31T12:00:00.000Z",
  };
}

describe("/api/night-checkins", () => {
  test("requires authentication", async () => {
    const response = await handleNightCheckInsRequest(new Request("http://localhost/api/night-checkins"), {
      getAuthenticatedUserId: async () => null,
      listNightCheckInsForUser: async () => [],
      persistNightCheckInForUser: async () => createNightCheckInRecord(),
    });

    expect(response.status).toBe(401);
  });

  test("lists authenticated night check-ins", async () => {
    const records = [createNightCheckInRecord()];
    const response = await handleNightCheckInsRequest(new Request("http://localhost/api/night-checkins"), {
      getAuthenticatedUserId: async () => "user-1",
      listNightCheckInsForUser: async () => records,
      persistNightCheckInForUser: async () => createNightCheckInRecord(),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ records });
  });

  test("saves a valid night check-in", async () => {
    const response = await handleNightCheckInsRequest(
      new Request("http://localhost/api/night-checkins", {
        method: "POST",
        body: JSON.stringify({
          checkInDate: "2026-05-31",
          moodId: "anxious",
          moodLabel: "불안함",
          conditionId: "tense",
          conditionLabel: "긴장됨",
          note: "회의가 마음에 남았다.",
        }),
      }),
      {
        getAuthenticatedUserId: async () => "user-1",
        listNightCheckInsForUser: async () => [],
        persistNightCheckInForUser: async (input) => ({
          ...input,
          savedAt: "2026-05-31T12:00:00.000Z",
        }),
      },
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      record: {
        checkInDate: "2026-05-31",
        moodLabel: "불안함",
        conditionLabel: "긴장됨",
      },
    });
  });

  test("validates date and required fields", () => {
    expect(validateNightCheckInRequestBody({ checkInDate: "bad-date" }).ok).toBe(false);
    expect(validateNightCheckInRequestBody({ checkInDate: "2026-05-31", moodId: "" }).ok).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```powershell
npm --prefix frontend test -- src/app/api/night-checkins/route.test.ts
```

Expected: FAIL because route does not exist.

**Step 3: Implement API route**

Create `frontend/src/app/api/night-checkins/route.ts` using the old `seeds` route structure with:

- `NightCheckInRecord`
- `PersistNightCheckInForUserInput`
- `listNightCheckInsForUser`
- `persistNightCheckInForUser`
- `validateNightCheckInRequestBody`

Validation constants:

```ts
const OPTION_ID_MAX_LENGTH = 48;
const OPTION_LABEL_MAX_LENGTH = 80;
```

Required fields:

```ts
"moodId" | "moodLabel" | "conditionId" | "conditionLabel"
```

Date field:

```ts
checkInDate must use YYYY-MM-DD
```

**Step 4: Update API client**

Modify `frontend/src/lib/routine-record-api.ts`:

- Replace `DreamSeedInput/DreamSeedRecord` imports with `NightCheckInInput/NightCheckInRecord`.
- Rename:
  - `FetchDreamSeedsResult` -> `FetchNightCheckInsResult`
  - `SaveDreamSeedApiResult` -> `SaveNightCheckInApiResult`
  - `fetchDreamSeedsFromApi` -> `fetchNightCheckInsFromApi`
  - `saveDreamSeedToApi` -> `saveNightCheckInToApi`
- Use `/api/night-checkins`.

Add tests in `frontend/src/lib/routine-record-api.test.ts`:

```ts
expect(requestedUrls).toEqual(["/api/night-checkins"]);
expect(requestBody).toMatchObject({
  checkInDate: "2026-05-31",
  moodId: "anxious",
  conditionId: "tense",
});
```

**Step 5: Run focused tests**

Run:

```powershell
npm --prefix frontend test -- src/app/api/night-checkins/route.test.ts src/lib/routine-record-api.test.ts
```

Expected: PASS.

**Step 6: Commit**

```powershell
git add frontend/src/app/api/night-checkins frontend/src/lib/routine-record-api.ts frontend/src/lib/routine-record-api.test.ts
git commit -m "feat(frontend): add night check-in API"
```

---

### Task 6: Add Supabase Night Check-In Persistence

**Files:**
- Create: `supabase/migrations/20260531000100_create_night_checkins.sql`
- Modify: `frontend/src/lib/manyang-routine-schema.test.ts`
- Modify: `frontend/src/lib/server/manyang-db.ts`
- Add or modify: `frontend/src/lib/server/manyang-db.test.ts` if existing server DB tests cover query helpers

**Step 1: Write schema test**

Modify `frontend/src/lib/manyang-routine-schema.test.ts`:

```ts
expect(sql).toContain("create table if not exists manyang.night_checkins");
expect(sql).toContain("check_in_date date not null");
expect(sql).toContain("night_checkins_user_check_in_date_unique");
expect(sql).toContain("alter table manyang.night_checkins enable row level security");
```

Remove assertions that require `dream_seeds` if this test currently points to the latest routine migration only. If it intentionally checks all migrations, keep old checks and add new checks.

**Step 2: Run schema test to verify it fails**

Run:

```powershell
npm --prefix frontend test -- src/lib/manyang-routine-schema.test.ts
```

Expected: FAIL until new migration exists or test is updated.

**Step 3: Add migration**

Create `supabase/migrations/20260531000100_create_night_checkins.sql`:

```sql
create table if not exists manyang.night_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  check_in_date date not null,
  mood_id text not null,
  mood_label text not null,
  condition_id text not null,
  condition_label text not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  constraint night_checkins_user_check_in_date_unique unique (user_id, check_in_date)
);

create index if not exists night_checkins_user_date_idx
  on manyang.night_checkins (user_id, check_in_date desc, created_at desc);

alter table manyang.night_checkins enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'manyang'
      and tablename = 'night_checkins'
      and policyname = 'night_checkins_select_own'
  ) then
    create policy night_checkins_select_own
      on manyang.night_checkins for select
      using (user_id = (select auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'manyang'
      and tablename = 'night_checkins'
      and policyname = 'night_checkins_insert_own'
  ) then
    create policy night_checkins_insert_own
      on manyang.night_checkins for insert
      with check (user_id = (select auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'manyang'
      and tablename = 'night_checkins'
      and policyname = 'night_checkins_update_own'
  ) then
    create policy night_checkins_update_own
      on manyang.night_checkins for update
      using (user_id = (select auth.uid()))
      with check (user_id = (select auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'manyang'
      and tablename = 'night_checkins'
      and policyname = 'night_checkins_delete_own'
  ) then
    create policy night_checkins_delete_own
      on manyang.night_checkins for delete
      using (user_id = (select auth.uid()));
  end if;
end $$;

grant select, insert, update, delete on manyang.night_checkins to authenticated, service_role;
```

**Step 4: Update server DB helpers**

Modify `frontend/src/lib/server/manyang-db.ts`:

- Import `NightCheckInRecord` from `@/lib/night-checkin`.
- Replace `PersistDreamSeedForUserInput` with:

```ts
export type PersistNightCheckInForUserInput = Omit<NightCheckInRecord, "savedAt"> & {
  userId: string;
};
```

- Add `createNightCheckInRecordFromDbRow`.
- Add `listNightCheckInsForUser`.
- Add `persistNightCheckInForUser`.
- Query `manyang.night_checkins`.
- Use `on conflict on constraint night_checkins_user_check_in_date_unique`.

Expected insert fields:

```sql
user_id,
check_in_date,
mood_id,
mood_label,
condition_id,
condition_label,
note
```

Expected return mapping:

```ts
return {
  checkInDate: row.check_in_date,
  moodId: row.mood_id,
  moodLabel: row.mood_label,
  conditionId: row.condition_id,
  conditionLabel: row.condition_label,
  note: row.note ?? "",
  savedAt: row.created_at,
};
```

Do not delete the old `listDreamSeedsForUser` and `persistDreamSeedForUser` until all callers are removed. Delete them in Task 11 cleanup.

**Step 5: Run tests**

Run:

```powershell
npm --prefix frontend test -- src/lib/manyang-routine-schema.test.ts src/app/api/night-checkins/route.test.ts
```

Expected: PASS.

**Step 6: Commit**

```powershell
git add supabase/migrations/20260531000100_create_night_checkins.sql frontend/src/lib/manyang-routine-schema.test.ts frontend/src/lib/server/manyang-db.ts
git commit -m "feat(db): add night check-in persistence"
```

---

### Task 7: Wire Remote Routine Records to Night Check-Ins

**Files:**
- Modify: `frontend/src/lib/use-routine-records.ts`
- Modify: `frontend/src/lib/use-routine-records.test.ts`
- Modify: `frontend/src/components/night-checkin-form.tsx`
- Modify: `frontend/src/components/night-checkin-form.test.tsx`

**Step 1: Write failing hook tests**

Update `frontend/src/lib/use-routine-records.test.ts`:

- Replace `seedRecords` with `nightCheckIns`.
- Replace `mergeRemoteDreamSeedRecord` with `mergeRemoteNightCheckInRecord`.
- Assert guests do not expose local night check-ins.

Example:

```ts
expect(resolveRoutineRecordState([], [createNightCheckIn()], {
  status: "guest",
  pawprints: [],
  nightCheckIns: [],
})).toMatchObject({
  nightCheckIns: [],
  source: "guest",
});
```

**Step 2: Run test to verify it fails**

Run:

```powershell
npm --prefix frontend test -- src/lib/use-routine-records.test.ts
```

Expected: FAIL because hook still exposes `seedRecords`.

**Step 3: Implement hook rename**

Modify `frontend/src/lib/use-routine-records.ts`:

- `seedRecords` -> `nightCheckIns`
- `DreamSeedRecord` -> `NightCheckInRecord`
- `fetchDreamSeedsFromApi` -> `fetchNightCheckInsFromApi`
- `mergeDreamSeed` -> `mergeNightCheckIn`
- `mergeRemoteDreamSeedRecord` -> `mergeRemoteNightCheckInRecord`
- Merge on `checkInDate`.

Expected snapshot:

```ts
export type RemoteRoutineRecordsSnapshot = {
  status: "loading" | "server" | "guest";
  pawprints: PawprintRecord[];
  nightCheckIns: NightCheckInRecord[];
};
```

**Step 4: Wire form save**

Modify `frontend/src/components/night-checkin-form.tsx`:

- Import `saveNightCheckInToApi`.
- Import `mergeRemoteNightCheckInRecord`.
- Save API result to remote snapshot and browser storage.

Expected logic:

```ts
const saveResult = await saveNightCheckInToApi(record);
if (saveResult.status === "unauthenticated") {
  setIsAuthenticated(false);
  setShowGuestPersistencePrompt(true);
  return;
}
if (saveResult.status === "error") {
  setRoutineSaveError(true);
  return;
}
mergeRemoteNightCheckInRecord(saveResult.record);
saveNightCheckInToBrowser(saveResult.record, { isAuthenticated });
```

**Step 5: Run focused tests**

Run:

```powershell
npm --prefix frontend test -- src/lib/use-routine-records.test.ts src/components/night-checkin-form.test.tsx src/lib/routine-record-api.test.ts
```

Expected: PASS.

**Step 6: Commit**

```powershell
git add frontend/src/lib/use-routine-records.ts frontend/src/lib/use-routine-records.test.ts frontend/src/components/night-checkin-form.tsx frontend/src/components/night-checkin-form.test.tsx
git commit -m "feat(frontend): load remote night check-ins"
```

---

### Task 8: Update Archive Calendar and Timeline

**Files:**
- Modify: `frontend/src/lib/archive-records.ts`
- Modify: `frontend/src/lib/archive-records.test.ts`
- Modify: `frontend/src/components/archive-calendar.tsx`
- Modify: `frontend/src/components/archive-calendar.test.tsx`
- Modify: `frontend/src/components/dream-archive-list.tsx`
- Modify: `frontend/src/components/dream-archive-list.test.tsx`
- Optional modify: `frontend/src/lib/archive-calendar-layout.ts`
- Optional modify: `frontend/src/lib/archive-calendar-layout.test.ts`

**Step 1: Write failing archive tests**

Update `frontend/src/lib/archive-records.test.ts`:

```ts
expect(createArchiveTimeline({
  dreamRecords: [],
  pawprints: [],
  nightCheckIns: [
    {
      checkInDate: "2026-05-23",
      moodId: "anxious",
      moodLabel: "불안함",
      conditionId: "tense",
      conditionLabel: "긴장됨",
      note: "회의가 마음에 남았다.",
      savedAt: "2026-05-23T23:00:00.000Z",
    },
  ],
  year: 2026,
  month: 5,
})).toMatchObject([
  {
    type: "night_checkin",
    date: "2026-05-23",
    title: "밤의 기록",
    meta: "불안함 · 긴장됨",
  },
]);
```

Update component tests to expect `밤 기록`, not `꿈 씨앗`.

**Step 2: Run focused tests to verify they fail**

Run:

```powershell
npm --prefix frontend test -- src/lib/archive-records.test.ts src/components/archive-calendar.test.tsx src/components/dream-archive-list.test.tsx
```

Expected: FAIL because archive still uses seed records.

**Step 3: Implement archive domain rename**

In `frontend/src/lib/archive-records.ts`:

- `ArchiveTimelineItemType = "dream" | "pawprint" | "night_checkin"`
- Input property `nightCheckIns: NightCheckInRecord[]`
- Timeline item:

```ts
const nightCheckInItems = input.nightCheckIns
  .filter((record) => isInMonth(record.checkInDate, input.year, input.month))
  .map<ArchiveTimelineItem>((record) => ({
    id: `night-checkin-${record.checkInDate}`,
    type: "night_checkin",
    date: record.checkInDate,
    title: "밤의 기록",
    meta: joinMeta([record.moodLabel, record.conditionLabel]),
    sortAt: record.savedAt,
  }));
```

In `frontend/src/components/archive-calendar.tsx`:

- Import `countMonthlyNightCheckIns`.
- Destructure `nightCheckIns` from `useRoutineRecords`.
- Replace `monthlySeeds` with `monthlyNightCheckIns`.
- Label summary card as `밤 기록`.
- Use `checkInDate` for day marking.
- Rename local variables `seedDays` -> `nightCheckInDays`.

Use existing sparkles icon if no note icon exists, but label must be `밤 기록`.

**Step 4: Run focused tests**

Run:

```powershell
npm --prefix frontend test -- src/lib/archive-records.test.ts src/components/archive-calendar.test.tsx src/components/dream-archive-list.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```powershell
git add frontend/src/lib/archive-records.ts frontend/src/lib/archive-records.test.ts frontend/src/components/archive-calendar.tsx frontend/src/components/archive-calendar.test.tsx frontend/src/components/dream-archive-list.tsx frontend/src/components/dream-archive-list.test.tsx frontend/src/lib/archive-calendar-layout.ts frontend/src/lib/archive-calendar-layout.test.ts
git commit -m "feat(frontend): show night check-ins in archive"
```

---

### Task 9: Show Night Context on Result Receipt

**Files:**
- Modify: `frontend/src/components/dream-result-receipt.tsx`
- Modify: `frontend/src/components/dream-result-receipt.test.tsx`

**Step 1: Write failing result tests**

Update `frontend/src/components/dream-result-receipt.test.tsx` to mock or pass routine records with a night check-in related to the payload date. Assert:

```ts
expect(markup).toContain("어젯밤의 기록");
expect(markup).toContain("불안함 · 긴장됨");
expect(markup).toContain("회의가 마음에 남았다.");
expect(markup).not.toContain("꿈 씨앗");
```

**Step 2: Run focused test**

Run:

```powershell
npm --prefix frontend test -- src/components/dream-result-receipt.test.tsx
```

Expected: FAIL because receipt still uses `relatedSeed`.

**Step 3: Implement result receipt rename**

Modify `frontend/src/components/dream-result-receipt.tsx`:

- Import from `@/lib/night-checkin`.
- Use `getNightCheckInSnapshotFromBrowser`, `isNightCheckInRelatedToDreamDate`, `subscribeToNightCheckIn`.
- Use `nightCheckIns` from `useRoutineRecords`.
- Rename variables:
  - `storedSeed` -> `storedNightCheckIn`
  - `remoteSeedRecords` -> `remoteNightCheckIns`
  - `relatedSeed` -> `relatedNightCheckIn`

User-facing section:

```tsx
<p className="flex items-center gap-2 font-semibold text-[#ffd98a]">
  ...
  어젯밤의 기록
</p>
<p className="mt-1 text-[#fff3d7]/84">
  {relatedNightCheckIn.moodLabel} · {relatedNightCheckIn.conditionLabel}
</p>
```

**Step 4: Run focused test**

Run:

```powershell
npm --prefix frontend test -- src/components/dream-result-receipt.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```powershell
git add frontend/src/components/dream-result-receipt.tsx frontend/src/components/dream-result-receipt.test.tsx
git commit -m "feat(frontend): show night context on receipts"
```

---

### Task 10: Pass Night Context Into Dream Analysis

**Files:**
- Modify: `backend/src/contracts/dream.ts`
- Modify: `backend/src/services/structured-dream-analysis.ts`
- Modify: `backend/src/services/dream-reading-prompt.ts`
- Modify: `backend/tests/dream-reading-prompt.test.ts` or nearest prompt test
- Modify: `frontend/src/app/api/dreams/analyze/route.ts`
- Modify: `frontend/src/app/api/dreams/analyze/route.test.ts`
- Modify: `frontend/src/components/dream-entry-form.tsx`
- Modify: `frontend/src/components/dream-entry-form.test.tsx`
- Modify: `frontend/src/lib/dream-storage.ts`
- Modify: `frontend/src/lib/dream-storage.test.ts`

**Step 1: Add backend contract test**

In the prompt test, assert the prompt payload includes `nightContext` and instructions treat it as context only:

```ts
const prompt = buildDreamReadingPrompt({
  request: {
    dreamText: "복도를 달리는 꿈",
    nightContext: {
      checkInDate: "2026-05-30",
      moodLabel: "불안함",
      conditionLabel: "긴장됨",
      note: "회의가 마음에 남았다.",
    },
  },
  // existing baseline/structured/matches test fixtures
});

expect(prompt.input).toContain('"nightContext"');
expect(prompt.input).toContain("회의가 마음에 남았다.");
expect(prompt.instructions).toContain("Night context is optional daily context");
```

**Step 2: Run backend focused test to verify it fails**

Run:

```powershell
npm --prefix backend test -- dream-reading-prompt
```

Expected: FAIL until contract/prompt are updated.

**Step 3: Update backend contract**

Modify `backend/src/contracts/dream.ts`:

```ts
export type DreamNightContext = {
  checkInDate: string;
  moodLabel: string;
  conditionLabel: string;
  note?: string;
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
  locale?: "ko" | "en";
  userTimeZone?: string;
};
```

Modify prompt payload in `backend/src/services/dream-reading-prompt.ts`:

```ts
request: {
  dreamText: input.request.dreamText,
  dreamDate: input.request.dreamDate,
  wakeMood: input.request.wakeMood,
  dreamMood: input.request.dreamMood,
  nightContext: input.request.nightContext,
  catReaderType: input.request.catReaderType,
  userTimeZone: input.request.userTimeZone,
},
```

Add instruction:

```ts
"Night context is optional daily context from before sleep. Use it only to understand the user's day and emotional backdrop; never treat it as proof, prediction, diagnosis, or a reason to override the dream text and retrieved evidence.",
```

Do not make `nightContext` affect deterministic symbol matching in this task. It is prompt context only.

**Step 4: Add route validation**

In `frontend/src/app/api/dreams/analyze/route.ts`, add:

```ts
const NIGHT_CONTEXT_TEXT_MAX_LENGTH = 160;

function optionalNightContextField(
  body: Record<string, unknown>,
): { ok: true; value?: DreamAnalysisRequest["nightContext"] } | { ok: false; error: string } {
  const value = body.nightContext;
  if (value === undefined) return { ok: true };
  if (!isRecord(value)) return { ok: false, error: "nightContext must be an object" };
  if (typeof value.checkInDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.checkInDate)) {
    return { ok: false, error: "nightContext.checkInDate must use YYYY-MM-DD" };
  }
  const moodLabel = typeof value.moodLabel === "string" ? value.moodLabel.trim() : "";
  const conditionLabel = typeof value.conditionLabel === "string" ? value.conditionLabel.trim() : "";
  const note = typeof value.note === "string" ? value.note.trim().slice(0, NIGHT_CONTEXT_TEXT_MAX_LENGTH) : "";
  if (!moodLabel || !conditionLabel) {
    return { ok: false, error: "nightContext moodLabel and conditionLabel are required" };
  }
  return {
    ok: true,
    value: {
      checkInDate: value.checkInDate,
      moodLabel: moodLabel.slice(0, NIGHT_CONTEXT_TEXT_MAX_LENGTH),
      conditionLabel: conditionLabel.slice(0, NIGHT_CONTEXT_TEXT_MAX_LENGTH),
      ...(note ? { note } : {}),
    },
  };
}
```

Include in validated request:

```ts
const nightContext = optionalNightContextField(body);
if (!nightContext.ok) return nightContext;
...
...(nightContext.value ? { nightContext: nightContext.value } : {}),
```

**Step 5: Wire dream entry form**

In `frontend/src/components/dream-entry-form.tsx`:

- Import `getNightCheckInSnapshotFromBrowser` and `isNightCheckInRelatedToDreamDate`.
- Find related record for `dreamDate`.
- Add to request body:

```ts
const relatedNightCheckIn = isNightCheckInRelatedToDreamDate(storedNightCheckIn, dreamDate) ? storedNightCheckIn : null;
const nightContext = relatedNightCheckIn
  ? {
      checkInDate: relatedNightCheckIn.checkInDate,
      moodLabel: relatedNightCheckIn.moodLabel,
      conditionLabel: relatedNightCheckIn.conditionLabel,
      ...(relatedNightCheckIn.note ? { note: relatedNightCheckIn.note } : {}),
    }
  : undefined;
```

Add:

```ts
...(nightContext ? { nightContext } : {}),
```

to both API request body and local latest-analysis payload.

**Step 6: Update dream storage**

In `frontend/src/lib/dream-storage.ts`, add `nightContext?: DreamNightContext` to completed and unavailable payload types. Import the type from backend if already available through `@manyang/backend`; otherwise define a frontend mirror type.

**Step 7: Run focused tests**

Run:

```powershell
npm --prefix backend test -- dream-reading-prompt
npm --prefix frontend test -- src/app/api/dreams/analyze/route.test.ts src/components/dream-entry-form.test.tsx src/lib/dream-storage.test.ts
```

Expected: PASS.

**Step 8: Commit**

```powershell
git add backend/src/contracts/dream.ts backend/src/services/dream-reading-prompt.ts backend/tests frontend/src/app/api/dreams/analyze/route.ts frontend/src/app/api/dreams/analyze/route.test.ts frontend/src/components/dream-entry-form.tsx frontend/src/components/dream-entry-form.test.tsx frontend/src/lib/dream-storage.ts frontend/src/lib/dream-storage.test.ts
git commit -m "feat: pass night check-in context to dream readings"
```

---

### Task 11: Remove Dream Seed Runtime Files and Imports

**Files:**
- Delete: `frontend/src/lib/dream-seed.ts`
- Delete: `frontend/src/lib/dream-seed.test.ts`
- Delete: `frontend/src/lib/dream-seed-options.ts`
- Delete: `frontend/src/lib/dream-seed-options.test.ts`
- Delete: `frontend/src/components/dream-seed-form.tsx`
- Delete: `frontend/src/components/dream-seed-form.test.tsx`
- Delete: `frontend/src/app/api/seeds/route.ts`
- Delete: `frontend/src/app/api/seeds/route.test.ts`
- Modify any remaining import sites found by `rg`

**Step 1: Search remaining runtime references**

Run:

```powershell
rg -n "dream-seed|DreamSeed|dreamSeed|/api/seeds|/seed|꿈 씨앗|씨앗|심기" frontend/src supabase vault/06-Business vault/03-Features vault/09-Implementation/plans/ACTIVE_SPRINT.md
```

Expected before cleanup: references still exist.

**Step 2: Delete obsolete files**

Use `Remove-Item` only for the exact obsolete files after verifying they are no longer imported:

```powershell
Remove-Item -LiteralPath frontend/src/lib/dream-seed.ts
Remove-Item -LiteralPath frontend/src/lib/dream-seed.test.ts
Remove-Item -LiteralPath frontend/src/lib/dream-seed-options.ts
Remove-Item -LiteralPath frontend/src/lib/dream-seed-options.test.ts
Remove-Item -LiteralPath frontend/src/components/dream-seed-form.tsx
Remove-Item -LiteralPath frontend/src/components/dream-seed-form.test.tsx
Remove-Item -LiteralPath frontend/src/app/api/seeds/route.ts
Remove-Item -LiteralPath frontend/src/app/api/seeds/route.test.ts
```

Do not delete `frontend/src/app/seed/page.tsx`; it is the compatibility redirect.

**Step 3: Re-run scoped search**

Run:

```powershell
rg -n "dream-seed|DreamSeed|dreamSeed|/api/seeds|꿈 씨앗|씨앗|심기" frontend/src
```

Expected: no results, except if a test intentionally checks `/seed` redirect. If `/seed` appears, it should only be route compatibility in `night-checkin-options.ts`, `navigation.ts`, and `app/seed/page.tsx`.

**Step 4: Run focused tests**

Run:

```powershell
npm --prefix frontend test -- src/lib/night-checkin.test.ts src/lib/night-checkin-options.test.ts src/lib/navigation.test.ts src/lib/home-mode.test.ts
```

Expected: PASS.

**Step 5: Commit**

```powershell
git add -A frontend/src
git commit -m "refactor(frontend): remove dream seed runtime"
```

---

### Task 12: Update Business and Feature Docs

**Files:**
- Modify: `vault/06-Business/MVP-Currency-Strategy.md`
- Modify: `vault/06-Business/Retention-Loops.md`
- Modify: `vault/06-Business/Access-Plan-Strategy.md`
- Modify: `vault/06-Business/Monetization-Roadmap.md`
- Modify: `vault/06-Business/Revenue-Expansion-and-Positioning.md`
- Modify: `vault/03-Features/Morning-Mood-Flow.md`
- Modify: `vault/09-Implementation/plans/ACTIVE_SPRINT.md`
- Optional create: `vault/03-Features/Night-Check-In-Flow.md`

**Step 1: Update docs text**

Replace product policy:

```text
꿈 씨앗은 폐기한다. 밤 루프는 "밤의 기록"으로 재정의한다.
밤의 기록은 꿈을 유도하거나 원하는 꿈을 약속하지 않는다.
사용자가 잠들기 전 남긴 기분, 컨디션, 한 줄 메모를 다음날 꿈 해몽의 생활 맥락으로만 사용한다.
```

Add `Night-Check-In-Flow.md` if the feature needs its own note:

```markdown
---
title: Night Check-In Flow
tags:
  - features
  - retention
  - night-routine
source: conversation
---

# Night Check-In Flow

> 밤의 기록은 꿈을 유도하는 기능이 아니라, 내일 꿈을 읽을 때 참고할 하루의 맥락이다.

---

## 사용자 흐름

밤 접속
→ 오늘 하루 기분 선택
→ 몸 컨디션 선택
→ 마음에 남은 한 줄 입력
→ 로그인 사용자만 기록장/달력에 저장
→ 다음날 꿈 입력 시 어젯밤 기록을 함께 참고

## Related

- [[Morning-Mood-Flow]]
- [[Dream-Archive-&-Calendar]]

## See Also

- [[Retention-Loops]] — 밤/아침 루프 설계 (06-Business)
- [[Access-Plan-Strategy]] — Guest/Free/Moon 접근 정책 (06-Business)
```

**Step 2: Update sprint**

In `vault/09-Implementation/plans/ACTIVE_SPRINT.md`:

- Replace `SEED-01` with `NIGHT-01`.
- Title: `밤의 기록 화면으로 꿈 씨앗 완전 교체`.
- Status should be `todo` or `doing`, not `review`, until implementation is complete.
- Add this plan to `Current Plan`:

```markdown
- [[../../../docs/plans/2026-05-31-night-checkin-replacement|Night Check-In Replacement Plan]]
```

**Step 3: Search docs**

Run:

```powershell
rg -n "꿈 씨앗|씨앗|심기|dream seed|dream-seed" vault/06-Business vault/03-Features vault/09-Implementation/plans/ACTIVE_SPRINT.md
```

Expected: no user-facing strategy references remain. It is acceptable to mention "꿈 씨앗 폐기" in a decision note if clearly marked as historical.

**Step 4: Commit**

```powershell
git add vault/06-Business vault/03-Features vault/09-Implementation/plans/ACTIVE_SPRINT.md docs/plans/2026-05-31-night-checkin-replacement.md
git commit -m "docs: plan night check-in replacement"
```

---

### Task 13: Final Verification

**Files:**
- No new files unless fixes are needed.

**Step 1: Run frontend focused tests**

Run:

```powershell
npm --prefix frontend test -- src/lib/night-checkin.test.ts src/lib/night-checkin-options.test.ts src/lib/home-mode.test.ts src/lib/navigation.test.ts src/lib/routine-record-api.test.ts src/lib/use-routine-records.test.ts src/lib/archive-records.test.ts src/components/night-checkin-form.test.tsx src/components/archive-calendar.test.tsx src/components/dream-result-receipt.test.tsx src/app/api/night-checkins/route.test.ts src/app/api/dreams/analyze/route.test.ts
```

Expected: PASS.

**Step 2: Run full frontend checks**

Run:

```powershell
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
```

Expected: all PASS.

**Step 3: Run backend checks**

Run:

```powershell
npm --prefix backend test
npm --prefix backend run typecheck
```

Expected: all PASS.

**Step 4: Run runtime grep**

Run:

```powershell
rg -n "dream-seed|DreamSeed|dreamSeed|/api/seeds|꿈 씨앗|씨앗|심기" frontend/src
```

Expected:

- No `dream-seed`, `DreamSeed`, `dreamSeed`, `/api/seeds`, `꿈 씨앗`, `씨앗`, or `심기` in runtime code.
- `/seed` may appear only for legacy redirect route support.

Run:

```powershell
rg -n "seedRecords|nightCheckIns|NightCheckIn|밤의 기록" frontend/src
```

Expected:

- No `seedRecords`.
- `NightCheckIn` and `밤의 기록` appear in the new domain.

**Step 5: Manual browser QA**

Start or reuse the dev server:

```powershell
npm --prefix frontend run dev
```

Open:

```text
http://127.0.0.1:3000/
http://127.0.0.1:3000/night
http://127.0.0.1:3000/seed
http://127.0.0.1:3000/archive
http://127.0.0.1:3000/result
```

Expected:

- Home night CTA says `밤의 기록 남기기`.
- `/night` shows mood, condition, and one-line note fields.
- `/seed` redirects to `/night`.
- Guest sees login CTA and does not persist night records.
- Logged-in user can save a night record.
- Archive summary shows `밤 기록`.
- Result receipt shows `어젯밤의 기록` when related context exists.
- No visible `꿈 씨앗`, `씨앗`, or `심기` remains.

**Step 6: Final commit**

```powershell
git status --short
git add -A
git commit -m "feat: replace dream seed with night check-in"
```

---

## Execution Notes

- This plan intentionally separates product rename, persistence, archive rendering, and dream-analysis context. Do not try to do all changes in one commit.
- Keep the old `/seed` route as redirect until analytics shows no usage.
- Do not update unrelated backend encyclopedia `seed` terms; those are data-seed concepts, not dream-seed product language.
- If Korean text appears mojibaked in PowerShell output, inspect files in the editor before editing and keep source files UTF-8.
- If any file has unrelated user changes, preserve them and only alter the night-check-in scope.
