import { afterEach, describe, expect, test } from "vitest";

import {
  DREAM_ANALYZE_MAX_DREAM_TEXT_LENGTH,
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

  afterEach(() => {
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
  });

  test("returns a mock dream analysis response", async () => {
    const response = await POST(
      createJsonRequest({
        dreamText: "학교 복도에서 교실을 찾는데 문이 계속 바뀌었어요.",
        dreamDate: "2026-05-24",
        wakeMood: "anxious",
        catReaderType: "white_cat",
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.reader).toMatchObject({
      id: "white_cat",
      name: "하얀냥",
      access: "free",
    });
    expect(body.readerNote).toContain("하얀냥");
    expect(body.symbols).toEqual(expect.arrayContaining(["학교", "복도", "문", "찾기"]));
    expect(body.readingBasis.usedSymbols).toEqual(expect.arrayContaining(["학교", "복도", "문", "찾기"]));
    expect(body.summary).toContain("꿈");
    expect(body.card.name).toContain("밤");
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

  test("returns 503 when LLM mode is enabled without a server API key", async () => {
    process.env.MANYANG_ANALYSIS_MODE = "llm";
    delete process.env.OPENAI_API_KEY;

    const response = await POST(
      createJsonRequest({
        dreamText: "I dreamed that a snake appeared in my room.",
        locale: "en",
      }),
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

    const response = await POST(
      createJsonRequest({
        dreamText: "I dreamed that a snake appeared in my room.",
        locale: "en",
      }),
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
