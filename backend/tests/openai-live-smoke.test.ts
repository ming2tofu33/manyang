import { describe, expect, test } from "vitest";

import type { DreamReadingLlmProvider, DreamReadingLlmRequest } from "../src/services/llm-provider";
import { analyzeDreamWithLlm } from "../src/services/llm-dream-analysis";
import { analyzeDream } from "../src/services/mock-analysis";
import { OpenAIResponsesProvider } from "../src/services/openai-responses-provider";

const shouldRunLiveTest = process.env.MANYANG_RUN_LIVE_LLM_TEST === "1" && Boolean(process.env.OPENAI_API_KEY);
const liveTest = shouldRunLiveTest ? test : test.skip;

class CapturingProvider implements DreamReadingLlmProvider {
  readonly requests: DreamReadingLlmRequest[] = [];
  readonly responses: unknown[] = [];

  constructor(private readonly provider: DreamReadingLlmProvider) {}

  async generateJson(request: DreamReadingLlmRequest): Promise<unknown> {
    this.requests.push(request);
    const response = await this.provider.generateJson(request);
    this.responses.push(response);
    return response;
  }
}

describe("OpenAI live smoke test", () => {
  liveTest("receives structured JSON from the configured model", async () => {
    const provider = new OpenAIResponsesProvider({
      apiKey: process.env.OPENAI_API_KEY ?? "",
      model: process.env.MANYANG_OPENAI_MODEL ?? "gpt-5-mini",
    });

    const result = await provider.generateJson({
      instructions: "Return JSON only. Keep the response short.",
      input: JSON.stringify({
        task: "health_check",
        dreamText: "I saw a quiet moon above a door.",
      }),
      schemaName: "live_smoke_result",
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          status: {
            type: "string",
            enum: ["ok"],
          },
          summary: {
            type: "string",
          },
        },
        required: ["status", "summary"],
      },
    });

    expect(result).toMatchObject({
      status: "ok",
    });
    expect((result as { summary?: unknown }).summary).toEqual(expect.any(String));
  });

  liveTest(
    "generates a full dream reading through the LLM analysis service",
    async () => {
      const provider = new CapturingProvider(
        new OpenAIResponsesProvider({
          apiKey: process.env.OPENAI_API_KEY ?? "",
          model: process.env.MANYANG_OPENAI_MODEL ?? "gpt-5-mini",
        }),
      );
      const request = {
        dreamText: "I dreamed that a snake appeared in my room and I was looking for a key.",
        locale: "en" as const,
        wakeMood: "curious",
      };
      const baseline = analyzeDream(request);
      const providerErrors: unknown[] = [];

      const result = await analyzeDreamWithLlm(request, {
        provider,
        onProviderError: (error) => providerErrors.push(error),
        ...(process.env.MANYANG_OPENAI_MODEL ? { model: process.env.MANYANG_OPENAI_MODEL } : {}),
      });

      expect(providerErrors).toEqual([]);
      expect(provider.requests).toHaveLength(1);
      expect(provider.requests[0]?.input).toContain("retrievedSymbolEvidence");
      expect(provider.requests[0]?.input).toContain("avoidExpressions");
      expect(provider.responses[0]).toMatchObject({
        summary: expect.any(String),
        interpretation: expect.any(String),
        smallPrescription: expect.any(String),
      });
      expect(result.summary).toBe((provider.responses[0] as { summary: string }).summary);
      expect(result.summary).not.toBe(baseline.summary);
      expect(result.symbols).toEqual(expect.arrayContaining(["Snake", "Room", "Key"]));
    },
    30_000,
  );
});
