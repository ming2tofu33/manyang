import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getAccessPlanForSession, type AccessPlan } from "@/lib/access-policy";
import { getSupabaseBrowserConfig } from "./env";

export async function createSupabaseServerClient() {
  const config = getSupabaseBrowserConfig();
  const cookieStore = await cookies();

  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies; route handlers can.
        }
      },
    },
  });
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return null;
    }

    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function getAuthenticatedAccessPlan(): Promise<AccessPlan> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return "guest";
    }

    return getAccessPlanForSession({ user: data.user });
  } catch {
    return "guest";
  }
}
