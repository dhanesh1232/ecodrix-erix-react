// src/routing/adapters/window.ts
// Default adapter — uses window.history directly (framework-agnostic).
import type { RouterAdapter } from "./types";

export const windowAdapter: RouterAdapter = {
  push:     (url) => window.history.pushState(null, "", url),
  replace:  (url) => window.history.replaceState(null, "", url),
  back:     ()    => window.history.back(),
  pathname: ()    => window.location.pathname,
  listen:   (cb) => {
    const handler = () => cb(window.location.pathname);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  },
};
