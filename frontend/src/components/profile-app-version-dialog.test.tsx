import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ProfileAppVersionDialog } from "./profile-app-version-dialog";

describe("ProfileAppVersionDialog", () => {
  it("renders app version details", () => {
    const markup = renderToStaticMarkup(<ProfileAppVersionDialog onClose={() => undefined} />);

    expect(markup).toContain('data-profile-dialog="app-version"');
    expect(markup).toContain("앱 버전");
    expect(markup).toContain("v0.1.0");
  });
});
