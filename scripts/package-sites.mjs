import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { cp, mkdir, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse, printParseErrorCode } from "jsonc-parser";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDirectory, "..");
const docsDirectory = path.join(workspaceRoot, "apps", "docs");
const finalWorker = path.join(docsDirectory, ".sites-worker", "worker.js");
const assetsDirectory = path.join(docsDirectory, ".open-next", "assets");
const wranglerConfig = path.join(docsDirectory, "wrangler.jsonc");
const hostingConfig = path.join(workspaceRoot, ".openai", "hosting.json");
const outputPath = path.resolve(
  process.argv[2] ?? path.join(tmpdir(), "photo-details-lightbox-sites.tar.gz"),
);

await Promise.all([
  stat(finalWorker),
  stat(assetsDirectory),
  stat(wranglerConfig),
  stat(hostingConfig),
]);

const [workerSource, wranglerSource, hostingSource] = await Promise.all([
  readFile(finalWorker, "utf8"),
  readFile(wranglerConfig, "utf8"),
  readFile(hostingConfig, "utf8"),
]);

if (Buffer.byteLength(workerSource) < 500_000) {
  throw new Error(
    "The Sites worker is unexpectedly small. Run `npm run build:sites` so Wrangler performs its final bundling pass.",
  );
}

if (/\brequire\((["'])(?:fs|path|async_hooks|module)\1\)/.test(workerSource)) {
  throw new Error(
    "The final Worker still contains a raw CommonJS Node.js require.",
  );
}

if (
  workerSource.includes('from "./') ||
  workerSource.includes("from './") ||
  workerSource.includes('import("./') ||
  workerSource.includes("import('./")
) {
  throw new Error(
    "The final Worker still contains an unresolved relative module import.",
  );
}

const wranglerParseErrors = [];
const wrangler = parse(wranglerSource, wranglerParseErrors, {
  allowTrailingComma: true,
});

if (wranglerParseErrors.length > 0) {
  const details = wranglerParseErrors
    .map(
      ({ error, offset }) =>
        `${printParseErrorCode(error)} at character ${offset}`,
    )
    .join(", ");
  throw new Error(`wrangler.jsonc could not be parsed: ${details}.`);
}

if (
  wrangler.main !== ".open-next/worker.js" ||
  wrangler.assets?.directory !== ".open-next/assets" ||
  !wrangler.compatibility_flags?.includes("nodejs_compat")
) {
  throw new Error("wrangler.jsonc does not match the Sites archive layout.");
}

const hosting = JSON.parse(hostingSource);
if (typeof hosting.project_id !== "string" || hosting.project_id.length === 0) {
  throw new Error(".openai/hosting.json is missing its Sites project_id.");
}

const stagingDirectory = await mkdtemp(
  path.join(tmpdir(), "photo-details-lightbox-sites-"),
);

try {
  await Promise.all([
    mkdir(path.join(stagingDirectory, ".open-next"), { recursive: true }),
    mkdir(path.join(stagingDirectory, ".openai"), { recursive: true }),
  ]);

  await Promise.all([
    cp(finalWorker, path.join(stagingDirectory, ".open-next", "worker.js")),
    cp(assetsDirectory, path.join(stagingDirectory, ".open-next", "assets"), {
      recursive: true,
    }),
    cp(wranglerConfig, path.join(stagingDirectory, "wrangler.jsonc")),
    cp(hostingConfig, path.join(stagingDirectory, ".openai", "hosting.json")),
  ]);

  const archive = spawnSync(
    "tar",
    ["-czf", outputPath, "-C", stagingDirectory, "."],
    { stdio: "inherit" },
  );

  if (archive.error) throw archive.error;
  if (archive.status !== 0) {
    throw new Error(`tar exited with status ${archive.status}.`);
  }
} finally {
  await rm(stagingDirectory, { recursive: true, force: true });
}

const digest = createHash("sha256");
for await (const chunk of createReadStream(outputPath)) {
  digest.update(chunk);
}

const archiveStats = await stat(outputPath);
console.log(
  JSON.stringify(
    {
      archive: outputPath,
      bytes: archiveStats.size,
      sha256: digest.digest("hex"),
    },
    null,
    2,
  ),
);
