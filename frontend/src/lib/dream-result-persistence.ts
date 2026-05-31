export type DreamResultPersistenceInput = {
  isAuthenticated: boolean;
  status: "completed" | "unavailable";
};

export function shouldSaveReadingToLocalArchive(input: DreamResultPersistenceInput): boolean {
  void input;

  return false;
}
