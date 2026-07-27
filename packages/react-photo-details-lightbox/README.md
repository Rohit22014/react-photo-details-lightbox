# react-photo-details-lightbox

A responsive, accessible photo metadata inspector for [Yet Another React Lightbox](https://yet-another-react-lightbox.com/). Use the ready-made wrapper or add it to an existing YARL setup as a plugin.

> The package is being developed in this repository. The commands below describe the intended registry package; check your registry before depending on it.

## Install

```bash
npm install react-photo-details-lightbox yet-another-react-lightbox
```

The package requires React 18.2–19 and Yet Another React Lightbox 3.21–3.x. Import both stylesheets once:

```tsx
import "yet-another-react-lightbox/styles.css";
import "react-photo-details-lightbox/styles.css";
```

## Wrapper usage

`PhotoDetailsLightbox` accepts the normal YARL lightbox props plus photo-detail settings. Add `photoMetadata` to an image slide:

```tsx
"use client";

import { useState } from "react";
import { PhotoDetailsLightbox } from "react-photo-details-lightbox";

const slides = [
  {
    src: "/photos/winter-ridge.jpg",
    width: 2400,
    height: 1600,
    alt: "Snow blowing over a mountain ridge",
    photoMetadata: {
      title: "Winter Ridge",
      caption: "Spindrift crossing the summit at last light.",
      story: "The weather cleared for less than five minutes.",
      captureDate: "2026-01-12T16:08:00Z",
      camera: { make: "Sony", model: "ILCE-1" },
      lens: { model: "FE 70-200mm F2.8 GM OSS II" },
      exposure: {
        aperture: 5.6,
        shutterSpeed: "1/1000",
        iso: 400,
        focalLength: 135,
      },
      copyright: "© 2026 Alex Example",
      keywords: ["mountain", "winter", "weather"],
    },
  },
];

export function PortfolioLightbox() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        View photograph
      </button>
      <PhotoDetailsLightbox
        open={open}
        close={() => setOpen(false)}
        slides={slides}
        defaultDetailLevel="detailed"
        theme="system"
      />
    </>
  );
}
```

All metadata is optional. Empty fields and groups are left out of the inspector.

## Detail levels

- `minimum` keeps the interface focused on the photograph.
- `information` shows essential title, caption, date, and location.
- `detailed` adds story, equipment, exposure, file, creator, and rights groups.
- `custom` renders the supplied `customSections`.

Viewers can choose among available levels unless `allowDetailLevelChange={false}`. Use `defaultDetailLevel` for local state, or control the value:

```tsx
import { useState } from "react";
import type { DetailLevel } from "react-photo-details-lightbox";

const [level, setLevel] = useState<DetailLevel>("information");

<PhotoDetailsLightbox
  open={open}
  close={close}
  slides={slides}
  detailLevel={level}
  onDetailLevelChange={setLevel}
  allowDetailLevelChange
/>;
```

The uncontrolled selection is retained only while the component is mounted. No preference is stored in `localStorage` or another browser store.

## Plugin usage

`PhotoDetails` composes with an existing YARL setup:

```tsx
"use client";

import Lightbox from "yet-another-react-lightbox";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import { PhotoDetails } from "react-photo-details-lightbox";

<Lightbox
  open={open}
  close={close}
  slides={slides}
  plugins={[Fullscreen, Zoom, PhotoDetails]}
  photoDetails={{
    defaultDetailLevel: "detailed",
    allowDetailLevelChange: true,
    theme: "dark",
  }}
/>;
```

Installing the plugin augments YARL's TypeScript declarations with `photoMetadata` on image slides and `photoDetails` on the lightbox props.

## Custom sections

Sections and fields render in array order. The simplest field reads a dot-separated metadata `path`:

```tsx
import type { DetailSection } from "react-photo-details-lightbox";

const customSections: DetailSection[] = [
  {
    id: "portfolio",
    title: "Portfolio notes",
    fields: [
      { id: "title", label: "Work", path: "title" },
      { id: "story", label: "Field notes", path: "story" },
      { id: "camera", label: "Body", path: "camera.model" },
    ],
  },
  {
    id: "usage",
    title: "Usage",
    fields: [
      { id: "creator", label: "Photographer", path: "creator.name" },
      { id: "copyright", label: "Copyright", path: "copyright" },
      { id: "license", label: "License", path: "license.name" },
    ],
  },
];

<PhotoDetailsLightbox
  open={open}
  close={close}
  slides={slides}
  defaultDetailLevel="custom"
  customSections={customSections}
/>;
```

A `DetailField` may instead supply `getValue`, and may define `format` or `hidden`. A `DetailSection` may also define `hidden`. Use `renderDetails` to override the provided panel, section, field, toolbar control, or empty presentation while retaining the lightbox state and metadata model.

## Next.js App Router

Import the global CSS from the root layout:

```tsx
// app/layout.tsx
import "yet-another-react-lightbox/styles.css";
import "react-photo-details-lightbox/styles.css";
```

The component that owns open/close state must be a Client Component:

```tsx
// app/gallery/gallery-lightbox.tsx
"use client";

import { useState } from "react";
import {
  PhotoDetailsLightbox,
  type PhotoDetailsLightboxProps,
} from "react-photo-details-lightbox";

type Slides = PhotoDetailsLightboxProps["slides"];

export function GalleryLightbox({ slides }: { slides: Slides }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open gallery
      </button>
      <PhotoDetailsLightbox
        open={open}
        close={() => setOpen(false)}
        slides={slides}
      />
    </>
  );
}
```

`PhotoDetailsLightbox` is safe to import normally from a Client Component. If a project specifically wants no server-rendered lightbox module, `ssr: false` must also be declared inside a Client Component:

```tsx
// app/gallery/client-only-lightbox.tsx
"use client";

import dynamic from "next/dynamic";
import type { PhotoDetailsLightboxProps } from "react-photo-details-lightbox";

const ClientOnlyPhotoDetailsLightbox =
  dynamic<PhotoDetailsLightboxProps>(
    () =>
      import("react-photo-details-lightbox").then(
        (module) => module.PhotoDetailsLightbox,
      ),
    { ssr: false },
  );

export function ClientOnlyLightbox(props: PhotoDetailsLightboxProps) {
  return <ClientOnlyPhotoDetailsLightbox {...props} />;
}
```

Do not place `dynamic(..., { ssr: false })` in a Server Component. Data passed from a Server Component must also remain serializable, so perform `File`/`Blob` EXIF work on the client.

## Optional EXIF helpers

Metadata extraction is intentionally opt-in. The lightbox does not fetch image URLs or inspect files:

```tsx
import {
  extractPhotoMetadata,
  isExifSourceSupported,
} from "react-photo-details-lightbox/exif";

async function metadataFromUpload(file: File) {
  if (!isExifSourceSupported(file)) return {};

  const extracted = await extractPhotoMetadata(file);

  return {
    ...extracted,
    // Explicit editorial metadata takes precedence.
    title: "Portfolio selection",
  };
}
```

`extractPhotoMetadata` accepts an explicit `File`, `Blob`, `ArrayBuffer`, or accessible URL and returns `PhotoMetadata`. It does not mutate slides or merge values. URL extraction depends on the remote host's CORS policy.

The EXIF parser is lazy and optional. If your package manager omits optional dependencies, install it explicitly:

```bash
npm install exifr
```

Embedded GPS and authorship fields can be sensitive. Obtain permission before uploading or displaying them.

## API

Main values:

- `PhotoDetailsLightbox` — convenience wrapper
- `PhotoDetails` — YARL plugin
- Preset definitions and formatter helpers

Main types:

- `PhotoMetadata`
- `PhotoDetailsLightboxProps`
- `PhotoDetailsSettings`
- `PhotoDetailsRenderSlots`
- `DetailLevel`
- `DetailSection`
- `DetailField`

EXIF entry point:

```ts
import {
  extractPhotoMetadata,
  isExifSourceSupported,
} from "react-photo-details-lightbox/exif";
```

## License

MIT
