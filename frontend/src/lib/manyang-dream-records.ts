import type { DreamCompletedPayload, DreamRecord } from "./dream-storage";

export type PersistCompletedDreamReadingInput = DreamCompletedPayload & {
  userId: string;
};

export type DreamEntryInsertModel = {
  user_id: string;
  dream_text: string;
  dream_date: string;
  cat_reader_type?: string;
  wake_mood?: string;
  dream_atmospheres: string[];
  dream_sensations: string[];
  dream_sensation_other?: string;
  status: "completed";
  source: "dream_analysis";
};

export type DreamReadingInsertModel = {
  user_id: string;
  analysis_id: string;
  summary: string;
  interpretation: string;
  small_prescription: string;
  reader: DreamCompletedPayload["analysis"]["reader"];
  symbols: string[];
  emotions: string[];
  themes: string[];
  symbol_readings: DreamCompletedPayload["analysis"]["symbolReadings"];
  reading_basis: DreamCompletedPayload["analysis"]["readingBasis"];
  reader_note?: string;
  safety_notice?: string;
  raw_analysis: DreamCompletedPayload["analysis"];
};

export type DreamCardInsertModel = {
  user_id: string;
  card_id: string;
  card_name: string;
  card_type: string;
  card_keywords: string[];
  card_summary: string;
  card_message: string;
  card_theme: string;
};

export type UserSymbolHistoryUpsertModel = {
  user_id: string;
  symbol: string;
  related_emotions: string[];
  related_themes: string[];
};

export type DreamRecordInsertModels = {
  entry: DreamEntryInsertModel;
  reading: DreamReadingInsertModel;
  card: DreamCardInsertModel;
  symbolHistory: UserSymbolHistoryUpsertModel[];
};

function uniqueNonEmpty(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function createDreamRecordInsertModels(input: PersistCompletedDreamReadingInput): DreamRecordInsertModels {
  const analysis = input.analysis;

  return {
    entry: {
      user_id: input.userId,
      dream_text: input.dreamText,
      dream_date: input.dreamDate,
      ...(input.catReaderType ? { cat_reader_type: input.catReaderType } : {}),
      ...(input.wakeMood ? { wake_mood: input.wakeMood } : {}),
      dream_atmospheres: input.dreamAtmospheres ?? [],
      dream_sensations: input.dreamSensations ?? [],
      ...(input.dreamSensationOther ? { dream_sensation_other: input.dreamSensationOther } : {}),
      status: "completed",
      source: "dream_analysis",
    },
    reading: {
      user_id: input.userId,
      analysis_id: analysis.analysisId,
      summary: analysis.summary,
      interpretation: analysis.interpretation,
      small_prescription: analysis.smallPrescription,
      reader: analysis.reader,
      symbols: analysis.symbols,
      emotions: analysis.emotions,
      themes: analysis.themes,
      symbol_readings: analysis.symbolReadings,
      reading_basis: analysis.readingBasis,
      ...(analysis.readerNote ? { reader_note: analysis.readerNote } : {}),
      ...(analysis.safetyNotice ? { safety_notice: analysis.safetyNotice } : {}),
      raw_analysis: analysis,
    },
    card: {
      user_id: input.userId,
      card_id: analysis.cardId,
      card_name: analysis.card.name,
      card_type: analysis.card.type,
      card_keywords: analysis.card.keywords,
      card_summary: analysis.card.summary,
      card_message: analysis.card.message,
      card_theme: analysis.card.theme,
    },
    symbolHistory: uniqueNonEmpty(analysis.symbols).map((symbol) => ({
      user_id: input.userId,
      symbol,
      related_emotions: analysis.emotions,
      related_themes: analysis.themes,
    })),
  };
}

export function createCompletedDreamRecordFromDbRow(row: {
  id: string;
  saved_at: string;
  dream_text: string;
  dream_date: string;
  cat_reader_type?: DreamRecord["catReaderType"] | null;
  wake_mood?: string | null;
  dream_atmospheres?: string[];
  dream_sensations?: string[];
  dream_sensation_other?: string | null;
  raw_analysis: DreamCompletedPayload["analysis"];
}): DreamRecord {
  return {
    id: row.id,
    savedAt: row.saved_at,
    dreamText: row.dream_text,
    dreamDate: row.dream_date,
    ...(row.cat_reader_type ? { catReaderType: row.cat_reader_type } : {}),
    ...(row.wake_mood ? { wakeMood: row.wake_mood } : {}),
    ...(row.dream_atmospheres && row.dream_atmospheres.length > 0 ? { dreamAtmospheres: row.dream_atmospheres } : {}),
    ...(row.dream_sensations && row.dream_sensations.length > 0 ? { dreamSensations: row.dream_sensations } : {}),
    ...(row.dream_sensation_other ? { dreamSensationOther: row.dream_sensation_other } : {}),
    analysis: row.raw_analysis,
  };
}
