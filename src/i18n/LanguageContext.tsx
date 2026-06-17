import { createContext, useContext, useState, type ReactNode } from "react";
import { en, type Translations } from "./en";
import { es } from "./es";

export type Lang = "en" | "es";

const TRANSLATIONS: Record<Lang, Translations> = { en, es };

// Deeply access a nested object by dot-path, e.g. "nav.menu"
function getPath(obj: unknown, path: string): string {
  const result = path.split(".").reduce<unknown>((acc, key) => {
    if (acc !== null && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
  return typeof result === "string" ? result : path;
}

// Replace {{key}} placeholders with values
function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{{${k}}}`, String(v)),
    str
  );
}

type TFunction = (key: string, vars?: Record<string, string | number>) => string;

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: TFunction;
}

const LangContext = createContext<LangContextValue>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Persist language choice across page refreshes
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    return saved === "es" ? "es" : "en";
  });

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("lang", l);
  }

  const t: TFunction = (key, vars) => {
    const raw = getPath(TRANSLATIONS[lang], key);
    return interpolate(raw, vars);
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LangContext);
}
