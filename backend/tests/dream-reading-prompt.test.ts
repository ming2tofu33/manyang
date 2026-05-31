import { describe, expect, test } from "vitest";

import { analyzeDream } from "../src/services/mock-analysis";
import { DREAM_READING_DRAFT_JSON_SCHEMA, buildDreamReadingPrompt } from "../src/services/dream-reading-prompt";
import { retrieveDreamEvidenceSet } from "../src/services/dream-rag-retriever";
import { analyzeDreamStructure } from "../src/services/structured-dream-analysis";
import { findRuntimeSymbolMatches } from "../src/services/symbol-matcher";

describe("buildDreamReadingPrompt", () => {
  test("does not inject the selected cat theme as a reader persona", () => {
    const request = {
      dreamText: "I dreamed that a snake appeared in my room.",
      locale: "en" as const,
      catReaderType: "white_cat" as const,
      wakeMood: "anxious",
    };

    const prompt = buildDreamReadingPrompt({
      request,
      baseline: analyzeDream(request),
      structuredAnalysis: analyzeDreamStructure(request),
      matches: findRuntimeSymbolMatches(request.dreamText, { locale: request.locale, limit: 5 }),
    });
    const payload = JSON.parse(prompt.input) as {
      request?: {
        catReaderType?: string;
      };
      readerPersona?: unknown;
      outputContract?: {
        personaSpecific?: string;
      };
    };

    expect(prompt.instructions).toContain("Use one stable Manyang voice regardless of selected cat theme");
    expect(prompt.instructions).not.toContain("readerPersona");
    expect(prompt.instructions).not.toContain("White Cat");
    expect(payload.request?.catReaderType).toBeUndefined();
    expect(payload.readerPersona).toBeUndefined();
    expect(payload.outputContract?.personaSpecific).toBeUndefined();
  });

  test("keeps prompt payload stable across cat themes", () => {
    const baseRequest = {
      dreamText: "I dreamed that a snake appeared in my room.",
      locale: "en" as const,
    };

    const whitePrompt = buildDreamReadingPrompt({
      request: { ...baseRequest, catReaderType: "white_cat" as const },
      baseline: analyzeDream({ ...baseRequest, catReaderType: "white_cat" }),
      structuredAnalysis: analyzeDreamStructure(baseRequest),
      matches: findRuntimeSymbolMatches(baseRequest.dreamText, { locale: baseRequest.locale, limit: 5 }),
    });
    const cheesePrompt = buildDreamReadingPrompt({
      request: { ...baseRequest, catReaderType: "cheese_cat" as const },
      baseline: analyzeDream({ ...baseRequest, catReaderType: "cheese_cat" }),
      structuredAnalysis: analyzeDreamStructure(baseRequest),
      matches: findRuntimeSymbolMatches(baseRequest.dreamText, { locale: baseRequest.locale, limit: 5 }),
    });

    const whitePayload = JSON.parse(whitePrompt.input) as {
      request?: { catReaderType?: string };
      outputContract?: { personaSpecific?: string };
    };
    const cheesePayload = JSON.parse(cheesePrompt.input) as {
      request?: { catReaderType?: string };
      outputContract?: { personaSpecific?: string };
    };

    expect(whitePayload.request?.catReaderType).toBeUndefined();
    expect(cheesePayload.request?.catReaderType).toBeUndefined();
    expect(whitePayload.outputContract?.personaSpecific).toBeUndefined();
    expect(cheesePayload.outputContract?.personaSpecific).toBeUndefined();
    expect(whitePayload.outputContract).toEqual(cheesePayload.outputContract);
  });

  test("injects safety policy into the prompt payload", () => {
    const request = {
      dreamText: "I dreamed I was bleeding in a hospital. Does this mean I have cancer?",
      locale: "en" as const,
      catReaderType: "white_cat" as const,
    };

    const prompt = buildDreamReadingPrompt({
      request,
      baseline: analyzeDream(request),
      structuredAnalysis: analyzeDreamStructure(request),
      matches: findRuntimeSymbolMatches(request.dreamText, { locale: request.locale, limit: 5 }),
    });
    const payload = JSON.parse(prompt.input) as {
      safetyPolicy?: {
        risks: Array<{ type: string }>;
        blockedClaims: string[];
        promptDirectives: string[];
      };
    };

    expect(prompt.instructions).toContain("Follow safetyPolicy before tone style");
    expect(payload.safetyPolicy?.risks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "medical",
        }),
      ]),
    );
    expect(payload.safetyPolicy?.blockedClaims).toContain("medical diagnosis or health prediction");
  });

  test("passes expanded selected atmosphere labels to the LLM prompt payload", () => {
    const request = {
      dreamText: "어두운 복도를 걷다가 문 너머의 빛을 보았다.",
      locale: "ko" as const,
      dreamAtmospheres: ["lonely", "mystical", "complex"],
      dreamSensations: ["falling"],
    };
    const structuredAnalysis = analyzeDreamStructure(request);
    const prompt = buildDreamReadingPrompt({
      request,
      baseline: analyzeDream(request),
      structuredAnalysis,
      matches: findRuntimeSymbolMatches(request.dreamText, { locale: request.locale, limit: 5 }),
    });
    const payload = JSON.parse(prompt.input) as {
      userSelectedFeeling?: {
        atmospheres?: string[];
        sensations?: string[];
      };
    };

    expect(payload.userSelectedFeeling?.atmospheres).toEqual(["쓸쓸함", "신비함", "복잡함"]);
    expect(payload.userSelectedFeeling?.sensations).toEqual(["떨어지는 느낌"]);
  });

  test("does not inject gray cat as a premium prompt mode", () => {
    const baseRequest = {
      dreamText: "I was walking through a school corridor, but every door kept changing places.",
      locale: "en" as const,
    };
    const grayPrompt = buildDreamReadingPrompt({
      request: { ...baseRequest, catReaderType: "gray_cat" as const },
      baseline: analyzeDream({ ...baseRequest, catReaderType: "gray_cat" }),
      structuredAnalysis: analyzeDreamStructure(baseRequest),
      matches: findRuntimeSymbolMatches(baseRequest.dreamText, { locale: baseRequest.locale, limit: 5 }),
    });
    const blackPrompt = buildDreamReadingPrompt({
      request: { ...baseRequest, catReaderType: "black_cat" as const },
      baseline: analyzeDream({ ...baseRequest, catReaderType: "black_cat" }),
      structuredAnalysis: analyzeDreamStructure(baseRequest),
      matches: findRuntimeSymbolMatches(baseRequest.dreamText, { locale: baseRequest.locale, limit: 5 }),
    });
    const grayPayload = JSON.parse(grayPrompt.input) as {
      outputContract?: {
        personaSpecific?: string;
      };
      readerPersona?: unknown;
      request?: { catReaderType?: string };
    };
    const blackPayload = JSON.parse(blackPrompt.input) as {
      outputContract?: {
        personaSpecific?: string;
      };
      readerPersona?: unknown;
      request?: { catReaderType?: string };
    };

    expect(grayPrompt.instructions).not.toContain("premiumDepthProfile");
    expect(grayPrompt.instructions).not.toContain("gray-cat");
    expect(grayPayload.readerPersona).toBeUndefined();
    expect(blackPayload.readerPersona).toBeUndefined();
    expect(grayPayload.request?.catReaderType).toBeUndefined();
    expect(blackPayload.request?.catReaderType).toBeUndefined();
    expect(grayPayload.outputContract?.personaSpecific).toBeUndefined();
    expect(blackPayload.outputContract?.personaSpecific).toBeUndefined();
  });

  test("does not inject free cat reading profiles into the prompt payload", () => {
    const baseRequest = {
      dreamText: "꿈에서 학교 복도에 있었고 문이 계속 바뀌었어.",
      locale: "ko" as const,
    };
    const blackPrompt = buildDreamReadingPrompt({
      request: { ...baseRequest, catReaderType: "black_cat" as const },
      baseline: analyzeDream({ ...baseRequest, catReaderType: "black_cat" }),
      structuredAnalysis: analyzeDreamStructure(baseRequest),
      matches: findRuntimeSymbolMatches(baseRequest.dreamText, { locale: baseRequest.locale, limit: 5 }),
    });
    const whitePrompt = buildDreamReadingPrompt({
      request: { ...baseRequest, catReaderType: "white_cat" as const },
      baseline: analyzeDream({ ...baseRequest, catReaderType: "white_cat" }),
      structuredAnalysis: analyzeDreamStructure(baseRequest),
      matches: findRuntimeSymbolMatches(baseRequest.dreamText, { locale: baseRequest.locale, limit: 5 }),
    });
    const cheesePrompt = buildDreamReadingPrompt({
      request: { ...baseRequest, catReaderType: "cheese_cat" as const },
      baseline: analyzeDream({ ...baseRequest, catReaderType: "cheese_cat" }),
      structuredAnalysis: analyzeDreamStructure(baseRequest),
      matches: findRuntimeSymbolMatches(baseRequest.dreamText, { locale: baseRequest.locale, limit: 5 }),
    });

    const blackPayload = JSON.parse(blackPrompt.input) as {
      readerPersona?: unknown;
      outputContract?: { personaSpecific?: string };
    };
    const whitePayload = JSON.parse(whitePrompt.input) as {
      readerPersona?: unknown;
      outputContract?: { personaSpecific?: string };
    };
    const cheesePayload = JSON.parse(cheesePrompt.input) as {
      readerPersona?: unknown;
      outputContract?: { personaSpecific?: string };
    };

    expect(blackPrompt.instructions).not.toContain("readingProfile");
    expect(blackPayload.readerPersona).toBeUndefined();
    expect(whitePayload.readerPersona).toBeUndefined();
    expect(cheesePayload.readerPersona).toBeUndefined();
    expect(blackPayload.outputContract?.personaSpecific).toBeUndefined();
    expect(whitePayload.outputContract?.personaSpecific).toBeUndefined();
    expect(cheesePayload.outputContract?.personaSpecific).toBeUndefined();
  });

  test("injects evidence boundaries for scene-only unverified elements", () => {
    const request = {
      dreamText: "꿈에서 병원에 있었고 몸에서 피가 나는 것 같았어. 혹시 큰 병이나 암을 예지하는 꿈일까?",
      locale: "ko" as const,
      catReaderType: "gray_cat" as const,
    };

    const prompt = buildDreamReadingPrompt({
      request,
      baseline: analyzeDream(request),
      structuredAnalysis: analyzeDreamStructure(request),
      matches: findRuntimeSymbolMatches(request.dreamText, { locale: request.locale, limit: 5 }),
    });
    const payload = JSON.parse(prompt.input) as {
      evidenceBoundaries?: {
        verifiedSymbols: Array<{ label: string }>;
        unverifiedSceneElements: string[];
        evidenceRules: {
          canInterpretSymbolically: string[];
          sceneOnly: string[];
        };
      };
    };

    expect(prompt.instructions).toContain("scene-only elements");
    expect(payload.evidenceBoundaries?.verifiedSymbols.map((symbol) => symbol.label)).toContain("병원");
    expect(payload.evidenceBoundaries?.verifiedSymbols.map((symbol) => symbol.label)).toContain("피");
    expect(payload.evidenceBoundaries?.evidenceRules.canInterpretSymbolically).toContain("병원");
    expect(payload.evidenceBoundaries?.evidenceRules.canInterpretSymbolically).toContain("피");
    expect(payload.evidenceBoundaries?.evidenceRules.sceneOnly).toEqual(expect.arrayContaining(["암", "큰 병"]));
    expect(payload.evidenceBoundaries?.evidenceRules.sceneOnly).not.toContain("피");
  });

  test("forbids deriving interpretation meaning from scene-only elements", () => {
    const request = {
      dreamText: "꿈에서 병원에 있었고 몸에서 피가 나는 것 같았어. 혹시 큰 병이나 암을 예지하는 꿈일까?",
      locale: "ko" as const,
      catReaderType: "gray_cat" as const,
    };

    const prompt = buildDreamReadingPrompt({
      request,
      baseline: analyzeDream(request),
      structuredAnalysis: analyzeDreamStructure(request),
      matches: findRuntimeSymbolMatches(request.dreamText, { locale: request.locale, limit: 5 }),
    });

    expect(prompt.instructions).toContain("Do not infer emotional, psychological, spiritual, or predictive meaning");
    expect(prompt.instructions).toContain("Keep safety disclaimers out of interpretation");
  });

  test("separates confirmed and candidate RAG evidence in the prompt payload", () => {
    const request = {
      dreamText: "돌봄과 취약함이 크게 느껴졌고 확인을 기다리는 장소에 있는 느낌이었어.",
      locale: "ko" as const,
      catReaderType: "black_cat" as const,
    };
    const structuredAnalysis = analyzeDreamStructure(request);
    const retrieval = retrieveDreamEvidenceSet({
      dreamText: request.dreamText,
      locale: request.locale,
      structuredAnalysis,
      limit: 5,
    });

    const prompt = buildDreamReadingPrompt({
      request,
      baseline: analyzeDream(request),
      structuredAnalysis,
      matches: retrieval.confirmedEvidence,
      candidateMatches: retrieval.candidateEvidence,
    });
    const payload = JSON.parse(prompt.input) as {
      retrievedSymbolEvidence?: Array<{ id: string }>;
      candidateSymbolEvidence?: Array<{ id: string; evidenceStatus: string }>;
      evidenceBoundaries?: {
        evidenceRules: {
          canInterpretSymbolically: string[];
          sceneOnly: string[];
        };
      };
    };

    expect(prompt.instructions).toContain("Candidate evidence is context only");
    expect(prompt.instructions).toContain("never copy internal ids");
    expect(payload.retrievedSymbolEvidence).toEqual([]);
    expect(payload.candidateSymbolEvidence).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "hospital", evidenceStatus: "candidate" })]),
    );
    expect(payload.evidenceBoundaries?.evidenceRules.canInterpretSymbolically).not.toContain("병원");
    expect(payload.evidenceBoundaries?.evidenceRules.sceneOnly).toContain("병원");
    expect(payload.evidenceBoundaries?.evidenceRules.sceneOnly).not.toContain("hospital");
  });

  test("requires dense scene-grounded output instead of short generic interpretation", () => {
    const request = {
      dreamText: "I was standing on my own land, and a huge snake plus many smaller snakes moved around me.",
      locale: "en" as const,
      catReaderType: "black_cat" as const,
      wakeMood: "overwhelmed",
    };

    const prompt = buildDreamReadingPrompt({
      request,
      baseline: analyzeDream(request),
      structuredAnalysis: analyzeDreamStructure(request),
      matches: findRuntimeSymbolMatches(request.dreamText, { locale: request.locale, limit: 5 }),
    });
    const payload = JSON.parse(prompt.input) as {
      outputContract?: {
        summary?: string;
        interpretation?: {
          length?: string;
          structure?: string[];
          specificityRules?: string[];
        };
        symbolReadings?: {
          structure?: string[];
        };
      };
    };

    expect(prompt.instructions).toContain("Do not make the reading feel interchangeable with another dream");
    expect(prompt.instructions).toContain("Avoid abstract-only sentences");
    // 의미-우선: 유저가 쓴 꿈을 되돌려주지 말고 해몽부터.
    expect(prompt.instructions).toContain("they came for its MEANING, not a summary of their own words");
    // 리딩 기계장치 용어 누수 차단.
    expect(prompt.instructions).toContain("Never reference the machinery of the reading");
    // 길흉 발화 필수 + 한줄 해몽 verdict.
    expect(prompt.instructions).toContain("this is REQUIRED, not optional");
    // summary는 평결만, '한줄 해몽:' 같은 라벨 접두어 금지.
    expect(payload.outputContract?.summary).toContain("Do NOT prefix it with any label");
    expect(payload.outputContract?.interpretation?.length).toContain("2 to 4 short paragraphs");
    expect(payload.outputContract?.interpretation?.structure).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Open with what the dream MEANS or foretells"),
        expect.stringContaining("as the reason a meaning is read that way"),
      ]),
    );
    expect(payload.outputContract?.interpretation?.specificityRules).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Do not use abstract labels"),
        expect.stringContaining("concrete image"),
      ]),
    );
    expect(payload.outputContract?.symbolReadings?.structure).toEqual(
      expect.arrayContaining([expect.stringContaining("what the symbol MEANS in this dream")]),
    );
  });

  test("raises the structured output floor so real LLM drafts cannot be receipt-thin", () => {
    expect(DREAM_READING_DRAFT_JSON_SCHEMA.properties.interpretation.minLength).toBeGreaterThanOrEqual(160);
    expect(
      DREAM_READING_DRAFT_JSON_SCHEMA.properties.symbolReadings.items.properties.reading.minLength,
    ).toBeGreaterThanOrEqual(40);
    expect(DREAM_READING_DRAFT_JSON_SCHEMA.properties.smallPrescription.minLength).toBeGreaterThanOrEqual(20);
  });
});
