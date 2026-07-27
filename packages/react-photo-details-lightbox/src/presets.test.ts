import { describe, expect, it } from "vitest";
import { createFormatters } from "./formatters";
import { getPresetSections, resolveDetailSections } from "./presets";
import type { PhotoSlide } from "./types";

const slide: PhotoSlide = {
  src: "/image.jpg",
  photoMetadata: {
    title: "Rain line",
    camera: { make: "Leica", model: "SL2-S" },
    exposure: { aperture: 5.6, shutterSpeed: "1/500", iso: 320 },
  },
};

describe("detail presets", () => {
  it("keeps minimum mode empty", () => {
    expect(getPresetSections("minimum")).toEqual([]);
  });

  it("removes missing fields and empty sections", () => {
    const sections = resolveDetailSections(getPresetSections("detailed"), {
      level: "detailed",
      metadata: slide.photoMetadata!,
      slide,
    });

    expect(sections.some((section) => section.id === "equipment")).toBe(true);
    expect(sections.some((section) => section.id === "file")).toBe(false);
  });

  it("formats common photographic values", () => {
    const formatters = createFormatters();
    expect(formatters.aperture(8)).toBe("f/8");
    expect(formatters.shutterSpeed("1/250")).toBe("1/250 s");
    expect(formatters.focalLength(35)).toBe("35 mm");
    expect(formatters.fileSize(1_048_576)).toBe("1 MB");
  });
});
