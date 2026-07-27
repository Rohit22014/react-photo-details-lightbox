import type { PhotoMetadata } from "./types";

export type ExifSource = string | ArrayBuffer | Blob;

export class ExifExtractionError extends Error {
  override name = "ExifExtractionError";

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export function isExifSourceSupported(source: unknown): source is ExifSource {
  if (typeof source === "string" || source instanceof ArrayBuffer) return true;
  return typeof Blob !== "undefined" && source instanceof Blob;
}

function definedObject<T extends Record<string, unknown>>(value: T) {
  const entries = Object.entries(value).filter(
    ([, entry]) => entry !== undefined && entry !== null && entry !== "",
  );
  return entries.length ? Object.fromEntries(entries) : undefined;
}

function dateValue(value: unknown) {
  return value instanceof Date || typeof value === "string" ? value : undefined;
}

function numeric(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function extractPhotoMetadata(
  source: ExifSource,
): Promise<PhotoMetadata> {
  if (!isExifSourceSupported(source)) {
    throw new ExifExtractionError(
      "Unsupported EXIF source. Use a File, Blob, ArrayBuffer, or URL string.",
    );
  }

  try {
    const { parse } = await import("exifr");
    const data = (await parse(source, {
      tiff: true,
      exif: true,
      gps: true,
      iptc: true,
      xmp: true,
      reviveValues: true,
      translateValues: true,
      mergeOutput: true,
    })) as Record<string, unknown> | undefined;

    if (!data) return {};

    const latitude = numeric(data.latitude) ?? numeric(data.GPSLatitude);
    const longitude = numeric(data.longitude) ?? numeric(data.GPSLongitude);
    const creator =
      text(data.Artist) ?? text(data.Creator) ?? text(data.Byline);
    const capturedAt =
      dateValue(data.DateTimeOriginal) ??
      dateValue(data.CreateDate) ??
      dateValue(data.DateCreated);

    const camera = definedObject({
      make: text(data.Make),
      model: text(data.Model),
      serialNumber: text(data.SerialNumber) ?? text(data.BodySerialNumber),
      firmware: text(data.Firmware),
    }) as PhotoMetadata["camera"];
    const lens = definedObject({
      make: text(data.LensMake),
      model: text(data.LensModel) ?? text(data.Lens),
      serialNumber: text(data.LensSerialNumber),
    }) as PhotoMetadata["lens"];
    const exposure = definedObject({
      aperture: numeric(data.FNumber) ?? text(data.ApertureValue),
      shutterSpeed:
        numeric(data.ExposureTime) ?? text(data.ShutterSpeedValue),
      iso: numeric(data.ISO),
      focalLength: numeric(data.FocalLength),
      focalLength35mm: numeric(data.FocalLengthIn35mmFormat),
      exposureCompensation:
        numeric(data.ExposureCompensation) ?? text(data.ExposureBiasValue),
      exposureMode: text(data.ExposureMode),
      meteringMode: text(data.MeteringMode),
      flash:
        typeof data.Flash === "boolean" || typeof data.Flash === "string"
          ? data.Flash
          : undefined,
      whiteBalance: text(data.WhiteBalance),
    }) as PhotoMetadata["exposure"];
    const location = definedObject({
      name:
        text(data.Location) ??
        text(data.Sublocation) ??
        text(data.City) ??
        text(data.Country),
      city: text(data.City),
      region: text(data.State) ?? text(data.ProvinceState),
      country: text(data.Country) ?? text(data.CountryPrimaryLocationName),
      latitude,
      longitude,
      altitude: numeric(data.GPSAltitude),
    }) as PhotoMetadata["location"];
    const file = definedObject({
      width: numeric(data.ExifImageWidth) ?? numeric(data.ImageWidth),
      height: numeric(data.ExifImageHeight) ?? numeric(data.ImageHeight),
      colorSpace: text(data.ColorSpace),
      orientation: text(data.Orientation),
      software: text(data.Software),
    }) as PhotoMetadata["file"];
    const title = text(data.ObjectName) ?? text(data.Title);
    const caption =
      text(data.Caption) ??
      text(data.CaptionAbstract) ??
      text(data.Description);

    return {
      ...(title ? { title } : {}),
      ...(caption ? { caption } : {}),
      ...(capturedAt ? { capturedAt } : {}),
      ...(camera ? { camera } : {}),
      ...(lens ? { lens } : {}),
      ...(exposure ? { exposure } : {}),
      ...(location ? { location } : {}),
      ...(file ? { file } : {}),
      ...(creator ? { creator } : {}),
      ...(text(data.Copyright)
        ? { copyright: text(data.Copyright)! }
        : {}),
      ...(Array.isArray(data.Keywords)
        ? {
            keywords: data.Keywords.filter(
              (keyword): keyword is string => typeof keyword === "string",
            ),
          }
        : {}),
    };
  } catch (error) {
    if (error instanceof ExifExtractionError) throw error;
    throw new ExifExtractionError("Unable to extract photo metadata.", {
      cause: error,
    });
  }
}

export type { PhotoMetadata } from "./types";
