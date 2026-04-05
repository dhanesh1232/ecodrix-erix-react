"use client";
// src/i18n/useErixI18n.ts
import { useI18nContext } from "./I18nContext";

/**
 * Access the i18n translation function and locale controls.
 *
 * @example
 * ```tsx
 * const { t, locale, setLocale } = useErixI18n();
 *
 * <button>{t("crm.lead.create")}</button>
 * <button onClick={() => setLocale("hi")}>हिंदी</button>
 * ```
 */
export function useErixI18n() {
  return useI18nContext();
}
