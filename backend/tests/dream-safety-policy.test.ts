import { describe, expect, test } from "vitest";

import { analyzeDreamSafetyPolicy } from "../src/services/dream-safety-policy";

describe("analyzeDreamSafetyPolicy", () => {
  test("flags medical diagnostic requests and gives a diagnosis notice", () => {
    const policy = analyzeDreamSafetyPolicy({
      dreamText: "I dreamed I was bleeding in a hospital. Does this mean I have cancer?",
      locale: "en",
    });

    expect(policy.risks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "medical",
          severity: "medium",
        }),
      ]),
    );
    expect(policy.userFacingNotice).toContain("not a medical diagnosis");
    expect(policy.blockedClaims).toContain("medical diagnosis or health prediction");
  });

  test("flags pregnancy, financial, crisis, and death prediction requests", () => {
    const policy = analyzeDreamSafetyPolicy({
      dreamText:
        "Is this a pregnancy dream, will I win the lottery, and does a death dream mean someone will die? I do not want to live.",
      locale: "en",
    });

    expect(policy.risks.map((risk) => risk.type)).toEqual(
      expect.arrayContaining(["pregnancy", "financial", "crisis", "deathOrViolence"]),
    );
    expect(policy.highestSeverity).toBe("high");
    expect(policy.promptDirectives.join(" ")).toContain("Do not predict");
    expect(policy.userFacingNotice).toContain("local emergency services");
  });

  test("returns Korean notices for Korean diagnostic requests", () => {
    const policy = analyzeDreamSafetyPolicy({
      dreamText: "꿈에서 병원에 있었고 피가 났어. 혹시 큰 병이나 암을 예지하는 꿈일까?",
      locale: "ko",
    });

    expect(policy.risks.map((risk) => risk.type)).toContain("medical");
    expect(policy.userFacingNotice).toContain("의학적 진단");
  });

  test("does not flag unrelated Korean substrings inside ordinary words", () => {
    const policy = analyzeDreamSafetyPolicy({
      dreamText: "커피를 마시고 피곤해서 피아노를 치다가 암막 커튼과 암호, 돈까스와 돈독한 친구가 나왔어.",
      locale: "ko",
    });

    expect(policy.risks).toEqual([]);
    expect(policy.hasRisk).toBe(false);
    expect(policy.highestSeverity).toBe("none");
  });

  test("still flags Korean safety terms with particles and common endings", () => {
    const policy = analyzeDreamSafetyPolicy({
      dreamText: "꿈에서 피가 났고 암을 걱정했어. 돈이 많이 나오는 꿈이 복권 예지인지도 궁금해. 어제는 죽고 싶었어.",
      locale: "ko",
    });

    expect(policy.risks.map((risk) => risk.type)).toEqual(
      expect.arrayContaining(["medical", "financial", "crisis"]),
    );
    expect(policy.highestSeverity).toBe("high");
    expect(policy.risks.flatMap((risk) => risk.evidenceTerms)).toEqual(
      expect.arrayContaining(["피", "암", "돈", "복권", "죽고 싶"]),
    );
  });

  test("does not flag unrelated English substrings inside longer words", () => {
    const policy = analyzeDreamSafetyPolicy({
      dreamText: "I saw a diet book, a birthday cake, a skilled pianist, and a rich-looking color palette.",
      locale: "en",
    });

    expect(policy.risks).toEqual([]);
  });

  test("still flags English safety terms at word and phrase boundaries", () => {
    const policy = analyzeDreamSafetyPolicy({
      dreamText: "I dreamed about blood, cancer, a pregnancy dream, lottery money, death, and I don't want to live.",
      locale: "en",
    });

    expect(policy.risks.map((risk) => risk.type)).toEqual(
      expect.arrayContaining(["medical", "pregnancy", "financial", "deathOrViolence", "crisis"]),
    );
    expect(policy.highestSeverity).toBe("high");
  });
});
