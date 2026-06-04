import { symbolEntries } from "../data/symbol-encyclopedia";
import type { SymbolCategory } from "../contracts/symbol-encyclopedia";

/**
 * 이중문화 재작성(ko=동양 전통 / en=서양 전통, B안 직접서술) 완료 추적기.
 *
 * REVIEWED = "full 이중문화 처리"를 마친 symbol id. 새 심볼을 끝낼 때마다 여기에 추가한다.
 * 미완(pending) = 전체 - REVIEWED. `npm run enc:status`로 카테고리별 남은 목록을 본다.
 *
 * 주의: 손으로 유지하는 목록이다. 심볼을 재작성하면 반드시 여기에 id를 더할 것.
 * 테스트(encyclopedia-review-status.test.ts)가 오타/유령 id를 막는다.
 */
export const BICULTURAL_REVIEWED: ReadonlySet<string> = new Set([
  // batch 1 (문화 충돌 큰 핵심)
  "snake", "owned_land", "feces", "pig", "water", "teeth", "money", "being_chased",
  // event
  "death", "funeral", "exam", "wedding", "war", "accident",
  // person
  "stranger", "child", "mother", "father", "friend", "partner", "ex_partner",
  "baby", "ancestor", "ghost", "celebrity", "monk",
  // body
  "hair", "body", "blood", "naked", "hand", "foot", "pregnancy",
  // animal (en을 서양 신화·융·변태로 교체)
  "dragon", "tiger", "fish", "bear", "whale", "frog",
  // nature (en을 서양 원형·무의식·Noah 등으로)
  "fire", "rain", "snow", "moon", "flood", "mountain", "tree", "flower", "sea", "river",
]);

export type CategoryReviewStatus = {
  category: SymbolCategory;
  total: number;
  reviewed: number;
  pending: string[]; // 미완 symbol id
};

export type EncyclopediaReviewStatus = {
  total: number;
  reviewed: number;
  pendingCount: number;
  byCategory: CategoryReviewStatus[];
};

export function getEncyclopediaReviewStatus(): EncyclopediaReviewStatus {
  const byCategoryMap = new Map<SymbolCategory, CategoryReviewStatus>();

  for (const entry of symbolEntries) {
    const bucket =
      byCategoryMap.get(entry.category) ??
      byCategoryMap.set(entry.category, { category: entry.category, total: 0, reviewed: 0, pending: [] }).get(entry.category)!;

    bucket.total += 1;
    if (BICULTURAL_REVIEWED.has(entry.id)) {
      bucket.reviewed += 1;
    } else {
      bucket.pending.push(entry.id);
    }
  }

  const byCategory = [...byCategoryMap.values()].sort((a, b) => b.pending.length - a.pending.length);
  const reviewed = symbolEntries.filter((entry) => BICULTURAL_REVIEWED.has(entry.id)).length;

  return {
    total: symbolEntries.length,
    reviewed,
    pendingCount: symbolEntries.length - reviewed,
    byCategory,
  };
}

export function formatEncyclopediaReviewStatusMarkdown(status: EncyclopediaReviewStatus): string {
  const lines: string[] = [];
  lines.push("# Encyclopedia Bicultural Review Status");
  lines.push("");
  lines.push(`- total: ${status.total}`);
  lines.push(`- reviewed (ko=동양/en=서양): ${status.reviewed}`);
  lines.push(`- pending: ${status.pendingCount}`);
  lines.push("");
  lines.push("| category | reviewed / total | pending ids |");
  lines.push("| --- | --- | --- |");
  for (const c of status.byCategory) {
    lines.push(`| ${c.category} | ${c.reviewed}/${c.total} | ${c.pending.join(", ") || "—"} |`);
  }
  return lines.join("\n");
}
