import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  CatReaderPicker,
  homeCatBackgroundChangeDelayMs,
  homeCatSelectionFeedbackMs,
} from "./cat-reader-picker";

describe("CatReaderPicker", () => {
  it("waits until the sheet feedback has cleared before changing the home background", () => {
    expect(homeCatSelectionFeedbackMs).toBeGreaterThanOrEqual(180);
    expect(homeCatBackgroundChangeDelayMs).toBeGreaterThan(homeCatSelectionFeedbackMs);
  });

  it("renders the home picker as a collapsed trigger before the sheet is opened", () => {
    const markup = renderToStaticMarkup(<CatReaderPicker value="white_cat" onChange={() => undefined} />);

    expect(markup).toContain("바꾸기");
    expect(markup).toContain("home-cat-picker-trigger");
    expect(markup).toContain("오늘의 고양이");
    expect(markup).toContain("하얀냥이 꿈을 읽어요");
    expect(markup).toContain("위로");
    expect(markup).toContain("불안한 꿈을 부드럽게 다독여요");
    expect(markup).not.toContain("오늘 꿈을 읽어줄 고양이");
    expect(markup).not.toContain("검은냥");
    expect(markup).not.toContain("치즈냥");
    expect(markup).not.toContain("잿빛냥");
  });

  it("keeps gray cat selectable in compact entry flows", () => {
    const markup = renderToStaticMarkup(
      <CatReaderPicker value="gray_cat" onChange={() => undefined} variant="compact" />,
    );

    expect(markup).toContain("잿빛냥");
    expect(markup).toContain("타로 해몽사");
    expect(markup).not.toContain("disabled");
    expect(markup).toContain("Moon Pass");
  });
});
