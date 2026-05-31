// 형태소 분석 '창구'(언어 무관). 구현체는 locale별로 다르다:
//   ko -> Kiwi HTTP 서비스(HttpKoreanLemmatizer), en -> 인-프로세스 영어(EnglishLemmatizer).
// 매처는 이 창구가 돌려준 어간(lemma)을 토큰에 합쳐 쓴다. route가 요청 locale로 구현체를 고른다.
export interface Lemmatizer {
  /**
   * 문장에서 정규화된 어간 목록을 돌려준다.
   * 예: "올라갔어" -> ["올라가"], "I flew" -> ["fly"]. 매칭에 쓸 어간.
   * 분석에 실패하면 빈 배열을 돌려주거나 throw 해도 된다(호출부가 폴백 처리).
   */
  lemmatize(text: string): Promise<string[]>;
}

/** @deprecated `Lemmatizer`를 쓰세요. 하위호환 별칭. */
export type KoreanLemmatizer = Lemmatizer;

/**
 * 창구가 없거나 분석이 실패해도 앱이 깨지지 않도록 안전하게 호출한다.
 * 실패 시 빈 배열 -> 매처는 기존(어휘) 방식 그대로 동작.
 */
export async function safeLemmatize(
  lemmatizer: Lemmatizer | undefined,
  text: string,
): Promise<string[]> {
  if (!lemmatizer) {
    return [];
  }

  try {
    const lemmas = await lemmatizer.lemmatize(text);
    return Array.isArray(lemmas) ? lemmas.filter((lemma) => typeof lemma === "string" && lemma.trim().length > 0) : [];
  } catch {
    return [];
  }
}
