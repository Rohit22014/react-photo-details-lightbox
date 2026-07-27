"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createHistogramPath, summarizeRgbHistogram } from "./histogram";
import type { RgbHistogramData } from "./types";

type HistogramChannel = "all" | "red" | "green" | "blue";

export interface RgbHistogramViewProps {
  data?: RgbHistogramData;
  status: "loading" | "ready" | "unavailable";
  canRetry?: boolean;
  onRetry: () => void;
}

const channels = [
  { id: "all", label: "All channels", shortLabel: "All" },
  { id: "red", label: "Red channel", shortLabel: "R" },
  { id: "green", label: "Green channel", shortLabel: "G" },
  { id: "blue", label: "Blue channel", shortLabel: "B" },
] as const;

const colorChannels = ["red", "green", "blue"] as const;

function getMaximumValue(data: RgbHistogramData) {
  let maximum = 0;

  for (const channel of colorChannels) {
    for (const value of data[channel]) {
      if (Number.isFinite(value)) maximum = Math.max(maximum, value);
    }
  }

  return maximum;
}

function HistogramSkeleton() {
  return (
    <div className="rpdl__histogram-state rpdl__histogram-state--loading">
      <div aria-hidden="true" className="rpdl__histogram-skeleton">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <span className="rpdl__histogram-state-label">
        Calculating histogram…
      </span>
    </div>
  );
}

function HistogramUnavailable({
  canRetry,
  onRetry,
}: {
  canRetry: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="rpdl__histogram-state rpdl__histogram-state--unavailable">
      <p>Histogram unavailable for this image.</p>
      {canRetry ? (
        <button
          className="rpdl__histogram-retry"
          type="button"
          onClick={onRetry}
        >
          Retry histogram
        </button>
      ) : null}
    </div>
  );
}

export function RgbHistogramView({
  data,
  status,
  canRetry = true,
  onRetry,
}: RgbHistogramViewProps) {
  const [activeChannel, setActiveChannel] = useState<HistogramChannel>("all");
  const figureRef = useRef<HTMLElement>(null);
  const previousStatus = useRef(status);
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const graphId = `${generatedId}-graph`;
  const summaryId = `${generatedId}-summary`;
  const maximum = useMemo(() => (data ? getMaximumValue(data) : 0), [data]);
  const summary = useMemo(
    () => (data ? summarizeRgbHistogram(data) : undefined),
    [data],
  );
  const visibleChannels =
    activeChannel === "all" ? colorChannels : [activeChannel];
  const ready = status === "ready" && data;
  const resolvedStatus = status === "ready" && !data ? "unavailable" : status;
  const statusMessage =
    resolvedStatus === "loading"
      ? "Calculating RGB histogram."
      : resolvedStatus === "ready"
        ? "RGB histogram ready."
        : "Histogram unavailable for this image.";

  useEffect(() => {
    if (
      previousStatus.current === "unavailable" &&
      resolvedStatus === "loading"
    ) {
      figureRef.current?.focus();
    }
    previousStatus.current = resolvedStatus;
  }, [resolvedStatus]);

  return (
    <figure
      ref={figureRef}
      aria-busy={status === "loading"}
      aria-describedby={ready ? summaryId : undefined}
      aria-labelledby={titleId}
      className="rpdl__histogram"
      data-status={resolvedStatus}
      tabIndex={-1}
    >
      <span
        aria-atomic="true"
        aria-live="polite"
        className="rpdl__sr-only"
        role="status"
      >
        {statusMessage}
      </span>
      <div className="rpdl__histogram-header">
        <h3 id={titleId}>RGB histogram</h3>
        {ready ? (
          <div
            aria-label="Histogram channels"
            className="rpdl__histogram-channels"
            role="group"
          >
            {channels.map((channel) => (
              <button
                aria-controls={graphId}
                aria-label={channel.label}
                aria-pressed={activeChannel === channel.id}
                className="rpdl__histogram-channel"
                data-channel={channel.id}
                key={channel.id}
                type="button"
                onClick={() => setActiveChannel(channel.id)}
              >
                {channel.shortLabel}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {status === "loading" ? <HistogramSkeleton /> : null}
      {status === "unavailable" || (status === "ready" && !data) ? (
        <HistogramUnavailable canRetry={canRetry} onRetry={onRetry} />
      ) : null}

      {ready ? (
        <>
          <div className="rpdl__histogram-plot">
            <svg
              aria-hidden="true"
              className="rpdl__histogram-graph"
              data-testid="rgb-histogram-graph"
              focusable="false"
              id={graphId}
              preserveAspectRatio="none"
              viewBox="0 0 255 100"
            >
              <g className="rpdl__histogram-grid">
                <path d="M0 25H255" />
                <path d="M0 50H255" />
                <path d="M0 75H255" />
                <path d="M64 0V100" />
                <path d="M128 0V100" />
                <path d="M191 0V100" />
              </g>

              {visibleChannels.map((channel) => (
                <path
                  className={`rpdl__histogram-path rpdl__histogram-path--${channel}`}
                  d={createHistogramPath(data[channel], maximum)}
                  data-channel={channel}
                  key={channel}
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              {visibleChannels.flatMap((channel, channelIndex) => {
                const markers = [];
                const markerY = 94 + channelIndex * 2;

                if ((data[channel][0] ?? 0) > 0) {
                  markers.push(
                    <circle
                      className={`rpdl__histogram-clip-marker rpdl__histogram-clip-marker--${channel}`}
                      cx="2"
                      cy={markerY}
                      data-channel={channel}
                      data-side="shadows"
                      key={`${channel}-shadows`}
                      r="2"
                      vectorEffect="non-scaling-stroke"
                    />,
                  );
                }

                if ((data[channel][255] ?? 0) > 0) {
                  markers.push(
                    <circle
                      className={`rpdl__histogram-clip-marker rpdl__histogram-clip-marker--${channel}`}
                      cx="253"
                      cy={markerY}
                      data-channel={channel}
                      data-side="highlights"
                      key={`${channel}-highlights`}
                      r="2"
                      vectorEffect="non-scaling-stroke"
                    />,
                  );
                }

                return markers;
              })}
            </svg>
            <div aria-hidden="true" className="rpdl__histogram-axis-labels">
              <span>Shadows</span>
              <span>Highlights</span>
            </div>
          </div>
          <figcaption className="rpdl__sr-only" id={summaryId}>
            {summary?.red} {summary?.green} {summary?.blue}
          </figcaption>
        </>
      ) : null}
    </figure>
  );
}
