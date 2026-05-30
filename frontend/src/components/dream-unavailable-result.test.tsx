import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import type { DreamUnavailablePayload } from "@/lib/dream-storage";
import { DreamUnavailableResult } from "./dream-unavailable-result";

const payload: DreamUnavailablePayload = {
  status: "unavailable",
  dreamText: "I dreamed that a snake appeared in my room.",
  dreamDate: "2026-05-24",
  catReaderType: "gray_cat",
  wakeMood: "curious",
  reason: "provider_error",
  retryable: true,
  safetyNotice: "This dream reading is not a medical diagnosis.",
  failedAt: "2026-05-24T00:00:00.000Z",
};

describe("DreamUnavailableResult", () => {
  test("shows a retryable unavailable state without rendering a fake interpretation", () => {
    const markup = renderToStaticMarkup(<DreamUnavailableResult payload={payload} />);

    expect(markup).toContain("지금은 꿈을 끝까지 읽지 못했어요");
    expect(markup).toContain("다시 불러보기");
    expect(markup).toContain("꿈 다시 열기");
    expect(markup).toContain("This dream reading is not a medical diagnosis.");
    expect(markup).not.toContain("interpretation");
  });

  test("does not show retry when the unavailable state is not retryable", () => {
    const markup = renderToStaticMarkup(
      <DreamUnavailableResult payload={{ ...payload, reason: "provider_missing", retryable: false }} />,
    );

    expect(markup).toContain("설정이 준비되지 않았어요");
    expect(markup).not.toContain("다시 불러보기");
  });
});
