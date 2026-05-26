"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { manyangAssets } from "@/lib/manyang-assets";
import { bottomNavItems, getActiveNavItem } from "@/lib/navigation";

export function BottomNav() {
  const pathname = usePathname();
  const active = getActiveNavItem(pathname);

  return (
    <nav className="relative h-[92px] w-full px-3 pb-1" aria-label="하단 메뉴">
      <Image
        src={manyangAssets.footer.frame}
        alt=""
        fill
        sizes="382px"
        unoptimized
        className="object-contain drop-shadow-[0_0_26px_rgba(95,42,151,0.25)]"
      />
      <div className="absolute inset-x-[7%] bottom-[0.55rem] top-[0.6rem] grid grid-cols-4">
        {bottomNavItems.map((item) => {
          const isActive = active?.key === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={[
                "relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-[1.5rem] transition",
                "focus:outline-none focus:ring-2 focus:ring-[#d799ff]",
              ].join(" ")}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive ? (
                <span className="absolute left-1/2 top-[0.45rem] h-[3.55rem] w-[4.55rem] -translate-x-1/2 rounded-[1.35rem] border border-[#b86cff]/55 bg-[radial-gradient(ellipse_at_center,rgba(149,66,255,0.34),rgba(52,18,83,0.30)_58%,rgba(13,7,24,0.10)_100%)] shadow-[0_0_18px_rgba(178,91,255,0.34),inset_0_0_12px_rgba(255,217,138,0.10)]" />
              ) : null}
              <span className="relative z-10 h-[34px] w-[34px]">
                <Image
                  src={manyangAssets.footer.icons[item.key]}
                  alt=""
                  fill
                  sizes="34px"
                  unoptimized
                  className={[
                    "object-contain transition",
                    isActive
                      ? "scale-105 drop-shadow-[0_0_12px_rgba(255,217,138,0.62)]"
                      : "opacity-62 drop-shadow-[0_0_8px_rgba(0,0,0,0.35)]",
                  ].join(" ")}
                />
              </span>
              <span
                className={[
                  "relative z-10 truncate text-[11px] font-semibold leading-none transition",
                  isActive ? "text-[#ffd98a]" : "text-[#b88b75]",
                ].join(" ")}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
