import { type KeyboardEvent, useMemo, useState } from "react";
import { useApp } from "../../app/context";
import { getLvlInfo, lvlTitle, userAvatarBg, userAvatarLabel } from "../../domain/utils";
import type { User } from "../../types/app";

type LeaderboardTab = "geral" | "disc";

export default function LeaderboardScreen() {
  const { state, currentUser } = useApp();
  const { allUsers, disciplines, questions, perUser } = state;
  const [tab, setTab] = useState<LeaderboardTab>("geral");
  const [selDisc, setSelDisc] = useState(disciplines[0]?.name || "");
  const M = ["🥇", "🥈", "🥉"];
  
  const lb = useMemo(
    () =>
      [...allUsers].sort((a, b) =>
        b.pontuacao !== a.pontuacao
          ? b.pontuacao - a.pontuacao
          : a.respostasErradas - b.respostasErradas
      ),
    [allUsers],
  );
  
  const discsWithQ = useMemo(
    () => disciplines.filter((d) => questions.some((q) => q.disciplina === d.name)),
    [disciplines, questions],
  );

  const discLb = useMemo(() => [...allUsers].sort((a, b) => b.pontuacao - a.pontuacao), [allUsers]);

  const habitByUser = useMemo(() => {
    const countActiveDaysInRange = (dates: string[], startOffset: number, endOffset: number): number => {
      const now = new Date();
      let count = 0;
      for (let i = startOffset; i <= endOffset; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = d.toDateString();
        if (dates.includes(key)) count++;
      }
      return count;
    };

    return allUsers.reduce<Record<string, { recent: number; previous: number; trend: "subindo" | "estavel" | "caindo" }>>((acc, u) => {
      const sessions = perUser[u.id]?.sessions ?? [];
      const uniqueDates = Array.from(new Set(sessions.map((s) => new Date(s.date).toDateString())));
      const recent = countActiveDaysInRange(uniqueDates, 0, 6);
      const previous = countActiveDaysInRange(uniqueDates, 7, 13);
      const trend = recent >= previous + 2 ? "subindo" : previous >= recent + 2 ? "caindo" : "estavel";
      acc[u.id] = { recent, previous, trend };
      return acc;
    }, {});
  }, [allUsers, perUser]);

  const habitRecommendation = useMemo(() => {
    const declining = allUsers
      .map((u) => ({ user: u, habit: habitByUser[u.id] }))
      .filter((entry): entry is { user: User; habit: { recent: number; previous: number; trend: "subindo" | "estavel" | "caindo" } } => !!entry.habit && entry.habit.trend === "caindo")
      .sort((a, b) => (b.habit.previous - b.habit.recent) - (a.habit.previous - a.habit.recent));

    if (declining.length === 0) {
      return "📈 Habito coletivo estavel/subindo. Mantenha a consistencia semanal para segurar sua posicao no ranking.";
    }

    const top = declining[0];
    return `⚠️ Atencao: ${top.user.nome} caiu de ${top.habit.previous} para ${top.habit.recent} dias ativos. Sugestao: retomar com uma sessao curta diaria nesta semana.`;
  }, [allUsers, habitByUser]);

  function handleTabKeyNavigation(e: KeyboardEvent<HTMLButtonElement>, current: LeaderboardTab): void {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setTab(current === "geral" ? "disc" : "geral");
  }

  const Row = ({ u, i }: { u: User; i: number }) => {
    const li = getLvlInfo(u.pontuacao);
    const isMe = currentUser && u.id === currentUser.id;
    const habit = habitByUser[u.id] ?? { recent: 0, previous: 0, trend: "estavel" as const };
    return (
      <div className={`lbrow ${isMe ? "me" : ""}`}>
        <span className={`lbrnk ${i === 0 ? "rnk1" : i === 1 ? "rnk2" : i === 2 ? "rnk3" : ""}`}>
          {i < 3 ? M[i] : i + 1}
        </span>
        <div className="av" style={{ width: 36, height: 36, background: userAvatarBg(u), fontSize: 13, color: "#fff" }}>
          {userAvatarLabel(u)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            {u.nome}
            {isMe && (
              <span className="badge-pill bp" style={{ fontSize: 9 }}>
                Voce
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "var(--txd)" }}>
            Nivel {li.level} - {lvlTitle(li.level)}
          </div>
          <div style={{ fontSize: 11, color: "var(--txd)" }}>
            Habito 7d: {habit.recent} dias ({habit.trend})
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="SY" style={{ fontWeight: 800, fontSize: "1rem", color: "var(--sec)" }}>
            {u.pontuacao.toLocaleString("pt-BR")}
          </div>
          <div style={{ fontSize: 11, color: "var(--txd)" }}>
            {u.respostasCertas}✅ {u.respostasErradas}❌
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pg fade">
      <h1 className="SY" style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 4 }}>
        🏆 Ranking
      </h1>
      <p className="ptx" style={{ marginBottom: 18 }}>
        Por pontuacao - Desempate: menos erros
      </p>
      <div className="tabs" role="tablist" aria-label="Abas do ranking">
        <button id="leaderboard-tab-geral" role="tab" aria-selected={tab === "geral"} aria-controls="leaderboard-panel-geral" tabIndex={tab === "geral" ? 0 : -1} className={`tab ${tab === "geral" ? "on" : ""}`} onClick={() => setTab("geral")} onKeyDown={(e) => handleTabKeyNavigation(e, "geral")}>
          🌐 Geral
        </button>
        <button id="leaderboard-tab-disc" role="tab" aria-selected={tab === "disc"} aria-controls="leaderboard-panel-disc" tabIndex={tab === "disc" ? 0 : -1} className={`tab ${tab === "disc" ? "on" : ""}`} onClick={() => setTab("disc")} onKeyDown={(e) => handleTabKeyNavigation(e, "disc")}>
          📚 Por Disciplina
        </button>
      </div>
      <div className="card" style={{ background: "var(--surf)", padding: 12, marginBottom: 12, borderRadius: 12 }}>
        <p style={{ fontSize: 12, color: "var(--txd)" }}>
          {habitRecommendation}
        </p>
      </div>
      {tab === "geral" && <div id="leaderboard-panel-geral" role="tabpanel" aria-labelledby="leaderboard-tab-geral">{lb.map((u, i) => <Row key={u.id} u={u} i={i} />)}</div>}
      {tab === "disc" && (
        <div id="leaderboard-panel-disc" role="tabpanel" aria-labelledby="leaderboard-tab-disc">
          <div style={{ marginBottom: 16 }}>
            <label className="lbl" htmlFor="leaderboard-disc-select">Filtrar por Disciplina</label>
            <select id="leaderboard-disc-select" className="inp" value={selDisc} onChange={(e) => setSelDisc(e.target.value)}>
              {discsWithQ.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.icon} {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="card" style={{ background: "var(--surf)", padding: 12, marginBottom: 16, borderRadius: 12 }}>
            <p style={{ fontSize: 12, color: "var(--txd)" }}>
              💡 Ranking por disciplina usa a pontuacao geral. Em versao com backend, refletiria acertos especificos por materia.
            </p>
          </div>
          {discLb.map((u, i) => (
            <Row key={u.id} u={u} i={i} />
          ))}
        </div>
      )}
    </div>
  );
}
