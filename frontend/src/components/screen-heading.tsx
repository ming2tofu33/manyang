import { ui } from "@/lib/styles";

type ScreenHeadingProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

export function ScreenHeading({ eyebrow, title, subtitle }: ScreenHeadingProps) {
  return (
    <div className="text-center">
      {eyebrow ? (
        <p className="text-[12px] tracking-[0.42em] text-[#f4b65f]">{eyebrow}</p>
      ) : null}
      <h1 className={`mt-3 text-[34px] font-semibold leading-tight text-[#ffd98a] ${ui.textGlow}`}>
        {title}
      </h1>
      {subtitle ? (
        <p className="mx-auto mt-4 max-w-[280px] whitespace-pre-line text-[20px] leading-8 text-[#fff3d7]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
