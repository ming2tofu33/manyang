import { mkdirSync, writeFileSync } from "node:fs";

import { evaluateCoverage, formatCoverageMarkdown } from "../services/coverage-eval";

/**
 * 흔한 꿈 상징 coverage(심볼 충분도)를 측정한다. LLM 불필요.
 * 사용: npm --prefix backend run eval:coverage
 */
function main(): void {
  const report = evaluateCoverage();
  const markdown = formatCoverageMarkdown(report);

  mkdirSync("output/eval", { recursive: true });
  writeFileSync("output/eval/coverage-eval-latest.md", markdown + "\n", "utf8");
  writeFileSync("output/eval/coverage-eval-latest.json", JSON.stringify(report, null, 2), "utf8");

  console.log(markdown);
  console.log("");
  console.log("saved -> output/eval/coverage-eval-latest.{md,json}");
}

main();
