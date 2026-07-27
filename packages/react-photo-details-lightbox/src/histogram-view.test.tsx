import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RgbHistogramView } from "./histogram-view";
import type { RgbHistogramData } from "./types";

function makeChannel(
  peak: number,
  { clipped = false }: { clipped?: boolean } = {},
) {
  return Array.from({ length: 256 }, (_, index) => {
    if (clipped && (index === 0 || index === 255)) return 12;
    return index === peak ? 100 : 0;
  });
}

const histogram: RgbHistogramData = {
  red: makeChannel(48, { clipped: true }),
  green: makeChannel(128),
  blue: makeChannel(208),
};

describe("RgbHistogramView", () => {
  it("renders a fixed loading state with a polite announcement", () => {
    const { container } = render(
      <RgbHistogramView status="loading" onRetry={vi.fn()} />,
    );

    expect(
      screen.getByRole("figure", { name: "RGB histogram" }),
    ).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Calculating RGB histogram.",
    );
    expect(
      container.querySelector(".rpdl__histogram-skeleton"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("rgb-histogram-graph")).not.toBeInTheDocument();
  });

  it("renders a retryable unavailable state", () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <RgbHistogramView status="unavailable" onRetry={onRetry} />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Histogram unavailable for this image.",
    );
    const retry = screen.getByRole("button", { name: "Retry histogram" });
    retry.focus();
    fireEvent.click(retry);
    expect(onRetry).toHaveBeenCalledOnce();

    rerender(<RgbHistogramView status="loading" onRetry={onRetry} />);
    expect(screen.getByRole("figure", { name: "RGB histogram" })).toHaveFocus();
  });

  it("renders the normalized RGB graph, tonal labels, and clipping markers", () => {
    const { container } = render(
      <RgbHistogramView data={histogram} status="ready" onRetry={vi.fn()} />,
    );

    expect(screen.getByTestId("rgb-histogram-graph")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "RGB histogram ready.",
    );
    expect(container.querySelectorAll(".rpdl__histogram-path")).toHaveLength(3);
    expect(
      container.querySelectorAll(".rpdl__histogram-grid path"),
    ).toHaveLength(6);
    expect(screen.getByText("Shadows")).toBeInTheDocument();
    expect(screen.getByText("Highlights")).toBeInTheDocument();
    expect(
      container.querySelectorAll(".rpdl__histogram-clip-marker"),
    ).toHaveLength(2);
  });

  it("offers pressed channel controls and preserves the selection across data changes", () => {
    const { container, rerender } = render(
      <RgbHistogramView data={histogram} status="ready" onRetry={vi.fn()} />,
    );
    const all = screen.getByRole("button", { name: "All channels" });
    const red = screen.getByRole("button", { name: "Red channel" });

    expect(
      screen.getByRole("group", { name: "Histogram channels" }),
    ).toBeInTheDocument();
    expect(all).toHaveAttribute("aria-pressed", "true");
    expect(red).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(red);

    expect(all).toHaveAttribute("aria-pressed", "false");
    expect(red).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelectorAll(".rpdl__histogram-path")).toHaveLength(1);
    expect(
      container.querySelector(".rpdl__histogram-path--red"),
    ).toBeInTheDocument();

    rerender(
      <RgbHistogramView
        data={{ ...histogram, red: makeChannel(72) }}
        status="ready"
        onRetry={vi.fn()}
      />,
    );

    expect(red).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelectorAll(".rpdl__histogram-path")).toHaveLength(1);
  });

  it("describes every channel in an accessible figcaption", () => {
    const { container } = render(
      <RgbHistogramView data={histogram} status="ready" onRetry={vi.fn()} />,
    );
    const figure = screen.getByRole("figure", { name: "RGB histogram" });
    const caption = container.querySelector("figcaption");

    expect(caption).toHaveClass("rpdl__sr-only");
    expect(caption).toHaveTextContent(
      /Red channel: .+ Green channel: .+ Blue channel: .+/,
    );
    expect(figure).toHaveAttribute("aria-describedby", caption?.id);
  });
});
