import type { ForwardedRef, ReactNode } from "react";
import type {
  LightboxExternalProps,
  Plugin,
  Slide,
  SlideImage,
} from "yet-another-react-lightbox";

export type DetailLevel = "minimum" | "information" | "detailed" | "custom";

export type PhotoDetailsTheme = "dark" | "light" | "system";

export interface PhotoShareData {
  url?: string;
  text?: string;
  title?: string;
}

export interface PhotoViewerActionLabels {
  detailLevelMenu: string;
  /** @deprecated The three-dot control no longer opens an intermediate menu. */
  detailLevelMenuTitle: string;
  hideDetails: string;
  share: string;
  shareCopied: string;
  shareSucceeded: string;
  shareUnavailable: string;
  showDetails: string;
}

export interface PhotoViewerActions {
  /**
   * Show the Share control. It uses the Web Share API when available and
   * otherwise copies the resolved URL.
   *
   * @default true
   */
  share?: boolean;
  /**
   * Enable the wrapper's built-in Yet Another React Lightbox Zoom plugin.
   *
   * @default true
   */
  zoom?: boolean;
  /**
   * Show the three-dot toolbar button that directly toggles photo details.
   *
   * @default true
   */
  detailLevelMenu?: boolean;
  /** Override labels and feedback used by the viewer action controls. */
  labels?: Partial<PhotoViewerActionLabels>;
}

export type PhotoViewerActionsSettings = boolean | PhotoViewerActions;

export interface PhotoDetailsZoomRef {
  zoom: number;
  maxZoom: number;
  offsetX: number;
  offsetY: number;
  disabled: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  changeZoom: (
    targetZoom: number,
    rapid?: boolean,
    dx?: number,
    dy?: number,
  ) => void;
}

export interface PhotoDetailsZoomSettings {
  ref?: ForwardedRef<PhotoDetailsZoomRef>;
  maxZoomPixelRatio?: number;
  zoomInMultiplier?: number;
  /** @deprecated Supported for compatibility with older YARL releases. */
  doubleTapDelay?: number;
  /** @deprecated Supported for compatibility with older YARL releases. */
  doubleClickDelay?: number;
  doubleClickMaxStops?: number;
  keyboardMoveDistance?: number;
  wheelZoomDistanceFactor?: number;
  /** @deprecated Supported for compatibility with older YARL releases. */
  pinchZoomDistanceFactor?: number;
  scrollToZoom?: boolean;
}

export type PhotoDetailsLightboxLabels = LightboxExternalProps["labels"] & {
  "Zoom in"?: string;
  "Zoom out"?: string;
};

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

export interface RgbHistogramData {
  red: readonly number[];
  green: readonly number[];
  blue: readonly number[];
}

export interface PhotoHistogramOptions {
  /**
   * Analyze the active browser image when no valid precomputed histogram is
   * available.
   *
   * @default true
   */
  autoGenerate?: boolean;
  /**
   * Longest edge, in pixels, used for browser-side sampling.
   *
   * @default 512
   */
  maxDimension?: number;
  /**
   * Detail levels in which the histogram is visible.
   *
   * @default ["detailed"]
   */
  levels?: readonly Exclude<DetailLevel, "minimum">[];
}

export type PhotoHistogramStatus = "loading" | "ready" | "unavailable";

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
  onClose: () => void;
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
  buttonRef: ForwardedRef<HTMLButtonElement>;
  onClick: () => void;
}

export interface PhotoDetailsHistogramRenderProps {
  status: PhotoHistogramStatus;
  data?: RgbHistogramData;
  slide: SlideImage;
  canRetry: boolean;
  retry: () => void;
  children: ReactNode;
}

export interface PhotoDetailsRenderSlots {
  panel?: (props: PhotoDetailsPanelRenderProps) => ReactNode;
  section?: (props: PhotoDetailsSectionRenderProps) => ReactNode;
  field?: (props: PhotoDetailsFieldRenderProps) => ReactNode;
  histogram?: (props: PhotoDetailsHistogramRenderProps) => ReactNode;
  toolbarButton?: (props: PhotoDetailsToolbarButtonRenderProps) => ReactNode;
  empty?: (props: { level: DetailLevel; slide?: Slide }) => ReactNode;
}

export interface PhotoDetailsSettings {
  detailLevel?: DetailLevel;
  defaultDetailLevel?: DetailLevel;
  onDetailLevelChange?: (level: DetailLevel) => void;
  /**
   * Control whether the photo-details drawer is open.
   *
   * When omitted, the drawer manages its own open state and starts closed.
   */
  detailsOpen?: boolean;
  /**
   * Initial open state for an uncontrolled photo-details drawer.
   *
   * @default false
   */
  defaultDetailsOpen?: boolean;
  onDetailsOpenChange?: (open: boolean) => void;
  allowDetailLevelChange?: boolean;
  customSections?: DetailSection[];
  renderDetails?: PhotoDetailsRenderSlots;
  formatters?: Partial<PhotoDetailsFormatters>;
  theme?: PhotoDetailsTheme;
  /** @deprecated Use `detailLabels` for new wrapper integrations. */
  labels?: Partial<Record<DetailLevel, string>>;
  detailLabels?: Partial<Record<DetailLevel, string>>;
  histogram?: boolean | PhotoHistogramOptions;
  viewerActions?: PhotoViewerActionsSettings;
}

export interface PhotoDetailsPluginProps {
  photoDetails?: PhotoDetailsSettings;
}

export type PhotoSlide = SlideImage & {
  photoMetadata?: PhotoMetadata;
  photoHistogram?: RgbHistogramData;
  photoHistogramSrc?: string;
  share?: boolean | string | PhotoShareData;
};

export type PhotoDetailsLightboxProps = Omit<
  LightboxExternalProps,
  "labels" | "plugins" | "zoom"
> &
  PhotoDetailsSettings & {
    plugins?: Plugin[];
    /** Settings forwarded to the automatically installed Zoom plugin. */
    zoom?: PhotoDetailsZoomSettings;
    /** Labels forwarded to Yet Another React Lightbox controls. */
    lightboxLabels?: PhotoDetailsLightboxLabels;
  };

declare module "yet-another-react-lightbox" {
  interface SlideImage {
    photoMetadata?: PhotoMetadata;
    photoHistogram?: RgbHistogramData;
    photoHistogramSrc?: string;
    share?: boolean | string | PhotoShareData;
  }

  interface LightboxProps {
    photoDetails?: PhotoDetailsSettings;
  }

  interface ToolbarButtonKeys {
    "photo-details": null;
    "photo-share": null;
  }
}
