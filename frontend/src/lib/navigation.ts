import { legacyDreamSeedRoute, nightCheckInRoute } from "./night-checkin-options";

export type NavKey = "today" | "write" | "archive" | "encyclopedia" | "profile";

export type BottomNavItem = {
  key: NavKey;
  label: string;
  href: string;
  icon: "moon" | "pen" | "clipboard" | "book" | "profile";
  match: (pathname: string) => boolean;
};

export const bottomNavItems: BottomNavItem[] = [
  {
    key: "today",
    label: "오늘",
    href: "/",
    icon: "moon",
    match: (pathname) =>
      pathname === "/" ||
      pathname.startsWith("/morning") ||
      pathname.startsWith(nightCheckInRoute) ||
      pathname.startsWith(legacyDreamSeedRoute),
  },
  {
    key: "write",
    label: "꿈쓰기",
    href: "/write",
    icon: "pen",
    match: (pathname) =>
      pathname.startsWith("/write") ||
      pathname.startsWith("/loading") ||
      pathname.startsWith("/result"),
  },
  {
    key: "archive",
    label: "기록",
    href: "/archive",
    icon: "clipboard",
    match: (pathname) => pathname.startsWith("/archive"),
  },
  {
    key: "encyclopedia",
    label: "백과",
    href: "/encyclopedia",
    icon: "book",
    match: (pathname) => pathname.startsWith("/encyclopedia"),
  },
  {
    key: "profile",
    label: "내방",
    href: "/profile",
    icon: "profile",
    match: (pathname) => pathname.startsWith("/profile"),
  },
];

export function getActiveNavItem(pathname: string) {
  return bottomNavItems.find((item) => item.match(pathname));
}
