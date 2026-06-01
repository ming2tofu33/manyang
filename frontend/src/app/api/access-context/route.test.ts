import { describe, expect, test } from "vitest";

import { handleAccessContextRequest } from "./route";

describe("GET /api/access-context", () => {
  test("returns guest context when the user is not authenticated", async () => {
    const response = await handleAccessContextRequest({
      getAuthenticatedUserId: async () => null,
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      accessPlan: "guest",
      role: "user",
      bypassDailyLimit: false,
      bypassAccessGate: false,
    });
  });

  test("returns regular user context from the authenticated access plan", async () => {
    const response = await handleAccessContextRequest({
      getAuthenticatedUserId: async () => "user-1",
      getAccessPlanForUser: async () => "free_account",
      getSubscriptionPlanForUser: async () => null,
      isAdminUser: async () => false,
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      accessPlan: "free_account",
      role: "user",
      bypassDailyLimit: false,
      bypassAccessGate: false,
    });
  });

  test("returns Moon Pass-equivalent UI context for server-trusted admins", async () => {
    const response = await handleAccessContextRequest({
      getAuthenticatedUserId: async () => "user-1",
      getAccessPlanForUser: async () => "free_account",
      getSubscriptionPlanForUser: async () => null,
      isAdminUser: async () => true,
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      accessPlan: "moon_pass",
      role: "admin",
      bypassDailyLimit: true,
      bypassAccessGate: true,
    });
  });

  test("uses active subscription plan before profile metadata plan", async () => {
    const response = await handleAccessContextRequest({
      getAuthenticatedUserId: async () => "user-1",
      getAccessPlanForUser: async () => "free_account",
      getSubscriptionPlanForUser: async () => "moon_pass",
      isAdminUser: async () => false,
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      accessPlan: "moon_pass",
      role: "user",
      bypassDailyLimit: false,
      bypassAccessGate: false,
    });
  });
});
