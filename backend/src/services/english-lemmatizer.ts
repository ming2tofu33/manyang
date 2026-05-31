import type { Lemmatizer } from "./korean-lemmatizer";

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z]+/g) ?? []).filter((word) => word.length >= 2);
}

const irregularNouns: Record<string, string> = {
  children: "child",
  feet: "foot",
  geese: "goose",
  men: "man",
  mice: "mouse",
  people: "person",
  teeth: "tooth",
  women: "woman",
};

const irregularVerbs: Record<string, string> = {
  became: "become",
  been: "be",
  began: "begin",
  begun: "begin",
  came: "come",
  chased: "chase",
  did: "do",
  done: "do",
  fell: "fall",
  felt: "feel",
  flew: "fly",
  flown: "fly",
  found: "find",
  gave: "give",
  gone: "go",
  held: "hold",
  hid: "hide",
  kept: "keep",
  left: "leave",
  lost: "lose",
  made: "make",
  ran: "run",
  rose: "rise",
  saw: "see",
  seen: "see",
  slept: "sleep",
  spoke: "speak",
  taken: "take",
  took: "take",
  went: "go",
  were: "be",
  woke: "wake",
};

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length >= 2))];
}

function dropDoubledFinalConsonant(value: string): string {
  if (/(bb|dd|gg|mm|nn|pp|rr|tt)$/.test(value)) {
    return value.slice(0, -1);
  }

  return value;
}

function lemmatizeNoun(word: string): string[] {
  if (irregularNouns[word]) {
    return [irregularNouns[word]];
  }

  if (word.endsWith("ies") && word.length > 4) {
    return [`${word.slice(0, -3)}y`];
  }

  if (/(ches|shes|xes|zes|sses)$/.test(word)) {
    return [word.slice(0, -2)];
  }

  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) {
    return [word.slice(0, -1)];
  }

  return [word];
}

function lemmatizeVerb(word: string): string[] {
  if (irregularVerbs[word]) {
    return [irregularVerbs[word]];
  }

  if (word.endsWith("ying") && word.length > 5) {
    return [`${word.slice(0, -4)}ie`];
  }

  if (word.endsWith("ing") && word.length > 5) {
    const stem = dropDoubledFinalConsonant(word.slice(0, -3));
    return dedupe([stem, `${stem}e`]);
  }

  if (word.endsWith("ied") && word.length > 4) {
    return [`${word.slice(0, -3)}y`];
  }

  if (word.endsWith("ed") && word.length > 4) {
    const stem = dropDoubledFinalConsonant(word.slice(0, -2));
    return dedupe([stem, `${stem}e`]);
  }

  if (word.endsWith("es") && word.length > 4) {
    return dedupe([word.slice(0, -2), word.slice(0, -1)]);
  }

  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) {
    return [word.slice(0, -1)];
  }

  return [word];
}

export class EnglishLemmatizer implements Lemmatizer {
  async lemmatize(text: string): Promise<string[]> {
    const stems = new Set<string>();

    for (const word of tokenize(text)) {
      stems.add(word);
      lemmatizeNoun(word).forEach((stem) => stems.add(stem));
      lemmatizeVerb(word).forEach((stem) => stems.add(stem));
    }

    return [...stems].filter((stem) => stem.length >= 2);
  }
}

export function createEnglishLemmatizer(): Lemmatizer {
  return new EnglishLemmatizer();
}
