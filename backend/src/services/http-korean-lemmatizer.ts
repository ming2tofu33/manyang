import type { KoreanLemmatizer } from "./korean-lemmatizer";

// 별도 한국어 분석 서비스(B-2)에 HTTP로 물어보는 클라이언트.
// 서비스 계약(서비스가 구현해야 하는 API):
//   POST {url}/lemmatize   body: { "text": string, "locale"?: "ko" | "en" }
//   200                    json: { "lemmas": string[] }   // 매칭에 쓸 어간/표면형
// 실패·타임아웃 시 throw -> 호출부의 safeLemmatize가 빈 배열로 폴백하므로 해몽은 안 끊긴다.

export type HttpKoreanLemmatizerOptions = {
  url: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

const DEFAULT_TIMEOUT_MS = 2_000;

export class HttpKoreanLemmatizer implements KoreanLemmatizer {
  private readonly endpoint: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: HttpKoreanLemmatizerOptions) {
    this.endpoint = `${options.url.replace(/\/+$/, "")}/lemmatize`;
    this.timeoutMs =
      typeof options.timeoutMs === "number" && options.timeoutMs > 0 ? options.timeoutMs : DEFAULT_TIMEOUT_MS;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async lemmatize(text: string): Promise<string[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(this.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`korean lemmatizer responded with ${response.status}`);
      }

      const data = (await response.json()) as { lemmas?: unknown };

      if (!Array.isArray(data.lemmas)) {
        throw new Error("korean lemmatizer response is missing a lemmas array");
      }

      return data.lemmas.filter((lemma): lemma is string => typeof lemma === "string");
    } finally {
      clearTimeout(timer);
    }
  }
}

type EnvLike = Record<string, string | undefined>;

/**
 * MANYANG_LEMMATIZER_URL이 설정돼 있으면 클라이언트를 만들고, 없으면 undefined(=폴백).
 * 이렇게 env 스위치만으로 사전 서비스를 켜고 끈다.
 */
export function createKoreanLemmatizerFromEnv(env: EnvLike = process.env): KoreanLemmatizer | undefined {
  const url = env.MANYANG_LEMMATIZER_URL?.trim();

  if (!url) {
    return undefined;
  }

  const timeoutMs = Number(env.MANYANG_LEMMATIZER_TIMEOUT_MS);

  return new HttpKoreanLemmatizer({
    url,
    ...(Number.isFinite(timeoutMs) && timeoutMs > 0 ? { timeoutMs } : {}),
  });
}
