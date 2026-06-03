# 꿈해몽·타로 콘텐츠 작성 방식 조사 (Reference)

작성일: 2026-06-02

이 문서는 국내·해외의 꿈해몽 사전과 타로 카드 의미 사이트가 콘텐츠를 **어떻게** 쓰는지 조사한 레퍼런스다. Manyang 꿈 상징 백과사전(`backend/src/data/symbol-encyclopedia.ts`)의 한국어 표현 품질을 개선하기 위한 근거 자료이며, 후속 문서인 `docs/dream-encyclopedia-style-guide.md`의 토대가 된다.

조사 방법: 실제 사이트 본문을 직접 fetch해 원문 인용 기준으로 정리했다. 일부 사이트(lovtaro, 나무위키, 복지로114 본문)는 403/404로 본문 확보에 실패해 검색 스니펫으로만 보강했다.

---

## 1. 한국 사이트

### 1.1 꿈해몽 (청월당사주, 니니콩, 시리우스팟, kitsch.raiself, 네이트운세)

**콘텐츠 구조**

- 표제어(예: "뱀") 하나 아래에 **"~하는 꿈" 형식의 세부 항목을 대량 나열**하는 것이 표준이다.
- 거의 모든 사이트가 동일 축을 쓴다.
  - 도입부: 상징의 일반 의미("뱀 = 지혜·유혹·변화·재물") + "길몽일까 흉몽일까?" 식 문제 제기
  - 상황별 풀이: 만지는/물리는/잡는/쫓기는/죽이는 꿈 (핵심 축)
  - 색깔별 풀이: 흰뱀·황금뱀·검은뱀·붉은뱀 (표 형식이 잦음)
  - 재물운·태몽 별도 강조 (한국 특유)
  - Q&A / 요약 (블로그형에서 SEO 목적)
- 항목 수가 곧 콘텐츠 양이다. "뱀 50가지", "물 108가지(길몽 60 + 흉몽 48)"처럼 **숫자를 제목에 박는 나열형 SEO**가 노골적이다. 길몽/흉몽을 색상 코드(초록/빨강)로 시각 구분하기도 한다.

**문체와 어조**

- 격식체(~된다 / ~합니다)가 기본이나 **단정적·선언적·운명론적**이다. 조심스러움은 거의 없다.
- 미래를 확정 예언하듯 서술한다. "반드시 승진한다", "~할 징조입니다".
- 따뜻함보다 **사무적·점사(占辭)적**이다. 심리 분석은 얕고 전통 길흉 판정이 중심이다.
- 길흉을 명확한 이분법(길몽/흉몽)으로 단정하되, "꿈 전체 상황에 따라 다르다"는 면피 문장을 덧붙이기도 한다.

**분량**: 항목 1개당 30~80자, 1~2문장으로 매우 짧다. 표제어 전체로는 항목 수에 따라 길이가 결정된다.

**원문 예시**

> "뱀은 힘과 권력, 재물의 상징이므로 반드시 승진하거나 높은 자리에 오르게 된다."
> — 청월당사주, https://cheongwoldang.com/p/dream/c/41

> "복권 당첨 등 생각지도 못한 횡재가 들어와 부자가 될 것이다."
> — 청월당사주, https://cheongwoldang.com/p/dream/c/41

> "특히 흰 뱀이나 황금색 뱀은 영특한 자녀의 탄생을 예고한다고 여겨집니다."
> — 니니콩, https://ninikong.com/뱀-꿈해몽-총정리/

> "집 안에 물이 많이 들어오는 꿈 - 대표적인 길몽. 큰 재물이나 돈이 들어온다." / "물을 실수로 엎지르는 꿈 - 재물의 손실이 생긴다."
> — 시리우스팟, https://siriuspot.com/물-꿈해몽/

**한국 특유의 특징**

- 재물운·횡재·복권 당첨, 태몽(자녀 예고)을 거의 모든 표제어에서 강조한다. (뱀→태몽, 물→재물이 전형)
- 전통 점사식 길흉 판정이 서양식 심리 해석을 압도한다. "용이 되어 승천=출세", "귀인" 같은 고전 어휘를 쓴다.
- 숫자 나열형 SEO가 매우 보편적이다.

### 1.2 타로 (ezracard, 브런치, 운세 포털)

타로는 두 가지 스타일이 공존한다.

**스타일 1 — 사전형 (78장 일괄 정리)**

- 구조: 카드명 → 정방향(Upright) 키워드 3~4개 + 짧은 설명 → 역방향(Reversed) 키워드 + 설명. 일부는 연애·금전·직업 분야별 칸을 추가한다.
- 문체: 간결·중립·교육형. 키워드를 콜론 뒤 쉼표로 압축한다. 개인차를 존중하는 면책 문구를 포함한다(꿈해몽의 단정조와 대조).
- 분량: 카드당 2~3줄로 매우 짧다.

> 바보: "똑바로: 순수함, 새로운 시작, 자유로운 영혼 / 역방향: 무모함, 이용당함"
> — ezracard, https://ezracard.com/ko/tarot-card-meanings-list/

> 13번 죽음: "변화, 끝과 새로운 시작, 전환점(정) / 변화 거부, 정체, 미완성(역)"
> — 브런치 @jlee5059, https://brunch.co.kr/@jlee5059/1642

**스타일 2 — 에세이형 레슨 (카드 1장 심층)**

- 구조: 카드 그림 시각 묘사(옷색·자세·소지품) → 상징물 해석(검·천칭) → 키워드 → 일상 리딩(운세/연애운/금전운/비즈니스운) → 철학적·도덕적 메시지.
- 문체: 교육형 에세이 + 구어체 혼합. 질문으로 독자 참여를 유도하고 따뜻하며 조언적이다.
- 분량: 카드 1장에 약 1,800자.

> "양손에 저울과 검을 손에 든 여인은 세상 만물에 평등하면서도 엄격한 잣대를 요구하는 재판관 같은 존재입니다."
> — 브런치 정의 카드 레슨, https://brunch.co.kr/@01c796d7826e4f8/66

**타로의 한국 특유 특징**

- 정방향/역방향 이원 키워드 표기가 절대 표준이다.
- 꿈해몽과 달리 길흉 단정을 피하고 면책 문구로 완충한다. 상대적으로 조심스러운 톤이다.
- 실전에서는 연애운·금전운·직업운 3분야로 쪼개 적용하고, 카드 조합 해석 콘텐츠가 인기다.

---

## 2. 해외 사이트

### 2.1 Dream Dictionary (DreamMoods, AuntyFlo, DreamDictionary.org, Dream Bible)

**콘텐츠 구조** — 두 학파가 뚜렷하다.

- (a) 테마 에세이형 (DreamMoods, AuntyFlo, DreamDictionary.org): 상징 하나당 긴 페이지를 facet/시나리오별 소제목으로 분할한다.
  - DreamMoods 뱀: 약 800~900단어, 7개 테마 섹션(공포 / 숨은 위협 / 잠재의식 / 성적 유혹 / 변환 / 치유 / 창의성) + 종합 결론.
  - DreamDictionary.org 뱀: 약 2,800단어. 백과사전 + Q&A 하이브리드. "Snake Bite Location"(신체 부위별), "Colors of Snake Dreams", "Snakes in the Bible/Mythology".
  - AuntyFlo 물: 약 6,000단어. 물의 종류(파도/홍수/익사)·색(검정/파랑/초록)별 소제목 + "Is this dream good or bad?" 섹션 + 마무리 "Positive changes" 체크리스트.
- (b) 플랫 사전형 (Dream Bible): 짧은 "To dream of X represents…" 항목을 쌓고, 끝에 익명화된 실제 꿈 사례를 붙인다.
- 모든 사이트에 반복되는 하위 축: **색·행동(상징 vs. 꿈꾼 이의 행동)·장소·물의 맑음(맑음 vs. 탁함)·길흉 판정**.

**문체와 어조**

- **헤지(hedge)가 많다.** "may represent", "can signify". 하나의 단정 대신 여러 가능성을 병렬 제시하는 것이 장르 기본값이다.
- **2인칭 조언체**가 표준이다. "your dream", "you are ready to release…".
- AuntyFlo는 예외적으로 1인칭 영적 권위 톤이다. "In all my spiritual work, I relate water to emotional stability." 심리학이 아니라 본인의 직관/경험으로 신뢰를 쌓는다.
- 길흉을 양방향으로 열어둔다. 뱀은 "긍정·부정 둘 다 가능한 복잡한 상징", 물은 "맑으면 긍정, 탁하면 부정".
- 면책 문구가 등장한다. (AuntyFlo: "for Entertainment Purposes ONLY")

**분량**: 폭이 넓다. Dream Bible은 변형당 1문장, DreamMoods ~800~900단어, DreamDictionary.org ~2,800, AuntyFlo ~6,000. SEO 인센티브가 에세이형을 길게 만든다.

**원문 예시**

> "Snakes are complicated symbols because they can have both positive and negative meanings… With the ability to shed their skins, snakes represent transformation."
> — DreamMoods, http://www.dreammoods.com/commondreams/snake-dreams.html

> "In all my spiritual work, I relate water to emotional stability. The more calm, and clear the water in your dream the more you are able to deal with the challenges of life."
> — AuntyFlo, https://www.auntyflo.com/dream-dictionary/water

> "To dream of a poisonous snake represents feelings about corruption or contamination… To dream of riding on the back of a snake represents feelings about something dangerous you are using to scare people away from you."
> — Dream Bible, https://www.dreambible.com/search.php?q=Snakes

**특징**

- 융 심리학 프레임(잠재의식·그림자·허물벗기=낡은 패턴 놓아주기).
- 성경/신화 교차 참조를 독립 섹션으로 둔다.
- "What does it mean when…" SEO Q&A + 시나리오 나열(물린 위치, 색).
- 실제 꿈 사례로 추상 상징을 현실 상황에 착지시킨다(Dream Bible).
- 명시적 길흉 판정 섹션을 둔다.

### 2.2 Tarot (BiddyTarot, Labyrinthos, Tarot.com)

**콘텐츠 구조** — 카드마다 같은 골격이 반복되는, 꿈 콘텐츠보다 훨씬 템플릿화된 형식이다.

- BiddyTarot(핵심 의미 페이지): 키워드(정/역) → 설명 → Upright → Reversed. 약 800~900단어. Love/Career/Finances는 별도 가이드 페이지에 둔다.
- Labyrinthos: 가장 풍부한 템플릿. 키워드 → 설명 → Upright(Meaning/Love/Career/Finances/as Feelings/as Actions) → 같은 6분할 Reversed → "Cheat Sheet". 약 3,500단어.
- Tarot.com: Upright → Reversed → Advice → Love → Career → Yes/No. 약 800~900단어. 가장 시적이고 현대적인 톤.
- 타로 고유 구조 장치: **Upright vs. Reversed가 master 축**, 그 아래 맥락 컬럼(Love/Career/Finances/Health) + 타로 전용 포지션("as Feelings", "as Actions", "Advice", "Yes/No").

**문체와 어조**

- **철저히 2인칭·현재형**이다. 모든 사이트가 "you"에게 직접 말한다.
- **주체성(agency) 프레임**이 장르 시그니처다. 최악의 카드(Tower)조차 성장 기회로 리프레이밍한다.
- 따뜻하되 진지하다. 고통을 인정한 뒤 희망으로 전환한다.
- 꿈 사이트보다 단정적이다. "may"보다 "you are"가 많다.

**원문 예시**

> "When The Tower card appears in a Tarot reading, expect the unexpected – massive change, upheaval, destruction and chaos. It may be a divorce, death of a loved one, financial failure, health problems, natural disaster, job loss or any event that shakes you to your core…"
> — BiddyTarot (Tower), https://biddytarot.com/tarot-card-meanings/major-arcana/tower/

> "you are at the outset of your journey, standing at the cliff's edge, and about to take your first step into the unknown… You don't need to wait for someone to give you the green light…"
> — BiddyTarot (The Fool), https://biddytarot.com/tarot-card-meanings/major-arcana/fool/

> "When The Tower shows up upright, it heralds a major shake-up. Think lightning bolt to the ego, unexpected news, or a foundational truth that rocks your world." … (Advice) "Let it fall. Let it burn. Let what's false collapse so what's true can finally breathe."
> — Tarot.com (Tower), https://www.tarot.com/tarot/cards/the-tower

**특징**

- Upright/Reversed 이분 구조가 조직 엔진이다.
- 맥락 컬럼(Love/Career/Finances/Health) — 독자가 질문 영역을 갖고 오므로 의미를 생활 영역별로 자른다.
- "Advice", "Yes/No" 포지션 — 행동·결정 지향.
- 나쁜 카드 리프레이밍 관습: 파괴→해방으로 매번 전환.
- 해석 전에 카드 이미지(번개, 떨어지는 사람)에 먼저 근거를 두고 읽는다. 상징을 시각적으로 정당화한 뒤 해석한다.

---

## 3. 핵심 대비표

| 항목 | 한국 꿈해몽 | 해외 꿈사전 | 타로(공통) |
|---|---|---|---|
| 어조 | 단정·운명론·점사식 | 헤지 과다·다의적 | 2인칭·현재형·주체성 |
| 길흉 | 명시적 길/흉 라벨 | 양방향 개방 | 나쁜 카드도 기회로 전환 |
| 프레임 | 재물·태몽·전통 점사 | 융 심리·신화 | 행위·결정 중심 |
| 구조 | "~하는 꿈" 대량 나열 | facet별 에세이 / 플랫 사전 | 정·역 + 맥락 컬럼 |
| 분량 | 항목당 1~2문장 | 800~6,000단어 | 800~3,500단어 |
| 신뢰 장치 | 전통 권위·복권/태몽 | 심리학·실제 꿈 사례 | 면책·주체성·이미지 근거 |

---

## 4. 문장 수준(에디토리얼 보이스) 비교 — 본 프로젝트에 가장 중요한 부분

실제 문장을 나란히 읽으면 품질 격차의 원인이 보인다.

1. **헤지 vs. 단정이 가장 큰 레버.**
   - 꿈 사이트는 헤지를 과하게 쌓는다("may", "can", "often"). 모달을 겹치면 회피적으로 읽히고 정서적 임팩트가 사라진다.
   - 타로 사이트는 단정한다. "you are at the outset", "it heralds a major shake-up". 현재형 단정이 카피를 살아있고 개인적으로 만든다.
   - 시사점: 핵심 해석은 현재형으로 단정하고, 헤지는 부차적 가능성에만 쓴다.

2. **추상 명사보다 구체적 이미지.**
   - 약함(꿈 사이트 기본): "Water is a good symbolic representation of life." — 맞지만 죽은 문장.
   - 강함(Tarot.com): "Think lightning bolt to the ego, unexpected news, or a foundational truth that rocks your world." 구체적 대체물을 호명해 그림이 그려진다.
   - 시사점: 상징마다 범주어 대신 생생한 이미지 하나에 착지시킨다.

3. **리듬 — 짧게 치고 길게 푼다.**
   - 최고 문장: Tarot.com의 조언 "Let it fall. Let it burn. Let what's false collapse so what's true can finally breathe." 짧은 명령 셋 + 긴 해소 하나. 이 완급(스타카토→날숨)이 생성형 티를 지운다.
   - 반대로 AuntyFlo는 6,000단어를 긴 복문으로 흘려 흐릿해진다.
   - 시사점: 문장 길이를 의도적으로 바꾼다. 짧은 명령이 먼저 꽂힌 뒤 설명이 온다.

4. **2인칭 + 주체성, 운명이 아니라.**
   - 종말적 Tower조차 독자의 기회로 프레이밍한다. "your opportunity to break free", "you are instigating the change". 예언을 임파워먼트로 바꾸고 운명론을 피한다.
   - 시사점: 결과를 독자가 만나거나 행동하는 것으로 표현한다. 특히 "나쁜" 상징에서.

5. **나쁜 것을 숨기지 말고, 호명한 뒤 전환.**
   - 장르의 가장 신뢰받는 동작: 어려운 의미를 먼저 또렷이 말하고("a divorce, death of a loved one… job loss") 그다음 성장으로 전환. 위협을 호명해야 전환이 작동한다. 부정 의미를 소독하면 가짜로 읽힌다.

6. **두 가지 실패 보이스를 피한다.**
   - AuntyFlo의 1인칭 "In all my spiritual work, I…"는 독자가 아니라 저자를 내세워 자기중심적으로 읽힌다.
   - Dream Bible의 플랫한 "To dream of X represents Y"는 정확하지만 로봇 같고 정서가 없다.
   - 스위트 스폿(Tarot.com/BiddyTarot): 2인칭·현재형·구체 이미지 하나·완급 리듬·나쁜 것은 호명 후 전환.

---

## 5. 출처

- https://cheongwoldang.com/p/dream/c/41
- https://cheongwoldang.com/p/dream/c/9
- https://ninikong.com/뱀-꿈해몽-총정리/
- https://siriuspot.com/물-꿈해몽/
- https://kitsch.raiself.com/12
- https://fortune.nate.com/submain/dreamMain.nate
- https://ezracard.com/ko/tarot-card-meanings-list/
- https://brunch.co.kr/@jlee5059/1642
- https://brunch.co.kr/@01c796d7826e4f8/66
- http://www.dreammoods.com/commondreams/snake-dreams.html
- https://www.auntyflo.com/dream-dictionary/water
- https://www.dreamdictionary.org/meaning/snake-dreams/
- https://www.dreambible.com/search.php?q=Snakes
- https://biddytarot.com/tarot-card-meanings/major-arcana/tower/
- https://biddytarot.com/tarot-card-meanings/major-arcana/fool/
- https://labyrinthos.co/blogs/tarot-card-meanings-list/the-tower-meaning-major-arcana-tarot-card-meanings
- https://www.tarot.com/tarot/cards/the-tower
