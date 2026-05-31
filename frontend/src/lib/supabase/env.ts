type EnvLike = Record<string, string | undefined>;

export type SupabaseBrowserConfig = {
  url: string;
  publishableKey: string;
};

export function getSupabaseBrowserConfig(env: EnvLike = process.env): SupabaseBrowserConfig {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase browser configuration is missing");
  }

  return { url, publishableKey };
}

export function getSupabaseDatabaseUrl(env: EnvLike = process.env): string {
  const databaseUrl = env.SUPABASE_DB_URL ?? env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("SUPABASE_DB_URL is required for server-side manyang database access");
  }

  return databaseUrl;
}
