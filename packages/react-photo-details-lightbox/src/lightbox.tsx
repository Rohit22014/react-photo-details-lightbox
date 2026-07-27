"use client";

import Lightbox from "yet-another-react-lightbox";
import { PhotoDetails } from "./plugin";
import type {
  PhotoDetailsLightboxProps,
  PhotoDetailsSettings,
} from "./types";

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
  plugins,
  ...lightboxProps
}: PhotoDetailsLightboxProps) {
  const photoDetails: PhotoDetailsSettings = {
    ...(detailLevel !== undefined ? { detailLevel } : {}),
    ...(defaultDetailLevel !== undefined ? { defaultDetailLevel } : {}),
    ...(onDetailLevelChange !== undefined ? { onDetailLevelChange } : {}),
    ...(allowDetailLevelChange !== undefined
      ? { allowDetailLevelChange }
      : {}),
    ...(customSections !== undefined ? { customSections } : {}),
    ...(renderDetails !== undefined ? { renderDetails } : {}),
    ...(formatters !== undefined ? { formatters } : {}),
    ...(theme !== undefined ? { theme } : {}),
    ...(labels !== undefined ? { labels } : {}),
  };

  return (
    <Lightbox
      {...lightboxProps}
      plugins={
        plugins?.includes(PhotoDetails)
          ? plugins
          : [...(plugins ?? []), PhotoDetails]
      }
      photoDetails={photoDetails}
    />
  );
}
