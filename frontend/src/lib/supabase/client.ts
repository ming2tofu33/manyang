"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseBrowserConfig } from "./env";

export function createSupabaseBrowserClient() {
  const config = getSupabaseBrowserConfig();

  return createBrowserClient(config.url, config.publishableKey);
}
