import { useEffect, useRef, useState } from "react";
import {
  signLogoUpload,
  uploadLogoFile,
  commitLogo,
  getLogo,
  deleteLogo,
} from "../lib/api";
import { useTranslation } from "../i18n/LanguageContext";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg"];

export default function LogoUpload() {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getLogo()
      .then((info) => {
        if (!cancelled) setUrl(info.url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setMsg({ text: t("account.logoWrongType"), ok: false });
      return;
    }
    if (file.size > MAX_BYTES) {
      setMsg({ text: t("account.logoTooLarge"), ok: false });
      return;
    }

    setBusy(true);
    setMsg(null);
    try {
      const sign = await signLogoUpload(file.name, file.type);
      await uploadLogoFile(sign.signedUrl, file);
      const info = await commitLogo(sign.path);
      setUrl(info.url);
      setMsg({ text: t("account.logoUpdated"), ok: true });
    } catch (e: unknown) {
      setMsg({
        text: e instanceof Error ? e.message : t("account.logoUploadFailed"),
        ok: false,
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setBusy(true);
    setMsg(null);
    try {
      await deleteLogo();
      setUrl(null);
      setMsg({ text: t("account.logoRemoved"), ok: true });
    } catch (e: unknown) {
      setMsg({
        text: e instanceof Error ? e.message : t("account.logoUploadFailed"),
        ok: false,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-32 h-16 rounded border border-brand-cream-dim/30 bg-white/5 flex items-center justify-center overflow-hidden shrink-0">
          {url ? (
            <img src={url} alt="Company logo" className="max-w-full max-h-full object-contain" />
          ) : (
            <span className="font-sans text-[10px] uppercase tracking-widest text-brand-cream-dim">
              {t("account.noLogo")}
            </span>
          )}
        </div>
        <p className="font-sans text-xs text-brand-cream-dim">{t("account.logoHint")}</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="btn-brand-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy
            ? t("account.logoUploading")
            : url
            ? t("account.replaceLogo")
            : t("account.uploadLogo")}
        </button>
        {url && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleRemove()}
            className="btn-brand-outline text-brand-orange border-brand-orange/40 hover:border-brand-orange disabled:opacity-40"
          >
            {t("account.removeLogo")}
          </button>
        )}
        {msg && (
          <p className={`font-sans text-xs ${msg.ok ? "text-emerald-400" : "text-brand-orange"}`}>
            {msg.text}
          </p>
        )}
      </div>
    </div>
  );
}
