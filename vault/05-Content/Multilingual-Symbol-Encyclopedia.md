---
title: Multilingual Symbol Encyclopedia
tags:
  - content
  - encyclopedia
  - multilingual
status: accepted
---

# Multilingual Symbol Encyclopedia

> 마냥 백과사전은 한국어 꿈해몽 사전이 아니라 다국어 상징 온톨로지다. 공통 개념은 하나로 두고, 언어별 표현과 문화적 가중치만 분리한다.

---

## Storage Contract

실제 저장 스키마와 원본 위치는 [[Symbol-Encyclopedia-Schema]]를 따른다. 이 문서는 백과사전의 편집 원칙과 다국어 설계 방향을 설명하고, 구현 단계의 필드명과 YAML 형태는 schema 문서가 canonical source다.

## 왜 자체 백과사전인가

외부 꿈해몽 사이트나 모델 답변을 그대로 쓰면 다음 문제가 생긴다.

- 저작권 위험
- 흉몽/길몽/징조 중심의 단정 표현
- 금전, 임신, 질병, 불행 예언으로 흐를 가능성
- 마냥의 고양이 해몽사 톤과 불일치
- 글로벌 확장 시 문화권별 충돌

따라서 백과사전은 "정답 사전"이 아니라 **LLM이 안전하고 구체적으로 해석할 재료 사전**이어야 한다.

## 작성 근거

백과사전의 근거는 전통 해몽 하나에 기대지 않는다.

| 근거 | 설명 |
| --- | --- |
| 일상 은유 | 사람들이 이미 쓰는 표현. 예: 문턱, 마음의 짐, 길을 잃다 |
| 꿈 장면의 기능 | 열었는지, 잠겼는지, 도망쳤는지, 기다렸는지 |
| 한국어/영어 생활 맥락 | 학교, 지하철, 시험, 공항, workplace 등 |
| 문화권 metadata | 사용자에게 기본 노출하지 않는 내부 가중치 |
| 안전 표현 정책 | 예언, 진단, 공포 유발을 막는 표현 기준 |
| 사용자 데이터 | 나중에 미매칭 로그와 반복 상징으로 확장 |

## 데이터 모델

```ts
type SymbolEntry = {
  id: string;
  category:
    | "place"
    | "object"
    | "action"
    | "nature"
    | "animal"
    | "person"
    | "emotion"
    | "quantity"
    | "time";
  universalMeanings: string[];
  tensionAxis: string[];
  relatedIds: string[];
  safetyLevel: "safe" | "sensitive";
  sourceBasis: string[];
  cultureNotes?: Record<string, CultureNote>;
  locales: {
    ko: LocalizedSymbolEntry;
    en: LocalizedSymbolEntry;
  };
};

type CultureNote = {
  weight: number;
  notes: string[];
  safeTransform: string[];
  exposeByDefault: false;
};

type LocalizedSymbolEntry = {
  label: string;
  aliases: string[];
  searchText: string;
  coreMeanings: string[];
  lightReadings: string[];
  shadowReadings: string[];
  sceneModifiers: Record<string, string>;
  contextQuestions: string[];
  metaphorHooks: string[];
  cardTitleSeeds: string[];
  smallPrescriptions: string[];
  safeReading: string;
  catHint?: string;
  avoidExpressions: string[];
};
```

## 언어별 번역이 아니라 공통 개념 + 현지화

`door`라는 개념은 하나다. 한국어와 영어는 label, aliases, 설명, metaphor hook만 다르게 둔다.

```ts
{
  id: "door",
  category: "object",
  universalMeanings: ["boundary", "choice", "transition", "opportunity"],
  tensionAxis: ["wanting to enter", "hesitating at the edge"],
  locales: {
    ko: {
      label: "문",
      aliases: ["문", "대문", "입구", "문턱", "문틈"],
      coreMeanings: ["경계", "선택", "전환", "기회"],
      safeReading: "문은 다음 장면으로 넘어가기 전의 경계로 읽을 수 있어요."
    },
    en: {
      label: "Door",
      aliases: ["door", "gate", "doorway", "threshold", "entrance"],
      coreMeanings: ["boundary", "choice", "transition", "opportunity"],
      safeReading: "A door can point to a threshold between where you are and what comes next."
    }
  }
}
```

이 구조를 쓰면 일본어, 스페인어 등으로 확장할 때도 `id`와 universal meaning은 유지하고 locale만 추가하면 된다.

## 문화권 정보는 기본 노출하지 않는다

문화권 메모는 내부 검색과 표현 변환에 쓰되, 기본 결과 화면에는 보이지 않는 것이 좋다.

사용자-facing에서 매번 "한국어권 전통 해몽에서는..."을 넣으면 다음 문제가 생긴다.

- 자료 설명처럼 느껴진다.
- 전통이라는 말이 권위처럼 작동해 단정적으로 들린다.
- 꿈의 개인적 장면보다 문화 설명이 앞선다.

따라서 기본 정책은 다음과 같다.

```text
내부:
cultureScope, localeWeight, cultureNotes, safeTransform 보관

RAG:
사용자 언어/지역에 맞춰 검색 가중치 조정

최종 해몽:
문화권 설명은 숨기고 자연스러운 상징 문장으로 변환

예외:
사용자가 전통 해몽을 직접 요청하거나, 백과 상세/프리미엄 관점 섹션에서만 노출
```

예:

```ts
{
  id: "large_snake",
  cultureNotes: {
    ko: {
      weight: 0.7,
      notes: ["구렁이는 터, 생명력, 재물, 태몽과 연결되어 읽히는 경우가 있음"],
      safeTransform: ["커진 생명력", "내 영역 안에서 자라는 힘", "무시하기 어려운 변화감"],
      exposeByDefault: false
    }
  }
}
```

사용자에게는 이렇게 변환한다.

```text
큰 구렁이는 무시하기 어려울 만큼 커진 감각이나 힘으로 읽을 수 있어요. 우리 땅에 있었다는 점까지 보면, 이 꿈은 바깥일보다 내 생활의 기반 안에서 무언가가 조용히 커지고 있는 장면에 가까워 보여요.
```

## Scene Modifier가 재미를 만든다

`뱀 = 변화`, `문 = 선택`만 있으면 결과가 단어 연결처럼 보인다. 백과 항목에는 장면별 변형이 있어야 한다.

```ts
sceneModifiers: {
  many: "여러 갈래의 신호나 감각이 한꺼번에 올라오는 장면",
  large: "무시하기 어려울 만큼 커진 힘이나 변화감",
  inOwnedLand: "내 기반이나 가족/생활 영역 안에서 생기는 움직임",
  threatening: "경계심이나 압도감을 더 강하게 만드는 장면",
  calm: "낯설지만 받아들일 수 있는 에너지로 읽히는 장면"
}
```

이 필드가 있어야 2차 LLM이 단어 뜻풀이가 아니라 장면 조합 해석을 한다.

## 초기 글로벌 공통 항목

MVP 글로벌 공통 40개 후보:

| Category | Symbols |
| --- | --- |
| place | home, school, workplace, hospital, hallway, room, airport, train station |
| object | door, key, bag, shoes, phone, mirror, clock, book, window |
| action | searching, losing, running away, waiting, falling, flying, opening, hiding |
| nature | water, rain, sea, fire, wind, darkness, fog, stars |
| being | cat, dog, bird, fish, stranger, child, family, crowd |

한국어 생활형 확장 후보:

- 지하철, 막차, 시험, 회사, 엘리베이터, 아파트, 편의점
- 조상, 가족 모임, 병원 대기, 학교 복도, 휴대폰 연락

영어 생활형 확장 후보:

- workplace, office, commute, airport security, missed train, locker, classroom
- stranger, crowd, phone call, unread message, appointment

## 작성 절차

```text
1. 상징 개념 ID를 정한다.
2. universalMeanings와 tensionAxis를 쓴다.
3. ko/en label과 aliases를 넣는다.
4. sceneModifiers를 최소 3개 이상 작성한다.
5. contextQuestions를 만든다.
6. light/shadow reading을 쓴다.
7. avoidExpressions를 명시한다.
8. cardTitleSeeds와 smallPrescriptions를 추가한다.
9. sourceBasis와 cultureNotes를 분리한다.
10. 테스트 꿈 3개에 적용해 본다.
```

## 예시: Snake

```ts
{
  id: "snake",
  category: "animal",
  universalMeanings: ["instinct", "hidden movement", "change", "life force", "alertness"],
  tensionAxis: ["fascination", "wariness"],
  safetyLevel: "sensitive",
  sourceBasis: ["embodied metaphor", "animal symbolism", "scene function", "product editorial rule"],
  locales: {
    ko: {
      label: "뱀",
      aliases: ["뱀", "구렁이", "큰 뱀", "독사", "蛇"],
      coreMeanings: ["본능", "경계", "숨은 움직임", "변화", "생명력"],
      lightReadings: ["조용히 커지는 가능성", "감각이 예민하게 깨어나는 흐름"],
      shadowReadings: ["압도감", "어디서 움직일지 모르는 긴장"],
      sceneModifiers: {
        many: "여러 갈래의 신호나 감각이 한꺼번에 올라오는 장면",
        large: "무시하기 어려울 만큼 커진 힘이나 변화감",
        inOwnedLand: "내 기반이나 가족/생활 영역 안에서 생기는 움직임",
        attacking: "경계심과 방어 반응이 강해지는 장면"
      },
      contextQuestions: ["뱀이 위협했나요, 그냥 있었나요?", "뱀이 있던 곳은 내 공간이었나요, 낯선 곳이었나요?"],
      metaphorHooks: ["조용히 움직이는 힘", "땅 아래에서 올라온 감각", "아직 이름 붙이지 못한 생명력"],
      cardTitleSeeds: ["땅 아래 깨어난 구렁이", "수십 개의 숨은 움직임"],
      smallPrescriptions: ["오늘은 내가 지켜야 한다고 느끼는 영역 하나를 적어보세요."],
      safeReading: "뱀은 불길함으로 단정하기보다, 본능적 감각이나 조용히 커지는 움직임으로 읽을 수 있어요.",
      avoidExpressions: ["재물운이 반드시 오른다", "태몽이다", "위험한 일이 생긴다"]
    }
  }
}
```

## Related

- [[Symbol-Encyclopedia-Schema]]
- [[Encyclopedia-Seed-Data]]
- [[RAG-Strategy-for-Dream-Reading]]
- [[Dream-Reading-LLM-Logic]]

## See Also

- [[Cat-Reader-Voice]] — 사용자-facing 문체
- [[Safety-&-Compliance]] — 금지 표현과 고지
