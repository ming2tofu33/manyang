import { describe, expect, it } from "vitest";

import { submitProfileFeedback } from "./feedback-api";

describe("feedback api", () => {
  it("submits app flow feedback", async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    const result = await submitProfileFeedback(
      {
        rating: 5,
        feedbackText: "좋았어요",
        guestId: "00000000-0000-4000-8000-000000000001",
      },
      async (url, init) => {
        calls.push({ url: String(url), body: JSON.parse(String(init?.body)) });
        return Response.json({ id: "feedback-1" }, { status: 201 });
      },
    );

    expect(result).toEqual({ status: "ok", id: "feedback-1" });
    expect(calls[0]).toMatchObject({
      url: "/api/feedback",
      body: {
        guestId: "00000000-0000-4000-8000-000000000001",
        subjectType: "app_flow",
        rating: 5,
        feedbackText: "좋았어요",
        metadata: { source: "profile_room" },
      },
    });
  });
});
