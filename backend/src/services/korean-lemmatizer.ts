// 한국어 형태소 분석 '창구'. 지금은 비어 있고(폴백), 나중에 Kiwi 분석 서비스 클라이언트를
// 이 인터페이스의 구현체로 꽂는다. 매처는 이 창구가 돌려준 어간(lemma)을 토큰에 합쳐 쓴다.
export interface KoreanLemmatizer {
  /**
   * 문장에서 정규화된 어간/형태소 목록을 돌려준다.
   * 예: "올라갔어" -> ["올라가다", "올라가"] 처럼 매칭에 쓸 표면형/어간.
   * 분석에 실패하면 빈 배열을 돌려주거나 throw 해도 된다(호출부가 폴백 처리).
   */
  lemmatize(text: string): Promise<string[]>;
}

/**
 * 창구가 없거나 분석이 실패해도 앱이 깨지지 않도록 안전하게 호출한다.
 * 실패 시 빈 배열 -> 매처는 기존(어휘) 방식 그대로 동작.
 */
export async function safeLemmatize(
  lemmatizer: KoreanLemmatizer | undefined,
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
