import type { ReactNode } from "react";
import type {
  LightboxExternalProps,
  Plugin,
  Slide,
  SlideImage,
} from "yet-another-react-lightbox";

export type DetailLevel = "minimum" | "information" | "detailed" | "custom";

export type PhotoDetailsTheme = "dark" | "light" | "system";

export interface PhotoLocation {
  name?: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
}

export interface CameraMetadata {
  make?: string;
  model?: string;
  serialNumber?: string;
  firmware?: string;
}

export interface LensMetadata {
  make?: string;
  model?: string;
  serialNumber?: string;
}

export interface ExposureMetadata {
  aperture?: number | string;
  shutterSpeed?: number | string;
  iso?: number;
  focalLength?: number | string;
  focalLength35mm?: number | string;
  exposureCompensation?: number | string;
  exposureMode?: string;
  meteringMode?: string;
  flash?: string | boolean;
  whiteBalance?: string;
}

export interface FileMetadata {
  name?: string;
  type?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  size?: number;
  colorSpace?: string;
  orientation?: string;
  software?: string;
}

export interface CreatorMetadata {
  name?: string;
  website?: string;
  email?: string;
}

export interface LicenseMetadata {
  name?: string;
  url?: string;
}

export interface PhotoMetadata {
  title?: string;
  caption?: string;
  story?: string;
  description?: string;
  capturedAt?: string | Date;
  /** Alias for `capturedAt`, useful when mapping existing catalog data. */
  captureDate?: string | Date;
  location?: PhotoLocation;
  camera?: CameraMetadata;
  lens?: LensMetadata | string;
  exposure?: ExposureMetadata;
  file?: FileMetadata;
  creator?: CreatorMetadata | string;
  copyright?: string;
  license?: LicenseMetadata | string;
  usageTerms?: string;
  credit?: string;
  keywords?: string[];
  rating?: number;
  [key: string]: unknown;
}

export interface DetailFieldContext {
  metadata: PhotoMetadata;
  slide: Slide;
  level: DetailLevel;
}

export interface DetailField {
  id: string;
  label: string;
  path?: string;
  getValue?: (context: DetailFieldContext) => unknown;
  format?: (value: unknown, context: DetailFieldContext) => ReactNode;
  hidden?: boolean | ((context: DetailFieldContext) => boolean);
}

export interface DetailSection {
  id: string;
  title?: string;
  fields: DetailField[];
  hidden?: boolean | ((context: DetailFieldContext) => boolean);
}

export interface ResolvedDetailField {
  id: string;
  label: string;
  value: ReactNode;
}

export interface ResolvedDetailSection {
  id: string;
  title?: string;
  fields: ResolvedDetailField[];
}

export interface PhotoDetailsFormatters {
  date: (value: string | Date) => string;
  coordinates: (latitude: number, longitude: number) => string;
  fileSize: (bytes: number) => string;
  aperture: (value: number | string) => string;
  shutterSpeed: (value: number | string) => string;
  focalLength: (value: number | string) => string;
  value: (value: unknown) => ReactNode;
}

export interface PhotoDetailsPanelRenderProps {
  level: DetailLevel;
  metadata?: PhotoMetadata;
  slide?: Slide;
  sections: ResolvedDetailSection[];
  children: ReactNode;
}

export interface PhotoDetailsSectionRenderProps {
  section: ResolvedDetailSection;
  children: ReactNode;
}

export interface PhotoDetailsFieldRenderProps {
  field: ResolvedDetailField;
}

export interface PhotoDetailsToolbarButtonRenderProps {
  level: DetailLevel;
  expanded: boolean;
  label: string;
  onClick: () => void;
}

export interface PhotoDetailsRenderSlots {
  panel?: (props: PhotoDetailsPanelRenderProps) => ReactNode;
  section?: (props: PhotoDetailsSectionRenderProps) => ReactNode;
  field?: (props: PhotoDetailsFieldRenderProps) => ReactNode;
  toolbarButton?: (props: PhotoDetailsToolbarButtonRenderProps) => ReactNode;
  empty?: (props: { level: DetailLevel; slide?: Slide }) => ReactNode;
}

export interface PhotoDetailsSettings {
  detailLevel?: DetailLevel;
  defaultDetailLevel?: DetailLevel;
  onDetailLevelChange?: (level: DetailLevel) => void;
  allowDetailLevelChange?: boolean;
  customSections?: DetailSection[];
  renderDetails?: PhotoDetailsRenderSlots;
  formatters?: Partial<PhotoDetailsFormatters>;
  theme?: PhotoDetailsTheme;
  labels?: Partial<Record<DetailLevel, string>>;
}

export interface PhotoDetailsPluginProps {
  photoDetails?: PhotoDetailsSettings;
}

export type PhotoSlide = SlideImage & {
  photoMetadata?: PhotoMetadata;
};

export type PhotoDetailsLightboxProps = Omit<LightboxExternalProps, "plugins"> &
  PhotoDetailsSettings & {
    plugins?: Plugin[];
  };

declare module "yet-another-react-lightbox" {
  interface SlideImage {
    photoMetadata?: PhotoMetadata;
  }

  interface LightboxProps {
    photoDetails?: PhotoDetailsSettings;
  }

  interface ToolbarButtonKeys {
    "photo-details": null;
  }
}
