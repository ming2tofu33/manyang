import type { AccessRole } from "./access-policy";

export type AdminLabTimeOverride =
  | "auto"
  | "day"
  | "record-evening"
  | "night"
  | "late-night"
  | "morning-boundary"
  | "home-night-boundary";

export type AdminLabTimePreset = {
  id: Exclude<AdminLabTimeOverride, "auto">;
  label: string;
  timeLabel: string;
  description: string;
  iso: string;
};

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export const adminLabTimeOverrideKey = "manyang:admin-lab-time-override";
export const adminLabTimeOverrideChangedEvent = "manyang:admin-lab-time-override-changed";

export const adminLabPrimaryTimePresets: AdminLabTimePreset[] = [
  {
    id: "day",
    label: "낮 강제",
    timeLabel: "10:00 KST",
    description: "홈은 낮, 아침 기록 입력 가능",
    iso: "2026-06-01T10:00:00.000+09:00",
  },
  {
    id: "night",
    label: "밤 강제",
    timeLabel: "20:00 KST",
    description: "홈과 기록 모두 밤 기준",
    iso: "2026-06-01T20:00:00.000+09:00",
  },
];

export const adminLabBoundaryTimePresets: AdminLabTimePreset[] = [
  {
    id: "record-evening",
    label: "기록 밤 경계",
    timeLabel: "18:30 KST",
    description: "기록은 밤, 홈은 아직 낮",
    iso: "2026-06-01T18:30:00.000+09:00",
  },
  {
    id: "home-night-boundary",
    label: "홈 밤 경계",
    timeLabel: "19:00 KST",
    description: "홈도 밤으로 전환",
    iso: "2026-06-01T19:00:00.000+09:00",
  },
  {
    id: "late-night",
    label: "새벽",
    timeLabel: "04:30 KST",
    description: "밤 기록 유지, 05시 전 상태",
    iso: "2026-06-02T04:30:00.000+09:00",
  },
  {
    id: "morning-boundary",
    label: "아침 경계",
    timeLabel: "05:00 KST",
    description: "아침 기록 재개 시점",
    iso: "2026-06-02T05:00:00.000+09:00",
  },
];

export const adminLabTimePresets = [
  ...adminLabPrimaryTimePresets,
  ...adminLabBoundaryTimePresets,
] as const satisfies readonly AdminLabTimePreset[];

const adminLabTimePresetMap = new Map<AdminLabTimePreset["id"], AdminLabTimePreset>(
  adminLabTimePresets.map((preset) => [preset.id, preset]),
);

export function isAdminLabTimeOverride(value: unknown): value is AdminLabTimeOverride {
  return (
    value === "auto" ||
    value === "day" ||
    value === "record-evening" ||
    value === "night" ||
    value === "late-night" ||
    value === "morning-boundary" ||
    value === "home-night-boundary"
  );
}

export function normalizeAdminLabTimeOverride(value: unknown): AdminLabTimeOverride {
  return isAdminLabTimeOverride(value) ? value : "auto";
}

export function getAdminLabTimePreset(override: AdminLabTimeOverride): AdminLabTimePreset | null {
  return override === "auto" ? null : (adminLabTimePresetMap.get(override) ?? null);
}

export function getAdminLabDateForOverride(override: AdminLabTimeOverride): Date | null {
  const preset = getAdminLabTimePreset(override);

  return preset ? new Date(preset.iso) : null;
}

export function resolveAdminLabDate(
  fallbackDate: Date,
  override: AdminLabTimeOverride,
  accessRole: AccessRole,
): Date {
  if (accessRole !== "admin") {
    return fallbackDate;
  }

  return getAdminLabDateForOverride(override) ?? fallbackDate;
}

export function getAdminLabTimeOverride(storage: StorageLike): AdminLabTimeOverride {
  return normalizeAdminLabTimeOverride(storage.getItem(adminLabTimeOverrideKey));
}

export function saveAdminLabTimeOverride(storage: StorageLike, override: AdminLabTimeOverride): void {
  if (override === "auto") {
    storage.removeItem(adminLabTimeOverrideKey);
    return;
  }

  storage.setItem(adminLabTimeOverrideKey, override);
}

export function notifyAdminLabTimeOverrideChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(adminLabTimeOverrideChangedEvent));
  }
}
