import { describe, expect, test, vi } from "vitest";

import { createShareResultLink, sharePublicLink } from "./share-link-client";

describe("share link client", () => {
  test("creates a share result link through the API", async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        id: "share-1",
        path: "/share/dream/share-1",
        url: "https://manyang.example/share/dream/share-1",
      }),
    );

    await expect(
      createShareResultLink(
        {
          kind: "dream",
          payload: { dreamText: "corridor" },
        },
        fetcher,
      ),
    ).resolves.toEqual({
      id: "share-1",
      path: "/share/dream/share-1",
      url: "https://manyang.example/share/dream/share-1",
    });
    expect(fetcher).toHaveBeenCalledWith("/api/share-results", {
      body: JSON.stringify({ kind: "dream", payload: { dreamText: "corridor" } }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
  });

  test("shares the URL when native link sharing is available", async () => {
    const navigatorLike = {
      share: vi.fn(async () => undefined),
    };

    await expect(
      sharePublicLink({
        navigatorLike,
        text: "A dream receipt",
        title: "오늘의 꿈 영수증",
        url: "https://manyang.example/share/dream/share-1",
      }),
    ).resolves.toBe("shared");
    expect(navigatorLike.share).toHaveBeenCalledWith({
      text: "A dream receipt",
      title: "오늘의 꿈 영수증",
      url: "https://manyang.example/share/dream/share-1",
    });
  });

  test("copies the URL when native sharing is unavailable", async () => {
    const navigatorLike = {
      clipboard: {
        writeText: vi.fn(async () => undefined),
      },
    };

    await expect(
      sharePublicLink({
        navigatorLike,
        title: "오늘의 타로",
        url: "https://manyang.example/share/tarot/share-1",
      }),
    ).resolves.toBe("copied");
    expect(navigatorLike.clipboard.writeText).toHaveBeenCalledWith("https://manyang.example/share/tarot/share-1");
  });
});
