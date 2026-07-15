import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const clientContractConsumers = [
  "../components/dream-entry-form.tsx",
  "../components/dream-result-page-client.tsx",
  "./dream-storage.ts",
] as const;

describe("shared transport contract boundary", () => {
  test.each(clientContractConsumers)("%s does not import dream types from the backend", (relativePath) => {
    const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");

    expect(source).not.toMatch(
      /import\s+type\s+\{[^}]*Dream(?:Analysis|Night)[^}]*\}\s+from\s+["']@manyang\/backend["']/,
    );
  });
});
