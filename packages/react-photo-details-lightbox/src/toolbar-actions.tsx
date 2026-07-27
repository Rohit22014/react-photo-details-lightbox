"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import {
  IconButton,
  createIcon,
  isImageSlide,
  useLightboxState,
  type Label,
  type SlideImage,
} from "yet-another-react-lightbox";
import { usePhotoDetails } from "./context";
import type {
  DetailLevel,
  PhotoShareData,
  PhotoViewerActionLabels,
} from "./types";
import { resolveViewerActions } from "./viewer-actions";

const DetailsIcon = createIcon(
  "PhotoDetails",
  <path d="M5 5.75h14M5 12h14M5 18.25h8M3 5.75h.01M3 12h.01M3 18.25h.01" />,
);

const MoreIcon = createIcon(
  "PhotoDetailsMenu",
  <>
    <circle cx="5" cy="12" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="19" cy="12" r="1.6" />
  </>,
);

const ShareIcon = createIcon(
  "PhotoShare",
  <path d="M16 5.5a2.5 2.5 0 1 0-.45-1.43L8.8 8.12a2.5 2.5 0 1 0 0 3.76l6.75 4.05A2.5 2.5 0 1 0 16.58 14l-6.75-4.05v-.1L16.58 5.8A2.5 2.5 0 0 0 16 5.5Z" />,
);

type ShareResult = "cancelled" | "copied" | "shared" | "unavailable";

function webUrl(value: string, baseUrl?: string) {
  try {
    const resolved = baseUrl ? new URL(value, baseUrl) : new URL(value);
    if (
      !["http:", "https:"].includes(resolved.protocol) ||
      resolved.username ||
      resolved.password
    ) {
      return undefined;
    }
    return resolved;
  } catch {
    return undefined;
  }
}

export function resolvePhotoShareData(
  slide: SlideImage,
  pageUrl: string,
): PhotoShareData | undefined {
  if (slide.share === false) return undefined;

  const pageTarget = webUrl(pageUrl);
  if (pageTarget) {
    pageTarget.search = "";
    pageTarget.hash = "";
  }
  const safePageUrl = pageTarget?.href;
  const metadata = slide.photoMetadata;
  const defaults: PhotoShareData = {
    ...(metadata?.title ? { title: metadata.title } : {}),
    ...(metadata?.caption ? { text: metadata.caption } : {}),
    ...(safePageUrl ? { url: safePageUrl } : {}),
  };

  if (typeof slide.share === "string") {
    const url = webUrl(slide.share, safePageUrl)?.href;
    return url ? { ...defaults, url } : undefined;
  }

  if (slide.share && typeof slide.share === "object") {
    const candidate = slide.share.url ?? safePageUrl;
    const url = candidate ? webUrl(candidate, safePageUrl)?.href : undefined;
    if (!url) return undefined;
    return {
      ...defaults,
      ...slide.share,
      url,
    };
  }

  return safePageUrl ? defaults : undefined;
}

function isAbortError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}

export async function performPhotoShare(
  data: PhotoShareData,
  browserNavigator: Navigator,
): Promise<ShareResult> {
  if (typeof browserNavigator.share === "function") {
    let canShare = true;
    try {
      canShare =
        typeof browserNavigator.canShare !== "function" ||
        browserNavigator.canShare(data);
    } catch {
      canShare = false;
    }

    if (canShare) {
      try {
        await browserNavigator.share(data);
        return "shared";
      } catch (error) {
        if (isAbortError(error)) return "cancelled";
      }
    }
  }

  if (data.url && browserNavigator.clipboard?.writeText) {
    try {
      await browserNavigator.clipboard.writeText(data.url);
      return "copied";
    } catch {
      // Fall through to the unavailable result.
    }
  }

  return "unavailable";
}

function shareResultMessage(
  result: ShareResult,
  labels: PhotoViewerActionLabels,
) {
  if (result === "copied") return labels.shareCopied;
  if (result === "shared") return labels.shareSucceeded;
  if (result === "unavailable") return labels.shareUnavailable;
  return "";
}

export function PhotoShareButton() {
  const { currentIndex, currentSlide } = useLightboxState();
  const { settings } = usePhotoDetails();
  const { labels } = resolveViewerActions(settings.viewerActions);
  const mounted = useRef(false);
  const activeIndex = useRef(currentIndex);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [sharing, setSharing] = useState(false);
  const [feedback, setFeedback] = useState({
    index: currentIndex,
    message: "",
  });
  const message = feedback.index === currentIndex ? feedback.message : "";
  const slide =
    currentSlide && isImageSlide(currentSlide) ? currentSlide : undefined;
  const shareDisabled = slide?.share === false;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  useEffect(() => {
    activeIndex.current = currentIndex;
  }, [currentIndex]);

  const announce = (nextMessage: string) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback({ index: currentIndex, message: nextMessage });
    if (nextMessage) {
      feedbackTimer.current = setTimeout(
        () => setFeedback({ index: currentIndex, message: "" }),
        4_000,
      );
    }
  };

  const onShare = async () => {
    if (!slide || sharing || typeof window === "undefined") return;

    const data = resolvePhotoShareData(slide, window.location.href);
    if (!data) {
      announce(labels.shareUnavailable);
      return;
    }

    setSharing(true);
    try {
      const result = await performPhotoShare(data, window.navigator);
      if (mounted.current && activeIndex.current === currentIndex) {
        announce(shareResultMessage(result, labels));
      }
    } finally {
      if (mounted.current) setSharing(false);
    }
  };

  return (
    <span className="rpdl__toolbar-action">
      <IconButton
        aria-busy={sharing}
        aria-disabled={sharing || undefined}
        data-testid="photo-share-button"
        disabled={!slide || shareDisabled}
        icon={ShareIcon}
        label={labels.share as Label}
        onClick={() => void onShare()}
      />
      <span
        aria-atomic="true"
        aria-live="polite"
        className="rpdl__action-feedback"
        data-testid="photo-share-status"
        data-visible={Boolean(message)}
        role="status"
      >
        {message}
      </span>
    </span>
  );
}

function focusOption(
  options: Map<DetailLevel, HTMLButtonElement>,
  levels: readonly DetailLevel[],
  index: number,
): DetailLevel | undefined {
  const level = levels[(index + levels.length) % levels.length];
  if (level) options.get(level)?.focus();
  return level;
}

function DefaultDetailsMenu() {
  const { currentIndex } = useLightboxState();
  const { availableLevels, labels, level, setLevel, settings } =
    usePhotoDetails();
  const actions = resolveViewerActions(settings.viewerActions);
  const [menuState, setMenuState] = useState({
    index: currentIndex,
    open: false,
  });
  const [focusedLevel, setFocusedLevel] = useState<DetailLevel>(level);
  const open = menuState.open && menuState.index === currentIndex;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef(new Map<DetailLevel, HTMLButtonElement>());
  const generatedId = useId();
  const menuId = `${generatedId}-detail-menu`;

  useEffect(() => {
    if (!open) return;
    optionRefs.current.get(focusedLevel)?.focus();

    const ownerDocument = triggerRef.current?.ownerDocument;
    if (!ownerDocument) return;
    const OwnerNode = ownerDocument.defaultView?.Node;

    const onPointerDown = (event: PointerEvent) => {
      if (
        OwnerNode &&
        event.target instanceof OwnerNode &&
        !menuRef.current?.contains(event.target) &&
        !triggerRef.current?.contains(event.target)
      ) {
        setMenuState({ index: currentIndex, open: false });
      }
    };

    ownerDocument.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      ownerDocument.removeEventListener("pointerdown", onPointerDown, true);
  }, [currentIndex, focusedLevel, open]);

  const closeMenu = (restoreFocus: boolean) => {
    setMenuState({ index: currentIndex, open: false });
    if (restoreFocus) triggerRef.current?.focus();
  };

  const focusAdjacentToolbarControl = (backward: boolean) => {
    const trigger = triggerRef.current;
    const toolbar = trigger?.closest(".yarl__toolbar");
    if (!trigger || !toolbar) {
      trigger?.focus();
      return;
    }

    const controls = Array.from(
      toolbar.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"),
    ).filter((control) => !menuRef.current?.contains(control));
    const triggerIndex = controls.indexOf(trigger);
    const target = controls[triggerIndex + (backward ? -1 : 1)];
    (target ?? trigger).focus();
  };

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const activeIndex = availableLevels.findIndex(
      (availableLevel) =>
        optionRefs.current.get(availableLevel) ===
        event.currentTarget.ownerDocument.activeElement,
    );
    const currentOptionIndex =
      activeIndex >= 0 ? activeIndex : availableLevels.indexOf(focusedLevel);

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      const nextLevel = focusOption(
        optionRefs.current,
        availableLevels,
        currentOptionIndex + (event.key === "ArrowDown" ? 1 : -1),
      );
      if (nextLevel) setFocusedLevel(nextLevel);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      event.stopPropagation();
      const nextLevel = focusOption(
        optionRefs.current,
        availableLevels,
        event.key === "Home" ? 0 : availableLevels.length - 1,
      );
      if (nextLevel) setFocusedLevel(nextLevel);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      event.stopPropagation();
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeMenu(true);
    } else if (event.key === "Tab") {
      event.preventDefault();
      event.stopPropagation();
      setMenuState({ index: currentIndex, open: false });
      focusAdjacentToolbarControl(event.shiftKey);
    }
  };

  return (
    <div
      className="rpdl__details-menu-root"
      onBlur={(event) => {
        if (
          open &&
          (!event.relatedTarget ||
            !event.currentTarget.contains(event.relatedTarget as Node))
        ) {
          setMenuState({ index: currentIndex, open: false });
        }
      }}
    >
      <IconButton
        ref={triggerRef}
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        className={open ? "rpdl__toolbar-button--active" : undefined}
        data-testid="photo-details-menu-button"
        icon={MoreIcon}
        label={actions.labels.detailLevelMenu as Label}
        onClick={() => {
          if (!open) setFocusedLevel(level);
          setMenuState({ index: currentIndex, open: !open });
        }}
      />
      {open ? (
        <div
          ref={menuRef}
          aria-label={actions.labels.detailLevelMenu}
          className="rpdl__details-menu"
          id={menuId}
          role="menu"
          onKeyDown={onMenuKeyDown}
          onPointerDown={(event) => event.stopPropagation()}
          onWheel={(event) => event.stopPropagation()}
        >
          <span aria-hidden="true" className="rpdl__details-menu-title">
            {actions.labels.detailLevelMenuTitle}
          </span>
          {availableLevels.map((availableLevel) => (
            <button
              ref={(node) => {
                if (node) optionRefs.current.set(availableLevel, node);
                else optionRefs.current.delete(availableLevel);
              }}
              aria-checked={level === availableLevel}
              className="rpdl__details-menu-option"
              data-level={availableLevel}
              key={availableLevel}
              role="menuitemradio"
              tabIndex={focusedLevel === availableLevel ? 0 : -1}
              type="button"
              onFocus={() => setFocusedLevel(availableLevel)}
              onClick={() => {
                setLevel(availableLevel);
                closeMenu(true);
              }}
            >
              <span>{labels[availableLevel]}</span>
              <span aria-hidden="true" className="rpdl__details-menu-check">
                ✓
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DefaultDetailsToggle({
  expanded,
  label,
  toggleDetails,
}: {
  expanded: boolean;
  label: string;
  toggleDetails: () => void;
}) {
  return (
    <IconButton
      className={expanded ? "rpdl__toolbar-button--active" : undefined}
      data-testid="photo-details-toggle"
      icon={DetailsIcon}
      label={label as Label}
      onClick={toggleDetails}
    />
  );
}

export function PhotoDetailsToolbarControl() {
  const { currentIndex } = useLightboxState();
  const { level, settings, toggleDetails } = usePhotoDetails();
  const actions = resolveViewerActions(settings.viewerActions);
  const expanded = level !== "minimum";
  const label = expanded
    ? actions.labels.hideDetails
    : actions.labels.showDetails;

  if (settings.renderDetails?.toolbarButton) {
    return settings.renderDetails.toolbarButton({
      level,
      expanded,
      label,
      onClick: toggleDetails,
    }) as ReactNode;
  }

  if (actions.detailLevelMenu && settings.allowDetailLevelChange !== false) {
    return <DefaultDetailsMenu key={currentIndex} />;
  }

  return (
    <DefaultDetailsToggle
      expanded={expanded}
      label={label}
      toggleDetails={toggleDetails}
    />
  );
}
