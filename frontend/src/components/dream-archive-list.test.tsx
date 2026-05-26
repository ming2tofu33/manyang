import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ArchiveCatGuide } from "./dream-archive-list";

describe("ArchiveCatGuide", () => {
  it("renders the archive guide with the currently selected cat profile", () => {
    const markup = renderToStaticMarkup(<ArchiveCatGuide selectedCatReaderId="white_cat" />);

    expect(markup).toContain("/manyang/references/cat-white-profile.png");
    expect(markup).toContain("하얀냥");
    expect(markup).not.toContain("blackcat-profile-transparent");
  });
});
