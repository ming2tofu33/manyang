import { describe, expect, test, vi } from "vitest";

import {
  createKoreanLemmatizerFromEnv,
  HttpKoreanLemmatizer,
} from "../src/services/http-korean-lemmatizer";
import { safeLemmatize } from "../src/services/korean-lemmatizer";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("HttpKoreanLemmatizer", () => {
  test("posts the text and returns the lemmas array", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ lemmas: ["물", "올라가"] }));
    const lemmatizer = new HttpKoreanLemmatizer({ url: "http://analyzer.local/", fetchImpl: fetchImpl as typeof fetch });

    expect(await lemmatizer.lemmatize("맑은 물에서 올라갔어")).toEqual(["물", "올라가"]);

    const [calledUrl, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(calledUrl).toBe("http://analyzer.local/lemmatize");
    expect(JSON.parse(String(init.body))).toEqual({ text: "맑은 물에서 올라갔어" });
  });

  test("throws on a non-ok status so callers can fall back", async () => {
    const lemmatizer = new HttpKoreanLemmatizer({
      url: "http://analyzer.local",
      fetchImpl: (async () => jsonResponse({}, 500)) as typeof fetch,
    });

    await expect(lemmatizer.lemmatize("물")).rejects.toThrow();
    // safeLemmatize swallows the error -> empty array -> matcher keeps lexical behavior.
    expect(await safeLemmatize(lemmatizer, "물")).toEqual([]);
  });

  test("throws when the response has no lemmas array", async () => {
    const lemmatizer = new HttpKoreanLemmatizer({
      url: "http://analyzer.local",
      fetchImpl: (async () => jsonResponse({ tokens: [] })) as typeof fetch,
    });

    await expect(lemmatizer.lemmatize("물")).rejects.toThrow();
  });

  test("drops non-string entries from the lemmas array", async () => {
    const lemmatizer = new HttpKoreanLemmatizer({
      url: "http://analyzer.local",
      fetchImpl: (async () => jsonResponse({ lemmas: ["물", 1, null, "불"] })) as typeof fetch,
    });

    expect(await lemmatizer.lemmatize("물 불")).toEqual(["물", "불"]);
  });
});

describe("createKoreanLemmatizerFromEnv", () => {
  test("returns undefined when no service URL is configured", () => {
    expect(createKoreanLemmatizerFromEnv({})).toBeUndefined();
    expect(createKoreanLemmatizerFromEnv({ MANYANG_LEMMATIZER_URL: "   " })).toBeUndefined();
  });

  test("returns a client when the service URL is set", () => {
    const lemmatizer = createKoreanLemmatizerFromEnv({ MANYANG_LEMMATIZER_URL: "http://analyzer.local" });
    expect(lemmatizer).toBeInstanceOf(HttpKoreanLemmatizer);
  });
});
