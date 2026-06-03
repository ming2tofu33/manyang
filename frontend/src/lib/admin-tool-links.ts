export type AdminToolGroupId = "operations" | "flow-tests" | "surfaces";

export type AdminToolLinkId =
  | "admin-lab"
  | "loading-lab"
  | "dream-test"
  | "tarot-test"
  | "profile"
  | "home"
  | "archive"
  | "morning"
  | "night";

export type AdminToolLink = {
  href: string;
  id: AdminToolLinkId;
  label: string;
  shortLabel: string;
};

export type AdminToolGroup = {
  id: AdminToolGroupId;
  links: AdminToolLink[];
  title: string;
};

export const adminToolGroups: AdminToolGroup[] = [
  {
    id: "operations",
    title: "운영 도구",
    links: [
      { id: "admin-lab", href: "/admin/lab", label: "Admin Lab", shortLabel: "Lab" },
      { id: "loading-lab", href: "/admin/lab/loading", label: "Loading Lab", shortLabel: "Loading" },
    ],
  },
  {
    id: "flow-tests",
    title: "유저 플로우 테스트",
    links: [
      { id: "dream-test", href: "/write", label: "꿈 테스트", shortLabel: "꿈" },
      { id: "tarot-test", href: "/tarot?adminTest=1", label: "타로 테스트", shortLabel: "타로" },
    ],
  },
  {
    id: "surfaces",
    title: "일반 화면 확인",
    links: [
      { id: "profile", href: "/profile", label: "내방", shortLabel: "내방" },
      { id: "home", href: "/", label: "홈", shortLabel: "홈" },
      { id: "archive", href: "/archive", label: "기록", shortLabel: "기록" },
      { id: "morning", href: "/morning", label: "아침 기록", shortLabel: "아침" },
      { id: "night", href: "/night", label: "밤 기록", shortLabel: "밤" },
    ],
  },
] satisfies AdminToolGroup[];

const adminToolLinks = adminToolGroups.flatMap((group) => group.links);

export function getAdminToolGroups(groupIds?: AdminToolGroupId[]): AdminToolGroup[] {
  if (!groupIds) {
    return [...adminToolGroups];
  }

  return groupIds
    .map((groupId) => adminToolGroups.find((group) => group.id === groupId))
    .filter((group): group is AdminToolGroup => Boolean(group));
}

export function getAdminToolLinks(linkIds: AdminToolLinkId[]): AdminToolLink[] {
  return linkIds
    .map((linkId) => adminToolLinks.find((link) => link.id === linkId))
    .filter((link): link is AdminToolLink => Boolean(link));
}
