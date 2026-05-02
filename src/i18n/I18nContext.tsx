"use client";
// src/i18n/I18nContext.tsx
import * as React from "react";
import { en } from "./locales/en";
import type { ErixLocale, I18nContextValue } from "./types";

const LOCALE_LOADERS: Record<ErixLocale, () => Promise<{ [k: string]: string }>> = {
  en: async () => en as any,
  hi: async () => (await import("./locales/hi")).hi as any,
  ar: async () => ({ "common.loading": "جار التحميل…", "common.save": "حفظ", "crm.leads": "العملاء المحتملون" }),
  es: async () => ({ "common.loading": "Cargando…", "common.save": "Guardar", "crm.leads": "Clientes potenciales", "wa.send": "Enviar" }),
  fr: async () => ({ "common.loading": "Chargement…", "common.save": "Enregistrer", "crm.leads": "Prospects", "wa.send": "Envoyer" }),
  pt: async () => ({ "common.loading": "Carregando…", "common.save": "Salvar", "crm.leads": "Contatos", "wa.send": "Enviar" }),
  tel: async () => ({ "common.loading": "లోడ్ అవుతోంది…", "common.save": "సేవ్ చేయండి", "crm.leads": "లీడ్స్", "wa.send": "పంపు" }),
  tam: async () => ({ "common.loading": "ஏற்றுகிறது…", "common.save": "சேமி", "crm.leads": "லீட்ஸ்", "wa.send": "அனுப்பு" }),
};

const I18nCtx = React.createContext<I18nContextValue | null>(null);

export function useI18nContext(): I18nContextValue {
  const ctx = React.useContext(I18nCtx);
  if (!ctx) throw new Error("useErixI18n must be inside ErixI18nProvider");
  return ctx;
}

export interface ErixI18nProviderProps {
  locale?:   ErixLocale;
  children:  React.ReactNode;
}

export function ErixI18nProvider({ locale: initialLocale = "en", children }: ErixI18nProviderProps) {
  const [locale, setLocale] = React.useState<ErixLocale>(initialLocale);
  const [messages, setMessages] = React.useState<Record<string, string>>(en as any);

  React.useEffect(() => {
    LOCALE_LOADERS[locale]?.().then((msgs) => {
      // Merge with English fallback so missing keys still render
      setMessages({ ...(en as any), ...msgs });
    });
  }, [locale]);

  const t = React.useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      let str = messages[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v));
        }
      }
      return str;
    },
    [messages],
  );

  const value = React.useMemo<I18nContextValue>(
    () => ({ locale, t, setLocale }),
    [locale, t],
  );

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}
