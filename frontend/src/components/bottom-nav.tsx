"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { bottomNavItems, getActiveNavItem } from "@/lib/navigation";

export function BottomNav() {
  const pathname = usePathname();
  const active = getActiveNavItem(pathname);

  return (
    <nav className="relative h-[87px] w-full" aria-label="하단 메뉴">
      <Image
        src="/manyang/menu-button.png"
        alt=""
        fill
        sizes="382px"
        className="object-contain drop-shadow-[0_0_26px_rgba(95,42,151,0.25)]"
      />
      <div className="absolute inset-0 grid grid-cols-4 px-[5%]">
        {bottomNavItems.map((item) => {
          const isActive = active?.key === item.key;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={[
                "relative rounded-[1.5rem] transition",
                "focus:outline-none focus:ring-2 focus:ring-[#d799ff]",
              ].join(" ")}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive ? (
                <span className="absolute inset-x-4 top-[18px] h-12 rounded-full bg-[#c775ff]/14 blur-md" />
              ) : null}
              <span className="sr-only">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
