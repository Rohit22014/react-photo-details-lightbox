import { spawnSync } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDirectory, "..");
const packageDirectory = path.join(
  workspaceRoot,
  "packages",
  "react-photo-details-lightbox",
);
const packageManifest = JSON.parse(
  await readFile(path.join(packageDirectory, "package.json"), "utf8"),
);

const reactVersion = process.env.REACT_VERSION ?? "18.2.0";
const reactDomVersion = process.env.REACT_DOM_VERSION ?? reactVersion;
const lightboxVersion = process.env.LIGHTBOX_VERSION ?? "3.21.0";
const reactTypesVersion = reactVersion.startsWith("18.")
  ? "^18.2.0"
  : "^19.0.0";
const reactDomTypesVersion = reactDomVersion.startsWith("18.")
  ? "^18.2.0"
  : "^19.0.0";
const versionPattern = /^[0-9A-Za-z][0-9A-Za-z.+-]*$/;

for (const [name, version] of [
  ["React", reactVersion],
  ["React DOM", reactDomVersion],
  ["Yet Another React Lightbox", lightboxVersion],
]) {
  if (!versionPattern.test(version)) {
    throw new Error(`${name} version contains unsupported characters.`);
  }
}

const run = (command, args, cwd, options = {}) => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    if (options.capture) {
      process.stderr.write(result.stdout);
      process.stderr.write(result.stderr);
    }
    throw new Error(`${command} exited with status ${result.status}.`);
  }

  return result.stdout;
};

const stagingDirectory = await mkdtemp(
  path.join(tmpdir(), "photo-details-lightbox-compat-"),
);
const packageArchiveName = `${packageManifest.name
  .replace(/^@/, "")
  .replaceAll("/", "-")}-${packageManifest.version}.tgz`;
const packageArchive = path.join(stagingDirectory, packageArchiveName);

try {
  await mkdir(stagingDirectory, { recursive: true });

  run(
    "npm",
    [
      "pack",
      "--silent",
      "--workspace",
      packageManifest.name,
      "--pack-destination",
      stagingDirectory,
    ],
    workspaceRoot,
  );
  await stat(packageArchive);

  await writeFile(
    path.join(stagingDirectory, "package.json"),
    `${JSON.stringify(
      {
        name: "photo-details-lightbox-compatibility-check",
        private: true,
        type: "module",
        dependencies: {
          [packageManifest.name]: `file:./${packageArchiveName}`,
          react: reactVersion,
          "react-dom": reactDomVersion,
          "yet-another-react-lightbox": lightboxVersion,
        },
        devDependencies: {
          "@types/react": reactTypesVersion,
          "@types/react-dom": reactDomTypesVersion,
          jsdom: "^26.1.0",
          typescript: "^5.9.0",
        },
      },
      null,
      2,
    )}\n`,
  );

  await writeFile(
    path.join(stagingDirectory, "consumer.tsx"),
    `import { ExifExtractionError } from "${packageManifest.name}/exif";
import type {
  PhotoDetailsLightboxProps as RootProps,
  PhotoDetailsZoomRef,
} from "${packageManifest.name}";

const zoomRef: { current: PhotoDetailsZoomRef | null } = { current: null };
const props: RootProps = {
  close() {},
  open: false,
  detailsOpen: false,
  detailLabels: { detailed: "Technical" },
  lightboxLabels: {
    Close: "Dismiss",
    "Zoom in": "Magnify",
    "Zoom out": "Reduce",
  },
  slides: [
    {
      share: {
        title: "Compatibility photograph",
        url: "/work/compatibility-photograph",
      },
      src: "/compatibility.jpg",
    },
  ],
  viewerActions: {
    detailLevelMenu: true,
    labels: { share: "Share this photograph" },
    share: true,
    zoom: true,
  },
  onDetailsOpenChange() {},
  zoom: { maxZoomPixelRatio: 2, ref: zoomRef },
};
const error = new ExifExtractionError("Example", {
  cause: new Error("Cause"),
});

void props;
void error;
`,
  );

  await writeFile(
    path.join(stagingDirectory, "tsconfig.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          lib: ["ES2020", "DOM"],
          module: "NodeNext",
          moduleResolution: "NodeNext",
          noEmit: true,
          skipLibCheck: false,
          strict: true,
          target: "ES2020",
        },
        include: ["consumer.tsx"],
      },
      null,
      2,
    )}\n`,
  );

  await writeFile(
    path.join(stagingDirectory, "smoke.mjs"),
    `import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PhotoDetailsLightbox } from "${packageManifest.name}";
import { isExifSourceSupported } from "${packageManifest.name}/exif";

if (typeof PhotoDetailsLightbox !== "function") {
  throw new Error("The ESM component export is unavailable.");
}
if (!isExifSourceSupported(new ArrayBuffer(0))) {
  throw new Error("The ESM EXIF entry point is unavailable.");
}

renderToStaticMarkup(
  React.createElement(PhotoDetailsLightbox, {
    close() {},
    open: false,
    slides: [],
  }),
);
`,
  );

  await writeFile(
    path.join(stagingDirectory, "smoke.cjs"),
    `const library = require("${packageManifest.name}");
const exif = require("${packageManifest.name}/exif");

if (typeof library.PhotoDetailsLightbox !== "function") {
  throw new Error("The CommonJS component export is unavailable.");
}
if (!exif.isExifSourceSupported(new ArrayBuffer(0))) {
  throw new Error("The CommonJS EXIF entry point is unavailable.");
}
`,
  );

  await writeFile(
    path.join(stagingDirectory, "browser-smoke.mjs"),
    `import { JSDOM } from "jsdom";
import React from "react";
import { createRoot } from "react-dom/client";
import { act as domAct } from "react-dom/test-utils";

const dom = new JSDOM("<!doctype html><html><body><div id=\\"root\\"></div></body></html>", {
  url: "http://localhost/",
});

Object.defineProperties(globalThis, {
  document: { configurable: true, value: dom.window.document },
  Element: { configurable: true, value: dom.window.Element },
  Event: { configurable: true, value: dom.window.Event },
  getComputedStyle: {
    configurable: true,
    value: dom.window.getComputedStyle.bind(dom.window),
  },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  MouseEvent: { configurable: true, value: dom.window.MouseEvent },
  MutationObserver: {
    configurable: true,
    value: dom.window.MutationObserver,
  },
  navigator: { configurable: true, value: dom.window.navigator },
  Node: { configurable: true, value: dom.window.Node },
  window: { configurable: true, value: dom.window },
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
dom.window.matchMedia = () => ({
  addEventListener() {},
  addListener() {},
  matches: false,
  media: "",
  onchange: null,
  removeEventListener() {},
  removeListener() {},
});
let copiedUrl = "";
Object.defineProperty(dom.window.navigator, "clipboard", {
  configurable: true,
  value: {
    async writeText(value) {
      copiedUrl = value;
    },
  },
});

const act = React.act ?? domAct;
const { PhotoDetailsLightbox } = await import("${packageManifest.name}");
const container = document.getElementById("root");
const root = createRoot(container);

await act(async () => {
  root.render(
    React.createElement(PhotoDetailsLightbox, {
      close() {},
      defaultDetailLevel: "detailed",
      open: true,
      slides: [
        {
          alt: "Compatibility test photograph",
          height: 800,
          photoMetadata: { title: "Compatibility test" },
          src: "/compatibility.jpg",
          width: 1200,
        },
      ],
    }),
  );
});

const shareButton = document.querySelector('[aria-label="Share photo"]');
const zoomInButton = document.querySelector('[aria-label="Zoom in"]');
const zoomOutButton = document.querySelector('[aria-label="Zoom out"]');
const detailsButton = document.querySelector(
  '[data-testid="photo-details-button"]',
);
if (
  !shareButton ||
  !zoomInButton ||
  !zoomOutButton ||
  !detailsButton
) {
  throw new Error("The lightbox viewer actions did not mount in the DOM.");
}
if (document.querySelector('[data-testid="metadata-inspector"]')) {
  throw new Error("The photo details panel should start closed.");
}

await act(async () => {
  shareButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  await Promise.resolve();
});
if (copiedUrl !== "http://localhost/") {
  throw new Error("The Share control did not copy the safe page URL fallback.");
}

await act(async () => {
  detailsButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
});
const detailsPanel = document.querySelector(
  '[data-testid="metadata-inspector"]',
);
const detailsBody = document.querySelector(".rpdl__body");
const closeDetailsButton = document.querySelector(
  '[aria-label="Close photo details"]',
);
if (
  !detailsPanel ||
  !detailsBody ||
  !closeDetailsButton ||
  detailsBody.getAttribute("tabindex") !== "0"
) {
  throw new Error("The three-dot button did not open photo details directly.");
}
if (document.querySelector('[role="menu"]')) {
  throw new Error("The three-dot button unexpectedly opened a chooser menu.");
}

await act(async () => {
  closeDetailsButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
});
if (document.querySelector('[data-testid="metadata-inspector"]')) {
  throw new Error("The photo details close control did not hide the panel.");
}

await act(async () => root.unmount());
dom.window.close();
`,
  );

  run(
    "npm",
    ["install", "--ignore-scripts", "--no-audit", "--no-fund"],
    stagingDirectory,
  );

  const resolvedVersions = JSON.parse(
    run(
      "npm",
      [
        "ls",
        "--depth=0",
        "--json",
        packageManifest.name,
        "react",
        "react-dom",
        "yet-another-react-lightbox",
      ],
      stagingDirectory,
      { capture: true },
    ),
  ).dependencies;

  for (const [packageName, expectedVersion] of [
    ["react", reactVersion],
    ["react-dom", reactDomVersion],
    ["yet-another-react-lightbox", lightboxVersion],
  ]) {
    const actualVersion = resolvedVersions[packageName]?.version;
    if (actualVersion !== expectedVersion) {
      throw new Error(
        `Expected ${packageName}@${expectedVersion}, resolved ${actualVersion ?? "nothing"}.`,
      );
    }
  }

  run("node", ["smoke.mjs"], stagingDirectory);
  run("node", ["smoke.cjs"], stagingDirectory);
  run("node", ["browser-smoke.mjs"], stagingDirectory);
  run(
    "node",
    ["node_modules/typescript/bin/tsc", "--project", "tsconfig.json"],
    stagingDirectory,
  );

  console.log(
    `Compatibility passed with React ${reactVersion}, React DOM ${reactDomVersion}, and Yet Another React Lightbox ${lightboxVersion}.`,
  );
} finally {
  await rm(stagingDirectory, { recursive: true, force: true });
}
