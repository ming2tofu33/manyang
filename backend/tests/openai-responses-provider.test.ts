import { describe, expect, test } from "vitest";

import {
  createOpenAIResponsesProviderFromEnv,
  OpenAIResponsesProvider,
} from "../src/services/openai-responses-provider";

describe("OpenAIResponsesProvider", () => {
  test("sends a structured output request to the Responses API", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchFn = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
      calls.push({ url: String(url), init: init ?? {} });

      return new Response(
        JSON.stringify({
          output_text: JSON.stringify({ summary: "ok" }),
          usage: {
            input_tokens: 10,
            output_tokens: 5,
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };

    const provider = new OpenAIResponsesProvider({
      apiKey: "sk-test",
      model: "gpt-test",
      baseUrl: "https://api.openai.com/v1",
      fetchFn,
    });

    const result = await provider.generateJson({
      model: "override-model",
      instructions: "Return JSON only.",
      input: "{\"dreamText\":\"snake\"}",
      schemaName: "dream_reading_draft",
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          summary: { type: "string" },
        },
        required: ["summary"],
      },
    });

    expect(result).toEqual({ summary: "ok" });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://api.openai.com/v1/responses");
    expect(calls[0]?.init.method).toBe("POST");
    expect(calls[0]?.init.headers).toMatchObject({
      authorization: "Bearer sk-test",
      "content-type": "application/json",
    });

    const body = JSON.parse(String(calls[0]?.init.body));
    expect(body).toMatchObject({
      model: "override-model",
      instructions: "Return JSON only.",
      input: "{\"dreamText\":\"snake\"}",
      text: {
        format: {
          type: "json_schema",
          name: "dream_reading_draft",
          strict: true,
        },
      },
    });
    expect(body.text.format.schema.required).toEqual(["summary"]);
    expect(calls[0]?.init.signal).toBeUndefined();
  });

  test("passes an abort signal to fetch when timeoutMs is provided", async () => {
    let requestSignal: AbortSignal | null = null;
    const fetchFn = async (_url: string | URL | Request, init?: RequestInit): Promise<Response> => {
      requestSignal = init?.signal ?? null;

      return new Response(
        JSON.stringify({
          output_text: JSON.stringify({ summary: "ok" }),
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };

    const provider = new OpenAIResponsesProvider({
      apiKey: "sk-test",
      fetchFn,
    });

    await provider.generateJson({
      instructions: "Return JSON only.",
      input: "{}",
      schemaName: "dream_reading_draft",
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          summary: { type: "string" },
        },
        required: ["summary"],
      },
      timeoutMs: 1000,
    });

    expect(requestSignal).toBeInstanceOf(AbortSignal);
    expect((requestSignal as unknown as AbortSignal).aborted).toBe(false);
  });

  test("creates a provider only when LLM mode and an API key are configured", () => {
    expect(
      createOpenAIResponsesProviderFromEnv({
        MANYANG_ANALYSIS_MODE: "mock",
      }),
    ).toBeUndefined();

    expect(() =>
      createOpenAIResponsesProviderFromEnv({
        MANYANG_ANALYSIS_MODE: "llm",
      }),
    ).toThrow("OPENAI_API_KEY is required when MANYANG_ANALYSIS_MODE=llm");

    expect(
      createOpenAIResponsesProviderFromEnv({
        MANYANG_ANALYSIS_MODE: "llm",
        OPENAI_API_KEY: "sk-test",
      }),
    ).toBeInstanceOf(OpenAIResponsesProvider);
  });
});
