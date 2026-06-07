import type { SupportedLocale } from "../contracts/symbol-encyclopedia";
import { findRuntimeSymbolMatches } from "./symbol-matcher";

/**
 * 검색(retrieval) 품질 평가 — LLM 없이 symbol matcher만 측정한다.
 * ground truth는 라벨이 아니라 symbol ID로 둔다(라벨 변경에 견고).
 * 의도적으로 paraphrase 케이스를 포함해 어휘(lexical) 매칭의 recall 구멍을 드러낸다.
 */

export type RetrievalEvalTag = "common" | "paraphrase" | "sensitive" | "tradition" | "en";

export type RetrievalEvalCase = {
  id: string;
  locale: SupportedLocale;
  tag: RetrievalEvalTag;
  dreamText: string;
  /** 이 꿈에서 검색되어야 하는 symbol ID들 (정답) */
  expected: string[];
};

export const RETRIEVAL_EVAL_CASES: RetrievalEvalCase[] = [
  // --- ko common (표제어가 그대로 등장) ---
  { id: "ko_snake_land", locale: "ko", tag: "common", dreamText: "오늘 새벽에 우리 땅에 큰 구렁이가 수십 마리 나왔어.", expected: ["snake", "owned_land", "many", "dawn"] },
  { id: "ko_school_corridor", locale: "ko", tag: "common", dreamText: "학교 긴 복도에서 교실을 찾는데 문이 계속 바뀌었어.", expected: ["school", "corridor", "searching", "door"] },
  { id: "ko_elevator_sea", locale: "ko", tag: "common", dreamText: "엘리베이터에 갇혔는데 창밖으로 바다가 보였어.", expected: ["elevator", "sea", "window"] },
  { id: "ko_fire_home", locale: "ko", tag: "common", dreamText: "집에 불이 나서 다 타고 있었어.", expected: ["fire", "home"] },
  { id: "ko_rain_flood", locale: "ko", tag: "common", dreamText: "비가 쏟아지더니 홍수가 나서 길이 잠겼어.", expected: ["rain", "flood", "road"] },
  { id: "ko_cat_mirror", locale: "ko", tag: "common", dreamText: "거울 앞에 고양이가 앉아서 나를 빤히 봤어.", expected: ["mirror", "cat"] },
  { id: "ko_exam", locale: "ko", tag: "common", dreamText: "시험을 보는데 하나도 못 풀고 시간이 없었어.", expected: ["exam"] },
  { id: "ko_wedding_crowd", locale: "ko", tag: "common", dreamText: "결혼식장에 사람들이 가득 모여 있었어.", expected: ["wedding", "crowd", "many"] },
  { id: "ko_money_bag", locale: "ko", tag: "common", dreamText: "가방 안에서 돈이 계속 나왔어.", expected: ["money", "bag"] },
  { id: "ko_pig_home", locale: "ko", tag: "common", dreamText: "돼지가 집 안으로 들어왔어.", expected: ["pig", "home"] },

  // --- ko tradition (전통 길흉이 강한 상징) ---
  { id: "ko_feces_step", locale: "ko", tag: "tradition", dreamText: "길에서 똥을 밟아서 신발에 잔뜩 묻었어.", expected: ["feces", "road", "shoes"] },
  { id: "ko_dragon", locale: "ko", tag: "tradition", dreamText: "용이 하늘로 승천하는 걸 봤어.", expected: ["dragon", "sky"] },
  { id: "ko_ancestor", locale: "ko", tag: "tradition", dreamText: "돌아가신 조상님이 꿈에 나타나셨어.", expected: ["ancestor"] },
  { id: "ko_pig_arms", locale: "ko", tag: "tradition", dreamText: "통통한 돼지를 품에 안았어.", expected: ["pig", "hug"] },

  // --- ko sensitive (안전 정책 대상) ---
  { id: "ko_hospital_blood", locale: "ko", tag: "sensitive", dreamText: "병원에 있었고 몸에서 피가 났어.", expected: ["hospital", "blood", "body"] },
  { id: "ko_teeth_fall", locale: "ko", tag: "sensitive", dreamText: "이가 우수수 빠졌어.", expected: ["teeth"] },
  { id: "ko_death_funeral", locale: "ko", tag: "sensitive", dreamText: "장례식장에 갔는데 누가 죽은 것 같았어.", expected: ["funeral", "death"] },

  // --- ko paraphrase (표제어/alias가 그대로 안 나오는 구어체) ---
  { id: "ko_chased_para", locale: "ko", tag: "paraphrase", dreamText: "누군가 계속 뒤따라와서 죽어라 도망쳤어.", expected: ["being_chased", "running"] },
  { id: "ko_sink_fall_para", locale: "ko", tag: "paraphrase", dreamText: "발밑이 푹 꺼지면서 아래로 떨어졌어.", expected: ["falling"] },
  { id: "ko_teeth_para", locale: "ko", tag: "paraphrase", dreamText: "어금니가 흔들흔들하더니 손에 빠져나왔어.", expected: ["teeth", "hand"] },
  { id: "ko_water_para", locale: "ko", tag: "paraphrase", dreamText: "흙탕물에 잠겨서 숨이 막혔어.", expected: ["water", "mud"] },
  { id: "ko_snake_para", locale: "ko", tag: "paraphrase", dreamText: "기다란 뱀 한 마리가 다리를 칭칭 감았어.", expected: ["snake"] },
  { id: "ko_baby_para", locale: "ko", tag: "paraphrase", dreamText: "갓난아기를 품에 안고 젖을 먹였어.", expected: ["baby", "hug"] },
  { id: "ko_partner_para", locale: "ko", tag: "paraphrase", dreamText: "헤어진 옛 애인이 꿈에 나왔어.", expected: ["ex_partner", "partner"] },

  // --- en common ---
  { id: "en_snake_land", locale: "en", tag: "en", dreamText: "I was bitten by a huge snake on my own land.", expected: ["snake", "owned_land"] },
  { id: "en_fall_teeth", locale: "en", tag: "en", dreamText: "I was falling and my teeth were crumbling.", expected: ["falling", "teeth"] },
  { id: "en_chased", locale: "en", tag: "en", dreamText: "Something was chasing me and my legs would not move.", expected: ["being_chased"] },
  { id: "en_money_bag", locale: "en", tag: "en", dreamText: "I found a lot of money in my bag.", expected: ["money", "bag", "many"] },
  { id: "en_water_drown", locale: "en", tag: "en", dreamText: "I was drowning in muddy water.", expected: ["water", "mud"] },
  { id: "en_pig_home", locale: "en", tag: "en", dreamText: "A pig came into my house.", expected: ["pig", "home"] },

  // --- en paraphrase ---
  { id: "en_chased_para", locale: "en", tag: "paraphrase", dreamText: "I could not escape the figure following me.", expected: ["being_chased"] },
  { id: "en_teeth_para", locale: "en", tag: "paraphrase", dreamText: "One of my molars wobbled and came loose in my hand.", expected: ["teeth", "hand"] },
];

export type RetrievalCaseResult = {
  id: string;
  locale: SupportedLocale;
  tag: RetrievalEvalTag;
  expected: string[];
  retrieved: string[];
  hits: string[];
  missed: string[];
  recall: number;
  precision: number;
};

export type RetrievalEvalReport = {
  k: number;
  cases: RetrievalCaseResult[];
  aggregate: {
    caseCount: number;
    microRecall: number; // sum(hits) / sum(expected)
    macroRecall: number; // mean(per-case recall)
    macroPrecision: number; // mean(per-case precision@k)
    perfectRecallRate: number; // share of cases with recall === 1
    byTag: Record<string, { count: number; macroRecall: number }>;
  };
};

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function evaluateRetrieval(cases: RetrievalEvalCase[] = RETRIEVAL_EVAL_CASES, k = 5): RetrievalEvalReport {
  const results: RetrievalCaseResult[] = cases.map((testCase) => {
    const matches = findRuntimeSymbolMatches(testCase.dreamText, { locale: testCase.locale, limit: k });
    const retrieved = matches.map((match) => match.entryId);
    const retrievedSet = new Set(retrieved);
    const hits = testCase.expected.filter((id) => retrievedSet.has(id));
    const missed = testCase.expected.filter((id) => !retrievedSet.has(id));
    const recall = testCase.expected.length === 0 ? 1 : hits.length / testCase.expected.length;
    const precision = retrieved.length === 0 ? 0 : hits.length / retrieved.length;
    return {
      id: testCase.id,
      locale: testCase.locale,
      tag: testCase.tag,
      expected: testCase.expected,
      retrieved,
      hits,
      missed,
      recall: round(recall),
      precision: round(precision),
    };
  });

  const totalExpected = results.reduce((sum, r) => sum + r.expected.length, 0);
  const totalHits = results.reduce((sum, r) => sum + r.hits.length, 0);
  const macroRecall = results.reduce((sum, r) => sum + r.recall, 0) / (results.length || 1);
  const macroPrecision = results.reduce((sum, r) => sum + r.precision, 0) / (results.length || 1);
  const perfect = results.filter((r) => r.recall === 1).length;

  const byTag: Record<string, { count: number; macroRecall: number }> = {};
  for (const r of results) {
    const bucket = (byTag[r.tag] ??= { count: 0, macroRecall: 0 });
    bucket.count += 1;
    bucket.macroRecall += r.recall;
  }
  for (const bucket of Object.values(byTag)) {
    bucket.macroRecall = round(bucket.macroRecall / bucket.count);
  }

  return {
    k,
    cases: results,
    aggregate: {
      caseCount: results.length,
      microRecall: round(totalExpected === 0 ? 1 : totalHits / totalExpected),
      macroRecall: round(macroRecall),
      macroPrecision: round(macroPrecision),
      perfectRecallRate: round(perfect / (results.length || 1)),
      byTag,
    },
  };
}

export function formatRetrievalEvalMarkdown(report: RetrievalEvalReport): string {
  const a = report.aggregate;
  const lines: string[] = [];
  lines.push(`# Retrieval Eval (lexical matcher, k=${report.k})`);
  lines.push("");
  lines.push(`- cases: ${a.caseCount}`);
  lines.push(`- micro recall: ${a.microRecall}`);
  lines.push(`- macro recall: ${a.macroRecall}`);
  lines.push(`- macro precision@${report.k}: ${a.macroPrecision}`);
  lines.push(`- perfect-recall rate: ${a.perfectRecallRate}`);
  lines.push("");
  lines.push("## By tag");
  lines.push("");
  lines.push("| tag | count | macro recall |");
  lines.push("| --- | --- | --- |");
  for (const [tag, v] of Object.entries(a.byTag)) {
    lines.push(`| ${tag} | ${v.count} | ${v.macroRecall} |`);
  }
  lines.push("");
  lines.push("## Misses (recall < 1)");
  lines.push("");
  lines.push("| case | tag | recall | missed | retrieved |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const r of report.cases) {
    if (r.recall < 1) {
      lines.push(`| ${r.id} | ${r.tag} | ${r.recall} | ${r.missed.join(", ")} | ${r.retrieved.join(", ") || "—"} |`);
    }
  }
  return lines.join("\n");
}
