export const TAROT_READING_DRAFT_SCHEMA_NAME = "tarot_reading_draft";

export const TAROT_READING_DRAFT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: {
      type: "string",
      minLength: 1,
    },
    overview: {
      type: "string",
      minLength: 80,
    },
    keywords: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "string",
        minLength: 1,
      },
    },
    cardReadings: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          position: {
            type: "string",
            enum: ["today", "situation", "flow", "advice"],
          },
          heading: {
            type: "string",
            minLength: 1,
          },
          reading: {
            type: "string",
            minLength: 40,
          },
        },
        required: ["position", "heading", "reading"],
      },
    },
    advice: {
      type: "string",
      minLength: 40,
    },
  },
  required: ["title", "overview", "keywords", "cardReadings", "advice"],
} as const;

export type TarotReadingSpread = "daily_one_card" | "daily_three_card";
export type TarotReadingPosition = "today" | "situation" | "flow" | "advice";
export type TarotReadingOrientation = "upright" | "reversed";

export type TarotPromptCardMeaning = {
  summary: string;
  dailyFlow: string;
  advice: string;
};

export type TarotPromptCard = {
  id: number;
  nameKo: string;
  nameEn: string;
  keywords: readonly string[];
  visualSymbols: readonly string[];
  mood: string;
  upright: TarotPromptCardMeaning;
  reversed: TarotPromptCardMeaning;
};

export type TarotReadingPromptCardInput = {
  position: TarotReadingPosition;
  orientation: TarotReadingOrientation;
  card: TarotPromptCard;
};

export type TarotReadingPromptInput = {
  appDate: string;
  locale?: "ko" | "en";
  spread: TarotReadingSpread;
  cards: TarotReadingPromptCardInput[];
};

export type TarotReadingPrompt = {
  instructions: string;
  input: string;
};

function getSpreadContract(spread: TarotReadingSpread): string {
  if (spread === "daily_three_card") {
    return "Use exactly three cardReadings in this order: situation, flow, advice.";
  }

  return "Use exactly one cardReading with position today.";
}

function getLengthContract(spread: TarotReadingSpread, locale: "ko" | "en"): string {
  if (locale === "en") {
    return spread === "daily_three_card"
      ? "overview 120 to 190 English words; each card reading 45 to 90 English words; advice one practical sentence."
      : "overview 70 to 120 English words; card reading 45 to 80 English words; advice one practical sentence.";
  }

  return spread === "daily_three_card"
    ? "overview 350 to 620 Korean characters; each card reading 120 to 220 Korean characters; advice one practical sentence."
    : "overview 220 to 380 Korean characters; card reading 120 to 200 Korean characters; advice one practical sentence.";
}

function serializeCardMeaning(meaning: TarotPromptCardMeaning): TarotPromptCardMeaning {
  return {
    summary: meaning.summary,
    dailyFlow: meaning.dailyFlow,
    advice: meaning.advice,
  };
}

export function buildTarotReadingPrompt(input: TarotReadingPromptInput): TarotReadingPrompt {
  const locale = input.locale ?? "ko";
  const promptPayload = {
    locale,
    appDate: input.appDate,
    spread: input.spread,
    cards: input.cards.map((selection) => {
      const selectedMeaning = serializeCardMeaning(selection.card[selection.orientation]);

      return {
        position: selection.position,
        orientation: selection.orientation,
        card: {
          id: selection.card.id,
          nameKo: selection.card.nameKo,
          nameEn: selection.card.nameEn,
          keywords: selection.card.keywords,
          visualSymbols: selection.card.visualSymbols,
          mood: selection.card.mood,
          selectedMeaning,
          upright: serializeCardMeaning(selection.card.upright),
          reversed: serializeCardMeaning(selection.card.reversed),
        },
      };
    }),
    outputContract: {
      spread: getSpreadContract(input.spread),
      length: getLengthContract(input.spread, locale),
      style: [
        "Use the supplied card meanings as grounding evidence.",
        "Use 3 to 5 short keywords as display chips grounded in the selected card, orientation, and reading.",
        "Do not invent a different card, orientation, or position.",
        "Do not invent visual symbols that are absent from visualSymbols.",
        "Do not make medical, legal, financial, death, or fixed future predictions.",
        "Do not mention that you are using local data or a prompt.",
        "Write as a reflective tarot reading, not as a system explanation.",
      ],
    },
  };

  return {
    instructions: [
      "You are Manyang's production tarot-reading engine.",
      "The app has already selected the tarot cards, spread positions, and upright/reversed orientations.",
      "Never change the selected card, position, or orientation.",
      "Use only the provided tarot card reference text and spread structure.",
      "The reading is symbolic guidance for reflection, not a deterministic prediction.",
      "Make the result feel specific to the selected card and orientation.",
      "For one-card readings, create a concise but satisfying free daily reading.",
      "For one-card readings, make overview the main daily interpretation and use visualSymbols only when they clarify the card meaning.",
      "For three-card readings, connect situation, flow, and advice into one coherent interpretation.",
      "Avoid generic filler and avoid repeating the same sentence shape across cards.",
      `Return ${locale === "en" ? "English" : "Korean"} JSON that matches the supplied schema exactly.`,
    ].join("\n"),
    input: JSON.stringify(promptPayload),
  };
}
