"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";

import { CatReaderPicker } from "@/components/cat-reader-picker";
import {
  getCatReaderById,
  getDefaultCatReaderSnapshot,
  getSelectedCatReaderSnapshotFromBrowser,
  saveSelectedCatReaderIdToBrowser,
  subscribeToSelectedCatReader,
} from "@/lib/cat-readers";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn, ui } from "@/lib/styles";

type ProfileSetting = {
  title: string;
  description: string;
  icon: keyof typeof manyangAssets.icons;
  value?: string;
};

const profileSettings: ProfileSetting[] = [
  {
    title: "알림 설정",
    description: "아침 기록, 밤 씨앗, 주간 리포트 알림",
    icon: "bell",
  },
  {
    title: "잠금과 프라이버시",
    description: "앱 잠금, 기록 숨기기, 공유 설정",
    icon: "key",
  },
  {
    title: "화면 테마",
    description: "앱 테마와 색상 선택",
    icon: "potion",
    value: "마녀의 밤",
  },
  {
    title: "Moon Pass",
    description: "프리미엄 해몽사와 확장 기능",
    icon: "star",
    value: "Guest",
  },
  {
    title: "서비스 안내",
    description: "해몽 결과 안내, 이용약관, 문의하기",
    icon: "help",
  },
  {
    title: "계정 관리",
    description: "계정 정보, 로그아웃, 계정 삭제",
    icon: "profile",
  },
];

export function ProfileRoom() {
  const selectedCatReaderId = useSyncExternalStore(
    subscribeToSelectedCatReader,
    getSelectedCatReaderSnapshotFromBrowser,
    getDefaultCatReaderSnapshot,
  );
  const selectedReader = getCatReaderById(selectedCatReaderId);

  return (
    <div className="space-y-3 pb-3">
      <section className="rounded-[1.35rem] border border-[#7c4a38]/62 bg-[rgba(7,6,17,0.72)] p-3 shadow-[0_0_30px_rgba(0,0,0,0.30)] ring-1 ring-[#d799ff]/12 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="relative h-[5.35rem] w-[5.35rem] shrink-0">
            <Image
              src={manyangAssets.illustrations[selectedReader.assetKey]}
              alt=""
              fill
              sizes="86px"
              unoptimized
              className="scale-110 object-contain"
            />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={cn("text-[1.35rem] font-semibold text-[#ffd98a]", ui.textGlow)}>도민님</h2>
              <span className="rounded-full border border-[#b98255]/42 bg-[#1b1028]/72 px-2 py-0.5 text-[10px] font-semibold text-[#f0bc7d]">
                Moon Guest
              </span>
            </div>
            <p className="mt-1 text-[12px] font-semibold text-[#f0bc7d]">
              대표 해몽사 · {selectedReader.name}
            </p>
            <p className="mt-1 line-clamp-2 text-[12px] leading-4 text-[#fff3d7]/76">
              오늘은 {selectedReader.shortDescription} 리딩 톤으로 꿈을 읽어요.
            </p>
          </div>
        </div>
      </section>

      <CatReaderPicker
        value={selectedCatReaderId}
        onChange={saveSelectedCatReaderIdToBrowser}
        variant="compact"
        heading="대표 해몽사 설정"
      />

      <section className="overflow-hidden rounded-[1.35rem] border border-[#7c4a38]/62 bg-[rgba(7,6,17,0.72)] shadow-[0_0_30px_rgba(0,0,0,0.28)] ring-1 ring-[#d799ff]/12 backdrop-blur-md">
        {profileSettings.map((item, index) => (
          <button
            key={item.title}
            type="button"
            className={cn(
              "flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#241036]/42 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#d799ff]",
              index > 0 && "border-t border-[#7c4a38]/38",
            )}
          >
            <span className="relative h-10 w-10 shrink-0 rounded-[0.8rem] border border-[#7c4a38]/42 bg-[#241036]/62 p-2">
              <Image
                src={manyangAssets.icons[item.icon]}
                alt=""
                fill
                sizes="40px"
                unoptimized
                className="object-contain p-2"
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[1rem] font-semibold text-[#ffd98a]">{item.title}</span>
              <span className="mt-0.5 block truncate text-[12px] text-[#fff3d7]/68">{item.description}</span>
            </span>
            {item.value ? (
              <span className="shrink-0 rounded-full border border-[#b86cff]/44 px-2.5 py-1 text-[11px] font-semibold text-[#e7b3ff]">
                {item.value}
              </span>
            ) : (
              <span className="shrink-0 text-[1.7rem] leading-none text-[#c58a61]">›</span>
            )}
          </button>
        ))}
      </section>

      <section className="rounded-[1rem] border border-[#7c4a38]/56 bg-[rgba(7,6,17,0.68)] px-4 py-3 text-[12px] leading-5 text-[#f0bc7d]/88">
        마냥 꿈해몽의 해석은 오락과 자기 성찰을 위한 감성 리딩입니다. 의학적, 심리학적 진단이나 전문 상담을 대체하지 않습니다.
      </section>
    </div>
  );
}
