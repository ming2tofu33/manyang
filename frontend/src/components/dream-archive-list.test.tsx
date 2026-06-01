import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ArchiveCatGuide, DreamRecordActions } from "./dream-archive-list";

describe("ArchiveCatGuide", () => {
  it("renders the archive guide with the currently selected cat profile", () => {
    const markup = renderToStaticMarkup(<ArchiveCatGuide selectedCatReaderId="white_cat" />);

    expect(markup).toContain("/manyang/references/cat-white-profile.webp");
    expect(markup).toContain("꿈은 지나가도");
    expect(markup).not.toContain("blackcat-profile-transparent");
  });
});

describe("DreamRecordActions", () => {
  it("renders a receipt restore action next to delete", () => {
    const markup = renderToStaticMarkup(
      <DreamRecordActions title="A saved dream receipt" onOpen={() => undefined} onDelete={() => undefined} />,
    );

    expect(markup).toContain("A saved dream receipt 꿈 영수증 다시 보기");
    expect(markup).toContain("A saved dream receipt 기록 삭제");
    expect(markup).toContain("/manyang/ui/action-icons/action-book.png");
    expect(markup).toContain("/manyang/ui/action-icons/action-trash.png");
  });
});
