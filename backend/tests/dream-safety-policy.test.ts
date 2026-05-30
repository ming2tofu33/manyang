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

  test("flags pregnancy (as tradition), crisis, and death while crisis dominates", () => {
    const policy = analyzeDreamSafetyPolicy({
      dreamText:
        "Is this a pregnancy dream, will I win the lottery, and does a death dream mean someone will die? I do not want to live.",
      locale: "en",
    });

    expect(policy.risks.map((risk) => risk.type)).toEqual(
      expect.arrayContaining(["pregnancy", "crisis", "deathOrViolence"]),
    );
    expect(policy.risks.find((risk) => risk.type === "pregnancy")?.claimMode).toBe("tradition");
    expect(policy.highestSeverity).toBe("high");
    expect(policy.promptDirectives.join(" ")).toContain("Do not predict");
    expect(policy.userFacingNotice).toContain("local emergency services");
    // 위기/의료 등 진지 주제가 있으면 재미용 점괘는 전부 꺼진다.
    expect(policy.allowedPlayfulClaims).toEqual([]);
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
      expect.arrayContaining(["medical", "crisis"]),
    );
    expect(policy.highestSeverity).toBe("high");
    expect(policy.risks.flatMap((risk) => risk.evidenceTerms)).toEqual(
      expect.arrayContaining(["피", "암", "죽고 싶"]),
    );
    // 돈·복권은 더 이상 위험으로 차단하지 않지만, 의료·위기가 있어 재미용 점괘는 꺼진다.
    expect(policy.allowedPlayfulClaims).toEqual([]);
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
      expect.arrayContaining(["medical", "pregnancy", "deathOrViolence", "crisis"]),
    );
    expect(policy.highestSeverity).toBe("high");
  });

  test("allows playful wealth/luck/love fortune by default for an ordinary dream", () => {
    const policy = analyzeDreamSafetyPolicy({
      dreamText: "돼지가 나와서 나를 따라다녔어. 기분이 좋았어.",
      locale: "ko",
    });

    expect(policy.risks).toEqual([]);
    expect(policy.allowedPlayfulClaims).toEqual(["wealth", "luck", "love"]);
    expect(policy.userFacingNotice).toBeUndefined();
    expect(policy.blockedClaims).toEqual([]);
  });

  test("treats a money dream as playful, not a blocked financial risk", () => {
    const policy = analyzeDreamSafetyPolicy({
      dreamText: "복권에 당첨돼서 돈을 잔뜩 줍는 꿈을 꿨어.",
      locale: "ko",
    });

    expect(policy.risks).toEqual([]);
    expect(policy.allowedPlayfulClaims).toEqual(["wealth", "luck", "love"]);
    expect(policy.userFacingNotice).toBeUndefined();
  });

  test("treats a pregnancy dream as tradition lore without a scary notice", () => {
    const policy = analyzeDreamSafetyPolicy({
      dreamText: "구렁이가 나오는 태몽 같은 꿈을 꿨어.",
      locale: "ko",
    });

    const pregnancy = policy.risks.find((risk) => risk.type === "pregnancy");
    expect(pregnancy?.claimMode).toBe("tradition");
    expect(policy.userFacingNotice).toBeUndefined();
    expect(policy.blockedClaims).toEqual([]);
    // 태몽(설화)은 재미용 점괘를 끄지 않는다.
    expect(policy.allowedPlayfulClaims).toEqual(["wealth", "luck", "love"]);
  });
});
