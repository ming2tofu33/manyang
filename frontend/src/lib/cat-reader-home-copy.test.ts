import { describe, expect, test } from "vitest";

import { catReaderPickerSheetCopy, getCatReaderHomeCopy } from "./cat-reader-home-copy";

describe("cat reader home copy", () => {
  test("keeps the picker sheet copy short and natural", () => {
    expect(catReaderPickerSheetCopy).toEqual({
      eyebrow: "오늘의 테마",
      title: "어떤 고양이 테마로 남길까요?",
      description: "고양이에 따라 홈 배경과 꿈 영수증 분위기만 달라져요.",
    });
  });

  test("describes each cat reader with home-friendly labels", () => {
    expect(getCatReaderHomeCopy("black_cat")).toEqual({
      tag: "밤하늘",
      line: "깊은 밤하늘 무드로 남겨요",
      sheetLine: "촛불과 별빛이 있는 기본 테마",
    });
    expect(getCatReaderHomeCopy("white_cat")).toEqual({
      tag: "달빛",
      line: "하얀 달빛 무드로 남겨요",
      sheetLine: "포근하고 조용한 달빛 테마",
    });
    expect(getCatReaderHomeCopy("cheese_cat")).toEqual({
      tag: "노을",
      line: "따뜻한 노을 무드로 남겨요",
      sheetLine: "노란 별빛과 온기가 있는 테마",
    });
    expect(getCatReaderHomeCopy("gray_cat")).toEqual({
      tag: "서재",
      line: "잿빛 달빛 서재로 남겨요",
      sheetLine: "Moon Pass 프리미엄 서재 테마",
    });
  });
});
