import { manyangAssets } from "./manyang-assets";

export type TarotCardSymbolMeaning = {
  symbol: string;
  meaning: string;
};

export type TarotMajorCardMeaning = {
  summary: string;
  dailyFlow: string;
  advice: string;
  story: string;
  reflectionQuestion: string;
  smallAction: string;
};

export type TarotMajorCard = {
  id: number;
  roman: string;
  slug: string;
  nameEn: string;
  nameKo: string;
  image: string;
  keywords: readonly string[];
  visualSymbols: readonly string[];
  symbolMeanings: readonly TarotCardSymbolMeaning[];
  mood: string;
  upright: TarotMajorCardMeaning;
  reversed: TarotMajorCardMeaning;
  contexts: { love: string; career: string; money: string; general: string };
};

type TarotMajorCardBasicMeaning = Pick<TarotMajorCardMeaning, "summary" | "dailyFlow" | "advice">;

type TarotMajorCardBase = Omit<TarotMajorCard, "symbolMeanings" | "upright" | "reversed"> & {
  upright: TarotMajorCardBasicMeaning;
  reversed: TarotMajorCardBasicMeaning;
};

type TarotMajorCardReferenceAddition = {
  symbolMeanings: readonly TarotCardSymbolMeaning[];
  upright: Pick<TarotMajorCardMeaning, "story" | "reflectionQuestion" | "smallAction">;
  reversed: Pick<TarotMajorCardMeaning, "story" | "reflectionQuestion" | "smallAction">;
};

const tarotMajorCardBase = [
  {
    id: 0,
    roman: "0",
    slug: "the-fool",
    nameEn: "THE FOOL",
    nameKo: "바보",
    image: manyangAssets.tarot.major.fool,
    keywords: ["시작", "가능성", "모험", "순수함"],
    visualSymbols: ["절벽 끝의 여행자", "작은 보따리", "흰 꽃", "작은 개"],
    mood: "밝고 가벼운 출발감 속에 아직 정해지지 않은 길이 열려 있는 분위기입니다.",
    upright: {
      summary: "새로운 시작과 열린 가능성이 자연스럽게 떠오르는 흐름을 보여 줍니다.",
      dailyFlow: "낯선 제안이나 작은 시도가 하루의 방향을 바꿀 수 있는 날로 읽을 수 있습니다.",
      advice: "첫걸음을 내딛되 발밑의 조건과 기본 준비를 함께 확인하세요.",
    },
    reversed: {
      summary: "설렘이 앞서 준비나 책임감이 느슨해질 수 있는 흐름을 비춥니다.",
      dailyFlow: "즉흥적인 선택이 잦아질 수 있으니 속도를 한 번 낮추는 편이 좋습니다.",
      advice: "호기심은 살리되 안전장치와 현실적인 기준을 먼저 세워 보세요.",
    },
    contexts: {
      love: "새로운 호감이나 아직 정의되지 않은 관계의 가능성을 상징합니다.",
      career: "새 프로젝트나 진로 탐색처럼 경험보다 가능성이 앞서는 장면에 가깝습니다.",
      money: "새 수익 실험은 열려 있지만 충동 지출은 살펴볼 필요가 있습니다.",
      general: "결론보다 시작의 마음과 선택 가능한 길을 살피는 카드입니다.",
    },
  },
  {
    id: 1,
    roman: "I",
    slug: "the-magician",
    nameEn: "THE MAGICIAN",
    nameKo: "마법사",
    image: manyangAssets.tarot.major.magician,
    keywords: ["실행", "창조", "의지", "구현"],
    visualSymbols: ["위와 아래를 잇는 손짓", "무한대 기호", "네 가지 도구", "제단"],
    mood: "생각을 현실의 형태로 옮기려는 집중되고 능동적인 창조 에너지입니다.",
    upright: {
      summary: "이미 가진 자원과 역량을 조합해 결과를 만들어 갈 수 있는 흐름입니다.",
      dailyFlow: "말이나 아이디어에 그치지 않고 작은 실행으로 옮길 때 힘이 생깁니다.",
      advice: "필요한 도구를 다시 확인하고 지금 가능한 행동 하나를 시작하세요.",
    },
    reversed: {
      summary: "능력은 있으나 방향이 흩어지거나 말과 행동이 어긋날 수 있습니다.",
      dailyFlow: "계획을 크게 말하기보다 실제로 쓸 수 있는 시간과 자원을 점검해야 합니다.",
      advice: "과장이나 조급함을 줄이고 한 가지 목표에 집중해 보세요.",
    },
    contexts: {
      love: "매력과 표현력이 강해지는 흐름이며 진솔한 소통이 중요합니다.",
      career: "기술과 기획을 실제 성과로 연결할 기회가 보일 수 있습니다.",
      money: "가진 역량을 수익 구조로 바꾸는 실험에 적합한 흐름입니다.",
      general: "영감이 현실화되려면 의식적인 실행이 필요하다는 신호입니다.",
    },
  },
  {
    id: 2,
    roman: "II",
    slug: "the-high-priestess",
    nameEn: "THE HIGH PRIESTESS",
    nameKo: "여사제",
    image: manyangAssets.tarot.major.highPriestess,
    keywords: ["직감", "비밀", "무의식", "침묵"],
    visualSymbols: ["두 기둥", "베일", "책", "달의 상징"],
    mood: "겉으로 드러난 정보보다 숨은 감각과 흐름이 중요한 분위기입니다.",
    upright: {
      summary: "아직 모든 것이 공개되지 않았고 관찰과 직감이 길잡이가 되는 흐름입니다.",
      dailyFlow: "서두른 결론보다 분위기와 반복되는 신호를 살피는 시간이 어울립니다.",
      advice: "말을 늘리기보다 정보를 모으고 내면의 감각을 사실과 나눠 보세요.",
    },
    reversed: {
      summary: "직감을 무시하거나 감춰진 사실을 외면하면서 혼란이 커질 수 있습니다.",
      dailyFlow: "확인되지 않은 추측이 커질 수 있으니 침묵과 회피를 구분해야 합니다.",
      advice: "불안을 사실로 단정하지 말고 필요한 질문을 조심스럽게 정리하세요.",
    },
    contexts: {
      love: "말하지 않은 감정이나 아직 분명하지 않은 관계의 속마음을 뜻할 수 있습니다.",
      career: "내부 사정이나 자료 검토처럼 보이지 않는 정보 수집이 중요합니다.",
      money: "조건을 다 알기 전에는 큰 결정을 미루고 세부 항목을 살피는 편이 좋습니다.",
      general: "겉으로 보이는 사건 아래의 패턴과 감각을 읽어야 하는 카드입니다.",
    },
  },
  {
    id: 3,
    roman: "III",
    slug: "the-empress",
    nameEn: "THE EMPRESS",
    nameKo: "여황제",
    image: manyangAssets.tarot.major.empress,
    keywords: ["풍요", "생명력", "돌봄", "창조성"],
    visualSymbols: ["풍성한 정원", "곡식", "왕관", "비너스 상징"],
    mood: "무언가가 자연스럽게 자라고 감각적으로 풍성해지는 따뜻한 분위기입니다.",
    upright: {
      summary: "성장과 돌봄, 창작의 에너지가 부드럽게 확장되는 흐름입니다.",
      dailyFlow: "억지로 밀어붙이기보다 잘 자랄 환경을 마련할 때 결과가 부드럽습니다.",
      advice: "통제보다 돌봄을 선택하고 몸과 감각이 보내는 신호도 존중하세요.",
    },
    reversed: {
      summary: "과잉 보호나 의존, 감정적 소비가 성장의 균형을 흐릴 수 있습니다.",
      dailyFlow: "무리하게 챙기거나 퍼주면서 정작 자신의 리듬을 놓치기 쉽습니다.",
      advice: "돌봄과 경계 사이의 균형을 다시 세우고 필요한 만큼만 나누세요.",
    },
    contexts: {
      love: "애정과 친밀감이 자라는 흐름이며 편안한 표현이 도움이 됩니다.",
      career: "창작, 브랜드, 콘텐츠처럼 키워 가는 일이 두드러질 수 있습니다.",
      money: "풍요의 가능성은 있으나 즐거움에 따른 과소비를 살펴야 합니다.",
      general: "서두른 결론보다 성장의 환경을 가꾸는 태도가 어울립니다.",
    },
  },
  {
    id: 4,
    roman: "IV",
    slug: "the-emperor",
    nameEn: "THE EMPEROR",
    nameKo: "황제",
    image: manyangAssets.tarot.major.emperor,
    keywords: ["질서", "구조", "권위", "책임"],
    visualSymbols: ["왕좌", "갑옷", "산", "양의 상징"],
    mood: "단단한 기준과 현실적인 통제력이 중심을 잡는 안정적인 분위기입니다.",
    upright: {
      summary: "흩어진 상황에 구조와 책임을 세워 안정시키는 흐름입니다.",
      dailyFlow: "감정적인 반응보다 규칙, 일정, 역할 정리가 유리하게 작용합니다.",
      advice: "기준을 분명히 하고 지켜야 할 책임을 구체적인 행동으로 옮기세요.",
    },
    reversed: {
      summary: "통제가 지나치거나 반대로 책임을 피하며 질서가 흔들릴 수 있습니다.",
      dailyFlow: "고집이나 경직된 태도가 대화를 막을 수 있어 유연함이 필요합니다.",
      advice: "권위를 증명하려 하기보다 필요한 구조가 무엇인지 다시 보세요.",
    },
    contexts: {
      love: "안정과 책임을 원하지만 통제적인 방식은 조심해야 합니다.",
      career: "관리, 리더십, 시스템 정비가 중요한 흐름으로 읽을 수 있습니다.",
      money: "예산과 원칙을 세워 현실적으로 관리할 필요가 있습니다.",
      general: "감정보다 기준과 구조를 통해 상황을 다루라는 카드입니다.",
    },
  },
  {
    id: 5,
    roman: "V",
    slug: "the-hierophant",
    nameEn: "THE HIEROPHANT",
    nameKo: "교황",
    image: manyangAssets.tarot.major.hierophant,
    keywords: ["전통", "배움", "제도", "신념"],
    visualSymbols: ["사제", "두 제자", "열쇠", "기둥"],
    mood: "개인의 즉흥보다 검증된 지식과 공동체의 규칙이 힘을 갖는 분위기입니다.",
    upright: {
      summary: "배움, 멘토, 제도권의 조언을 통해 방향을 잡기 좋은 흐름입니다.",
      dailyFlow: "혼자 해석하기보다 경험 많은 사람이나 공식 절차를 참고하면 안정적입니다.",
      advice: "검증된 길을 살피고 지금 필요한 가르침을 받아들여 보세요.",
    },
    reversed: {
      summary: "낡은 규칙이나 형식주의가 현재 상황에 맞지 않을 수 있습니다.",
      dailyFlow: "규칙을 따르는 것과 스스로의 신념을 확인하는 것 사이에서 고민이 생깁니다.",
      advice: "관습을 무조건 거부하거나 따르기보다 지금의 의미를 점검하세요.",
    },
    contexts: {
      love: "공식적인 약속이나 관계의 가치관을 확인하는 흐름입니다.",
      career: "교육, 자격, 멘토링, 조직 절차가 중요한 단서가 될 수 있습니다.",
      money: "전문가 조언과 검증된 방식이 안정감을 줄 수 있습니다.",
      general: "혼자만의 판단보다 전통과 배움의 틀을 활용하라는 카드입니다.",
    },
  },
  {
    id: 6,
    roman: "VI",
    slug: "the-lovers",
    nameEn: "THE LOVERS",
    nameKo: "연인",
    image: manyangAssets.tarot.major.lovers,
    keywords: ["사랑", "선택", "결합", "가치관"],
    visualSymbols: ["두 인물", "천사", "나무", "빛의 축복"],
    mood: "마음의 끌림과 가치의 선택이 함께 드러나는 연결의 분위기입니다.",
    upright: {
      summary: "관계나 선택에서 진심과 가치관의 일치가 중요해지는 흐름입니다.",
      dailyFlow: "무엇을 고를지보다 무엇과 연결되고 싶은지 묻는 장면이 생길 수 있습니다.",
      advice: "끌림만 보지 말고 선택이 지지하는 가치와 책임을 함께 확인하세요.",
    },
    reversed: {
      summary: "마음과 선택이 어긋나거나 관계 안의 불균형이 느껴질 수 있습니다.",
      dailyFlow: "결정을 미루거나 상대에게 맞추기만 하면 피로가 쌓일 수 있습니다.",
      advice: "관계의 조화보다 먼저 자신의 기준과 진심을 선명하게 정리하세요.",
    },
    contexts: {
      love: "강한 끌림과 관계의 선택이 함께 놓인 흐름입니다.",
      career: "협업이나 파트너십에서 가치관의 일치가 중요합니다.",
      money: "공동 결정이나 계약에서 서로의 기준을 분명히 해야 합니다.",
      general: "선택의 표면보다 그 선택이 연결하는 가치를 보라는 카드입니다.",
    },
  },
  {
    id: 7,
    roman: "VII",
    slug: "the-chariot",
    nameEn: "THE CHARIOT",
    nameKo: "전차",
    image: manyangAssets.tarot.major.chariot,
    keywords: ["전진", "승리", "의지", "방향성"],
    visualSymbols: ["전차", "흑백 스핑크스", "갑옷", "도시의 문"],
    mood: "상반된 힘을 한 방향으로 묶어 앞으로 나아가려는 긴장감 있는 분위기입니다.",
    upright: {
      summary: "목표를 정하고 집중하면 상황을 추진할 수 있는 흐름입니다.",
      dailyFlow: "여러 요구가 동시에 와도 우선순위를 잡으면 움직임이 빨라집니다.",
      advice: "방향을 분명히 하고 감정과 행동을 같은 목표에 맞춰 보세요.",
    },
    reversed: {
      summary: "방향을 잃거나 지나친 힘으로 상황을 밀어붙일 수 있습니다.",
      dailyFlow: "서두르는 마음 때문에 세부 조율이 빠질 수 있어 속도 조절이 필요합니다.",
      advice: "목표와 동기를 다시 확인하고 불필요한 경쟁심은 내려놓으세요.",
    },
    contexts: {
      love: "관계를 바꾸거나 이끌고 싶은 의지가 강해질 수 있습니다.",
      career: "경쟁, 프로젝트 추진, 목표 달성의 흐름과 맞닿아 있습니다.",
      money: "공격적인 전략보다 방향과 리스크 관리가 중요합니다.",
      general: "흔들리는 힘을 모아 앞으로 나아가라는 카드입니다.",
    },
  },
  {
    id: 8,
    roman: "VIII",
    slug: "strength",
    nameEn: "STRENGTH",
    nameKo: "힘",
    image: manyangAssets.tarot.major.strength,
    keywords: ["내면의 힘", "용기", "인내", "부드러운 통제"],
    visualSymbols: ["사자", "여인", "무한대 기호", "꽃장식"],
    mood: "거친 힘을 누르기보다 부드럽게 다스리는 용기의 분위기입니다.",
    upright: {
      summary: "인내와 다정한 통제로 어려운 감정이나 상황을 다룰 수 있는 흐름입니다.",
      dailyFlow: "강한 반응보다 안정된 태도가 더 큰 영향력을 만들 수 있습니다.",
      advice: "상대를 이기려 하기보다 자신 안의 힘을 부드럽게 길들여 보세요.",
    },
    reversed: {
      summary: "자신감 부족이나 억눌린 감정이 갑작스럽게 드러날 수 있습니다.",
      dailyFlow: "참기만 하거나 반대로 폭발하지 않도록 감정의 출구를 마련해야 합니다.",
      advice: "약함을 탓하지 말고 회복 가능한 리듬과 지지 기반을 먼저 찾으세요.",
    },
    contexts: {
      love: "이해와 인내가 관계를 안정시키는 흐름입니다.",
      career: "압박 속에서도 꾸준히 버티는 힘이 필요합니다.",
      money: "충동을 조절하고 장기적인 습관을 다듬는 데 초점이 있습니다.",
      general: "진짜 힘은 강압보다 부드러운 자기 조절에서 나온다는 카드입니다.",
    },
  },
  {
    id: 9,
    roman: "IX",
    slug: "the-hermit",
    nameEn: "THE HERMIT",
    nameKo: "은둔자",
    image: manyangAssets.tarot.major.hermit,
    keywords: ["고독", "성찰", "지혜", "내면 탐색"],
    visualSymbols: ["등불", "지팡이", "망토", "눈 덮인 산"],
    mood: "소란에서 물러나 내면의 등불로 길을 비추는 고요한 분위기입니다.",
    upright: {
      summary: "혼자만의 성찰과 경험에서 우러난 지혜가 필요한 흐름입니다.",
      dailyFlow: "즉답보다 생각을 정리할 시간을 갖는 편이 더 정확한 판단을 돕습니다.",
      advice: "외부 소음에서 잠시 떨어져 지금의 질문을 깊게 들여다보세요.",
    },
    reversed: {
      summary: "고독이 성찰이 아니라 단절이나 회피로 굳어질 수 있습니다.",
      dailyFlow: "혼자 해결하려는 마음이 강해져 필요한 도움을 놓칠 수 있습니다.",
      advice: "침묵이 길어졌다면 믿을 만한 사람에게 한 가지 질문을 꺼내 보세요.",
    },
    contexts: {
      love: "거리 두기나 관계의 의미를 다시 묻는 시간이 필요할 수 있습니다.",
      career: "전문성, 연구, 독립적인 판단이 중요한 흐름입니다.",
      money: "자료를 검토하고 장기 기준을 세우는 데 어울립니다.",
      general: "답을 밖에서 찾기보다 내면의 등불을 따라가라는 카드입니다.",
    },
  },
  {
    id: 10,
    roman: "X",
    slug: "wheel-of-fortune",
    nameEn: "WHEEL OF FORTUNE",
    nameKo: "운명의 수레바퀴",
    image: manyangAssets.tarot.major.wheelOfFortune,
    keywords: ["변화", "순환", "전환점", "타이밍"],
    visualSymbols: ["회전하는 바퀴", "사방의 존재", "구름", "상징 문자"],
    mood: "고정되어 보이던 흐름이 움직이고 국면이 전환되는 역동적인 분위기입니다.",
    upright: {
      summary: "상황의 주기가 바뀌며 새로운 타이밍이 열릴 수 있는 흐름입니다.",
      dailyFlow: "예상 밖의 변화가 있어도 흐름에 맞춰 유연하게 움직이는 편이 좋습니다.",
      advice: "붙잡기보다 변화를 읽고 지금 올라탈 수 있는 리듬을 찾으세요.",
    },
    reversed: {
      summary: "변화를 거부하거나 타이밍이 어긋나며 같은 패턴이 반복될 수 있습니다.",
      dailyFlow: "계획과 실제 흐름이 달라질 수 있으니 여지를 남겨 두는 것이 좋습니다.",
      advice: "통제할 수 없는 부분은 인정하고 반복되는 선택 패턴을 점검하세요.",
    },
    contexts: {
      love: "관계의 국면이나 만남의 타이밍이 바뀌는 흐름입니다.",
      career: "기회, 이동, 일정 변화처럼 상황의 바퀴가 움직일 수 있습니다.",
      money: "변동성이 있으므로 흐름을 읽되 무리한 확신은 피하는 편이 좋습니다.",
      general: "순환과 타이밍을 의식하며 유연하게 대응하라는 카드입니다.",
    },
  },
  {
    id: 11,
    roman: "XI",
    slug: "justice",
    nameEn: "JUSTICE",
    nameKo: "정의",
    image: manyangAssets.tarot.major.justice,
    keywords: ["균형", "판단", "책임", "진실"],
    visualSymbols: ["저울", "검", "왕좌", "기둥"],
    mood: "감정보다 사실과 원인, 결과를 또렷하게 따져 보는 명료한 분위기입니다.",
    upright: {
      summary: "공정한 판단과 책임 있는 선택이 상황의 균형을 잡는 흐름입니다.",
      dailyFlow: "말과 행동의 결과를 확인하고 기준에 맞춰 정리할 일이 생길 수 있습니다.",
      advice: "감정적 해석보다 사실, 약속, 책임의 범위를 먼저 살피세요.",
    },
    reversed: {
      summary: "불균형한 판단이나 책임 회피가 문제를 흐리게 만들 수 있습니다.",
      dailyFlow: "억울함이나 편견이 커질 수 있으니 자료와 맥락을 다시 확인해야 합니다.",
      advice: "누가 맞는지보다 어떤 기준이 공정한지 먼저 세워 보세요.",
    },
    contexts: {
      love: "관계 안의 약속, 책임, 균형을 점검하는 흐름입니다.",
      career: "계약, 평가, 규정, 의사결정에서 공정성이 중요합니다.",
      money: "수입과 지출, 계약 조건, 책임 범위를 명확히 해야 합니다.",
      general: "원인과 결과를 인정하고 균형 잡힌 결정을 돕는 카드입니다.",
    },
  },
  {
    id: 12,
    roman: "XII",
    slug: "the-hanged-man",
    nameEn: "THE HANGED MAN",
    nameKo: "매달린 사람",
    image: manyangAssets.tarot.major.hangedMan,
    keywords: ["정지", "관점 전환", "수용", "기다림"],
    visualSymbols: ["거꾸로 매달린 인물", "묶인 발", "후광", "나무"],
    mood: "멈춰 있는 듯하지만 시야가 바뀌며 다른 의미가 드러나는 분위기입니다.",
    upright: {
      summary: "억지로 밀기보다 멈춤과 관점 전환이 필요한 흐름입니다.",
      dailyFlow: "진행이 느려져도 그 사이에 다른 해석과 선택지가 보일 수 있습니다.",
      advice: "당장 해결하려는 힘을 내려놓고 상황을 거꾸로 바라보세요.",
    },
    reversed: {
      summary: "의미 없는 희생이나 정체가 길어지며 답답함이 커질 수 있습니다.",
      dailyFlow: "기다림인지 회피인지 구분하지 않으면 에너지가 새어 나가기 쉽습니다.",
      advice: "멈춤의 이유를 묻고 필요 없는 희생은 더 이어가지 마세요.",
    },
    contexts: {
      love: "관계가 정체되거나 서로를 다른 각도에서 볼 시간이 필요합니다.",
      career: "진행 지연 속에서 방향 재검토와 전략 수정이 중요합니다.",
      money: "결정을 보류하고 조건을 다시 보는 편이 어울립니다.",
      general: "움직임보다 관점의 변화가 먼저라는 카드입니다.",
    },
  },
  {
    id: 13,
    roman: "XIII",
    slug: "death",
    nameEn: "DEATH",
    nameKo: "죽음",
    image: manyangAssets.tarot.major.death,
    keywords: ["끝", "변화", "전환", "해방"],
    visualSymbols: ["해골 기사", "흰 말", "검은 깃발", "떠오르는 태양"],
    mood: "두려움보다 오래된 장의 종료와 다음 단계의 여지를 보여 주는 분위기입니다.",
    upright: {
      summary: "끝나야 할 것을 끝내며 새로운 전환을 맞이하는 흐름입니다.",
      dailyFlow: "붙잡던 습관이나 계획을 정리하면 더 가벼운 선택지가 보일 수 있습니다.",
      advice: "상실로만 보지 말고 비워진 자리에 생길 변화를 살펴보세요.",
    },
    reversed: {
      summary: "끝난 흐름을 붙잡거나 변화를 미루며 피로가 반복될 수 있습니다.",
      dailyFlow: "작은 정리를 미루면 같은 문제를 다시 확인하게 될 수 있습니다.",
      advice: "한 번에 모두 바꾸기보다 놓아야 할 한 가지를 분명히 정하세요.",
    },
    contexts: {
      love: "관계의 낡은 방식이 끝나거나 새로운 형태로 전환될 수 있습니다.",
      career: "역할, 프로젝트, 방향의 종료와 재편을 상징합니다.",
      money: "오래된 지출 습관이나 구조를 정리할 필요가 있습니다.",
      general: "끝은 단절만이 아니라 다음 흐름을 위한 정리라는 카드입니다.",
    },
  },
  {
    id: 14,
    roman: "XIV",
    slug: "temperance",
    nameEn: "TEMPERANCE",
    nameKo: "절제",
    image: manyangAssets.tarot.major.temperance,
    keywords: ["조화", "치유", "균형", "통합"],
    visualSymbols: ["천사", "두 컵", "흐르는 물", "한 발은 물속"],
    mood: "서로 다른 요소의 비율을 맞춰 균형을 회복하는 치유의 분위기입니다.",
    upright: {
      summary: "극단보다 조율과 통합을 통해 안정되는 흐름입니다.",
      dailyFlow: "급한 결론보다 속도와 양을 맞추는 조정이 좋은 결과를 돕습니다.",
      advice: "서두르지 말고 서로 다른 필요를 조금씩 섞어 균형점을 찾으세요.",
    },
    reversed: {
      summary: "과하거나 부족한 리듬 때문에 조화가 깨질 수 있습니다.",
      dailyFlow: "일정, 감정, 소비 중 한쪽으로 치우친 부분을 알아차릴 필요가 있습니다.",
      advice: "무리한 절충보다 지금 가장 불균형한 지점을 먼저 조정하세요.",
    },
    contexts: {
      love: "관계 회복과 서로의 속도를 맞춰 가는 흐름에 어울립니다.",
      career: "협업, 일정 조율, 프로세스 개선이 중요합니다.",
      money: "수입과 지출의 균형을 회복하고 과한 선택을 줄이는 카드입니다.",
      general: "극단보다 조화로운 통합을 권하는 카드입니다.",
    },
  },
  {
    id: 15,
    roman: "XV",
    slug: "the-devil",
    nameEn: "THE DEVIL",
    nameKo: "악마",
    image: manyangAssets.tarot.major.devil,
    keywords: ["집착", "유혹", "속박", "그림자"],
    visualSymbols: ["묶인 인물", "사슬", "어둠의 제단", "뿔 달린 존재"],
    mood: "강한 끌림과 속박의 감각이 동시에 느껴지는 무거운 분위기입니다.",
    upright: {
      summary: "무엇이 나를 묶고 있는지 직시해야 하는 흐름입니다.",
      dailyFlow: "습관, 욕망, 의존의 패턴이 선명하게 보일 수 있습니다.",
      advice: "탓하기보다 반복되는 끌림과 대가를 정직하게 적어 보세요.",
    },
    reversed: {
      summary: "속박을 알아차리고 조금씩 벗어날 가능성이 생기는 흐름입니다.",
      dailyFlow: "오래된 패턴을 끊고 싶은 마음이 올라오지만 작은 실천이 중요합니다.",
      advice: "한 번의 결심보다 접근 가능한 거리 두기와 도움 요청을 선택하세요.",
    },
    contexts: {
      love: "강한 끌림 속에 의존, 질투, 불균형이 함께 있는지 살펴야 합니다.",
      career: "성과나 권력에 과하게 묶여 있는 구조를 확인하는 흐름입니다.",
      money: "욕망 기반 소비나 반복되는 재정 습관을 점검할 필요가 있습니다.",
      general: "그림자를 외면하지 않고 묶인 지점을 보는 카드입니다.",
    },
  },
  {
    id: 16,
    roman: "XVI",
    slug: "the-tower",
    nameEn: "THE TOWER",
    nameKo: "탑",
    image: manyangAssets.tarot.major.tower,
    keywords: ["붕괴", "충격", "각성", "재건"],
    visualSymbols: ["번개", "무너지는 탑", "떨어지는 인물", "불꽃"],
    mood: "불편하지만 오래된 구조를 다시 보게 만드는 강한 변화의 분위기입니다.",
    upright: {
      summary: "취약한 구조가 드러나며 재점검과 재건이 필요한 흐름입니다.",
      dailyFlow: "예상 밖의 소식이나 깨달음이 계획을 수정하게 만들 수 있습니다.",
      advice: "무너지는 부분을 붙잡기보다 무엇을 새로 세울지 살피세요.",
    },
    reversed: {
      summary: "변화의 신호를 알면서도 미루거나 내부 균열을 감추기 쉽습니다.",
      dailyFlow: "큰 충돌 전에 작은 경고를 알아차리고 조정할 여지가 있습니다.",
      advice: "불편한 사실을 피하지 말고 점검 가능한 부분부터 고쳐 보세요.",
    },
    contexts: {
      love: "관계의 숨은 문제가 드러나며 구조를 다시 봐야 할 수 있습니다.",
      career: "계획 수정, 시스템 문제, 조직 변화의 신호로 읽을 수 있습니다.",
      money: "리스크 노출과 안전장치 점검이 필요한 흐름입니다.",
      general: "붕괴 자체보다 그 뒤의 재건 가능성을 보라는 카드입니다.",
    },
  },
  {
    id: 17,
    roman: "XVII",
    slug: "the-star",
    nameEn: "THE STAR",
    nameKo: "별",
    image: manyangAssets.tarot.major.star,
    keywords: ["희망", "치유", "회복", "영감"],
    visualSymbols: ["큰 별", "물 붓는 인물", "작은 별들", "고요한 물"],
    mood: "어둠 뒤에 맑은 가능성과 회복의 숨이 다시 들어오는 분위기입니다.",
    upright: {
      summary: "희망과 치유가 다시 살아나며 미래 감각이 맑아지는 흐름입니다.",
      dailyFlow: "큰 성과보다 마음을 다시 열게 하는 작은 신호가 중요할 수 있습니다.",
      advice: "지금 보이는 작은 가능성을 돌보고 회복의 리듬을 믿어 보세요.",
    },
    reversed: {
      summary: "희망을 잃거나 회복이 더디게 느껴져 자기 불신이 커질 수 있습니다.",
      dailyFlow: "밝은 신호를 보아도 쉽게 믿기 어려운 마음이 올라올 수 있습니다.",
      advice: "거창한 확신보다 오늘 회복에 도움이 되는 일 하나를 선택하세요.",
    },
    contexts: {
      love: "신뢰 회복과 맑은 가능성을 다시 보는 흐름입니다.",
      career: "비전, 영감, 장기 방향을 회복하는 데 도움이 됩니다.",
      money: "즉각적인 확정보다 안정적인 개선 가능성에 초점이 있습니다.",
      general: "상처 이후에도 희망을 다시 돌볼 수 있음을 보여 주는 카드입니다.",
    },
  },
  {
    id: 18,
    roman: "XVIII",
    slug: "the-moon",
    nameEn: "THE MOON",
    nameKo: "달",
    image: manyangAssets.tarot.major.moon,
    keywords: ["불안", "환상", "무의식", "혼란"],
    visualSymbols: ["달", "개와 늑대", "물가의 가재", "안개 낀 길"],
    mood: "분명하지 않은 밤길처럼 직감과 착각이 함께 떠오르는 몽환적인 분위기입니다.",
    upright: {
      summary: "정보가 흐릿하고 감춰진 감정이나 불안이 영향을 주는 흐름입니다.",
      dailyFlow: "확신이 부족한 상태에서는 판단을 미루고 관찰하는 편이 좋습니다.",
      advice: "불안을 사실로 단정하지 말고 확인 가능한 단서를 따로 모아 보세요.",
    },
    reversed: {
      summary: "혼란의 원인이 조금씩 드러나거나 자기기만에서 벗어날 여지가 생깁니다.",
      dailyFlow: "막연한 두려움이 이름을 얻으면서 정리될 수 있는 흐름입니다.",
      advice: "감정을 숨기기보다 적어 보고 사실과 상상을 분리해 보세요.",
    },
    contexts: {
      love: "오해, 숨은 감정, 불안정한 신호를 조심스럽게 살펴야 합니다.",
      career: "정보 부족이나 불명확한 계획 속에서 섣부른 판단은 피하는 편이 좋습니다.",
      money: "조건이 흐릿한 거래나 막연한 기대를 세부적으로 확인해야 합니다.",
      general: "밤길을 걷듯 감정과 사실을 나누어 보라는 카드입니다.",
    },
  },
  {
    id: 19,
    roman: "XIX",
    slug: "the-sun",
    nameEn: "THE SUN",
    nameKo: "해",
    image: manyangAssets.tarot.major.sun,
    keywords: ["명확함", "생명력", "기쁨", "성취"],
    visualSymbols: ["밝은 태양", "아이", "흰 말", "해바라기"],
    mood: "숨겨진 것이 밝게 드러나고 생명력이 회복되는 환한 분위기입니다.",
    upright: {
      summary: "명확함과 활력이 돌아오며 긍정적인 표현이 쉬워지는 흐름입니다.",
      dailyFlow: "솔직하게 드러내고 함께 나눌수록 일이 밝아질 수 있습니다.",
      advice: "기쁨을 축소하지 말고 가능한 만큼 밝게 표현해 보세요.",
    },
    reversed: {
      summary: "기쁨이 지연되거나 자신감이 완전히 올라오지 못할 수 있습니다.",
      dailyFlow: "좋은 신호가 있어도 피로감 때문에 온전히 받아들이기 어려울 수 있습니다.",
      advice: "완벽한 확신을 기다리기보다 작은 성취를 인정하는 연습을 하세요.",
    },
    contexts: {
      love: "솔직함과 따뜻한 표현이 관계를 밝게 만드는 흐름입니다.",
      career: "성과, 인정, 공개적인 결과와 연결될 수 있습니다.",
      money: "긍정적인 개선 가능성이 보이지만 세부 확인은 계속 필요합니다.",
      general: "명확함과 생명력으로 현재를 환하게 비추는 카드입니다.",
    },
  },
  {
    id: 20,
    roman: "XX",
    slug: "judgement",
    nameEn: "JUDGEMENT",
    nameKo: "심판",
    image: manyangAssets.tarot.major.judgement,
    keywords: ["각성", "부름", "재평가", "새로운 단계"],
    visualSymbols: ["나팔 부는 천사", "깨어나는 사람들", "빛", "관"],
    mood: "지나온 시간을 돌아보고 더 큰 부름에 응답하려는 각성의 분위기입니다.",
    upright: {
      summary: "과거를 재평가하고 새로운 단계로 응답할 준비가 되는 흐름입니다.",
      dailyFlow: "미뤄 둔 결정이나 정리해야 할 일이 다시 의미 있게 떠오를 수 있습니다.",
      advice: "자책보다 배움을 정리하고 지금의 부름에 응답해 보세요.",
    },
    reversed: {
      summary: "결정을 미루거나 자기비판에 묶여 다음 단계로 나아가기 어려울 수 있습니다.",
      dailyFlow: "예전 선택을 반복해서 떠올리며 현재의 응답을 늦출 수 있습니다.",
      advice: "과거를 판결문처럼 붙잡지 말고 배운 점과 다음 행동을 분리하세요.",
    },
    contexts: {
      love: "관계의 과거를 다시 보고 새롭게 응답할 지점을 묻는 흐름입니다.",
      career: "평가, 전환, 소명감, 재도전의 신호로 읽을 수 있습니다.",
      money: "지난 재정 선택을 정리하고 새로운 기준을 세우는 데 어울립니다.",
      general: "과거를 정리하고 더 성숙한 응답을 선택하라는 카드입니다.",
    },
  },
  {
    id: 21,
    roman: "XXI",
    slug: "the-world",
    nameEn: "THE WORLD",
    nameKo: "세계",
    image: manyangAssets.tarot.major.world,
    keywords: ["완성", "통합", "성취", "조화"],
    visualSymbols: ["월계관", "춤추는 인물", "네 상징 존재", "완성의 고리"],
    mood: "긴 여정이 하나의 고리로 완성되고 다음 순환이 보이는 조화로운 분위기입니다.",
    upright: {
      summary: "한 주기나 과제가 통합되며 완성의 감각을 얻는 흐름입니다.",
      dailyFlow: "마무리와 정리가 잘 맞아떨어지고 다음 단계의 윤곽이 보일 수 있습니다.",
      advice: "완성한 것을 인정하고 배운 내용을 다음 순환의 기반으로 삼으세요.",
    },
    reversed: {
      summary: "마지막 정리나 인정이 늦어져 완성감이 흐려질 수 있습니다.",
      dailyFlow: "거의 끝난 일을 마무리하지 못해 에너지가 흩어질 수 있습니다.",
      advice: "완벽을 기다리기보다 닫아야 할 고리를 하나씩 정리하세요.",
    },
    contexts: {
      love: "관계가 한 단계 안정되거나 중요한 주기를 마무리하는 흐름입니다.",
      career: "프로젝트 완료, 성취, 확장 가능성을 상징합니다.",
      money: "재정 목표의 마무리나 전체 구조 점검에 어울립니다.",
      general: "완성과 통합을 인정하고 다음 여정으로 넘어가라는 카드입니다.",
    },
  },
] as const satisfies readonly TarotMajorCardBase[];

const tarotMajorCardReferenceAdditions = {
  "the-fool": {
    symbolMeanings: [
      {
        symbol: "절벽 끝의 여행자",
        meaning: "아직 길이 모두 보이지 않아도 첫걸음을 내딛는 순수한 용기와 미숙함을 함께 비춥니다.",
      },
      {
        symbol: "작은 보따리",
        meaning: "지금 필요한 것은 완벽한 준비보다 꼭 필요한 감각과 경험이라는 뜻을 품고 있습니다.",
      },
      {
        symbol: "흰 꽃",
        meaning: "계산보다 열린 마음으로 시작할 때 새로운 가능성이 살아난다는 신호입니다.",
      },
    ],
    upright: {
      story: "바보는 세상이 정한 순서를 다 알기 전에 길 위에 서는 사람의 이야기입니다. 두려움보다 호기심이 앞서고, 미숙함마저 새로운 장면을 여는 힘이 됩니다.",
      reflectionQuestion: "오늘 나는 어떤 일을 완벽히 준비되기 전에 작게 시작해볼 수 있을까요?",
      smallAction: "망설이던 일은 가장 쉬운 첫 단계만 오늘 시작하세요.",
    },
    reversed: {
      story: "역방향의 바보는 설렘이 방향을 잃거나 준비 없는 충동으로 흐르는 장면을 보여줍니다. 가능성은 살아 있지만, 발밑을 보지 않으면 같은 실수를 반복하기 쉽습니다.",
      reflectionQuestion: "나는 지금 자유를 선택하는 걸까요, 확인해야 할 일을 피하는 걸까요?",
      smallAction: "움직이기 전에 필요한 조건 하나와 멈춰야 할 신호 하나를 적어두세요.",
    },
  },
  "the-magician": {
    symbolMeanings: [
      {
        symbol: "위와 아래를 잇는 손짓",
        meaning: "생각과 현실, 영감과 실행을 연결해 실제 결과로 바꾸는 의지를 뜻합니다.",
      },
      {
        symbol: "무한대 기호",
        meaning: "이미 가진 가능성이 반복적으로 새 형태를 만들 수 있다는 창조의 흐름입니다.",
      },
      {
        symbol: "네 가지 도구",
        meaning: "말, 감정, 행동, 현실 자원을 한곳에 모을 때 일이 구체화된다는 단서입니다.",
      },
    ],
    upright: {
      story: "마법사는 손에 있는 도구를 알아보고 그것을 현실의 형태로 조합하는 사람입니다. 특별한 운을 기다리기보다 지금 가진 기술과 말, 시간과 집중을 써서 장면을 바꿉니다.",
      reflectionQuestion: "오늘 내가 이미 가지고 있는데 아직 제대로 쓰지 않은 도구는 무엇일까요?",
      smallAction: "생각만 하던 일은 오늘 할 한 가지로 바꿔 적어두세요.",
    },
    reversed: {
      story: "역방향의 마법사는 능력은 있지만 방향이 흩어지거나 말과 행동이 어긋나는 모습을 비춥니다. 힘이 없는 것이 아니라 힘을 어디에 쓸지 정하지 못한 상태에 가깝습니다.",
      reflectionQuestion: "나는 지금 보여주고 싶은 모습과 실제 행동을 같은 방향에 두고 있을까요?",
      smallAction: "오늘 할 일을 하나만 남기고, 그 일에 필요한 도구와 시간을 먼저 확보하세요.",
    },
  },
  "the-high-priestess": {
    symbolMeanings: [
      {
        symbol: "두 기둥",
        meaning: "드러난 사실과 숨은 감각 사이의 균형을 지키며 판단해야 한다는 뜻입니다.",
      },
      {
        symbol: "베일",
        meaning: "아직 모두 공개되지 않은 정보와 시간을 두고 드러나는 진실을 상징합니다.",
      },
      {
        symbol: "책",
        meaning: "바깥의 소음보다 겉으로 드러나지 않게 쌓인 지혜와 관찰이 더 중요하다는 신호입니다.",
      },
    ],
    upright: {
      story: "여사제는 바로 말하지 않고 먼저 듣는 카드입니다. 지금 보이는 사건 너머에 숨은 흐름이 있으며, 몸 안의 감각과 반복되는 단서를 따라갈 때 답이 가까워집니다.",
      reflectionQuestion: "오늘 내 안에서 작지만 계속 반복되는 느낌은 무엇을 말하고 있을까요?",
      smallAction: "결론은 잠시 미루고, 확인한 사실과 느낌을 따로 적어두세요.",
    },
    reversed: {
      story: "역방향의 여사제는 직감을 무시하거나 반대로 불안을 직감으로 착각하는 장면을 비춥니다. 침묵이 지혜가 되려면 회피가 아니라 사실 확인으로 이어져야 합니다.",
      reflectionQuestion: "내가 알고 있다고 믿는 것 중 실제로 확인한 것은 어디까지일까요?",
      smallAction: "추측을 사실처럼 다루지 말고, 지금 확인해야 할 질문 하나만 적어두세요.",
    },
  },
  "the-empress": {
    symbolMeanings: [
      {
        symbol: "풍성한 정원",
        meaning: "억지로 밀어붙이기보다 잘 자랄 환경을 마련할 때 성장한다는 뜻입니다.",
      },
      {
        symbol: "곡식",
        meaning: "이미 돌본 것들이 서서히 결실을 맺고 있음을 보여주는 풍요의 단서입니다.",
      },
      {
        symbol: "비너스 상징",
        meaning: "관계, 감각, 아름다움, 애정이 삶의 에너지를 되살리는 흐름입니다.",
      },
    ],
    upright: {
      story: "여황제는 씨앗을 억지로 당기지 않고 자랄 수 있는 온도와 흙을 만드는 카드입니다. 돌봄, 감각, 창작이 삶을 풍성하게 만들고, 몸이 보내는 신호도 중요한 안내가 됩니다.",
      reflectionQuestion: "오늘 내가 키우고 싶은 것은 더 많은 압박이 아니라 어떤 돌봄을 필요로 할까요?",
      smallAction: "공간이나 관계 하나에 정성을 조금 더하고, 몸이 편안한 쪽을 선택하세요.",
    },
    reversed: {
      story: "역방향의 여황제는 돌봄이 과잉이 되거나 풍요가 소비와 의존으로 흐르는 모습을 비춥니다. 무언가를 키우려면 주는 마음만큼 경계와 회복도 필요합니다.",
      reflectionQuestion: "나는 지금 돌보고 있는 걸까요, 지쳐도 계속 내어주고 있는 걸까요?",
      smallAction: "오늘 챙길 것 하나와 내려놓을 책임 하나를 따로 적어두세요.",
    },
  },
  "the-emperor": {
    symbolMeanings: [
      {
        symbol: "왕좌",
        meaning: "감정보다 기준과 구조를 세워 상황을 안정시키는 책임을 뜻합니다.",
      },
      {
        symbol: "갑옷",
        meaning: "부드러움만으로는 지키기 어려운 영역에 필요한 보호와 결단을 비춥니다.",
      },
      {
        symbol: "산",
        meaning: "쉽게 흔들리지 않는 원칙과 장기적으로 버티는 힘을 상징합니다.",
      },
    ],
    upright: {
      story: "황제는 흐트러진 것을 구조로 세우고 책임을 회피하지 않는 카드입니다. 감정의 파도 속에서도 무엇을 지켜야 하는지 정하면 상황은 더 단단해집니다.",
      reflectionQuestion: "오늘 내가 분명히 정해야 할 기준이나 경계는 무엇일까요?",
      smallAction: "미뤄둔 결정 하나에 기준을 세우고, 그 기준에 맞는 다음 행동을 정하세요.",
    },
    reversed: {
      story: "역방향의 황제는 통제가 지나치거나 반대로 책임의 중심이 약해진 장면을 보여줍니다. 권위는 누르는 힘이 아니라 지켜야 할 것을 안정시키는 힘이어야 합니다.",
      reflectionQuestion: "나는 지금 질서를 세우고 있을까요, 불안을 통제로 덮고 있을까요?",
      smallAction: "강하게 밀어붙이기 전, 상대와 상황이 받아들일 규칙 하나만 정해두세요.",
    },
  },
  "the-hierophant": {
    symbolMeanings: [
      {
        symbol: "사제",
        meaning: "개인적 판단만이 아니라 오래 검증된 기준과 배움의 길을 뜻합니다.",
      },
      {
        symbol: "두 제자",
        meaning: "혼자 깨닫기보다 배우고 묻고 전해 받는 과정을 통해 안정된다는 신호입니다.",
      },
      {
        symbol: "열쇠",
        meaning: "닫힌 문제를 여는 것은 즉흥이 아니라 원리와 절차를 이해하는 데 있습니다.",
      },
    ],
    upright: {
      story: "교황은 전통, 배움, 공동체의 규칙을 통해 혼란을 정리하는 카드입니다. 오늘은 혼자만의 방식보다 이미 검증된 지식과 신뢰할 만한 조언이 길을 열 수 있습니다.",
      reflectionQuestion: "오늘 내가 혼자 판단하기보다 배워야 할 기준은 무엇일까요?",
      smallAction: "믿을 만한 자료나 사람에게 확인할 질문 하나를 정해두세요.",
    },
    reversed: {
      story: "역방향의 교황은 규칙을 따르기만 하거나 반대로 모든 기준을 거부하는 극단을 비춥니다. 필요한 것은 맹목이 아니라 내 삶에 맞는 원칙을 다시 세우는 일입니다.",
      reflectionQuestion: "내가 따르는 규칙은 나를 돕고 있을까요, 생각을 멈추게 하고 있을까요?",
      smallAction: "당연하게 받아들인 기준 하나를 골라 지금도 유효한지 다시 검토하세요.",
    },
  },
  "the-lovers": {
    symbolMeanings: [
      {
        symbol: "두 인물",
        meaning: "관계와 선택이 서로를 비추며 진짜 가치관을 드러내는 장면입니다.",
      },
      {
        symbol: "천사",
        meaning: "순간의 끌림 너머에 더 큰 조화와 진실한 마음을 묻는 상징입니다.",
      },
      {
        symbol: "나무",
        meaning: "선택이 단순한 감정이 아니라 앞으로 자라날 삶의 기반이 된다는 뜻입니다.",
      },
    ],
    upright: {
      story: "연인은 사랑만이 아니라 마음이 향하는 가치와 선택을 말하는 카드입니다. 누구를 향하는지, 무엇을 선택하는지에 따라 자신이 어떤 사람인지 더 선명해집니다.",
      reflectionQuestion: "오늘 내 선택은 내가 중요하게 여기는 가치와 같은 방향에 있을까요?",
      smallAction: "결정하기 전, 끌리는 이유와 지켜야 할 가치를 따로 적어두세요.",
    },
    reversed: {
      story: "역방향의 연인은 마음과 선택이 어긋나거나 관계 안에서 균형이 흐려지는 장면을 비춥니다. 끌림만으로 충분하지 않고, 솔직한 기준과 책임이 필요합니다.",
      reflectionQuestion: "나는 지금 관계나 선택 안에서 나의 기준을 흐리고 있지 않을까요?",
      smallAction: "말하지 못한 기대나 불편함 하나를 먼저 스스로에게 정확히 말하세요.",
    },
  },
  "the-chariot": {
    symbolMeanings: [
      {
        symbol: "전차",
        meaning: "상황을 기다리기보다 방향을 정하고 앞으로 밀고 가는 추진력을 뜻합니다.",
      },
      {
        symbol: "흑백 스핑크스",
        meaning: "상반된 욕구와 조건을 한 방향으로 조율해야 전진할 수 있음을 보여줍니다.",
      },
      {
        symbol: "갑옷",
        meaning: "감정에 휩쓸리지 않고 목표를 지키기 위한 집중과 방어를 뜻합니다.",
      },
    ],
    upright: {
      story: "전차는 혼란스러운 힘들을 하나의 방향으로 묶어 전진하는 카드입니다. 완벽한 조건보다 분명한 목적과 통제된 속도가 승리의 감각을 만들어냅니다.",
      reflectionQuestion: "오늘 내가 집중해야 할 목적지는 어디이며, 무엇이 방향을 흐리고 있을까요?",
      smallAction: "오늘의 목표를 하나로 좁히고 방해 요소 하나를 미리 치워두세요.",
    },
    reversed: {
      story: "역방향의 전차는 속도는 있지만 방향이 흔들리거나 통제력을 잃은 상태를 비춥니다. 이길 수 있는 에너지가 있어도 고삐를 잡지 않으면 소모로 바뀔 수 있습니다.",
      reflectionQuestion: "나는 지금 앞으로 가고 있나요, 아니면 바쁘게 흔들리고 있나요?",
      smallAction: "오늘은 목표를 하나만 남기고 나머지는 잠시 미루세요.",
    },
  },
  strength: {
    symbolMeanings: [
      {
        symbol: "사자",
        meaning: "거칠고 본능적인 에너지를 억누르기보다 이해하고 다루는 힘을 뜻합니다.",
      },
      {
        symbol: "여인",
        meaning: "부드러움과 인내가 강압보다 더 깊은 통제력을 만든다는 상징입니다.",
      },
      {
        symbol: "무한대 기호",
        meaning: "내면의 힘은 한 번의 결심이 아니라 반복해서 자신을 돌보는 리듬입니다.",
      },
    ],
    upright: {
      story: "힘 카드는 요란한 승리가 아니라 자기 안의 힘을 다루는 용기를 말합니다. 감정을 없애는 것이 아니라 감정과 함께 있어도 무너지지 않는 힘입니다.",
      reflectionQuestion: "오늘 나는 어떤 감정을 힘으로 바꾸기 위해 부드럽게 다뤄야 할까요?",
      smallAction: "반응하기 전에 한 번 숨을 고르고, 가장 부드러운 표현으로 의사를 전하세요.",
    },
    reversed: {
      story: "역방향의 힘은 자신감이 약해지거나 억눌린 감정이 엉뚱한 곳에서 터지는 장면을 비춥니다. 강해지려 하기보다 먼저 지친 마음을 알아차려야 합니다.",
      reflectionQuestion: "나는 지금 참는 것을 힘이라고 착각하고 있지 않을까요?",
      smallAction: "오늘 무리한 약속 하나를 줄이고, 에너지를 회복할 시간을 확보하세요.",
    },
  },
  "the-hermit": {
    symbolMeanings: [
      {
        symbol: "등불",
        meaning: "멀리 있는 답보다 지금 한 걸음 앞을 비추는 내면의 지혜를 뜻합니다.",
      },
      {
        symbol: "지팡이",
        meaning: "혼자 걷는 길에서도 버틸 수 있게 해주는 경험과 기준을 상징합니다.",
      },
      {
        symbol: "눈 덮인 산",
        meaning: "고요하고 외로운 시간 속에서 깊은 통찰이 자라난다는 단서입니다.",
      },
    ],
    upright: {
      story: "은둔자는 바깥의 소리를 잠시 낮추고 자기 안의 등불을 확인하는 카드입니다. 빠른 답보다 깊은 이해가 필요할 때, 혼자 있는 시간이 방향을 되찾게 합니다.",
      reflectionQuestion: "오늘 나는 누구의 목소리가 아니라 내 안의 어떤 기준을 들어야 할까요?",
      smallAction: "알림과 소음을 잠시 줄이고, 혼자 생각할 수 있는 짧은 시간을 만드세요.",
    },
    reversed: {
      story: "역방향의 은둔자는 필요한 고독이 고립으로 변하거나, 혼자 고민하다 길을 잃는 장면을 보여줍니다. 내면을 보는 일과 도움을 거절하는 일은 다릅니다.",
      reflectionQuestion: "나는 지금 성찰하고 있나요, 아니면 연결을 피하고 있나요?",
      smallAction: "혼자 정리한 생각은 믿을 만한 사람 한 명에게 짧게 공유하세요.",
    },
  },
  "wheel-of-fortune": {
    symbolMeanings: [
      {
        symbol: "회전하는 바퀴",
        meaning: "상황은 고정되어 있지 않고 흐름과 타이밍에 따라 계속 바뀐다는 뜻입니다.",
      },
      {
        symbol: "사방의 존재",
        meaning: "변화 속에서도 지켜야 할 배움과 균형의 기준을 상징합니다.",
      },
      {
        symbol: "구름",
        meaning: "지금 보이는 불확실성 뒤에 새로운 국면이 열리고 있음을 비춥니다.",
      },
    ],
    upright: {
      story: "운명의 수레바퀴는 삶이 같은 자리에 멈춰 있지 않다는 사실을 보여줍니다. 통제할 수 없는 변화가 오더라도 흐름을 읽으면 기회가 되는 지점이 보입니다.",
      reflectionQuestion: "오늘 내 힘으로 바꿀 수 없는 흐름과 내가 잡을 수 있는 기회는 무엇일까요?",
      smallAction: "변수 하나를 억지로 막기보다, 그 변화에 맞춰 조정할 일을 하나 정하세요.",
    },
    reversed: {
      story: "역방향의 운명의 수레바퀴는 흐름이 막히거나 같은 패턴이 반복되는 장면을 비춥니다. 운이 나쁜 것이 아니라, 반복되는 선택을 알아차릴 시간이 온 것일 수 있습니다.",
      reflectionQuestion: "최근 반복되는 상황 속에서 내가 계속 같은 방식으로 반응하는 부분은 무엇일까요?",
      smallAction: "반복되는 문제 하나에는 평소와 다른 대응을 하나만 선택하세요.",
    },
  },
  justice: {
    symbolMeanings: [
      {
        symbol: "저울",
        meaning: "감정과 사실, 나와 타인의 몫을 공정하게 재야 한다는 뜻입니다.",
      },
      {
        symbol: "검",
        meaning: "흐릿한 상황을 분명히 자르고 책임 있는 결정을 내리는 힘입니다.",
      },
      {
        symbol: "왕좌",
        meaning: "판단은 충동이 아니라 기준과 책임 위에서 내려져야 함을 상징합니다.",
      },
    ],
    upright: {
      story: "정의는 감정의 크기보다 사실과 책임을 분리해서 보라고 말합니다. 선택의 결과를 받아들일 준비가 되어 있을 때 판단은 더 깨끗해집니다.",
      reflectionQuestion: "오늘 내가 공정하게 보려면 어떤 사실과 책임을 함께 놓아야 할까요?",
      smallAction: "결정하기 전, 사실과 감정과 책임을 따로 적어두세요.",
    },
    reversed: {
      story: "역방향의 정의는 불균형한 판단, 회피된 책임, 한쪽으로 기운 기준을 비춥니다. 억울함이나 방어심이 커질수록 사실 확인이 더 중요해집니다.",
      reflectionQuestion: "나는 지금 사실을 보고 있나요, 아니면 내 입장을 지키는 증거만 찾고 있나요?",
      smallAction: "상대나 상황의 입장에서 보이는 사실 한 가지를 일부러 찾아보세요.",
    },
  },
  "the-hanged-man": {
    symbolMeanings: [
      {
        symbol: "거꾸로 매달린 인물",
        meaning: "멈춤이 실패가 아니라 다른 관점에서 상황을 보게 하는 전환임을 뜻합니다.",
      },
      {
        symbol: "묶인 발",
        meaning: "지금은 억지로 움직이기보다 제한 안에서 배울 것을 찾으라는 신호입니다.",
      },
      {
        symbol: "후광",
        meaning: "기다림과 수용 속에서 새로운 이해가 밝아지는 순간을 상징합니다.",
      },
    ],
    upright: {
      story: "매달린 사람은 멈춰 있는 동안 세상이 다르게 보이는 카드입니다. 손쓸 수 없는 시간이 답답하더라도, 관점을 바꾸면 무엇을 내려놓아야 할지 보입니다.",
      reflectionQuestion: "오늘 내가 억지로 밀기보다 다르게 바라봐야 할 문제는 무엇일까요?",
      smallAction: "결론은 하루 미루고, 같은 문제를 반대편 입장에서 써두세요.",
    },
    reversed: {
      story: "역방향의 매달린 사람은 기다림이 배움이 되지 못하고 무기력이나 회피로 굳어지는 장면을 비춥니다. 멈춤에도 의식적인 선택이 필요합니다.",
      reflectionQuestion: "나는 지금 필요한 시간을 보내고 있나요, 아니면 결정을 피하고 있나요?",
      smallAction: "미뤄둔 문제는 오늘 확인할 수 있는 부분 하나만 정하세요.",
    },
  },
  death: {
    symbolMeanings: [
      {
        symbol: "해골 기사",
        meaning: "피할 수 없는 변화가 낡은 형태를 지나 새로운 단계로 이끈다는 뜻입니다.",
      },
      {
        symbol: "흰 말",
        meaning: "끝남 속에도 정화와 다음 이동의 가능성이 함께 있음을 보여줍니다.",
      },
      {
        symbol: "떠오르는 태양",
        meaning: "상실이나 정리 뒤에 새로운 시간이 열린다는 재생의 상징입니다.",
      },
    ],
    upright: {
      story: "죽음 카드는 실제 죽음보다 오래 붙잡은 한 장면의 끝을 말합니다. 끝을 인정할 때 새 흐름이 들어올 자리가 생기며, 변화는 두려움과 해방을 함께 가져옵니다.",
      reflectionQuestion: "오늘 내가 더 이상 예전 방식으로 붙잡지 않아도 되는 것은 무엇일까요?",
      smallAction: "끝났다고 느낀 습관이나 약속 하나는 오늘 정리하세요.",
    },
    reversed: {
      story: "역방향의 죽음은 변화가 이미 필요하지만 마음이 아직 끝을 인정하지 못하는 장면입니다. 미루는 동안 에너지는 새 길로 가지 못하고 과거에 묶일 수 있습니다.",
      reflectionQuestion: "나는 어떤 변화를 알면서도 아직 이름 붙이지 못하고 있을까요?",
      smallAction: "정리해야 할 것을 전부 끝내려 하지 말고, 오늘 한 부분만 마무리하세요.",
    },
  },
  temperance: {
    symbolMeanings: [
      {
        symbol: "천사",
        meaning: "서로 다른 것을 부드럽게 중재하고 조화시키는 치유의 힘을 뜻합니다.",
      },
      {
        symbol: "두 컵",
        meaning: "감정과 현실, 속도와 휴식을 오가며 균형을 만드는 과정을 상징합니다.",
      },
      {
        symbol: "흐르는 물",
        meaning: "막힌 것을 억지로 밀기보다 자연스럽게 순환시키라는 단서입니다.",
      },
    ],
    upright: {
      story: "절제는 극단 사이에서 적절한 비율을 찾는 카드입니다. 한쪽으로 몰아붙이기보다 섞고 조율할 때, 흐트러진 마음과 상황이 다시 균형을 찾습니다.",
      reflectionQuestion: "오늘 내 삶에서 너무 많거나 너무 적어진 것은 무엇일까요?",
      smallAction: "오늘 일정에는 회복할 시간을 먼저 넣어두세요.",
    },
    reversed: {
      story: "역방향의 절제는 균형이 깨져 과하거나 부족한 흐름을 보여줍니다. 조급함, 과소비, 과로처럼 한쪽으로 치우친 리듬을 다시 섞어야 합니다.",
      reflectionQuestion: "나는 지금 어떤 부분에서 무리하거나 반대로 너무 방치하고 있을까요?",
      smallAction: "오늘 일정에서 과한 것 하나를 덜고, 회복할 시간을 하나 넣어두세요.",
    },
  },
  "the-devil": {
    symbolMeanings: [
      {
        symbol: "묶인 인물",
        meaning: "벗어날 수 없다고 느끼지만 실제로는 알아차림이 필요한 습관과 의존을 뜻합니다.",
      },
      {
        symbol: "사슬",
        meaning: "반복되는 욕망, 두려움, 집착이 선택의 폭을 좁히는 장면입니다.",
      },
      {
        symbol: "어둠의 제단",
        meaning: "외면한 그림자나 숨은 욕구가 상황을 강하게 끌고 있음을 비춥니다.",
      },
    ],
    upright: {
      story: "악마는 나쁜 존재보다 내가 묶여 있다고 믿는 구조를 보여주는 카드입니다. 욕망, 집착, 두려움을 정직하게 보면 사슬이 어디에 걸려 있는지 알 수 있습니다.",
      reflectionQuestion: "오늘 나는 무엇에 끌려가고 있으며, 그것이 나에게 어떤 대가를 요구할까요?",
      smallAction: "반복되는 충동 하나를 바로 따르지 말고 십 분만 늦춰 몸의 반응을 살피세요.",
    },
    reversed: {
      story: "역방향의 악마는 사슬을 알아차리고 벗어날 틈이 생기는 장면입니다. 아직 완전히 자유롭지 않아도, 패턴을 보는 순간 선택권이 돌아오기 시작합니다.",
      reflectionQuestion: "내가 벗어나고 싶은 반복 중 오늘 가장 작게 끊을 수 있는 부분은 무엇일까요?",
      smallAction: "반복되는 습관 하나는 시간을 정해두고 그 시간만큼 멈추세요.",
    },
  },
  "the-tower": {
    symbolMeanings: [
      {
        symbol: "번개",
        meaning: "피해왔던 진실이나 변화가 갑작스럽게 드러나는 각성의 순간을 뜻합니다.",
      },
      {
        symbol: "무너지는 탑",
        meaning: "불안정한 기반 위에 쌓은 구조가 재정비되어야 함을 보여줍니다.",
      },
      {
        symbol: "떨어지는 인물",
        meaning: "통제하던 위치에서 내려와 현실을 새롭게 마주하는 충격을 상징합니다.",
      },
    ],
    upright: {
      story: "탑은 유지하던 구조가 흔들리며 감춰진 문제가 드러나는 카드입니다. 불편한 변화이지만, 무너지는 것은 대개 오래 버티기 어려웠던 방식입니다.",
      reflectionQuestion: "오늘 어떤 사실이 불편하더라도 더는 모른 척하기 어려울까요?",
      smallAction: "문제 전체보다 가장 흔들리는 부분 하나부터 확인하세요.",
    },
    reversed: {
      story: "역방향의 탑은 큰 붕괴를 피하려는 마음이나 이미 안에서 시작된 균열을 비춥니다. 초기 신호를 무시하지 않으면 변화는 더 덜 거칠게 올 수 있습니다.",
      reflectionQuestion: "나는 어떤 경고 신호를 이미 봤지만 아직 다루지 않고 있을까요?",
      smallAction: "불안한 지점 하나를 점검 목록으로 만들고 오늘 첫 항목만 처리하세요.",
    },
  },
  "the-star": {
    symbolMeanings: [
      {
        symbol: "큰 별",
        meaning: "어둠 속에서도 방향을 잃지 않게 해주는 희망과 회복의 기준입니다.",
      },
      {
        symbol: "물 붓는 인물",
        meaning: "감정을 억누르지 않고 흘려보내며 다시 균형을 회복하는 모습을 뜻합니다.",
      },
      {
        symbol: "고요한 물",
        meaning: "마음의 흐림이 걷힐 때 보이지 않던 가능성이 비친다는 단서입니다.",
      },
    ],
    upright: {
      story: "별은 큰 확신보다 작고 맑은 희망이 돌아오는 카드입니다. 상처가 단번에 사라지지는 않아도, 마음은 다시 빛을 받아들일 준비를 시작합니다.",
      reflectionQuestion: "오늘 내 마음을 조금이라도 맑게 해주는 작은 신호는 무엇일까요?",
      smallAction: "오늘 마음이 편해지는 루틴 하나를 다시 하세요.",
    },
    reversed: {
      story: "역방향의 별은 희망이 멀게 느껴지거나 회복의 신호를 쉽게 믿지 못하는 장면을 비춥니다. 그래도 빛은 사라진 것이 아니라 아직 눈이 어둠에 익숙한 상태일 수 있습니다.",
      reflectionQuestion: "나는 어떤 가능성을 너무 빨리 포기하거나 의심하고 있을까요?",
      smallAction: "큰 희망을 요구하지 말고 오늘 버틸 수 있게 해주는 작은 증거 하나를 찾으세요.",
    },
  },
  "the-moon": {
    symbolMeanings: [
      {
        symbol: "달",
        meaning: "분명하지 않은 감정과 상상이 현실을 다르게 보이게 만드는 흐름입니다.",
      },
      {
        symbol: "개와 늑대",
        meaning: "길들여진 반응과 본능적 두려움이 동시에 깨어나는 장면을 뜻합니다.",
      },
      {
        symbol: "안개 낀 길",
        meaning: "지금은 모든 것을 단정하기보다 확인한 것부터 붙잡아야 하는 불확실성을 상징합니다.",
      },
    ],
    upright: {
      story: "달은 밤길처럼 분명하지 않은 상황과 깊은 무의식을 비추는 카드입니다. 불안과 직감이 섞일 수 있으니, 오늘은 단정하기보다 신호를 조심스럽게 확인해야 합니다.",
      reflectionQuestion: "오늘 내가 사실로 믿고 있는 것 중 감정이 크게 섞인 부분은 무엇일까요?",
      smallAction: "불안을 바로 결론으로 만들지 말고, 확인한 사실과 느낌을 따로 적어두세요.",
    },
    reversed: {
      story: "역방향의 달은 안개가 조금씩 걷히거나, 숨겨진 불안이 표면으로 올라오는 장면을 보여줍니다. 혼란을 인정할 때 오히려 현실이 더 또렷해집니다.",
      reflectionQuestion: "최근 흐릿했던 문제 중 이제 조금 더 분명히 보이는 것은 무엇일까요?",
      smallAction: "모호한 걱정 하나는 구체적인 질문으로 바꾸고, 답을 찾을 방법을 정하세요.",
    },
  },
  "the-sun": {
    symbolMeanings: [
      {
        symbol: "밝은 태양",
        meaning: "숨은 것이 드러나고 생명력과 명확함이 회복되는 흐름입니다.",
      },
      {
        symbol: "아이",
        meaning: "복잡한 계산보다 솔직함과 순수한 기쁨이 길을 여는 단서입니다.",
      },
      {
        symbol: "해바라기",
        meaning: "좋은 빛을 향해 자라는 관계와 성취의 건강한 확장을 뜻합니다.",
      },
    ],
    upright: {
      story: "태양은 밝아진 시야와 되살아난 생명력을 말하는 카드입니다. 숨기거나 복잡하게 해석하던 일이 단순해지고, 기쁨을 인정할수록 힘이 커집니다.",
      reflectionQuestion: "오늘 내가 더 솔직하게 기뻐하거나 드러내도 되는 것은 무엇일까요?",
      smallAction: "잘된 일 하나는 그냥 넘기지 말고 말로 꺼내세요.",
    },
    reversed: {
      story: "역방향의 태양은 기쁨이 약해졌거나 명확함을 믿지 못하는 장면을 비춥니다. 빛은 있지만 구름이 끼었을 뿐이라면, 작은 즐거움부터 다시 회복할 수 있습니다.",
      reflectionQuestion: "나는 어떤 좋은 일을 충분히 인정하지 못하고 지나치고 있을까요?",
      smallAction: "오늘의 작은 성취 하나를 기록하고 스스로에게 분명히 인정해 주세요.",
    },
  },
  judgement: {
    symbolMeanings: [
      {
        symbol: "나팔 부는 천사",
        meaning: "미뤄둔 응답이나 부름이 다시 들려오는 각성의 순간을 뜻합니다.",
      },
      {
        symbol: "깨어나는 사람들",
        meaning: "과거의 상태에서 일어나 새 기준으로 자신을 바라보는 장면입니다.",
      },
      {
        symbol: "빛",
        meaning: "숨겨두었던 진실이 드러나고 더 성숙한 선택을 요구하는 신호입니다.",
      },
    ],
    upright: {
      story: "심판은 과거를 벌하는 카드가 아니라 다시 응답할 기회를 주는 카드입니다. 지나온 선택을 돌아보고, 이제 더 성숙한 기준으로 다음 단계에 설 수 있습니다.",
      reflectionQuestion: "오늘 나는 어떤 과거의 경험을 새 기준으로 다시 해석할 수 있을까요?",
      smallAction: "미뤄둔 회신이나 정리 하나는 오늘 답을 주세요.",
    },
    reversed: {
      story: "역방향의 심판은 자기비판이 강해지거나 중요한 부름을 못 들은 척하는 장면을 비춥니다. 평가에 갇히기보다 배운 것을 보고 다음 응답을 정해야 합니다.",
      reflectionQuestion: "나는 스스로를 판단하느라 실제로 배운 점을 놓치고 있지 않을까요?",
      smallAction: "후회 하나는 배운 점 한 줄과 다음 할 일 한 줄로 바꿔 적어두세요.",
    },
  },
  "the-world": {
    symbolMeanings: [
      {
        symbol: "월계관",
        meaning: "긴 과정이 하나의 결실로 묶이며 성취를 인정할 때가 왔다는 뜻입니다.",
      },
      {
        symbol: "춤추는 인물",
        meaning: "완성은 멈춤이 아니라 몸으로 익힌 조화와 자유로운 다음 움직임입니다.",
      },
      {
        symbol: "네 상징 존재",
        meaning: "서로 다른 힘들이 균형을 이루며 하나의 전체로 통합되는 장면입니다.",
      },
    ],
    upright: {
      story: "세계는 한 여정이 완성되고 전체 그림이 맞춰지는 카드입니다. 오래 흩어져 있던 경험들이 하나의 의미로 통합되며, 다음 순환으로 넘어갈 준비가 됩니다.",
      reflectionQuestion: "오늘 내가 충분히 완성했다고 인정해야 할 과정은 무엇일까요?",
      smallAction: "끝낸 일은 그냥 넘기지 말고 배운 점과 다음 기준을 적어두세요.",
    },
    reversed: {
      story: "역방향의 세계는 거의 끝났지만 마지막 정리나 인정이 남아 있는 장면을 보여줍니다. 완성감을 느끼려면 더 하는 것보다 닫아야 할 고리를 닫는 일이 필요합니다.",
      reflectionQuestion: "나는 어떤 일을 끝냈는데도 아직 마음속으로 완료 처리하지 못하고 있을까요?",
      smallAction: "끝내야 할 마무리 하나를 정하고 완료 표시를 해두세요.",
    },
  },
} as const satisfies Record<(typeof tarotMajorCardBase)[number]["slug"], TarotMajorCardReferenceAddition>;

export const tarotMajorCards: readonly TarotMajorCard[] = tarotMajorCardBase.map((card) => {
  const referenceAddition = tarotMajorCardReferenceAdditions[card.slug];

  return {
    ...card,
    symbolMeanings: referenceAddition.symbolMeanings,
    upright: {
      ...card.upright,
      ...referenceAddition.upright,
    },
    reversed: {
      ...card.reversed,
      ...referenceAddition.reversed,
    },
  };
});

export function getTarotMajorCardById(id: number): TarotMajorCard | null {
  return tarotMajorCards.find((card) => card.id === id) ?? null;
}
