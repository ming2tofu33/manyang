import type { CatReaderId } from "./cat-readers";

type CatReaderHomeCopy = {
  tag: string;
  line: string;
  sheetLine: string;
};

export const catReaderPickerSheetCopy = {
  eyebrow: "오늘의 테마",
  title: "어떤 고양이 테마로 남길까요?",
  description: "고양이에 따라 홈 배경과 꿈 영수증 분위기만 달라져요.",
} as const;

const catReaderHomeCopy: Record<CatReaderId, CatReaderHomeCopy> = {
  black_cat: {
    tag: "밤하늘",
    line: "깊은 밤하늘 무드로 남겨요",
    sheetLine: "촛불과 별빛이 있는 기본 테마",
  },
  white_cat: {
    tag: "달빛",
    line: "하얀 달빛 무드로 남겨요",
    sheetLine: "포근하고 조용한 달빛 테마",
  },
  cheese_cat: {
    tag: "노을",
    line: "따뜻한 노을 무드로 남겨요",
    sheetLine: "노란 별빛과 온기가 있는 테마",
  },
  gray_cat: {
    tag: "서재",
    line: "잿빛 달빛 서재로 남겨요",
    sheetLine: "Moon Pass 프리미엄 서재 테마",
  },
};

export function getCatReaderHomeCopy(readerId: CatReaderId): CatReaderHomeCopy {
  return catReaderHomeCopy[readerId];
}
