import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import Lightbox from "yet-another-react-lightbox";
import Share from "yet-another-react-lightbox/plugins/share";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PhotoDetailsLightbox } from "./lightbox";
import { PhotoDetails } from "./plugin";
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

afterEach(() => {
  for (const property of ["canShare", "clipboard", "share"] as const) {
    Object.defineProperty(window.navigator, property, {
      configurable: true,
      value: undefined,
    });
  }
});

describe("PhotoDetailsLightbox", () => {
  it("mounts its inspector with Share, Zoom, detail menu, and Close controls", async () => {
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
    const toolbar = document.querySelector(".yarl__toolbar");
    expect(toolbar).not.toBeNull();
    expect(
      within(toolbar as HTMLElement).getByRole("button", {
        name: "Share photo",
      }),
    ).toBeInTheDocument();
    expect(
      within(toolbar as HTMLElement).getByRole("button", { name: "Zoom in" }),
    ).toBeInTheDocument();
    expect(
      within(toolbar as HTMLElement).getByRole("button", { name: "Zoom out" }),
    ).toBeInTheDocument();
    expect(
      within(toolbar as HTMLElement).getByRole("button", {
        name: "Choose photo detail level",
      }),
    ).toBeInTheDocument();
    expect(
      within(toolbar as HTMLElement).getByRole("button", { name: "Close" }),
    ).toBeInTheDocument();
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

    const menuButton = screen.getByTestId("photo-details-menu-button");
    fireEvent.click(menuButton);
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Information" }));
    expect(await screen.findByTestId("metadata-inspector")).toBeInTheDocument();
  });

  it("supports keyboard and pointer interaction in the detail-level menu", async () => {
    const onDetailLevelChange = vi.fn();
    render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        slides={[
          ...slides,
          {
            ...slides[0]!,
            src: "/second-photo.jpg",
            photoMetadata: {
              ...slides[0]!.photoMetadata,
              title: "Second photograph",
            },
          },
        ]}
        customSections={[
          {
            id: "custom-notes",
            title: "Custom notes",
            fields: [{ id: "title", label: "Title", path: "title" }],
          },
        ]}
        defaultDetailLevel="detailed"
        onDetailLevelChange={onDetailLevelChange}
      />,
    );

    const trigger = await screen.findByTestId("photo-details-menu-button");
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);

    const menu = screen.getByRole("menu", {
      name: "Choose photo detail level",
    });
    const detailed = within(menu).getByRole("menuitemradio", {
      name: "Detailed",
    });
    const custom = within(menu).getByRole("menuitemradio", { name: "Custom" });
    expect(within(menu).getAllByRole("menuitemradio")).toHaveLength(4);
    expect(detailed).toHaveAttribute("aria-checked", "true");
    expect(detailed).toHaveAttribute("tabindex", "0");
    expect(custom).toHaveAttribute("tabindex", "-1");
    expect(detailed).toHaveFocus();

    fireEvent.keyDown(detailed, { key: "ArrowRight" });
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(detailed).toHaveFocus();
    expect(screen.getByTestId("metadata-inspector")).toHaveTextContent(
      "Ridge light",
    );

    fireEvent.keyDown(detailed, { key: "ArrowDown" });
    expect(custom).toHaveFocus();
    expect(custom).toHaveAttribute("tabindex", "0");
    expect(detailed).toHaveAttribute("tabindex", "-1");
    fireEvent.keyDown(custom, { key: "Home" });
    expect(
      screen.getByRole("menuitemradio", { name: "Minimum" }),
    ).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("menuitemradio", { name: "Minimum" }), {
      key: "End",
    });
    expect(custom).toHaveFocus();
    fireEvent.keyDown(custom, { key: "Tab" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();

    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole("menuitemradio", { name: "Detailed" }), {
      key: "Tab",
      shiftKey: true,
    });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByTestId("photo-share-button")).toHaveFocus();

    fireEvent.click(trigger);
    const reopenedCustom = screen.getByRole("menuitemradio", {
      name: "Custom",
    });
    fireEvent.keyDown(screen.getByRole("menuitemradio", { name: "Detailed" }), {
      key: "ArrowDown",
    });
    expect(reopenedCustom).toHaveFocus();
    fireEvent.click(reopenedCustom);
    expect(onDetailLevelChange).toHaveBeenLastCalledWith("custom");
    expect(screen.getByTestId("metadata-inspector")).toHaveTextContent(
      "Custom notes",
    );
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole("menuitemradio", { name: "Custom" }), {
      key: "Escape",
    });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByTestId("photo-details-menu-button")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("keeps detail labels separate from localized lightbox and action labels", async () => {
    render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        slides={slides}
        defaultDetailLevel="detailed"
        detailLabels={{ detailed: "Technical" }}
        lightboxLabels={{
          Close: "Dismiss viewer",
          "Zoom in": "Magnify photograph",
          "Zoom out": "Reduce photograph",
        }}
        viewerActions={{
          labels: {
            detailLevelMenu: "Choose metadata view",
            detailLevelMenuTitle: "Metadata view",
            share: "Send photograph",
          },
        }}
      />,
    );

    expect(
      await screen.findByRole("button", { name: "Send photograph" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Magnify photograph" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reduce photograph" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Dismiss viewer" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Choose metadata view" }),
    );
    const menu = screen.getByRole("menu", { name: "Choose metadata view" });
    expect(within(menu).getByText("Metadata view")).toBeInTheDocument();
    expect(
      within(menu).getByRole("menuitemradio", { name: "Technical" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("uses the simple details toggle when level changes are disabled", async () => {
    render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        slides={slides}
        allowDetailLevelChange={false}
        defaultDetailLevel="information"
        viewerActions={{
          labels: {
            hideDetails: "Hide metadata",
            showDetails: "Show metadata",
          },
        }}
      />,
    );

    const toggle = await screen.findByRole("button", {
      name: "Hide metadata",
    });
    expect(
      screen.queryByTestId("photo-details-menu-button"),
    ).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.queryByTestId("metadata-inspector")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show metadata" }));
    expect(await screen.findByTestId("metadata-inspector")).toBeInTheDocument();
  });

  it("shares through the native sheet and falls back to copying a link", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    Object.defineProperties(window.navigator, {
      canShare: { configurable: true, value: canShare },
      share: { configurable: true, value: share },
    });

    const { unmount } = render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        slides={[
          {
            ...slides[0]!,
            share: {
              title: "Ridge permalink",
              url: "/photographs/ridge",
            },
          },
        ]}
        defaultDetailLevel="information"
      />,
    );

    fireEvent.click(await screen.findByTestId("photo-share-button"));
    await waitFor(() =>
      expect(share).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Ridge permalink",
          url: "http://localhost:3000/photographs/ridge",
        }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByTestId("photo-share-status")).toHaveTextContent(
        "Photo shared.",
      ),
    );
    unmount();

    Object.defineProperties(window.navigator, {
      canShare: { configurable: true, value: undefined },
      share: { configurable: true, value: undefined },
    });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        slides={slides}
        defaultDetailLevel="information"
      />,
    );
    fireEvent.click(await screen.findByTestId("photo-share-button"));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(window.location.href),
    );
    await waitFor(() =>
      expect(screen.getByTestId("photo-share-status")).toHaveTextContent(
        "Photo link copied.",
      ),
    );
  });

  it("allows default viewer actions to be disabled and avoids duplicate Zoom plugins", async () => {
    const { unmount } = render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        slides={slides}
        defaultDetailLevel="information"
        viewerActions={false}
      />,
    );

    expect(
      await screen.findByTestId("photo-details-toggle"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("photo-share-button")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Zoom in" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("photo-details-menu-button"),
    ).not.toBeInTheDocument();
    unmount();

    const deduplicatedZoom = render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        plugins={[Zoom]}
        slides={slides}
        defaultDetailLevel="information"
      />,
    );
    expect(
      await screen.findAllByRole("button", { name: "Zoom in" }),
    ).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Zoom out" })).toHaveLength(1);
    deduplicatedZoom.unmount();

    render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        plugins={[Zoom]}
        slides={slides}
        defaultDetailLevel="information"
        viewerActions={{ zoom: false }}
      />,
    );
    expect(
      await screen.findAllByRole("button", { name: "Zoom in" }),
    ).toHaveLength(1);
  });

  it("can defer to YARL's official Share plugin without duplicate controls", async () => {
    Object.defineProperties(window.navigator, {
      canShare: { configurable: true, value: vi.fn().mockReturnValue(true) },
      share: {
        configurable: true,
        value: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        plugins={[Share]}
        slides={slides}
        defaultDetailLevel="information"
        viewerActions={{ share: false }}
      />,
    );

    expect(await screen.findByRole("button", { name: "Share" })).toBeVisible();
    expect(screen.getAllByRole("button", { name: /share/i })).toHaveLength(1);
    expect(screen.queryByTestId("photo-share-button")).not.toBeInTheDocument();
  });

  it("removes inactive reserved keys from custom wrapper and plugin toolbars", async () => {
    const wrapper = render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        slides={slides}
        defaultDetailLevel="information"
        toolbar={{
          buttons: ["photo-share", "zoom", "photo-details", "close"],
        }}
        viewerActions={false}
      />,
    );

    let toolbar = document.querySelector(".yarl__toolbar");
    expect(toolbar).not.toBeNull();
    expect(within(toolbar as HTMLElement).getAllByRole("button")).toHaveLength(
      2,
    );
    expect(toolbar).not.toHaveTextContent("photo-share");
    expect(toolbar).not.toHaveTextContent("zoom");
    wrapper.unmount();

    render(
      <Lightbox
        open
        close={vi.fn()}
        plugins={[PhotoDetails]}
        slides={slides}
        photoDetails={{ viewerActions: false }}
        toolbar={{ buttons: ["photo-share", "photo-details", "close"] }}
      />,
    );

    toolbar = document.querySelector(".yarl__toolbar");
    expect(toolbar).not.toBeNull();
    expect(toolbar).not.toHaveTextContent("photo-share");
    expect(within(toolbar as HTMLElement).getAllByRole("button")).toHaveLength(
      2,
    );
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

    expect(
      await screen.findAllByText("Histogram unavailable for this image."),
    ).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: "Retry histogram" }),
    ).not.toBeInTheDocument();
  });
});
