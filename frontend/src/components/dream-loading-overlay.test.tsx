import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DreamLoadingOverlay } from "./dream-loading-overlay";

describe("DreamLoadingOverlay", () => {
  it("uses the selected cat interpretation background while reading a dream", () => {
    const markup = renderToStaticMarkup(
      <DreamLoadingOverlay
        isActive
        background="/manyang/backgrounds/interpretation-white-cat.webp"
        catImage="/manyang/references/cat-white-profile.webp"
      />,
    );

    expect(markup).toContain("%2Fmanyang%2Fbackgrounds%2Finterpretation-white-cat.webp");
    expect(markup).toContain("%2Fmanyang%2Forbs%2Forb-1-transparent.webp");
    expect(markup).toContain("%2Fmanyang%2Forbs%2Forb-2-transparent.webp");
    expect(markup).toContain("%2Fmanyang%2Forbs%2Forb-3-transparent.webp");
  });

  it("starts with a cat scene before switching to the orb", () => {
    const markup = renderToStaticMarkup(
      <DreamLoadingOverlay
        isActive
        background="/manyang/backgrounds/interpretation-white-cat.webp"
        catImage="/manyang/references/cat-white-profile.webp"
        elapsedMs={0}
      />,
    );

    expect(markup).toContain("data-loading-scene=\"cat\"");
    expect(markup).toContain("/manyang/references/cat-white-profile.webp");
    expect(markup).toContain("고양이가 첫 장면을 살펴보고 있어요.");
    expect(markup).not.toContain("꿈 조각을 오브에 모으고 있어요.");
  });

  it("shows the orb reading scene and step label after the cat intro", () => {
    const markup = renderToStaticMarkup(
      <DreamLoadingOverlay
        isActive
        background="/manyang/backgrounds/interpretation-white-cat.webp"
        catImage="/manyang/references/cat-white-profile.webp"
        elapsedMs={5000}
      />,
    );

    expect(markup).toContain("data-loading-scene=\"orb\"");
    expect(markup).toContain("해몽 단계 1/4");
    expect(markup).toContain("꿈 조각을 오브에 모으고 있어요.");
  });

  it("adds reassurance copy during longer waits", () => {
    const markup = renderToStaticMarkup(
      <DreamLoadingOverlay
        isActive
        background="/manyang/backgrounds/interpretation-white-cat.webp"
        catImage="/manyang/references/cat-white-profile.webp"
        elapsedMs={30000}
      />,
    );

    expect(markup).toContain("꿈 내용이 길어서 조금 더 깊게 읽고 있어요.");
  });
});
