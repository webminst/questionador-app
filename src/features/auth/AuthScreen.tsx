import { type ChangeEvent, type Dispatch, type KeyboardEvent, type SetStateAction, useState } from "react";
import { pwdStrength, validateEmail } from "../../domain/utils";
import type { AuthForm, AuthMode, PwdStrength } from "../../types/app";

type AuthScreenProps = {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  form: AuthForm;
  setForm: Dispatch<SetStateAction<AuthForm>>;
  onLogin: () => void;
  onRegister: () => void;
};

export default function AuthScreen({ mode, setMode, form, setForm, onLogin, onRegister }: AuthScreenProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof AuthForm, string>>>({});

  function handleTabKeyNavigation(e: KeyboardEvent<HTMLButtonElement>, current: AuthMode): void {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setMode(current === "login" ? "register" : "login");
  }

  const s = (k: keyof AuthForm) => (e: ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((ev) => ({ ...ev, [k]: undefined }));
  };

  const pwd: PwdStrength = form.password
    ? pwdStrength(form.password)
    : { score: 0, valid: false, checks: { length: false, upper: false, number: false } };

  function validate() {
    const e: Partial<Record<keyof AuthForm, string>> = {};
    if (!validateEmail(form.email)) e.email = "E-mail inválido";
    if (mode === "register") {
      if (!form.name?.trim()) e.name = "Nome obrigatório";
      if (!pwd.valid) e.password = "Senha fraca (mín. 8 chars, 1 maiúscula, 1 número)";
    } else {
      if (!form.password) e.password = "Informe a senha";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card fade">
        <div className="row" style={{ gap: 10, marginBottom: 26 }}>
          <div className="logo-icon">❓</div><span className="logo-tx">Questionador</span>
        </div>
        <div className="tabs" role="tablist" aria-label="Modos de autenticacao">
          <button
            id="auth-tab-login"
            role="tab"
            aria-selected={mode === "login"}
            aria-controls="auth-panel"
            tabIndex={mode === "login" ? 0 : -1}
            className={`tab ${mode === "login" ? "on" : ""}`}
            onClick={() => { setMode("login"); setErrors({}); }}
            onKeyDown={(e) => handleTabKeyNavigation(e, "login")}
          >
            Entrar
          </button>
          <button
            id="auth-tab-register"
            role="tab"
            aria-selected={mode === "register"}
            aria-controls="auth-panel"
            tabIndex={mode === "register" ? 0 : -1}
            className={`tab ${mode === "register" ? "on" : ""}`}
            onClick={() => { setMode("register"); setErrors({}); }}
            onKeyDown={(e) => handleTabKeyNavigation(e, "register")}
          >
            Cadastrar
          </button>
        </div>
        <div id="auth-panel" role="tabpanel" aria-labelledby={mode === "login" ? "auth-tab-login" : "auth-tab-register"}>
        {mode === "register" && (
          <div style={{ marginBottom: 12 }}>
            <label className="lbl" htmlFor="auth-name">Nome completo</label>
            <input id="auth-name" className={`inp ${errors.name ? "err-inp" : ""}`} placeholder="Seu nome" value={form.name || ""} onChange={s("name")} />
            {errors.name && <div className="err-msg">{errors.name}</div>}
          </div>
        )}
        <div style={{ marginBottom: 12 }}>
          <label className="lbl" htmlFor="auth-email">E-mail</label>
          <input
            id="auth-email"
            className={`inp ${errors.email ? "err-inp" : form.email && validateEmail(form.email) ? "ok-inp" : ""}`}
            type="email"
            placeholder="seu@email.com"
            value={form.email || ""}
            onChange={s("email")}
          />
          {errors.email && <div className="err-msg">{errors.email}</div>}
        </div>
        <div style={{ marginBottom: mode === "register" ? 8 : 20 }}>
          <label className="lbl" htmlFor="auth-password">Senha</label>
          <input
            id="auth-password"
            className={`inp ${errors.password ? "err-inp" : ""}`}
            type="password"
            placeholder="••••••••"
            value={form.password || ""}
            onChange={s("password")}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && (validate() && (mode === "login" ? onLogin() : onRegister()))}
          />
          {errors.password && <div className="err-msg">{errors.password}</div>}
        </div>
        {mode === "register" && form.password && (
          <div style={{ marginBottom: 18 }}>
            <div className="row" style={{ gap: 4, marginBottom: 6 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="pwd-bar" style={{ background: pwd.score > i ? (pwd.score === 1 ? "var(--err)" : pwd.score === 2 ? "var(--sec)" : "var(--ok)") : "var(--bdr)" }} />
              ))}
              <span style={{ fontSize: 11, color: "var(--txd)", marginLeft: 6, whiteSpace: "nowrap" }}>
                {pwd.score === 0 ? "Muito fraca" : pwd.score === 1 ? "Fraca" : pwd.score === 2 ? "Boa" : "Forte"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {([
                { key: "length", label: "8+ chars" },
                { key: "upper", label: "Maiúscula" },
                { key: "number", label: "Número" },
              ] as const).map(({ key, label }) => (
                <span key={key} style={{ fontSize: 11, color: pwd.checks[key] ? "var(--ok)" : "var(--txm)" }}>
                  {pwd.checks[key] ? "✓" : "○"} {label}
                </span>
              ))}
            </div>
          </div>
        )}
        <button className="btn btn-p btn-w" style={{ marginBottom: 14 }} onClick={() => validate() && (mode === "login" ? onLogin() : onRegister())}>
          {mode === "login" ? "🚀 Entrar" : "✨ Criar Conta"}
        </button>
        {mode === "login" && <>
          <div className="div-line">ou continue com</div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-s btn-w" style={{ flex: 1, fontSize: 13 }} onClick={() => alert("Em breve!")}>🔵 Google</button>
            <button className="btn btn-s btn-w" style={{ flex: 1, fontSize: 13 }} onClick={() => alert("Em breve!")}>🔷 Facebook</button>
          </div>
          <p style={{ fontSize: 11, color: "var(--txd)", marginTop: 14, textAlign: "center" }}>Demo: <strong style={{ color: "var(--tx)" }}>ana@demo.com</strong> / <strong style={{ color: "var(--tx)" }}>123456</strong></p>
        </>}
        </div>
      </div>
    </div>
  );
}
