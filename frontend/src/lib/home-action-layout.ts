export const homeStageLayout = {
  design: { width: 390, height: 844 },
  viewports: [
    { width: 375, height: 667 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
  ],
  bands: {
    header: { top: 32, bottom: 110 },
    visualFocus: { top: 110, bottom: 520 },
    actions: { top: 448, bottom: 728 },
    bottomNav: { top: 746, bottom: 838 },
  },
  minimumGap: {
    actionToNav: 12,
  },
} as const;

export const homeActionRootClassName = "home-action-stage mt-auto shrink-0 space-y-2 pb-3";
export const homeActionGroupClassName = "home-action-group space-y-2";
export const nightHomeActionGroupClassName = "home-action-group mt-4 mb-0 space-y-0";
export const homeActionQuestionClassName = "home-action-question mx-auto font-semibold";
export const homeActionButtonClassName = "home-action-button mx-auto -my-1.5 block w-[76%] max-w-[288px] px-2 py-0";
export const homeActionButtonContentClassName =
  "home-action-button-copy pb-0.5 text-[1.42rem] text-[var(--manyang-cat-button-text)] [text-shadow:var(--manyang-cat-button-shadow)]";
