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
    <nav className="relative -mx-6 h-[96px] w-[calc(100%+3rem)] px-0 pb-0" aria-label="하단 메뉴">
      <Image
        src={manyangAssets.footer.frame}
        alt=""
        fill
        sizes="430px"
        unoptimized
        className="object-contain drop-shadow-[0_0_14px_rgba(0,0,0,0.34)]"
      />
      <div className="absolute inset-x-[8%] bottom-[1.25rem] top-[0.7rem] grid grid-cols-5">
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
                  className="absolute left-1/2 top-1/2 h-[3.2rem] w-[3.3rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,185,92,0.18),rgba(121,64,31,0.10)_48%,rgba(13,7,24,0.00)_76%)] opacity-85 shadow-[0_0_12px_rgba(255,185,92,0.16),inset_0_0_10px_rgba(255,214,135,0.06)]"
                />
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
                      ? "scale-105 drop-shadow-[0_0_10px_rgba(255,194,106,0.44)]"
                      : "opacity-68 drop-shadow-[0_0_8px_rgba(0,0,0,0.42)]",
                  ].join(" ")}
                />
              </span>
              <span
                className={[
                  "relative z-10 truncate text-[10px] font-semibold leading-none transition",
                  isActive ? "text-[#efc47d]" : "text-[#a98268]",
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
