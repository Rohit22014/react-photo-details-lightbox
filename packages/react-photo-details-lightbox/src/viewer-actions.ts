import type {
  PhotoViewerActionLabels,
  PhotoViewerActionsSettings,
} from "./types";

export const defaultViewerActionLabels: PhotoViewerActionLabels = {
  detailLevelMenu: "Choose photo detail level",
  detailLevelMenuTitle: "Photo details",
  hideDetails: "Hide photo details",
  share: "Share photo",
  shareCopied: "Photo link copied.",
  shareSucceeded: "Photo shared.",
  shareUnavailable: "Sharing is unavailable.",
  showDetails: "Photo details",
};

export interface ResolvedViewerActions {
  detailLevelMenu: boolean;
  labels: PhotoViewerActionLabels;
  share: boolean;
  zoom: boolean;
}

export function resolveViewerActions(
  settings?: PhotoViewerActionsSettings,
): ResolvedViewerActions {
  if (settings === false) {
    return {
      detailLevelMenu: false,
      labels: defaultViewerActionLabels,
      share: false,
      zoom: false,
    };
  }

  const options = settings === true || settings === undefined ? {} : settings;

  return {
    detailLevelMenu: options.detailLevelMenu ?? true,
    labels: { ...defaultViewerActionLabels, ...options.labels },
    share: options.share ?? true,
    zoom: options.zoom ?? true,
  };
}
