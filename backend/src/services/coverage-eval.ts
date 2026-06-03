import type { SupportedLocale } from "../contracts/symbol-encyclopedia";
import { findRuntimeSymbolMatches } from "./symbol-matcher";

/**
 * Coverage eval — "심볼 자체가 충분한가"를 측정한다. (matching recall과 별개 축)
 *
 * 흔한 꿈 키워드 목록에 `existsAs`(대응하는 백과 항목 ID 또는 null)를 달아 두고,
 * 각 키워드를 matcher로 탐침해 네 가지로 분류한다:
 *  - covered:       대응 항목이 있고 matcher가 그 항목을 잡음
 *  - matching_gap:  대응 항목은 있으나 키워드가 매칭 안 됨 (alias/형태소 문제)
 *  - coverage_gap:  대응 항목이 아예 없고 매칭도 안 됨 (새 심볼 후보)  ← 진짜 coverage 부족
 *  - over_match:    대응 항목이 없는데 다른 항목이 잡힘 (프록시로 덮임/오매치)
 *
 * 이렇게 해야 "심볼 부족(coverage)"과 "매칭 구멍(matching)"을 섞지 않고 따로 잴 수 있다.
 */

export type CoverageProbe = {
  keyword: string;
  locale: SupportedLocale;
  /** 이 개념에 대응하는 dedicated 백과 항목 ID. 없으면 null. */
  existsAs: string | null;
};

export const COMMON_DREAM_SYMBOLS: CoverageProbe[] = [
  // --- 대응 항목이 있다고 보는 흔한 상징 (covered 기대) ---
  { keyword: "뱀", locale: "ko", existsAs: "snake" },
  { keyword: "물", locale: "ko", existsAs: "water" },
  { keyword: "돼지", locale: "ko", existsAs: "pig" },
  { keyword: "똥", locale: "ko", existsAs: "feces" },
  { keyword: "용", locale: "ko", existsAs: "dragon" },
  { keyword: "호랑이", locale: "ko", existsAs: "tiger" },
  { keyword: "돈", locale: "ko", existsAs: "money" },
  { keyword: "불", locale: "ko", existsAs: "fire" },
  { keyword: "이빨", locale: "ko", existsAs: "teeth" },
  { keyword: "죽음", locale: "ko", existsAs: "death" },
  { keyword: "아기", locale: "ko", existsAs: "baby" },
  { keyword: "임신", locale: "ko", existsAs: "pregnancy" },
  { keyword: "시험", locale: "ko", existsAs: "exam" },
  { keyword: "결혼식", locale: "ko", existsAs: "wedding" },
  { keyword: "귀신", locale: "ko", existsAs: "ghost" },
  { keyword: "무덤", locale: "ko", existsAs: "grave" },
  { keyword: "조상", locale: "ko", existsAs: "ancestor" },
  { keyword: "거미", locale: "ko", existsAs: "spider" },
  { keyword: "고양이", locale: "ko", existsAs: "cat" },
  { keyword: "개", locale: "ko", existsAs: "dog" },
  { keyword: "물고기", locale: "ko", existsAs: "fish" },
  { keyword: "어머니", locale: "ko", existsAs: "mother" },
  { keyword: "학교", locale: "ko", existsAs: "school" },
  { keyword: "병원", locale: "ko", existsAs: "hospital" },
  { keyword: "자동차", locale: "ko", existsAs: "car" },
  { keyword: "비행기", locale: "ko", existsAs: "airplane" },
  { keyword: "엘리베이터", locale: "ko", existsAs: "elevator" },
  { keyword: "거울", locale: "ko", existsAs: "mirror" },
  { keyword: "화장실", locale: "ko", existsAs: "toilet" },
  { keyword: "피", locale: "ko", existsAs: "blood" },
  { keyword: "산", locale: "ko", existsAs: "mountain" },
  { keyword: "바다", locale: "ko", existsAs: "sea" },
  { keyword: "달", locale: "ko", existsAs: "moon" },
  { keyword: "무지개", locale: "ko", existsAs: "rainbow" },
  { keyword: "홍수", locale: "ko", existsAs: "flood" },
  { keyword: "칼", locale: "ko", existsAs: "knife" },
  { keyword: "곰", locale: "ko", existsAs: "bear" },
  { keyword: "거북이", locale: "ko", existsAs: "turtle" },
  { keyword: "닭", locale: "ko", existsAs: "chicken" },
  { keyword: "반지", locale: "ko", existsAs: "ring" },
  { keyword: "옷", locale: "ko", existsAs: "clothes" },
  { keyword: "전쟁", locale: "ko", existsAs: "war" },
  { keyword: "감옥", locale: "ko", existsAs: "prison" },
  { keyword: "연예인", locale: "ko", existsAs: "celebrity" },

  // --- 대응 항목이 없다고 보는 흔한 상징 (coverage_gap 후보) ---
  { keyword: "해", locale: "ko", existsAs: null }, // 태양 (moon은 있으나 sun 없음)
  { keyword: "태양", locale: "ko", existsAs: null },
  { keyword: "하늘", locale: "ko", existsAs: null },
  { keyword: "배", locale: "ko", existsAs: null }, // boat/ship
  { keyword: "자전거", locale: "ko", existsAs: null },
  { keyword: "총", locale: "ko", existsAs: null },
  { keyword: "경찰", locale: "ko", existsAs: null },
  { keyword: "군인", locale: "ko", existsAs: null },
  { keyword: "도둑", locale: "ko", existsAs: null },
  { keyword: "절", locale: "ko", existsAs: null }, // temple (monk은 있음)
  { keyword: "교회", locale: "ko", existsAs: null },
  { keyword: "사자", locale: "ko", existsAs: null },
  { keyword: "코끼리", locale: "ko", existsAs: null },
  { keyword: "늑대", locale: "ko", existsAs: null },
  { keyword: "토끼", locale: "ko", existsAs: null },
  { keyword: "여우", locale: "ko", existsAs: null },
  { keyword: "오줌", locale: "ko", existsAs: null },
  { keyword: "시체", locale: "ko", existsAs: null },
  { keyword: "키스", locale: "ko", existsAs: null },
  { keyword: "안개", locale: "ko", existsAs: null },
  { keyword: "번개", locale: "ko", existsAs: null },
  { keyword: "보석", locale: "ko", existsAs: null },
  { keyword: "모자", locale: "ko", existsAs: null },
  { keyword: "안경", locale: "ko", existsAs: null },
  { keyword: "선생님", locale: "ko", existsAs: null },
  { keyword: "할머니", locale: "ko", existsAs: null },
  { keyword: "편지", locale: "ko", existsAs: null },
  { keyword: "컴퓨터", locale: "ko", existsAs: null },
];

export type CoverageStatus = "covered" | "matching_gap" | "coverage_gap" | "over_match";

export type CoverageProbeResult = {
  keyword: string;
  locale: SupportedLocale;
  existsAs: string | null;
  topMatch: string | null;
  status: CoverageStatus;
};

export type CoverageReport = {
  probeCount: number;
  counts: Record<CoverageStatus, number>;
  coverageRateAmongKnown: number; // covered / (covered + matching_gap)
  results: CoverageProbeResult[];
};

export function evaluateCoverage(probes: CoverageProbe[] = COMMON_DREAM_SYMBOLS): CoverageReport {
  const results: CoverageProbeResult[] = probes.map((probe) => {
    const matches = findRuntimeSymbolMatches(probe.keyword, { locale: probe.locale, limit: 3 });
    const matchedIds = matches.map((m) => m.entryId);
    const topMatch = matchedIds[0] ?? null;

    let status: CoverageStatus;
    if (probe.existsAs) {
      status = matchedIds.includes(probe.existsAs) ? "covered" : matchedIds.length > 0 ? "matching_gap" : "matching_gap";
    } else {
      status = matchedIds.length > 0 ? "over_match" : "coverage_gap";
    }

    return { keyword: probe.keyword, locale: probe.locale, existsAs: probe.existsAs, topMatch, status };
  });

  const counts: Record<CoverageStatus, number> = { covered: 0, matching_gap: 0, coverage_gap: 0, over_match: 0 };
  for (const r of results) {
    counts[r.status] += 1;
  }

  const known = counts.covered + counts.matching_gap;
  const coverageRateAmongKnown = known === 0 ? 1 : Math.round((counts.covered / known) * 1000) / 1000;

  return { probeCount: results.length, counts, coverageRateAmongKnown, results };
}

export function formatCoverageMarkdown(report: CoverageReport): string {
  const lines: string[] = [];
  lines.push("# Coverage Eval (common dream symbols)");
  lines.push("");
  lines.push(`- probes: ${report.probeCount}`);
  lines.push(`- covered: ${report.counts.covered}`);
  lines.push(`- matching_gap (항목 있으나 매칭 실패 → alias): ${report.counts.matching_gap}`);
  lines.push(`- coverage_gap (항목 없음 → 새 심볼 후보): ${report.counts.coverage_gap}`);
  lines.push(`- over_match (항목 없으나 다른 항목이 덮음): ${report.counts.over_match}`);
  lines.push(`- coverage rate among known concepts: ${report.coverageRateAmongKnown}`);
  lines.push("");
  lines.push("## coverage_gap — 새 심볼 추가 우선 후보");
  lines.push("");
  lines.push(report.results.filter((r) => r.status === "coverage_gap").map((r) => `- ${r.keyword}`).join("\n") || "(none)");
  lines.push("");
  lines.push("## matching_gap — alias/형태소 보강 필요");
  lines.push("");
  lines.push(
    report.results
      .filter((r) => r.status === "matching_gap")
      .map((r) => `- ${r.keyword} (기대: ${r.existsAs})`)
      .join("\n") || "(none)",
  );
  lines.push("");
  lines.push("## over_match — 항목은 없지만 매칭됨 (검토)");
  lines.push("");
  lines.push(
    report.results
      .filter((r) => r.status === "over_match")
      .map((r) => `- ${r.keyword} → ${r.topMatch}`)
      .join("\n") || "(none)",
  );
  return lines.join("\n");
}
