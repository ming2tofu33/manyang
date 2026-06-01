import { describe, expect, test } from "vitest";

import { handleFeedbackRequest } from "./route";

describe("POST /api/feedback", () => {
  test("accepts authenticated feedback", async () => {
    const persisted: unknown[] = [];
    const response = await handleFeedbackRequest(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subjectType: "dream_reading",
          subjectId: "dream-1",
          rating: 5,
          feedbackText: "helpful",
        }),
      }),
      {
        getAuthenticatedUserId: async () => "user-1",
        persistFeedbackEvent: async (input) => {
          persisted.push(input);
          return "feedback-1";
        },
      },
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id: "feedback-1" });
    expect(persisted).toEqual([
      {
        userId: "user-1",
        guestId: null,
        subjectType: "dream_reading",
        subjectId: "dream-1",
        rating: 5,
        feedbackText: "helpful",
        metadata: {},
      },
    ]);
  });

  test("accepts guest feedback when a guest id is provided", async () => {
    const response = await handleFeedbackRequest(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          guestId: "38ddea94-5ad1-4d28-8ed1-792dd0132dee",
          subjectType: "app_flow",
          rating: 4,
        }),
      }),
      {
        getAuthenticatedUserId: async () => null,
        persistFeedbackEvent: async () => "feedback-1",
      },
    );

    expect(response.status).toBe(201);
  });

  test("rejects feedback without authenticated user or guest id", async () => {
    const response = await handleFeedbackRequest(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subjectType: "dream_reading",
          rating: 5,
        }),
      }),
      {
        getAuthenticatedUserId: async () => null,
        persistFeedbackEvent: async () => "feedback-1",
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "guestId is required for guest feedback" });
  });

  test("rejects invalid feedback payloads", async () => {
    const response = await handleFeedbackRequest(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          guestId: "not-a-uuid",
          subjectType: "other",
          rating: 9,
          feedbackText: "x".repeat(1001),
        }),
      }),
      {
        getAuthenticatedUserId: async () => null,
        persistFeedbackEvent: async () => "feedback-1",
      },
    );

    expect(response.status).toBe(400);
  });
});
