import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { TarotReadingOrientation } from "../services/tarot-reading-prompt";
import {
  createTarotModelAbMarkdown,
  parseTarotModelList,
  runTarotModelAbEval,
  type TarotModelAbCase,
} from "../services/tarot-model-ab-eval";
import { createOpenAIResponsesProviderFromEnv } from "../services/openai-responses-provider";
import { getTarotCardByKey } from "../../../frontend/src/lib/tarot-cards";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "../../..");
const frontendEnvPath = resolve(repoRoot, "frontend", ".env");
const defaultOutputDir = resolve(repoRoot, "output", "eval");
const defaultModels = "gpt-5-mini,gpt-5";
const defaultTimeoutMs = 45_000;
const appDate = "2026-07-07";

type TarotAbCaseSeed = {
  id: string;
  label: string;
  cardKey: string;
  orientation: TarotReadingOrientation;
  stateKey: string;
  stateLabel: string;
  questionKey: string;
  questionText: string;
};

const caseSeeds = [
  {
    id: "mind-hidden-page-cups-r",
    label: "숨긴 감정 / 컵 시종 역방향",
    cardKey: "minor:cups:11",
    orientation: "reversed",
    stateKey: "mind_complex",
    stateLabel: "내 마음이 궁금해",
    questionKey: "unrecognized_feeling",
    questionText: "내가 모른 척하고 있는 감정은 뭘까?",
  },
  {
    id: "mind-held-nine-pentacles-u",
    label: "마음 / 펜타클 9 정방향",
    cardKey: "minor:pentacles:09",
    orientation: "upright",
    stateKey: "mind_complex",
    stateLabel: "내 마음이 궁금해",
    questionKey: "held_feeling",
    questionText: "지금 내 마음에 제일 크게 남아 있는 건 뭐야?",
  },
  {
    id: "mind-tiring-seven-cups-r",
    label: "지치는 생각 / 컵 7 역방향",
    cardKey: "minor:cups:07",
    orientation: "reversed",
    stateKey: "mind_complex",
    stateLabel: "내 마음이 궁금해",
    questionKey: "tiring_thought",
    questionText: "요즘 나를 지치게 하는 생각은 뭐야?",
  },
  {
    id: "relationship-between-emperor-u",
    label: "관계 감정 / 황제 정방향",
    cardKey: "major:04",
    orientation: "upright",
    stateKey: "relationship_concern",
    stateLabel: "관계가 신경 쓰여",
    questionKey: "between_us",
    questionText: "상대와 나 사이에 어떤 감정이 놓여 있을까?",
  },
  {
    id: "relationship-missed-two-cups-r",
    label: "관계 놓친 부분 / 컵 2 역방향",
    cardKey: "minor:cups:02",
    orientation: "reversed",
    stateKey: "relationship_concern",
    stateLabel: "관계가 신경 쓰여",
    questionKey: "missed_part",
    questionText: "내가 이 관계에서 놓치고 있는 건 뭐야?",
  },
  {
    id: "relationship-heart-lovers-r",
    label: "관계 마음 / 연인 역방향",
    cardKey: "major:06",
    orientation: "reversed",
    stateKey: "relationship_concern",
    stateLabel: "관계가 신경 쓰여",
    questionKey: "relationship_heart",
    questionText: "지금 이 관계에서 내가 봐야 할 마음은 뭐야?",
  },
  {
    id: "work-focus-seven-swords-r",
    label: "일 집중 / 소드 7 역방향",
    cardKey: "minor:swords:07",
    orientation: "reversed",
    stateKey: "work_blocked",
    stateLabel: "일이 잘 안 풀려",
    questionKey: "focus_point",
    questionText: "오늘 내가 집중해야 할 건 뭐야?",
  },
  {
    id: "work-main-three-pentacles-r",
    label: "일 막힘 / 펜타클 3 역방향",
    cardKey: "minor:pentacles:03",
    orientation: "reversed",
    stateKey: "work_blocked",
    stateLabel: "일이 잘 안 풀려",
    questionKey: "main_flow",
    questionText: "지금 이 일에서 뭐가 제일 막혀 있을까?",
  },
  {
    id: "work-next-eight-pentacles-u",
    label: "일 방향 / 펜타클 8 정방향",
    cardKey: "minor:pentacles:08",
    orientation: "upright",
    stateKey: "work_blocked",
    stateLabel: "일이 잘 안 풀려",
    questionKey: "next_direction",
    questionText: "다음으로 움직일 방향은 어디일까?",
  },
  {
    id: "reality-missed-star-r",
    label: "현실 자원 / 별 역방향",
    cardKey: "major:17",
    orientation: "reversed",
    stateKey: "reality_anxiety",
    stateLabel: "돈과 현실이 걱정돼",
    questionKey: "missed_resource",
    questionText: "돈이나 자원에서 놓친 부분은 없을까?",
  },
  {
    id: "reality-check-four-pentacles-u",
    label: "현실 확인 / 펜타클 4 정방향",
    cardKey: "minor:pentacles:04",
    orientation: "upright",
    stateKey: "reality_anxiety",
    stateLabel: "돈과 현실이 걱정돼",
    questionKey: "reality_check",
    questionText: "지금 현실적으로 먼저 확인할 건 뭐야?",
  },
  {
    id: "reality-stability-ace-pentacles-r",
    label: "현실 안정 / 펜타클 에이스 역방향",
    cardKey: "minor:pentacles:01",
    orientation: "reversed",
    stateKey: "reality_anxiety",
    stateLabel: "돈과 현실이 걱정돼",
    questionKey: "stability_attitude",
    questionText: "안정감을 만들려면 뭘 점검해야 할까?",
  },
  {
    id: "decision-criterion-two-swords-u",
    label: "선택 기준 / 소드 2 정방향",
    cardKey: "minor:swords:02",
    orientation: "upright",
    stateKey: "decision_point",
    stateLabel: "결정해야 할 일이 있어",
    questionKey: "real_criterion",
    questionText: "이 선택에서 먼저 봐야 할 건 뭐야?",
  },
  {
    id: "decision-rushed-chariot-u",
    label: "성급한 결정 / 전차 정방향",
    cardKey: "major:07",
    orientation: "upright",
    stateKey: "decision_point",
    stateLabel: "결정해야 할 일이 있어",
    questionKey: "rushed_decision",
    questionText: "내가 너무 급하게 정하려는 건 없을까?",
  },
  {
    id: "decision-responsibility-two-pentacles-r",
    label: "선택 책임 / 펜타클 2 역방향",
    cardKey: "minor:pentacles:02",
    orientation: "reversed",
    stateKey: "decision_point",
    stateLabel: "결정해야 할 일이 있어",
    questionKey: "required_responsibility",
    questionText: "이 선택을 하면 내가 감당해야 할 건 뭐야?",
  },
  {
    id: "daily-helpful-king-swords-u",
    label: "도움 기운 / 소드 왕 정방향",
    cardKey: "minor:swords:14",
    orientation: "upright",
    stateKey: "daily_signal",
    stateLabel: "오늘 하루가 궁금해",
    questionKey: "helpful_energy",
    questionText: "오늘 나를 도와줄 기운은 뭐야?",
  },
  {
    id: "daily-focus-ace-wands-u",
    label: "오늘 신호 / 완드 에이스 정방향",
    cardKey: "minor:wands:01",
    orientation: "upright",
    stateKey: "daily_signal",
    stateLabel: "오늘 하루가 궁금해",
    questionKey: "missed_signal",
    questionText: "오늘 내가 놓치지 말아야 할 건 뭐야?",
  },
  {
    id: "daily-light-temperance-u",
    label: "가벼운 하루 / 절제 정방향",
    cardKey: "major:14",
    orientation: "upright",
    stateKey: "daily_signal",
    stateLabel: "오늘 하루가 궁금해",
    questionKey: "light_day",
    questionText: "오늘을 가볍게 보내려면 뭘 봐야 할까?",
  },
  {
    id: "daily-careful-moon-r",
    label: "오늘 조심 / 달 역방향",
    cardKey: "major:18",
    orientation: "reversed",
    stateKey: "daily_signal",
    stateLabel: "오늘 하루가 궁금해",
    questionKey: "careful_flow",
    questionText: "오늘 조심해서 볼 건 뭐야?",
  },
  {
    id: "decision-before-justice-u",
    label: "결정 전 확인 / 정의 정방향",
    cardKey: "major:11",
    orientation: "upright",
    stateKey: "decision_point",
    stateLabel: "결정해야 할 일이 있어",
    questionKey: "before_next_step",
    questionText: "결정하기 전에 확인할 건 뭐야?",
  },
] satisfies TarotAbCaseSeed[];

type ScriptOptions = {
  models: string[];
  caseIds: string[];
  outputDir: string;
  timeoutMs: number;
};

function loadFrontendEnv(): void {
  if (!existsSync(frontendEnvPath)) {
    return;
  }

  const content = readFileSync(frontendEnvPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");

    if (equalsIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function readArgValue(argv: readonly string[], name: string): string | undefined {
  const index = argv.indexOf(name);

  if (index < 0) {
    return undefined;
  }

  return argv[index + 1];
}

function parseScriptOptions(argv: readonly string[], env: NodeJS.ProcessEnv): ScriptOptions {
  const modelSource = readArgValue(argv, "--models") ?? env.MANYANG_TAROT_AB_MODELS ?? defaultModels;
  const models = parseTarotModelList(modelSource);

  if (models.length < 2) {
    throw new Error("Tarot A/B check needs at least two models. Use --models model-a,model-b.");
  }

  const caseIds = parseTarotModelList(readArgValue(argv, "--cases") ?? env.MANYANG_TAROT_AB_CASES);
  const timeoutMs = Number(readArgValue(argv, "--timeout-ms") ?? env.MANYANG_LLM_TIMEOUT_MS ?? defaultTimeoutMs);

  return {
    models,
    caseIds,
    outputDir: resolve(repoRoot, readArgValue(argv, "--out-dir") ?? env.MANYANG_TAROT_AB_OUTPUT_DIR ?? defaultOutputDir),
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? Math.round(timeoutMs) : defaultTimeoutMs,
  };
}

function getRequiredTarotCard(cardKey: string) {
  const card = getTarotCardByKey(cardKey);

  if (!card) {
    throw new Error(`Unknown tarot card key: ${cardKey}`);
  }

  return card;
}

function createCase(seed: TarotAbCaseSeed): TarotModelAbCase {
  return {
    id: seed.id,
    label: seed.label,
    input: {
      appDate,
      locale: "ko",
      spread: "question_one_card",
      questionContext: {
        stateKey: seed.stateKey,
        stateLabel: seed.stateLabel,
        questionKey: seed.questionKey,
        questionText: seed.questionText,
      },
      cards: [
        {
          position: "today",
          orientation: seed.orientation,
          card: getRequiredTarotCard(seed.cardKey),
        },
      ],
    },
  };
}

function selectCases(caseIds: readonly string[]): TarotModelAbCase[] {
  const selectedSeeds =
    caseIds.length > 0 ? caseSeeds.filter((seed) => caseIds.includes(seed.id)) : caseSeeds;

  if (selectedSeeds.length === 0) {
    throw new Error(`No matching tarot A/B cases: ${caseIds.join(", ")}`);
  }

  return selectedSeeds.map(createCase);
}

async function run(): Promise<void> {
  loadFrontendEnv();

  if (!process.env.MANYANG_ANALYSIS_MODE) {
    process.env.MANYANG_ANALYSIS_MODE = "llm";
  }

  const options = parseScriptOptions(process.argv.slice(2), process.env);
  const provider = createOpenAIResponsesProviderFromEnv(process.env);

  if (!provider) {
    throw new Error("OpenAI provider is not enabled. Check frontend/.env MANYANG_ANALYSIS_MODE and OPENAI_API_KEY.");
  }

  const generatedAt = new Date().toISOString();
  const safeStamp = generatedAt.replace(/[:.]/g, "-");
  const cases = selectCases(options.caseIds);
  const report = await runTarotModelAbEval({
    cases,
    models: options.models,
    provider,
    generatedAt,
    providerTimeoutMs: options.timeoutMs,
  });
  const markdown = createTarotModelAbMarkdown(report);

  await mkdir(options.outputDir, { recursive: true });

  const jsonPath = resolve(options.outputDir, `tarot-model-ab-${safeStamp}.json`);
  const markdownPath = resolve(options.outputDir, `tarot-model-ab-${safeStamp}.md`);

  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(markdownPath, markdown, "utf8");

  console.log(
    JSON.stringify(
      {
        jsonPath,
        markdownPath,
        models: options.models,
        cases: cases.length,
        results: report.results.length,
      },
      null,
      2,
    ),
  );
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
