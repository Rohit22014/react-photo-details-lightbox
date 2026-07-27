import type { ReactNode } from "react";
import type { PhotoDetailsFormatters } from "./types";

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
});

export const defaultFormatters: PhotoDetailsFormatters = {
  date(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  },

  coordinates(latitude, longitude) {
    const lat = `${Math.abs(latitude).toFixed(4)}° ${
      latitude >= 0 ? "N" : "S"
    }`;
    const lng = `${Math.abs(longitude).toFixed(4)}° ${
      longitude >= 0 ? "E" : "W"
    }`;
    return `${lat}, ${lng}`;
  },

  fileSize(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return String(bytes);
    if (bytes < 1024) return `${bytes} B`;

    const units = ["KB", "MB", "GB", "TB"];
    let value = bytes / 1024;
    let unit = units[0]!;
    for (let index = 1; value >= 1024 && index < units.length; index += 1) {
      value /= 1024;
      unit = units[index]!;
    }
    return `${numberFormatter.format(value)} ${unit}`;
  },

  aperture(value) {
    const stringValue = String(value);
    return stringValue.toLowerCase().startsWith("f/")
      ? stringValue
      : `f/${stringValue}`;
  },

  shutterSpeed(value) {
    if (typeof value === "number") {
      if (value > 0 && value < 1) return `1/${Math.round(1 / value)} s`;
      return `${numberFormatter.format(value)} s`;
    }
    return String(value).includes("s") ? String(value) : `${value} s`;
  },

  focalLength(value) {
    const stringValue = String(value);
    return stringValue.toLowerCase().includes("mm")
      ? stringValue
      : `${stringValue} mm`;
  },

  value(value): ReactNode {
    if (value === null || value === undefined) return null;
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (value instanceof Date) return defaultFormatters.date(value);
    if (Array.isArray(value)) return value.join(" · ");
    if (typeof value === "object") {
      return Object.values(value as Record<string, unknown>)
        .filter(
          (entry) => entry !== null && entry !== undefined && entry !== "",
        )
        .join(" ");
    }
    return String(value);
  },
};

export function createFormatters(
  overrides?: Partial<PhotoDetailsFormatters>,
): PhotoDetailsFormatters {
  return { ...defaultFormatters, ...overrides };
}
