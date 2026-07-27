# react-photo-details-lightbox

A responsive, accessible photo metadata inspector for [Yet Another React Lightbox](https://yet-another-react-lightbox.com/). Use the ready-made wrapper or add it to an existing YARL setup as a plugin.

[Live demo](https://photo-details-lightbox.rohitdinanath.chatgpt.site) ·
[Source](https://github.com/Rohit22014/react-photo-details-lightbox) ·
[Issues](https://github.com/Rohit22014/react-photo-details-lightbox/issues)

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
    photoHistogramSrc: "/photos/winter-ridge-histogram.jpg",
    width: 2400,
    height: 1600,
    alt: "Snow blowing over a mountain ridge",
    share: {
      url: "/work/winter-ridge",
      title: "Winter Ridge",
      text: "Spindrift crossing the summit at last light.",
    },
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
        histogram
        theme="system"
      />
    </>
  );
}
```

All metadata is optional. Empty fields and groups are left out of the inspector.

## Viewer actions

The wrapper shows Share, Zoom in/out, a three-dot detail-level menu, and Close
by default. It installs YARL's Zoom plugin automatically and avoids adding it a
second time when the same plugin reference is already present.

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

Each option defaults to `true`. With no custom `toolbar.buttons`, their order is
Share, Zoom in/out, details, then Close. Set an option to `false`, or pass
`viewerActions={false}` to disable Share and automatic Zoom installation and
use the original show/hide details toggle. A `Zoom` plugin explicitly supplied
through `plugins` remains enabled. `allowDetailLevelChange={false}` also
replaces the three-dot menu with that toggle.

The selected level and panel visibility are independent. The inspector starts
closed; choosing Information, Detailed, or Custom from the three-dot menu opens
a right-side desktop drawer or a full-screen phone view. Choosing Minimum or
the panel's close button hides it while preserving the last non-minimum mode.

Sharing uses the current page URL without its query string or fragment by
default, plus `photoMetadata.title` and `photoMetadata.caption` when present.
Override the payload per slide with a URL string or object:

```ts
const slide = {
  src: "/photos/winter-ridge.jpg",
  share: {
    url: "/work/winter-ridge",
    title: "Winter Ridge",
    text: "Spindrift crossing the summit at last light.",
  },
};
```

Relative URLs resolve against the page containing the viewer. Use
`share: false` on a slide to disable its Share button. The control first tries
the browser's native share sheet, then copies the resolved URL to the
clipboard as a fallback. Share targets must resolve to credential-free HTTP(S)
URLs; malformed URLs and other schemes are rejected. The control announces
shared, copied, or unavailable status and never posts the payload to a service
owned by this package.

Labels are deliberately separated:

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
      shareSucceeded: "Photo shared.",
      shareUnavailable: "Sharing is unavailable.",
      showDetails: "Show photo information",
    },
  }}
/>
```

`detailLabels` names this package's four modes. `lightboxLabels` is forwarded
to standard YARL controls. The older `labels` prop remains a deprecated alias
for detail-level labels. `viewerActions.labels` can also localize the visual
menu title and the show/hide fallback labels.

If the application supplies YARL's official Share plugin, set
`viewerActions={{ share: false }}` to avoid showing both Share controls. Use the
built-in control when the copy-link fallback is desired.

## Detail levels

- `minimum` keeps the interface focused on the photograph.
- `information` shows essential title, caption, date, and location.
- `detailed` adds story, equipment, exposure, file, creator, and rights groups.
- `custom` renders the supplied `customSections`.

Viewers can choose among available levels unless `allowDetailLevelChange={false}`. Use `defaultDetailLevel` for local state, or control the value. Selecting a default level does not open the inspector:

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

Use `detailsOpen` with `onDetailsOpenChange` to control the drawer, or
`defaultDetailsOpen` to opt into an initially open uncontrolled drawer. It is
closed by default.

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

The composable plugin adds Share and the detail-level control, but it does not
install YARL's Zoom plugin. Include `Zoom` in `plugins`, as in the example.
Automatic Zoom installation controlled by `viewerActions.zoom` is a
`PhotoDetailsLightbox` wrapper feature. In direct YARL usage, standard control
translations stay in the lightbox's `labels` prop and mode names belong in
`photoDetails.detailLabels`.

`PhotoDetailsZoomSettings` intentionally describes the Zoom options shared by
the full supported YARL 3.x range. Use direct YARL composition when an
integration needs version-specific Zoom callbacks, render slots, or newer
settings from its installed YARL release.

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

A `DetailField` may instead supply `getValue`, and may define `format` or
`hidden`. A `DetailSection` may also define `hidden`. Use `renderDetails` to
override the provided panel, section, field, toolbar control, or empty
presentation while retaining the lightbox state and metadata model. A custom
panel receives `onClose`, and a custom toolbar control receives `buttonRef`;
attach that ref to the actual trigger so focus returns correctly after the
panel closes.

## RGB histogram

Histogram rendering is opt-in. Passing `histogram` enables browser-side
analysis for the active slide and shows the graph in `detailed` mode. Its
`All`, `R`, `G`, and `B` controls switch between the overlaid and isolated
channels, with a tonal summary available to screen readers:

```tsx
<PhotoDetailsLightbox open={open} close={close} slides={slides} histogram />
```

The options form controls automatic analysis, its maximum sampling dimension,
and the visible detail levels:

```tsx
<PhotoDetailsLightbox
  open={open}
  close={close}
  slides={slides}
  histogram={{
    autoGenerate: true,
    maxDimension: 512,
    levels: ["detailed"],
  }}
/>
```

Set `photoHistogramSrc` on a slide to analyze a lightweight derivative instead
of its display-sized source:

```ts
const slide = {
  src: "/photos/winter-ridge.jpg",
  photoHistogramSrc: "/photos/winter-ridge-histogram.jpg",
};
```

Automatic analysis requires the selected URL to be readable by browser canvas
APIs. Same-origin URLs work normally; remote servers must grant cross-origin
access. CORS, network, or decode failures affect only the histogram and expose
a retry action. The photograph and its metadata remain available. Sites with a
Content Security Policy must also allow the analysis origin through
`connect-src`; `img-src` alone does not permit the separate fetch.

Applications can avoid fetching and decoding in the browser by providing
precomputed bins. Each channel requires exactly 256 finite, non-negative
numbers:

```ts
import type { RgbHistogramData } from "react-photo-details-lightbox";

const photoHistogram: RgbHistogramData = {
  red: redBins,
  green: greenBins,
  blue: blueBins,
};

const slide = {
  src: "/photos/winter-ridge.jpg",
  photoHistogram,
};
```

Valid precomputed data takes precedence over image analysis. Use
`histogram={{ autoGenerate: false }}` when every histogram must be supplied by
the application. The `renderDetails.histogram` slot can replace the default
presentation while retaining its status, data, slide, `canRetry`, and retry
behavior.

This is an 8-bit, display-referred RGB histogram of a browser-renderable image,
not RAW sensor, linear-light, wide-gamut, or HDR analysis. The lightbox does not
convert HEIF/HEIC or camera RAW sources. Convert once during ingestion to an
AVIF, WebP, or JPEG derivative, or calculate the bins on the server and supply
`photoHistogram`.

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
        histogram
      />
    </>
  );
}
```

Browser-generated histograms also run inside that Client Component.
Same-origin derivatives under `public/` need no extra CORS setup. Precomputed
histograms are plain arrays and can cross a Server-to-Client boundary.

Share actions also run only in the browser. The default page URL and relative
per-slide `share` URLs are resolved when the viewer activates Share. A plain
`share` object is serializable and can cross the Server-to-Client boundary with
the slide.

`PhotoDetailsLightbox` is safe to import normally from a Client Component. If a project specifically wants no server-rendered lightbox module, `ssr: false` must also be declared inside a Client Component:

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

Do not place `dynamic(..., { ssr: false })` in a Server Component. Data passed from a Server Component must also remain serializable, so perform `File`/`Blob` EXIF work on the client.

## Optional EXIF helpers

Metadata extraction is intentionally opt-in and runs only when the application
calls the EXIF helper. The separately opt-in RGB histogram may fetch its
configured analysis source, but it does not extract EXIF data:

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

Embedded GPS coordinates, creator contact details, and camera or lens serial
numbers can be sensitive. Obtain permission before uploading or displaying
them.

Prefer browser-provided `File` or `Blob` values. If extraction runs on a
server, never pass an untrusted path or URL directly to the parser. Validate
the protocol and destination against an allowlist, block private-network
targets, and enforce download size and timeout limits.

## API

Main values:

- `PhotoDetailsLightbox` — convenience wrapper
- `PhotoDetails` — YARL plugin
- Preset definitions and formatter helpers

Main types:

- `PhotoMetadata`
- `PhotoDetailsLightboxProps`
- `PhotoDetailsLightboxLabels`
- `PhotoDetailsSettings`
- `PhotoDetailsRenderSlots`
- `PhotoDetailsZoomRef`
- `PhotoDetailsZoomSettings`
- `PhotoShareData`
- `PhotoViewerActionLabels`
- `PhotoViewerActions`
- `PhotoViewerActionsSettings`
- `PhotoHistogramOptions`
- `RgbHistogramData`
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

## Project policies

See the repository's
[contribution guide](https://github.com/Rohit22014/react-photo-details-lightbox/blob/main/CONTRIBUTING.md),
[security policy](https://github.com/Rohit22014/react-photo-details-lightbox/blob/main/SECURITY.md),
and [changelog](https://github.com/Rohit22014/react-photo-details-lightbox/blob/main/CHANGELOG.md).

This package builds on Yet Another React Lightbox but is independently
maintained and is not affiliated with or endorsed by its original author.

## AI assistance

This project was generated and developed with the assistance of AI tools.
The maintainers have reviewed and adapted the resulting work and remain
responsible for its use, maintenance, and distribution.

## License

[MIT](./LICENSE). Yet Another React Lightbox remains licensed by its original
author under the MIT License; see [Third-Party Notices](./THIRD_PARTY_NOTICES.md).
