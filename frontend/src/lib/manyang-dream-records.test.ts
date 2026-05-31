import { describe, expect, test } from "vitest";

import { createDreamRecordInsertModels, type PersistCompletedDreamReadingInput } from "./manyang-dream-records";

function createPersistInput(): PersistCompletedDreamReadingInput {
  return {
    userId: "00000000-0000-4000-8000-000000000001",
    dreamText: "I dreamed that a snake appeared in my room.",
    dreamDate: "2026-05-30",
    catReaderType: "gray_cat",
    wakeMood: "curious",
    dreamAtmospheres: ["anxious", "wistful"],
    dreamSensations: ["falling"],
    dreamSensationOther: "warm hands",
    analysis: {
      dreamId: "dream-runtime-id",
      analysisId: "analysis-runtime-id",
      cardId: "card-runtime-id",
      reader: {
        id: "gray_cat",
        name: "Gray Cat",
        access: "free",
      },
      summary: "A snake dream with a private room.",
      symbols: ["Snake", "Room"],
      emotions: ["curious"],
      themes: ["boundary"],
      interpretation: "The dream can point to alert energy inside a private space.",
      symbolReadings: [
        {
          symbol: "Snake",
          reading: "Snake can point to alert life energy.",
        },
      ],
      smallPrescription: "Ask what boundary needs care today.",
      readingBasis: {
        usedSymbols: ["Snake"],
        mainThemes: ["boundary"],
        confidence: 0.84,
      },
      readerNote: "Gray Cat leaves this as a question.",
      safetyNotice: "This is not a prediction.",
      card: {
        name: "Quiet Snake",
        type: "half_moon",
        keywords: ["snake", "room"],
        summary: "Alert energy in a private place.",
        message: "Stay curious.",
        theme: "boundary",
      },
    },
  };
}

describe("manyang dream record persistence models", () => {
  test("maps a completed dream reading into manyang schema rows without using runtime ids as table ids", () => {
    const rows = createDreamRecordInsertModels(createPersistInput());

    expect(rows.entry).toMatchObject({
      user_id: "00000000-0000-4000-8000-000000000001",
      dream_text: "I dreamed that a snake appeared in my room.",
      dream_date: "2026-05-30",
      cat_reader_type: "gray_cat",
      wake_mood: "curious",
      dream_atmospheres: ["anxious", "wistful"],
      dream_sensations: ["falling"],
      dream_sensation_other: "warm hands",
      status: "completed",
      source: "dream_analysis",
    });
    expect(rows.entry).not.toHaveProperty("id");

    expect(rows.reading).toMatchObject({
      user_id: "00000000-0000-4000-8000-000000000001",
      analysis_id: "analysis-runtime-id",
      summary: "A snake dream with a private room.",
      symbols: ["Snake", "Room"],
      raw_analysis: expect.objectContaining({
        dreamId: "dream-runtime-id",
      }),
    });
    expect(rows.reading).not.toHaveProperty("id");

    expect(rows.card).toMatchObject({
      user_id: "00000000-0000-4000-8000-000000000001",
      card_id: "card-runtime-id",
      card_name: "Quiet Snake",
      card_keywords: ["snake", "room"],
    });

    expect(rows.symbolHistory).toEqual([
      {
        user_id: "00000000-0000-4000-8000-000000000001",
        symbol: "Snake",
        related_emotions: ["curious"],
        related_themes: ["boundary"],
      },
      {
        user_id: "00000000-0000-4000-8000-000000000001",
        symbol: "Room",
        related_emotions: ["curious"],
        related_themes: ["boundary"],
      },
    ]);
  });
});
