import { mkdirSync, writeFileSync } from "node:fs";

import { evaluateRetrieval, formatRetrievalEvalMarkdown } from "../services/retrieval-eval";

/**
 * 검색(retrieval) recall@k 베이스라인을 재생성한다. LLM 불필요.
 * 사용: npm --prefix backend run eval:retrieval [-- k]
 */
function main(): void {
  const kArg = Number(process.argv[2]);
  const k = Number.isFinite(kArg) && kArg > 0 ? kArg : 5;

  const report = evaluateRetrieval(undefined, k);
  const markdown = formatRetrievalEvalMarkdown(report);

  mkdirSync("output/eval", { recursive: true });
  writeFileSync("output/eval/retrieval-eval-latest.md", markdown + "\n", "utf8");
  writeFileSync("output/eval/retrieval-eval-latest.json", JSON.stringify(report, null, 2), "utf8");

  console.log(markdown);
  console.log("");
  console.log(`saved -> output/eval/retrieval-eval-latest.{md,json}`);
}

main();
