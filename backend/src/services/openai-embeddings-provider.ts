import {
  EmbeddingProviderConfigurationError,
  EmbeddingProviderRequestError,
  type DreamEmbeddingProvider,
} from "./dream-embedding-provider";

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
type EnvLike = Record<string, string | undefined>;

export type OpenAIEmbeddingsProviderOptions = {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  fetchFn?: FetchLike;
};

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function parseEmbeddings(payload: unknown): number[][] | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const data = (payload as Record<string, unknown>).data;
  if (!Array.isArray(data)) {
    return undefined;
  }

  return [...data]
    .sort((left, right) => {
      const leftIndex = typeof left === "object" && left ? (left as Record<string, unknown>).index : undefined;
      const rightIndex = typeof right === "object" && right ? (right as Record<string, unknown>).index : undefined;

      return (typeof leftIndex === "number" ? leftIndex : 0) - (typeof rightIndex === "number" ? rightIndex : 0);
    })
    .map((item) => {
      if (!item || typeof item !== "object") {
        return undefined;
      }

      const embedding = (item as Record<string, unknown>).embedding;
      if (!Array.isArray(embedding) || !embedding.every((value) => typeof value === "number")) {
        return undefined;
      }

      return embedding;
    })
    .filter((embedding): embedding is number[] => Boolean(embedding));
}

export class OpenAIEmbeddingsProvider implements DreamEmbeddingProvider {
  readonly model: string;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchFn: FetchLike;

  constructor(options: OpenAIEmbeddingsProviderOptions) {
    if (!options.apiKey.trim()) {
      throw new EmbeddingProviderConfigurationError("OPENAI_API_KEY is required when MANYANG_RAG_EMBEDDINGS_MODE=openai");
    }

    this.apiKey = options.apiKey;
    this.model = options.model ?? DEFAULT_EMBEDDING_MODEL;
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL);
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const response = await this.fetchFn(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
    });

    if (!response.ok) {
      throw new EmbeddingProviderRequestError(`OpenAI Embeddings API request failed with status ${response.status}`, response.status);
    }

    const embeddings = parseEmbeddings(await response.json());
    if (!embeddings || embeddings.length !== texts.length) {
      throw new EmbeddingProviderRequestError("OpenAI Embeddings API response did not include the expected embeddings");
    }

    return embeddings;
  }
}

export function createOpenAIEmbeddingsProviderFromEnv(
  env: EnvLike = process.env,
  fetchFn?: FetchLike,
): OpenAIEmbeddingsProvider | undefined {
  if (env.MANYANG_RAG_EMBEDDINGS_MODE !== "openai") {
    return undefined;
  }

  if (!env.OPENAI_API_KEY) {
    throw new EmbeddingProviderConfigurationError("OPENAI_API_KEY is required when MANYANG_RAG_EMBEDDINGS_MODE=openai");
  }

  return new OpenAIEmbeddingsProvider({
    apiKey: env.OPENAI_API_KEY,
    model: env.MANYANG_OPENAI_EMBEDDING_MODEL ?? env.OPENAI_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL,
    baseUrl: env.OPENAI_BASE_URL ?? DEFAULT_BASE_URL,
    ...(fetchFn ? { fetchFn } : {}),
  });
}
