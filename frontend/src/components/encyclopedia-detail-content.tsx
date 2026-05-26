import type { EncyclopediaEntry } from "@manyang/backend";
import Image from "next/image";
import Link from "next/link";

import { getCatReaderById, type CatReaderId } from "@/lib/cat-readers";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn, ui } from "@/lib/styles";

export type RelatedSymbolLink = {
  symbol: string;
  slug: string | null;
};

type EncyclopediaDetailContentProps = {
  entry: EncyclopediaEntry;
  relatedSymbols: RelatedSymbolLink[];
  selectedCatReaderId: CatReaderId;
};

export function EncyclopediaDetailContent({
  entry,
  relatedSymbols,
  selectedCatReaderId,
}: EncyclopediaDetailContentProps) {
  const reader = getCatReaderById(selectedCatReaderId);

  return (
    <div className="mt-auto space-y-4 pb-5">
      <section className={cn(ui.panel, "p-5")}>
        <div className="flex items-start gap-4">
          <span className="relative h-16 w-16 shrink-0">
            <Image src={manyangAssets.icons.door} alt="" fill sizes="64px" unoptimized className="object-contain" />
          </span>
          <div>
            <p className="text-sm text-[#f0bc7d]">핵심 의미</p>
            <h1 className="mt-3 text-3xl leading-tight text-[#ffd98a]">{entry.symbol} 꿈 해몽</h1>
          </div>
        </div>
        <p className="mt-4 leading-7 text-[#fff3d7]/88">{entry.body}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {entry.coreMeanings.map((meaning) => (
            <span key={meaning} className={ui.chip}>
              {meaning}
            </span>
          ))}
        </div>
      </section>

      <section className={cn(ui.panel, "space-y-4 p-5")}>
        <ReadingList title="좋게 읽을 수 있는 흐름" items={entry.positiveReadings} />
        <ReadingList title="조심해서 볼 흐름" items={entry.negativeReadings} />
      </section>

      <section className={cn(ui.panel, "p-5")}>
        <p className="text-sm text-[#f0bc7d]">꿈 맥락 질문</p>
        <ul className="mt-3 space-y-2 text-[15px] leading-6 text-[#fff3d7]/88">
          {entry.contextQuestions.map((question) => (
            <li key={question}>• {question}</li>
          ))}
        </ul>
      </section>

      <section className={cn(ui.panel, "flex gap-4 p-5")}>
        <span className="relative mt-1 h-16 w-16 shrink-0">
          <Image
            src={manyangAssets.illustrations[reader.assetKey]}
            alt={`${reader.name} 상징 힌트`}
            fill
            sizes="64px"
            unoptimized
            className="scale-110 object-contain drop-shadow-[0_0_18px_rgba(215,153,255,0.28)]"
          />
        </span>
        <div>
          <p className="text-sm text-[#f0bc7d]">{reader.name} 상징 힌트</p>
          <p className="mt-3 leading-7 text-[#fff3d7]/88">{entry.catInterpretationHint}</p>
        </div>
      </section>

      <section className={cn(ui.panel, "p-5")}>
        <p className="text-sm text-[#f0bc7d]">관련 상징</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {relatedSymbols.map((relatedSymbol) =>
            relatedSymbol.slug ? (
              <Link key={relatedSymbol.symbol} href={`/encyclopedia/${relatedSymbol.slug}`} className={ui.chip}>
                {relatedSymbol.symbol}
              </Link>
            ) : (
              <span key={relatedSymbol.symbol} className={ui.chip}>
                {relatedSymbol.symbol}
              </span>
            ),
          )}
        </div>
      </section>

      <section className={cn(ui.panel, "p-5")}>
        <p className="text-lg font-semibold leading-7 text-[#ffd98a]">내 꿈에도 {entry.symbol}이 나왔나요?</p>
        <p className="mt-2 text-[15px] leading-6 text-[#fff3d7]/82">
          상징만으로 단정하기보다 꿈의 장면과 기분을 함께 넣으면 더 자연스럽게 읽을 수 있어요.
        </p>
        <Link href={`/write?symbol=${entry.slug}`} className={cn(ui.primaryAction, "mt-4 min-h-[3.25rem] text-base")}>
          오늘의 꿈 영수증 받기
        </Link>
        <p className="mt-3 text-xs leading-5 text-[#caa37b]">
          마냥 꿈해몽은 오락과 자기 성찰을 위한 해석을 제공하며, 의학적·법적·심리 진단을 대신하지 않아요.
        </p>
      </section>
    </div>
  );
}

function ReadingList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-sm text-[#f0bc7d]">{title}</p>
      <ul className="mt-2 space-y-2 text-[15px] leading-6 text-[#fff3d7]/88">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
