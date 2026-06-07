import {
  LlmProviderConfigurationError,
  LlmProviderRequestError,
  LlmProviderTimeoutError,
  type DreamReadingLlmProvider,
  type DreamReadingLlmRequest,
} from "./llm-provider";

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
type EnvLike = Record<string, string | undefined>;

export type OpenAIReasoningEffort = "minimal" | "low" | "medium" | "high";

export type OpenAIResponsesProviderOptions = {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  fetchFn?: FetchLike;
  /** gpt-5 계열 reasoning effort. 꿈해몽은 추론이 아닌 근거 기반 창작이라 기본을 낮춰 지연을 줄인다. */
  reasoningEffort?: OpenAIReasoningEffort;
};

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-5-mini";
const DEFAULT_REASONING_EFFORT: OpenAIReasoningEffort = "low";

function normalizeReasoningEffort(value: string | undefined): OpenAIReasoningEffort | undefined {
  return value === "minimal" || value === "low" || value === "medium" || value === "high" ? value : undefined;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function normalizeRequestTimeoutMs(timeoutMs: number | undefined): number | undefined {
  if (typeof timeoutMs !== "number" || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return undefined;
  }

  return Math.round(timeoutMs);
}

function extractOutputText(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  if (typeof record.output_text === "string") {
    return record.output_text;
  }

  if (!Array.isArray(record.output)) {
    return undefined;
  }

  for (const outputItem of record.output) {
    if (!outputItem || typeof outputItem !== "object") {
      continue;
    }

    const content = (outputItem as Record<string, unknown>).content;
    if (!Array.isArray(content)) {
      continue;
    }

    for (const contentItem of content) {
      if (contentItem && typeof contentItem === "object") {
        const text = (contentItem as Record<string, unknown>).text;
        if (typeof text === "string") {
          return text;
        }
      }
    }
  }

  return undefined;
}

export class OpenAIResponsesProvider implements DreamReadingLlmProvider {
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly fetchFn: FetchLike;
  private readonly reasoningEffort: OpenAIReasoningEffort;

  constructor(options: OpenAIResponsesProviderOptions) {
    this.model = options.model ?? DEFAULT_MODEL;
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL);
    this.fetchFn = options.fetchFn ?? fetch;
    this.reasoningEffort = options.reasoningEffort ?? DEFAULT_REASONING_EFFORT;

    if (!options.apiKey.trim()) {
      throw new LlmProviderConfigurationError("OPENAI_API_KEY is required when MANYANG_ANALYSIS_MODE=llm");
    }

    this.apiKey = options.apiKey;
  }

  private readonly apiKey: string;

  async generateJson(request: DreamReadingLlmRequest): Promise<unknown> {
    const timeoutMs = normalizeRequestTimeoutMs(request.timeoutMs);
    const abortController = timeoutMs ? new AbortController() : undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      if (abortController && timeoutMs) {
        timeoutId = setTimeout(() => abortController.abort(), timeoutMs);
      }

      const response = await this.fetchFn(`${this.baseUrl}/responses`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          "content-type": "application/json",
        },
        ...(abortController ? { signal: abortController.signal } : {}),
        body: JSON.stringify({
          model: request.model ?? this.model,
          instructions: request.instructions,
          input: request.input,
          reasoning: { effort: this.reasoningEffort },
          text: {
            format: {
              type: "json_schema",
              name: request.schemaName,
              strict: true,
              schema: request.jsonSchema,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new LlmProviderRequestError(`OpenAI Responses API request failed with status ${response.status}`, response.status);
      }

      const payload = (await response.json()) as unknown;
      const outputText = extractOutputText(payload);

      if (!outputText) {
        throw new LlmProviderRequestError("OpenAI Responses API response did not include output text");
      }

      try {
        return JSON.parse(outputText) as unknown;
      } catch (error) {
        throw new LlmProviderRequestError(error instanceof Error ? error.message : "Failed to parse model JSON output");
      }
    } catch (error) {
      if (abortController?.signal.aborted && timeoutMs) {
        throw new LlmProviderTimeoutError(timeoutMs);
      }

      throw error;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
}

export function createOpenAIResponsesProviderFromEnv(
  env: EnvLike = process.env,
  fetchFn?: FetchLike,
): OpenAIResponsesProvider | undefined {
  if (env.MANYANG_ANALYSIS_MODE !== "llm") {
    return undefined;
  }

  if (!env.OPENAI_API_KEY) {
    throw new LlmProviderConfigurationError("OPENAI_API_KEY is required when MANYANG_ANALYSIS_MODE=llm");
  }

  return new OpenAIResponsesProvider({
    apiKey: env.OPENAI_API_KEY,
    model: env.MANYANG_OPENAI_MODEL ?? env.OPENAI_MODEL ?? DEFAULT_MODEL,
    baseUrl: env.OPENAI_BASE_URL ?? DEFAULT_BASE_URL,
    reasoningEffort: normalizeReasoningEffort(env.MANYANG_OPENAI_REASONING_EFFORT) ?? DEFAULT_REASONING_EFFORT,
    ...(fetchFn ? { fetchFn } : {}),
  });
}
