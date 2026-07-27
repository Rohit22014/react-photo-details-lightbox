import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PhotoDetailsLightbox } from "./lightbox";

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
      expect(screen.queryByTestId("metadata-inspector")).not.toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("photo-details-toggle"));
    expect(await screen.findByTestId("metadata-inspector")).toBeInTheDocument();
  });
});
