"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { useLightboxProps } from "yet-another-react-lightbox";
import type {
  DetailLevel,
  PhotoDetailsSettings,
  PhotoDetailsTheme,
} from "./types";

const levelNames: Record<DetailLevel, string> = {
  minimum: "Minimum",
  information: "Information",
  detailed: "Detailed",
  custom: "Custom",
};

const defaultSettings: PhotoDetailsSettings = {};

interface PhotoDetailsContextValue {
  level: DetailLevel;
  setLevel: (level: DetailLevel) => void;
  toggleDetails: () => void;
  settings: PhotoDetailsSettings;
  availableLevels: DetailLevel[];
  labels: Record<DetailLevel, string>;
  theme: PhotoDetailsTheme;
}

const PhotoDetailsContext = createContext<PhotoDetailsContextValue | null>(
  null,
);

export function PhotoDetailsProvider({ children }: PropsWithChildren) {
  const { photoDetails } = useLightboxProps();
  const settings = photoDetails ?? defaultSettings;
  const [internalLevel, setInternalLevel] = useState<DetailLevel>(
    settings.defaultDetailLevel ?? "information",
  );
  const lastVisibleLevel = useRef<Exclude<DetailLevel, "minimum">>(
    settings.defaultDetailLevel && settings.defaultDetailLevel !== "minimum"
      ? settings.defaultDetailLevel
      : "information",
  );

  const availableLevels = useMemo<DetailLevel[]>(
    () => [
      "minimum",
      "information",
      "detailed",
      ...(settings.customSections?.length ? (["custom"] as const) : []),
    ],
    [settings.customSections],
  );

  const requestedLevel = settings.detailLevel ?? internalLevel;
  const level = availableLevels.includes(requestedLevel)
    ? requestedLevel
    : "detailed";

  const setLevel = useCallback(
    (nextLevel: DetailLevel) => {
      if (!availableLevels.includes(nextLevel)) return;
      if (nextLevel !== "minimum") lastVisibleLevel.current = nextLevel;
      setInternalLevel(nextLevel);
      settings.onDetailLevelChange?.(nextLevel);
    },
    [availableLevels, settings],
  );

  const toggleDetails = useCallback(() => {
    setLevel(level === "minimum" ? lastVisibleLevel.current : "minimum");
  }, [level, setLevel]);

  const labels = useMemo(
    () => ({ ...levelNames, ...settings.labels }),
    [settings.labels],
  );

  const value = useMemo<PhotoDetailsContextValue>(
    () => ({
      level,
      setLevel,
      toggleDetails,
      settings,
      availableLevels,
      labels,
      theme: settings.theme ?? "dark",
    }),
    [availableLevels, labels, level, setLevel, settings, toggleDetails],
  );

  return (
    <PhotoDetailsContext.Provider value={value}>
      {children}
    </PhotoDetailsContext.Provider>
  );
}

export function usePhotoDetails() {
  const value = useContext(PhotoDetailsContext);
  if (!value) {
    throw new Error(
      "Photo Details components must be rendered inside the PhotoDetails plugin.",
    );
  }
  return value;
}
