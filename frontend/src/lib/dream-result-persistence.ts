export type DreamResultPersistenceInput = {
  isAuthenticated: boolean;
  status: "completed" | "unavailable";
};

export const guestLocalDreamArchiveLimit = 3;

export function shouldSaveReadingToLocalArchive(input: DreamResultPersistenceInput): boolean {
  return !input.isAuthenticated && input.status === "completed";
}
