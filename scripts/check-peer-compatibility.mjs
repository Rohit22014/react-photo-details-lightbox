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
import type { PhotoDetailsLightboxProps as RootProps } from "${packageManifest.name}";

const props: RootProps = {
  close() {},
  open: false,
  slides: [],
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
