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
