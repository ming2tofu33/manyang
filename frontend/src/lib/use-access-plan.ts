"use client";

import { useEffect, useState } from "react";

import {
  getAccessPlanForSession,
  getDevAccessOverride,
  getEffectiveAccessPlan,
  type AccessPlan,
  type AccessRole,
  type MinimalAccessSession,
  type StorageLike,
} from "./access-policy";
import { createSupabaseBrowserClient } from "./supabase/client";

export type ClientAccessState = {
  accessPlan: AccessPlan;
  role: AccessRole;
  bypassDailyLimit: boolean;
  bypassAccessGate: boolean;
};

export type ServerAccessContext = {
  accessPlan: AccessPlan;
  role: AccessRole;
  bypassDailyLimit: boolean;
  bypassAccessGate: boolean;
};

function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export function resolveClientAccessState(
  session: MinimalAccessSession,
  storage: StorageLike | null | undefined,
  environment = process.env.NODE_ENV,
  serverAccessContext?: ServerAccessContext | null,
): ClientAccessState {
  const fallbackPlan = getAccessPlanForSession(session);
  const override = getDevAccessOverride(storage, environment);
  const baseState: ClientAccessState = serverAccessContext ?? {
    accessPlan: fallbackPlan,
    role: "user",
    bypassDailyLimit: false,
    bypassAccessGate: false,
  };

  return {
    ...baseState,
    accessPlan: getEffectiveAccessPlan(storage, baseState.accessPlan, environment),
    bypassDailyLimit: override.enabled ? override.bypassDailyLimit : baseState.bypassDailyLimit,
  };
}

function isAccessPlan(value: unknown): value is AccessPlan {
  return value === "guest" || value === "free_account" || value === "moon_pass";
}

function isAccessRole(value: unknown): value is AccessRole {
  return value === "user" || value === "admin";
}

function isServerAccessContext(value: unknown): value is ServerAccessContext {
  if (!value || typeof value !== "object") {
    return false;
  }

  const context = value as Record<string, unknown>;

  return (
    isAccessPlan(context.accessPlan) &&
    isAccessRole(context.role) &&
    typeof context.bypassDailyLimit === "boolean" &&
    typeof context.bypassAccessGate === "boolean"
  );
}

async function fetchServerAccessContext(): Promise<ServerAccessContext | null> {
  const response = await fetch("/api/access-context", {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const body = await response.json();

  return isServerAccessContext(body) ? body : null;
}

export function useAccessPlan(): ClientAccessState {
  const [state, setState] = useState<ClientAccessState>(() =>
    resolveClientAccessState(null, getBrowserStorage()),
  );

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        const serverAccessContext = data.session?.user?.id ? await fetchServerAccessContext() : null;

        if (isMounted) {
          setState(resolveClientAccessState(data.session, getBrowserStorage(), process.env.NODE_ENV, serverAccessContext));
        }
      } catch {
        if (isMounted) {
          setState(resolveClientAccessState(null, getBrowserStorage()));
        }
      }
    }

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
