export const mobileLayout = {
  designViewport: { width: 390, height: 844 },
  verificationViewports: [
    { width: 375, height: 667 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
  ],
  shellMaxWidth: 430,
  shellInlinePaddingClassName: "px-4 min-[420px]:px-[18px]",
  shellBleedClassName:
    "-mx-4 w-[calc(100%+2rem)] min-[420px]:-mx-[18px] min-[420px]:w-[calc(100%+36px)]",
  wideSurfaceMaxWidth: 394,
  wideSurfaceMaxWidthClassName: "max-w-[394px]",
  contentStackClassName: "space-y-4",
} as const;
