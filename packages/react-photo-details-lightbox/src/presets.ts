import type { ReactNode } from "react";
import { createFormatters } from "./formatters";
import type {
  DetailFieldContext,
  DetailLevel,
  DetailSection,
  PhotoDetailsFormatters,
  PhotoMetadata,
  ResolvedDetailSection,
} from "./types";

function joined(...parts: unknown[]) {
  const values = parts.filter(
    (part) => part !== undefined && part !== null && part !== "",
  );
  return values.length ? values.join(" ") : undefined;
}

function dimensions(metadata: PhotoMetadata) {
  const width = metadata.file?.width;
  const height = metadata.file?.height;
  return width && height ? `${width} × ${height} px` : undefined;
}

function coordinates(metadata: PhotoMetadata, formatters: PhotoDetailsFormatters) {
  const latitude = metadata.location?.latitude;
  const longitude = metadata.location?.longitude;
  return typeof latitude === "number" && typeof longitude === "number"
    ? formatters.coordinates(latitude, longitude)
    : undefined;
}

export function getPresetSections(
  level: DetailLevel,
  formattersInput?: Partial<PhotoDetailsFormatters>,
): DetailSection[] {
  const formatters = createFormatters(formattersInput);
  if (level === "minimum" || level === "custom") return [];

  const information: DetailSection[] = [
    {
      id: "information",
      fields: [
        {
          id: "captured",
          label: "Captured",
          getValue: ({ metadata }) =>
            metadata.capturedAt ?? metadata.captureDate,
          format: (value) =>
            formatters.date(value as string | Date),
        },
        { id: "location", label: "Location", path: "location.name" },
      ],
    },
  ];

  if (level === "information") return information;

  return [
    ...information,
    {
      id: "story",
      title: "Story",
      fields: [
        {
          id: "story",
          label: "Field notes",
          getValue: ({ metadata }) =>
            metadata.story ?? metadata.description,
        },
      ],
    },
    {
      id: "capture",
      title: "Capture",
      fields: [
        {
          id: "coordinates",
          label: "Coordinates",
          getValue: ({ metadata }) => coordinates(metadata, formatters),
        },
        { id: "altitude", label: "Altitude", path: "location.altitude" },
      ],
    },
    {
      id: "equipment",
      title: "Equipment",
      fields: [
        {
          id: "camera",
          label: "Camera",
          getValue: ({ metadata }) =>
            joined(metadata.camera?.make, metadata.camera?.model),
        },
        {
          id: "lens",
          label: "Lens",
          getValue: ({ metadata }) =>
            typeof metadata.lens === "string"
              ? metadata.lens
              : joined(metadata.lens?.make, metadata.lens?.model),
        },
      ],
    },
    {
      id: "exposure",
      title: "Exposure",
      fields: [
        {
          id: "aperture",
          label: "Aperture",
          path: "exposure.aperture",
          format: (value) =>
            formatters.aperture(value as number | string),
        },
        {
          id: "shutter",
          label: "Shutter",
          path: "exposure.shutterSpeed",
          format: (value) =>
            formatters.shutterSpeed(value as number | string),
        },
        { id: "iso", label: "ISO", path: "exposure.iso" },
        {
          id: "focal-length",
          label: "Focal length",
          path: "exposure.focalLength",
          format: (value) =>
            formatters.focalLength(value as number | string),
        },
        {
          id: "compensation",
          label: "Exposure compensation",
          path: "exposure.exposureCompensation",
        },
        {
          id: "metering",
          label: "Metering",
          path: "exposure.meteringMode",
        },
        { id: "flash", label: "Flash", path: "exposure.flash" },
      ],
    },
    {
      id: "file",
      title: "File",
      fields: [
        { id: "filename", label: "Filename", path: "file.name" },
        {
          id: "dimensions",
          label: "Dimensions",
          getValue: ({ metadata }) => dimensions(metadata),
        },
        {
          id: "size",
          label: "File size",
          path: "file.size",
          format: (value) => formatters.fileSize(value as number),
        },
        {
          id: "type",
          label: "File type",
          getValue: ({ metadata }) =>
            metadata.file?.mimeType ?? metadata.file?.type,
        },
        { id: "color", label: "Color space", path: "file.colorSpace" },
      ],
    },
    {
      id: "rights",
      title: "Creator & rights",
      fields: [
        {
          id: "creator",
          label: "Creator",
          getValue: ({ metadata }) =>
            typeof metadata.creator === "string"
              ? metadata.creator
              : metadata.creator?.name,
        },
        { id: "credit", label: "Credit", path: "credit" },
        { id: "copyright", label: "Copyright", path: "copyright" },
        {
          id: "license",
          label: "License",
          getValue: ({ metadata }) =>
            typeof metadata.license === "string"
              ? metadata.license
              : metadata.license?.name,
        },
        { id: "usage", label: "Usage", path: "usageTerms" },
        { id: "keywords", label: "Keywords", path: "keywords" },
      ],
    },
  ];
}

function getPathValue(metadata: PhotoMetadata, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (typeof value !== "object" || value === null) return undefined;
    return (value as Record<string, unknown>)[key];
  }, metadata);
}

function isEmpty(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

export function resolveDetailSections(
  sections: DetailSection[],
  context: DetailFieldContext,
  formatterOverrides?: Partial<PhotoDetailsFormatters>,
): ResolvedDetailSection[] {
  const formatters = createFormatters(formatterOverrides);

  return sections.flatMap((section) => {
    const sectionHidden =
      typeof section.hidden === "function"
        ? section.hidden(context)
        : section.hidden;
    if (sectionHidden) return [];

    const fields = section.fields.flatMap((field) => {
      const fieldHidden =
        typeof field.hidden === "function"
          ? field.hidden(context)
          : field.hidden;
      if (fieldHidden) return [];

      const rawValue = field.getValue?.(context) ??
        (field.path ? getPathValue(context.metadata, field.path) : undefined);
      if (isEmpty(rawValue)) return [];

      const value =
        field.format?.(rawValue, context) ?? formatters.value(rawValue);
      if (isEmpty(value)) return [];

      return [{ id: field.id, label: field.label, value: value as ReactNode }];
    });

    if (!fields.length) return [];
    return [
      {
        id: section.id,
        ...(section.title ? { title: section.title } : {}),
        fields,
      },
    ];
  });
}
