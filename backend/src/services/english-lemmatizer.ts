import winkLemmatizer from "wink-lemmatizer";

import type { Lemmatizer } from "./korean-lemmatizer";

// 영어는 굴절이 가벼워 모델 없는 인-프로세스 lemmatizer로 충분(서버 불필요).
// POS 태깅 없이 명사·동사 표제어를 모두 만들어 합집합으로 둔다 — 매칭 보조용이라
// 엉뚱한 표제어는 어차피 어떤 심볼 alias와도 안 맞으니 안전하다.
// 예: "flew" -> {flew, fly}, "dogs" -> {dog}, "running" -> {running, run}.

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z]+/g) ?? []).filter((word) => word.length >= 2);
}

export class EnglishLemmatizer implements Lemmatizer {
  async lemmatize(text: string): Promise<string[]> {
    const stems = new Set<string>();
    for (const word of tokenize(text)) {
      stems.add(word);
      stems.add(winkLemmatizer.noun(word));
      stems.add(winkLemmatizer.verb(word));
    }
    return [...stems].filter((stem) => stem.length >= 2);
  }
}

export function createEnglishLemmatizer(): Lemmatizer {
  return new EnglishLemmatizer();
}
