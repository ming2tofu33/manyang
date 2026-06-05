import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ProfileFeedbackDialog } from "./profile-feedback-dialog";

describe("ProfileFeedbackDialog", () => {
  it("renders a profile feedback form", () => {
    const markup = renderToStaticMarkup(
      <ProfileFeedbackDialog isAuthenticated={false} onClose={() => undefined} />,
    );

    expect(markup).toContain('data-profile-dialog="feedback"');
    expect(markup).toContain("문의와 피드백");
    expect(markup).toContain("의견 보내기");
    expect(markup).toContain("textarea");
  });
});
