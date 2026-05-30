import { encyclopediaEntries } from "@manyang/backend";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EncyclopediaContent } from "./encyclopedia-content";

describe("EncyclopediaContent", () => {
  it("shows the main category label on each encyclopedia card", () => {
    const markup = renderToStaticMarkup(
      <EncyclopediaContent
        entries={[
          { symbol: "문", slug: "door", category: "place" },
          { symbol: "열쇠", slug: "key", category: "object" },
        ]}
      />,
    );

    expect(markup).toContain('aria-label="상위 분류: 장소"');
    expect(markup).toContain('aria-label="상위 분류: 사물"');
  });

  it("keeps static encyclopedia content server-renderable while reader guide hydrates separately", () => {
    const markup = renderToStaticMarkup(<EncyclopediaContent entries={encyclopediaEntries.slice(0, 12)} />);

    expect(markup).toContain("/manyang/references/cat-black-profile.webp");
    expect(markup).toContain("사전 안내");
    expect(markup).toContain("많이 찾는 꿈해몽");
    expect(markup).toContain("href=\"/encyclopedia/door\"");
    expect(markup).not.toContain("이번 주");
    expect(markup).not.toContain("사용자 맞춤");
  });
});
