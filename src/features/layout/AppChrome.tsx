import { memo } from "react";
import { NAV_ITEMS } from "../../domain/constants";
import { lvlTitle, userAvatarBg, userAvatarLabel } from "../../domain/utils";
import type { LvlInfo, Screen, Streak, User } from "../../types/app";

type NavBarProps = {
  screen: Screen;
  setScreen: (s: Screen) => void;
  theme: "light" | "dark";
  themePreference: "system" | "light" | "dark";
  onToggleTheme: () => void;
  onLogout: () => void;
};
type StatsBarProps = { user: User; li: LvlInfo; streak: Streak };
type BottomNavProps = { screen: Screen; setScreen: (s: Screen) => void };

export const NavBar = memo(function NavBar({ screen, setScreen, theme, themePreference, onToggleTheme, onLogout }: NavBarProps) {
  const themeLabel = themePreference === "system"
    ? `🖥️ Sistema (${theme === "dark" ? "Escuro" : "Claro"})`
    : themePreference === "dark"
      ? "🌙 Escuro"
      : "☀️ Claro";

  return (
    <nav className="nav" aria-label="Navegacao principal">
      <button
        type="button"
        className="row"
        style={{ gap: 10, cursor: "pointer", background: "transparent", border: "none", padding: 0 }}
        onClick={() => setScreen("home")}
        aria-label="Ir para tela inicial"
      >
        <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,var(--pri),#ff9a5c)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>❓</div>
        <span className="SY" style={{ fontWeight: 800, fontSize: "1rem" }}>Questionador</span>
      </button>
      <div className="nav-right desk-nav">
        {NAV_ITEMS.map(([id, ic, lb]) => (
          <button
            key={id}
            className="btn btn-sm"
            style={screen === id ? { color: "var(--pri)", background: "var(--pri-d)" } : { color: "var(--txd)", background: "transparent" }}
            onClick={() => setScreen(id)}
            aria-current={screen === id ? "page" : undefined}
            aria-label={`Ir para ${lb}`}
          >
            {ic} {lb}
          </button>
        ))}
        <button className="btn btn-sm btn-g" onClick={onToggleTheme} aria-label={`Alternar tema. Modo atual: ${themeLabel}`}>{themeLabel}</button>
        <button className="btn btn-sm btn-danger" onClick={onLogout} aria-label="Encerrar sessao">Sair</button>
      </div>
    </nav>
  );
});

export const StatsBar = memo(function StatsBar({ user, li, streak }: StatsBarProps) {
  const pct = Math.min(100, Math.round((li.progress / li.needed) * 100));
  return (
    <div className="sstrip">
      <div className="row" style={{ gap: 8 }}>
        <div className="av" style={{ width: 30, height: 30, background: userAvatarBg(user), fontSize: 12, color: "#fff" }} aria-hidden="true">{userAvatarLabel(user)}</div>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{user.nome.split(" ")[0]}</span>
      </div>
      <div className="row" style={{ gap: 4 }}><span className="slbl">Nivel</span><span className="sval" style={{ color: "var(--sec)" }}>{li.level}</span><span style={{ fontSize: 10, color: "var(--txd)" }}>({lvlTitle(li.level)})</span></div>
      <div className="row" style={{ gap: 4 }}><div className="lvlbar"><div className="lvlfill" style={{ width: `${pct}%` }} /></div><span style={{ fontSize: 11, color: "var(--txd)" }}>{li.progress}/{li.needed}</span></div>
      <div className="row" style={{ gap: 4 }}><span className="slbl">Pts</span><span className="sval" style={{ color: "var(--pri)" }}>{user.pontuacao.toLocaleString("pt-BR")}</span></div>
      {streak?.count > 0 && <div className="row" style={{ gap: 4 }}><span style={{ fontSize: 14 }}>🔥</span><span className="sval" style={{ color: "var(--sec)" }}>{streak.count}</span><span style={{ fontSize: 11, color: "var(--txd)" }}>dias</span></div>}
      <div className="row" style={{ gap: 4 }}><span className="slbl">✅</span><span className="sval" style={{ color: "var(--ok)" }}>{user.respostasCertas}</span><span className="slbl" style={{ marginLeft: 6 }}>❌</span><span className="sval" style={{ color: "var(--err)" }}>{user.respostasErradas}</span></div>
    </div>
  );
});

export function BottomNav({ screen, setScreen }: BottomNavProps) {
  return (
    <nav className="bnav" aria-label="Navegacao inferior">
      {NAV_ITEMS.map(([id, ic, lb]) => (
        <button
          key={id}
          className={`bnav-btn ${screen === id ? "on" : ""}`}
          onClick={() => setScreen(id)}
          aria-current={screen === id ? "page" : undefined}
          aria-label={`Ir para ${lb}`}
        >
          <span style={{ fontSize: 18 }}>{ic}</span>{lb}
        </button>
      ))}
    </nav>
  );
}
