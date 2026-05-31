import type { DreamAnalysisResponse } from "@manyang/backend";
import { afterEach, describe, expect, test, vi } from "vitest";

import {
  DREAM_ANALYZE_MAX_DREAM_TEXT_LENGTH,
  handleDreamAnalyzeRequest,
  POST,
  resolveDreamLlmTimeoutMs,
  resolveDreamRagVectorIndexPath,
  validateDreamAnalyzeRequestBody,
} from "./route";

function createJsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/dreams/analyze", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function createJsonRequestWithCookie(body: unknown, cookie: string): Request {
  return new Request("http://localhost/api/dreams/analyze", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie,
    },
    body: JSON.stringify(body),
  });
}

function createRawRequest(body: string): Request {
  return new Request("http://localhost/api/dreams/analyze", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body,
  });
}

describe("POST /api/dreams/analyze", () => {
  const originalMode = process.env.MANYANG_ANALYSIS_MODE;
  const originalApiKey = process.env.OPENAI_API_KEY;
  const originalBaseUrl = process.env.OPENAI_BASE_URL;
  const originalLlmTimeoutMs = process.env.MANYANG_LLM_TIMEOUT_MS;
  const originalAllowMockAnalysis = process.env.MANYANG_ALLOW_MOCK_ANALYSIS;

  afterEach(() => {
    vi.useRealTimers();
    if (originalMode === undefined) {
      delete process.env.MANYANG_ANALYSIS_MODE;
    } else {
      process.env.MANYANG_ANALYSIS_MODE = originalMode;
    }

    if (originalApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalApiKey;
    }

    if (originalBaseUrl === undefined) {
      delete process.env.OPENAI_BASE_URL;
    } else {
      process.env.OPENAI_BASE_URL = originalBaseUrl;
    }

    if (originalLlmTimeoutMs === undefined) {
      delete process.env.MANYANG_LLM_TIMEOUT_MS;
    } else {
      process.env.MANYANG_LLM_TIMEOUT_MS = originalLlmTimeoutMs;
    }

    if (originalAllowMockAnalysis === undefined) {
      delete process.env.MANYANG_ALLOW_MOCK_ANALYSIS;
    } else {
      process.env.MANYANG_ALLOW_MOCK_ANALYSIS = originalAllowMockAnalysis;
    }

    vi.unstubAllEnvs();
  });

  test("returns a mock dream analysis response", async () => {
    const response = await handleDreamAnalyzeRequest(
      createJsonRequest({
        dreamText: "학교 복도에서 교실을 찾는데 문이 계속 바뀌었어요.",
        dreamDate: "2026-05-24",
        wakeMood: "anxious",
        catReaderType: "white_cat",
      }),
      {
        hasCompletedGuestBasicReadingOnDate: async () => false,
        persistGuestBasicReadingUsage: async () => undefined,
      },
    );

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.reader).toMatchObject({
      id: "white_cat",
      name: "하얀냥",
      access: "free",
    });
    expect(body.readerNote).toContain("같은 기준");
    expect(body.readerNote).not.toContain("하얀냥");
    expect(body.symbols).toEqual(expect.arrayContaining(["학교", "복도", "문", "찾기"]));
    expect(body.readingBasis.usedSymbols).toEqual(expect.arrayContaining(["학교", "복도", "문", "찾기"]));
    expect(body.summary).toContain("꿈");
    expect(body.card.name).toContain("밤");
  });

  test("does not expose mock analysis as a production dream reading unless explicitly allowed", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.MANYANG_ANALYSIS_MODE = "mock";
    delete process.env.MANYANG_ALLOW_MOCK_ANALYSIS;

    const response = await handleDreamAnalyzeRequest(
      createJsonRequest({
        dreamText: "I dreamed that a snake appeared in my room.",
        locale: "en",
      }),
      {
        hasCompletedGuestBasicReadingOnDate: async () => false,
        persistGuestBasicReadingUsage: async () => undefined,
      },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      status: "unavailable",
      error: "dream reading is unavailable",
      reason: "provider_missing",
      retryable: false,
    });
  });

  test("persists a completed reading for an authenticated user without requiring client-side DB access", async () => {
    const persistedInputs: unknown[] = [];
    const response = await handleDreamAnalyzeRequest(
      createJsonRequest({
        dreamText: "I dreamed that a snake appeared in my room.",
        dreamDate: "2026-05-30",
        wakeMood: "curious",
        catReaderType: "white_cat",
        dreamAtmospheres: ["anxious"],
        dreamSensations: ["falling"],
        dreamSensationOther: "warm hands",
      }),
      {
        getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
        findCompletedReadingForUserDreamOnDate: async () => null,
        persistCompletedDreamReading: async (input) => {
          persistedInputs.push(input);
        },
      },
    );

    expect(response.status).toBe(200);
    const analysis = await response.json();

    expect(persistedInputs).toHaveLength(1);
    expect(persistedInputs[0]).toMatchObject({
      userId: "00000000-0000-4000-8000-000000000001",
      dreamText: "I dreamed that a snake appeared in my room.",
      dreamDate: "2026-05-30",
      catReaderType: "white_cat",
      wakeMood: "curious",
      dreamAtmospheres: ["anxious"],
      dreamSensations: ["falling"],
      dreamSensationOther: "warm hands",
      analysis: {
        dreamId: analysis.dreamId,
      },
    });
  });

  test("still returns the completed reading when authenticated archive persistence fails", async () => {
    const response = await handleDreamAnalyzeRequest(
      createJsonRequest({
        dreamText: "I dreamed that a snake appeared in my room.",
        dreamDate: "2026-05-30",
        catReaderType: "white_cat",
      }),
      {
        getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
        findCompletedReadingForUserDreamOnDate: async () => null,
        persistCompletedDreamReading: async () => {
          throw new Error("database temporarily unavailable");
        },
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      dreamId: expect.any(String),
      reader: {
        id: "white_cat",
      },
    });
  });

  test("allows gray cat theme readings without treating them as Moon Pass-only detailed readings", async () => {
    const persistCompletedDreamReading = vi.fn();
    const response = await handleDreamAnalyzeRequest(
      createJsonRequest({
        dreamText: "I dreamed that a snake appeared in my room.",
        dreamDate: "2026-05-30",
        catReaderType: "gray_cat",
      }),
      {
        getAuthenticatedUserId: async () => null,
        hasCompletedGuestBasicReadingOnDate: async () => false,
        persistGuestBasicReadingUsage: async () => undefined,
        persistCompletedDreamReading,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      reader: {
        id: "gray_cat",
      },
    });
    expect(persistCompletedDreamReading).not.toHaveBeenCalled();
  });

  test("keeps gray cat theme readings available for Moon Pass users", async () => {
    const getAccessPlanForUser = vi.fn(async () => "moon_pass" as const);
    const response = await handleDreamAnalyzeRequest(
      createJsonRequest({
        dreamText: "I dreamed that a snake appeared in my room.",
        dreamDate: "2026-05-30",
        catReaderType: "gray_cat",
      }),
      {
        getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
        getAccessPlanForUser,
        findCompletedReadingForUserDreamOnDate: async () => null,
        persistCompletedDreamReading: async () => undefined,
      },
    );

    expect(response.status).toBe(200);
    expect(getAccessPlanForUser).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001");
  });

  test("allows an admin to request a detailed reading without Moon Pass access", async () => {
    const response = await handleDreamAnalyzeRequest(
      createJsonRequest({
        dreamText: "I dreamed of a gray hallway and a door.",
        dreamDate: "2026-05-30",
        catReaderType: "gray_cat",
      }),
      {
        getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
        getAccessPlanForUser: async () => "free_account",
        isAdminUser: async () => true,
        persistCompletedDreamReading: async () => undefined,
      },
    );

    expect(response.status).toBe(200);
  });

  test("returns the stored reading when a logged-in user re-submits the same dream (reroll lock)", async () => {
    const persistCompletedDreamReading = vi.fn();
    const storedReading = {
      dreamId: "stored-dream-id",
      summary: "이미 받은 해몽",
    } as unknown as DreamAnalysisResponse;
    const findCompletedReadingForUserDreamOnDate = vi.fn(async () => storedReading);

    const response = await handleDreamAnalyzeRequest(
      createJsonRequest({
        dreamText: "I dreamed that a snake appeared in my room.",
        dreamDate: "2026-05-30",
        catReaderType: "black_cat",
      }),
      {
        getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
        getAccessPlanForUser: async () => "free_account",
        findCompletedReadingForUserDreamOnDate,
        persistCompletedDreamReading,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ dreamId: "stored-dream-id" });
    expect(findCompletedReadingForUserDreamOnDate).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
      "2026-05-30",
      "I dreamed that a snake appeared in my room.",
    );
    expect(persistCompletedDreamReading).not.toHaveBeenCalled();
  });

  test("lets a logged-in user read a different dream on the same date", async () => {
    const persistCompletedDreamReading = vi.fn();
    const response = await handleDreamAnalyzeRequest(
      createJsonRequest({
        dreamText: "A brand new dream about climbing stairs.",
        dreamDate: "2026-05-30",
        catReaderType: "black_cat",
      }),
      {
        getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
        getAccessPlanForUser: async () => "free_account",
        findCompletedReadingForUserDreamOnDate: async () => null,
        persistCompletedDreamReading,
      },
    );

    expect(response.status).toBe(200);
    expect(persistCompletedDreamReading).toHaveBeenCalledTimes(1);
  });

  test("lets an admin bypass the reroll cache to re-test the same dream", async () => {
    const storedReading = {
      dreamId: "stored-dream-id",
      summary: "이미 받은 해몽",
    } as unknown as DreamAnalysisResponse;
    const findCompletedReadingForUserDreamOnDate = vi.fn(async () => storedReading);
    const persistCompletedDreamReading = vi.fn();
    const response = await handleDreamAnalyzeRequest(
      createJsonRequest({
        dreamText: "I dreamed that a snake appeared in my room.",
        dreamDate: "2026-05-30",
        catReaderType: "black_cat",
      }),
      {
        getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
        getAccessPlanForUser: async () => "free_account",
        isAdminUser: async () => true,
        findCompletedReadingForUserDreamOnDate,
        persistCompletedDreamReading,
      },
    );

    expect(response.status).toBe(200);
    expect(findCompletedReadingForUserDreamOnDate).not.toHaveBeenCalled();
    await expect(response.json()).resolves.not.toMatchObject({ dreamId: "stored-dream-id" });
    expect(persistCompletedDreamReading).toHaveBeenCalledTimes(1);
  });

  test("rejects a second guest basic reading on the same date before analysis work starts", async () => {
    const persistGuestBasicReadingUsage = vi.fn();
    const guestId = "00000000-0000-4000-8000-0000000000aa";
    const response = await handleDreamAnalyzeRequest(
      createJsonRequestWithCookie(
        {
          dreamText: "I dreamed that a snake appeared in my room.",
          dreamDate: "2026-05-30",
          catReaderType: "black_cat",
        },
        `manyang_guest_id=${guestId}`,
      ),
      {
        getAuthenticatedUserId: async () => null,
        hasCompletedGuestBasicReadingOnDate: async (receivedGuestId, dreamDate) => {
          expect(receivedGuestId).toBe(guestId);
          expect(dreamDate).toBe("2026-05-30");
          return true;
        },
        persistGuestBasicReadingUsage,
      },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: "dream reading is locked",
      reason: "guest_daily_limit",
    });
    expect(persistGuestBasicReadingUsage).not.toHaveBeenCalled();
  });

  test("sets a guest cookie and records guest usage after a successful guest basic reading", async () => {
    const guestId = "00000000-0000-4000-8000-0000000000bb";
    const persistedGuestUsage: unknown[] = [];
    const response = await handleDreamAnalyzeRequest(
      createJsonRequest({
        dreamText: "I dreamed that a snake appeared in my room.",
        dreamDate: "2026-05-30",
        catReaderType: "black_cat",
      }),
      {
        getAuthenticatedUserId: async () => null,
        createGuestId: () => guestId,
        hasCompletedGuestBasicReadingOnDate: async () => false,
        persistGuestBasicReadingUsage: async (input) => {
          persistedGuestUsage.push(input);
        },
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain(`manyang_guest_id=${guestId}`);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=Lax");
    expect(persistedGuestUsage).toEqual([
      {
        guestId,
        dreamDate: "2026-05-30",
      },
    ]);
  });

  test("uses the Korea midnight app date when the client omits dreamDate", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-31T15:00:00.000Z"));

    const guestId = "00000000-0000-4000-8000-0000000000cc";
    const checkedDates: string[] = [];
    const persistedGuestUsage: unknown[] = [];
    const response = await handleDreamAnalyzeRequest(
      createJsonRequest({
        dreamText: "I dreamed that a snake appeared in my room.",
        catReaderType: "black_cat",
      }),
      {
        getAuthenticatedUserId: async () => null,
        createGuestId: () => guestId,
        hasCompletedGuestBasicReadingOnDate: async (_guestId, dreamDate) => {
          checkedDates.push(dreamDate);
          return false;
        },
        persistGuestBasicReadingUsage: async (input) => {
          persistedGuestUsage.push(input);
        },
      },
    );

    expect(response.status).toBe(200);
    expect(checkedDates).toEqual(["2026-06-01"]);
    expect(persistedGuestUsage).toEqual([
      {
        guestId,
        dreamDate: "2026-06-01",
      },
    ]);
  });

  test("returns 400 when dreamText is empty", async () => {
    const response = await POST(createJsonRequest({ dreamText: "   " }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "dreamText is required",
    });
  });

  test("returns 400 when the request body is malformed JSON", async () => {
    const response = await POST(createRawRequest("{not-json"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "invalid JSON body",
    });
  });

  test("returns 400 when the request body is not an object", async () => {
    const response = await POST(createJsonRequest("I dreamed of a snake."));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "request body must be an object",
    });
  });

  test("returns 400 when dreamText exceeds the API limit", async () => {
    const response = await POST(
      createJsonRequest({
        dreamText: "a".repeat(DREAM_ANALYZE_MAX_DREAM_TEXT_LENGTH + 1),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: `dreamText must be ${DREAM_ANALYZE_MAX_DREAM_TEXT_LENGTH} characters or fewer`,
    });
  });

  test("returns 400 when enum-like fields are invalid", async () => {
    const response = await POST(
      createJsonRequest({
        dreamText: "I dreamed that a snake appeared in my room.",
        locale: "jp",
        catReaderType: "blue_cat",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "locale must be one of: ko, en",
    });
  });

  test("validates and sanitizes a dream analysis request body", () => {
    const result = validateDreamAnalyzeRequestBody({
      dreamText: "  I dreamed that a snake appeared in my room.  ",
      dreamDate: "2026-05-29",
      wakeMood: "curious",
      dreamMood: "strange",
      catReaderType: "gray_cat",
      locale: "en",
      userTimeZone: "Asia/Seoul",
      ignored: "this should not reach the backend",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        dreamText: "I dreamed that a snake appeared in my room.",
        dreamDate: "2026-05-29",
        wakeMood: "curious",
        dreamMood: "strange",
        catReaderType: "gray_cat",
        locale: "en",
        userTimeZone: "Asia/Seoul",
      },
    });
  });

  test("accepts and dedupes selected atmosphere and sensation id arrays", () => {
    const result = validateDreamAnalyzeRequestBody({
      dreamText: "A dream.",
      dreamAtmospheres: ["anxious", "anxious", "wistful"],
      dreamSensations: ["falling", "chased"],
    });

    expect(result).toEqual({
      ok: true,
      value: {
        dreamText: "A dream.",
        dreamAtmospheres: ["anxious", "wistful"],
        dreamSensations: ["falling", "chased"],
      },
    });
  });

  test("rejects malformed selected feeling arrays", () => {
    expect(validateDreamAnalyzeRequestBody({ dreamText: "A dream.", dreamAtmospheres: "anxious" }).ok).toBe(false);
    expect(validateDreamAnalyzeRequestBody({ dreamText: "A dream.", dreamSensations: [1, 2] }).ok).toBe(false);
    expect(
      validateDreamAnalyzeRequestBody({ dreamText: "A dream.", dreamAtmospheres: ["a", "b", "c", "d", "e"] }).ok,
    ).toBe(false);
  });

  test("accepts a short free-text sensation and rejects an overlong one", () => {
    const ok = validateDreamAnalyzeRequestBody({ dreamText: "A dream.", dreamSensationOther: "  축축한 느낌  " });
    expect(ok).toEqual({ ok: true, value: { dreamText: "A dream.", dreamSensationOther: "축축한 느낌" } });

    expect(
      validateDreamAnalyzeRequestBody({ dreamText: "A dream.", dreamSensationOther: "가".repeat(31) }).ok,
    ).toBe(false);
  });

  test("accepts sanitized night check-in context", () => {
    const result = validateDreamAnalyzeRequestBody({
      dreamText: "A dream.",
      nightContext: {
        checkInDate: "2026-05-30",
        moodLabel: "  편안함  ",
        conditionLabel: "괜찮음",
        note: "  잠들기 전 마음이 차분했다.  ",
      },
    });

    expect(result).toEqual({
      ok: true,
      value: {
        dreamText: "A dream.",
        nightContext: {
          checkInDate: "2026-05-30",
          moodLabel: "편안함",
          conditionLabel: "괜찮음",
          note: "잠들기 전 마음이 차분했다.",
        },
      },
    });

    expect(
      validateDreamAnalyzeRequestBody({
        dreamText: "A dream.",
        nightContext: {
          checkInDate: "bad-date",
          moodLabel: "편안함",
          conditionLabel: "괜찮음",
        },
      }).ok,
    ).toBe(false);
  });

  test("returns 503 when LLM mode is enabled without a server API key", async () => {
    process.env.MANYANG_ANALYSIS_MODE = "llm";
    delete process.env.OPENAI_API_KEY;

    const response = await handleDreamAnalyzeRequest(
      createJsonRequest({
        dreamText: "I dreamed that a snake appeared in my room.",
        locale: "en",
      }),
      {
        hasCompletedGuestBasicReadingOnDate: async () => false,
        persistGuestBasicReadingUsage: async () => undefined,
      },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      status: "unavailable",
      error: "dream reading is unavailable",
      reason: "provider_missing",
      retryable: false,
    });
  });

  test("returns 503 unavailable when the configured LLM provider request fails", async () => {
    process.env.MANYANG_ANALYSIS_MODE = "llm";
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_BASE_URL = "http://127.0.0.1:9";

    const response = await handleDreamAnalyzeRequest(
      createJsonRequest({
        dreamText: "I dreamed that a snake appeared in my room.",
        locale: "en",
      }),
      {
        hasCompletedGuestBasicReadingOnDate: async () => false,
        persistGuestBasicReadingUsage: async () => undefined,
      },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      status: "unavailable",
      error: "dream reading is unavailable",
      reason: "provider_error",
      retryable: true,
    });
  });

  test("resolves locale-specific RAG vector index paths before the generic fallback", () => {
    expect(
      resolveDreamRagVectorIndexPath("ko", {
        MANYANG_RAG_VECTOR_INDEX_PATH: "../output/rag/generic.json",
        MANYANG_RAG_VECTOR_INDEX_PATH_KO: "../output/rag/dream-rag-ko.json",
        MANYANG_RAG_VECTOR_INDEX_PATH_EN: "../output/rag/dream-rag-en.json",
      }),
    ).toBe("../output/rag/dream-rag-ko.json");

    expect(
      resolveDreamRagVectorIndexPath("en", {
        MANYANG_RAG_VECTOR_INDEX_PATH: "../output/rag/generic.json",
        MANYANG_RAG_VECTOR_INDEX_PATH_KO: "../output/rag/dream-rag-ko.json",
        MANYANG_RAG_VECTOR_INDEX_PATH_EN: "../output/rag/dream-rag-en.json",
      }),
    ).toBe("../output/rag/dream-rag-en.json");

    expect(resolveDreamRagVectorIndexPath(undefined, { MANYANG_RAG_VECTOR_INDEX_PATH: "../output/rag/generic.json" })).toBe(
      "../output/rag/generic.json",
    );
  });

  test("resolves LLM timeout env with safe bounds", () => {
    expect(resolveDreamLlmTimeoutMs({})).toBe(25_000);
    expect(resolveDreamLlmTimeoutMs({ MANYANG_LLM_TIMEOUT_MS: "12000" })).toBe(12_000);
    expect(resolveDreamLlmTimeoutMs({ MANYANG_LLM_TIMEOUT_MS: "50" })).toBe(1_000);
    expect(resolveDreamLlmTimeoutMs({ MANYANG_LLM_TIMEOUT_MS: "120000" })).toBe(60_000);
    expect(resolveDreamLlmTimeoutMs({ MANYANG_LLM_TIMEOUT_MS: "not-a-number" })).toBe(25_000);
  });
});
