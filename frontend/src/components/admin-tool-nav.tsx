import Link from "next/link";
import { ExternalLink } from "lucide-react";

import {
  getAdminToolGroups,
  getAdminToolLinks,
  type AdminToolGroupId,
  type AdminToolLinkId,
} from "@/lib/admin-tool-links";
import { cn } from "@/lib/styles";

type AdminToolNavProps = {
  activeId?: AdminToolLinkId;
  className?: string;
  groupIds?: AdminToolGroupId[];
  title?: string;
};

type AdminToolQuickNavProps = {
  activeId?: AdminToolLinkId;
  className?: string;
  linkIds: AdminToolLinkId[];
};

export function AdminToolNav({
  activeId,
  className,
  groupIds,
  title = "Admin Tools",
}: AdminToolNavProps) {
  const groups = getAdminToolGroups(groupIds);

  return (
    <nav
      aria-label="어드민 옵션"
      data-admin-tool-nav="true"
      className={cn(
        "rounded-md border border-[#d799ff]/28 bg-[#05040b]/58 p-3 ring-1 ring-[#ffd98a]/10",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[0.92rem] font-semibold text-[#ffd98a]">{title}</p>
      </div>

      <div className="space-y-3">
        {groups.map((group) => (
          <section key={group.id} data-admin-tool-group={group.id}>
            <p className="mb-1.5 text-[11px] font-semibold text-[#e7b3ff]/82">{group.title}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {group.links.map((item) => {
                const active = item.id === activeId;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    data-admin-tool-link={item.id}
                    data-admin-tool-link-active={active ? "true" : "false"}
                    className={cn(
                      "inline-flex min-h-10 items-center justify-between gap-2 rounded-md border px-3 py-2 text-[12px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#d799ff]",
                      active
                        ? "border-[#ffd08a]/78 bg-[#24172e] text-[#fff3d7]"
                        : "border-[#7c4a38]/48 bg-[#06040c]/66 text-[#fff3d7]/82 hover:border-[#ffd08a]/58",
                    )}
                  >
                    <span className="min-w-0 truncate">{item.label}</span>
                    <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#f0bc7d]" />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </nav>
  );
}

export function AdminToolQuickNav({ activeId, className, linkIds }: AdminToolQuickNavProps) {
  const links = getAdminToolLinks(linkIds);

  return (
    <nav
      aria-label="어드민 빠른 이동"
      data-admin-tool-quick-nav="true"
      className={cn("flex gap-2 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}
    >
      {links.map((item) => {
        const active = item.id === activeId;

        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? "page" : undefined}
            data-admin-tool-quick-link={item.id}
            data-admin-tool-quick-link-active={active ? "true" : "false"}
            className={cn(
              "inline-flex min-h-8 shrink-0 items-center justify-center rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#d799ff]",
              active
                ? "border-[#ffd08a]/78 bg-[#24172e] text-[#fff3d7]"
                : "border-[#7c4a38]/48 bg-[#06040c]/70 text-[#fff3d7]/78 hover:border-[#ffd08a]/58",
            )}
          >
            {item.shortLabel}
          </Link>
        );
      })}
    </nav>
  );
}
