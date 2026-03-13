import { defineConfig } from "tsdown";

const OUT_DIR = "build";
const TARGET_PLATFORM = "node";
const TARGET_FORMAT = "esm";

export default defineConfig([
  {
    entry: ["./src/main.ts"],
    outDir: OUT_DIR,
    platform: TARGET_PLATFORM,
    format: TARGET_FORMAT,
  },
]);
