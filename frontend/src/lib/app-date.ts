export const manyangAppTimeZone = "Asia/Seoul";

export function getManyangAppDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: manyangAppTimeZone,
    year: "numeric",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function getManyangAppHour(date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hourCycle: "h23",
    timeZone: manyangAppTimeZone,
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value;

  return Number(hour ?? 0);
}

export function shiftManyangAppDate(appDate: string, dayDelta: number): string {
  const [year, month, day] = appDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + dayDelta));
  const shiftedYear = date.getUTCFullYear();
  const shiftedMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  const shiftedDay = String(date.getUTCDate()).padStart(2, "0");

  return `${shiftedYear}-${shiftedMonth}-${shiftedDay}`;
}
