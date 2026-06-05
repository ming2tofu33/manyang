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
        orbImage="/manyang/orbs/cat-with-stand/whitecat-orb-with-stand.webp"
      />,
    );

    expect(markup).toContain("%2Fmanyang%2Fbackgrounds%2Finterpretation-white-cat.webp");
    expect(markup).toContain("%2Fmanyang%2Forbs%2Fcat-with-stand%2Fwhitecat-orb-with-stand.webp");
    expect(markup).not.toContain("%2Fmanyang%2Forbs%2Forb-1-transparent.webp");
    expect(markup).not.toContain("%2Fmanyang%2Forbs%2Forb-2-transparent.webp");
    expect(markup).not.toContain("%2Fmanyang%2Forbs%2Forb-3-transparent.webp");
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
    expect(markup).toContain("오늘의 꿈을 읽을 고양이가 자리를 잡았어요.");
    expect(markup).not.toContain("꿈 조각을 오브에 모으고 있어요.");
    expect(markup).toContain("고양이 등장");
    expect(markup).toContain("곧 꿈 조각을 오브에 모을게요.");
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
    expect(markup).toContain("꿈속에 남은 장면을 오브에 펼쳐보고 있어요.");
    expect(markup).toContain("해석 중");
    expect(markup).not.toContain("blur-md");
  });

  it("cycles through three interpretation messages while showing the illustration", () => {
    const secondMessageMarkup = renderToStaticMarkup(
      <DreamLoadingOverlay
        isActive
        background="/manyang/backgrounds/interpretation-white-cat.webp"
        readerImage="/manyang/references/loading-white-cat.webp"
        introImage="/manyang/backgrounds/interpretation-white-cat.webp"
        elapsedMs={6334}
      />,
    );
    const thirdMessageMarkup = renderToStaticMarkup(
      <DreamLoadingOverlay
        isActive
        background="/manyang/backgrounds/interpretation-white-cat.webp"
        readerImage="/manyang/references/loading-white-cat.webp"
        introImage="/manyang/backgrounds/interpretation-white-cat.webp"
        elapsedMs={9667}
      />,
    );

    expect(secondMessageMarkup).toContain("반복해서 나타난 상징을 하나씩 짚어보고 있어요.");
    expect(thirdMessageMarkup).toContain("꿈에 묻어 있던 감정을 비춰보고 있어요.");
  });

  it("shows the orb reading scene as a caption without the card panel", () => {
    const markup = renderToStaticMarkup(
      <DreamLoadingOverlay
        isActive
        background="/manyang/backgrounds/interpretation-white-cat.webp"
        readerImage="/manyang/references/loading-white-cat.webp"
        introImage="/manyang/backgrounds/interpretation-white-cat.webp"
        elapsedMs={13000}
      />,
    );

    expect(markup).toContain("data-loading-scene=\"orb\"");
    expect(markup).toContain("data-loading-orb-caption=\"true\"");
    expect(markup).not.toContain("data-loading-copy-panel=\"true\"");
    expect(markup).toContain("진행 단계 1/4");
    expect(markup).not.toContain("오브 리딩 1/4");
    expect(markup).toContain("꿈 조각을 오브에 모으고 있어요.");
    expect(markup).toContain("data-loading-step-indicator=\"true\"");
  });

  it("adds reassurance copy during longer waits", () => {
    const markup = renderToStaticMarkup(
      <DreamLoadingOverlay
        isActive
        background="/manyang/backgrounds/interpretation-white-cat.webp"
        readerImage="/manyang/references/loading-white-cat.webp"
        introImage="/manyang/backgrounds/interpretation-white-cat.webp"
        elapsedMs={30000}
      />,
    );

    expect(markup).toContain("꿈 조각이 많아 한 겹 더 맞춰보고 있어요.");
  });
});
