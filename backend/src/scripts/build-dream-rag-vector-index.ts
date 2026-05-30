import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { SupportedLocale } from "../contracts/symbol-encyclopedia";
import { buildDreamRagVectorIndexFile } from "../services/dream-rag-index-builder";
import { createOpenAIEmbeddingsProviderFromEnv } from "../services/openai-embeddings-provider";

type EnvLike = Record<string, string | undefined>;

export type BuildDreamRagVectorIndexCliArgs = {
  locale: SupportedLocale;
  outputPath: string;
  envPath?: string;
};

function isSupportedLocale(value: string): value is SupportedLocale {
  return value === "ko" || value === "en";
}

function stripOptionalQuotes(value: string): string {
  const trimmed = value.trim();

  if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

export function loadEnvFile(envPath: string, env: EnvLike = process.env): void {
  if (!existsSync(envPath)) {
    throw new Error(`Env file not found: ${envPath}`);
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");

    if (equalsIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = stripOptionalQuotes(trimmed.slice(equalsIndex + 1));

    if (env[key] === undefined) {
      env[key] = value;
    }
  }
}

export function parseBuildDreamRagVectorIndexArgs(args: string[]): BuildDreamRagVectorIndexCliArgs {
  let locale: SupportedLocale = "ko";
  let outputPath = "../output/rag/dream-rag-ko.json";
  let envPath: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === "--locale") {
      if (!next || !isSupportedLocale(next)) {
        throw new Error("--locale must be ko or en");
      }

      locale = next;
      index += 1;
      continue;
    }

    if (arg === "--out") {
      if (!next) {
        throw new Error("--out requires a file path");
      }

      outputPath = next;
      index += 1;
      continue;
    }

    if (arg === "--env") {
      if (!next) {
        throw new Error("--env requires a file path");
      }

      envPath = next;
      index += 1;
      continue;
    }
  }

  return {
    locale,
    outputPath,
    ...(envPath ? { envPath } : {}),
  };
}

export async function runBuildDreamRagVectorIndexCli(args: string[], env: EnvLike = process.env): Promise<void> {
  const parsed = parseBuildDreamRagVectorIndexArgs(args);

  if (parsed.envPath) {
    loadEnvFile(resolve(parsed.envPath), env);
  }

  const embeddingProvider = createOpenAIEmbeddingsProviderFromEnv(
    {
      ...env,
      MANYANG_RAG_EMBEDDINGS_MODE: env.MANYANG_RAG_EMBEDDINGS_MODE ?? "openai",
    },
  );

  if (!embeddingProvider) {
    throw new Error("Embedding provider is not configured");
  }

  const result = await buildDreamRagVectorIndexFile({
    locale: parsed.locale,
    outputPath: resolve(parsed.outputPath),
    embeddingProvider,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        ...result,
      },
      null,
      2,
    ),
  );
}

const currentFile = fileURLToPath(import.meta.url);

if (process.argv[1] && resolve(process.argv[1]) === currentFile) {
  runBuildDreamRagVectorIndexCli(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
