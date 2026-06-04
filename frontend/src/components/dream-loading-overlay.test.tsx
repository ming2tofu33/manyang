import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DreamLoadingOverlay } from "./dream-loading-overlay";

describe("DreamLoadingOverlay", () => {
  it("uses the selected cat interpretation background while reading a dream", () => {
    const markup = renderToStaticMarkup(
      <DreamLoadingOverlay
        isActive
        background="/manyang/backgrounds/interpretation-white-cat.webp"
        readerImage="/manyang/references/loading-white-cat.webp"
      />,
    );

    expect(markup).toContain("%2Fmanyang%2Fbackgrounds%2Finterpretation-white-cat.webp");
    expect(markup).toContain("%2Fmanyang%2Forbs%2Forb-1-transparent.webp");
    expect(markup).toContain("%2Fmanyang%2Forbs%2Forb-2-transparent.webp");
    expect(markup).toContain("%2Fmanyang%2Forbs%2Forb-3-transparent.webp");
    expect(markup).not.toContain("%2Fmanyang%2Fsemantic-icons%2Fkey");
    expect(markup).not.toContain("%2Fmanyang%2Fsemantic-icons%2Fcloud");
    expect(markup).not.toContain("%2Fmanyang%2Fsemantic-icons%2Fsparkles");
  });

  it("starts with the reader portrait before switching to the interpretation scene", () => {
    const markup = renderToStaticMarkup(
      <DreamLoadingOverlay
        isActive
        background="/manyang/backgrounds/interpretation-white-cat.webp"
        readerImage="/manyang/references/loading-white-cat.webp"
        introImage="/manyang/backgrounds/interpretation-white-cat.webp"
        elapsedMs={0}
      />,
    );

    expect(markup).toContain("data-loading-scene=\"reader\"");
    expect(markup).toContain("%2Fmanyang%2Freferences%2Floading-white-cat.webp");
    expect(markup).not.toContain("/manyang/references/cat-white-profile.webp");
    expect(markup).not.toContain("/manyang/references/cat-black-profile.webp");
    expect(markup).toContain("오늘 꿈을 읽을 고양이가 도착했어요.");
    expect(markup).not.toContain("꿈 조각을 오브에 모으고 있어요.");
    expect(markup).toContain("고양이 등장");
    expect(markup).toContain("잠시 뒤 꿈 조각을 오브에 모을게요.");
  });

  it("shows the full interpretation illustration after the reader intro", () => {
    const markup = renderToStaticMarkup(
      <DreamLoadingOverlay
        isActive
        background="/manyang/backgrounds/interpretation-white-cat.webp"
        readerImage="/manyang/references/loading-white-cat.webp"
        introImage="/manyang/backgrounds/interpretation-white-cat.webp"
        elapsedMs={3000}
      />,
    );

    expect(markup).toContain("data-loading-scene=\"interpretation\"");
    expect(markup).toContain("%2Fmanyang%2Fbackgrounds%2Finterpretation-white-cat.webp");
    expect(markup).toContain("장면과 상징을 차분히 읽고 있어요.");
    expect(markup).toContain("해석 중");
    expect(markup).not.toContain("blur-md");
  });

  it("shows the orb reading scene and step label after the interpretation scene", () => {
    const markup = renderToStaticMarkup(
      <DreamLoadingOverlay
        isActive
        background="/manyang/backgrounds/interpretation-white-cat.webp"
        readerImage="/manyang/references/loading-white-cat.webp"
        introImage="/manyang/backgrounds/interpretation-white-cat.webp"
        elapsedMs={10000}
      />,
    );

    expect(markup).toContain("data-loading-scene=\"orb\"");
    expect(markup).toContain("오브 리딩 1/4");
    expect(markup).toContain("꿈 조각을 오브에 모으고 있어요.");
    expect(markup).toContain("data-loading-step-indicator=\"true\"");
    expect(markup).toContain("오브 리딩");
  });

  it("adds reassurance copy during longer waits", () => {
    const markup = renderToStaticMarkup(
      <DreamLoadingOverlay
        isActive
        background="/manyang/backgrounds/interpretation-white-cat.webp"
        readerImage="/manyang/references/loading-white-cat.webp"
        introImage="/manyang/backgrounds/interpretation-white-cat.webp"
        elapsedMs={25000}
      />,
    );

    expect(markup).toContain("꿈 조각이 많아 한 겹 더 맞춰보고 있어요.");
  });
});
