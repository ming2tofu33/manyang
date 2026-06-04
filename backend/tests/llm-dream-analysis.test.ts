import { describe, expect, test } from "vitest";

import {
  LlmProviderTimeoutError,
  type DreamReadingLlmProvider,
  type DreamReadingLlmRequest,
} from "../src/services/llm-provider";
import type { DreamEmbeddingProvider } from "../src/services/dream-embedding-provider";
import { buildDreamRagChunks } from "../src/services/dream-rag-chunks";
import { analyzeDreamWithLlm, generateDreamReadingForUser } from "../src/services/llm-dream-analysis";
import { analyzeDream } from "../src/services/mock-analysis";
import { createDreamVectorIndex } from "../src/services/dream-vector-index";

class FakeDreamReadingProvider implements DreamReadingLlmProvider {
  readonly requests: DreamReadingLlmRequest[] = [];

  constructor(private readonly draft: unknown) {}

  async generateJson(request: DreamReadingLlmRequest): Promise<unknown> {
    this.requests.push(request);
    return this.draft;
  }
}

class ThrowingDreamReadingProvider implements DreamReadingLlmProvider {
  async generateJson(): Promise<unknown> {
    throw new Error("provider unavailable");
  }
}

class NeverResolvingDreamReadingProvider implements DreamReadingLlmProvider {
  readonly requests: DreamReadingLlmRequest[] = [];

  async generateJson(request: DreamReadingLlmRequest): Promise<unknown> {
    this.requests.push(request);
    return new Promise(() => undefined);
  }
}

class FakeEmbeddingProvider implements DreamEmbeddingProvider {
  readonly model = "fake-embedding";

  async embedTexts(texts: string[]): Promise<number[][]> {
    return texts.map(() => [1, 0]);
  }
}

describe("analyzeDreamWithLlm", () => {
  test("grounds the prompt in retrieved symbol evidence and merges a valid LLM draft", async () => {
    const provider = new FakeDreamReadingProvider({
      summary: "A grounded dream about a snake and a private room.",
      interpretation: "The reading stays with the retrieved snake and room evidence without making a fixed prediction.",
      symbolReadings: [
        {
          symbol: "Snake",
          reading: "The snake can point to alert life energy and boundary sensitivity.",
        },
      ],
      smallPrescription: "Name one boundary that needs attention today.",
      card: {
        name: "Moon of the Quiet Snake",
        type: "soft_moon",
        keywords: ["boundary", "energy", "room"],
        summary: "The dream gathers alert energy inside a private space.",
        message: "Stay curious without turning the dream into a prediction.",
        theme: "boundary",
      },
    });

    const result = await analyzeDreamWithLlm(
      {
        dreamText: "I dreamed that a snake appeared in my room.",
        locale: "en",
        wakeMood: "curious",
      },
      { provider, model: "test-model" },
    );

    expect(provider.requests).toHaveLength(1);
    expect(provider.requests[0]).toMatchObject({
      model: "test-model",
      schemaName: "dream_reading_draft",
    });
    expect(provider.requests[0]?.instructions).toContain("Use only the provided retrieved symbol evidence");
    expect(provider.requests[0]?.input).toContain("snake");
    expect(provider.requests[0]?.input).toContain("avoidExpressions");

    expect(result.summary).toBe("A grounded dream about a snake and a private room.");
    expect(result.interpretation).toContain("retrieved snake and room evidence");
    expect(result.symbolReadings[0]).toEqual({
      symbol: "Snake",
      reading: "The snake can point to alert life energy and boundary sensitivity.",
    });
    expect(result.smallPrescription).toBe("Name one boundary that needs attention today.");
    expect(result.card.name).toBe("Moon of the Quiet Snake");
    expect(result.readingBasis.usedSymbols).toContain("Snake");
  });

  test("falls back to the deterministic analyzer when the provider fails", async () => {
    const request = {
      dreamText: "I dreamed that a snake appeared in my room.",
      locale: "en" as const,
    };

    const baseline = analyzeDream(request);
    const result = await analyzeDreamWithLlm(request, {
      provider: new ThrowingDreamReadingProvider(),
      model: "test-model",
    });

    expect(result.summary).toBe(baseline.summary);
    expect(result.interpretation).toBe(baseline.interpretation);
    expect(result.symbols).toEqual(baseline.symbols);
  });

  test("falls back to the deterministic analyzer when the provider exceeds the timeout", async () => {
    const request = {
      dreamText: "I dreamed that a snake appeared in my room.",
      locale: "en" as const,
    };
    const provider = new NeverResolvingDreamReadingProvider();
    const providerErrors: unknown[] = [];
    const baseline = analyzeDream(request);

    const result = await analyzeDreamWithLlm(request, {
      provider,
      model: "test-model",
      providerTimeoutMs: 5,
      onProviderError: (error) => providerErrors.push(error),
    });

    expect(result.summary).toBe(baseline.summary);
    expect(result.interpretation).toBe(baseline.interpretation);
    expect(result.symbols).toEqual(baseline.symbols);
    expect(provider.requests[0]?.timeoutMs).toBe(5);
    expect(providerErrors[0]).toBeInstanceOf(LlmProviderTimeoutError);
    expect((providerErrors[0] as Error).message).toContain("timed out after 5ms");
  });

  test("keeps safety notice after merging an LLM draft", async () => {
    const provider = new FakeDreamReadingProvider({
      summary: "A hospital dream asks for care without becoming a diagnosis.",
      interpretation: "The reading stays symbolic and does not diagnose illness.",
      symbolReadings: [
        {
          symbol: "Hospital",
          reading: "The hospital can point to a wish for care and support.",
        },
      ],
      smallPrescription: "Write down one practical health concern to discuss with a professional if it continues.",
      card: {
        name: "Lamp in the Quiet Ward",
        type: "soft_moon",
        keywords: ["care", "support", "body"],
        summary: "The dream highlights a need for care.",
        message: "Let care be concrete, not catastrophic.",
        theme: "care",
      },
    });

    const result = await analyzeDreamWithLlm(
      {
        dreamText: "I dreamed I was bleeding in a hospital. Does this mean I have cancer?",
        locale: "en",
        wakeMood: "anxious",
      },
      { provider, model: "test-model" },
    );

    expect(result.summary).toBe("A hospital dream asks for care without becoming a diagnosis.");
    expect(result.safetyNotice).toContain("not a medical diagnosis");
  });

  test("removes LLM symbol readings for scene-only unverified elements", async () => {
    const provider = new FakeDreamReadingProvider({
      summary: "A hospital dream asks for care without turning every detail into a symbol.",
      interpretation: "The hospital is the grounded symbol; bleeding is only a scene detail here.",
      symbolReadings: [
        {
          symbol: "Hospital",
          reading: "The hospital can point to care, vulnerability, and a need for support.",
        },
        {
          symbol: "Blood",
          reading: "Blood means emotional energy is leaking away.",
        },
        {
          symbol: "Cancer",
          reading: "Cancer means a hidden illness is trying to reveal itself.",
        },
      ],
      smallPrescription: "Ask what kind of care would feel concrete today.",
      card: {
        name: "Lamp in the Quiet Ward",
        type: "soft_moon",
        keywords: ["care", "support", "body"],
        summary: "The dream highlights care without diagnosis.",
        message: "Stay with the verified symbol.",
        theme: "care",
      },
    });

    const result = await analyzeDreamWithLlm(
      {
        dreamText: "I dreamed I was bleeding in a hospital. Does this mean I have cancer?",
        locale: "en",
        wakeMood: "anxious",
      },
      { provider, model: "test-model" },
    );

    expect(result.symbolReadings).toEqual([
      {
        symbol: "Hospital",
        reading: "The hospital can point to care, vulnerability, and a need for support.",
      },
      {
        symbol: "Blood",
        reading: "Blood means emotional energy is leaking away.",
      },
    ]);
  });

  test("removes only unsafe scene-only sentences instead of replacing the whole interpretation", async () => {
    const provider = new FakeDreamReadingProvider({
      summary: "An elevator and teeth dream holds two feelings at once.",
      interpretation:
        "The elevator and teeth make this feel specific: control loosens in a small enclosed space while your confidence feels exposed. Hair reveals a hidden loss and predicts a change. The sadness and calm sit together like the elevator stopping between floors.",
      symbolReadings: [
        {
          symbol: "Teeth",
          reading: "Teeth matter here because they connect the falling-out image to confidence, expression, and exposed control.",
        },
        {
          symbol: "Elevator",
          reading: "The elevator matters here because the scene puts change inside a small space the dreamer cannot fully control.",
        },
      ],
      smallPrescription: "Write one line about where control felt exposed today.",
      card: {
        name: "Between Floors",
        type: "half_moon",
        keywords: ["teeth", "elevator", "control"],
        summary: "The dream holds exposure inside a stalled transition.",
        message: "Stay with the image without forcing a prediction.",
        theme: "control",
      },
    });

    const result = await analyzeDreamWithLlm(
      {
        dreamText: "I dreamed my teeth fell out in an elevator, then I was falling, but I woke up sad and calm.",
        locale: "en",
        catReaderType: "gray_cat",
        wakeMood: "mixed",
      },
      { provider, model: "test-model" },
    );

    expect(result.interpretation).toContain("The elevator and teeth make this feel specific");
    expect(result.interpretation).toContain("The sadness and calm sit together");
    expect(result.interpretation).not.toContain("Hair reveals a hidden loss");
    expect(result.interpretation).not.toContain("The safest symbolic reading stays with");
    expect(result.symbolReadings.map((reading) => reading.symbol)).toEqual(["Teeth", "Elevator"]);
  });

  test("replaces interpretation when the LLM assigns meaning to scene-only elements", async () => {
    const provider = new FakeDreamReadingProvider({
      summary: "병원 장면이 불안하게 남은 꿈입니다.",
      interpretation: "피는 몸과 마음의 에너지가 빠져나가는 소진을 보여주고, 암은 큰 두려움을 예지합니다.",
      symbolReadings: [
        {
          symbol: "병원",
          reading: "병원은 돌봄이 필요하다는 인정과 취약함의 노출을 가리킬 수 있습니다.",
        },
      ],
      smallPrescription: "오늘 떠오른 불안을 한 문장으로 적어 보세요.",
      card: {
        name: "조용한 병동의 등불",
        type: "soft_moon",
        keywords: ["돌봄", "불안", "점검"],
        summary: "돌봄이 필요한 마음을 비춥니다.",
        message: "단정 대신 차분한 점검으로 돌아옵니다.",
        theme: "care",
      },
    });

    const result = await analyzeDreamWithLlm(
      {
        dreamText: "꿈에서 병원에 있었고 몸에서 피가 나는 것 같았어. 혹시 큰 병이나 암을 예지하는 꿈일까?",
        locale: "ko",
        catReaderType: "gray_cat",
        wakeMood: "anxious",
      },
      { provider, model: "test-model" },
    );

    expect(result.interpretation).toContain("병원");
    expect(result.interpretation).toContain("그대로의 장면");
    expect(result.interpretation).not.toContain("에너지가 빠져나가는");
    expect(result.interpretation).not.toContain("암은 큰 두려움을 예지");
  });

  test("keeps scene-only details visible as literal details when replacing unsafe interpretation", async () => {
    const provider = new FakeDreamReadingProvider({
      summary: "병원 장면이 불안하게 남은 꿈입니다.",
      interpretation: "피는 몸과 마음의 에너지가 빠져나가는 소진을 보여주고, 암은 큰 두려움을 예지합니다.",
      symbolReadings: [
        {
          symbol: "병원",
          reading: "병원은 돌봄이 필요하다는 인정과 취약함의 노출을 가리킬 수 있습니다.",
        },
      ],
      smallPrescription: "오늘 떠오른 불안을 한 문장으로 적어 보세요.",
      card: {
        name: "조용한 병동의 등불",
        type: "soft_moon",
        keywords: ["돌봄", "불안", "회복"],
        summary: "돌봄이 필요한 마음을 비춥니다.",
        message: "꿈을 진단으로 바꾸지 않고 장면으로만 봅니다.",
        theme: "care",
      },
    });

    const result = await analyzeDreamWithLlm(
      {
        dreamText: "꿈에서 병원에 있었고 몸에서 피가 나는 것 같았어. 혹시 큰 병이나 암을 예지하는 꿈일까?",
        locale: "ko",
        catReaderType: "gray_cat",
        wakeMood: "anxious",
      },
      { provider, model: "test-model" },
    );

    expect(result.interpretation).toContain("병원");
    expect(result.interpretation).toContain("암");
    expect(result.interpretation).toContain("그대로의 장면");
    expect(result.interpretation).not.toContain("에너지가 빠져나가는");
    expect(result.interpretation).not.toContain("암은 큰 두려움을 예지");
  });

  test("passes semantic-only RAG chunk retrieval as candidate evidence without accepting it as final symbol", async () => {
    const provider = new FakeDreamReadingProvider({
      summary: "돌봄과 취약함이 남은 꿈입니다.",
      interpretation: "병원 이미지는 돌봄과 회복을 필요로 하는 마음의 흐름으로 읽을 수 있습니다.",
      symbolReadings: [
        {
          symbol: "병원",
          reading: "병원은 돌봄과 회복, 취약함을 살피려는 마음과 연결될 수 있습니다.",
        },
      ],
      smallPrescription: "오늘 나에게 필요한 돌봄이 무엇인지 한 문장으로 적어보세요.",
      card: {
        name: "진료실의 달",
        type: "soft_moon",
        keywords: ["돌봄", "회복", "취약함"],
        summary: "돌봄이 필요한 마음을 비춥니다.",
        message: "몸과 마음을 무리하게 밀어붙이지 않습니다.",
        theme: "돌봄",
      },
    });

    const result = await analyzeDreamWithLlm(
      {
        dreamText: "돌봄과 취약함이 크게 느껴졌고 확인을 기다리는 장소에 있는 느낌이었어.",
        locale: "ko",
        wakeMood: "anxious",
      },
      { provider, model: "test-model" },
    );
    const promptPayload = JSON.parse(provider.requests[0]?.input ?? "{}") as {
      retrievedSymbolEvidence?: Array<{ id: string; label: string }>;
      candidateSymbolEvidence?: Array<{ id: string; label: string; evidenceStatus: string }>;
    };

    expect(promptPayload.retrievedSymbolEvidence).toEqual([]);
    expect(promptPayload.candidateSymbolEvidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "hospital",
          label: "병원",
          evidenceStatus: "candidate",
        }),
      ]),
    );
    expect(result.symbolReadings).not.toContainEqual(
      expect.objectContaining({
        symbol: "병원",
      }),
    );
    expect(result.symbols).not.toEqual(["병원"]);
    expect(result.readingBasis.usedSymbols).not.toEqual(["병원"]);
  });

  test("allows a low-signal LLM draft to return no symbolic readings", async () => {
    const provider = new FakeDreamReadingProvider({
      summary: "A faint mood remains from the dream.",
      interpretation:
        "The dream does not give one clear object to treat as a symbol. What remains is the hazy feeling itself, so the reading stays with that soft atmosphere instead of forcing an invented image into the receipt.",
      symbolReadings: [],
      smallPrescription: "Keep only the one feeling that stayed with you when you woke.",
      card: {
        name: "Faint Trace",
        type: "soft_moon",
        keywords: ["trace"],
        summary: "A faint mood remains.",
        message: "Hold the dream lightly instead of forcing a symbol.",
        theme: "trace",
      },
    });

    const result = await analyzeDreamWithLlm(
      {
        dreamText: "I barely remember the dream. Only a strange mood stayed with me.",
        locale: "en",
      },
      { provider, model: "test-model" },
    );

    expect(result.symbols).toEqual([]);
    expect(result.symbolReadings).toEqual([]);
    expect(result.readingBasis.usedSymbols).toEqual([]);
  });

  test("passes vector-only retrieval as candidate evidence without confirming it", async () => {
    const provider = new FakeDreamReadingProvider({
      summary: "벡터 검색으로 병원 근거를 찾은 꿈입니다.",
      interpretation: "병원 이미지는 돌봄과 회복을 살피는 방향으로 읽을 수 있습니다.",
      symbolReadings: [
        {
          symbol: "병원",
          reading: "병원은 돌봄과 회복, 취약함을 살피려는 마음과 연결될 수 있습니다.",
        },
      ],
      smallPrescription: "오늘 나에게 필요한 돌봄을 한 문장으로 적어보세요.",
      card: {
        name: "진료실의 달",
        type: "soft_moon",
        keywords: ["돌봄", "회복", "취약함"],
        summary: "돌봄이 필요한 마음을 비춥니다.",
        message: "무리한 해석보다 근거 있는 장면을 봅니다.",
        theme: "돌봄",
      },
    });
    const chunks = buildDreamRagChunks("ko").filter((chunk) =>
      ["hospital:ko:searchText", "snake:ko:searchText"].includes(chunk.chunkId),
    );
    const vectorIndex = createDreamVectorIndex({
      locale: "ko",
      embeddingModel: "fake-embedding",
      items: [
        { chunk: chunks.find((chunk) => chunk.symbolId === "hospital")!, embedding: [1, 0] },
        { chunk: chunks.find((chunk) => chunk.symbolId === "snake")!, embedding: [0, 1] },
      ],
    });

    await analyzeDreamWithLlm(
      {
        dreamText: "말로 설명하기 어려운 장면만 남았어.",
        locale: "ko",
      },
      {
        provider,
        model: "test-model",
        vectorIndex,
        embeddingProvider: new FakeEmbeddingProvider(),
      },
    );
    const promptPayload = JSON.parse(provider.requests[0]?.input ?? "{}") as {
      retrievedSymbolEvidence?: Array<{ id: string; label: string }>;
      candidateSymbolEvidence?: Array<{ id: string; label: string; evidenceStatus: string }>;
    };

    expect(promptPayload.retrievedSymbolEvidence).toEqual([]);
    expect(promptPayload.candidateSymbolEvidence?.[0]).toMatchObject({
      id: "hospital",
      label: "병원",
      evidenceStatus: "candidate",
    });
  });
});

describe("generateDreamReadingForUser", () => {
  test("returns unavailable instead of a baseline reading when the provider fails", async () => {
    const result = await generateDreamReadingForUser(
      {
        dreamText: "I dreamed that a snake appeared in my room.",
        locale: "en",
      },
      {
        provider: new ThrowingDreamReadingProvider(),
        model: "test-model",
      },
    );

    expect(result).toEqual({
      status: "unavailable",
      reason: "provider_error",
      retryable: true,
    });
  });

  test("returns timeout unavailable when the provider exceeds the timeout", async () => {
    const result = await generateDreamReadingForUser(
      {
        dreamText: "I dreamed that a snake appeared in my room.",
        locale: "en",
      },
      {
        provider: new NeverResolvingDreamReadingProvider(),
        model: "test-model",
        providerTimeoutMs: 5,
      },
    );

    expect(result).toEqual({
      status: "unavailable",
      reason: "timeout",
      retryable: true,
    });
  });

  test("returns invalid_response unavailable when the provider output cannot be parsed", async () => {
    const result = await generateDreamReadingForUser(
      {
        dreamText: "I dreamed that a snake appeared in my room.",
        locale: "en",
      },
      {
        provider: new FakeDreamReadingProvider({ summary: "missing required fields" }),
        model: "test-model",
      },
    );

    expect(result).toEqual({
      status: "unavailable",
      reason: "invalid_response",
      retryable: true,
    });
  });

  test("keeps safety notice when user-facing generation is unavailable", async () => {
    const result = await generateDreamReadingForUser(
      {
        dreamText: "I dreamed I was bleeding in a hospital. Does this mean I have cancer?",
        locale: "en",
      },
      {
        provider: new ThrowingDreamReadingProvider(),
        model: "test-model",
      },
    );

    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") {
      expect(result.safetyNotice).toContain("not a medical diagnosis");
    }
  });
});
