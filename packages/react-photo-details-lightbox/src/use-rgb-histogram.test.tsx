import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SlideImage } from "yet-another-react-lightbox";
import type { RgbHistogramData } from "./types";

const analyzeImageHistogram = vi.hoisted(() => vi.fn());

vi.mock("./histogram", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./histogram")>();
  return {
    ...actual,
    analyzeImageHistogram,
  };
});

import { useRgbHistogram } from "./use-rgb-histogram";

function histogram(redPeak: number): RgbHistogramData {
  const channel = (peak: number) =>
    Array.from({ length: 256 }, (_, index) => (index === peak ? 10 : 0));

  return {
    red: channel(redPeak),
    green: channel(128),
    blue: channel(192),
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

function HistogramHarness({
  slide,
  enabled = true,
  autoGenerate = true,
}: {
  slide: SlideImage;
  enabled?: boolean;
  autoGenerate?: boolean;
}) {
  const result = useRgbHistogram({
    slide,
    enabled,
    autoGenerate,
  });

  return (
    <div>
      <span data-testid="status">{result.status}</span>
      <span data-testid="red-peak">
        {result.data?.red.findIndex((value) => value > 0) ?? "none"}
      </span>
      <button type="button" onClick={result.retry}>
        Retry
      </button>
    </div>
  );
}

describe("useRgbHistogram", () => {
  beforeEach(() => {
    analyzeImageHistogram.mockReset();
  });

  it("uses valid precomputed bins without fetching the image", () => {
    render(
      <HistogramHarness
        slide={{ src: "/photo.jpg", photoHistogram: histogram(42) }}
      />,
    );

    expect(screen.getByTestId("status")).toHaveTextContent("ready");
    expect(screen.getByTestId("red-peak")).toHaveTextContent("42");
    expect(analyzeImageHistogram).not.toHaveBeenCalled();
  });

  it("analyzes the dedicated histogram source with bounded defaults", async () => {
    analyzeImageHistogram.mockResolvedValueOnce(histogram(64));

    render(
      <HistogramHarness
        slide={{
          src: "/photo.jpg",
          photoHistogramSrc: "/photo-histogram.jpg",
        }}
      />,
    );

    expect(screen.getByTestId("status")).toHaveTextContent("loading");
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("ready"),
    );
    expect(screen.getByTestId("red-peak")).toHaveTextContent("64");
    expect(analyzeImageHistogram).toHaveBeenCalledWith(
      "/photo-histogram.jpg",
      512,
      expect.any(AbortSignal),
    );
  });

  it("discards a late result after navigating to another slide", async () => {
    const first = deferred<RgbHistogramData>();
    const second = deferred<RgbHistogramData>();
    analyzeImageHistogram
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { rerender } = render(
      <HistogramHarness slide={{ src: "/first.jpg" }} />,
    );
    rerender(<HistogramHarness slide={{ src: "/second.jpg" }} />);

    await act(async () => first.resolve(histogram(10)));
    expect(screen.getByTestId("status")).toHaveTextContent("loading");
    expect(screen.getByTestId("red-peak")).toHaveTextContent("none");

    await act(async () => second.resolve(histogram(220)));
    expect(screen.getByTestId("status")).toHaveTextContent("ready");
    expect(screen.getByTestId("red-peak")).toHaveTextContent("220");
  });

  it("reuses successful analysis when a visible level is restored", async () => {
    analyzeImageHistogram.mockResolvedValueOnce(histogram(96));
    const slide = { src: "/cached.jpg" };

    const { rerender } = render(<HistogramHarness slide={slide} />);
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("ready"),
    );

    rerender(<HistogramHarness slide={slide} enabled={false} />);
    rerender(<HistogramHarness slide={slide} enabled />);

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("ready"),
    );
    expect(analyzeImageHistogram).toHaveBeenCalledTimes(1);
  });

  it("aborts active analysis on unmount and retries failures", async () => {
    const signals: AbortSignal[] = [];
    const failed = deferred<RgbHistogramData>();
    analyzeImageHistogram.mockImplementationOnce(
      (_source: string, _maxDimension: number, requestSignal: AbortSignal) => {
        signals.push(requestSignal);
        return failed.promise;
      },
    );

    const { unmount } = render(
      <HistogramHarness slide={{ src: "/failure.jpg" }} />,
    );
    await act(async () => failed.reject(new Error("CORS blocked")));
    expect(screen.getByTestId("status")).toHaveTextContent("unavailable");

    const retried = deferred<RgbHistogramData>();
    analyzeImageHistogram.mockImplementationOnce(
      (_source: string, _maxDimension: number, requestSignal: AbortSignal) => {
        signals.push(requestSignal);
        return retried.promise;
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(analyzeImageHistogram).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId("status")).toHaveTextContent("loading");

    unmount();
    expect(signals).toHaveLength(2);
    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(true);
  });
});
