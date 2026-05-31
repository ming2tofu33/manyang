import { describe, expect, test } from "vitest";

import type { DreamUnavailablePayload } from "@/lib/dream-storage";
import { createRetryDreamAnalyzeRequestBody } from "./dream-result-page-client";

describe("DreamResultPageClient retry payload", () => {
  test("preserves selected feeling signals when retrying an unavailable reading", () => {
    const payload: DreamUnavailablePayload = {
      status: "unavailable",
      dreamText: "I dreamed that a snake appeared in my room.",
      dreamDate: "2026-05-30",
      catReaderType: "gray_cat",
      wakeMood: "curious",
      dreamAtmospheres: ["anxious", "wistful"],
      dreamSensations: ["falling"],
      dreamSensationOther: "warm hands",
      nightContext: {
        checkInDate: "2026-05-29",
        moodLabel: "편안함",
        conditionLabel: "괜찮음",
        note: "잠들기 전 차분했다.",
      },
      reason: "provider_error",
      retryable: true,
      failedAt: "2026-05-30T00:00:00.000Z",
    };

    expect(createRetryDreamAnalyzeRequestBody(payload)).toEqual({
      dreamText: "I dreamed that a snake appeared in my room.",
      dreamDate: "2026-05-30",
      catReaderType: "gray_cat",
      wakeMood: "curious",
      dreamAtmospheres: ["anxious", "wistful"],
      dreamSensations: ["falling"],
      dreamSensationOther: "warm hands",
      nightContext: {
        checkInDate: "2026-05-29",
        moodLabel: "편안함",
        conditionLabel: "괜찮음",
        note: "잠들기 전 차분했다.",
      },
    });
  });
});
