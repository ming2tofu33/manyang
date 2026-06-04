type ClassValue = string | false | null | undefined;

export function cn(...classes: ClassValue[]) {
  return classes.filter(Boolean).join(" ");
}

export const ui = {
  textGlow:
    "[text-shadow:0_0_14px_rgba(255,193,92,0.46),0_0_38px_rgba(153,83,255,0.32)]",
  orbButton:
    "grid h-[3.25rem] w-[3.25rem] place-items-center rounded-full border border-[#d799ff]/25 bg-[#100b1d]/60 text-[#f3c98b] shadow-[0_0_30px_rgba(160,92,255,0.22)] backdrop-blur-xl transition hover:border-[#ffd98a]/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#d799ff]",
  primaryAction:
    "flex min-h-[3.75rem] w-full items-center justify-center rounded-full border border-[#ffd08a]/75 bg-[rgba(105,54,145,0.88)] px-6 py-3.5 text-center text-lg font-bold text-[#ffe7b5] shadow-[0_0_36px_rgba(164,82,255,0.5)] transition hover:bg-[rgba(121,62,164,0.94)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#f7d58b]",
  secondaryAction:
    "flex min-h-[3.75rem] w-full items-center justify-center rounded-full border border-[#b98255]/75 bg-[rgba(5,4,11,0.62)] px-6 py-3.5 text-center text-lg font-bold text-[#f2c27d] shadow-[0_0_24px_rgba(0,0,0,0.32)] backdrop-blur-xl transition hover:border-[#ffd08a]/75 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#f7d58b]",
  panel:
    "rounded-[1.5rem] border border-[#b98255]/45 bg-[rgba(7,6,18,0.76)] shadow-[0_20px_50px_rgba(0,0,0,0.28)] ring-1 ring-[#d799ff]/10 backdrop-blur-xl",
  chip:
    "rounded-full border border-[#b98255]/55 bg-[#06040c]/60 px-3.5 py-2 text-sm text-[#f2c27d] transition hover:border-[#ffd08a]/70 hover:text-[#ffe7b5] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#d799ff]",
  insetFocus:
    "focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#d799ff]/72",
  selectedControl:
    "border-[#cfa0ef]/72 bg-[linear-gradient(135deg,rgba(84,38,119,0.82),rgba(24,13,42,0.92))] text-[#ffe7b5] shadow-[inset_0_0_0_1px_rgba(215,153,255,0.36),inset_0_0_18px_rgba(255,216,138,0.07)]",
  selectedPill:
    "border-[#cfa0ef]/72 bg-[rgba(76,34,112,0.66)] text-[#ffe7b5] shadow-[inset_0_0_0_1px_rgba(215,153,255,0.32),inset_0_0_14px_rgba(255,216,138,0.06)]",
  symbolCard:
    "flex min-h-[8.5rem] flex-col items-center justify-center rounded-2xl border border-[#b98255]/55 bg-[rgba(11,7,24,0.82)] shadow-[0_16px_40px_rgba(0,0,0,0.24)] ring-1 ring-[#d799ff]/10 transition hover:border-[#ffd08a]/70 hover:bg-[rgba(22,12,39,0.86)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#d799ff]",
  receiptPaper:
    "rounded-[1.5rem] border border-[#8b6345]/20 bg-[#e6c996] px-5 py-8 text-[#2f2117] shadow-[0_18px_60px_rgba(0,0,0,0.38)]",
  field:
    "w-full border border-[#b98255]/35 bg-[#06040c]/70 text-[#fff3d7] outline-none placeholder:text-[#8f745f] focus:border-[#d799ff]",
};
