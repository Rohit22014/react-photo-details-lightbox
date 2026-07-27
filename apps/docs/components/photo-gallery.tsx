"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  PhotoDetailsLightbox,
  type DetailLevel,
  type DetailSection,
} from "react-photo-details-lightbox";
import { photos } from "@/data/photos";

const levels: DetailLevel[] = ["minimum", "information", "detailed", "custom"];

const customSections: DetailSection[] = [
  {
    id: "field-notes",
    title: "From the field",
    fields: [
      { id: "work", label: "Work", path: "title" },
      { id: "story", label: "Field notes", path: "story" },
      { id: "place", label: "Location", path: "location.name" },
    ],
  },
  {
    id: "making",
    title: "Making the image",
    fields: [
      { id: "camera", label: "Camera", path: "camera.model" },
      { id: "lens", label: "Lens", path: "lens.model" },
      { id: "photographer", label: "Photographer", path: "creator.name" },
    ],
  },
];

const displayTitle = (level: DetailLevel) =>
  level.charAt(0).toUpperCase() + level.slice(1);

const getThumbnailSrc = (src: string) =>
  src.replace(/w=(?:2400|2000|1600)/, "w=1200").replace("h=2400", "h=1800");

export function PhotoGallery() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("detailed");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setHydrated(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const openPhoto = (photoIndex: number) => {
    setIndex(photoIndex);
    setOpen(true);
  };

  return (
    <>
      <div className="preset-bar">
        <div className="preset-copy">
          <span>Viewer preset</span>
          <strong>{displayTitle(detailLevel)}</strong>
        </div>
        <label className="preset-select">
          <span className="sr-only">Choose a metadata detail level</span>
          <select
            data-testid="demo-detail-level-select"
            value={detailLevel}
            onChange={(event) =>
              setDetailLevel(event.target.value as DetailLevel)
            }
          >
            {levels.map((level) => (
              <option key={level} value={level}>
                {displayTitle(level)}
              </option>
            ))}
          </select>
          <span aria-hidden="true">⌄</span>
        </label>
        <p>
          The chosen preset follows you through the gallery. Inside the viewer,
          use the three-dot menu to change it, or use Share and Zoom without
          leaving the frame.
        </p>
      </div>

      <div
        className="photo-grid"
        data-hydrated={hydrated}
        data-testid="photo-gallery"
      >
        {photos.map((photo, photoIndex) => (
          <button
            className={`photo-card photo-card-${photoIndex + 1}`}
            data-testid={`gallery-card-${photoIndex}`}
            key={photo.src}
            type="button"
            onClick={() => openPhoto(photoIndex)}
            aria-label={`Open ${photo.photoMetadata.title} in the lightbox`}
          >
            <Image
              src={getThumbnailSrc(photo.src)}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              loading={photoIndex > 1 ? "lazy" : "eager"}
              sizes="(max-width: 760px) 100vw, 50vw"
            />
            <span className="photo-card-shade" />
            <span className="photo-card-index">
              {String(photoIndex + 1).padStart(2, "0")}
            </span>
            <span className="photo-card-caption">
              <strong>{photo.photoMetadata.title}</strong>
              <span>{photo.photoMetadata.location.name}</span>
            </span>
            <span className="photo-card-open" aria-hidden="true">
              ↗
            </span>
          </button>
        ))}
      </div>
      <p className="demo-credit">
        Demo photographs:{" "}
        {photos.map((photo, photoIndex) => (
          <span key={photo.attribution.url}>
            {photoIndex > 0 ? ", " : ""}
            <a href={photo.attribution.url} target="_blank" rel="noreferrer">
              {photo.attribution.photographer}
            </a>
          </span>
        ))}
        {" · "}
        <a href="https://unsplash.com/license" target="_blank" rel="noreferrer">
          Unsplash License
        </a>
        . Titles, stories, dates, equipment, filenames, and most locations are
        fictional demo metadata.
      </p>

      <PhotoDetailsLightbox
        open={open}
        close={() => setOpen(false)}
        index={index}
        slides={photos}
        detailLevel={detailLevel}
        allowDetailLevelChange
        customSections={customSections}
        histogram
        onDetailLevelChange={setDetailLevel}
      />
    </>
  );
}
