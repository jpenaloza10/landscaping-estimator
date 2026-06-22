import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";
import { useTranslation } from "../i18n/LanguageContext";

export default function Account() {
  const { t } = useTranslation();
  const { user, setAuth, signOut } = useAuth();
  const navigate = useNavigate();

  // ── Display name edit ──────────────────────────────────────────────────────
  const [name, setName]       = useState(user?.name ?? "");
  const [nameMsg, setNameMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [nameBusy, setNameBusy] = useState(false);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setNameBusy(true);
    setNameMsg(null);
    try {
      const updated = await api<{ user: { id: number; name: string; email: string } }>(
        "/api/auth/profile",
        { method: "PATCH", body: { name: name.trim() } }
      );
      // Refresh stored user with new name
      setAuth(localStorage.getItem("authToken"), updated.user);
      setNameMsg({ text: t("account.nameUpdated"), ok: true });
    } catch (e: unknown) {
      setNameMsg({ text: e instanceof Error ? e.message : t("account.updateFailed"), ok: false });
    } finally {
      setNameBusy(false);
    }
  }

  // ── Change password ────────────────────────────────────────────────────────
  const [currentPw, setCurrentPw]   = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [pwMsg, setPwMsg]           = useState<{ text: string; ok: boolean } | null>(null);
  const [pwBusy, setPwBusy]         = useState(false);

  async function handleChangePw(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) {
      setPwMsg({ text: t("account.passwordsNoMatch"), ok: false });
      return;
    }
    if (newPw.length < 8) {
      setPwMsg({ text: t("account.passwordTooShort"), ok: false });
      return;
    }
    setPwBusy(true);
    setPwMsg(null);
    try {
      await api("/api/auth/change-password", {
        method: "POST",
        body: { currentPassword: currentPw, newPassword: newPw },
      });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setPwMsg({ text: t("account.passwordChanged"), ok: true });
    } catch (e: unknown) {
      setPwMsg({ text: e instanceof Error ? e.message : t("account.changeFailed"), ok: false });
    } finally {
      setPwBusy(false);
    }
  }

  // ── Sign out ───────────────────────────────────────────────────────────────
  async function handleSignOut() {
    await signOut();
    navigate("/", { replace: true });
  }

  const labelClass = "block font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-brand-cream-dim mb-2";

  return (
    <div className="max-w-lg space-y-6">
      {/* Header */}
      <div>
        <p className="brand-eyebrow mb-1">{t("account.eyebrow")}</p>
        <h1 className="font-serif text-4xl font-black italic text-brand-cream">{t("account.title")}</h1>
      </div>

      {/* ── Profile info ── */}
      <div className="brand-card">
        <p className="brand-eyebrow mb-4">{t("account.profileSection")}</p>

        {/* Avatar initials */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-brand-orange flex items-center justify-center shrink-0">
            <span className="font-sans text-xl font-bold text-white">
              {(user?.name ?? user?.email ?? "?").slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-serif text-lg font-bold italic text-brand-cream">
              {user?.name || "—"}
            </p>
            <p className="font-sans text-xs text-brand-cream-dim mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Edit name */}
        <form onSubmit={handleSaveName} className="space-y-4">
          <div>
            <label className={labelClass}>{t("account.displayName")}</label>
            <input
              className="brand-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={80}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={nameBusy || !name.trim() || name.trim() === user?.name}
              className="btn-brand-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {nameBusy ? t("account.saving") : t("account.saveNameBtn")}
            </button>
            {nameMsg && (
              <p className={`font-sans text-xs ${nameMsg.ok ? "text-emerald-400" : "text-brand-orange"}`}>
                {nameMsg.text}
              </p>
            )}
          </div>
        </form>
      </div>

      {/* ── Change password ── */}
      <div className="brand-card">
        <p className="brand-eyebrow mb-4">{t("account.passwordSection")}</p>
        <form onSubmit={handleChangePw} className="space-y-4">
          <div>
            <label className={labelClass}>{t("account.currentPassword")}</label>
            <input
              type="password"
              className="brand-input"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className={labelClass}>{t("account.newPassword")}</label>
            <input
              type="password"
              className="brand-input"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Min 8 characters"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className={labelClass}>{t("account.confirmNewPassword")}</label>
            <input
              type="password"
              className="brand-input"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pwBusy || !currentPw || !newPw || !confirmPw}
              className="btn-brand-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pwBusy ? t("account.changing") : t("account.changePasswordBtn")}
            </button>
            {pwMsg && (
              <p className={`font-sans text-xs ${pwMsg.ok ? "text-emerald-400" : "text-brand-orange"}`}>
                {pwMsg.text}
              </p>
            )}
          </div>
        </form>
      </div>

      {/* ── Session ── */}
      <div className="brand-card">
        <p className="brand-eyebrow mb-4">{t("account.sessionSection")}</p>
        <p className="font-sans text-xs text-brand-cream-dim mb-4">
          {t("account.signedInAs")} <span className="text-brand-cream">{user?.email}</span>
        </p>
        <button onClick={handleSignOut} className="btn-brand-outline text-brand-orange border-brand-orange/40 hover:border-brand-orange">
          {t("account.signOut")}
        </button>
      </div>
    </div>
  );
}
