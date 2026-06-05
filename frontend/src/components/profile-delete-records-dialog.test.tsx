import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { deleteConfirmationPhrase, ProfileDeleteRecordsDialog } from "./profile-delete-records-dialog";

describe("ProfileDeleteRecordsDialog", () => {
  it("requires an explicit confirmation phrase", () => {
    const markup = renderToStaticMarkup(
      <ProfileDeleteRecordsDialog isAuthenticated={false} onClose={() => undefined} />,
    );

    expect(markup).toContain('data-profile-dialog="delete-records"');
    expect(markup).toContain(deleteConfirmationPhrase);
    expect(markup).toContain("disabled");
  });
});
