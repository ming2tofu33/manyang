import type { EncyclopediaEntry } from "@manyang/backend";
import Image from "next/image";
import Link from "next/link";

import {
  EncyclopediaDetailActionClient,
  EncyclopediaReaderSymbolHint,
  EncyclopediaResultContextClient,
} from "@/components/encyclopedia-reader-guide-client";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn, ui } from "@/lib/styles";

export type RelatedSymbolLink = {
  symbol: string;
  slug: string | null;
};

type EncyclopediaDetailContentProps = {
  entry: EncyclopediaEntry;
  relatedSymbols: RelatedSymbolLink[];
  source?: "default" | "result";
};

export function EncyclopediaDetailContent({
  entry,
  relatedSymbols,
  source = "default",
}: EncyclopediaDetailContentProps) {
  return (
    <div className="mt-auto space-y-4 pb-5">
      <EncyclopediaResultContextClient source={source} />

      <section className={cn(ui.panel, "p-5")}>
        <div className="flex items-start gap-4">
          <span className="relative h-16 w-16 shrink-0">
            <Image src={manyangAssets.semanticIcons.door} alt="" fill sizes="64px" unoptimized className="object-contain" />
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

      <EncyclopediaReaderSymbolHint hint={entry.catInterpretationHint} />

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

      <EncyclopediaDetailActionClient symbol={entry.symbol} slug={entry.slug} source={source} />
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
