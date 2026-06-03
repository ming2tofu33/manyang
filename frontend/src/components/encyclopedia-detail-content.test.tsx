import type { EncyclopediaEntry } from "@manyang/backend";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EncyclopediaDetailContent } from "./encyclopedia-detail-content";

// 컴포넌트 렌더 테스트용 self-contained 픽스처(데이터셋 비의존).
const catEntry: EncyclopediaEntry = {
  symbol: "고양이",
  slug: "cat",
  category: "animal",
  aliases: ["고양이", "냥이", "검은고양이", "길고양이"],
  coreMeanings: ["직감", "독립성", "조용한 관찰"],
  positiveReadings: ["내 감각을 믿어도 되는 흐름", "거리를 두고 살피는 지혜"],
  negativeReadings: ["마음을 쉽게 열지 않는 경계", "혼자 해결하려는 습관"],
  contextQuestions: ["고양이가 다가왔나요, 멀어졌나요?", "고양이를 돌봤나요, 바라봤나요?"],
  relatedSymbols: ["동물", "어둠", "모르는 사람"],
  catInterpretationHint: "고양이는 조용히 이미 알고 있던 마음을 건드립니다.",
  body: "고양이는 직감과 독립성, 섬세한 거리감을 표현하기 좋습니다.",
};

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
    expect(markup).toContain("/manyang/ui/encyclopedia-icons/encyclopedia-animal.png");
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
