import { describe, expect, test } from "vitest";

import { analyzeDream } from "../src/services/mock-analysis";
import { DREAM_READING_DRAFT_JSON_SCHEMA, buildDreamReadingPrompt } from "../src/services/dream-reading-prompt";
import { retrieveDreamEvidenceSet } from "../src/services/dream-rag-retriever";
import { analyzeDreamStructure } from "../src/services/structured-dream-analysis";
import { findRuntimeSymbolMatches } from "../src/services/symbol-matcher";

describe("buildDreamReadingPrompt", () => {
  test("injects the selected reader persona into the prompt payload", () => {
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
      readerPersona?: {
        id: string;
        interpretationPriority: string[];
        toneDirectives: string[];
        smallPrescriptionStyle: string;
      };
    };

    expect(prompt.instructions).toContain("Follow the selected reader persona");
    expect(payload.readerPersona).toMatchObject({
      id: "white_cat",
      smallPrescriptionStyle: expect.stringContaining("reassuring"),
    });
    expect(payload.readerPersona?.interpretationPriority).toContain("emotional regulation");
    expect(payload.readerPersona?.toneDirectives.join(" ")).toContain("gentle");
  });

  test("keeps persona priorities distinct across readers", () => {
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
      readerPersona?: { interpretationPriority: string[] };
    };
    const cheesePayload = JSON.parse(cheesePrompt.input) as {
      readerPersona?: { interpretationPriority: string[] };
    };

    expect(whitePayload.readerPersona?.interpretationPriority).toContain("emotional regulation");
    expect(cheesePayload.readerPersona?.interpretationPriority).toContain("practical next action");
    expect(whitePayload.readerPersona?.interpretationPriority).not.toEqual(
      cheesePayload.readerPersona?.interpretationPriority,
    );
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

    expect(prompt.instructions).toContain("Follow safetyPolicy before persona style");
    expect(payload.safetyPolicy?.risks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "medical",
        }),
      ]),
    );
    expect(payload.safetyPolicy?.blockedClaims).toContain("medical diagnosis or health prediction");
  });

  test("injects gray cat premium reading mode without leaking premium profile to non-premium readers", () => {
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
      readerPersona?: {
        premiumDepthProfile?: {
          mode: string;
          principle: string;
          readingShape: string[];
          closingStyle: string;
        };
      };
      outputContract?: {
        personaSpecific?: string;
      };
    };
    const blackPayload = JSON.parse(blackPrompt.input) as {
      readerPersona?: {
        premiumDepthProfile?: unknown;
      };
      outputContract?: {
        personaSpecific?: string;
      };
    };

    expect(grayPrompt.instructions).toContain("If readerPersona.premiumDepthProfile is present");
    expect(grayPayload.readerPersona?.premiumDepthProfile).toMatchObject({
      mode: "gray_depth",
      closingStyle: expect.stringContaining("reflective question"),
    });
    expect(grayPayload.outputContract?.personaSpecific).toContain("deeper gray-cat reading");
    expect(blackPayload.readerPersona?.premiumDepthProfile).toBeUndefined();
  });

  test("injects free cat reading profiles into the prompt payload", () => {
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
      readerPersona?: { readingProfile?: { mode: string; principle: string } };
      outputContract?: { personaSpecific?: string };
    };
    const whitePayload = JSON.parse(whitePrompt.input) as {
      readerPersona?: { readingProfile?: { mode: string; principle: string } };
      outputContract?: { personaSpecific?: string };
    };
    const cheesePayload = JSON.parse(cheesePrompt.input) as {
      readerPersona?: { readingProfile?: { mode: string; principle: string } };
      outputContract?: { personaSpecific?: string };
    };

    expect(blackPrompt.instructions).toContain("If readerPersona.readingProfile is present");
    expect(blackPayload.readerPersona?.readingProfile).toMatchObject({
      mode: "symbol_focus",
      principle: expect.stringContaining("clearest scene"),
    });
    expect(whitePayload.readerPersona?.readingProfile).toMatchObject({
      mode: "emotional_comfort",
      principle: expect.stringContaining("feeling left by the dream"),
    });
    expect(cheesePayload.readerPersona?.readingProfile).toMatchObject({
      mode: "daily_hint",
      principle: expect.stringContaining("hint the user can use today"),
    });
    expect(blackPayload.outputContract?.personaSpecific).toContain("core dream image");
    expect(whitePayload.outputContract?.personaSpecific).toContain("feeling left by the dream");
    expect(cheesePayload.outputContract?.personaSpecific).toContain("one small concrete action");
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
    expect(payload.outputContract?.interpretation?.length).toContain("2 to 4 short paragraphs");
    expect(payload.outputContract?.interpretation?.structure).toEqual(
      expect.arrayContaining([
        expect.stringContaining("at least two literal scene details"),
        expect.stringContaining("why the symbol is being read that way"),
      ]),
    );
    expect(payload.outputContract?.interpretation?.specificityRules).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Do not use abstract labels"),
        expect.stringContaining("concrete image"),
      ]),
    );
    expect(payload.outputContract?.symbolReadings?.structure).toEqual(
      expect.arrayContaining([expect.stringContaining("why this symbol matters in this dream")]),
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
