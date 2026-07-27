# React Photo Details Lightbox

A photography-first metadata inspector for [Yet Another React Lightbox](https://yet-another-react-lightbox.com/). It keeps the photograph central while making captions, stories, capture details, equipment, exposure, location, file information, and rights easy to explore.

> This repository is under active development. The package name used below is the intended npm name; do not assume it has been published yet.

## Highlights

- Four presentation levels: `minimum`, `information`, `detailed`, and `custom`
- A responsive side inspector on desktop and bottom sheet on small screens
- Dark, light, and system themes with CSS custom properties
- A convenient `PhotoDetailsLightbox` wrapper and a composable `PhotoDetails` YARL plugin
- Typed metadata and custom section schemas
- Optional, lazy EXIF extraction from user-provided sources
- React 18.2–19 and Next.js App Router support
- Keyboard, focus, reduced-motion, and screen-reader friendly interactions

## Run this workspace

Requirements: Node.js 22 or newer and npm.

```bash
npm install
npm run dev
```

The workspace contains:

- `packages/react-photo-details-lightbox` — the component library
- `apps/docs` — the Next.js documentation and interactive gallery

Useful checks:

```bash
npm run build
npm run build:sites
npm run typecheck
npm test
npm run test:e2e
```

`npm run build:sites` runs the OpenNext build and Wrangler's final bundling
pass, validates the final Worker, and creates a ready-to-upload Sites archive
in the operating system's temporary directory. The packager stages
`apps/docs/.sites-worker/worker.js` as `.open-next/worker.js` alongside the
static assets; the raw OpenNext loader is not the final Worker bundle.

## Installation

When the package is available from your chosen registry:

```bash
npm install react-photo-details-lightbox yet-another-react-lightbox
```

`react`, `react-dom`, and `yet-another-react-lightbox` are peer dependencies. Import both stylesheets once in your application:

```tsx
import "yet-another-react-lightbox/styles.css";
import "react-photo-details-lightbox/styles.css";
```

## Quick start

Add `photoMetadata` to any image slide and otherwise use the familiar YARL props:

```tsx
"use client";

import { useState } from "react";
import { PhotoDetailsLightbox } from "react-photo-details-lightbox";

const slides = [
  {
    src: "/photos/atlantic-dawn.jpg",
    width: 2400,
    height: 1600,
    alt: "Warm dawn light over the Atlantic coast",
    photoMetadata: {
      title: "Atlantic Dawn",
      caption: "First light above the sea cliffs.",
      story: "Made after waiting through a night of low cloud.",
      captureDate: "2026-05-17T05:42:00+01:00",
      camera: {
        make: "Nikon",
        model: "Z8",
      },
      lens: {
        model: "NIKKOR Z 24-70mm f/2.8 S",
      },
      exposure: {
        aperture: 8,
        shutterSpeed: "1/4",
        iso: 64,
        focalLength: 32,
      },
      copyright: "© 2026 Rowan Example",
      keywords: ["coast", "dawn", "long exposure"],
    },
  },
];

export function GalleryLightbox() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open photograph
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

Metadata is optional. Missing values and empty sections are omitted instead of being rendered as placeholders.

## Detail levels

| Level | Display |
| --- | --- |
| `minimum` | Photograph and standard lightbox controls only |
| `information` | Essential title, caption, capture date, and location |
| `detailed` | Story, equipment, exposure, location, file, creator, and rights groups |
| `custom` | Only the sections and fields supplied through `customSections` |

The viewer can switch levels by default. Set `allowDetailLevelChange={false}` to lock the selected level.

Use `defaultDetailLevel` for uncontrolled state:

```tsx
<PhotoDetailsLightbox
  open={open}
  close={close}
  slides={slides}
  defaultDetailLevel="information"
/>
```

Use `detailLevel` and `onDetailLevelChange` when application state owns the choice:

```tsx
import { useState } from "react";
import type { DetailLevel } from "react-photo-details-lightbox";

const [detailLevel, setDetailLevel] = useState<DetailLevel>("detailed");

<PhotoDetailsLightbox
  open={open}
  close={close}
  slides={slides}
  detailLevel={detailLevel}
  onDetailLevelChange={setDetailLevel}
/>;
```

An uncontrolled choice lasts only while the lightbox component remains mounted. The library does not write it to browser storage.

## Compose it as a YARL plugin

Use `PhotoDetails` when your application already composes YARL plugins or needs the underlying `Lightbox` component directly:

```tsx
"use client";

import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import { PhotoDetails } from "react-photo-details-lightbox";

<Lightbox
  open={open}
  close={close}
  slides={slides}
  plugins={[Zoom, PhotoDetails]}
  photoDetails={{
    defaultDetailLevel: "detailed",
    allowDetailLevelChange: true,
    theme: "system",
  }}
/>;
```

The plugin augments YARL's types with the slide `photoMetadata` field and the top-level `photoDetails` settings. Existing navigation, zoom, fullscreen, preload, RTL, and lifecycle behavior remains owned by YARL.

## Custom mode

Define ordered sections using `DetailSection`. A field may read a dot-separated metadata `path`; empty fields and then-empty sections are hidden automatically.

```tsx
import type { DetailSection } from "react-photo-details-lightbox";

const customSections: DetailSection[] = [
  {
    id: "essentials",
    title: "Essentials",
    fields: [
      { id: "title", label: "Title", path: "title" },
      { id: "story", label: "Field notes", path: "story" },
      { id: "camera", label: "Camera", path: "camera.model" },
    ],
  },
  {
    id: "rights",
    title: "Usage",
    fields: [
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

`DetailField` also supports `getValue`, `format`, and `hidden` for computed values, presentation overrides, and conditional visibility. `DetailSection` supports `hidden`. Use the `renderDetails` slots when an application needs to replace the panel, section, field, toolbar control, or empty presentation.

## Next.js App Router

The lightbox is interactive, so the component that owns its state must be a Client Component. It can still be rendered from a Server Component.

Import the global styles once from `app/layout.tsx`:

```tsx
// app/layout.tsx
import "yet-another-react-lightbox/styles.css";
import "react-photo-details-lightbox/styles.css";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

Then put the stateful lightbox in a Client Component:

```tsx
// app/gallery/photo-lightbox.tsx
"use client";

import { useState } from "react";
import { PhotoDetailsLightbox } from "react-photo-details-lightbox";

export function PhotoLightbox({ slides }: { slides: PhotoSlide[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        View gallery
      </button>
      <PhotoDetailsLightbox
        open={open}
        close={() => setOpen(false)}
        slides={slides}
        defaultDetailLevel="information"
      />
    </>
  );
}
```

Replace `PhotoSlide` with your application's serializable slide type. When slides cross a Server-to-Client boundary, pass strings, numbers, booleans, arrays, and plain objects—not `File`, `Blob`, functions, or other non-serializable values.

### Optional client-only dynamic import

A normal import from a Client Component is the preferred starting point. If an application specifically wants to skip server rendering of the lightbox module, declare `dynamic(..., { ssr: false })` **inside a Client Component**:

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

Next.js does not allow `ssr: false` in a Server Component. Keep this wrapper behind a `"use client"` boundary.

## Optional EXIF extraction

The core lightbox never downloads an image or extracts metadata on its own. This avoids surprise network requests, CORS failures, and main-thread work. The optional `exif` entry point lazily loads its parser only when extraction is requested:

```tsx
import {
  extractPhotoMetadata,
  isExifSourceSupported,
} from "react-photo-details-lightbox/exif";

const file = input.files?.[0];

if (file && isExifSourceSupported(file)) {
  const extracted = await extractPhotoMetadata(file);

  const slide = {
    src: URL.createObjectURL(file),
    photoMetadata: {
      ...extracted,
      // Explicit application values win.
      title: "Selected for the portfolio",
    },
  };
}
```

Accepted sources are explicit `File`, `Blob`, `ArrayBuffer`, and accessible URL inputs. URL extraction is subject to the remote server's CORS policy. Treat embedded coordinates and creator details as potentially sensitive, and obtain consent before uploading or displaying them.

Extraction returns `PhotoMetadata`; it does not mutate a slide. Merge it explicitly so your own metadata remains authoritative. Consumers that use this entry point must install its optional parser dependency if their package manager does not install optional dependencies:

```bash
npm install exifr
```

## Main exports

```ts
import {
  PhotoDetailsLightbox,
  PhotoDetails,
  // Presets and formatter helpers are also exported.
} from "react-photo-details-lightbox";

import type {
  PhotoMetadata,
  PhotoDetailsLightboxProps,
  PhotoDetailsSettings,
  PhotoDetailsRenderSlots,
  DetailLevel,
  DetailSection,
  DetailField,
} from "react-photo-details-lightbox";
```

See the package README and the interactive documentation app for the complete metadata model and customization examples.

## License

[MIT](./LICENSE)
