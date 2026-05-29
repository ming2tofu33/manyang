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
    <nav className="relative -mx-4 h-[92px] w-[calc(100%+2rem)] px-3 pb-1" aria-label="하단 메뉴">
      <Image
        src={manyangAssets.footer.frame}
        alt=""
        fill
        sizes="382px"
        unoptimized
        className="object-contain drop-shadow-[0_0_26px_rgba(95,42,151,0.25)]"
      />
      <div className="absolute inset-x-[5.5%] bottom-[0.55rem] top-[0.6rem] grid grid-cols-5">
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
                <span
                  data-bottom-nav-active-indicator="true"
                  className="absolute left-1/2 top-1/2 h-[3.25rem] w-[3.35rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(159,74,255,0.30),rgba(79,28,118,0.18)_48%,rgba(13,7,24,0.00)_76%)] opacity-90 shadow-[0_0_14px_rgba(178,91,255,0.24),inset_0_0_10px_rgba(255,217,138,0.08)]"
                />
              ) : null}
              <span className="relative z-10 h-[31px] w-[31px]">
                <Image
                  src={manyangAssets.footer.icons[item.key]}
                  alt=""
                  fill
                  sizes="31px"
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
                  "relative z-10 truncate text-[10px] font-semibold leading-none transition",
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
