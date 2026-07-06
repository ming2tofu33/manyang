import { performance } from "node:perf_hooks";

import type { DreamReadingLlmProvider } from "./llm-provider";
import { generateTarotReadingForUser, type TarotReadingInput } from "./llm-tarot-reading";

export type TarotModelAbCase = {
  id: string;
  label: string;
  input: TarotReadingInput;
};

export type TarotModelAbResult =
  | {
      caseId: string;
      model: string;
      status: "ok";
      durationMs: number;
      title: string;
      overview: string;
      keywords: string[];
    }
  | {
      caseId: string;
      model: string;
      status: "unavailable";
      durationMs: number;
      reason: string;
      retryable: boolean;
    }
  | {
      caseId: string;
      model: string;
      status: "error";
      durationMs: number;
      error: string;
    };

export type TarotModelAbReport = {
  generatedAt: string;
  models: string[];
  cases: TarotModelAbCase[];
  results: TarotModelAbResult[];
};

export type RunTarotModelAbEvalInput = {
  cases: readonly TarotModelAbCase[];
  models: readonly string[];
  provider: DreamReadingLlmProvider;
  generatedAt: string;
  providerTimeoutMs?: number;
};

export function parseTarotModelList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  const seen = new Set<string>();
  const models: string[] = [];

  for (const model of value.split(",").map((item) => item.trim()).filter(Boolean)) {
    if (seen.has(model)) {
      continue;
    }

    seen.add(model);
    models.push(model);
  }

  return models;
}

export async function runTarotModelAbEval(input: RunTarotModelAbEvalInput): Promise<TarotModelAbReport> {
  const results: TarotModelAbResult[] = [];

  for (const testCase of input.cases) {
    for (const model of input.models) {
      const startedAt = performance.now();

      try {
        const result = await generateTarotReadingForUser(testCase.input, {
          provider: input.provider,
          model,
          ...(input.providerTimeoutMs ? { providerTimeoutMs: input.providerTimeoutMs } : {}),
        });
        const durationMs = Math.round(performance.now() - startedAt);

        if (result.status === "ok") {
          results.push({
            caseId: testCase.id,
            model,
            status: "ok",
            durationMs,
            title: result.reading.title,
            overview: result.reading.overview,
            keywords: [...result.reading.keywords],
          });
          continue;
        }

        results.push({
          caseId: testCase.id,
          model,
          status: "unavailable",
          durationMs,
          reason: result.reason,
          retryable: result.retryable,
        });
      } catch (error) {
        results.push({
          caseId: testCase.id,
          model,
          status: "error",
          durationMs: Math.round(performance.now() - startedAt),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return {
    generatedAt: input.generatedAt,
    models: [...input.models],
    cases: [...input.cases],
    results,
  };
}

function getResultForCaseAndModel(
  report: TarotModelAbReport,
  testCase: TarotModelAbCase,
  model: string,
): TarotModelAbResult | undefined {
  return report.results.find((result) => result.caseId === testCase.id && result.model === model);
}

function createMarkdownResult(result: TarotModelAbResult | undefined): string {
  if (!result) {
    return "_No result._";
  }

  if (result.status === "ok") {
    return [
      `- duration: ${result.durationMs}ms`,
      `- title: ${result.title}`,
      `- keywords: ${result.keywords.join(", ")}`,
      "",
      result.overview,
    ].join("\n");
  }

  if (result.status === "unavailable") {
    return [`- duration: ${result.durationMs}ms`, `- unavailable: ${result.reason}`, `- retryable: ${result.retryable}`].join(
      "\n",
    );
  }

  return [`- duration: ${result.durationMs}ms`, `- error: ${result.error}`].join("\n");
}

export function createTarotModelAbMarkdown(report: TarotModelAbReport): string {
  const lines = [
    "# Tarot Model A/B Report",
    "",
    `- generatedAt: ${report.generatedAt}`,
    `- models: ${report.models.join(", ")}`,
    `- cases: ${report.cases.length}`,
    "",
  ];

  for (const testCase of report.cases) {
    lines.push(`## ${testCase.label}`, "", `- id: ${testCase.id}`, `- question: ${testCase.input.questionContext?.questionText ?? "daily"}`, "");

    for (const model of report.models) {
      lines.push(`### ${model}`, "", createMarkdownResult(getResultForCaseAndModel(report, testCase, model)), "");
    }
  }

  return `${lines.join("\n").trimEnd()}\n`;
}
