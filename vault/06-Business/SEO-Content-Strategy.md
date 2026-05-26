---
title: SEO Content Strategy
tags:
  - business
  - seo
  - acquisition
  - content
  - mvp
source: conversation
---

# SEO Content Strategy

> SEO의 1차 목표는 브랜드 검색이 아니라 상징별 꿈해몽 검색어를 꿈 영수증 루프로 연결하는 것이다.

---

## 핵심 방향

마냥 꿈해몽의 초기 SEO는 블로그보다 **꿈해몽 백과**를 공개 검색 자산으로 키우는 것이 맞다.

사용자는 처음부터 `마냥 꿈해몽`을 검색하지 않는다. 먼저 `고양이 꿈 해몽`, `문 꿈 해몽`, `신발 꿈 해몽`처럼 꿈속에 나온 상징을 검색한다. 따라서 MVP SEO의 진입점은 `/encyclopedia/[slug]` 상징 페이지이고, 전환점은 `오늘의 꿈 영수증 받기` CTA다.

## 인덱싱 정책

검색에 노출할 페이지:

- `/`
- `/encyclopedia`
- `/encyclopedia/[slug]`
- 향후 `/dream-meaning/[scenario]`

검색에서 제외할 페이지:

- `/write`
- `/result`
- `/archive`
- `/morning`
- `/seed`
- 개인 기록, 개인 리포트, 결제 이후 상세 해몽 페이지

이 기준은 단순하다. **공개 지식 페이지는 index, 개인 행동/결과 페이지는 noindex**로 둔다.

## 페이지 구조

### `/encyclopedia`

백과 허브 페이지다.

역할:

- 많이 찾는 꿈해몽 상징을 보여준다.
- 카테고리별 탐색을 제공한다.
- 개별 상징 페이지로 내부 링크를 보낸다.
- 꿈쓰기 CTA로 제품 사용을 연결한다.

### `/encyclopedia/[slug]`

상징별 SEO 랜딩 페이지다.

역할:

- 특정 상징 검색어를 받는다.
- 기본 해석을 공개한다.
- 사용자의 꿈 맥락은 직접 입력해야 더 잘 읽을 수 있음을 알려준다.
- `꿈 영수증` 생성으로 전환시킨다.

### 향후 `/dream-meaning/[scenario]`

상황형 롱테일 페이지다.

예시:

- `고양이가 다가오는 꿈`
- `신발을 잃어버리는 꿈`
- `엘리베이터가 멈추는 꿈`
- `학교에서 시험 보는 꿈`

MVP에서는 상징 페이지부터 먼저 구현하고, 검색 데이터가 쌓인 뒤 상황형 페이지로 확장한다.

## 초기 키워드 맵

현재 backend seed를 기준으로 1차 SEO 타깃은 다음 10개다.

| 우선순위 | 상징 | 대표 검색어 | 페이지 |
| --- | --- | --- | --- |
| 1 | 고양이 | 고양이 꿈 해몽 | `/encyclopedia/cat` |
| 2 | 신발 | 신발 꿈 해몽 | `/encyclopedia/shoes` |
| 3 | 물 | 물 꿈 해몽 | `/encyclopedia/water` |
| 4 | 학교 | 학교 꿈 해몽 | `/encyclopedia/school` |
| 5 | 문 | 문 꿈 해몽 | `/encyclopedia/door` |
| 6 | 열쇠 | 열쇠 꿈 해몽 | `/encyclopedia/key` |
| 7 | 복도 | 복도 꿈 해몽 | `/encyclopedia/corridor` |
| 8 | 엘리베이터 | 엘리베이터 꿈 해몽 | `/encyclopedia/elevator` |
| 9 | 비 | 비 꿈 해몽 | `/encyclopedia/rain` |
| 10 | 계단 | 계단 꿈 해몽 | `/encyclopedia/stairs` |

2차 확장 후보:

- 집, 병원, 바다, 방, 지하철, 공항
- 가방, 거울, 책, 시계, 전화, 창문
- 잃어버리는 꿈, 찾는 꿈, 뛰는 꿈, 기다리는 꿈
- 불, 바람, 어둠, 안개, 별
- 개, 새, 물고기, 모르는 사람, 어린아이

## 상징 페이지 템플릿

상징 페이지는 다음 구조를 따른다.

```text
H1: {상징} 꿈 해몽
도입: {상징} 꿈은 어떤 마음의 흐름과 연결될 수 있는지 설명
핵심 의미: coreMeanings
좋게 읽을 수 있는 흐름: positiveReadings
조심해서 볼 흐름: negativeReadings
꿈 맥락 질문: contextQuestions
관련 상징: relatedSymbols 내부 링크
고양이 힌트: catInterpretationHint
CTA: 내 꿈에도 {상징}이 나왔나요? 오늘의 꿈 영수증 받기
주의 문구: 오락과 자기 성찰을 위한 해석이며, 의학적/법적/심리 진단이 아님
```

표현 원칙:

- `길몽`, `흉몽`으로 단정하지 않는다.
- 불안을 자극해 결제를 유도하지 않는다.
- 해석을 확정하지 않고 `가능성`, `흐름`, `맥락`으로 말한다.
- 무료 공개 페이지에서도 충분한 가치를 준다.

## 메타데이터 템플릿

상징 페이지 title:

```text
{상징} 꿈 해몽 | 마냥 꿈해몽
```

상징 페이지 description:

```text
{상징} 꿈은 {핵심 의미 2~3개}와 연결되어 읽을 수 있어요. 고양이 해몽사가 꿈속 상징을 꿈 영수증으로 정리해드립니다.
```

공통 요구사항:

- 각 페이지는 고유 title과 description을 가진다.
- canonical은 자기 자신을 가리킨다.
- Open Graph title/description도 같은 의도로 맞춘다.
- `metadataBase`를 설정해 배포 도메인 canonical을 안정화한다.

## 기술 SEO 체크리스트

MVP에서 바로 해야 하는 것:

- `/encyclopedia/[slug]`에 `generateStaticParams` 추가
- `/encyclopedia/[slug]`에 `generateMetadata` 추가
- 없는 slug는 `notFound()` 처리
- `app/sitemap.ts` 생성
- `app/robots.ts` 생성
- 개인/행동 페이지에 `robots: { index: false, follow: false }` 적용
- 백과 상세 페이지를 hardcoded 복도 페이지에서 entry 기반 렌더링으로 변경

구조화 데이터는 MVP 후순위다. 단, 추가한다면 실제 화면에 노출되는 내용만 `Article` 또는 `BreadcrumbList`로 넣고, 화면에 없는 FAQ를 JSON-LD로만 넣지 않는다.

## 전환 설계

SEO 페이지의 목적은 트래픽만 받는 것이 아니라 첫 꿈 영수증 경험으로 연결하는 것이다.

상징 페이지 CTA:

```text
내 꿈에도 {상징}이 나왔나요?
오늘의 꿈 영수증 받기
```

허브 페이지 CTA:

```text
꿈속 상징을 직접 넣고 영수증으로 받아보기
```

전환 흐름:

```text
검색 유입
→ 상징 페이지
→ 무료 공개 해석
→ 꿈쓰기
→ 꿈 영수증
→ 로그인 CTA 또는 상세 해몽 관심 CTA
```

## 측정 지표

| 이벤트 | 의미 |
| --- | --- |
| `seo_symbol_page_viewed` | 상징 페이지가 검색 진입점으로 작동하는가 |
| `seo_receipt_cta_clicked` | 공개 해석에서 꿈쓰기 전환이 있는가 |
| `seo_guest_dream_started` | SEO 유저가 실제 꿈 입력을 시작하는가 |
| `seo_guest_reading_completed` | SEO 유저가 첫 영수증까지 도달하는가 |
| `seo_guest_login_cta_clicked` | 첫 영수증 이후 로그인 의향이 있는가 |
| `detailed_reading_interest_clicked` | 상세 해몽 유료화 의향이 있는가 |

## MVP 범위

MVP SEO에서 할 것:

- 백과 허브와 상징 상세 페이지를 indexable하게 만든다.
- backend seed 전체를 기반으로 sitemap을 만든다.
- 상징 페이지에서 꿈쓰기 CTA를 제공한다.
- private/app flow는 noindex 처리한다.

MVP SEO에서 하지 않을 것:

- 대량 블로그 운영
- 자동 생성 상황형 페이지 대량 배포
- 광고성 키워드 페이지
- 의학적/심리 진단처럼 보이는 콘텐츠
- 클릭을 위해 불안을 과장하는 카피

## Related

- [[Access-Plan-Strategy]]
- [[MVP-Currency-Strategy]]
- [[Monetization-Roadmap]]
- [[KPI-Gates]]

## See Also

- [[Dream-Encyclopedia]] 백과 기능 기준 (03-Features)
- [[Encyclopedia-Seed-Data]] 상징 seed 기준 (05-Content)
