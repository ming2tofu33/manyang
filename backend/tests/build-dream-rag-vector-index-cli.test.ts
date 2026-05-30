import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, test } from "vitest";

import {
  loadEnvFile,
  parseBuildDreamRagVectorIndexArgs,
} from "../src/scripts/build-dream-rag-vector-index";

let tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs = [];
});

describe("build dream RAG vector index CLI helpers", () => {
  test("parses locale, output, and env file arguments", () => {
    expect(
      parseBuildDreamRagVectorIndexArgs([
        "--locale",
        "en",
        "--out",
        "../output/rag/dream-rag-en.json",
        "--env",
        "../frontend/.env",
      ]),
    ).toEqual({
      locale: "en",
      outputPath: "../output/rag/dream-rag-en.json",
      envPath: "../frontend/.env",
    });
  });

  test("loads simple dotenv files without overriding existing env values", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "manyang-env-loader-"));
    tempDirs.push(tempDir);
    const envPath = join(tempDir, ".env");
    await writeFile(
      envPath,
      [
        "OPENAI_API_KEY=sk-from-file",
        "MANYANG_OPENAI_EMBEDDING_MODEL=\"text-embedding-test\"",
        "EXISTING_VALUE=from-file",
      ].join("\n"),
      "utf8",
    );

    const env = { EXISTING_VALUE: "from-process" } as Record<string, string | undefined>;

    loadEnvFile(envPath, env);

    expect(env.OPENAI_API_KEY).toBe("sk-from-file");
    expect(env.MANYANG_OPENAI_EMBEDDING_MODEL).toBe("text-embedding-test");
    expect(env.EXISTING_VALUE).toBe("from-process");
  });
});
