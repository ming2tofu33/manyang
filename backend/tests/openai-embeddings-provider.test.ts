import { describe, expect, test } from "vitest";

import {
  createOpenAIEmbeddingsProviderFromEnv,
  OpenAIEmbeddingsProvider,
} from "../src/services/openai-embeddings-provider";

describe("OpenAIEmbeddingsProvider", () => {
  test("sends embedding requests to the OpenAI embeddings endpoint", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchFn = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
      calls.push({ url: String(url), init: init ?? {} });

      return new Response(
        JSON.stringify({
          data: [
            { index: 0, embedding: [1, 0, 0] },
            { index: 1, embedding: [0, 1, 0] },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };

    const provider = new OpenAIEmbeddingsProvider({
      apiKey: "sk-test",
      model: "text-embedding-test",
      baseUrl: "https://api.openai.com/v1/",
      fetchFn,
    });

    const embeddings = await provider.embedTexts(["병원 돌봄", "뱀 생명력"]);

    expect(embeddings).toEqual([
      [1, 0, 0],
      [0, 1, 0],
    ]);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://api.openai.com/v1/embeddings");
    expect(calls[0]?.init.headers).toMatchObject({
      authorization: "Bearer sk-test",
      "content-type": "application/json",
    });
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({
      model: "text-embedding-test",
      input: ["병원 돌봄", "뱀 생명력"],
    });
  });

  test("creates a provider from env only when RAG embeddings are enabled", () => {
    expect(createOpenAIEmbeddingsProviderFromEnv({ MANYANG_RAG_EMBEDDINGS_MODE: "mock" })).toBeUndefined();
    expect(() => createOpenAIEmbeddingsProviderFromEnv({ MANYANG_RAG_EMBEDDINGS_MODE: "openai" })).toThrow(
      "OPENAI_API_KEY is required when MANYANG_RAG_EMBEDDINGS_MODE=openai",
    );

    const provider = createOpenAIEmbeddingsProviderFromEnv({
      MANYANG_RAG_EMBEDDINGS_MODE: "openai",
      OPENAI_API_KEY: "sk-test",
      MANYANG_OPENAI_EMBEDDING_MODEL: "text-embedding-test",
    });

    expect(provider).toBeInstanceOf(OpenAIEmbeddingsProvider);
    expect(provider?.model).toBe("text-embedding-test");
  });
});
