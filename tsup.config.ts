// tsup.config.ts
import { defineConfig } from "tsup";

const external = ["react", "react-dom"] as string[];
const define = { "process.env.NODE_ENV": JSON.stringify("production") };

export default defineConfig([
  // --- ESM build ---
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    outDir: "dist/es",
    sourcemap: true,
    clean: true,
    minify: false,
    dts: {
      resolve: true,
      entry: "src/index.ts",
      compilerOptions: {
        baseUrl: ".",
        typeRoots: ["./src/types", "./node_modules/@types"],
      },
    },
    external,
    define,
    esbuildOptions(o) {
      o.assetNames = "globals";
    },
  },

  // --- CJS build ---
  {
    entry: ["src/index.ts"],
    format: ["cjs"],
    outDir: "dist/cjs",
    sourcemap: true,
    dts: false,
    clean: false,
    minify: false,
    external,
    define,
    esbuildOptions(o) {
      o.assetNames = "globals";
    },
  },

  // --- IIFE / UMD build ---
  {
    entry: ["src/index.ts"],
    format: ["iife"],
    outDir: "dist/umd",
    sourcemap: true,
    minify: true,
    dts: false,
    globalName: "ErixRichtext",
    clean: false,
    external,
    define,
    esbuildOptions(o) {
      o.globalName = "ErixRichtext";
      o.assetNames = "globals";
    },
  },
]);
