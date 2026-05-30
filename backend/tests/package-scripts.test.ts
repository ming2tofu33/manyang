import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

describe("backend package scripts", () => {
  test("exposes a dream RAG vector index build command", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    expect(packageJson.scripts?.["build:rag-index"]).toBe(
      "tsx src/scripts/build-dream-rag-vector-index.ts",
    );
    expect(packageJson.devDependencies?.tsx).toBeDefined();
  });
});
