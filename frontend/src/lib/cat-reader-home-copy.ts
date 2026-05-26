import type { CatReaderId } from "./cat-readers";

type CatReaderHomeCopy = {
  tag: string;
  line: string;
  sheetLine: string;
};

export const catReaderPickerSheetCopy = {
  eyebrow: "오늘의 고양이",
  title: "어떤 고양이에게 꿈을 맡길까요?",
  description: "고양이에 따라 홈 배경과 해몽 말투가 달라져요.",
} as const;

const catReaderHomeCopy: Record<CatReaderId, CatReaderHomeCopy> = {
  black_cat: {
    tag: "상징",
    line: "꿈속 단서를 차분히 짚어요",
    sheetLine: "장면과 상징을 읽어내요",
  },
  white_cat: {
    tag: "위로",
    line: "불안한 꿈을 부드럽게 다독여요",
    sheetLine: "불안하거나 슬픈 꿈을 풀어줘요",
  },
  cheese_cat: {
    tag: "처방",
    line: "오늘 해볼 작은 행동을 찾아요",
    sheetLine: "지금 해볼 수 있는 작은 실마리를 찾아줘요",
  },
  gray_cat: {
    tag: "꿈+타로",
    line: "꿈과 타로 상징을 함께 읽어요",
    sheetLine: "꿈 기록과 타로 상징을 함께 풀어내요",
  },
};

export function getCatReaderHomeCopy(readerId: CatReaderId): CatReaderHomeCopy {
  return catReaderHomeCopy[readerId];
}
