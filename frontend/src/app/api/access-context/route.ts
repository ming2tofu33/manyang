import {
  getActiveSubscriptionPlanForUser,
  isAdminUser as isAdminUserFromDb,
} from "@/lib/server/manyang-db";
import { getAuthenticatedAccessPlan, getAuthenticatedUserId } from "@/lib/supabase/server";
import type { AccessPlan, AccessRole } from "@/lib/access-policy";

export const runtime = "nodejs";

export type AccessContextResponse = {
  accessPlan: AccessPlan;
  role: AccessRole;
  bypassDailyLimit: boolean;
  bypassAccessGate: boolean;
};

export type AccessContextRouteDependencies = {
  getAuthenticatedUserId?: () => Promise<string | null>;
  getAccessPlanForUser?: (userId: string | null) => Promise<AccessPlan>;
  getSubscriptionPlanForUser?: (userId: string) => Promise<Extract<AccessPlan, "moon_pass"> | null>;
  isAdminUser?: (userId: string) => Promise<boolean>;
};

async function getDefaultAccessPlanForUser(userId: string | null): Promise<AccessPlan> {
  if (!userId) {
    return "guest";
  }

  return getAuthenticatedAccessPlan();
}

async function getDefaultIsAdminUser(userId: string): Promise<boolean> {
  try {
    return await isAdminUserFromDb(userId);
  } catch {
    return false;
  }
}

async function getDefaultSubscriptionPlanForUser(userId: string): Promise<Extract<AccessPlan, "moon_pass"> | null> {
  try {
    return await getActiveSubscriptionPlanForUser(userId);
  } catch {
    return null;
  }
}

function createGuestAccessContext(): AccessContextResponse {
  return {
    accessPlan: "guest",
    role: "user",
    bypassDailyLimit: false,
    bypassAccessGate: false,
  };
}

export async function handleAccessContextRequest(
  dependencies: AccessContextRouteDependencies = {},
): Promise<Response> {
  const resolvedDependencies: Required<AccessContextRouteDependencies> = {
    getAuthenticatedUserId,
    getAccessPlanForUser: getDefaultAccessPlanForUser,
    getSubscriptionPlanForUser: getDefaultSubscriptionPlanForUser,
    isAdminUser: getDefaultIsAdminUser,
    ...dependencies,
  };

  const userId = await resolvedDependencies.getAuthenticatedUserId();

  if (!userId) {
    return Response.json(createGuestAccessContext());
  }

  const isAdmin = await resolvedDependencies.isAdminUser(userId);

  if (isAdmin) {
    return Response.json({
      accessPlan: "moon_pass",
      role: "admin",
      bypassDailyLimit: true,
      bypassAccessGate: true,
    } satisfies AccessContextResponse);
  }

  const subscriptionPlan = await resolvedDependencies.getSubscriptionPlanForUser(userId);

  return Response.json({
    accessPlan: subscriptionPlan ?? (await resolvedDependencies.getAccessPlanForUser(userId)),
    role: "user",
    bypassDailyLimit: false,
    bypassAccessGate: false,
  } satisfies AccessContextResponse);
}

export async function GET(): Promise<Response> {
  return handleAccessContextRequest();
}
