// src/routing/adapters/next.ts
// Next.js App Router adapter for @ecodrix/erix-react.
// Pass this adapter to ErixModuleRouter so navigation uses next/navigation instead of
// window.history directly, keeping Next.js prefetching and Route Handlers working.
//
// Usage:
//   import { nextAdapter } from "@ecodrix/erix-react/adapters/next";
//   <ErixModuleRouter adapter={nextAdapter} routes={...} />

import type { RouterAdapter } from "./types";

/**
 * Creates a Next.js App Router adapter.
 * Call this inside a Client Component after importing from "next/navigation".
 *
 * @example
 * ```tsx
 * "use client";
 * import { useRouter, usePathname } from "next/navigation";
 * import { makeNextAdapter } from "@ecodrix/erix-react/adapters/next";
 *
 * export function MyLayout() {
 *   const router   = useRouter();
 *   const pathname = usePathname();
 *   const adapter  = makeNextAdapter(router, pathname);
 *
 *   return <ErixModuleRouter adapter={adapter} routes={...} />;
 * }
 * ```
 */
export function makeNextAdapter(
  router:       { push: (url: string) => void; replace: (url: string) => void; back: () => void },
  currentPath:  string,
): RouterAdapter {
  return {
    push:     (url) => router.push(url),
    replace:  (url) => router.replace(url),
    back:     ()    => router.back(),
    pathname: ()    => currentPath,
    listen:   (cb) => {
      // In Next.js App Router, the parent component re-renders with a new currentPath
      // on navigation — so we rely on ErixRouterProvider re-mounting with new props.
      // This listener is no-op; navigation events propagate via React re-renders.
      void cb;
      return () => {};
    },
  };
}
