import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PhotoDetailsLightbox } from "./lightbox";
import type { RgbHistogramData } from "./types";

const histogramChannel = (peak: number) =>
  Array.from({ length: 256 }, (_, index) => (index === peak ? 100 : 0));

const photoHistogram: RgbHistogramData = {
  red: histogramChannel(48),
  green: histogramChannel(128),
  blue: histogramChannel(208),
};

const slides = [
  {
    src: "/photo.jpg",
    width: 1600,
    height: 1000,
    alt: "Sunlight across a mountain ridge",
    photoMetadata: {
      title: "Ridge light",
      caption: "One quiet minute before the weather arrived.",
      camera: { make: "Leica", model: "SL2-S" },
      exposure: { aperture: 5.6, shutterSpeed: "1/500", iso: 320 },
    },
  },
];

describe("PhotoDetailsLightbox", () => {
  it("mounts its provider, inspector, and toolbar as a YARL plugin", async () => {
    render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        slides={slides}
        defaultDetailLevel="detailed"
      />,
    );

    expect(await screen.findByTestId("metadata-inspector")).toHaveTextContent(
      "Ridge light",
    );
    expect(screen.getByTestId("metadata-inspector")).toHaveTextContent(
      "Leica SL2-S",
    );
    expect(
      screen.getByRole("region", { name: "Photo metadata" }),
    ).toHaveAttribute("tabindex", "0");
    expect(screen.getByTestId("photo-details-toggle")).toBeInTheDocument();
    expect(
      screen.queryByRole("figure", { name: "RGB histogram" }),
    ).not.toBeInTheDocument();
  });

  it("lets the viewer hide and restore the details", async () => {
    render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        slides={slides}
        defaultDetailLevel="information"
      />,
    );

    const selector = await screen.findByTestId("photo-detail-level-select");
    fireEvent.change(selector, { target: { value: "minimum" } });

    await waitFor(() =>
      expect(
        screen.queryByTestId("metadata-inspector"),
      ).not.toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("photo-details-toggle"));
    expect(await screen.findByTestId("metadata-inspector")).toBeInTheDocument();
  });

  it("removes collapsed mobile details from focus and the accessibility tree", async () => {
    render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        slides={[{ ...slides[0]!, photoHistogram }]}
        defaultDetailLevel="detailed"
        histogram
      />,
    );

    const body = await screen.findByRole("region", { name: "Photo metadata" });
    fireEvent.click(
      screen.getByRole("button", { name: "Collapse photo details" }),
    );

    expect(body).toHaveAttribute("inert");
    expect(body).toHaveAttribute("aria-hidden", "true");
    expect(body).toHaveAttribute("tabindex", "-1");

    fireEvent.click(
      screen.getByRole("button", { name: "Expand photo details" }),
    );
    expect(body).not.toHaveAttribute("inert");
    expect(body).not.toHaveAttribute("aria-hidden");
    expect(body).toHaveAttribute("tabindex", "0");
  });

  it("renders supplied histogram data only after an application opts in", async () => {
    render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        slides={[{ src: "/histogram-only.jpg", photoHistogram }]}
        defaultDetailLevel="detailed"
        histogram
      />,
    );

    expect(
      await screen.findByRole("figure", { name: "RGB histogram" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("rgb-histogram-graph")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "No photo information has been supplied for this frame.",
      ),
    ).not.toBeInTheDocument();
  });

  it("keeps the default histogram out of information mode", async () => {
    render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        slides={[{ ...slides[0]!, photoHistogram }]}
        defaultDetailLevel="information"
        histogram
      />,
    );

    expect(await screen.findByTestId("metadata-inspector")).toBeInTheDocument();
    expect(
      screen.queryByRole("figure", { name: "RGB histogram" }),
    ).not.toBeInTheDocument();
  });

  it("exposes ready data and default content through the histogram render slot", async () => {
    const histogramSlot = vi.fn(
      ({ children }: { children: React.ReactNode }) => (
        <div data-testid="custom-histogram">{children}</div>
      ),
    );

    render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        slides={[{ ...slides[0]!, photoHistogram }]}
        defaultDetailLevel="detailed"
        histogram
        renderDetails={{ histogram: histogramSlot }}
      />,
    );

    expect(await screen.findByTestId("custom-histogram")).toBeInTheDocument();
    expect(histogramSlot).toHaveBeenCalledWith(
      expect.objectContaining({
        data: photoHistogram,
        status: "ready",
        slide: expect.objectContaining({ src: "/photo.jpg" }),
        retry: expect.any(Function),
      }),
    );
  });

  it("shows a non-retryable unavailable state when automatic generation is disabled without bins", async () => {
    render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        slides={slides}
        defaultDetailLevel="detailed"
        histogram={{ autoGenerate: false }}
      />,
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Histogram unavailable for this image.",
    );
    expect(
      screen.queryByRole("button", { name: "Retry histogram" }),
    ).not.toBeInTheDocument();
  });
});
