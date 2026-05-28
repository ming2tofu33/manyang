---
title: Checklists & DoD
tags:
  - implementation
  - dod
---

# Checklists & DoD

> 완료는 “보인다”가 아니라 “검증됐다”로 판단한다.

---

## 공통 DoD

- [ ] 관련 타입이 명시되어 있다.
- [ ] 에러/빈 상태가 있다.
- [ ] 모바일 viewport에서 텍스트가 겹치지 않는다.
- [ ] 저장/조회 흐름이 검증됐다.
- [ ] 안전 표현 금지어가 결과에 없다.

## UI DoD

- [ ] 홈에서 핵심 CTA가 명확하다.
- [ ] 하단 내비게이션이 현재 위치를 표시한다.
- [ ] 카드/영수증 텍스트가 컨테이너를 넘지 않는다.
- [ ] 로딩 상태가 3단계 이상으로 표현된다.
- [ ] 스크린샷으로 desktop/mobile 확인했다.

## Frontend Optimization DoD

- [ ] `npm test` 통과
- [ ] `npm run lint` 통과
- [ ] `npm run build` 통과
- [ ] `375x667`, `390x844`, `430x932` 모바일 스크린샷 확인
- [ ] 가로 스크롤 없음
- [ ] Fixed 화면 내부 세로 스크롤 없음
- [ ] LCP 후보 이미지가 의도한 에셋인지 확인
- [ ] 큰 PNG가 runtime path에 불필요하게 남지 않음
- [ ] `prefers-reduced-motion` 회귀 없음
- [ ] Vercel production과 local production 차이 확인

## API DoD

- [ ] 요청/응답 타입이 있다.
- [ ] 실패 응답이 있다.
- [ ] LLM 실패 fallback이 있다.
- [ ] 클라이언트에 API key가 노출되지 않는다.
- [ ] 샘플 요청으로 성공 응답을 확인했다.

## AI DoD

- [ ] JSON schema를 만족한다.
- [ ] 백과사전 참고 항목이 결과에 반영된다.
- [ ] 진단/예언/질병 단정 표현이 없다.
- [ ] 작은 처방이 구체적이고 실행 가능하다.

## Related

- [[Implementation-Plan]]
- [[Phase-Flow]]
- [[Frontend-Optimization-Guide]]
- [[plans/ACTIVE_SPRINT]]

## See Also

- [[Safety-&-Compliance]] — 안전 표현 기준 (07-Operations)
- [[Visual-Direction]] — UI 품질 기준 (08-Design)
