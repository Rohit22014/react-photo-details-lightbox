"use client";

import {
  addToolbarButton,
  createModule,
  MODULE_CONTROLLER,
  type ComponentProps,
  type Plugin,
} from "yet-another-react-lightbox";
import { PhotoDetailsPanel, PhotoDetailsButton } from "./components";
import { PhotoDetailsProvider } from "./context";

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

export const PhotoDetails: Plugin = ({ addChild, addParent, augment }) => {
  addParent(MODULE_CONTROLLER, PhotoDetailsProviderModule);
  addChild(MODULE_CONTROLLER, PhotoDetailsPanelModule);

  augment(({ toolbar, photoDetails, className, ...restProps }) => ({
    ...restProps,
    className: [className, "rpdl"].filter(Boolean).join(" "),
    photoDetails: {
      defaultDetailLevel: "information",
      allowDetailLevelChange: true,
      theme: "dark",
      ...photoDetails,
    },
    toolbar: addToolbarButton(toolbar, "photo-details", <PhotoDetailsButton />),
  }));
};
