import { describe, expect, test, vi } from "vitest";

import { handleShareResultsRequest } from "./route";

describe("POST /api/share-results", () => {
  test("creates a public share URL for a dream result", async () => {
    const persistSharedResult = vi.fn(async () => ({
      id: "share-abc",
      kind: "dream" as const,
      payload: { dreamText: "corridor" },
      createdAt: "2026-06-12T00:00:00.000Z",
    }));

    const response = await handleShareResultsRequest(
      new Request("https://manyang.example/api/share-results", {
        method: "POST",
        body: JSON.stringify({
          kind: "dream",
          payload: { dreamText: "corridor" },
        }),
      }),
      {
        createPublicId: () => "share-abc",
        getAuthenticatedUserId: async () => "user-1",
        persistSharedResult,
      },
    );

    await expect(response.json()).resolves.toEqual({
      id: "share-abc",
      path: "/share/dream/share-abc",
      url: "https://manyang.example/share/dream/share-abc",
    });
    expect(response.status).toBe(201);
    expect(persistSharedResult).toHaveBeenCalledWith({
      publicId: "share-abc",
      kind: "dream",
      payload: { dreamText: "corridor" },
      userId: "user-1",
    });
  });

  test("allows guest tarot shares without a user id", async () => {
    const persistSharedResult = vi.fn(async () => ({
      id: "share-tarot",
      kind: "tarot" as const,
      payload: { title: "Daily card" },
      createdAt: "2026-06-12T00:00:00.000Z",
    }));

    const response = await handleShareResultsRequest(
      new Request("https://manyang.example/api/share-results", {
        method: "POST",
        body: JSON.stringify({
          kind: "tarot",
          payload: { title: "Daily card" },
        }),
      }),
      {
        createPublicId: () => "share-tarot",
        getAuthenticatedUserId: async () => null,
        persistSharedResult,
      },
    );

    await expect(response.json()).resolves.toMatchObject({
      path: "/share/tarot/share-tarot",
    });
    expect(persistSharedResult).toHaveBeenCalledWith(expect.objectContaining({ userId: null }));
  });

  test("rejects invalid share requests", async () => {
    const response = await handleShareResultsRequest(
      new Request("https://manyang.example/api/share-results", {
        method: "POST",
        body: JSON.stringify({ kind: "image", payload: {} }),
      }),
      {
        createPublicId: () => "unused",
        getAuthenticatedUserId: async () => null,
        persistSharedResult: vi.fn(),
      },
    );

    await expect(response.json()).resolves.toEqual({ error: "kind must be dream or tarot" });
    expect(response.status).toBe(400);
  });
});
