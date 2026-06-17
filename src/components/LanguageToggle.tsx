import { useTranslation } from "../i18n/LanguageContext";

export default function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useTranslation();
  return (
    <button
      onClick={() => setLang(lang === "en" ? "es" : "en")}
      title={lang === "en" ? "Switch to Spanish" : "Cambiar a inglés"}
      className={`font-sans text-[10px] font-semibold tracking-[0.16em] uppercase transition-colors ${className}`}
    >
      {lang === "en" ? "ES" : "EN"}
    </button>
  );
}
