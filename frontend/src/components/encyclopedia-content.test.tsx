import { getEncyclopediaEntriesForLocale } from "@manyang/backend";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EncyclopediaContent } from "./encyclopedia-content";

describe("EncyclopediaContent", () => {
  it("keeps all entries searchable while rendering the first page for infinite scroll", () => {
    const entries = Array.from({ length: 14 }, (_, index) => ({
      symbol: `Symbol ${index + 1}`,
      slug: `symbol-${index + 1}`,
      category: "place" as const,
    }));
    const markup = renderToStaticMarkup(<EncyclopediaContent entries={entries} />);

    expect(markup).toContain('data-encyclopedia-result-count="12/14"');
    expect(markup).toContain('data-encyclopedia-load-sentinel="true"');
    expect(markup).toContain('href="/encyclopedia/symbol-12"');
    expect(markup).not.toContain('href="/encyclopedia/symbol-13"');
  });

  it("shows the main category label on each encyclopedia card", () => {
    const markup = renderToStaticMarkup(
      <EncyclopediaContent
        entries={[
          { symbol: "문", slug: "door", category: "place" },
          { symbol: "열쇠", slug: "key", category: "object" },
          { symbol: "친구", slug: "friend", category: "person" },
          { symbol: "손", slug: "hand", category: "body" },
        ]}
      />,
    );

    expect(markup).toContain('aria-label="상위 분류: 장소"');
    expect(markup).toContain('aria-label="상위 분류: 사물"');
    expect(markup).toContain('aria-label="상위 분류: 사람"');
    expect(markup).toContain('aria-label="상위 분류: 몸"');
    expect(markup).toContain("/manyang/ui/encyclopedia-icons/encyclopedia-person.png");
    expect(markup).toContain("/manyang/ui/encyclopedia-icons/encyclopedia-body.png");
    expect(markup).toContain("/manyang/ui/action-icons/action-search.png");
    expect(markup).not.toContain("/manyang/cutouts/icons/07-circle-profile.png");
    expect(markup).not.toContain("/manyang/cutouts/icons/13-circle-search-star.png");
  });

  it("keeps static encyclopedia content server-renderable while reader guide hydrates separately", () => {
    const markup = renderToStaticMarkup(
      <EncyclopediaContent entries={getEncyclopediaEntriesForLocale("ko").slice(0, 12)} />,
    );

    expect(markup).toContain("/manyang/references/cat-black-profile.webp");
    expect(markup).toContain("사전 안내");
    expect(markup).toContain("type=\"search\"");
    expect(markup).toContain("placeholder=\"무슨 꿈이 궁금한가요?\"");
    expect(markup).toContain("많이 찾는 꿈해몽");
    expect(markup).toContain("[scrollbar-width:none]");
    expect(markup).toContain("href=\"/encyclopedia/door\"");
    expect(markup).not.toContain("이번 주");
    expect(markup).not.toContain("사용자 맞춤");
  });
});
