import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { DreamAnalysisResponse } from "../contracts/dream";
import {
  createDreamReadingQualityMarkdown,
  dreamReadingQualityCases,
  runDreamReadingQualityEval,
} from "../services/dream-reading-quality-eval";
import { createOpenAIResponsesProviderFromEnv } from "../services/openai-responses-provider";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "../../..");
const frontendEnvPath = resolve(repoRoot, "frontend", ".env");
const outputDir = resolve(repoRoot, "output", "eval");

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

function maybeRepairMojibake(text: string | undefined): string | undefined {
  if (!text) {
    return text;
  }

  if (!/[ÃÂíìëê][\u0080-\u00ff]/.test(text)) {
    return text;
  }

  return Buffer.from(text, "latin1").toString("utf8");
}

function isDreamAnalysisResponse(value: unknown): value is DreamAnalysisResponse {
  const candidate = value as Partial<DreamAnalysisResponse>;

  return typeof candidate?.summary === "string" && typeof candidate.interpretation === "string" && Array.isArray(candidate.symbolReadings);
}

function repairPriorResponse(response: DreamAnalysisResponse): DreamAnalysisResponse {
  const readerNote = maybeRepairMojibake(response.readerNote);
  const safetyNotice = maybeRepairMojibake(response.safetyNotice);

  return {
    ...response,
    reader: {
      ...response.reader,
      name: maybeRepairMojibake(response.reader.name) ?? response.reader.name,
    },
    summary: maybeRepairMojibake(response.summary) ?? response.summary,
    symbols: response.symbols.map((symbol) => maybeRepairMojibake(symbol) ?? symbol),
    emotions: response.emotions.map((emotion) => maybeRepairMojibake(emotion) ?? emotion),
    themes: response.themes.map((theme) => maybeRepairMojibake(theme) ?? theme),
    interpretation: maybeRepairMojibake(response.interpretation) ?? response.interpretation,
    smallPrescription: maybeRepairMojibake(response.smallPrescription) ?? response.smallPrescription,
    ...(readerNote ? { readerNote } : {}),
    ...(safetyNotice ? { safetyNotice } : {}),
    symbolReadings: response.symbolReadings.map((reading) => ({
      symbol: maybeRepairMojibake(reading.symbol) ?? reading.symbol,
      reading: maybeRepairMojibake(reading.reading) ?? reading.reading,
    })),
  };
}

async function loadPriorResponse(fileName: string | undefined): Promise<DreamAnalysisResponse | undefined> {
  if (!fileName) {
    return undefined;
  }

  const filePath = resolve(outputDir, fileName);

  if (!existsSync(filePath)) {
    return undefined;
  }

  const content = (await readFile(filePath, "utf8")).replace(/^\uFEFF/, "");
  const parsed = JSON.parse(content) as {
    result?: unknown;
    after?: unknown;
  };
  const response = isDreamAnalysisResponse(parsed.result)
    ? parsed.result
    : isDreamAnalysisResponse(parsed.after)
      ? parsed.after
      : isDreamAnalysisResponse(parsed)
        ? parsed
        : undefined;

  return response ? repairPriorResponse(response) : undefined;
}

async function run(): Promise<void> {
  loadFrontendEnv();

  if (!process.env.MANYANG_ANALYSIS_MODE) {
    process.env.MANYANG_ANALYSIS_MODE = "llm";
  }

  if (!process.env.MANYANG_LLM_TIMEOUT_MS) {
    process.env.MANYANG_LLM_TIMEOUT_MS = "45000";
  }

  const provider = createOpenAIResponsesProviderFromEnv(process.env);

  if (!provider) {
    throw new Error("OpenAI provider is not enabled. Check frontend/.env MANYANG_ANALYSIS_MODE and OPENAI_API_KEY.");
  }

  const requestedCaseIds = process.argv.slice(2);
  const selectedCases =
    requestedCaseIds.length > 0
      ? dreamReadingQualityCases.filter((testCase) => requestedCaseIds.includes(testCase.id))
      : dreamReadingQualityCases;

  if (selectedCases.length === 0) {
    throw new Error(`No matching live quality cases: ${requestedCaseIds.join(", ")}`);
  }

  const beforeByCaseIdEntries = await Promise.all(
    selectedCases.map(async (testCase) => [testCase.id, await loadPriorResponse(testCase.priorOutputFileName)] as const),
  );
  const generatedAt = new Date().toISOString();
  const safeStamp = generatedAt.replace(/[:.]/g, "-");
  const model = process.env.MANYANG_OPENAI_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-5-mini";
  const timeoutMs = Number(process.env.MANYANG_LLM_TIMEOUT_MS ?? 45000);
  const report = await runDreamReadingQualityEval({
    cases: selectedCases,
    provider,
    beforeByCaseId: Object.fromEntries(beforeByCaseIdEntries),
    generatedAt,
    model,
    providerTimeoutMs: timeoutMs,
  });
  const markdown = createDreamReadingQualityMarkdown(report);

  await mkdir(outputDir, { recursive: true });

  const jsonPath = resolve(outputDir, `live-dream-quality-${safeStamp}.json`);
  const markdownPath = resolve(outputDir, `live-dream-quality-${safeStamp}.md`);

  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(markdownPath, markdown, "utf8");

  console.log(JSON.stringify({ jsonPath, markdownPath, summary: report.summary }, null, 2));
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
