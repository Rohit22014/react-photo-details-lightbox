# React Photo Details Lightbox

A photography-first metadata inspector for [Yet Another React Lightbox](https://yet-another-react-lightbox.com/). It keeps the photograph central while making captions, stories, capture details, equipment, exposure, location, file information, and rights easy to explore.

[![CI](https://github.com/Rohit22014/react-photo-details-lightbox/actions/workflows/ci.yml/badge.svg)](https://github.com/Rohit22014/react-photo-details-lightbox/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

[Live demo](https://photo-details-lightbox.rohitdinanath.chatgpt.site) ·
[Package documentation](./packages/react-photo-details-lightbox/README.md) ·
[Contributing](./CONTRIBUTING.md)

> This repository is under active development. The package name used below is the intended npm name; do not assume it has been published yet.

## Highlights

- Four presentation levels: `minimum`, `information`, `detailed`, and `custom`
- A responsive side inspector on desktop and bottom sheet on small screens
- Built-in Share, Zoom, and three-dot detail-level controls in the wrapper
- Dark, light, and system themes with CSS custom properties
- A convenient `PhotoDetailsLightbox` wrapper and a composable `PhotoDetails` YARL plugin
- Typed metadata and custom section schemas
- Optional, lazy EXIF extraction from user-provided sources
- Opt-in RGB histograms from precomputed data or browser-side image analysis
- React 18.2–19 and Next.js App Router support
- Keyboard, focus, reduced-motion, and screen-reader friendly interactions

## Run this workspace

Requirements: Node.js 22.9 or newer and the npm version declared in `package.json`.

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
    photoHistogramSrc: "/photos/atlantic-dawn-histogram.jpg",
    width: 2400,
    height: 1600,
    alt: "Warm dawn light over the Atlantic coast",
    share: {
      url: "/photographs/atlantic-dawn",
      title: "Atlantic Dawn",
      text: "First light above the sea cliffs.",
    },
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
        histogram
        theme="system"
      />
    </>
  );
}
```

Metadata is optional. Missing values and empty sections are omitted instead of being rendered as placeholders.

## Viewer actions

`PhotoDetailsLightbox` includes Share, Zoom in/out, a three-dot detail-level
menu, and Close controls by default. The wrapper also installs YARL's Zoom
plugin unless the application already supplied it. Configure or disable the
defaults with `viewerActions`:

```tsx
<PhotoDetailsLightbox
  open={open}
  close={close}
  slides={slides}
  viewerActions={{
    share: true,
    zoom: true,
    detailLevelMenu: true,
  }}
/>
```

All three viewer-action options default to `true`. When `toolbar.buttons` is
not supplied, the wrapper orders the controls as Share, Zoom in/out, details,
and Close.

Set an individual action to `false`, or use `viewerActions={false}` to disable
Share and automatic Zoom installation and return the details control to a
simple show/hide toggle. A `Zoom` plugin supplied explicitly through `plugins`
remains enabled. Setting `allowDetailLevelChange={false}` also uses the
show/hide toggle. The `custom` menu choice appears only when `customSections`
contains at least one section.

The Share control resolves each image slide as follows:

- `share: false` disables sharing for that slide.
- A `share` string is used as its URL; relative values resolve against the
  current page.
- A `share: { url, title, text }` object overrides any part of the payload.
- With no `share` value, the current page URL without its query string or
  fragment is shared with the photo title and caption, when present.

Explicit share targets must be valid, credential-free HTTP(S) URLs. Other
schemes and malformed URLs are rejected instead of being copied.

The browser's native share sheet is preferred. If it is missing, rejects the
payload, or fails for a reason other than cancellation, the control copies the
resolved URL to the clipboard. If neither browser capability is available, it
announces that sharing is unavailable. The lightbox does not send the share
payload to a package-owned service.

Use `detailLabels` for the four detail-level names, `lightboxLabels` for
standard YARL controls, and `viewerActions.labels` for the new action labels
and feedback:

```tsx
<PhotoDetailsLightbox
  open={open}
  close={close}
  slides={slides}
  detailLabels={{
    minimum: "Image only",
    information: "Overview",
    detailed: "Technical",
    custom: "Field notes",
  }}
  lightboxLabels={{
    Close: "Close viewer",
    "Zoom in": "Magnify",
    "Zoom out": "Reduce",
  }}
  viewerActions={{
    labels: {
      detailLevelMenu: "Choose photo information",
      detailLevelMenuTitle: "Photo information",
      hideDetails: "Hide photo information",
      share: "Share this photograph",
      shareCopied: "Photo link copied.",
      showDetails: "Show photo information",
    },
  }}
/>
```

The legacy `labels` prop remains an alias for detail-level labels. New wrapper
integrations should use `detailLabels`; `lightboxLabels` is the prop forwarded
to YARL. `viewerActions.labels` can also localize the visual menu title and the
show/hide fallback labels.

If an application already uses YARL's official Share plugin, set
`viewerActions={{ share: false }}` to keep only that control. The built-in
control is the option that provides this package's copy-link fallback.

## Detail levels

| Level         | Display                                                                |
| ------------- | ---------------------------------------------------------------------- |
| `minimum`     | Photograph and standard lightbox controls only                         |
| `information` | Essential title, caption, capture date, and location                   |
| `detailed`    | Story, equipment, exposure, location, file, creator, and rights groups |
| `custom`      | Only the sections and fields supplied through `customSections`         |

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

The composable `PhotoDetails` plugin adds the Share action and detail-level
control, but it cannot install another plugin. Add YARL's `Zoom` plugin
explicitly, as shown above. `viewerActions.zoom` is an automatic-install flag
on `PhotoDetailsLightbox` only. With the underlying YARL component, keep
standard control translations in its `labels` prop and detail-level names in
`photoDetails.detailLabels`.

To stay compatible with every supported YARL 3.x peer, the wrapper's
`PhotoDetailsZoomSettings` type covers the Zoom settings common to the minimum
supported release. For version-specific Zoom callbacks, render slots, or newer
settings, use direct YARL composition with `PhotoDetails` and the installed
`Zoom` plugin.

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

## Optional RGB histogram

Set `histogram` to opt in. By default, it appears only in `detailed` mode and
analyzes the active image in the browser at a maximum 512-pixel edge. The
default graph overlays RGB and lets viewers isolate the red, green, or blue
channel while retaining a screen-reader tonal summary:

```tsx
<PhotoDetailsLightbox open={open} close={close} slides={slides} histogram />
```

Use the options form to change the sampling size or the detail levels where it
appears:

```tsx
<PhotoDetailsLightbox
  open={open}
  close={close}
  slides={slides}
  histogram={{
    autoGenerate: true,
    maxDimension: 512,
    levels: ["information", "detailed"],
  }}
/>
```

Automatic analysis uses `photoHistogramSrc` when supplied, then a suitable
`srcSet` candidate, then `src`. Prefer a small derivative that has the same
crop and color treatment as the displayed photograph:

```ts
const slide = {
  src: "/photos/full-size.jpg",
  photoHistogramSrc: "/photos/histogram-512.jpg",
};
```

Remote images must allow cross-origin browser access. A photograph can still
display when its host blocks CORS, but its pixels cannot be read for a
histogram. The inspector reports the histogram as unavailable without hiding
the image or metadata. A Content Security Policy must also allow the analysis
origin through `connect-src`; allowing it only through `img-src` is not enough
for the separate fetch.

For deterministic rendering and no client-side fetch, supply precomputed bins.
Each channel must contain exactly 256 finite, non-negative numbers:

```ts
import type { RgbHistogramData } from "react-photo-details-lightbox";

const histogram: RgbHistogramData = {
  red: redBins,
  green: greenBins,
  blue: blueBins,
};

const slide = {
  src: "/photos/full-size.jpg",
  photoHistogram: histogram,
};
```

Valid `photoHistogram` data takes precedence over image analysis. Set
`autoGenerate: false` to accept only precomputed data. The graph is an 8-bit,
display-referred RGB summary for the browser-renderable derivative; it is not a
RAW sensor, linear-light, wide-gamut, or HDR analysis tool. HEIF/HEIC and camera
RAW files are not converted by the lightbox. Generate an AVIF, WebP, or JPEG
derivative during ingestion, or compute and supply the bins on the server.

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
        histogram
      />
    </>
  );
}
```

Replace `PhotoSlide` with your application's serializable slide type. When slides cross a Server-to-Client boundary, pass strings, numbers, booleans, arrays, and plain objects—not `File`, `Blob`, functions, or other non-serializable values.

Histogram generation also runs in this Client Component. Same-origin files
under `public/` work without extra CORS configuration. If a Server Component
precomputes `photoHistogram`, pass its three plain 256-number arrays across the
boundary.

Viewer actions run on the client as well. Relative `share` URLs and the default
current-page URL are resolved only when the viewer activates Share. Plain
`share` payload objects can cross a Server-to-Client boundary with the rest of
the slide.

### Optional client-only dynamic import

A normal import from a Client Component is the preferred starting point. If an application specifically wants to skip server rendering of the lightbox module, declare `dynamic(..., { ssr: false })` **inside a Client Component**:

```tsx
// app/gallery/client-only-lightbox.tsx
"use client";

import dynamic from "next/dynamic";
import type { PhotoDetailsLightboxProps } from "react-photo-details-lightbox";

const ClientOnlyPhotoDetailsLightbox = dynamic<PhotoDetailsLightboxProps>(
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

EXIF extraction never runs unless the application calls the optional helper,
which lazily loads its parser. The separately opt-in RGB histogram can fetch
the configured analysis source, but it does not extract or upload EXIF data:

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

Accepted sources are explicit `File`, `Blob`, `ArrayBuffer`, and accessible URL
inputs. URL extraction is subject to the remote server's CORS policy. Treat
embedded coordinates, creator contact details, and camera or lens serial
numbers as potentially sensitive, and obtain consent before uploading or
displaying them.

Prefer browser-provided `File` or `Blob` values. If extraction runs on a
server, never pass an untrusted path or URL directly to the parser. Validate
the protocol and destination against an allowlist, block private-network
targets, and enforce download size and timeout limits.

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
  PhotoDetailsLightboxLabels,
  PhotoDetailsSettings,
  PhotoDetailsRenderSlots,
  PhotoDetailsZoomRef,
  PhotoDetailsZoomSettings,
  PhotoShareData,
  PhotoViewerActionLabels,
  PhotoViewerActions,
  PhotoViewerActionsSettings,
  PhotoHistogramOptions,
  RgbHistogramData,
  DetailLevel,
  DetailSection,
  DetailField,
} from "react-photo-details-lightbox";
```

See the [package README](./packages/react-photo-details-lightbox/README.md) and
the [interactive demo](https://photo-details-lightbox.rohitdinanath.chatgpt.site)
for the complete metadata model and customization examples.

## Project policies

- Read [Contributing](./CONTRIBUTING.md) before opening a pull request.
- Report vulnerabilities privately as described in the
  [Security Policy](./SECURITY.md).
- Review the [Demo Privacy Notice](./PRIVACY.md) and
  [Photo Credits](./PHOTO_CREDITS.md).
- See the [Changelog](./CHANGELOG.md) for release notes.

This project builds on Yet Another React Lightbox but is independently
maintained and is not affiliated with or endorsed by its original author.

## AI assistance

This project was generated and developed with the assistance of AI tools.
The maintainers have reviewed and adapted the resulting work and remain
responsible for its use, maintenance, and distribution.

## License

[MIT](./LICENSE). Yet Another React Lightbox remains licensed by its original
author under the MIT License; see [Third-Party Notices](./THIRD_PARTY_NOTICES.md).
