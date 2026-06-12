import type { DreamCompletedPayload } from "./dream-storage";
import { getCatReaderById } from "./cat-readers";
import {
  dailyTarotDisplayTitle,
  type DailyTarotCardSelection,
  type DailyTarotPosition,
  type DailyTarotReading,
  type TarotOrientation,
} from "./daily-tarot";

const symbolSlugMap: Record<string, string> = {
  문: "door",
  열쇠: "key",
  복도: "corridor",
  신발: "shoes",
  엘리베이터: "elevator",
  물: "water",
  비: "rain",
  학교: "school",
  고양이: "cat",
  계단: "stairs",
  집: "home",
  병원: "hospital",
  바다: "sea",
  방: "room",
  지하철: "subway",
  공항: "airport",
  가방: "bag",
  거울: "mirror",
  책: "book",
  시계: "clock",
  전화: "phone",
  창문: "window",
  잃어버림: "lost",
  찾기: "search",
  뛰기: "running",
  기다림: "waiting",
  불: "fire",
  바람: "wind",
  어둠: "darkness",
  안개: "fog",
  별: "star",
  개: "dog",
  새: "bird",
  물고기: "fish",
  "모르는 사람": "stranger",
  어린아이: "child",
};

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapText(value: string, maxLength: number): string[] {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > maxLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function renderSvgLines(lines: string[], x: number, y: number, lineHeight: number, className: string): string {
  return lines
    .map((line, index) => `<text x="${x}" y="${y + index * lineHeight}" class="${className}">${escapeXml(line)}</text>`)
    .join("");
}

export function getSymbolSlug(symbol: string): string {
  return symbolSlugMap[symbol] ?? encodeURIComponent(symbol);
}

export function getPrimarySymbolSlug(symbols: string[]): string {
  const primarySymbol = symbols[0] ?? "복도";

  return getSymbolSlug(primarySymbol);
}

export function getPrimaryResultSymbolSlug(
  analysis: Pick<DreamCompletedPayload["analysis"], "symbolReadings" | "readingBasis" | "symbols">,
): string {
  const primarySymbol =
    analysis.symbolReadings[0]?.symbol ??
    analysis.readingBasis.usedSymbols[0] ??
    analysis.symbols[0] ??
    "복도";

  return getSymbolSlug(primarySymbol);
}

export function createResultEncyclopediaHref(symbol: string): string {
  return `/encyclopedia/${getSymbolSlug(symbol)}?from=result`;
}

export function createReceiptFileName(payload: DreamCompletedPayload): string {
  return `manyang-receipt-${payload.dreamDate}-${payload.analysis.dreamId}.png`;
}

export function createReceiptShareText(payload: DreamCompletedPayload): string {
  const reader = getCatReaderById(payload.catReaderType ?? payload.analysis.reader?.id);

  return [
    `오늘의 꿈 영수증: ${payload.analysis.summary}`,
    `From. ${reader.name}`,
    `주요 상징: ${payload.analysis.symbols.join(", ")}`,
    `작은 처방: ${payload.analysis.smallPrescription}`,
  ].join("\n");
}

export function createReceiptSvg(payload: DreamCompletedPayload): string {
  const reader = getCatReaderById(payload.catReaderType ?? payload.analysis.reader?.id);
  const interpretationLines = wrapText(payload.analysis.interpretation, 32).slice(0, 8);
  const prescriptionLines = wrapText(payload.analysis.smallPrescription, 30).slice(0, 3);
  const symbolText = payload.analysis.symbols.slice(0, 4).join(" · ");
  const moodText = payload.wakeMood ?? payload.analysis.emotions[0] ?? "기록 없음";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1300" viewBox="0 0 900 1300">
  <style>
    .bg { fill: #090613; }
    .paper { fill: #e9c994; stroke: #8a5937; stroke-width: 4; }
    .title { fill: #2f2117; font: 700 48px serif; text-anchor: middle; }
    .label { fill: #6c3d80; font: 700 28px sans-serif; text-anchor: middle; }
    .body { fill: #2f2117; font: 30px sans-serif; }
    .meta { fill: #5b4029; font: 28px sans-serif; text-anchor: middle; }
    .brand { fill: #f0a23c; font: 700 46px sans-serif; text-anchor: middle; }
    .signature { fill: #3c291d; font: italic 31px serif; }
    .stamp { fill: none; stroke: #4f3368; stroke-width: 5; opacity: 0.46; }
    .stamp-text { fill: #4f3368; font: 700 20px serif; text-anchor: middle; letter-spacing: 2px; opacity: 0.54; }
    .paw { fill: #4f3368; font: 700 42px sans-serif; text-anchor: middle; opacity: 0.58; }
  </style>
  <rect width="900" height="1300" class="bg"/>
  <text x="450" y="92" class="brand">오늘의 꿈 영수증</text>
  <rect x="90" y="140" width="720" height="1040" rx="34" class="paper"/>
  <text x="450" y="238" class="meta">DREAM RECEIPT</text>
  <text x="450" y="320" class="title">${escapeXml(payload.analysis.summary)}</text>
  <text x="450" y="380" class="meta">${escapeXml(payload.dreamDate)}  |  ${escapeXml(moodText)}</text>
  <text x="450" y="465" class="label">주요 상징</text>
  <text x="450" y="525" class="meta">${escapeXml(symbolText)}</text>
  <text x="450" y="630" class="label">공통 해몽</text>
  ${renderSvgLines(interpretationLines, 150, 695, 48, "body")}
  <text x="450" y="1080" class="label">오늘의 작은 처방</text>
  ${renderSvgLines(prescriptionLines, 150, 1138, 46, "body")}
  <text x="150" y="1240" class="signature">From. ${escapeXml(reader.name)}  🐾</text>
  <g transform="translate(675 1205) rotate(-8)">
    <circle r="78" class="stamp"/>
    <circle r="61" class="stamp"/>
    <text y="-32" class="stamp-text">MANYANG DREAM</text>
    <text y="46" class="stamp-text">MYSTIC READER</text>
    <text y="16" class="paw">🐾</text>
  </g>
</svg>`;
}

const tarotOrientationLabels = {
  upright: "정방향",
  reversed: "역방향",
} satisfies Record<TarotOrientation, string>;

const tarotPositionLabels = {
  today: "오늘",
  situation: "지금의 상태",
  flow: "이어지는 흐름",
  advice: "오늘의 조언",
} satisfies Record<DailyTarotPosition, string>;

function getTarotReadingCards(reading: DailyTarotReading): DailyTarotCardSelection[] {
  return reading.cards && reading.cards.length > 0
    ? reading.cards
    : [{ position: reading.position, card: reading.card, orientation: reading.orientation }];
}

function sanitizeFileSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "card";
}

export function createTarotReadingFileName(reading: DailyTarotReading): string {
  const primaryCard = getTarotReadingCards(reading)[0]?.card ?? reading.card;

  return `manyang-tarot-${reading.appDate}-${reading.spread}-${sanitizeFileSegment(primaryCard.slug)}.png`;
}

export function createTarotReadingShareText(reading: DailyTarotReading): string {
  const cardLines = getTarotReadingCards(reading).map((selection) => {
    const cardText = `${selection.card.nameKo} · ${tarotOrientationLabels[selection.orientation]}`;

    return reading.spread === "daily_three_card"
      ? `${tarotPositionLabels[selection.position]}: ${cardText}`
      : cardText;
  });

  return [
    dailyTarotDisplayTitle,
    `카드: ${cardLines.join(" / ")}`,
    `흐름: ${reading.message}`,
    `카드 메시지: ${reading.advice}`,
  ].join("\n");
}

export function createTarotReadingSvg(reading: DailyTarotReading): string {
  const cardLines = getTarotReadingCards(reading).map((selection) => {
    const label = reading.spread === "daily_three_card" ? `${tarotPositionLabels[selection.position]} · ` : "";

    return `${label}${selection.card.nameKo} / ${selection.card.nameEn} · ${tarotOrientationLabels[selection.orientation]}`;
  });
  const titleLines = wrapText(dailyTarotDisplayTitle, 24).slice(0, 2);
  const messageLines = wrapText(reading.message, 30).slice(0, 6);
  const adviceLines = wrapText(reading.advice, 30).slice(0, 4);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1300" viewBox="0 0 900 1300">
  <style>
    .bg { fill: #070511; }
    .paper { fill: #12091c; stroke: #b98255; stroke-width: 4; }
    .brand { fill: #f0a23c; font: 700 46px sans-serif; text-anchor: middle; }
    .title { fill: #ffe7b5; font: 700 42px serif; text-anchor: middle; }
    .label { fill: #d9b6ff; font: 700 25px sans-serif; text-anchor: middle; }
    .body { fill: #fff3d7; font: 29px sans-serif; }
    .meta { fill: #f2c27d; font: 27px sans-serif; text-anchor: middle; }
  </style>
  <rect width="900" height="1300" class="bg"/>
  <text x="450" y="92" class="brand">오늘의 타로</text>
  <rect x="85" y="140" width="730" height="1040" rx="34" class="paper"/>
  <text x="450" y="228" class="meta">${escapeXml(reading.appDate)}</text>
  ${renderSvgLines(titleLines, 450, 315, 50, "title")}
  <text x="450" y="455" class="label">선택한 카드</text>
  ${renderSvgLines(cardLines, 150, 520, 48, "body")}
  <text x="450" y="700" class="label">오늘의 흐름</text>
  ${renderSvgLines(messageLines, 150, 765, 46, "body")}
  <text x="450" y="1050" class="label">카드 메시지</text>
  ${renderSvgLines(adviceLines, 150, 1112, 46, "body")}
</svg>`;
}
