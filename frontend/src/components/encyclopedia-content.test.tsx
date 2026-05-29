import { encyclopediaEntries } from "@manyang/backend";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EncyclopediaContent } from "./encyclopedia-content";

describe("EncyclopediaContent", () => {
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
