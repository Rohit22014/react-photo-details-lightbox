# Contributing

Thank you for helping improve React Photo Details Lightbox.

## Before opening an issue

- Search the existing issues and documentation first.
- Use a minimal reproduction for bugs whenever possible.
- Remove private EXIF data, GPS coordinates, serial numbers, email addresses,
  credentials, and client photographs unless you have permission to share them.
- Use GitHub's private vulnerability reporting flow for security concerns.

## Local development

You need Node.js 22.9 or newer and the npm version declared in `package.json`.

```bash
git clone https://github.com/Rohit22014/react-photo-details-lightbox.git
cd react-photo-details-lightbox
npm ci
npm run dev
```

The library is in `packages/react-photo-details-lightbox`; the Next.js demo is
in `apps/docs`.

## Required checks

Run the same checks used by continuous integration before opening a pull
request:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run check:package
npm run test:e2e
```

Tests should cover behavior changes. User-facing API changes should include
documentation and a changelog entry. Please preserve keyboard, screen-reader,
reduced-motion, React 18/19, and Next.js compatibility.

## Pull requests

Keep changes focused and explain the problem, the chosen approach, and how the
result was verified. Only contribute code, text, and images that you are
authorized to license.

By submitting a contribution, you agree that it may be distributed under this
project's [MIT License](./LICENSE).

All contributors must follow the [Code of Conduct](./CODE_OF_CONDUCT.md).
