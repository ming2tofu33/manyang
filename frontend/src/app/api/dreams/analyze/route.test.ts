import { describe, expect, test } from "vitest";

import { POST } from "./route";

function createJsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/dreams/analyze", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/dreams/analyze", () => {
  test("returns a mock dream analysis response", async () => {
    const response = await POST(
      createJsonRequest({
        dreamText: "학교 복도에서 교실을 찾는데 문이 계속 바뀌었어요.",
        dreamDate: "2026-05-24",
        wakeMood: "anxious",
        catReaderType: "white_cat",
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.reader).toMatchObject({
      id: "white_cat",
      name: "하얀냥",
      access: "free",
    });
    expect(body.readerNote).toContain("하얀냥");
    expect(body.symbols).toEqual(expect.arrayContaining(["학교", "복도", "문", "찾기"]));
    expect(body.readingBasis.usedSymbols).toEqual(expect.arrayContaining(["학교", "복도", "문", "찾기"]));
    expect(body.summary).toContain("꿈");
    expect(body.card.name).toContain("밤");
  });

  test("returns 400 when dreamText is empty", async () => {
    const response = await POST(createJsonRequest({ dreamText: "   " }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "dreamText is required",
    });
  });
});
