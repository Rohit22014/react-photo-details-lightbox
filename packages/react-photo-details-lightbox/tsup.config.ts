import { defineConfig } from "tsup";
import { copyFile } from "node:fs/promises";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    exif: "src/exif.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  external: [
    "react",
    "react-dom",
    "yet-another-react-lightbox",
    "exifr",
  ],
  onSuccess: async () => {
    await copyFile("src/styles.css", "dist/styles.css");
  },
});
