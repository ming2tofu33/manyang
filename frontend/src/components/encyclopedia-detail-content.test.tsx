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
    expect(markup).toContain("/manyang/ui/semantic-icons/semantic-paw.png");
    expect(markup).not.toContain("/manyang/ui/semantic-icons/semantic-door.png");
    expect(markup).toContain("href=\"/write?symbol=cat\"");
    expect(markup).toContain("/manyang/ui/buttons/dreammemory-submit-frame-slim.png");
    expect(markup).toContain("href=\"/encyclopedia/darkness\"");
  });

  it("renders a result-context version when opened from a dream receipt", () => {
    if (!catEntry) {
      throw new Error("Missing cat encyclopedia entry");
    }

    const markup = renderToStaticMarkup(
      <EncyclopediaDetailContent entry={catEntry} relatedSymbols={[]} source="result" />,
    );

    expect(markup).toContain("data-result-encyclopedia-context=\"true\"");
    expect(markup).toContain("영수증에 담긴 상징 메모");
    expect(markup).toContain("방금 받은 꿈 영수증에서 이어서 살펴보는 상징이에요.");
    expect(markup).toContain("영수증으로 돌아가기");
    expect(markup).toContain("href=\"/result\"");
    expect(markup).toContain("/manyang/ui/buttons/common-medium-primary-frame.png");
    expect(markup).toContain("/manyang/ui/buttons/common-medium-secondary-frame.png");
    expect(markup).not.toContain("꿈 영수증의 근거");
    expect(markup).not.toContain("오늘의 꿈 영수증 받기");
  });
});
