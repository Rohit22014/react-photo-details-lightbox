"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SlideImage } from "yet-another-react-lightbox";
import {
  analyzeImageHistogram,
  selectHistogramSource,
  validateRgbHistogramData,
} from "./histogram";
import type { PhotoHistogramStatus, RgbHistogramData } from "./types";

const DEFAULT_MAX_DIMENSION = 512;
const MIN_MAX_DIMENSION = 32;
const MAX_MAX_DIMENSION = 2048;
const CACHE_LIMIT = 20;

interface HistogramState {
  key?: string;
  status: PhotoHistogramStatus;
  data?: RgbHistogramData;
}

interface UseRgbHistogramOptions {
  slide?: SlideImage;
  enabled: boolean;
  autoGenerate: boolean;
  maxDimension?: number;
}

function resolveMaxDimension(value?: number) {
  if (value === undefined || !Number.isFinite(value)) {
    return DEFAULT_MAX_DIMENSION;
  }

  return Math.min(
    MAX_MAX_DIMENSION,
    Math.max(MIN_MAX_DIMENSION, Math.round(value)),
  );
}

function rememberResult(
  cache: Map<string, RgbHistogramData>,
  key: string,
  data: RgbHistogramData,
) {
  cache.delete(key);
  cache.set(key, data);

  if (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
}

export function useRgbHistogram({
  slide,
  enabled,
  autoGenerate,
  maxDimension: requestedMaxDimension,
}: UseRgbHistogramOptions) {
  const maxDimension = resolveMaxDimension(requestedMaxDimension);
  const providedData =
    slide && validateRgbHistogramData(slide.photoHistogram)
      ? slide.photoHistogram
      : undefined;
  const source = useMemo(
    () =>
      slide && autoGenerate
        ? selectHistogramSource(slide, maxDimension)
        : undefined,
    [autoGenerate, maxDimension, slide],
  );
  const key = source ? `${maxDimension}:${source}` : undefined;
  const cache = useRef(new Map<string, RgbHistogramData>());
  const requestVersion = useRef(0);
  const [retryVersion, setRetryVersion] = useState(0);
  const [state, setState] = useState<HistogramState>({
    status: "loading",
  });

  useEffect(() => {
    requestVersion.current += 1;
    const version = requestVersion.current;

    if (!enabled || providedData) return;

    if (!source || !key) return;

    const cached = cache.current.get(key);
    if (cached) {
      cache.current.delete(key);
      cache.current.set(key, cached);
      queueMicrotask(() => {
        if (requestVersion.current === version) {
          setState({ key, status: "ready", data: cached });
        }
      });
      return;
    }

    const controller = new AbortController();

    void analyzeImageHistogram(source, maxDimension, controller.signal).then(
      (data) => {
        if (controller.signal.aborted || requestVersion.current !== version) {
          return;
        }
        rememberResult(cache.current, key, data);
        setState({ key, status: "ready", data });
      },
      (error: unknown) => {
        if (
          controller.signal.aborted ||
          requestVersion.current !== version ||
          (typeof error === "object" &&
            error !== null &&
            "name" in error &&
            error.name === "AbortError")
        ) {
          return;
        }
        setState({ key, status: "unavailable" });
      },
    );

    return () => controller.abort();
  }, [enabled, key, maxDimension, providedData, retryVersion, source]);

  const retry = useCallback(() => {
    if (key) cache.current.delete(key);
    setState(key ? { key, status: "loading" } : { status: "unavailable" });
    setRetryVersion((value) => value + 1);
  }, [key]);

  if (providedData) {
    return {
      canRetry: false,
      data: providedData,
      retry,
      status: "ready" as const,
    };
  }

  const currentState =
    key && state.key === key
      ? state
      : {
          status:
            enabled && source ? ("loading" as const) : ("unavailable" as const),
        };

  return {
    canRetry: Boolean(autoGenerate && source),
    ...(currentState.data ? { data: currentState.data } : {}),
    retry,
    status: currentState.status,
  };
}
