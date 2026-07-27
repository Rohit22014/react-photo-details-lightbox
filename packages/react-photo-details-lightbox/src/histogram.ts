import type { PhotoSlide, RgbHistogramData } from "./types";

const HISTOGRAM_BIN_COUNT = 256;
const HISTOGRAM_VIEWBOX_WIDTH = 255;
const HISTOGRAM_VIEWBOX_HEIGHT = 100;

type DecodedImage = {
  source: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
  dispose: () => void;
};

function isHistogramChannel(value: unknown): value is readonly number[] {
  if (!Array.isArray(value) || value.length !== HISTOGRAM_BIN_COUNT) {
    return false;
  }

  for (let index = 0; index < HISTOGRAM_BIN_COUNT; index += 1) {
    if (!Object.hasOwn(value, index)) return false;
    const bin = value[index];
    if (typeof bin !== "number" || !Number.isFinite(bin) || bin < 0) {
      return false;
    }
  }

  return true;
}

/**
 * Checks that each RGB channel contains exactly 256 finite, non-negative bins.
 */
export function validateRgbHistogramData(
  value: unknown,
): value is RgbHistogramData {
  if (!value || typeof value !== "object") return false;

  const histogram = value as Record<string, unknown>;
  return (
    isHistogramChannel(histogram.red) &&
    isHistogramChannel(histogram.green) &&
    isHistogramChannel(histogram.blue)
  );
}

function byteValue(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(255, Math.max(0, Math.round(value)));
}

/**
 * Builds an 8-bit, display-referred RGB histogram from interleaved RGBA pixels.
 * Fully transparent pixels are ignored; partially transparent pixels contribute
 * their alpha coverage to each channel.
 */
export function computeRgbHistogram(rgba: ArrayLike<number>): RgbHistogramData {
  if (rgba.length % 4 !== 0) {
    throw new RangeError("RGBA pixel data length must be divisible by four.");
  }

  const red = Array<number>(HISTOGRAM_BIN_COUNT).fill(0);
  const green = Array<number>(HISTOGRAM_BIN_COUNT).fill(0);
  const blue = Array<number>(HISTOGRAM_BIN_COUNT).fill(0);

  for (let offset = 0; offset < rgba.length; offset += 4) {
    const weight = byteValue(rgba[offset + 3]) / 255;
    if (weight === 0) continue;

    const redBin = byteValue(rgba[offset]);
    const greenBin = byteValue(rgba[offset + 1]);
    const blueBin = byteValue(rgba[offset + 2]);

    red[redBin] = (red[redBin] ?? 0) + weight;
    green[greenBin] = (green[greenBin] ?? 0) + weight;
    blue[blueBin] = (blue[blueBin] ?? 0) + weight;
  }

  return { red, green, blue };
}

function assertMaxDimension(maxDimension: number) {
  if (!Number.isFinite(maxDimension) || maxDimension <= 0) {
    throw new RangeError("Histogram maxDimension must be a positive number.");
  }
}

/**
 * Selects a lightweight analysis source without changing the displayed image.
 */
export function selectHistogramSource(
  slide: PhotoSlide,
  maxDimension: number,
): string {
  if (slide.photoHistogramSrc?.trim()) return slide.photoHistogramSrc;

  assertMaxDimension(maxDimension);

  const candidates = (slide.srcSet ?? [])
    .filter(
      (candidate) =>
        candidate.src.trim() &&
        Number.isFinite(candidate.width) &&
        candidate.width > 0 &&
        Number.isFinite(candidate.height) &&
        candidate.height > 0,
    )
    .map((candidate, index) => ({
      candidate,
      index,
      longestEdge: Math.max(candidate.width, candidate.height),
      area: candidate.width * candidate.height,
    }));

  const adequate = candidates
    .filter(({ longestEdge }) => longestEdge >= maxDimension)
    .sort(
      (left, right) =>
        left.longestEdge - right.longestEdge ||
        left.area - right.area ||
        left.index - right.index,
    )[0];

  if (adequate) return adequate.candidate.src;

  const largest = candidates.sort(
    (left, right) =>
      right.longestEdge - left.longestEdge ||
      right.area - left.area ||
      left.index - right.index,
  )[0];

  return largest?.candidate.src ?? slide.src;
}

function abortError(signal?: AbortSignal) {
  if (signal?.reason !== undefined) return signal.reason;

  if (typeof DOMException !== "undefined") {
    return new DOMException("Histogram analysis was aborted.", "AbortError");
  }

  const error = new Error("Histogram analysis was aborted.");
  error.name = "AbortError";
  return error;
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw abortError(signal);
}

async function decodeBlob(
  blob: Blob,
  signal?: AbortSignal,
): Promise<DecodedImage> {
  throwIfAborted(signal);

  let bitmapError: unknown;
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob);
      if (signal?.aborted) {
        bitmap.close();
        throw abortError(signal);
      }
      if (bitmap.width <= 0 || bitmap.height <= 0) {
        bitmap.close();
        throw new Error("Decoded image has invalid dimensions.");
      }

      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        dispose: () => bitmap.close(),
      };
    } catch (error) {
      if (signal?.aborted) throw abortError(signal);
      bitmapError = error;
    }
  }

  if (
    typeof Image === "undefined" ||
    typeof URL === "undefined" ||
    typeof URL.createObjectURL !== "function"
  ) {
    throw (
      bitmapError ??
      new Error("This environment cannot decode images for histogram analysis.")
    );
  }

  const objectUrl = URL.createObjectURL(blob);
  const image = new Image();

  try {
    await new Promise<void>((resolve, reject) => {
      const cleanupListeners = () => {
        image.onload = null;
        image.onerror = null;
        signal?.removeEventListener("abort", onAbort);
      };
      const onAbort = () => {
        cleanupListeners();
        image.src = "";
        reject(abortError(signal));
      };

      image.onload = () => {
        cleanupListeners();
        resolve();
      };
      image.onerror = () => {
        cleanupListeners();
        reject(
          bitmapError ??
            new Error("Unable to decode image for histogram analysis."),
        );
      };
      signal?.addEventListener("abort", onAbort, { once: true });
      if (signal?.aborted) {
        onAbort();
        return;
      }
      image.src = objectUrl;
    });

    throwIfAborted(signal);

    if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
      throw new Error("Decoded image has invalid dimensions.");
    }

    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      dispose: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

function analysisDimensions(
  width: number,
  height: number,
  maxDimension: number,
) {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function readPixels(
  image: ImageBitmap | HTMLImageElement,
  width: number,
  height: number,
) {
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      throw new Error("Unable to create a canvas for histogram analysis.");
    }
    context.drawImage(image, 0, 0, width, height);
    return context.getImageData(0, 0, width, height).data;
  }

  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      throw new Error("Unable to create a canvas for histogram analysis.");
    }
    context.drawImage(image, 0, 0, width, height);
    return context.getImageData(0, 0, width, height).data;
  }

  throw new Error(
    "This environment cannot render images for histogram analysis.",
  );
}

/**
 * Fetches and analyzes an image separately from the lightbox's displayed image.
 */
export async function analyzeImageHistogram(
  source: string,
  maxDimension: number,
  signal?: AbortSignal,
): Promise<RgbHistogramData> {
  assertMaxDimension(maxDimension);
  throwIfAborted(signal);

  if (typeof fetch !== "function") {
    throw new Error(
      "This environment cannot fetch images for histogram analysis.",
    );
  }

  const response = await fetch(source, {
    mode: "cors",
    credentials: "same-origin",
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) {
    throw new Error(
      `Unable to fetch image for histogram analysis (${response.status}).`,
    );
  }

  throwIfAborted(signal);
  const decoded = await decodeBlob(await response.blob(), signal);

  try {
    throwIfAborted(signal);
    const dimensions = analysisDimensions(
      decoded.width,
      decoded.height,
      maxDimension,
    );
    const pixels = readPixels(
      decoded.source,
      dimensions.width,
      dimensions.height,
    );
    throwIfAborted(signal);
    return computeRgbHistogram(pixels);
  } finally {
    decoded.dispose();
  }
}

function coordinate(value: number) {
  const rounded = Math.round(value * 1_000) / 1_000;
  return String(Object.is(rounded, -0) ? 0 : rounded);
}

/**
 * Creates a closed area path in a fixed `0 0 255 100` coordinate system.
 * Pass the maximum across all RGB channels to keep them globally normalized.
 */
export function createHistogramPath(
  values: readonly number[],
  maxValue?: number,
): string {
  if (values.length === 0) return "";

  const calculatedMax = values.reduce(
    (highest, value) =>
      Number.isFinite(value) && value > highest ? value : highest,
    0,
  );
  const scaleMax =
    maxValue !== undefined && Number.isFinite(maxValue) && maxValue > 0
      ? maxValue
      : calculatedMax;
  if (scaleMax <= 0) return "";

  const points = values.map((value, index) => {
    const normalized =
      Number.isFinite(value) && value > 0 ? Math.min(1, value / scaleMax) : 0;
    const x =
      values.length === 1
        ? 0
        : (index / (values.length - 1)) * HISTOGRAM_VIEWBOX_WIDTH;
    const y = HISTOGRAM_VIEWBOX_HEIGHT * (1 - normalized);
    return `L ${coordinate(x)} ${coordinate(y)}`;
  });

  return `M 0 ${HISTOGRAM_VIEWBOX_HEIGHT} ${points.join(" ")} L ${HISTOGRAM_VIEWBOX_WIDTH} ${HISTOGRAM_VIEWBOX_HEIGHT} Z`;
}

function percentage(value: number, total: number) {
  const percent = (value / total) * 100;
  if (percent > 0 && percent < 0.1) return "<0.1%";
  return `${Number(percent.toFixed(1))}%`;
}

function channelSummary(label: string, values: readonly number[]) {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return `${label} channel: no visible pixels.`;

  const shadows = values.slice(0, 85).reduce((sum, value) => sum + value, 0);
  const midtones = values.slice(85, 171).reduce((sum, value) => sum + value, 0);
  const highlights = values.slice(171).reduce((sum, value) => sum + value, 0);

  return `${label} channel: ${percentage(shadows, total)} shadows, ${percentage(midtones, total)} midtones, ${percentage(highlights, total)} highlights; ${percentage(values[0] ?? 0, total)} black clipping and ${percentage(values[255] ?? 0, total)} white clipping.`;
}

/**
 * Produces screen-reader-friendly tonal and clipping summaries.
 */
export function summarizeRgbHistogram(data: RgbHistogramData): {
  red: string;
  green: string;
  blue: string;
} {
  if (!validateRgbHistogramData(data)) {
    throw new TypeError(
      "RGB histogram data must contain three valid channels.",
    );
  }

  return {
    red: channelSummary("Red", data.red),
    green: channelSummary("Green", data.green),
    blue: channelSummary("Blue", data.blue),
  };
}
