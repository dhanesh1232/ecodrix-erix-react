// tsup.config.ts
import { createRequire } from "node:module";
import { defineConfig } from "tsup";

const localRequire = createRequire(import.meta.url);
const pkg = localRequire("./package.json");

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];
const define = { "process.env.NODE_ENV": JSON.stringify("production") };

// ESM-only build — React 19 / Next.js App Router is ESM-only.
// Shipping CJS doubles the package size with no practical benefit.
export default defineConfig({
  entry: {
    index: "src/index.ts",
    crm: "src/crm.ts",
    analytics: "src/analytics.ts",
    whatsapp: "src/whatsapp.ts",
    marketing: "src/marketing.ts",
    meetings: "src/meetings.ts",
    dashboard: "src/dashboard.ts",
    editor: "src/editor.ts",
  },
  format: ["esm"],
  outDir: "dist/es",
  treeshake: true,
  sourcemap: false,
  clean: true,
  minify: true,
  splitting: true,
  dts: {
    resolve: true,
    compilerOptions: {
      baseUrl: ".",
      typeRoots: ["./src/types", "./node_modules/@types"],
    },
  },
  external,
  define,
  esbuildOptions(o) {
    o.assetNames = "globals";
    o.banner = {
      js: '"use client";',
    };
  },
});
