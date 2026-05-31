export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type MinimalAccessSession = {
  user?: {
    id?: string | null;
    app_metadata?: Record<string, unknown> | null;
    user_metadata?: Record<string, unknown> | null;
  } | null;
} | null;

export type AccessPlan = "guest" | "free_account" | "moon_pass";
export type AccessRole = "user" | "admin";
export type ReadingKind = "basic" | "detailed";
export type ReadingGateReason = "allowed" | "guest_daily_limit" | "free_daily_limit" | "detailed_locked";

export type DevAccessOverride = {
  enabled: boolean;
  simulatedPlan: AccessPlan;
  bypassDailyLimit: boolean;
};

export type ReadingGateInput = {
  accessPlan: AccessPlan;
  readingKind: ReadingKind;
  hasUsedBasicReadingToday: boolean;
  bypassDailyLimit?: boolean;
  bypassAccessGate?: boolean;
};

export type ReadingGateResult = {
  allowed: boolean;
  reason: ReadingGateReason;
  ctaLabel: string | null;
  message: string | null;
};

export type DreamReadingUsageLike = {
  status?: string;
  dreamDate?: string;
  catReaderType?: string;
} | null;

export const devAccessPlanKey = "manyang:dev-access-plan";
export const devBypassDailyLimitKey = "manyang:dev-bypass-daily-limit";

const accessPlans: AccessPlan[] = ["guest", "free_account", "moon_pass"];

const allowedResult: ReadingGateResult = {
  allowed: true,
  reason: "allowed",
  ctaLabel: null,
  message: null,
};

const disabledDevOverride: DevAccessOverride = {
  enabled: false,
  simulatedPlan: "guest",
  bypassDailyLimit: false,
};

function normalizeAccessPlan(value: unknown): AccessPlan | null {
  return typeof value === "string" && accessPlans.includes(value as AccessPlan) ? (value as AccessPlan) : null;
}

function isDevOverrideEnvironment(environment: string | undefined): boolean {
  return environment !== "production";
}

export function getDefaultAccessPlan(): AccessPlan {
  return "guest";
}

export function getAccessPlanForSession(session: MinimalAccessSession): AccessPlan {
  if (!session?.user?.id) {
    return "guest";
  }

  const metadataPlan =
    normalizeAccessPlan(session.user.app_metadata?.manyang_access_plan) ??
    normalizeAccessPlan(session.user.app_metadata?.access_plan) ??
    normalizeAccessPlan(session.user.user_metadata?.manyang_access_plan) ??
    normalizeAccessPlan(session.user.user_metadata?.access_plan);

  return metadataPlan ?? "free_account";
}

export function isPaidAccessPlan(accessPlan: AccessPlan): boolean {
  return accessPlan === "moon_pass";
}

export function getReadingKindForCatReader(catReaderId: string | null | undefined): ReadingKind {
  void catReaderId;

  return "basic";
}

export function hasUsedBasicReadingOnDate(payload: DreamReadingUsageLike, date: string): boolean {
  if (!payload || payload.status === "unavailable" || payload.dreamDate !== date) {
    return false;
  }

  return getReadingKindForCatReader(payload.catReaderType) === "basic";
}

export function canRequestReading(input: ReadingGateInput): ReadingGateResult {
  if (input.bypassAccessGate === true) {
    return allowedResult;
  }

  if (input.readingKind === "detailed") {
    if (input.accessPlan === "moon_pass") {
      return allowedResult;
    }

    return {
      allowed: false,
      reason: "detailed_locked",
      ctaLabel: "깊은 꿈을 더 깊게 읽기",
      message: "상징별 세부 해석, 감정 흐름, 타로 추가 리딩은 Moon Pass에서 열려요.",
    };
  }

  // 게스트만 하루 1회로 제한해 가입을 유도한다. 로그인 유저는 서로 다른 꿈을 하루에도
  // 여러 번 기록할 수 있고, 같은 꿈 재제출(리롤)은 서버가 저장된 해몽을 그대로 돌려주는
  // 방식(내용 기반 잠금)으로 막으므로 여기서 횟수로 막지 않는다.
  if (input.accessPlan === "guest" && input.hasUsedBasicReadingToday && input.bypassDailyLimit !== true) {
    return {
      allowed: false,
      reason: "guest_daily_limit",
      ctaLabel: "로그인하고 매일 꿈 기록 남기기",
      message: "오늘의 무료 꿈 영수증은 이미 받았어요. 로그인하면 매일 꿈 기록을 이어갈 수 있어요.",
    };
  }

  return allowedResult;
}

export function getDevAccessOverride(
  storage: StorageLike | null | undefined,
  environment = process.env.NODE_ENV,
): DevAccessOverride {
  if (!storage || !isDevOverrideEnvironment(environment)) {
    return disabledDevOverride;
  }

  const simulatedPlan = normalizeAccessPlan(storage.getItem(devAccessPlanKey));

  if (!simulatedPlan) {
    return disabledDevOverride;
  }

  return {
    enabled: true,
    simulatedPlan,
    bypassDailyLimit: storage.getItem(devBypassDailyLimitKey) === "true",
  };
}

export function getEffectiveAccessPlan(
  storage: StorageLike | null | undefined,
  fallbackPlan: AccessPlan = getDefaultAccessPlan(),
  environment = process.env.NODE_ENV,
): AccessPlan {
  const override = getDevAccessOverride(storage, environment);

  return override.enabled ? override.simulatedPlan : fallbackPlan;
}
