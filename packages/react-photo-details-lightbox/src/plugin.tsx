"use client";

import {
  addToolbarButton,
  createModule,
  MODULE_CONTROLLER,
  type ComponentProps,
  type Plugin,
  type ToolbarSettings,
} from "yet-another-react-lightbox";
import { PhotoDetailsPanel } from "./components";
import { PhotoDetailsProvider } from "./context";
import {
  PhotoDetailsToolbarControl,
  PhotoShareButton,
} from "./toolbar-actions";
import type { PhotoDetailsSettings } from "./types";
import { resolveViewerActions } from "./viewer-actions";

function ProviderModule({ children }: ComponentProps) {
  return <PhotoDetailsProvider>{children}</PhotoDetailsProvider>;
}

function PanelModule() {
  return <PhotoDetailsPanel />;
}

const PhotoDetailsProviderModule = createModule(
  "PhotoDetailsProvider",
  ProviderModule,
);
const PhotoDetailsPanelModule = createModule("PhotoDetailsPanel", PanelModule);

function removeToolbarButton(toolbar: ToolbarSettings, key: string) {
  return {
    ...toolbar,
    buttons: toolbar.buttons.filter((button) => button !== key),
  };
}

export const PhotoDetails: Plugin = ({ addChild, addParent, augment }) => {
  addParent(MODULE_CONTROLLER, PhotoDetailsProviderModule);
  addChild(MODULE_CONTROLLER, PhotoDetailsPanelModule);

  augment(({ toolbar, photoDetails, className, ...restProps }) => {
    const resolvedPhotoDetails: PhotoDetailsSettings = {
      defaultDetailLevel: "information",
      allowDetailLevelChange: true,
      theme: "dark",
      ...photoDetails,
    };
    const actions = resolveViewerActions(resolvedPhotoDetails.viewerActions);
    const detailsToolbar = addToolbarButton(
      toolbar,
      "photo-details",
      <PhotoDetailsToolbarControl />,
    );
    const actionsToolbar = actions.share
      ? addToolbarButton(detailsToolbar, "photo-share", <PhotoShareButton />)
      : removeToolbarButton(detailsToolbar, "photo-share");

    return {
      ...restProps,
      className: [className, "rpdl"].filter(Boolean).join(" "),
      photoDetails: resolvedPhotoDetails,
      toolbar: actionsToolbar,
    };
  });
};
