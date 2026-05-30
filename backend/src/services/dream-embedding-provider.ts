export type DreamEmbeddingProvider = {
  readonly model: string;
  embedTexts(texts: string[]): Promise<number[][]>;
};

export class EmbeddingProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmbeddingProviderConfigurationError";
  }
}

export class EmbeddingProviderRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "EmbeddingProviderRequestError";
  }
}
