# Daily Pawprint Design

## Goal

Add a lightweight retention layer that makes users feel that every day leaves a trace, even when they do not remember a dream. Pawprints are not currency and are not tied to payment. They are a daily activity marker.

## Product Rule

A user can earn at most one pawprint per app day. Any one of these actions keeps the daily streak:

- Recording morning mood
- Recording that the dream was not remembered
- Saving a dream receipt after interpretation

The app day starts at 05:00 and ends at 04:59 the next calendar day. This matches the morning dream routine better than midnight and avoids penalizing late-night or early-morning use.

## MVP Scope

Included:

- Show pawprints on the archive calendar.
- Show this month's pawprint count.
- Show current consecutive pawprint streak.
- Store which action created the pawprint for future analytics and UI copy.

Excluded:

- Point spending, shop mechanics, or paid currency.
- Multiple app-date increments per day.
- Milestone mechanics or decoration inventory.
- Full decoration inventory.
- Server sync or accounts.

## Data Model

Use localStorage for MVP.

Storage key: `manyang:pawprints`

Record shape:

```ts
type PawprintSource = "morning_record" | "forgotten_dream" | "receipt_saved";

type PawprintRecord = {
  id: string;
  appDate: string;
  source: PawprintSource;
  sourceId: string;
  createdAt: string;
};
```

`appDate` is calculated using the 05:00 boundary. Example: `2026-05-26 04:30` belongs to `2026-05-25`.

If another qualifying action happens on the same appDate, keep the first pawprint and do not increment count or streak again. The later action still keeps its own normal feature behavior, but it does not create a second pawprint.

## UX

Archive screen:

- Calendar days with pawprints show a small paw icon or dot.
- Top summary shows `이번 달 발자국 N개`.
- Nearby text shows `연속 발자국 N일째` when streak is active.

Action feedback:

- On the first qualifying action of an app day, show a short success line: `오늘의 발자국이 남았어요.`
- On later qualifying actions that same app day, avoid extra achievement language. Use normal feature success copy only.

## Edge Cases

- Same-day repeated morning mood save replaces the morning mood record but does not duplicate a pawprint.
- Receipt save after a morning pawprint does not add another pawprint.
- Corrupted localStorage falls back to an empty list.
- Month count uses appDate, not createdAt.
- Streak counts consecutive appDates ending at today if today has a pawprint, otherwise ending yesterday.

## Testing

Add unit tests for:

- 05:00 appDate boundary.
- One pawprint per appDate.
- First source preserved on duplicate appDate.
- Monthly count.
- Current streak.
- Corrupted storage fallback.

Add browser verification for:

- Morning record creates today's pawprint.
- Receipt save on same app day does not duplicate it.
- Archive calendar and summary reflect the pawprint.
