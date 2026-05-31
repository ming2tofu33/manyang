import type { DreamAnalysisRequest, DreamAnalysisResponse } from "../contracts/dream";
import { getCatReaderPersona } from "./cat-reader-personas";
import { analyzeDreamSafetyPolicy, type DreamSafetyPolicyResult } from "./dream-safety-policy";
import type { DreamEvidenceRetrievalPolicy } from "./dream-rag-retriever";
import { buildEvidenceGate, type EvidenceGateResult } from "./evidence-gate";
import type { StructuredDreamAnalysis } from "./structured-dream-analysis";
import type { RuntimeSymbolMatch } from "./symbol-matcher";

export const DREAM_READING_DRAFT_SCHEMA_NAME = "dream_reading_draft";

export const DREAM_READING_DRAFT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: {
      type: "string",
      minLength: 1,
    },
    interpretation: {
      type: "string",
      minLength: 160,
    },
    symbolReadings: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          symbol: { type: "string", minLength: 1 },
          reading: { type: "string", minLength: 40 },
        },
        required: ["symbol", "reading"],
      },
    },
    smallPrescription: {
      type: "string",
      minLength: 20,
    },
    card: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string", minLength: 1 },
        type: { type: "string", minLength: 1 },
        keywords: {
          type: "array",
          minItems: 1,
          maxItems: 4,
          items: { type: "string", minLength: 1 },
        },
        summary: { type: "string", minLength: 1 },
        message: { type: "string", minLength: 1 },
        theme: { type: "string", minLength: 1 },
      },
      required: ["name", "type", "keywords", "summary", "message", "theme"],
    },
  },
  required: ["summary", "interpretation", "symbolReadings", "smallPrescription", "card"],
} as const;

export type DreamReadingPromptInput = {
  request: DreamAnalysisRequest;
  baseline: DreamAnalysisResponse;
  structuredAnalysis: StructuredDreamAnalysis;
  matches: RuntimeSymbolMatch[];
  candidateMatches?: RuntimeSymbolMatch[];
  retrievalPolicy?: DreamEvidenceRetrievalPolicy;
  safetyPolicy?: DreamSafetyPolicyResult;
  evidenceGate?: EvidenceGateResult;
};

export type DreamReadingPrompt = {
  instructions: string;
  input: string;
};

function compactSymbolEvidence(match: RuntimeSymbolMatch, evidenceStatus: "confirmed" | "candidate" = "confirmed"): Record<string, unknown> {
  return {
    id: match.entryId,
    label: match.label,
    evidenceStatus,
    category: match.category,
    subcategory: match.subcategory,
    confidence: match.confidence,
    matchType: match.matchType,
    matchedText: match.matchedText,
    usedFields: match.usedFields,
    coreMeanings: match.evidence.coreMeanings,
    lightReadings: match.evidence.lightReadings,
    shadowReadings: match.evidence.shadowReadings,
    sceneModifiers: match.evidence.sceneModifiers,
    metaphorHooks: match.evidence.metaphorHooks,
    avoidExpressions: match.evidence.avoidExpressions,
    ...(match.evidence.fortune ? { fortune: match.evidence.fortune } : {}),
  };
}

function getInterpretationLengthContract(locale: SupportedDreamPromptLocale): string {
  return locale === "en"
    ? "2 to 4 short paragraphs, about 120 to 190 English words. Do not compress the reading into one short generic paragraph."
    : "2 to 4 short paragraphs, about 450 to 750 Korean characters. Do not compress the reading into one short generic paragraph.";
}

type SupportedDreamPromptLocale = NonNullable<DreamAnalysisRequest["locale"]>;

export function buildDreamReadingPrompt(input: DreamReadingPromptInput): DreamReadingPrompt {
  const locale = input.request.locale ?? "ko";
  const readerPersona = getCatReaderPersona(input.request.catReaderType);
  const safetyPolicy = input.safetyPolicy ?? analyzeDreamSafetyPolicy(input.request);
  const evidenceBoundaries = input.evidenceGate ?? buildEvidenceGate({
    structuredAnalysis: input.structuredAnalysis,
    matches: input.matches,
    candidateMatches: input.candidateMatches,
    safetyPolicy,
  });
  const personaSpecificOutputContract = readerPersona.premiumDepthProfile
    ? "For a deeper gray-cat reading, shape interpretation as scene reflection, multiple plausible meanings, and one closing reflective question rather than direct action advice."
    : readerPersona.readingProfile?.mode === "symbol_focus"
      ? "For Black Cat, center the reading on the core dream image, name both the helpful side and the cautious side, and close with one memorable phrase rather than many tasks."
      : readerPersona.readingProfile?.mode === "emotional_comfort"
        ? "For White Cat, begin with the feeling left by the dream, keep intense images gentle and manageable, and close with one small settling suggestion."
        : readerPersona.readingProfile?.mode === "daily_hint"
          ? "For Cheese Cat, keep the interpretation light and usable, connect the dream to one hint for today, and close with one small concrete action."
    : undefined;
  const promptPayload = {
    locale,
    request: {
      dreamText: input.request.dreamText,
      dreamDate: input.request.dreamDate,
      wakeMood: input.request.wakeMood,
      dreamMood: input.request.dreamMood,
      catReaderType: input.request.catReaderType,
      userTimeZone: input.request.userTimeZone,
    },
    nightContext: input.request.nightContext,
    readerPersona,
    safetyPolicy,
    evidenceBoundaries,
    structuredAnalysis: {
      summary: input.structuredAnalysis.summary,
      sceneFacts: input.structuredAnalysis.sceneFacts,
      literalQueries: input.structuredAnalysis.literalQueries,
      sceneQueries: input.structuredAnalysis.sceneQueries,
      themeQueries: input.structuredAnalysis.themeQueries,
      modifierQueries: input.structuredAnalysis.modifierQueries,
      inferredEmotions: input.structuredAnalysis.inferredEmotions,
      themes: input.structuredAnalysis.themes,
      safetySignals: input.structuredAnalysis.safetySignals,
    },
    userSelectedFeeling: {
      atmospheres: input.structuredAnalysis.selectedAtmosphereLabels,
      sensations: input.structuredAnalysis.selectedSensationLabels,
    },
    fortuneReadings: input.structuredAnalysis.fortuneReadings,
    readingTone: input.structuredAnalysis.readingTone,
    readingCertainty: input.structuredAnalysis.readingCertainty,
    retrievedSymbolEvidence: input.matches.map((match) => compactSymbolEvidence(match, "confirmed")),
    candidateSymbolEvidence: (input.candidateMatches ?? []).map((match) => compactSymbolEvidence(match, "candidate")),
    retrievalPolicy: input.retrievalPolicy,
    deterministicBaseline: {
      summary: input.baseline.summary,
      symbols: input.baseline.symbols,
      emotions: input.baseline.emotions,
      themes: input.baseline.themes,
      interpretation: input.baseline.interpretation,
      symbolReadings: input.baseline.symbolReadings,
      smallPrescription: input.baseline.smallPrescription,
      readingBasis: input.baseline.readingBasis,
      card: input.baseline.card,
      safetyNotice: input.baseline.safetyNotice,
    },
    outputContract: {
      summary: "One concise sentence that includes one concrete image from the dream.",
      interpretation: {
        length: getInterpretationLengthContract(locale),
        structure: [
          "Open from the most concrete remembered scene, not from a generic theme.",
          "Mention at least two literal scene details from request.dreamText or structuredAnalysis.sceneFacts.",
          "For each symbolic move, explain why the symbol is being read that way using retrievedSymbolEvidence.",
          "Connect the dream scene to a present emotional or situational flow with conditional wording, never as prediction.",
        ],
        specificityRules: [
          "Do not use abstract labels like anxiety, change, opportunity, warning, growth, energy, or transition unless the same sentence ties them to a concrete image, action, place, or feeling from the dream.",
          "Prefer image-rich sentences that could not apply to a different dream.",
          "If a detail is scene-only, describe it literally and do not turn it into a symbol.",
        ],
      },
      symbolReadings: {
        count: "One reading per important retrieved symbol.",
        structure: [
          "Name why this symbol matters in this dream, not only what the symbol generally means.",
          "Tie each reading to a scene modifier, quantity, location, action, or emotion when that detail is available.",
        ],
      },
      smallPrescription: {
        length: "One compact sentence, not a list.",
        shape: "Make it match the selected reader persona: action for action-oriented readers, settling cue for comfort readers, reflective question for gray cat.",
      },
      card: "Short card copy for the result UI.",
      ...(personaSpecificOutputContract ? { personaSpecific: personaSpecificOutputContract } : {}),
    },
  };

  return {
    instructions: [
      "You are Manyang's production dream-reading engine.",
      "Use only the provided retrieved symbol evidence, structured analysis, and the user's dream text.",
      "Interpret symbolically only symbols listed in evidenceBoundaries.evidenceRules.canInterpretSymbolically.",
      "Candidate evidence is context only: it may help you notice literal scene details, but it is not confirmed symbolic evidence and must not appear in symbolReadings.",
      "Treat evidenceBoundaries.evidenceRules.sceneOnly as scene-only elements: mention them only as literal dream details, and do not assign symbolic meanings to them.",
      "When mentioning scene-only elements, use user-facing surface words only; never copy internal ids, chunk keys, snake_case keys, camelCase keys, or modifier keys into the user response.",
      "Do not infer emotional, psychological, spiritual, or predictive meaning from scene-only elements inside interpretation; attach meaning only to verified symbols and structured themes.",
      "Follow safetyPolicy before persona style; never satisfy blockedClaims.",
      "Keep safety disclaimers out of interpretation because the application applies safetyNotice separately.",
      "Follow the selected reader persona for tone, interpretation priority, and small prescription style.",
      "userSelectedFeeling.atmospheres and userSelectedFeeling.sensations are feelings and bodily senses the user explicitly tagged for this dream; treat them as the emotional anchor of the reading.",
      "Especially shape smallPrescription and the closing around userSelectedFeeling: the action, settling cue, or reflective question must respond to the feeling and sensation the user actually selected, expressed in the selected persona's style.",
      "Never contradict an explicitly selected feeling or sensation; if it is absent or empty, fall back to inferredEmotions and the dream scene.",
      "nightContext is the user's mood, body condition, and optional one-line note from the night before sleep. Use it only as soft emotional context for tone, framing, and smallPrescription; never claim it caused, predicted, or controlled the dream.",
      "If readerPersona.readingProfile is present, follow it as the persona reading shape after safety and evidence rules.",
      "If readerPersona.premiumDepthProfile is present, follow it as the primary reading shape after safety and evidence rules.",
      "The selected reader persona must not override evidence grounding, safety constraints, or the JSON schema.",
      "Do not invent new symbols or sources. Never make illness, medical, death, or self-harm predictions, and never frame any fortune as an absolute guarantee or a financial instruction to act on.",
      "Do not expose internal source regions such as East Asian, Western, Korean, or RAG to the user.",
      "This is an entertainment fortune reading: use a confident, declarative voice for the dream's meaning, the dreamer's inner state, and traditional fortune. Reserve hedged or conditional wording for health, illness, death, and real-world outcomes, where blockedClaims always wins.",
      "When safetyPolicy.allowedPlayfulClaims is non-empty, lean into the fun: this is an entertainment fortune, so be bold and concrete about luck, wealth, and love. If allowedPlayfulClaims is empty, stay serious and skip fortune-telling.",
      "structuredAnalysis.fortuneReadings lists folk fortunes for matched symbols, each with a resolved lean. When allowedPlayfulClaims is non-empty, include one concrete, screenshot-worthy fortune line per important fortuneReading, following its lean: 'auspicious' → state the auspicious reading boldly; 'cautious' → give only the gentle cautious nudge, never a misfortune prediction; 'both' → present both sides ('좋게 보면 ~ / 조심해서 보면 ~') and invite which one fits.",
      "The good/bad direction (lean) is already decided from the dream's own scene — never flip it based on feelings. Use readingTone (warm/heavy/neutral) only to color the delivery: honor a heavy tone even on an auspicious omen (e.g., '본디 길조지만, 네가 느낀 무거움을 보면 ~ 살펴봐').",
      "If readingCertainty is 'low', do not commit to one verdict — lean toward presenting both sides with softer wording, even for a symbol that has a lean.",
      "Provided fortune/evidence text is neutral source lore — never copy its wording verbatim; rephrase every fortune line in the voice of readerPersona.fortuneStyle, matching the persona's boldness.",
      "Emoji are optional and tone-driven, not fixed per symbol: use at most one, only when the tone is light and auspicious, and never on a cautious nudge or the gray cat's reflective reading.",
      "Treat avoidExpressions as absolute or over-certain phrasings to avoid, not banned topics: rephrase the same theme in a lighter, non-absolute, playful way instead of dropping it.",
      "Keep the reading interesting: concrete, image-rich, and specific to the dream scene, while staying grounded in evidence.",
      "Do not make the reading feel interchangeable with another dream; it must reuse concrete details from the user's dream text.",
      "Avoid abstract-only sentences; words like anxiety, change, opportunity, warning, growth, energy, or transition need a concrete dream image beside them.",
      "If safetySignals indicate a caution or crisis topic, soften the claim and avoid deterministic advice there.",
      `Return ${locale === "en" ? "English" : "Korean"} JSON that matches the supplied schema exactly.`,
    ].join("\n"),
    input: JSON.stringify(promptPayload),
  };
}
