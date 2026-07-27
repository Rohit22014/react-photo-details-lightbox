import { describe, expect, it } from "vitest";
import {
  computeRgbHistogram,
  createHistogramPath,
  selectHistogramSource,
  summarizeRgbHistogram,
  validateRgbHistogramData,
} from "./histogram";
import type { PhotoSlide, RgbHistogramData } from "./types";

function channel(value = 0) {
  return Array<number>(256).fill(value);
}

describe("RGB histogram validation", () => {
  it("accepts exactly three valid 256-bin arrays", () => {
    expect(
      validateRgbHistogramData({
        red: channel(),
        green: channel(0.5),
        blue: channel(1),
      }),
    ).toBe(true);
  });

  it.each([
    {
      red: channel().slice(1),
      green: channel(),
      blue: channel(),
    },
    {
      red: [...channel(), 0],
      green: channel(),
      blue: channel(),
    },
    {
      red: channel(),
      green: Object.assign(channel(), { 42: Number.NaN }),
      blue: channel(),
    },
    {
      red: channel(),
      green: channel(),
      blue: Object.assign(channel(), { 18: -1 }),
    },
    {
      red: new Uint32Array(256),
      green: channel(),
      blue: channel(),
    },
    {
      red: Array<number>(256),
      green: channel(),
      blue: channel(),
    },
    {
      red: Object.assign(channel(), { 42: undefined }),
      green: channel(),
      blue: channel(),
    },
  ])("rejects invalid channel data", (histogram) => {
    expect(validateRgbHistogramData(histogram)).toBe(false);
  });
});

describe("RGB histogram computation", () => {
  it("weights partial alpha and ignores transparent pixels", () => {
    const histogram = computeRgbHistogram(
      new Uint8ClampedArray([255, 0, 0, 255, 0, 128, 255, 128, 12, 13, 14, 0]),
    );
    const partialWeight = 128 / 255;

    expect(histogram.red[255]).toBe(1);
    expect(histogram.red[0]).toBeCloseTo(partialWeight);
    expect(histogram.green[0]).toBe(1);
    expect(histogram.green[128]).toBeCloseTo(partialWeight);
    expect(histogram.blue[0]).toBe(1);
    expect(histogram.blue[255]).toBeCloseTo(partialWeight);
    expect(histogram.red[12]).toBe(0);
    expect(histogram.green[13]).toBe(0);
    expect(histogram.blue[14]).toBe(0);
  });

  it("rejects incomplete RGBA pixels", () => {
    expect(() => computeRgbHistogram([0, 0, 0])).toThrow(RangeError);
  });
});

describe("histogram source selection", () => {
  const slide: PhotoSlide = {
    src: "/original.jpg",
    srcSet: [
      { src: "/320.jpg", width: 320, height: 180 },
      { src: "/1280.jpg", width: 1280, height: 720 },
      { src: "/640.jpg", width: 640, height: 360 },
    ],
  };

  it("prefers an explicit analysis source", () => {
    expect(
      selectHistogramSource(
        { ...slide, photoHistogramSrc: "/analysis.jpg" },
        512,
      ),
    ).toBe("/analysis.jpg");
  });

  it("selects the smallest srcSet candidate that reaches the target", () => {
    expect(selectHistogramSource(slide, 512)).toBe("/640.jpg");
  });

  it("selects the largest candidate if no srcSet source reaches the target", () => {
    expect(selectHistogramSource(slide, 2048)).toBe("/1280.jpg");
  });

  it("falls back to src when srcSet is empty", () => {
    expect(
      selectHistogramSource({ src: "/original.jpg", srcSet: [] }, 512),
    ).toBe("/original.jpg");
  });
});

describe("histogram paths", () => {
  it("uses the fixed viewBox scale and a caller-supplied global maximum", () => {
    expect(createHistogramPath([0, 5, 10], 10)).toBe(
      "M 0 100 L 0 100 L 127.5 50 L 255 0 L 255 100 Z",
    );
    expect(createHistogramPath([0, 5], 10)).toBe(
      "M 0 100 L 0 100 L 255 50 L 255 100 Z",
    );
  });

  it("returns no path for empty or zero-only data", () => {
    expect(createHistogramPath([])).toBe("");
    expect(createHistogramPath([0, 0, 0])).toBe("");
  });
});

describe("histogram summaries", () => {
  it("summarizes tonal ranges and endpoint clipping per channel", () => {
    const red = channel();
    red[0] = 10;
    red[100] = 20;
    red[200] = 70;
    const green = channel();
    const blue = channel();
    blue[255] = 100;

    expect(
      summarizeRgbHistogram({ red, green, blue } satisfies RgbHistogramData),
    ).toEqual({
      red: "Red channel: 10% shadows, 20% midtones, 70% highlights; 10% black clipping and 0% white clipping.",
      green: "Green channel: no visible pixels.",
      blue: "Blue channel: 0% shadows, 0% midtones, 100% highlights; 0% black clipping and 100% white clipping.",
    });
  });
});
