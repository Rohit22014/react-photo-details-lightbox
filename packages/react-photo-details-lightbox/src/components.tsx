"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  isImageSlide,
  useController,
  useLightboxState,
  type SlideImage,
} from "yet-another-react-lightbox";
import { usePhotoDetails } from "./context";
import { RgbHistogramView } from "./histogram-view";
import { getPresetSections, resolveDetailSections } from "./presets";
import { useRgbHistogram } from "./use-rgb-histogram";
import type {
  PhotoDetailsFieldRenderProps,
  PhotoDetailsSectionRenderProps,
  PhotoMetadata,
  ResolvedDetailField,
  ResolvedDetailSection,
} from "./types";

function DefaultField({ field }: PhotoDetailsFieldRenderProps) {
  return (
    <div className="rpdl__field">
      <dt>{field.label}</dt>
      <dd>{field.value}</dd>
    </div>
  );
}

function Field({ field }: { field: ResolvedDetailField }) {
  const { settings } = usePhotoDetails();
  if (settings.renderDetails?.field) {
    return settings.renderDetails.field({ field });
  }
  return <DefaultField field={field} />;
}

function DefaultSection({ section, children }: PhotoDetailsSectionRenderProps) {
  return (
    <section className="rpdl__section" data-section={section.id}>
      {section.title ? <h3>{section.title}</h3> : null}
      <dl>{children}</dl>
    </section>
  );
}

function Section({ section }: { section: ResolvedDetailSection }) {
  const { settings } = usePhotoDetails();
  const children = section.fields.map((field) => (
    <Field field={field} key={field.id} />
  ));

  if (settings.renderDetails?.section) {
    return settings.renderDetails.section({ section, children });
  }
  return <DefaultSection section={section}>{children}</DefaultSection>;
}

function EmptyDetails() {
  return (
    <div className="rpdl__empty">
      <span aria-hidden="true">—</span>
      <p>No photo information has been supplied for this frame.</p>
    </div>
  );
}

function useCurrentSlideMetadata(): {
  metadata?: PhotoMetadata;
  slide: ReturnType<typeof useLightboxState>["currentSlide"];
} {
  const { currentSlide } = useLightboxState();
  return {
    slide: currentSlide,
    ...(currentSlide && isImageSlide(currentSlide)
      ? { metadata: currentSlide.photoMetadata }
      : {}),
  };
}

function useMobileDetailsLayout() {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(query.matches);
    update();
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }
    query.addListener(update);
    return () => query.removeListener(update);
  }, []);

  return mobile;
}

export function PhotoDetailsPanel() {
  const { detailsOpen, level } = usePhotoDetails();
  if (!detailsOpen || level === "minimum") return null;
  return <PhotoDetailsPanelContent />;
}

function PhotoDetailsPanelContent() {
  const { currentIndex, slides } = useLightboxState();
  const { containerRef } = useController();
  const {
    availableLevels,
    closeDetails,
    detailsTriggerRef,
    labels,
    level,
    setLevel,
    settings,
    theme,
  } = usePhotoDetails();
  const { metadata, slide } = useCurrentSlideMetadata();
  const imageSlide: SlideImage | undefined =
    slide && isImageSlide(slide) ? slide : undefined;
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  const mobileLayout = useMobileDetailsLayout();

  const closePanel = useCallback(() => closeDetails(), [closeDetails]);

  const sections = useMemo(() => {
    if (!slide || !metadata || level === "minimum") return [];
    const source =
      level === "custom"
        ? (settings.customSections ?? [])
        : getPresetSections(level, settings.formatters);
    return resolveDetailSections(
      source,
      { level, metadata, slide },
      settings.formatters,
    );
  }, [level, metadata, settings.customSections, settings.formatters, slide]);
  const histogramSettings =
    settings.histogram === true ? {} : settings.histogram || undefined;
  const histogramVisible = Boolean(
    imageSlide &&
    histogramSettings &&
    (histogramSettings.levels ?? ["detailed"]).some(
      (histogramLevel) => histogramLevel === level,
    ),
  );
  const histogramState = useRgbHistogram({
    ...(imageSlide ? { slide: imageSlide } : {}),
    enabled: histogramVisible,
    autoGenerate: histogramSettings?.autoGenerate ?? true,
    ...(histogramSettings?.maxDimension !== undefined
      ? { maxDimension: histogramSettings.maxDimension }
      : {}),
  });

  useEffect(() => {
    const controller = containerRef.current;
    controller?.classList.add("rpdl--details-open");
    return () => controller?.classList.remove("rpdl--details-open");
  }, [containerRef]);

  useEffect(() => {
    const closeButton = closeButtonRef.current;
    if (!closeButton) return;

    const focusPanel = () => {
      if (closeButton.isConnected) closeButton.focus();
    };
    const ownerWindow = closeButton.ownerDocument.defaultView;
    if (ownerWindow?.requestAnimationFrame) {
      const frame = ownerWindow.requestAnimationFrame(focusPanel);
      return () => ownerWindow.cancelAnimationFrame(frame);
    }

    const timer = setTimeout(focusPanel, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(
    () => () => {
      const trigger = detailsTriggerRef.current;
      if (!trigger) return;

      const restoreFocus = () => {
        if (trigger.isConnected) trigger.focus();
      };
      const ownerWindow = trigger.ownerDocument.defaultView;
      if (ownerWindow?.requestAnimationFrame) {
        ownerWindow.requestAnimationFrame(restoreFocus);
      } else setTimeout(restoreFocus, 0);
    },
    [detailsTriggerRef],
  );

  useEffect(() => {
    if (!mobileLayout) return;
    const panel = panelRef.current;
    const controller = containerRef.current;
    if (!panel || !controller || !controller.contains(panel)) return;

    const panelBranch = Array.from(controller.children).find(
      (element) => element === panel || element.contains(panel),
    );
    if (!panelBranch) return;

    const background = Array.from(controller.children).filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element !== panelBranch,
    );
    const previous = background.map((element) => ({
      ariaHidden: element.getAttribute("aria-hidden"),
      element,
      inert: element.inert,
      inertAttribute: element.hasAttribute("inert"),
    }));

    for (const element of background) {
      element.inert = true;
      element.setAttribute("inert", "");
      element.setAttribute("aria-hidden", "true");
    }

    return () => {
      for (const state of previous) {
        state.element.inert = state.inert;
        if (state.inertAttribute) state.element.setAttribute("inert", "");
        else state.element.removeAttribute("inert");
        if (state.ariaHidden === null) {
          state.element.removeAttribute("aria-hidden");
        } else {
          state.element.setAttribute("aria-hidden", state.ariaHidden);
        }
      }
    };
  }, [containerRef, mobileLayout]);

  const onPanelKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      if (event.defaultPrevented) return;
      event.preventDefault();
      event.stopPropagation();
      closePanel();
      return;
    }

    if (event.key === "Tab" && mobileLayout) {
      const panel = panelRef.current;
      const ownerDocument = panel?.ownerDocument;
      if (!panel || !ownerDocument) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], area[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), iframe, object, embed, [contenteditable="true"], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (element) =>
          !element.hasAttribute("inert") &&
          element.getAttribute("aria-hidden") !== "true",
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = ownerDocument.activeElement;

      if (!first || !last) {
        event.preventDefault();
        return;
      }
      if (!panel.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    if (
      [
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "End",
        "Home",
        "PageDown",
        "PageUp",
        " ",
      ].includes(event.key)
    ) {
      event.stopPropagation();
    }
  };

  const defaultHistogram =
    histogramVisible && imageSlide ? (
      <RgbHistogramView
        {...(histogramState.data ? { data: histogramState.data } : {})}
        canRetry={histogramState.canRetry}
        status={histogramState.status}
        onRetry={histogramState.retry}
      />
    ) : null;
  const histogram =
    histogramVisible && imageSlide
      ? settings.renderDetails?.histogram
        ? settings.renderDetails.histogram({
            status: histogramState.status,
            ...(histogramState.data ? { data: histogramState.data } : {}),
            slide: imageSlide,
            canRetry: histogramState.canRetry,
            retry: histogramState.retry,
            children: defaultHistogram,
          })
        : defaultHistogram
      : null;
  const hasMetadataContent = Boolean(
    metadata && (metadata.title || metadata.caption || sections.length),
  );
  const body =
    hasMetadataContent || histogramVisible ? (
      <Fragment>
        {metadata && (metadata.title || metadata.caption) ? (
          <div className="rpdl__intro">
            {metadata.title ? <h2>{metadata.title}</h2> : null}
            {metadata.caption ? <p>{metadata.caption}</p> : null}
          </div>
        ) : null}
        {histogram}
        {sections.length ? (
          <div className="rpdl__sections">
            {sections.map((section) => (
              <Section key={section.id} section={section} />
            ))}
          </div>
        ) : null}
      </Fragment>
    ) : settings.renderDetails?.empty ? (
      settings.renderDetails.empty({
        level,
        ...(slide ? { slide } : {}),
      })
    ) : (
      <EmptyDetails />
    );

  const content = (
    <aside
      ref={panelRef}
      aria-labelledby={headingId}
      aria-modal={mobileLayout || undefined}
      className="rpdl__panel"
      data-rpdl-theme={theme}
      data-testid="metadata-inspector"
      role="dialog"
      onKeyDown={onPanelKeyDown}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerMove={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
    >
      <header className="rpdl__header">
        <div>
          <span className="rpdl__eyebrow">
            Frame {currentIndex + 1} / {slides.length}
          </span>
          <strong id={headingId}>Photo information</strong>
        </div>
        <div className="rpdl__header-actions">
          {settings.allowDetailLevelChange !== false ? (
            <label className="rpdl__level">
              <span className="rpdl__sr-only">Choose detail level</span>
              <select
                aria-label="Choose detail level"
                data-testid="photo-detail-level-select"
                value={level}
                onChange={(event) =>
                  setLevel(event.target.value as typeof level)
                }
              >
                {availableLevels.map((availableLevel) => (
                  <option key={availableLevel} value={availableLevel}>
                    {labels[availableLevel]}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span className="rpdl__level-label">{labels[level]}</span>
          )}
          <button
            ref={closeButtonRef}
            aria-label="Close photo details"
            className="rpdl__panel-close"
            type="button"
            onClick={closePanel}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m6.75 6.75 10.5 10.5m0-10.5-10.5 10.5" />
            </svg>
          </button>
        </div>
      </header>

      <div
        aria-label="Photo metadata"
        className="rpdl__body"
        role="region"
        tabIndex={0}
      >
        {body}
      </div>
    </aside>
  );

  if (settings.renderDetails?.panel) {
    return settings.renderDetails.panel({
      level,
      ...(metadata ? { metadata } : {}),
      ...(slide ? { slide } : {}),
      onClose: closePanel,
      sections,
      children: content,
    });
  }
  return content;
}
