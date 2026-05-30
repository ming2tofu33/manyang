export type JsonSchemaObject = Record<string, unknown>;

export type DreamReadingLlmRequest = {
  model?: string;
  instructions: string;
  input: string;
  schemaName: string;
  jsonSchema: JsonSchemaObject;
  timeoutMs?: number;
};

export interface DreamReadingLlmProvider {
  generateJson(request: DreamReadingLlmRequest): Promise<unknown>;
}

export class LlmProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmProviderConfigurationError";
  }
}

export class LlmProviderRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "LlmProviderRequestError";
  }
}

export class LlmProviderTimeoutError extends Error {
  constructor(readonly timeoutMs: number) {
    super(`LLM provider timed out after ${timeoutMs}ms`);
    this.name = "LlmProviderTimeoutError";
  }
}
