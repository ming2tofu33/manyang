import { encyclopediaEntries } from "@manyang/backend";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EncyclopediaDetailContent } from "./encyclopedia-detail-content";

const catEntry = encyclopediaEntries.find((entry) => entry.slug === "cat");

describe("EncyclopediaDetailContent", () => {
  it("renders a symbol SEO page from an encyclopedia entry", () => {
    if (!catEntry) {
      throw new Error("Missing cat encyclopedia entry");
    }

    const markup = renderToStaticMarkup(
      <EncyclopediaDetailContent
        entry={catEntry}
        relatedSymbols={[
          { symbol: "동물", slug: null },
          { symbol: "어둠", slug: "darkness" },
          { symbol: "모르는 사람", slug: "stranger" },
        ]}
      />,
    );

    expect(markup).toContain("고양이 꿈 해몽");
    expect(markup).toContain("직감");
    expect(markup).toContain("내 감각을 믿어도 되는 흐름");
    expect(markup).toContain("마음을 쉽게 열지 않는 경계");
    expect(markup).toContain("고양이가 다가왔나요");
    expect(markup).toContain("상징 힌트");
    expect(markup).toContain("href=\"/write?symbol=cat\"");
    expect(markup).toContain("href=\"/encyclopedia/darkness\"");
  });
});
