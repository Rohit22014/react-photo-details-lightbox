"use client";

import Lightbox from "yet-another-react-lightbox";
import type {
  LightboxExternalProps,
  ToolbarButtonKey,
} from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import { PhotoDetails } from "./plugin";
import type { PhotoDetailsLightboxProps, PhotoDetailsSettings } from "./types";
import { resolveViewerActions } from "./viewer-actions";

export function PhotoDetailsLightbox({
  detailLevel,
  defaultDetailLevel,
  onDetailLevelChange,
  allowDetailLevelChange,
  customSections,
  renderDetails,
  formatters,
  theme,
  labels,
  detailLabels,
  histogram,
  viewerActions,
  lightboxLabels,
  plugins,
  toolbar,
  zoom,
  ...lightboxProps
}: PhotoDetailsLightboxProps) {
  const photoDetails: PhotoDetailsSettings = {
    ...(detailLevel !== undefined ? { detailLevel } : {}),
    ...(defaultDetailLevel !== undefined ? { defaultDetailLevel } : {}),
    ...(onDetailLevelChange !== undefined ? { onDetailLevelChange } : {}),
    ...(allowDetailLevelChange !== undefined ? { allowDetailLevelChange } : {}),
    ...(customSections !== undefined ? { customSections } : {}),
    ...(renderDetails !== undefined ? { renderDetails } : {}),
    ...(formatters !== undefined ? { formatters } : {}),
    ...(theme !== undefined ? { theme } : {}),
    ...(labels !== undefined ? { labels } : {}),
    ...(detailLabels !== undefined ? { detailLabels } : {}),
    ...(histogram !== undefined ? { histogram } : {}),
    ...(viewerActions !== undefined ? { viewerActions } : {}),
  };
  const actions = resolveViewerActions(viewerActions);
  const withPhotoDetails = plugins?.includes(PhotoDetails)
    ? [...plugins]
    : [...(plugins ?? []), PhotoDetails];
  const resolvedPlugins =
    actions.zoom && !withPhotoDetails.includes(Zoom)
      ? [...withPhotoDetails, Zoom]
      : withPhotoDetails;
  const zoomEnabled = actions.zoom || withPhotoDetails.includes(Zoom);
  const defaultToolbarButtons: ToolbarButtonKey[] = [
    ...(actions.share ? (["photo-share"] as const) : []),
    ...(zoomEnabled ? (["zoom"] as const) : []),
    "photo-details",
    "close",
  ];
  const resolvedToolbar =
    toolbar?.buttons !== undefined
      ? {
          ...toolbar,
          buttons: toolbar.buttons.filter(
            (button) =>
              (actions.share || button !== "photo-share") &&
              (zoomEnabled || button !== "zoom"),
          ),
        }
      : { ...toolbar, buttons: defaultToolbarButtons };

  return (
    <Lightbox
      {...lightboxProps}
      {...(lightboxLabels !== undefined ? { labels: lightboxLabels } : {})}
      {...(zoom !== undefined
        ? { zoom: zoom as NonNullable<LightboxExternalProps["zoom"]> }
        : {})}
      plugins={resolvedPlugins}
      photoDetails={photoDetails}
      toolbar={resolvedToolbar}
    />
  );
}
