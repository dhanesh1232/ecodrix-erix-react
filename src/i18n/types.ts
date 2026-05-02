// src/i18n/types.ts
export type ErixLocale =
  | "en"
  | "hi"
  | "ar"
  | "es"
  | "fr"
  | "pt"
  | "tel"
  | "tam";

export type ErixTranslations = typeof import("./locales/en").en;

export interface I18nContextValue {
  locale: ErixLocale;
  t: (key: string, vars?: Record<string, string | number>) => string;
  setLocale: (locale: ErixLocale) => void;
}
