const defaultShareImageSize = {
  width: 900,
  height: 1300,
} as const;

type ShareImageSize = {
  width: number;
  height: number;
};

type SharePngImageInput = {
  svg: string;
  fileName: string;
  title: string;
  text?: string;
};

type ElementPngExportOptions = {
  backgroundColor?: string | null;
  padding?: number;
  pixelRatio?: number;
};

export type SharePngImageResult = "shared" | "downloaded" | "cancelled";

function parseSvgDimension(svg: string, attributeName: "height" | "width"): number | null {
  const match = svg.match(new RegExp(`\\b${attributeName}=["']([0-9]+(?:\\.[0-9]+)?)["']`));
  const dimension = match ? Number(match[1]) : 0;

  return Number.isFinite(dimension) && dimension > 0 ? dimension : null;
}

export function getSvgImageSize(svg: string, fallback: ShareImageSize = defaultShareImageSize): ShareImageSize {
  return {
    width: parseSvgDimension(svg, "width") ?? fallback.width,
    height: parseSvgDimension(svg, "height") ?? fallback.height,
  };
}

function getElementImageSize(element: HTMLElement, padding = 0): ShareImageSize {
  const rect = element.getBoundingClientRect();
  const width = Math.ceil(Math.max(rect.width, element.scrollWidth));
  const height = Math.ceil(Math.max(rect.height, element.scrollHeight));

  return {
    width: width + padding * 2,
    height: height + padding * 2,
  };
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load SVG image for PNG export."));
    image.src = url;
  });
}

function createCanvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Failed to create PNG image."));
      },
      "image/png",
      0.95,
    );
  });
}

export async function createPngBlobFromElement(
  element: HTMLElement,
  { backgroundColor = null, padding = 0, pixelRatio = 2 }: ElementPngExportOptions = {},
): Promise<Blob> {
  await document.fonts?.ready;

  const { default: html2canvas } = await import("html2canvas");
  const size = getElementImageSize(element);
  const exportRoot = document.createElement("div");
  const clone = element.cloneNode(true) as HTMLElement;
  const style = document.createElement("style");

  style.textContent = `
    [data-share-image-export="true"],
    [data-share-image-export="true"] * {
      animation: none !important;
      transition: none !important;
      opacity: 1 !important;
      visibility: visible !important;
    }

    [data-share-image-export="true"] {
      margin: 0 !important;
      max-width: none !important;
      transform: none !important;
    }
  `;

  clone.setAttribute("data-share-image-export", "true");
  clone.style.width = `${size.width}px`;
  clone.style.maxWidth = "none";
  clone.style.margin = "0";
  clone.style.transform = "none";

  exportRoot.style.position = "fixed";
  exportRoot.style.left = "-10000px";
  exportRoot.style.top = "0";
  exportRoot.style.width = `${size.width + padding * 2}px`;
  exportRoot.style.minHeight = `${size.height + padding * 2}px`;
  exportRoot.style.padding = `${padding}px`;
  exportRoot.style.boxSizing = "border-box";
  exportRoot.style.background = backgroundColor ?? "transparent";
  exportRoot.style.pointerEvents = "none";
  exportRoot.append(style, clone);
  document.body.append(exportRoot);

  try {
    const canvas = await html2canvas(exportRoot, {
      allowTaint: false,
      backgroundColor,
      imageTimeout: 15000,
      logging: false,
      removeContainer: true,
      scale: Math.max(1, pixelRatio),
      useCORS: true,
    });

    return await createCanvasBlob(canvas);
  } finally {
    exportRoot.remove();
  }
}

export async function createPngBlobFromSvg(svg: string, pixelRatio = 2): Promise<Blob> {
  const { width, height } = getSvgImageSize(svg);
  const scale = Math.max(1, pixelRatio);
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImageFromUrl(url);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas is not available for PNG export.");
    }

    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.scale(scale, scale);
    context.drawImage(image, 0, 0, width, height);

    return await createCanvasBlob(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function downloadSvgAsPng(svg: string, fileName: string): Promise<void> {
  const pngBlob = await createPngBlobFromSvg(svg);

  downloadBlob(pngBlob, fileName);
}

export async function downloadElementAsPng(
  element: HTMLElement,
  fileName: string,
  options?: ElementPngExportOptions,
): Promise<void> {
  const pngBlob = await createPngBlobFromElement(element, options);

  downloadBlob(pngBlob, fileName);
}

export async function shareSvgAsPng({ svg, fileName, title, text }: SharePngImageInput): Promise<SharePngImageResult> {
  const pngBlob = await createPngBlobFromSvg(svg);
  const file = new File([pngBlob], fileName, { type: "image/png" });
  const shareData: ShareData = text ? { files: [file], text, title } : { files: [file], title };

  if (navigator.share && navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData);

      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  downloadBlob(pngBlob, fileName);

  return "downloaded";
}
