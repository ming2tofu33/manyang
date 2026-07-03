import { afterEach, describe, expect, test, vi } from "vitest";

import { getTarotMajorCardById } from "@/lib/tarot-major-cards";
import { getTarotCardById } from "@/lib/tarot-cards";
import type { DailyTarotReading } from "@/lib/daily-tarot";

import { handleTarotReadingRequest, resolveTarotLlmTimeoutMs } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
});

function createJsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/tarot/readings", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function createOneCardBody(overrides: Record<string, unknown> = {}) {
  return {
    appDate: "2026-05-31",
    spread: "daily_one_card",
    selectedAt: "2026-05-31T10:00:00.000Z",
    selections: [{ cardId: 0, orientation: "upright", position: "today" }],
    ...overrides,
  };
}

function createThreeCardBody(overrides: Record<string, unknown> = {}) {
  return {
    appDate: "2026-05-31",
    spread: "daily_three_card",
    selectedAt: "2026-05-31T10:00:00.000Z",
    selections: [
      { cardId: 0, orientation: "upright", position: "situation" },
      { cardId: 1, orientation: "reversed", position: "flow" },
      { cardId: 2, orientation: "upright", position: "advice" },
    ],
    ...overrides,
  };
}

const generatedOneCard = {
  title: "오늘은 첫 장면을 여는 날",
  overview:
    "바보 카드의 정방향은 아직 모든 조건이 정리되지 않았어도 새 장면 앞에 선 마음을 비춥니다. 절벽 끝의 여행자는 확신보다 열린 감각을 먼저 들고 있고, 작은 보따리는 지금 손에 있는 경험만으로도 하루를 시작할 수 있음을 보여줍니다.",
  keywords: ["start", "possibility", "attention"],
  cardReadings: [],
  advice: "이 provider advice는 결과에 포함되지 않아야 합니다.",
};

const generatedThreeCard = {
  title: "세 장이 관계를 좁히는 날",
  overview:
    "세 장은 지금 손에 든 조건을 먼저 확인하고, 이어지는 국면에서 직감과 사실이 섞이기 쉬운 지점을 지나, 마지막에는 무엇을 기준으로 판단할지 보여줍니다.",
  keywords: ["situation", "flow", "advice"],
  cardReadings: [
    {
      position: "situation" as const,
      heading: "현재 조건",
      reading: "바보는 현재 상황이 아직 닫힌 결론보다 열린 가능성에 가깝다는 점을 보여줍니다.",
    },
    {
      position: "flow" as const,
      heading: "이어지는 국면",
      reading: "역방향 마법사는 말과 아이디어가 실제 실행으로 이어지는지 확인해야 하는 장면을 말합니다.",
    },
    {
      position: "advice" as const,
      heading: "판단 기준",
      reading: "여사제는 바로 답을 내기보다 반복되는 신호와 실제 근거를 함께 보라고 말합니다.",
    },
  ],
  advice: "이 provider advice는 결과에 포함되지 않아야 합니다.",
};

describe("POST /api/tarot/readings", () => {
  test("resolves tarot LLM timeout env with safe bounds", () => {
    expect(resolveTarotLlmTimeoutMs({})).toBe(25_000);
    expect(resolveTarotLlmTimeoutMs({ MANYANG_LLM_TIMEOUT_MS: "45000" })).toBe(45_000);
    expect(resolveTarotLlmTimeoutMs({ MANYANG_LLM_TIMEOUT_MS: "50" })).toBe(1_000);
    expect(resolveTarotLlmTimeoutMs({ MANYANG_LLM_TIMEOUT_MS: "120000" })).toBe(60_000);
    expect(resolveTarotLlmTimeoutMs({ MANYANG_LLM_TIMEOUT_MS: "not-a-number" })).toBe(25_000);
  });

  test("rejects invalid tarot reading requests before LLM work starts", async () => {
    const generateTarotReadingForUser = vi.fn();
    const response = await handleTarotReadingRequest(
      createJsonRequest(
        createThreeCardBody({
          appDate: "bad-date",
          selections: [
            { cardId: 0, orientation: "upright", position: "situation" },
            { cardId: 0, orientation: "reversed", position: "flow" },
            { cardId: 2, orientation: "upright", position: "advice" },
          ],
        }),
      ),
      {
        generateTarotReadingForUser,
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "appDate must use YYYY-MM-DD",
    });
    expect(generateTarotReadingForUser).not.toHaveBeenCalled();
  });

  test("allows three-card tarot readings for free users during the event", async () => {
    const generateTarotReadingForUser = vi.fn(async () => ({
      status: "ok" as const,
      reading: generatedThreeCard,
    }));
    const response = await handleTarotReadingRequest(createJsonRequest(createThreeCardBody()), {
      getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
      getAccessPlanForUser: async () => "free_account",
      findCompletedTarotReadingForUser: async () => null,
      createProvider: () => ({ generateJson: async () => generatedThreeCard }),
      generateTarotReadingForUser,
      persistCompletedTarotReading: async () => undefined,
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      source: "llm",
      spread: "daily_three_card",
      generated: {
        cardReadings: [
          { position: "situation" },
          { position: "flow" },
          { position: "advice" },
        ],
      },
    });
    expect(generateTarotReadingForUser).toHaveBeenCalled();
  });

  test("returns unavailable and does not persist when the provider is missing", async () => {
    const persistCompletedTarotReading = vi.fn();
    const response = await handleTarotReadingRequest(createJsonRequest(createOneCardBody()), {
      getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
      getAccessPlanForUser: async () => "free_account",
      findCompletedTarotReadingForUser: async () => null,
      createProvider: () => undefined,
      persistCompletedTarotReading,
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      status: "unavailable",
      error: "tarot reading is unavailable",
      reason: "provider_missing",
      retryable: false,
    });
    expect(persistCompletedTarotReading).not.toHaveBeenCalled();
  });

  test("returns and persists a generated one-card tarot reading for authenticated users", async () => {
    vi.stubEnv("MANYANG_LLM_TIMEOUT_MS", "45000");

    const persistCompletedTarotReading = vi.fn();
    const generateTarotReadingForUser = vi.fn(async () => ({
      status: "ok" as const,
      reading: generatedOneCard,
    }));

    const response = await handleTarotReadingRequest(createJsonRequest(createOneCardBody()), {
      getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
      getAccessPlanForUser: async () => "free_account",
      findCompletedTarotReadingForUser: async () => null,
      createProvider: () => ({ generateJson: async () => generatedOneCard }),
      generateTarotReadingForUser,
      persistCompletedTarotReading,
    });

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body).toMatchObject({
      source: "llm",
      spread: "daily_one_card",
      appDate: "2026-05-31",
      keywords: generatedOneCard.keywords,
      advice: getTarotMajorCardById(0)?.upright.cardMessage,
      generated: {
        ...generatedOneCard,
        advice: getTarotMajorCardById(0)?.upright.cardMessage,
      },
      card: {
        id: 0,
      },
      cards: [
        {
          position: "today",
          orientation: "upright",
          card: {
            id: 0,
          },
        },
      ],
    });
    expect(body.advice).not.toBe(generatedOneCard.advice);
    expect(generateTarotReadingForUser).toHaveBeenCalledWith(
      expect.objectContaining({
        spread: "daily_one_card",
        cards: [
          expect.objectContaining({
            position: "today",
            orientation: "upright",
          }),
        ],
      }),
      expect.objectContaining({ provider: expect.any(Object), providerTimeoutMs: 45_000 }),
    );
    expect(persistCompletedTarotReading).toHaveBeenCalledWith({
      userId: "00000000-0000-4000-8000-000000000001",
      reading: body,
    });
  });

  test("accepts a minor arcana card for one-card readings", async () => {
    const minorCard = getTarotCardById(75);
    const generateTarotReadingForUser = vi.fn(async () => ({
      status: "ok" as const,
      reading: generatedOneCard,
    }));

    expect(minorCard).toMatchObject({ nameKo: "펜타클 기사", arcana: "minor" });

    const response = await handleTarotReadingRequest(
      createJsonRequest(
        createOneCardBody({
          selections: [{ cardId: 75, orientation: "upright", position: "today" }],
        }),
      ),
      {
        getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
        getAccessPlanForUser: async () => "free_account",
        findCompletedTarotReadingForUser: async () => null,
        createProvider: () => ({ generateJson: async () => generatedOneCard }),
        generateTarotReadingForUser,
        persistCompletedTarotReading: async () => undefined,
      },
    );

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body).toMatchObject({
      source: "llm",
      spread: "daily_one_card",
      card: { id: 75, nameKo: "펜타클 기사", arcana: "minor" },
      cards: [{ position: "today", card: { id: 75, arcana: "minor" } }],
      advice: minorCard?.upright.cardMessage,
      generated: {
        advice: minorCard?.upright.cardMessage,
      },
    });
    expect(generateTarotReadingForUser).toHaveBeenCalledWith(
      expect.objectContaining({
        cards: [
          expect.objectContaining({
            card: expect.objectContaining({ id: 75, nameKo: "펜타클 기사", arcana: "minor" }),
          }),
        ],
      }),
      expect.any(Object),
    );
  });

  test("returns the existing reading without calling the LLM for returning users", async () => {
    const existingReading = {
      id: "daily-tarot-daily_one_card-2026-05-31",
      spread: "daily_one_card",
      source: "llm",
      appDate: "2026-05-31",
      selectedAt: "2026-05-31T09:00:00.000Z",
      card: { id: 0 },
      orientation: "upright",
      position: "today",
      cards: [{ position: "today", orientation: "upright", card: { id: 0 } }],
      keywords: ["start"],
      title: "stored title",
      message: "stored overview",
      advice: "stored advice",
      generated: generatedOneCard,
    } as unknown as DailyTarotReading;
    const generateTarotReadingForUser = vi.fn();
    const findCompletedTarotReadingForUser = vi.fn(async () => existingReading);
    const persistCompletedTarotReading = vi.fn();

    const response = await handleTarotReadingRequest(createJsonRequest(createOneCardBody()), {
      getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
      getAccessPlanForUser: async () => "free_account",
      isAdminUser: async () => false,
      findCompletedTarotReadingForUser,
      createProvider: () => ({ generateJson: async () => generatedOneCard }),
      generateTarotReadingForUser,
      persistCompletedTarotReading,
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ id: existingReading.id, source: "llm" });
    expect(findCompletedTarotReadingForUser).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
      "2026-05-31",
      "daily_one_card",
    );
    expect(generateTarotReadingForUser).not.toHaveBeenCalled();
    expect(persistCompletedTarotReading).not.toHaveBeenCalled();
  });

  test("regenerates for admins so they can retest", async () => {
    const findCompletedTarotReadingForUser = vi.fn(
      async () => ({ id: "stale" }) as unknown as DailyTarotReading,
    );
    const generateTarotReadingForUser = vi.fn(async () => ({
      status: "ok" as const,
      reading: generatedOneCard,
    }));

    const response = await handleTarotReadingRequest(createJsonRequest(createOneCardBody()), {
      getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
      getAccessPlanForUser: async () => "free_account",
      isAdminUser: async () => true,
      findCompletedTarotReadingForUser,
      createProvider: () => ({ generateJson: async () => generatedOneCard }),
      generateTarotReadingForUser,
      persistCompletedTarotReading: async () => undefined,
    });

    expect(response.status).toBe(200);
    expect(findCompletedTarotReadingForUser).not.toHaveBeenCalled();
    expect(generateTarotReadingForUser).toHaveBeenCalled();
  });

  test("returns a generated three-card tarot reading for Moon Pass users", async () => {
    const generateTarotReadingForUser = vi.fn(async () => ({
      status: "ok" as const,
      reading: generatedThreeCard,
    }));

    const response = await handleTarotReadingRequest(createJsonRequest(createThreeCardBody()), {
      getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
      getAccessPlanForUser: async () => "moon_pass",
      findCompletedTarotReadingForUser: async () => null,
      createProvider: () => ({ generateJson: async () => generatedThreeCard }),
      generateTarotReadingForUser,
      persistCompletedTarotReading: async () => undefined,
    });

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body).toMatchObject({
      source: "llm",
      spread: "daily_three_card",
      advice: getTarotMajorCardById(2)?.upright.cardMessage,
      generated: {
        advice: getTarotMajorCardById(2)?.upright.cardMessage,
        cardReadings: [
          { position: "situation" },
          { position: "flow" },
          { position: "advice" },
        ],
      },
      cards: [
        { position: "situation", card: { id: 0 } },
        { position: "flow", card: { id: 1 } },
        { position: "advice", card: { id: 2 } },
      ],
    });
    expect(body.advice).not.toBe(generatedThreeCard.advice);
  });

  test("logs an observability event when the reading is unavailable", async () => {
    const logTarotEvent = vi.fn();
    const generateTarotReadingForUser = vi.fn(async (_input, options) => {
      options?.onProviderError?.(new Error("boom"));
      return { status: "unavailable" as const, reason: "timeout" as const, retryable: true };
    });

    const response = await handleTarotReadingRequest(createJsonRequest(createOneCardBody()), {
      getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
      getAccessPlanForUser: async () => "free_account",
      isAdminUser: async () => false,
      findCompletedTarotReadingForUser: async () => null,
      createProvider: () => ({ generateJson: async () => ({}) }),
      generateTarotReadingForUser,
      persistCompletedTarotReading: async () => undefined,
      logTarotEvent,
    });

    expect(response.status).toBe(503);
    expect(logTarotEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "provider_error", spread: "daily_one_card" }),
    );
    expect(logTarotEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "unavailable", reason: "timeout", spread: "daily_one_card" }),
    );
  });

  test("rate-limits a guest who already used today's one-card reading", async () => {
    const generateTarotReadingForUser = vi.fn();
    const response = await handleTarotReadingRequest(createJsonRequest(createOneCardBody()), {
      getAuthenticatedUserId: async () => null,
      getAccessPlanForUser: async () => "guest",
      hasReadingUsageForGuestOnDate: async () => true,
      createGuestId: () => "00000000-0000-4000-8000-000000000abc",
      createProvider: () => ({ generateJson: async () => generatedOneCard }),
      generateTarotReadingForUser,
    });

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({ reason: "tarot_rate_limited" });
    expect(generateTarotReadingForUser).not.toHaveBeenCalled();
  });

  test("allows and records a guest's first one-card reading of the day", async () => {
    const incrementReadingUsageForGuest = vi.fn(async () => undefined);
    const generateTarotReadingForUser = vi.fn(async () => ({
      status: "ok" as const,
      reading: generatedOneCard,
    }));

    const response = await handleTarotReadingRequest(
      new Request("http://localhost/api/tarot/readings", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: "manyang_guest_id=00000000-0000-4000-8000-000000000abc",
        },
        body: JSON.stringify(createOneCardBody()),
      }),
      {
        getAuthenticatedUserId: async () => null,
        getAccessPlanForUser: async () => "guest",
        hasReadingUsageForGuestOnDate: async () => false,
        incrementReadingUsageForGuest,
        createProvider: () => ({ generateJson: async () => generatedOneCard }),
        generateTarotReadingForUser,
        persistCompletedTarotReading: async () => undefined,
      },
    );

    expect(response.status).toBe(200);
    expect(incrementReadingUsageForGuest).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000abc",
      "2026-05-31",
      "tarot_one_card",
    );
  });

  test("logs an observability event when the provider is missing", async () => {
    const logTarotEvent = vi.fn();
    const response = await handleTarotReadingRequest(createJsonRequest(createOneCardBody()), {
      getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
      getAccessPlanForUser: async () => "free_account",
      isAdminUser: async () => false,
      findCompletedTarotReadingForUser: async () => null,
      createProvider: () => undefined,
      logTarotEvent,
    });

    expect(response.status).toBe(503);
    expect(logTarotEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "unavailable", reason: "provider_missing" }),
    );
  });

  test("rate-limits a guest's three-card reading with the three-card feature key", async () => {
    const hasReadingUsageForGuestOnDate = vi.fn(async () => true);
    const generateTarotReadingForUser = vi.fn();
    const response = await handleTarotReadingRequest(createJsonRequest(createThreeCardBody()), {
      getAuthenticatedUserId: async () => null,
      getAccessPlanForUser: async () => "guest",
      hasReadingUsageForGuestOnDate,
      createGuestId: () => "00000000-0000-4000-8000-000000000abc",
      createProvider: () => ({ generateJson: async () => generatedThreeCard }),
      generateTarotReadingForUser,
    });

    expect(response.status).toBe(429);
    expect(hasReadingUsageForGuestOnDate).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000abc",
      "2026-05-31",
      "tarot_three_card",
    );
    expect(generateTarotReadingForUser).not.toHaveBeenCalled();
  });

  test("sets a guest cookie on the rate-limited response so new guests get a stable id", async () => {
    const response = await handleTarotReadingRequest(createJsonRequest(createOneCardBody()), {
      getAuthenticatedUserId: async () => null,
      getAccessPlanForUser: async () => "guest",
      hasReadingUsageForGuestOnDate: async () => true,
      createGuestId: () => "00000000-0000-4000-8000-000000000abc",
      createProvider: () => ({ generateJson: async () => generatedOneCard }),
      generateTarotReadingForUser: vi.fn(),
    });

    expect(response.status).toBe(429);
    expect(response.headers.get("set-cookie")).toContain("manyang_guest_id=00000000-0000-4000-8000-000000000abc");
  });

  test("does not record guest usage when the reading is unavailable", async () => {
    const incrementReadingUsageForGuest = vi.fn(async () => undefined);
    const response = await handleTarotReadingRequest(createJsonRequest(createOneCardBody()), {
      getAuthenticatedUserId: async () => null,
      getAccessPlanForUser: async () => "guest",
      hasReadingUsageForGuestOnDate: async () => false,
      incrementReadingUsageForGuest,
      createGuestId: () => "00000000-0000-4000-8000-000000000abc",
      createProvider: () => ({ generateJson: async () => generatedOneCard }),
      generateTarotReadingForUser: async () => ({
        status: "unavailable" as const,
        reason: "timeout" as const,
        retryable: true,
      }),
    });

    expect(response.status).toBe(503);
    expect(incrementReadingUsageForGuest).not.toHaveBeenCalled();
  });
});
