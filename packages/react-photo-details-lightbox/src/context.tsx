"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
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
  closeDetails: () => void;
  detailsTriggerRef: MutableRefObject<HTMLButtonElement | null>;
  detailsOpen: boolean;
  level: DetailLevel;
  openDetails: () => void;
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
  const [internalDetailsOpen, setInternalDetailsOpen] = useState(
    settings.defaultDetailsOpen ?? false,
  );
  const detailsTriggerRef = useRef<HTMLButtonElement | null>(null);
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
  const detailsOpen = settings.detailsOpen ?? internalDetailsOpen;
  const onDetailLevelChange = settings.onDetailLevelChange;
  const onDetailsOpenChange = settings.onDetailsOpenChange;

  const setDetailsOpen = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen === detailsOpen) return;
      setInternalDetailsOpen(nextOpen);
      onDetailsOpenChange?.(nextOpen);
    },
    [detailsOpen, onDetailsOpenChange],
  );

  const setLevel = useCallback(
    (nextLevel: DetailLevel) => {
      if (!availableLevels.includes(nextLevel)) return;
      if (nextLevel !== "minimum") lastVisibleLevel.current = nextLevel;
      else setDetailsOpen(false);
      setInternalLevel(nextLevel);
      onDetailLevelChange?.(nextLevel);
    },
    [availableLevels, onDetailLevelChange, setDetailsOpen],
  );

  const closeDetails = useCallback(
    () => setDetailsOpen(false),
    [setDetailsOpen],
  );

  const openDetails = useCallback(() => setDetailsOpen(true), [setDetailsOpen]);

  const toggleDetails = useCallback(() => {
    if (detailsOpen) {
      closeDetails();
      return;
    }

    if (level === "minimum") setLevel(lastVisibleLevel.current);
    openDetails();
  }, [closeDetails, detailsOpen, level, openDetails, setLevel]);

  useEffect(() => {
    if (level !== "minimum") lastVisibleLevel.current = level;
  }, [level]);

  const labels = useMemo(
    () => ({
      ...levelNames,
      ...settings.labels,
      ...settings.detailLabels,
    }),
    [settings.detailLabels, settings.labels],
  );

  const value = useMemo<PhotoDetailsContextValue>(
    () => ({
      closeDetails,
      detailsTriggerRef,
      detailsOpen,
      level,
      openDetails,
      setLevel,
      toggleDetails,
      settings,
      availableLevels,
      labels,
      theme: settings.theme ?? "dark",
    }),
    [
      availableLevels,
      closeDetails,
      detailsTriggerRef,
      detailsOpen,
      labels,
      level,
      openDetails,
      setLevel,
      settings,
      toggleDetails,
    ],
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
