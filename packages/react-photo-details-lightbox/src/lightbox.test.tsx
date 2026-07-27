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

const originalMatchMedia = window.matchMedia;

async function openDetails() {
  const trigger = await screen.findByTestId("photo-details-button");
  fireEvent.click(trigger);
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  return screen.findByTestId("metadata-inspector");
}

afterEach(() => {
  for (const property of ["canShare", "clipboard", "share"] as const) {
    Object.defineProperty(window.navigator, property, {
      configurable: true,
      value: undefined,
    });
  }
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: originalMatchMedia,
  });
});

describe("PhotoDetailsLightbox", () => {
  it("opens photo information directly from the three-dot button", async () => {
    render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        slides={slides}
        defaultDetailLevel="detailed"
      />,
    );

    expect(screen.queryByTestId("metadata-inspector")).not.toBeInTheDocument();
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
        name: "Photo information",
      }),
    ).toBeInTheDocument();
    expect(
      within(toolbar as HTMLElement).getByRole("button", { name: "Close" }),
    ).toBeInTheDocument();

    const inspector = await openDetails();
    const trigger = screen.getByTestId("photo-details-button");
    expect(trigger).not.toHaveAttribute("aria-haspopup");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(inspector).toHaveTextContent("Ridge light");
    expect(inspector).toHaveTextContent("Leica SL2-S");
    expect(
      screen.getByRole("region", { name: "Photo metadata" }),
    ).toHaveAttribute("tabindex", "0");
    expect(
      screen.queryByRole("figure", { name: "RGB histogram" }),
    ).not.toBeInTheDocument();
  });

  it("restores Information and opens directly from Minimum", async () => {
    const onDetailLevelChange = vi.fn();
    render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        slides={slides}
        defaultDetailLevel="minimum"
        onDetailLevelChange={onDetailLevelChange}
      />,
    );

    const trigger = await screen.findByTestId("photo-details-button");
    fireEvent.click(trigger);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(await screen.findByTestId("metadata-inspector")).toBeInTheDocument();
    expect(screen.getByTestId("photo-detail-level-select")).toHaveValue(
      "information",
    );
    expect(onDetailLevelChange).toHaveBeenCalledWith("information");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("lets the viewer close and restore the selected details", async () => {
    render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        slides={slides}
        defaultDetailLevel="information"
      />,
    );

    fireEvent.click(await screen.findByTestId("photo-details-button"));
    const closeDetails = screen.getByRole("button", {
      name: "Close photo details",
    });
    fireEvent.click(closeDetails);

    const detailsButton = screen.getByTestId("photo-details-button");
    await waitFor(() => expect(detailsButton).toHaveFocus());
    expect(screen.queryByTestId("metadata-inspector")).not.toBeInTheDocument();
    fireEvent.click(detailsButton);
    expect(await screen.findByTestId("metadata-inspector")).toBeInTheDocument();
  });

  it("supports controlled details visibility", async () => {
    const onDetailsOpenChange = vi.fn();
    const { rerender } = render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        detailsOpen={false}
        onDetailsOpenChange={onDetailsOpenChange}
        slides={slides}
        defaultDetailLevel="information"
      />,
    );

    fireEvent.click(await screen.findByTestId("photo-details-button"));
    expect(onDetailsOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.queryByTestId("metadata-inspector")).not.toBeInTheDocument();

    rerender(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        detailsOpen
        onDetailsOpenChange={onDetailsOpenChange}
        slides={slides}
        defaultDetailLevel="information"
      />,
    );
    expect(await screen.findByTestId("metadata-inspector")).toBeInTheDocument();

    const panelClose = screen.getByRole("button", {
      name: "Close photo details",
    });
    fireEvent.click(panelClose);
    expect(onDetailsOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByTestId("metadata-inspector")).toBeInTheDocument();
    await waitFor(() => expect(panelClose).toHaveFocus());

    rerender(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        detailsOpen={false}
        onDetailsOpenChange={onDetailsOpenChange}
        slides={slides}
        defaultDetailLevel="information"
      />,
    );
    expect(screen.queryByTestId("metadata-inspector")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId("photo-details-button")).toHaveFocus(),
    );
  });

  it("requests a controlled close when Minimum is selected", async () => {
    const onDetailLevelChange = vi.fn();
    const onDetailsOpenChange = vi.fn();
    const { rerender } = render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        detailLevel="detailed"
        detailsOpen
        onDetailLevelChange={onDetailLevelChange}
        onDetailsOpenChange={onDetailsOpenChange}
        slides={slides}
      />,
    );

    const selector = await screen.findByTestId("photo-detail-level-select");
    selector.focus();
    fireEvent.change(selector, { target: { value: "minimum" } });
    expect(onDetailLevelChange).toHaveBeenLastCalledWith("minimum");
    expect(onDetailsOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByTestId("metadata-inspector")).toBeInTheDocument();
    expect(selector).toHaveFocus();

    rerender(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        detailLevel="minimum"
        detailsOpen={false}
        onDetailLevelChange={onDetailLevelChange}
        onDetailsOpenChange={onDetailsOpenChange}
        slides={slides}
      />,
    );
    expect(screen.queryByTestId("metadata-inspector")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId("photo-details-button")).toHaveFocus(),
    );
  });

  it("reflects controlled visibility without firing a mount callback", async () => {
    const onDetailsOpenChange = vi.fn();
    render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        detailsOpen
        onDetailsOpenChange={onDetailsOpenChange}
        slides={slides}
        defaultDetailLevel="detailed"
      />,
    );

    expect(onDetailsOpenChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("photo-details-button")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByTestId("metadata-inspector")).toBeInTheDocument();
  });

  it("restores the latest externally controlled non-minimum level", async () => {
    const onDetailLevelChange = vi.fn();
    const onDetailsOpenChange = vi.fn();
    const { rerender } = render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        allowDetailLevelChange={false}
        detailLevel="detailed"
        detailsOpen={false}
        onDetailLevelChange={onDetailLevelChange}
        onDetailsOpenChange={onDetailsOpenChange}
        slides={slides}
      />,
    );

    rerender(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        allowDetailLevelChange={false}
        detailLevel="minimum"
        detailsOpen={false}
        onDetailLevelChange={onDetailLevelChange}
        onDetailsOpenChange={onDetailsOpenChange}
        slides={slides}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Photo details" }));

    expect(onDetailLevelChange).toHaveBeenLastCalledWith("detailed");
    expect(onDetailsOpenChange).toHaveBeenLastCalledWith(true);
  });

  it("starts closed again when the lightbox is reopened", async () => {
    const close = vi.fn();
    const { rerender } = render(
      <PhotoDetailsLightbox
        open
        close={close}
        slides={slides}
        defaultDetailLevel="detailed"
      />,
    );

    await openDetails();
    rerender(
      <PhotoDetailsLightbox
        open={false}
        close={close}
        slides={slides}
        defaultDetailLevel="detailed"
      />,
    );
    rerender(
      <PhotoDetailsLightbox
        open
        close={close}
        slides={slides}
        defaultDetailLevel="detailed"
      />,
    );

    expect(screen.queryByTestId("metadata-inspector")).not.toBeInTheDocument();
  });

  it("opens the selected level directly and changes levels inside the panel", async () => {
    const onDetailLevelChange = vi.fn();
    render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        slides={slides}
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

    const trigger = await screen.findByTestId("photo-details-button");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).not.toHaveAttribute("aria-haspopup");
    fireEvent.click(trigger);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(await screen.findByTestId("metadata-inspector")).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Close photo details" }),
      ).toHaveFocus(),
    );

    const selector = screen.getByTestId("photo-detail-level-select");
    expect(selector).toHaveValue("detailed");
    fireEvent.change(selector, {
      target: { value: "custom" },
    });
    expect(onDetailLevelChange).toHaveBeenLastCalledWith("custom");
    expect(screen.getByTestId("metadata-inspector")).toHaveTextContent(
      "Custom notes",
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
            detailLevelMenu: "Open metadata",
            hideDetails: "Hide metadata",
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

    fireEvent.click(screen.getByRole("button", { name: "Open metadata" }));
    expect(await screen.findByTestId("metadata-inspector")).toBeInTheDocument();
    expect(screen.getByTestId("photo-detail-level-select")).toHaveValue(
      "detailed",
    );
    expect(
      screen.getByRole("option", { name: "Technical" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Hide metadata" }),
    ).toBeInTheDocument();
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
      name: "Show metadata",
    });
    expect(
      screen.queryByTestId("photo-details-button"),
    ).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(await screen.findByTestId("metadata-inspector")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hide metadata" }));
    expect(screen.queryByTestId("metadata-inspector")).not.toBeInTheDocument();
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
      screen.queryByTestId("photo-details-button"),
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

  it("closes details before the lightbox on Escape and restores toolbar focus", async () => {
    const close = vi.fn();
    render(
      <PhotoDetailsLightbox
        open
        close={close}
        slides={[{ ...slides[0]!, photoHistogram }]}
        defaultDetailLevel="detailed"
        histogram
      />,
    );

    expect(screen.queryByTestId("metadata-inspector")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("figure", { name: "RGB histogram" }),
    ).not.toBeInTheDocument();
    await openDetails();
    const panelClose = screen.getByRole("button", {
      name: "Close photo details",
    });
    await waitFor(() => expect(panelClose).toHaveFocus());
    fireEvent.keyDown(panelClose, { key: "Escape" });

    await waitFor(() =>
      expect(
        screen.queryByTestId("metadata-inspector"),
      ).not.toBeInTheDocument(),
    );
    expect(close).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByTestId("photo-details-button")).toHaveFocus(),
    );
  });

  it("lets a nested details control consume Escape first", async () => {
    const nestedEscape = vi.fn();
    render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        slides={[{ src: "/empty.jpg" }]}
        defaultDetailLevel="information"
        renderDetails={{
          empty: () => (
            <button
              type="button"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  event.stopPropagation();
                  nestedEscape();
                }
              }}
            >
              Nested control
            </button>
          ),
        }}
      />,
    );

    await openDetails();
    const nested = screen.getByRole("button", { name: "Nested control" });
    nested.focus();
    fireEvent.keyDown(nested, { key: "Escape" });

    expect(nestedEscape).toHaveBeenCalledOnce();
    expect(screen.getByTestId("metadata-inspector")).toBeInTheDocument();
  });

  it("exposes close and trigger refs to custom panel controls", async () => {
    const panelSlot = vi.fn(
      ({
        children,
        onClose,
      }: {
        children: React.ReactNode;
        onClose: () => void;
      }) => (
        <div data-testid="custom-panel">
          {children}
          <button type="button" onClick={onClose}>
            Custom close
          </button>
        </div>
      ),
    );
    const toolbarSlot = vi.fn(
      ({
        buttonRef,
        label,
        onClick,
      }: {
        buttonRef: React.ForwardedRef<HTMLButtonElement>;
        label: string;
        onClick: () => void;
      }) => (
        <button ref={buttonRef} type="button" onClick={onClick}>
          {label}
        </button>
      ),
    );

    render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        slides={slides}
        defaultDetailLevel="information"
        renderDetails={{
          panel: panelSlot,
          toolbarButton: toolbarSlot,
        }}
      />,
    );

    const trigger = await screen.findByRole("button", {
      name: "Photo details",
    });
    fireEvent.click(trigger);
    expect(await screen.findByTestId("custom-panel")).toBeInTheDocument();
    expect(panelSlot).toHaveBeenCalledWith(
      expect.objectContaining({ onClose: expect.any(Function) }),
    );
    expect(toolbarSlot).toHaveBeenLastCalledWith(
      expect.objectContaining({
        buttonRef: expect.objectContaining({ current: trigger }),
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Custom close" }));
    expect(screen.queryByTestId("metadata-inspector")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("isolates the lightbox background around a custom panel wrapper on mobile", async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        matches: true,
        removeEventListener: vi.fn(),
      }),
    });

    render(
      <PhotoDetailsLightbox
        open
        close={vi.fn()}
        slides={slides}
        defaultDetailLevel="information"
        renderDetails={{
          panel: ({ children, onClose }) => (
            <div data-testid="custom-panel-wrapper">
              {children}
              <button type="button" onClick={onClose}>
                Custom close
              </button>
            </div>
          ),
        }}
      />,
    );

    await openDetails();
    const wrapper = screen.getByTestId("custom-panel-wrapper");
    const customClose = screen.getByRole("button", { name: "Custom close" });
    const toolbar = document.querySelector(".yarl__toolbar");
    const carousel = document.querySelector(".yarl__carousel");

    expect(wrapper).not.toHaveAttribute("inert");
    expect(customClose).not.toHaveAttribute("inert");
    expect(toolbar).toHaveAttribute("inert");
    expect(toolbar).toHaveAttribute("aria-hidden", "true");
    expect(carousel).toHaveAttribute("inert");
    expect(carousel).toHaveAttribute("aria-hidden", "true");
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

    await openDetails();
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

    await openDetails();
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

    expect(histogramSlot).not.toHaveBeenCalled();
    await openDetails();
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

    await openDetails();
    expect(
      await screen.findAllByText("Histogram unavailable for this image."),
    ).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: "Retry histogram" }),
    ).not.toBeInTheDocument();
  });
});
