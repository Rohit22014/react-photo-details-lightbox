"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  IconButton,
  createIcon,
  isImageSlide,
  useController,
  useLightboxState,
  type Label,
} from "yet-another-react-lightbox";
import { usePhotoDetails } from "./context";
import { getPresetSections, resolveDetailSections } from "./presets";
import type {
  PhotoDetailsFieldRenderProps,
  PhotoDetailsSectionRenderProps,
  PhotoMetadata,
  ResolvedDetailField,
  ResolvedDetailSection,
} from "./types";

const DetailsIcon = createIcon(
  "PhotoDetails",
  <path d="M5 5.75h14M5 12h14M5 18.25h8M3 5.75h.01M3 12h.01M3 18.25h.01" />,
);

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

export function PhotoDetailsPanel() {
  const { currentIndex, slides } = useLightboxState();
  const { containerRef } = useController();
  const { availableLevels, labels, level, setLevel, settings, theme } =
    usePhotoDetails();
  const { metadata, slide } = useCurrentSlideMetadata();
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const dragStart = useRef<number | null>(null);
  const dragged = useRef(false);

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

  useEffect(() => {
    const controller = containerRef.current;
    controller?.classList.toggle("rpdl--details-open", level !== "minimum");
    return () => controller?.classList.remove("rpdl--details-open");
  }, [containerRef, level]);

  if (level === "minimum") return null;

  const onDragStart = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    dragStart.current = event.clientY;
    dragged.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onDragEnd = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (dragStart.current === null) return;
    const distance = event.clientY - dragStart.current;
    dragged.current = Math.abs(distance) > 10;
    if (distance > 48) setSheetExpanded(false);
    if (distance < -48) setSheetExpanded(true);
    dragStart.current = null;
  };

  const body =
    metadata && (metadata.title || metadata.caption || sections.length) ? (
      <Fragment>
        {metadata.title || metadata.caption ? (
          <div className="rpdl__intro">
            {metadata.title ? <h2>{metadata.title}</h2> : null}
            {metadata.caption ? <p>{metadata.caption}</p> : null}
          </div>
        ) : null}
        <div className="rpdl__sections">
          {sections.map((section) => (
            <Section key={section.id} section={section} />
          ))}
        </div>
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
      aria-label="Photo details"
      className={`rpdl__panel ${
        sheetExpanded ? "rpdl__panel--expanded" : "rpdl__panel--collapsed"
      }`}
      data-rpdl-theme={theme}
      data-testid="metadata-inspector"
    >
      <button
        aria-label={
          sheetExpanded ? "Collapse photo details" : "Expand photo details"
        }
        className="rpdl__sheet-handle"
        type="button"
        onClick={() => {
          if (!dragged.current) setSheetExpanded((value) => !value);
          dragged.current = false;
        }}
        onPointerDown={onDragStart}
        onPointerUp={onDragEnd}
      >
        <span />
      </button>

      <header className="rpdl__header">
        <div>
          <span className="rpdl__eyebrow">
            Frame {currentIndex + 1} / {slides.length}
          </span>
          <strong>Photo information</strong>
        </div>
        {settings.allowDetailLevelChange !== false ? (
          <label className="rpdl__level">
            <span className="rpdl__sr-only">Choose detail level</span>
            <select
              aria-label="Choose detail level"
              data-testid="photo-detail-level-select"
              value={level}
              onChange={(event) => setLevel(event.target.value as typeof level)}
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
      sections,
      children: content,
    });
  }
  return content;
}

export function PhotoDetailsButton() {
  const { level, settings, toggleDetails } = usePhotoDetails();
  const expanded = level !== "minimum";
  const label = expanded ? "Hide photo details" : "Photo details";
  if (settings.renderDetails?.toolbarButton) {
    return settings.renderDetails.toolbarButton({
      level,
      expanded,
      label,
      onClick: toggleDetails,
    }) as ReactNode;
  }

  return (
    <IconButton
      data-testid="photo-details-toggle"
      icon={DetailsIcon}
      label={label as Label}
      onClick={toggleDetails}
      className={expanded ? "rpdl__toolbar-button--active" : undefined}
    />
  );
}
