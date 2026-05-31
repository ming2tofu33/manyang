export type MinimalAuthSession = {
  user?: {
    id?: string | null;
  } | null;
} | null;

export type ArchiveAccessState =
  | {
      status: "guest";
      canPersistDreams: false;
      canViewArchive: false;
    }
  | {
      status: "authenticated";
      canPersistDreams: true;
      canViewArchive: true;
    };

export function getArchiveAccessState(session: MinimalAuthSession): ArchiveAccessState {
  if (session?.user?.id) {
    return {
      status: "authenticated",
      canPersistDreams: true,
      canViewArchive: true,
    };
  }

  return {
    status: "guest",
    canPersistDreams: false,
    canViewArchive: false,
  };
}
