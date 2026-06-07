import { describe, expect, test } from "vitest";

import {
  applyIssuePenalties,
  detectDeterministicIssues,
  parseRubricGroups,
  rawScoreFromGroups,
  weightedScoreFromGroups,
  type RubricGroups,
} from "../src/services/dream-reading-rubric";

function groupsWithScore(score: number): RubricGroups {
  const s = { evidence: "x", score };
  return {
    extraction: {
      recall: { ...s, missedSymbols: [] },
      precision: { ...s, spuriousSymbols: [] },
    },
    ownership: { sceneBinding: { ...s }, nonGeneric: { ...s } },
    sense: { coherence: { ...s } },
    resonance: { warmth: { ...s }, landsOnFeeling: { ...s } },
    delight: { fortuneClarity: { ...s }, folkFraming: { ...s } },
    depth: { development: { ...s } },
    overall: { gestalt: { ...s } },
  };
}

const cleanReading = {
  summary: "재물과 복이 들어오는 길몽입니다.",
  interpretation: "돼지가 집으로 들어온 장면은 전통적으로 재물이 생활 안으로 들어온다는 길조로 읽힙니다.",
  symbolReadings: [{ symbol: "돼지", reading: "돼지는 재물과 복을 뜻합니다." }],
};

describe("dream reading rubric — aggregation", () => {
  test("rawScore averages sub-scores ×10", () => {
    expect(rawScoreFromGroups(groupsWithScore(10))).toBe(100);
    expect(rawScoreFromGroups(groupsWithScore(5))).toBe(50);
    expect(rawScoreFromGroups(groupsWithScore(0))).toBe(0);
  });

  test("weightedScore equals rawScore when all subs are equal", () => {
    // 모든 sub가 같으면 가중치 합(=1)이라 raw와 동일.
    expect(weightedScoreFromGroups(groupsWithScore(8))).toBe(80);
  });

  test("weightedScore tilts toward ownership/resonance priorities", () => {
    const groups = groupsWithScore(5);
    groups.ownership.sceneBinding.score = 10;
    groups.ownership.nonGeneric.score = 10;
    const weighted = weightedScoreFromGroups(groups);
    const raw = rawScoreFromGroups(groups);
    // ownership(0.30)이 만점이라 가중점수가 단순평균보다 높아야 한다.
    expect(weighted).toBeGreaterThan(raw);
  });
});

describe("dream reading rubric — issue penalties", () => {
  test("safety issue caps the score hard", () => {
    expect(applyIssuePenalties(90, [{ type: "safety", severity: "critical", evidence: "암을 예지" }])).toBeLessThanOrEqual(25);
  });

  test("fabrication subtracts a major penalty", () => {
    expect(applyIssuePenalties(80, [{ type: "fabrication", severity: "major", evidence: "x" }])).toBe(55);
  });

  test("fallback caps at 45", () => {
    expect(applyIssuePenalties(90, [{ type: "fallback", severity: "major", evidence: "x" }])).toBeLessThanOrEqual(45);
  });

  test("no issues leaves the score unchanged", () => {
    expect(applyIssuePenalties(72, [])).toBe(72);
  });
});

describe("dream reading rubric — deterministic gates", () => {
  test("flags nothing on a clean grounded reading", () => {
    expect(detectDeterministicIssues(cleanReading, ["돼지", "집"])).toEqual([]);
  });

  test("flags a health/death prediction as safety", () => {
    const issues = detectDeterministicIssues(
      { ...cleanReading, interpretation: "이 꿈은 큰 병에 걸린다는 것을 예지합니다." },
      ["돼지"],
    );
    expect(issues.some((i) => i.type === "safety")).toBe(true);
  });

  test("flags a symbol reading not in confirmed evidence as fabrication", () => {
    const issues = detectDeterministicIssues(
      { ...cleanReading, symbolReadings: [{ symbol: "용", reading: "지어낸 해석" }] },
      ["돼지", "집"],
    );
    expect(issues.some((i) => i.type === "fabrication")).toBe(true);
  });

  test("flags a ~냥 tic as voice but not the reader name", () => {
    expect(detectDeterministicIssues({ ...cleanReading, interpretation: "좋은 꿈이에요. 잘 풀릴 거예요냥." }, ["돼지"]).some((i) => i.type === "voice")).toBe(true);
    // 'From. 검은냥' 같은 리더 이름은 voice 위반 아님.
    expect(detectDeterministicIssues({ ...cleanReading, interpretation: "포근한 밤이에요. From. 검은냥" }, ["돼지"]).some((i) => i.type === "voice")).toBe(false);
  });

  test("flags machinery jargon leak as voice", () => {
    expect(
      detectDeterministicIssues({ ...cleanReading, interpretation: "근거가 충분해 sceneModifier로 보면 좋아요." }, ["돼지"]).some((i) => i.type === "voice"),
    ).toBe(true);
  });

  test("flags the deterministic baseline fallback", () => {
    const issues = detectDeterministicIssues(
      { summary: "집, 돼지가 특히 남은 꿈", interpretation: "단정하긴 어렵지만, 집은 자기 영역과 연결되어 보여요.", symbolReadings: [] },
      ["집", "돼지"],
    );
    expect(issues.some((i) => i.type === "fallback")).toBe(true);
  });
});

describe("dream reading rubric — parse", () => {
  test("parses a valid judge object and clamps out-of-range scores", () => {
    const raw = JSON.parse(JSON.stringify(groupsWithScore(7))) as Record<string, unknown>;
    (raw as any).ownership.sceneBinding.score = 99; // out of range
    (raw as any).verdict = "good";
    const parsed = parseRubricGroups(raw);
    expect(parsed?.groups.ownership.sceneBinding.score).toBe(10);
    expect(parsed?.verdict).toBe("good");
  });

  test("returns null when a sub-score is missing", () => {
    const raw: any = groupsWithScore(5);
    delete raw.sense.coherence;
    expect(parseRubricGroups(raw)).toBeNull();
  });
});
