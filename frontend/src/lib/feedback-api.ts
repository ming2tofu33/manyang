export type ProfileFeedbackInput = {
  rating: number;
  feedbackText: string;
  guestId?: string | null;
};

export type ProfileFeedbackResult =
  | {
      status: "ok";
      id: string;
    }
  | {
      status: "error";
      message: string;
    };

export async function submitProfileFeedback(
  input: ProfileFeedbackInput,
  fetcher: typeof fetch = fetch,
): Promise<ProfileFeedbackResult> {
  const response = await fetcher("/api/feedback", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      subjectType: "app_flow",
      rating: input.rating,
      feedbackText: input.feedbackText,
      ...(input.guestId ? { guestId: input.guestId } : {}),
      metadata: { source: "profile_room" },
    }),
  });

  if (!response.ok) {
    return {
      status: "error",
      message: "피드백을 저장하지 못했어요.",
    };
  }

  const body = (await response.json()) as { id?: string };

  return { status: "ok", id: body.id ?? "" };
}
