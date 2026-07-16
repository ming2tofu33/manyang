import type {
  TarotCardMeaning,
  TarotCardSymbolMeaning,
  TarotMinorCardContent,
  TarotMinorRank,
  TarotMinorSuit,
} from "@manyang/contracts/tarot";

type MinorCardDefinition = {
  suit: TarotMinorSuit;
  rank: TarotMinorRank;
  keywords: readonly string[];
  visualAnchor?: string;
  visualAnchorMeaning?: string;
  upright: string;
  reversed: string;
  point: string;
};

const suitProfiles = {
  wands: {
    nameKo: "완드",
    nameEn: "WANDS",
    element: "불",
    theme: "열정, 의지, 창조성, 행동력",
    symbol: "불타는 완드",
    mood: "안쪽의 불씨가 실제 행동으로 옮겨가려는 뜨거운 분위기입니다.",
    love: "관계 안의 끌림, 주도성, 속도와 열정을 봅니다.",
    career: "아이디어, 실행력, 경쟁, 프로젝트 추진력을 봅니다.",
    money: "새 기회와 확장 욕구가 현실 관리와 맞는지 봅니다.",
  },
  cups: {
    nameKo: "컵",
    nameEn: "CUPS",
    element: "물",
    theme: "감정, 관계, 사랑, 직관, 공감",
    symbol: "물을 담은 컵",
    mood: "마음의 물결과 관계의 온도가 섬세하게 드러나는 분위기입니다.",
    love: "호감, 애정, 상처, 회복처럼 감정의 교류를 봅니다.",
    career: "협업의 정서, 창의성, 만족감과 감정 소모를 봅니다.",
    money: "감정적 소비와 현실 균형이 함께 잡혀 있는지 봅니다.",
  },
  swords: {
    nameKo: "소드",
    nameEn: "SWORDS",
    element: "공기",
    theme: "생각, 판단, 말, 진실, 갈등",
    symbol: "날이 선 검",
    mood: "말과 판단이 상황을 또렷하게 가르며 긴장을 만드는 분위기입니다.",
    love: "솔직한 대화, 오해, 거리감, 경계선을 봅니다.",
    career: "판단, 전략, 문서, 갈등 해결과 의사결정을 봅니다.",
    money: "계약 조건과 판단 기준이 감정보다 앞서는지 봅니다.",
  },
  pentacles: {
    nameKo: "펜타클",
    nameEn: "PENTACLES",
    element: "흙",
    theme: "돈, 일, 몸, 자원, 생활 기반",
    symbol: "금빛 펜타클",
    mood: "손에 잡히는 현실과 생활 기반을 천천히 가꾸는 분위기입니다.",
    love: "관계가 일상과 책임 안에서 안정될 수 있는지 봅니다.",
    career: "실무, 성과, 기술, 장기적 기반을 봅니다.",
    money: "수입, 지출, 자산, 몸과 생활의 안정성을 봅니다.",
  },
} as const satisfies Record<TarotMinorSuit, {
  nameKo: string;
  nameEn: string;
  element: string;
  theme: string;
  symbol: string;
  mood: string;
  love: string;
  career: string;
  money: string;
}>;

const suitOrder = ["wands", "cups", "swords", "pentacles"] as const satisfies readonly TarotMinorSuit[];

const rankProfiles = {
  1: { slug: "ace", nameKo: "에이스", nameEn: "ACE", stage: "시작의 씨앗과 새 가능성" },
  2: { slug: "two", nameKo: "2", nameEn: "TWO", stage: "두 힘 사이의 선택과 균형" },
  3: { slug: "three", nameKo: "3", nameEn: "THREE", stage: "확장, 협력, 성장" },
  4: { slug: "four", nameKo: "4", nameEn: "FOUR", stage: "기반, 안정, 정지" },
  5: { slug: "five", nameKo: "5", nameEn: "FIVE", stage: "흔들림, 충돌, 변화 압박" },
  6: { slug: "six", nameKo: "6", nameEn: "SIX", stage: "회복, 조화, 주고받음" },
  7: { slug: "seven", nameKo: "7", nameEn: "SEVEN", stage: "시험, 방어, 인내" },
  8: { slug: "eight", nameKo: "8", nameEn: "EIGHT", stage: "속도, 반복, 실제 실행" },
  9: { slug: "nine", nameKo: "9", nameEn: "NINE", stage: "완성 직전의 개인적 결산" },
  10: { slug: "ten", nameKo: "10", nameEn: "TEN", stage: "완성, 부담, 순환의 끝" },
  11: { slug: "page", nameKo: "시종", nameEn: "PAGE", stage: "배움, 메시지, 새 가능성" },
  12: { slug: "knight", nameKo: "기사", nameEn: "KNIGHT", stage: "추구, 이동, 행동 방식" },
  13: { slug: "queen", nameKo: "여왕", nameEn: "QUEEN", stage: "내면화된 성숙함과 돌봄" },
  14: { slug: "king", nameKo: "왕", nameEn: "KING", stage: "운영, 책임, 외부화된 권위" },
} as const satisfies Record<number, { slug: string; nameKo: string; nameEn: string; stage: string }>;

const minorCardDefinitions = [
  {
    suit: "wands",
    rank: 1,
    keywords: ["시작", "창조적 불꽃", "영감", "생명력"],
    upright: "새로운 아이디어나 창작 충동이 막 시작되는 시점입니다. 아직 결과보다 불씨가 중요하며, 작은 행동으로 옮길 때 가능성이 살아납니다.",
    reversed: "영감은 있지만 에너지가 막히거나 타이밍이 어긋난 상태입니다. 충동만으로 시작하기보다 진짜 열정을 일으키는 대상을 다시 정리해야 합니다.",
    point: "가능성 자체보다 그 불씨를 실제 행동으로 이어갈 의지가 있는지 봅니다.",
  },
  {
    suit: "wands",
    rank: 2,
    keywords: ["계획", "선택", "시야 확장", "전략"],
    upright: "첫 영감 이후 방향을 잡는 단계입니다. 더 큰 가능성을 검토하고 장기적 관점에서 실행 순서를 세울 때입니다.",
    reversed: "변화에 대한 두려움이나 계획 부족 때문에 안전지대에 머무를 수 있습니다. 완벽한 확신보다 실천 가능한 다음 단계를 잡아야 합니다.",
    point: "가능성을 상상하는 단계에 머무는지, 실제 선택으로 넘어갈 준비가 되었는지 봅니다.",
  },
  {
    suit: "wands",
    rank: 3,
    keywords: ["확장", "전망", "기다림", "성장"],
    upright: "계획이 실행 단계로 들어갔고 바깥 세계로 확장될 가능성이 보입니다. 성과가 자라날 시간을 믿고 다음 판을 준비해야 합니다.",
    reversed: "기대했던 확장이 지연되거나 외부 조건이 막힐 수 있습니다. 일정, 협력자, 시장 반응을 다시 점검해야 합니다.",
    point: "이미 시작한 일이 밖에서 어떤 반응을 만들고 있는지 확인합니다.",
  },
  {
    suit: "wands",
    rank: 4,
    keywords: ["축하", "기반", "공동체", "소속감"],
    upright: "안정된 기반 위에서 기쁨과 성취를 나누는 순간입니다. 혼자만의 성공보다 함께 기뻐할 자리가 중요합니다.",
    reversed: "겉으로는 안정되어 보여도 내부의 소속감이나 지지가 약할 수 있습니다. 공식적 축하와 실제 기반을 구분해야 합니다.",
    point: "축하의 장면 뒤에 실제로 지탱해주는 공동체와 기반이 있는지 봅니다.",
  },
  {
    suit: "wands",
    rank: 5,
    keywords: ["경쟁", "충돌", "마찰", "훈련"],
    upright: "서로 다른 의견과 에너지가 부딪히는 장면입니다. 갈등을 없애기보다 규칙과 목표를 세워 생산적으로 써야 합니다.",
    reversed: "갈등을 피하거나 억눌린 경쟁심이 남아 있을 수 있습니다. 불필요한 싸움에서 빠져나오는 과정인지도 함께 봅니다.",
    point: "충돌이 성장 훈련인지 소모전인지 구분합니다.",
  },
  {
    suit: "wands",
    rank: 6,
    keywords: ["승리", "인정", "성취", "자신감"],
    upright: "노력의 결과가 사람들에게 인정받는 장면입니다. 자신감을 가져도 좋지만 주변의 지지와 함께 만들어진 성취임을 봐야 합니다.",
    reversed: "인정받지 못하는 느낌이나 외부 평가에 매이는 마음이 생길 수 있습니다. 타인의 박수와 실제 성취를 구분해야 합니다.",
    point: "외부의 박수와 실제 실력, 지속 가능한 성과를 함께 봅니다.",
  },
  {
    suit: "wands",
    rank: 7,
    keywords: ["방어", "저항", "용기", "위치 지키기"],
    upright: "이미 얻은 위치나 신념을 지키기 위해 저항해야 하는 시기입니다. 압박이 있어도 핵심을 알고 버티는 힘이 필요합니다.",
    reversed: "압도감, 자신감 저하, 방어 피로가 드러날 수 있습니다. 모든 공격에 대응하기보다 무엇을 지킬지 선별해야 합니다.",
    point: "방어가 필요한 상황인지, 방어 피로 때문에 과민해진 상태인지 봅니다.",
  },
  {
    suit: "wands",
    rank: 8,
    keywords: ["속도", "이동", "급진전", "메시지"],
    upright: "정체되던 일이 빠르게 움직이는 시기입니다. 여러 에너지가 같은 방향으로 정렬되어 있을 때 결정과 연락이 빨라집니다.",
    reversed: "지연, 혼선, 성급함이 나타날 수 있습니다. 막힘 자체보다 메시지, 일정, 우선순위의 정렬이 어긋났는지 봐야 합니다.",
    point: "빠른 전개가 기회인지 혼선인지, 방향이 정렬되어 있는지 봅니다.",
  },
  {
    suit: "wands",
    rank: 9,
    keywords: ["인내", "경계", "회복력", "마지막 방어선"],
    upright: "거의 끝까지 온 상태에서 마지막으로 버티는 힘이 필요한 시기입니다. 지쳤어도 방어선은 아직 무너지지 않았습니다.",
    reversed: "피로 누적, 방어적 태도, 번아웃을 뜻할 수 있습니다. 계속 버티는 것과 회복 계획을 함께 봐야 합니다.",
    point: "필요한 경계와 오래된 상처에서 나온 방어를 구분합니다.",
  },
  {
    suit: "wands",
    rank: 10,
    keywords: ["부담", "과로", "책임", "완수 직전"],
    upright: "목표를 이루기 위해 너무 많은 책임을 떠안은 상태입니다. 끝은 가까워도 혼자 들고 있는 짐이 시야를 가릴 수 있습니다.",
    reversed: "과부하, 위임 실패, 번아웃 또는 짐을 내려놓는 전환점입니다. 포기가 아니라 지속 가능한 방식으로 부담을 나누는 것이 핵심입니다.",
    point: "책임감이 성취를 돕는지, 시야를 가리고 있는지 봅니다.",
  },
  {
    suit: "wands",
    rank: 11,
    keywords: ["호기심", "소식", "실험", "자기표현"],
    upright: "새로운 열정과 창의적 가능성이 생기는 흐름입니다. 아직 미숙해도 완성도보다 먼저 시도해보는 자유로운 태도가 중요합니다.",
    reversed: "방향 없는 열정이나 미루기가 나타날 수 있습니다. 설렘을 살리되 작은 실행 단위로 구체화해야 합니다.",
    point: "미숙함을 문제로 보기보다 배움과 탐험의 태도로 읽습니다.",
  },
  {
    suit: "wands",
    rank: 12,
    keywords: ["추진력", "모험", "이동", "돌파"],
    upright: "강한 추진력과 즉각적인 행동을 보여줍니다. 정체를 깨는 힘은 크지만 지속성보다 순간의 돌파력에 가깝습니다.",
    reversed: "성급함, 무모함, 분노, 방향 없는 돌진이 드러날 수 있습니다. 속도와 목표가 맞지 않으면 불필요한 충돌이 생깁니다.",
    point: "추진력이 상황을 여는지, 무모함으로 관계와 일을 태우는지 봅니다.",
  },
  {
    suit: "wands",
    rank: 13,
    keywords: ["자신감", "매력", "따뜻한 리더십", "표현"],
    upright: "자기 확신과 따뜻한 리더십이 중심에 놓입니다. 자신의 매력을 숨기지 않고 주변을 북돋우는 힘입니다.",
    reversed: "자신감 저하, 질투, 통제욕, 에너지 소모가 드러날 수 있습니다. 자기표현을 억누르기보다 건강하게 드러낼 방법이 필요합니다.",
    point: "자신감이 자연스러운 빛인지, 인정 욕구와 통제로 변했는지 봅니다.",
  },
  {
    suit: "wands",
    rank: 14,
    keywords: ["비전", "리더십", "책임", "대담한 실행"],
    upright: "큰 그림을 보고 사람들을 이끄는 창조적 리더십입니다. 열정뿐 아니라 방향성과 책임을 가진 불의 에너지입니다.",
    reversed: "독단, 지배욕, 충동적 결정, 비현실적 기대가 나타날 수 있습니다. 책임, 경청, 지속 가능한 계획이 함께 필요합니다.",
    point: "비전과 추진력이 리더십인지 독단인지 구분합니다.",
  },
  {
    suit: "cups",
    rank: 1,
    keywords: ["마음의 시작", "사랑", "직관", "창작"],
    upright: "마음이 열리고 새로운 감정의 흐름이 시작되는 장면입니다. 받아들이고 나눌 수 있는 감정의 샘이 차오릅니다.",
    reversed: "감정이 막히거나 표현되지 못하는 때입니다. 감정을 억누르기보다 안전하게 회복하고 표현할 공간이 필요합니다.",
    point: "감정이 실제로 흐르는지, 과거 상처 때문에 막혀 있는지 봅니다.",
  },
  {
    suit: "cups",
    rank: 2,
    keywords: ["연결", "호감", "화해", "상호성"],
    upright: "두 사람 또는 두 마음 사이에 조화로운 연결이 생깁니다. 핵심은 일방적 헌신이 아니라 서로 주고받는 균형입니다.",
    reversed: "관계의 불균형, 소통 단절, 감정적 오해가 드러날 수 있습니다. 서로 다른 기대를 솔직히 조율해야 합니다.",
    point: "두 사람의 감정이 같은 높이에서 오가는지 확인합니다.",
  },
  {
    suit: "cups",
    rank: 3,
    keywords: ["기쁨", "친구", "축하", "소속감"],
    upright: "기쁨을 사람들과 나누는 흐름입니다. 공동체 안에서 정서적 지지를 받거나 축하할 일이 생길 수 있습니다.",
    reversed: "소외감, 무리 안의 불편함, 과도한 유흥이나 가벼운 말로 인한 갈등을 뜻할 수 있습니다.",
    point: "공동체가 진짜 지지인지, 분위기에 휩쓸린 친밀감인지 봅니다.",
  },
  {
    suit: "cups",
    rank: 4,
    keywords: ["무기력", "권태", "제안", "내면 집중"],
    upright: "외부의 제안이 있어도 마음이 움직이지 않는 상태입니다. 거절보다 마음의 피로와 내면의 닫힘을 먼저 봐야 합니다.",
    reversed: "닫혔던 마음이 다시 열리거나 새로운 제안을 받아들일 준비가 생깁니다. 회복의 작은 신호를 놓치지 않아야 합니다.",
    point: "기회가 없는 것인지, 마음이 지쳐 알아보지 못하는 것인지 봅니다.",
  },
  {
    suit: "cups",
    rank: 5,
    keywords: ["상실감", "후회", "실망", "남은 가능성"],
    upright: "잃은 것과 아쉬움에 마음이 묶인 장면입니다. 이미 무너진 컵만 보느라 아직 남은 연결을 보지 못할 수 있습니다.",
    reversed: "후회에서 조금씩 벗어나 남은 것을 볼 수 있는 전환점입니다. 과거를 지우기보다 배운 것을 붙잡아야 합니다.",
    point: "상실에 머무는지, 남아 있는 가능성으로 시선이 옮겨가는지 봅니다.",
  },
  {
    suit: "cups",
    rank: 6,
    keywords: ["추억", "순수함", "다정함", "과거"],
    upright: "과거의 따뜻한 기억, 순수한 애정, 익숙한 관계가 마음을 회복시킵니다. 어린 시절이나 오래된 인연도 단서가 됩니다.",
    reversed: "과거에 머물거나 추억을 지나치게 이상화할 수 있습니다. 익숙함이 현재의 선택을 좁히지 않는지 봐야 합니다.",
    point: "추억이 회복의 자원인지, 현재를 피하는 장소인지 구분합니다.",
  },
  {
    suit: "cups",
    rank: 7,
    keywords: ["환상", "선택지", "상상", "혼란"],
    upright: "여러 가능성과 상상이 한꺼번에 떠오르는 상태입니다. 매력적인 선택지 사이에서 현실성을 구분해야 합니다.",
    reversed: "환상이 걷히고 선택지가 줄어들며 현실적인 판단이 가능해집니다. 막연함보다 구체적인 기준이 필요합니다.",
    point: "꿈이 영감을 주는지, 결정을 흐리는 환상인지 봅니다.",
  },
  {
    suit: "cups",
    rank: 8,
    keywords: ["떠남", "정리", "내면 탐색", "결핍감"],
    upright: "감정적으로 채워지지 않는 자리를 떠나 더 깊은 의미를 찾는 시기입니다. 포기보다 방향 전환에 가깝습니다.",
    reversed: "떠나야 할 곳에 머물거나, 반대로 성급히 등질 수 있습니다. 결핍의 원인이 상황인지 마음인지 확인해야 합니다.",
    point: "떠남이 회피인지, 더 진실한 필요를 찾는 선택인지 봅니다.",
  },
  {
    suit: "cups",
    rank: 9,
    keywords: ["만족", "소원", "자기 충족", "즐거움"],
    upright: "개인적 만족과 감정적 충족이 드러나는 카드입니다. 스스로 원하는 것을 인정하고 기쁨을 누리는 힘이 있습니다.",
    reversed: "겉보기 만족 뒤의 공허함이나 과한 기대가 드러날 수 있습니다. 진짜 원하는 것과 보여주고 싶은 만족을 구분해야 합니다.",
    point: "만족이 깊은 충족인지, 욕구를 덮는 장식인지 봅니다.",
  },
  {
    suit: "cups",
    rank: 10,
    keywords: ["행복", "가족", "정서적 완성", "조화"],
    upright: "관계와 마음의 조화가 완성감으로 이어지는 장면입니다. 함께 기뻐할 수 있는 정서적 기반이 중요합니다.",
    reversed: "겉으로는 이상적인 관계처럼 보여도 실제 감정의 합의가 부족할 수 있습니다. 행복의 이미지와 현실을 구분해야 합니다.",
    point: "행복의 그림이 실제 관계의 온도와 맞는지 봅니다.",
  },
  {
    suit: "cups",
    rank: 11,
    keywords: ["감성", "메시지", "상상력", "순수한 제안"],
    upright: "감정적 메시지나 창의적 영감이 부드럽게 찾아옵니다. 미숙하지만 진심 어린 표현을 받아볼 만합니다.",
    reversed: "감정 표현이 서툴거나 상상에만 머물 수 있습니다. 민감함이 회피나 과장으로 흐르지 않게 해야 합니다.",
    point: "순수한 감정 표현인지, 현실을 피하는 상상인지 봅니다.",
  },
  {
    suit: "cups",
    rank: 12,
    keywords: ["낭만", "접근", "제안", "이상"],
    upright: "낭만적 제안이나 감정적 움직임이 나타납니다. 마음을 전하려는 태도는 좋지만 실제 지속성도 함께 봐야 합니다.",
    reversed: "이상화, 감정 기복, 말뿐인 낭만이 드러날 수 있습니다. 멋진 표현보다 실제 행동과 책임을 확인해야 합니다.",
    point: "낭만이 진심을 싣고 오는지, 환상만 키우는지 봅니다.",
  },
  {
    suit: "cups",
    rank: 13,
    keywords: ["공감", "직관", "돌봄", "감정의 성숙"],
    upright: "감정을 깊이 이해하고 품는 힘입니다. 상대의 마음을 읽되 자신을 잃지 않는 섬세한 성숙함이 중요합니다.",
    reversed: "감정에 휩쓸리거나 타인의 기분을 지나치게 떠안을 수 있습니다. 공감과 자기 경계를 함께 세워야 합니다.",
    point: "공감이 돌봄인지, 감정적 흡수와 자기소진인지 봅니다.",
  },
  {
    suit: "cups",
    rank: 14,
    keywords: ["감정 조절", "성숙", "포용", "안정"],
    upright: "깊은 감정을 안정적으로 다루는 성숙한 태도입니다. 흔들림 속에서도 마음을 운영하는 힘이 있습니다.",
    reversed: "감정 억압, 회피, 조용한 불안정이 나타날 수 있습니다. 성숙한 척하는 것과 실제 감정 조절을 구분해야 합니다.",
    point: "감정을 다스리는 힘인지, 감정을 숨기는 통제인지 봅니다.",
  },
  {
    suit: "swords",
    rank: 1,
    keywords: ["명확함", "진실", "결단", "새 인식"],
    upright: "생각이 또렷해지고 진실을 가르는 힘이 생깁니다. 새 판단이나 말의 시작이 상황을 정리할 수 있습니다.",
    reversed: "생각이 흐려지거나 말이 상처가 될 수 있습니다. 결론을 서두르기보다 사실과 해석을 구분해야 합니다.",
    point: "명확한 통찰인지, 날카로운 단정인지 봅니다.",
  },
  {
    suit: "swords",
    rank: 2,
    keywords: ["보류", "갈림길", "방어", "균형"],
    upright: "두 선택 사이에서 판단을 보류하는 장면입니다. 감정을 잠시 막고 있지만 오래 미루면 정체가 됩니다.",
    reversed: "피하던 선택이 더 이상 미뤄지지 않을 수 있습니다. 정보 부족과 회피를 구분해야 합니다.",
    point: "중립이 지혜인지, 결정을 피하는 방어인지 봅니다.",
  },
  {
    suit: "swords",
    rank: 3,
    keywords: ["상처", "슬픔", "진실", "아픈 인식"],
    upright: "말이나 사실이 마음을 찌르는 장면입니다. 아프지만 감춰진 진실을 보게 만드는 카드입니다.",
    reversed: "상처를 회복하거나 아픔을 부정하는 흐름입니다. 괜찮은 척보다 상처를 정확히 인정해야 합니다.",
    point: "아픈 진실을 보는지, 상처에만 머무르는지 봅니다.",
  },
  {
    suit: "swords",
    rank: 4,
    keywords: ["휴식", "회복", "정지", "생각 정리"],
    upright: "갈등 뒤에 회복과 정지가 필요한 시기입니다. 더 생각하기보다 생각을 쉬게 해야 판단이 돌아옵니다.",
    reversed: "충분히 쉬지 못하거나 정지 상태에서 나오려는 움직임입니다. 회복 없이 다시 싸움에 들어가지 않게 해야 합니다.",
    point: "쉼이 회복인지, 문제 회피인지 구분합니다.",
  },
  {
    suit: "swords",
    rank: 5,
    keywords: ["갈등", "패배감", "말의 상처", "승리의 대가"],
    upright: "이기더라도 관계나 신뢰가 손상될 수 있는 갈등입니다. 논쟁의 승패보다 무엇이 남는지 봐야 합니다.",
    reversed: "갈등에서 물러나거나 화해의 가능성이 생깁니다. 같은 방식의 말싸움을 반복하지 않는 것이 중요합니다.",
    point: "이김이 해결인지, 더 큰 손상을 남기는지 봅니다.",
  },
  {
    suit: "swords",
    rank: 6,
    keywords: ["이동", "회복", "전환", "거리두기"],
    upright: "어려운 생각과 상황에서 벗어나 더 나은 방향으로 이동합니다. 완전한 해결보다 안전한 거리 확보가 먼저입니다.",
    reversed: "떠나야 할 생각이나 상황에 묶여 있을 수 있습니다. 이동을 막는 두려움과 미련을 봐야 합니다.",
    point: "이동이 회피인지, 회복을 위한 거리두기인지 봅니다.",
  },
  {
    suit: "swords",
    rank: 7,
    keywords: ["전략", "회피", "비밀", "독자 행동"],
    upright: "정면 대결보다 전략적으로 움직이는 카드입니다. 다만 숨김이나 회피가 신뢰를 해칠 수 있습니다.",
    reversed: "숨긴 일이 드러나거나 정직한 방식으로 돌아가야 할 때입니다. 혼자 해결하려는 태도를 점검해야 합니다.",
    point: "전략이 필요한 지혜인지, 책임 회피인지 봅니다.",
  },
  {
    suit: "swords",
    rank: 8,
    keywords: ["제한", "두려움", "묶임", "시야 차단"],
    upright: "스스로 갇힌 듯 느끼지만 실제 제한보다 생각의 감옥이 클 수 있습니다. 움직일 수 있는 틈을 찾아야 합니다.",
    reversed: "묶임에서 벗어날 실마리가 보입니다. 두려움과 사실을 구분하면 선택지가 다시 열립니다.",
    point: "막힌 현실인지, 두려움이 만든 제한인지 봅니다.",
  },
  {
    suit: "swords",
    rank: 9,
    keywords: ["불안", "악몽", "후회", "과잉 사고"],
    upright: "생각이 밤처럼 커져 불안과 후회가 반복되는 상태입니다. 실제 문제와 마음속 확대를 나눠 봐야 합니다.",
    reversed: "불안에서 벗어나거나 도움을 요청할 수 있는 전환점입니다. 혼자 견디는 태도가 회복을 늦출 수 있습니다.",
    point: "문제 자체보다 생각이 얼마나 커졌는지 봅니다.",
  },
  {
    suit: "swords",
    rank: 10,
    keywords: ["끝", "붕괴", "한계", "새벽 전환"],
    upright: "더 이상 같은 방식으로 버틸 수 없는 끝의 장면입니다. 아프지만 한 주기가 끝났다는 사실을 인정해야 합니다.",
    reversed: "최악의 순간을 지나 회복의 여지가 생깁니다. 끝난 것을 붙잡기보다 다음 국면을 준비해야 합니다.",
    point: "완전한 실패가 아니라 끝난 방식과 새로 열릴 방향을 봅니다.",
  },
  {
    suit: "swords",
    rank: 11,
    keywords: ["관찰", "호기심", "정보", "날카로운 말"],
    upright: "정보를 찾고 질문하는 젊은 지성입니다. 빠른 관찰력은 좋지만 말이 너무 날카로워지지 않게 해야 합니다.",
    reversed: "성급한 말, 소문, 산만한 정보 탐색이 문제가 될 수 있습니다. 말하기 전에 확인이 필요합니다.",
    point: "호기심이 통찰인지, 경솔한 말과 감시인지 봅니다.",
  },
  {
    suit: "swords",
    rank: 12,
    keywords: ["빠른 결단", "돌파", "논리", "성급함"],
    upright: "빠르게 판단하고 돌파하려는 힘입니다. 문제 해결에는 유리하지만 속도가 관계를 압박할 수 있습니다.",
    reversed: "급한 논리와 날카로운 말이 충돌만 남길 수 있습니다. 속도를 내기 전에 해결 목표를 분명히 해야 합니다.",
    point: "빠른 판단이 문제 해결인지 공격성인지 구분합니다.",
  },
  {
    suit: "swords",
    rank: 13,
    keywords: ["분별", "경계", "솔직함", "독립성"],
    upright: "상황의 핵심을 보고 필요한 말을 분명히 하는 힘입니다. 감정에 끌려 판단을 흐리지 않는 성숙함입니다.",
    reversed: "기준이 비판이나 냉정함으로 굳어질 수 있습니다. 경계선과 벽을 혼동하고 있지는 않은지 봐야 합니다.",
    point: "경계선이 건강한 보호인지, 상처에서 만든 벽인지 봅니다.",
  },
  {
    suit: "swords",
    rank: 14,
    keywords: ["원칙", "사실", "전략", "공정함"],
    upright: "감정보다 원칙과 사실이 우선되는 카드입니다. 복잡한 문제를 분석하고 책임 있는 말로 정리합니다.",
    reversed: "논리가 권위주의나 조종으로 바뀔 수 있습니다. 공정함을 말하면서 힘의 우위를 행사하지 않는지 봐야 합니다.",
    point: "객관성이 성숙한 판단인지, 냉정한 통제인지 봅니다.",
  },
  {
    suit: "pentacles",
    rank: 1,
    keywords: ["기회", "씨앗", "현실 기반", "자원"],
    upright: "손에 잡히는 기회가 생기는 신호입니다. 돈, 일, 건강, 공부처럼 현실에서 키워갈 수 있는 씨앗입니다.",
    reversed: "좋은 기회가 있어도 준비 부족이나 관리 부족으로 놓칠 수 있습니다. 일정, 돈, 몸 상태를 구체적으로 점검해야 합니다.",
    point: "가능성이 실제 기반으로 자랄 조건과 관리 계획이 있는지 봅니다.",
  },
  {
    suit: "pentacles",
    rank: 2,
    keywords: ["균형", "조율", "우선순위", "유연성"],
    upright: "여러 일을 동시에 맞춰야 하는 시기입니다. 완벽한 안정이 아니라 변화 속에서 우선순위를 조정하는 능력이 중요합니다.",
    reversed: "돈, 시간, 체력, 책임 중 어디에서 과부하가 생기는지 확인해야 합니다. 모두 붙잡기보다 줄이는 선택이 필요합니다.",
    point: "유연한 조율인지, 산만하게 버티는 과부하인지 봅니다.",
  },
  {
    suit: "pentacles",
    rank: 3,
    keywords: ["협업", "기술", "설계", "피드백"],
    upright: "혼자보다 함께 만들 때 성과가 나는 흐름입니다. 각자의 전문성과 책임이 구조적으로 맞물리는지가 중요합니다.",
    reversed: "협업이 어긋나거나 역할이 불분명할 수 있습니다. 품질 기준과 의사결정 구조를 다시 맞춰야 합니다.",
    point: "사람이 모였는지보다 역할, 기준, 책임이 맞물리는지 봅니다.",
  },
  {
    suit: "pentacles",
    rank: 4,
    keywords: ["보호", "저축", "안정", "집착"],
    upright: "가진 것을 지키고 싶은 마음이 강합니다. 자원 관리에는 좋지만 보호가 지나치면 새 흐름을 막을 수 있습니다.",
    reversed: "집착을 내려놓아야 하거나 관리 부족으로 자원이 새어나갈 수 있습니다. 안정 욕구가 삶을 좁히지 않는지 봐야 합니다.",
    point: "안정감을 만드는 관리인지, 불안을 가리는 집착인지 구분합니다.",
  },
  {
    suit: "pentacles",
    rank: 5,
    keywords: ["결핍", "소외감", "도움 요청", "불안정"],
    upright: "돈, 일, 생활 기반에서 결핍이나 소외감을 느끼는 상황입니다. 가까운 도움을 보지 못할 만큼 고립될 수 있습니다.",
    reversed: "어려움에서 벗어나는 계기나 도움을 받아들이는 전환점입니다. 현실적 문제는 현실적 도움으로 풀어야 합니다.",
    point: "도움이 없는 상황인지, 도움을 보지 못할 만큼 고립된 상태인지 봅니다.",
  },
  {
    suit: "pentacles",
    rank: 6,
    keywords: ["나눔", "후원", "공정한 교환", "균형"],
    upright: "자원이 오가고 균형을 맞추는 흐름입니다. 도움을 주거나 받을 때 교환이 건강하게 순환하는지가 중요합니다.",
    reversed: "도움이라는 이름의 통제, 불공정한 거래, 빚과 의존이 나타날 수 있습니다. 교환 기준을 투명하게 해야 합니다.",
    point: "선의가 건강한 순환인지, 통제와 의존을 만드는 구조인지 봅니다.",
  },
  {
    suit: "pentacles",
    rank: 7,
    keywords: ["인내", "평가", "장기 투자", "수확 전 점검"],
    upright: "바로 수확하기보다 지금까지의 노력을 평가하는 시기입니다. 결과는 자라고 있지만 방식과 지속 가능성을 점검해야 합니다.",
    reversed: "기다림에 지치거나 노력 대비 결과가 부족하다고 느낄 수 있습니다. 더 버틸 가치와 방식 변경을 따져봐야 합니다.",
    point: "결과가 늦은 것인지, 방식 자체를 바꿔야 하는지 봅니다.",
  },
  {
    suit: "pentacles",
    rank: 8,
    keywords: ["연습", "숙련", "성실함", "기술"],
    upright: "실력이 반복을 통해 쌓이는 과정입니다. 눈에 띄는 보상보다 완성도와 루틴이 미래의 결과를 만듭니다.",
    reversed: "반복이 지루해져 집중력이 떨어지거나 완벽주의 때문에 완료가 늦어질 수 있습니다. 루틴을 다시 정비해야 합니다.",
    point: "반복이 숙련을 만드는지, 기계적 노동으로 굳어졌는지 봅니다.",
  },
  {
    suit: "pentacles",
    rank: 9,
    keywords: ["독립", "풍요", "자기 관리", "여유"],
    visualAnchor: "스스로 가꾼 정원과 손에 든 펜타클",
    visualAnchorMeaning:
      "스스로 만든 안정, 독립된 생활 기반, 여유와 압박이 함께 남는 자립의 감각을 보여줍니다.",
    upright: "스스로 만든 안정과 여유를 누리는 카드입니다. 경제적 독립, 생활의 질, 자기 관리가 강조됩니다.",
    reversed: "겉보기 여유 뒤의 의존, 불안, 허세가 드러날 수 있습니다. 진짜 독립인지 독립처럼 보이려는 긴장인지 봐야 합니다.",
    point: "독립이 여유인지, 혼자 해내야 한다는 압박인지 봅니다.",
  },
  {
    suit: "pentacles",
    rank: 10,
    keywords: ["장기 안정", "가족", "유산", "공동 기반"],
    upright: "개인의 성취를 넘어 가족, 조직, 공동체의 기반으로 이어지는 안정입니다. 오래 남을 구조를 만드는 카드입니다.",
    reversed: "가족이나 조직의 안정이 부담이 되거나 오래된 기준이 현재의 선택을 좁힐 수 있습니다.",
    point: "안정이 공동의 기반인지, 개인 선택을 누르는 전통인지 봅니다.",
  },
  {
    suit: "pentacles",
    rank: 11,
    keywords: ["공부", "실습", "계획", "현실 감각"],
    upright: "작지만 실질적인 시작입니다. 공부, 돈 관리, 건강 습관, 기술처럼 손으로 익히고 쌓아가는 일에 잘 맞습니다.",
    reversed: "계획은 있지만 실행이 약하거나 현실 감각이 부족할 수 있습니다. 구체적 루틴으로 내려와야 가능성이 자랍니다.",
    point: "가능성이 실제 훈련과 습관으로 내려왔는지 봅니다.",
  },
  {
    suit: "pentacles",
    rank: 12,
    keywords: ["성실함", "책임", "루틴", "느린 진전"],
    upright: "빠르지는 않지만 믿을 수 있는 카드입니다. 반복되는 일, 책임, 루틴, 장기 계획을 끝까지 수행하는 힘입니다.",
    reversed: "성실함이 정체나 고집으로 바뀔 수 있습니다. 느림이 신중함인지 두려움인지 구분해야 합니다.",
    point: "성실함이 신뢰를 만드는지, 변화 회피로 굳어지는지 봅니다.",
  },
  {
    suit: "pentacles",
    rank: 13,
    keywords: ["돌봄", "생활력", "현실 감각", "풍요"],
    upright: "몸과 생활을 돌보는 현실적인 따뜻함입니다. 돈, 집, 건강, 식사와 휴식처럼 삶을 유지하는 기반을 가꿉니다.",
    reversed: "돌봄이 부담으로 바뀌거나 자기 자신을 돌보지 못할 수 있습니다. 풍요를 유지하려면 몸과 경계도 챙겨야 합니다.",
    point: "돌봄이 풍요를 만드는지, 과보호와 자기소진으로 바뀌는지 봅니다.",
  },
  {
    suit: "pentacles",
    rank: 14,
    keywords: ["성공", "자원 관리", "장기 안정", "책임"],
    upright: "자원을 안정적으로 관리하고 성과를 지키는 카드입니다. 얻은 것을 오래 유지하고 체계와 책임으로 운영합니다.",
    reversed: "안정에 대한 집착이 탐욕이나 통제로 바뀔 수 있습니다. 가진 것을 지키는 데만 몰두하면 풍요가 정체됩니다.",
    point: "안정적 운영 능력과 물질적 통제욕의 경계를 봅니다.",
  },
] as const satisfies readonly MinorCardDefinition[];

function createMinorImageKey(suit: TarotMinorSuit, rank: TarotMinorRank): string {
  const rankProfile = rankProfiles[rank];

  return `minor-cutout/${suit}/${String(rank).padStart(2, "0")}-${rankProfile.slug}-of-${suit}.png`;
}

function createMinorSlug(suit: TarotMinorSuit, rank: TarotMinorRank): string {
  return `${rankProfiles[rank].slug}-of-${suit}`;
}

function createMinorNameKo(suit: TarotMinorSuit, rank: TarotMinorRank): string {
  return `${suitProfiles[suit].nameKo} ${rankProfiles[rank].nameKo}`;
}

function hasFinalConsonantInKoreanNumber(value: number): boolean {
  const finalDigit = Math.abs(value) % 10;

  if (value === 0) {
    return true;
  }

  if (finalDigit === 0) {
    return true;
  }

  return finalDigit === 1 || finalDigit === 3 || finalDigit === 6 || finalDigit === 7 || finalDigit === 8;
}

function hasFinalConsonant(value: string): boolean {
  const trailingNumberMatch = value.trim().match(/(\d+)$/u);

  if (trailingNumberMatch) {
    return hasFinalConsonantInKoreanNumber(Number(trailingNumberMatch[1]));
  }

  const lastHangulSyllable = [...value].reverse().find((char) => {
    const code = char.charCodeAt(0);

    return code >= 0xac00 && code <= 0xd7a3;
  });

  if (!lastHangulSyllable) {
    return false;
  }

  return (lastHangulSyllable.charCodeAt(0) - 0xac00) % 28 !== 0;
}

function appendTopicParticle(value: string): string {
  return `${value}${hasFinalConsonant(value) ? "은" : "는"}`;
}

function appendSubjectParticle(value: string): string {
  return `${value}${hasFinalConsonant(value) ? "이" : "가"}`;
}

function createMinorMeaning(cardName: string, text: string, point: string): TarotCardMeaning {
  return {
    summary: text,
    dailyFlow: text,
    cardMessage: `${appendTopicParticle(cardName)} ${point}`,
    readingScene: `${text} ${point}`,
  };
}

function createMinorCard(definition: MinorCardDefinition): TarotMinorCardContent {
  const suitProfile = suitProfiles[definition.suit];
  const rankProfile = rankProfiles[definition.rank];
  const suitOffset = suitOrder.indexOf(definition.suit) * 14;
  const id = 22 + suitOffset + definition.rank - 1;
  const nameKo = createMinorNameKo(definition.suit, definition.rank);
  const nameEn = `${rankProfile.nameEn} OF ${suitProfile.nameEn}`;
  const visualAnchor = definition.visualAnchor ?? rankProfile.stage;
  const visualAnchorMeaning = definition.visualAnchorMeaning ?? definition.point;

  return {
    id,
    cardKey: `minor:${definition.suit}:${String(definition.rank).padStart(2, "0")}`,
    arcana: "minor",
    suit: definition.suit,
    rank: definition.rank,
    slug: createMinorSlug(definition.suit, definition.rank),
    nameEn,
    nameKo,
    imageKey: createMinorImageKey(definition.suit, definition.rank),
    keywords: definition.keywords,
    visualSymbols: [suitProfile.symbol, visualAnchor],
    symbolMeanings: [
      {
        symbol: suitProfile.symbol,
        meaning: `${appendTopicParticle(suitProfile.nameKo)} ${suitProfile.element} 원소의 ${suitProfile.theme}을 보여줍니다.`,
      },
      {
        symbol: visualAnchor,
        meaning: visualAnchorMeaning,
      },
    ],
    mood: `${suitProfile.mood} ${appendSubjectParticle(visualAnchor)} 중심에 놓입니다.`,
    upright: createMinorMeaning(nameKo, definition.upright, definition.point),
    reversed: createMinorMeaning(nameKo, definition.reversed, definition.point),
    contexts: {
      love: suitProfile.love,
      career: suitProfile.career,
      money: suitProfile.money,
      general: definition.point,
    },
  };
}

export const tarotMinorCardContent: readonly TarotMinorCardContent[] =
  minorCardDefinitions.map(createMinorCard);

export function getTarotMinorCardContentById(id: number): TarotMinorCardContent | null {
  return tarotMinorCardContent.find((card) => card.id === id) ?? null;
}
