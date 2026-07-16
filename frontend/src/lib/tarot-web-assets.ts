export function resolveTarotWebImage(imageKey: string): string {
  if (!imageKey || imageKey.startsWith("/") || imageKey.includes("..")) {
    throw new Error(`Invalid tarot image key: ${imageKey}`);
  }

  return `/manyang/tarot/${imageKey}`;
}
