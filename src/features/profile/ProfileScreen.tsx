import { type KeyboardEvent, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApp } from "../../app/context";
import { BADGES, COLOR_LIST, EMOJI_LIST } from "../../domain/constants";
import { getPU } from "../../domain/state";
import { discLookup, fmtTime, getLvlInfo, lvlTitle, todayStr, userAvatarBg, userAvatarLabel } from "../../domain/utils";

type HistoryRange = "7" | "30" | "90" | "all";
type AccuracyChartType = "bar" | "line";
type ProfileTab = "stats" | "badges" | "streak" | "history";
type SessionOrder = "recent" | "oldest";
type HeatmapDay = { date: string; count: number; intensity: number; dayLabel: string; dayOfMonth: number };
type LevelDotPayload = { isAnnotated?: boolean };
type LevelDotProps = { cx?: number; cy?: number; payload?: LevelDotPayload };
const HISTORY_RANGE_KEY_PREFIX = "profileHistoryRange";
const ACCURACY_CHART_TYPE_KEY_PREFIX = "profileAccuracyChartType";

function isHistoryRange(v: string | null): v is HistoryRange {
  return v === "7" || v === "30" || v === "90" || v === "all";
}

function isAccuracyChartType(v: string | null): v is AccuracyChartType {
  return v === "bar" || v === "line";
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (str.includes(";") || str.includes("\"") || str.includes("\n")) {
    return `"${str.replaceAll("\"", "\"\"")}"`;
  }
  return str;
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const csv = [headers, ...rows].map((line) => line.map((cell) => escapeCsvCell(cell)).join(";")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

type ProfileScreenProps = {
  onUpdateProfile: (input: { name: string; email: string; avatarEmoji?: string; avatarColor?: string; currentPassword?: string; newPassword?: string }) => boolean;
};

export default function ProfileScreen({ onUpdateProfile }: ProfileScreenProps) {
  const { state, currentUser, uid } = useApp();
  const [tab, setTab] = useState<ProfileTab>("stats");
  const [editName, setEditName] = useState(() => currentUser?.nome ?? "");
  const [editEmail, setEditEmail] = useState(() => currentUser?.email ?? "");
  const [editAvatarEmoji, setEditAvatarEmoji] = useState(() => currentUser?.avatarEmoji ?? "");
  const [editAvatarColor, setEditAvatarColor] = useState(() => currentUser?.avatarColor ?? "");
  const [editCurrentPassword, setEditCurrentPassword] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [historyRange, setHistoryRange] = useState<HistoryRange>(() => {
    if (typeof window === "undefined") return "30";
    const stored = window.localStorage.getItem(`${HISTORY_RANGE_KEY_PREFIX}:${uid || "anon"}`);
    return isHistoryRange(stored) ? stored : "30";
  });
  const [accuracyChartType, setAccuracyChartType] = useState<AccuracyChartType>(() => {
    if (typeof window === "undefined") return "bar";
    const stored = window.localStorage.getItem(`${ACCURACY_CHART_TYPE_KEY_PREFIX}:${uid || "anon"}`);
    return isAccuracyChartType(stored) ? stored : "bar";
  });
  const [showLevelTable, setShowLevelTable] = useState(false);
  const [showAccuracyTable, setShowAccuracyTable] = useState(false);
  const [showSessionsTable, setShowSessionsTable] = useState(false);
  const [sessionsOrder, setSessionsOrder] = useState<SessionOrder>("recent");
  const { disciplines, questions } = state;
  const pu = getPU(state, uid);

  useEffect(() => {
    const key = `${HISTORY_RANGE_KEY_PREFIX}:${uid || "anon"}`;
    window.localStorage.setItem(key, historyRange);
  }, [uid, historyRange]);

  useEffect(() => {
    const key = `${ACCURACY_CHART_TYPE_KEY_PREFIX}:${uid || "anon"}`;
    window.localStorage.setItem(key, accuracyChartType);
  }, [uid, accuracyChartType]);

  const li = getLvlInfo(currentUser?.pontuacao ?? 0);
  const pct = Math.min(100, Math.round((li.progress / li.needed) * 100));
  const tot = (currentUser?.respostasCertas ?? 0) + (currentUser?.respostasErradas ?? 0);
  const apr = tot > 0 ? Math.round(((currentUser?.respostasCertas ?? 0) / tot) * 100) : 0;
  const totalStudySeconds = useMemo(() => pu.sessions.reduce((sum, s) => sum + (s.totalTime || 0), 0), [pu.sessions]);
  const totalStudyHours = totalStudySeconds / 3600;
  const studyHoursLabel = `${totalStudyHours.toFixed(1)}h`;
  const studyDetailedLabel = `${Math.floor(totalStudySeconds / 3600)}h ${Math.floor((totalStudySeconds % 3600) / 60)}min`;

  const filteredSessions = useMemo(() => {
    if (historyRange === "all") return pu.sessions;
    const days = Number(historyRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoff = cutoffDate.getTime();
    return pu.sessions.filter((s) => new Date(s.date).getTime() >= cutoff);
  }, [pu.sessions, historyRange]);

  const chartData = useMemo(
    () =>
      filteredSessions
        .slice(0, 10)
        .reverse()
        .map((s, i) => ({
          name: `S${i + 1}`,
          acerto: Math.round((s.correct / s.total) * 100),
          tempo: s.totalTime,
        })),
    [filteredSessions],
  );

  const levelTimeline = useMemo(() => {
    if (!currentUser) return [] as Array<{ level: number; date: string; label: string; cumulativePoints: number }>;

    const ordered = [...filteredSessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const sessionsPoints = ordered.reduce((sum, s) => sum + (s.points || 0), 0);
    const safeStartPoints = Math.max(0, (currentUser.pontuacao || 0) - sessionsPoints);

    let cumulative = safeStartPoints;
    let prevLevel = getLvlInfo(cumulative).level;
    const milestones: Array<{ level: number; date: string; label: string; cumulativePoints: number }> = [];

    for (const s of ordered) {
      cumulative += s.points || 0;
      const nextLevel = getLvlInfo(cumulative).level;
      if (nextLevel > prevLevel) {
        for (let lv = prevLevel + 1; lv <= nextLevel; lv++) {
          const d = new Date(s.date);
          milestones.push({
            level: lv,
            date: s.date,
            label: d.toLocaleDateString("pt-BR"),
            cumulativePoints: cumulative,
          });
        }
      }
      prevLevel = nextLevel;
    }

    return milestones;
  }, [filteredSessions, currentUser]);

  const levelTimelineChartData = useMemo(
    () =>
      levelTimeline.map((m, i) => ({
        idx: i + 1,
        level: m.level,
        label: m.label,
        points: m.cumulativePoints,
        isAnnotated: i >= Math.max(0, levelTimeline.length - 5),
      })),
    [levelTimeline],
  );

  const sessionsTableRows = useMemo(() => {
    const ordered = [...filteredSessions].sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return sessionsOrder === "recent" ? db - da : da - db;
    });
    return ordered.slice(0, 8);
  }, [filteredSessions, sessionsOrder]);

  const levelCsvRows = useMemo(() => levelTimelineChartData.map((row) => [row.idx, row.label, row.level, row.points]), [levelTimelineChartData]);

  const accuracyCsvRows = useMemo(() => chartData.map((row) => [row.name, row.acerto, row.tempo]), [chartData]);

  const sessionsCsvRows = useMemo(
    () =>
      sessionsTableRows.map((s) => [
        new Date(s.date).toLocaleDateString("pt-BR"),
        s.discipline === "all" ? "Aleatorio" : s.discipline,
        Math.round((s.correct / s.total) * 100),
        fmtTime(s.totalTime),
        s.points,
      ]),
    [sessionsTableRows],
  );

  const levelTrendSummary = useMemo(() => {
    if (levelTimelineChartData.length < 2) return "Dados insuficientes para tendencia.";
    const first = levelTimelineChartData[0].level;
    const last = levelTimelineChartData[levelTimelineChartData.length - 1].level;
    if (last > first) return `Tendencia de alta: do nivel ${first} para ${last}.`;
    if (last < first) return `Tendencia de queda: do nivel ${first} para ${last}.`;
    return `Tendencia estavel no nivel ${last}.`;
  }, [levelTimelineChartData]);

  const lastMilestone = levelTimeline[levelTimeline.length - 1] ?? null;
  const nextLevelTarget = li.level + 1;

  const streakDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = d.toDateString();
      const isToday = i === 0;
      const done = pu.streak.lastDate === ds || (i > 0 && pu.sessions.some((s) => new Date(s.date).toDateString() === ds));
      days.push({ ds, isToday, done, label: d.getDate() });
    }
    return days;
  }, [pu]);

  const weeklyHeatmap = useMemo(() => {
    const dailyCount = new Map<string, number>();
    pu.sessions.forEach((s) => {
      const ds = new Date(s.date).toDateString();
      dailyCount.set(ds, (dailyCount.get(ds) ?? 0) + 1);
    });

    const days: HeatmapDay[] = [];
    const now = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toDateString();
      const count = dailyCount.get(key) ?? 0;
      const intensity = count >= 3 ? 3 : count >= 2 ? 2 : count >= 1 ? 1 : 0;
      days.push({
        date: d.toLocaleDateString("pt-BR"),
        count,
        intensity,
        dayLabel: ["D", "S", "T", "Q", "Q", "S", "S"][d.getDay()],
        dayOfMonth: d.getDate(),
      });
    }

    const weeks: HeatmapDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, [pu.sessions]);

  const habitTrendSummary = useMemo(() => {
    const now = new Date();
    const daysWithStudy = (startOffset: number, endOffset: number) => {
      let count = 0;
      for (let i = startOffset; i <= endOffset; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = d.toDateString();
        if (pu.sessions.some((s) => new Date(s.date).toDateString() === key)) count++;
      }
      return count;
    };

    const recent = daysWithStudy(0, 6);
    const previous = daysWithStudy(7, 13);

    if (recent >= previous + 2) return `Tendencia semanal: subindo (${recent} dias ativos vs ${previous} na semana anterior).`;
    if (previous >= recent + 2) return `Tendencia semanal: caindo (${recent} dias ativos vs ${previous} na semana anterior).`;
    return `Tendencia semanal: estavel (${recent} dias ativos, variacao pequena vs ${previous}).`;
  }, [pu.sessions]);

  const habitRecommendation = useMemo(() => {
    const weekdayCount = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    for (let i = 0; i < 28; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toDateString();
      if (pu.sessions.some((s) => new Date(s.date).toDateString() === key)) {
        weekdayCount[d.getDay()] += 1;
      }
    }

    const minCount = Math.min(...weekdayCount);
    const weakestDayIndex = weekdayCount.indexOf(minCount);
    const weekdayName = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"][weakestDayIndex];

    if (minCount === 0) return `Recomendacao: voce ainda nao estudou nas ${weekdayName}s no periodo recente. Reserve 15 min nesse dia para reduzir lacunas.`;
    return `Recomendacao: seu ponto mais fraco e ${weekdayName} (${minCount} dias ativos). Tente uma sessao curta fixa nesse dia.`;
  }, [pu.sessions]);

  const earned = pu.achievements;

  const discStats = useMemo(
    () =>
      disciplines
        .filter((d) => questions.some((q) => q.disciplina === d.name))
        .map((d) => {
          const dSessions = pu.sessions.filter((s) => s.discipline === d.name || s.discipline === "all");
          const qCnt = questions.filter((q) => q.disciplina === d.name).length;
          return { ...d, qCnt, sessions: dSessions.length };
        }),
    [disciplines, questions, pu],
  );

  if (!currentUser) return null;

  const previewAvatar = {
    nome: editName || currentUser.nome,
    avatarEmoji: editAvatarEmoji || undefined,
    avatarColor: editAvatarColor || undefined,
  };

  function handleProfileSave(): void {
    const updated = onUpdateProfile({
      name: editName,
      email: editEmail,
      avatarEmoji: editAvatarEmoji || undefined,
      avatarColor: editAvatarColor || undefined,
      currentPassword: editCurrentPassword.trim() ? editCurrentPassword : undefined,
      newPassword: editPassword.trim() ? editPassword : undefined,
    });
    if (updated) {
      setEditCurrentPassword("");
      setEditPassword("");
    }
  }

  function handleTabKeyNavigation(e: KeyboardEvent<HTMLButtonElement>, current: ProfileTab): void {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const order: ProfileTab[] = ["stats", "badges", "streak", "history"];
    const idx = order.indexOf(current);
    const next = e.key === "ArrowRight" ? order[(idx + 1) % order.length] : order[(idx - 1 + order.length) % order.length];
    setTab(next);
  }

  return (
    <div className="pg fade">
      <h1 className="SY" style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 18 }}>
        👤 Perfil
      </h1>
      <div className="prof-hdr">
        <div
          className="av"
          style={{
            width: 68,
            height: 68,
            background: userAvatarBg(currentUser),
            fontSize: 24,
            color: "#fff",
            borderRadius: 18,
            boxShadow: "0 6px 20px rgba(255,107,53,.25)",
          }}
        >
          {userAvatarLabel(currentUser)}
        </div>
        <div style={{ flex: 1 }}>
          <div className="SY" style={{ fontSize: "1.2rem", fontWeight: 800 }}>
            {currentUser.nome}
          </div>
          <div style={{ fontSize: 12, color: "var(--txd)", marginBottom: 8 }}>{currentUser.email}</div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <span className="badge-pill by">Nivel {li.level}</span>
            <span className="badge-pill bm">{lvlTitle(li.level)}</span>
            {pu.streak.count > 0 && <span className="badge-pill bs">🔥 {pu.streak.count} dias</span>}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Progresso - Nivel {li.level}</span>
          <span style={{ fontSize: 12, color: "var(--txd)" }}>
            {li.progress}/{li.needed} - Nivel {li.level + 1}
          </span>
        </div>
        <div style={{ background: "var(--bdr)", borderRadius: 99, height: 10, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              background: "linear-gradient(90deg,var(--pri),var(--sec))",
              borderRadius: 99,
              width: `${pct}%`,
              transition: "width .6s",
            }}
          />
        </div>
        <div style={{ fontSize: 11, color: "var(--txd)", marginTop: 5 }}>{pct}% completo</div>

        <div className="row" style={{ marginTop: 12, justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--txd)" }}>Tempo total estudado</span>
          <span className="SY" style={{ fontSize: "1rem", fontWeight: 800, color: "var(--pri)" }}>
            {studyHoursLabel}
          </span>
        </div>
        <div style={{ fontSize: 11, color: "var(--txd)", marginTop: 2 }}>{studyDetailedLabel}</div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="SY" style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 10 }}>
          ✏️ Editar perfil
        </h3>
        <div style={{ display: "grid", gap: 8 }}>
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Nome"
            aria-label="Nome"
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--bdr)", background: "var(--card)", color: "var(--tx)" }}
          />
          <input
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            placeholder="E-mail"
            aria-label="E-mail"
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--bdr)", background: "var(--card)", color: "var(--tx)" }}
          />
          <div className="row" style={{ gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div className="av" style={{ width: 42, height: 42, background: userAvatarBg(previewAvatar), color: "#fff", fontSize: 18 }}>
              {userAvatarLabel(previewAvatar)}
            </div>
            <select
              value={editAvatarEmoji}
              onChange={(e) => setEditAvatarEmoji(e.target.value)}
              aria-label="Emoji do avatar"
              style={{ flex: 1, minWidth: 160, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--bdr)", background: "var(--card)", color: "var(--tx)" }}
            >
              <option value="">Sem emoji (usar iniciais)</option>
              {EMOJI_LIST.map((emoji) => (
                <option key={emoji} value={emoji}>
                  {emoji}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              type="button"
              className={`btn btn-sm ${editAvatarColor ? "btn-g" : "btn-p"}`}
              onClick={() => setEditAvatarColor("")}
            >
              Cor automática
            </button>
            {COLOR_LIST.slice(0, 12).map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Cor ${color}`}
                onClick={() => setEditAvatarColor(color)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  border: editAvatarColor === color ? "2px solid var(--pri)" : "1px solid var(--bdr)",
                  background: color,
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
          <input
            type="password"
            value={editCurrentPassword}
            onChange={(e) => setEditCurrentPassword(e.target.value)}
            placeholder="Senha atual (obrigatória para trocar senha)"
            aria-label="Senha atual"
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--bdr)", background: "var(--card)", color: "var(--tx)" }}
          />
          <input
            type="password"
            value={editPassword}
            onChange={(e) => setEditPassword(e.target.value)}
            placeholder="Nova senha (opcional)"
            aria-label="Nova senha"
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--bdr)", background: "var(--card)", color: "var(--tx)" }}
          />
        </div>
        <div className="row" style={{ justifyContent: "flex-end", marginTop: 10 }}>
          <button className="btn btn-p btn-sm" onClick={handleProfileSave}>
            Salvar alteracoes
          </button>
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label="Abas do perfil">
        <button id="profile-tab-stats" role="tab" aria-selected={tab === "stats"} aria-controls="profile-panel-stats" tabIndex={tab === "stats" ? 0 : -1} className={`tab ${tab === "stats" ? "on" : ""}`} onClick={() => setTab("stats")} onKeyDown={(e) => handleTabKeyNavigation(e, "stats")}>
          📊 Stats
        </button>
        <button id="profile-tab-badges" role="tab" aria-selected={tab === "badges"} aria-controls="profile-panel-badges" tabIndex={tab === "badges" ? 0 : -1} className={`tab ${tab === "badges" ? "on" : ""}`} onClick={() => setTab("badges")} onKeyDown={(e) => handleTabKeyNavigation(e, "badges")}>
          🏅 Conquistas
        </button>
        <button id="profile-tab-streak" role="tab" aria-selected={tab === "streak"} aria-controls="profile-panel-streak" tabIndex={tab === "streak" ? 0 : -1} className={`tab ${tab === "streak" ? "on" : ""}`} onClick={() => setTab("streak")} onKeyDown={(e) => handleTabKeyNavigation(e, "streak")}>
          🔥 Streak
        </button>
        <button id="profile-tab-history" role="tab" aria-selected={tab === "history"} aria-controls="profile-panel-history" tabIndex={tab === "history" ? 0 : -1} className={`tab ${tab === "history" ? "on" : ""}`} onClick={() => setTab("history")} onKeyDown={(e) => handleTabKeyNavigation(e, "history")}>
          📈 Historico
        </button>
      </div>

      {tab === "stats" && (
        <div id="profile-panel-stats" role="tabpanel" aria-labelledby="profile-tab-stats">
          <div className="sgrid" style={{ marginBottom: 16 }}>
            {([
              ["🎯", "var(--sec)", currentUser.pontuacao.toLocaleString("pt-BR"), "Pontos"],
              ["✅", "var(--ok)", currentUser.respostasCertas, "Acertos"],
              ["❌", "var(--err)", currentUser.respostasErradas, "Erros"],
              ["📊", "var(--blu)", `${apr}%`, "Aproveitamento"],
              ["📝", "var(--tx)", tot, "Respondidas"],
              ["⏱️", "var(--sec)", studyHoursLabel, "Tempo Estudado"],
              ["🗂️", "var(--pri)", pu.sessions.length, "Sessoes"],
            ] as Array<[string, string, string | number, string]>).map(([ic, c, v, lb]) => (
              <div key={lb} className="scard">
                <div style={{ fontSize: 19, marginBottom: 4 }}>{ic}</div>
                <div className="SY" style={{ fontSize: "1.2rem", fontWeight: 800, color: c }}>
                  {v}
                </div>
                <div className="ptx">{lb}</div>
              </div>
            ))}
          </div>
          {discStats.length > 0 && (
            <>
              <h3 className="SY" style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 12 }}>
                Por Disciplina
              </h3>
              {discStats.map((d) => (
                <div key={d.name} style={{ marginBottom: 10 }}>
                  <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13 }}>
                      {d.icon} {d.name}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--txd)" }}>{d.qCnt} questoes</span>
                  </div>
                  <div style={{ background: "var(--bdr)", borderRadius: 99, height: 7, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        background: d.color,
                        width: `${Math.min(100, (d.qCnt / Math.max(...discStats.map((x) => x.qCnt))) * 100)}%`,
                        borderRadius: 99,
                        transition: "width .5s",
                      }}
                    />
                  </div>
                </div>
              ))}
            </>
          )}
          <div className="card" style={{ marginTop: 16 }}>
            <h3 className="SY" style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 12 }}>
              📈 Sistema de Niveis
            </h3>
            {([
              ["Niveis 1-10", "100pts", "var(--ok)"],
              ["Niveis 11-20", "200pts", "var(--sec)"],
              ["Niveis 21+", "500pts", "var(--pri)"],
            ] as Array<[string, string, string]>).map(([r, p, c]) => (
              <div key={r} className="row" style={{ justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--bdr)" }}>
                <span style={{ fontSize: 12 }}>{r}</span>
                <span className="SY" style={{ fontWeight: 700, color: c, fontSize: 13 }}>
                  {p}/nivel
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "badges" && (
        <div id="profile-panel-badges" role="tabpanel" aria-labelledby="profile-tab-badges">
          <p className="ptx" style={{ marginBottom: 16 }}>
            {Object.keys(earned).length}/{BADGES.length} conquistas desbloqueadas
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12 }}>
            {BADGES.map((b) => {
              const e = earned[b.id];
              return (
                <div key={b.id} className={`badge-card ${e ? "earned" : "locked"}`}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>{b.icon}</div>
                  <div className="SY" style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: 4 }}>
                    {b.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--txd)", marginBottom: 6 }}>{b.desc}</div>
                  {e ? (
                    <span className="badge-pill bs" style={{ fontSize: 10 }}>
                      ✓ Conquistado
                    </span>
                  ) : (
                    <span className="badge-pill bm" style={{ fontSize: 10 }}>
                      🔒 Bloqueado
                    </span>
                  )}
                  {e && <div style={{ fontSize: 10, color: "var(--txd)", marginTop: 4 }}>{new Date(e).toLocaleDateString("pt-BR")}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "streak" && (
        <div id="profile-panel-streak" role="tabpanel" aria-labelledby="profile-tab-streak">
          <div className="card" style={{ textAlign: "center", marginBottom: 18 }}>
            <div style={{ fontSize: 56, marginBottom: 6 }}>🔥</div>
            <div className="SY" style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--sec)" }}>
              {pu.streak.count}
            </div>
            <div style={{ fontSize: 14, color: "var(--txd)" }}>dias consecutivos</div>
            {pu.streak.lastDate === todayStr() ? (
              <div className="badge-pill bs" style={{ marginTop: 10, fontSize: 11 }}>
                ✓ Voce estudou hoje!
              </div>
            ) : (
              <div className="badge-pill bp" style={{ marginTop: 10, fontSize: 11 }}>
                ⚠️ Estude hoje para manter o streak!
              </div>
            )}
          </div>
          <h3 className="SY" style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 12 }}>
            Ultimos 14 dias
          </h3>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {streakDays.map((d, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div className={`streak-day ${d.isToday ? "today" : d.done ? "done" : "miss"}`}>{d.label}</div>
                <div style={{ fontSize: 9, color: "var(--txd)", marginTop: 3 }}>{["D", "S", "T", "Q", "Q", "S", "S"][new Date(d.ds).getDay()]}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: 16, marginBottom: 18 }}>
            <h3 className="SY" style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 10 }}>
              🗓️ Heatmap semanal (ultimos 28 dias)
            </h3>
            <div style={{ display: "grid", gap: 6 }}>
              {weeklyHeatmap.map((week, weekIdx) => (
                <div key={`week-${weekIdx}`} className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                  {week.map((d) => (
                    <div key={`${d.date}-${d.dayOfMonth}`} style={{ textAlign: "center" }}>
                      <div
                        title={`${d.date}: ${d.count} sessoes`}
                        aria-label={`${d.date}: ${d.count} sessoes`}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          border: "1px solid var(--bdr)",
                          background:
                            d.intensity === 0
                              ? "var(--card)"
                              : d.intensity === 1
                                ? "rgba(255, 107, 53, .25)"
                                : d.intensity === 2
                                  ? "rgba(255, 107, 53, .5)"
                                  : "rgba(255, 107, 53, .8)",
                        }}
                      />
                      <div style={{ fontSize: 9, color: "var(--txd)", marginTop: 3 }}>{d.dayLabel}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "var(--txd)", marginTop: 10 }}>{habitTrendSummary}</p>
            <p style={{ fontSize: 12, color: "var(--txd)", marginTop: 4 }}>{habitRecommendation}</p>
          </div>

          <div className="card" style={{ marginTop: 18, background: "var(--surf)" }}>
            <h3 className="SY" style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 10 }}>
              🏅 Metas de Streak
            </h3>
            {([
              [3, "🔥", "Em Chamas"],
              [7, "⚡", "Imparavel"],
              [30, "💎", "Lendario"],
            ] as Array<[number, string, string]>).map(([days, ic, name]) => (
              <div key={days} className="row" style={{ gap: 10, padding: "8px 0", borderBottom: "1px solid var(--bdr)" }}>
                <span style={{ fontSize: 20 }}>{ic}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
                  <div style={{ fontSize: 11, color: "var(--txd)" }}>{days} dias seguidos</div>
                </div>
                {pu.streak.count >= days ? (
                  <span className="badge-pill bs" style={{ fontSize: 10 }}>
                    ✓
                  </span>
                ) : (
                  <span className="badge-pill bm" style={{ fontSize: 10 }}>
                    {days - Math.min(pu.streak.count, days)} restam
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "history" && (
        <div id="profile-panel-history" role="tabpanel" aria-labelledby="profile-tab-history">
          <div className="row" style={{ gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {([
              ["7", "7 dias"],
              ["30", "30 dias"],
              ["90", "90 dias"],
              ["all", "Tudo"],
            ] as Array<[HistoryRange, string]>).map(([value, label]) => (
              <button key={value} className={`btn btn-sm ${historyRange === value ? "btn-p" : "btn-g"}`} onClick={() => setHistoryRange(value)}>
                {label}
              </button>
            ))}
          </div>

          <div className="row" style={{ gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--txd)", alignSelf: "center" }}>Grafico de acerto:</span>
            <button className={`btn btn-sm ${accuracyChartType === "bar" ? "btn-p" : "btn-g"}`} onClick={() => setAccuracyChartType("bar")}>
              Barras
            </button>
            <button className={`btn btn-sm ${accuracyChartType === "line" ? "btn-p" : "btn-g"}`} onClick={() => setAccuracyChartType("line")}>
              Linha
            </button>
          </div>

          {chartData.length > 0 ? (
            <>
              <h3 className="SY" style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 14 }}>
                🧭 Evolucao de Nivel
              </h3>
              <div className="row" style={{ justifyContent: "flex-end", marginBottom: 8 }}>
                <button
                  className="btn btn-sm btn-g"
                  onClick={() => setShowLevelTable((v) => !v)}
                  aria-expanded={showLevelTable}
                  aria-controls="profile-level-table"
                >
                  {showLevelTable ? "Ver dados em grafico (evolucao)" : "Ver dados em tabela (evolucao)"}
                </button>
              </div>
              {levelTimelineChartData.length > 0 ? (
                <>
                  <div style={{ background: "var(--card)", border: "1px solid var(--bdr)", borderRadius: 14, padding: "14px 8px", marginBottom: 12 }}>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={levelTimelineChartData}>
                        <CartesianGrid strokeDasharray="4 4" stroke="var(--bdr)" />
                        <XAxis dataKey="idx" tick={{ fill: "var(--txd)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(idx) => levelTimelineChartData.find((p) => p.idx === Number(idx))?.label ?? String(idx)} />
                        <YAxis allowDecimals={false} tick={{ fill: "var(--txd)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: "var(--card)", border: "1px solid var(--bdr2)", borderRadius: 10, fontSize: 12 }}
                          formatter={(value, key, item) => {
                            if (key === "level") {
                              return [`Nivel ${value}`, `Pontos: ${item.payload.points}`];
                            }
                            return [String(value), String(key)];
                          }}
                          labelFormatter={(idx) => {
                            const point = levelTimelineChartData.find((p) => p.idx === Number(idx));
                            if (!point) return `Marco ${idx}`;
                            return `${point.label}`;
                          }}
                        />
                        <ReferenceLine y={nextLevelTarget} stroke="var(--sec)" strokeDasharray="6 4" ifOverflow="extendDomain" label={{ value: `Meta N${nextLevelTarget}`, fill: "var(--sec)", fontSize: 10, position: "insideTopRight" }} />
                        <Line
                          type="monotone"
                          dataKey="level"
                          stroke="var(--pri)"
                          strokeWidth={3}
                          dot={(props: LevelDotProps) => {
                            const { cx, cy, payload } = props;
                            if (typeof cx !== "number" || typeof cy !== "number") return null;
                            const r = payload?.isAnnotated ? 5 : 3;
                            const fill = payload?.isAnnotated ? "var(--sec)" : "var(--pri)";
                            return <circle cx={cx} cy={cy} r={r} fill={fill} stroke="var(--card)" strokeWidth={1.5} />;
                          }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {showLevelTable && (
                    <div id="profile-level-table" className="card" style={{ marginBottom: 12, overflowX: "auto" }}>
                      <div className="row" style={{ justifyContent: "flex-end", marginBottom: 8 }}>
                        <button
                          className="btn btn-sm btn-g"
                          onClick={() => downloadCsv("historico-evolucao.csv", ["Marco", "Data", "Nivel", "Pontos acumulados"], levelCsvRows)}
                        >
                          Exportar CSV (evolucao)
                        </button>
                      </div>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <caption style={{ textAlign: "left", fontWeight: 700, marginBottom: 8 }}>Tabela de evolucao de nivel</caption>
                        <thead>
                          <tr>
                            <th scope="col" style={{ textAlign: "left", padding: "6px 4px", borderBottom: "1px solid var(--bdr)" }}>Marco</th>
                            <th scope="col" style={{ textAlign: "left", padding: "6px 4px", borderBottom: "1px solid var(--bdr)" }}>Data</th>
                            <th scope="col" style={{ textAlign: "left", padding: "6px 4px", borderBottom: "1px solid var(--bdr)" }}>Nivel</th>
                            <th scope="col" style={{ textAlign: "left", padding: "6px 4px", borderBottom: "1px solid var(--bdr)" }}>Pontos acumulados</th>
                          </tr>
                        </thead>
                        <tbody>
                          {levelTimelineChartData.map((row) => (
                            <tr key={`level-row-${row.idx}`}>
                              <td style={{ padding: "6px 4px", borderBottom: "1px solid var(--bdr)" }}>{row.idx}</td>
                              <td style={{ padding: "6px 4px", borderBottom: "1px solid var(--bdr)" }}>{row.label}</td>
                              <td style={{ padding: "6px 4px", borderBottom: "1px solid var(--bdr)" }}>{row.level}</td>
                              <td style={{ padding: "6px 4px", borderBottom: "1px solid var(--bdr)" }}>{row.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="card" style={{ marginBottom: 12 }}>
                    <h4 className="SY" style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 6 }}>
                      Resumo da tendencia
                    </h4>
                    <p style={{ fontSize: 12, color: "var(--txd)", marginBottom: 4 }}>{levelTrendSummary}</p>
                    {lastMilestone && (
                      <p style={{ fontSize: 12, color: "var(--txd)" }}>
                        Ultimo marco: Nivel {lastMilestone.level} em {new Date(lastMilestone.date).toLocaleDateString("pt-BR")}. Meta atual: Nivel {nextLevelTarget}.
                      </p>
                    )}
                  </div>

                  <div className="card" style={{ marginBottom: 18 }}>
                    <h4 className="SY" style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 10 }}>
                      Linha do tempo de niveis
                    </h4>
                    {levelTimeline.slice().reverse().map((m, i) => (
                      <div key={`${m.level}-${i}`} className="row" style={{ justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--bdr)" }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>Nivel {m.level}</span>
                        <span style={{ fontSize: 12, color: "var(--txd)" }}>{new Date(m.date).toLocaleDateString("pt-BR")}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="card" style={{ marginBottom: 12, textAlign: "center" }}>
                    <p style={{ color: "var(--txd)", fontSize: 12 }}>
                      Complete mais sessoes para registrar conquistas de novos niveis na linha do tempo.
                    </p>
                  </div>
                  {showLevelTable && (
                    <div id="profile-level-table" className="card" style={{ marginBottom: 18, textAlign: "center" }}>
                      <p style={{ color: "var(--txd)", fontSize: 12 }}>Ainda nao ha marcos suficientes para montar a tabela de evolucao.</p>
                    </div>
                  )}
                </>
              )}

              <h3 className="SY" style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 14 }}>
                % de Acerto por Sessao
              </h3>
              <div className="row" style={{ justifyContent: "flex-end", marginBottom: 8 }}>
                <button
                  className="btn btn-sm btn-g"
                  onClick={() => setShowAccuracyTable((v) => !v)}
                  aria-expanded={showAccuracyTable}
                  aria-controls="profile-accuracy-table"
                >
                  {showAccuracyTable ? "Ver dados em grafico (acerto)" : "Ver dados em tabela (acerto)"}
                </button>
              </div>
              <div style={{ background: "var(--card)", border: "1px solid var(--bdr)", borderRadius: 14, padding: "14px 8px", marginBottom: 18 }}>
                <ResponsiveContainer width="100%" height={160}>
                  {accuracyChartType === "bar" ? (
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" tick={{ fill: "var(--txd)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: "var(--txd)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: "var(--card)", border: "1px solid var(--bdr2)", borderRadius: 10, fontSize: 12 }}
                        formatter={(v) => `${v}%`}
                      />
                      <Bar dataKey="acerto" fill="#ff6b35" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  ) : (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="4 4" stroke="var(--bdr)" />
                      <XAxis dataKey="name" tick={{ fill: "var(--txd)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: "var(--txd)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: "var(--card)", border: "1px solid var(--bdr2)", borderRadius: 10, fontSize: 12 }}
                        formatter={(v) => `${v}%`}
                      />
                      <Line type="monotone" dataKey="acerto" stroke="#ff6b35" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>

              {showAccuracyTable && (
                <div id="profile-accuracy-table" className="card" style={{ marginBottom: 18, overflowX: "auto" }}>
                  <div className="row" style={{ justifyContent: "flex-end", marginBottom: 8 }}>
                    <button
                      className="btn btn-sm btn-g"
                      onClick={() => downloadCsv("historico-acerto.csv", ["Sessao", "Acerto (%)", "Tempo (seg)"], accuracyCsvRows)}
                    >
                      Exportar CSV (acerto)
                    </button>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <caption style={{ textAlign: "left", fontWeight: 700, marginBottom: 8 }}>Tabela de acerto por sessao</caption>
                    <thead>
                      <tr>
                        <th scope="col" style={{ textAlign: "left", padding: "6px 4px", borderBottom: "1px solid var(--bdr)" }}>Sessao</th>
                        <th scope="col" style={{ textAlign: "left", padding: "6px 4px", borderBottom: "1px solid var(--bdr)" }}>Acerto (%)</th>
                        <th scope="col" style={{ textAlign: "left", padding: "6px 4px", borderBottom: "1px solid var(--bdr)" }}>Tempo (seg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((row) => (
                        <tr key={`acc-row-${row.name}`}>
                          <td style={{ padding: "6px 4px", borderBottom: "1px solid var(--bdr)" }}>{row.name}</td>
                          <td style={{ padding: "6px 4px", borderBottom: "1px solid var(--bdr)" }}>{row.acerto}</td>
                          <td style={{ padding: "6px 4px", borderBottom: "1px solid var(--bdr)" }}>{row.tempo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <h3 className="SY" style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 12 }}>
                Ultimas Sessoes
              </h3>
              <div className="row" style={{ justifyContent: "space-between", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <button
                  className="btn btn-sm btn-g"
                  onClick={() => setShowSessionsTable((v) => !v)}
                  aria-expanded={showSessionsTable}
                  aria-controls="profile-sessions-table"
                >
                  {showSessionsTable ? "Ver dados em cards (sessoes)" : "Ver dados em tabela (sessoes)"}
                </button>
                {showSessionsTable && (
                  <button className="btn btn-sm btn-g" onClick={() => setSessionsOrder((v) => (v === "recent" ? "oldest" : "recent"))}>
                    {sessionsOrder === "recent" ? "Mais antigas primeiro" : "Mais recentes primeiro"}
                  </button>
                )}
              </div>

              {showSessionsTable && (
                <div id="profile-sessions-table" className="card" style={{ marginBottom: 12, overflowX: "auto" }}>
                  <div className="row" style={{ justifyContent: "flex-end", marginBottom: 8 }}>
                    <button
                      className="btn btn-sm btn-g"
                      onClick={() => downloadCsv("historico-sessoes.csv", ["Data", "Disciplina", "Acerto (%)", "Tempo", "Pontos"], sessionsCsvRows)}
                    >
                      Exportar CSV (sessoes)
                    </button>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <caption style={{ textAlign: "left", fontWeight: 700, marginBottom: 8 }}>Tabela de sessoes por periodo</caption>
                    <thead>
                      <tr>
                        <th scope="col" style={{ textAlign: "left", padding: "6px 4px", borderBottom: "1px solid var(--bdr)" }}>Data</th>
                        <th scope="col" style={{ textAlign: "left", padding: "6px 4px", borderBottom: "1px solid var(--bdr)" }}>Disciplina</th>
                        <th scope="col" style={{ textAlign: "left", padding: "6px 4px", borderBottom: "1px solid var(--bdr)" }}>Acerto (%)</th>
                        <th scope="col" style={{ textAlign: "left", padding: "6px 4px", borderBottom: "1px solid var(--bdr)" }}>Tempo</th>
                        <th scope="col" style={{ textAlign: "left", padding: "6px 4px", borderBottom: "1px solid var(--bdr)" }}>Pontos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionsTableRows.map((s, i) => (
                        <tr key={`session-row-${s.id}-${i}`}>
                          <td style={{ padding: "6px 4px", borderBottom: "1px solid var(--bdr)" }}>{new Date(s.date).toLocaleDateString("pt-BR")}</td>
                          <td style={{ padding: "6px 4px", borderBottom: "1px solid var(--bdr)" }}>
                            {s.discipline === "all" ? "🎲 Aleatorio" : `${discLookup(disciplines, s.discipline).icon} ${s.discipline}`}
                          </td>
                          <td style={{ padding: "6px 4px", borderBottom: "1px solid var(--bdr)" }}>{Math.round((s.correct / s.total) * 100)}</td>
                          <td style={{ padding: "6px 4px", borderBottom: "1px solid var(--bdr)" }}>{fmtTime(s.totalTime)}</td>
                          <td style={{ padding: "6px 4px", borderBottom: "1px solid var(--bdr)" }}>{s.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!showSessionsTable &&
                filteredSessions.slice(0, 8).map((s, i) => (
                  <div key={i} className="card" style={{ padding: "13px 16px", marginBottom: 8, borderRadius: 13 }}>
                    <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {s.discipline === "all" ? "🎲 Aleatorio" : `${discLookup(disciplines, s.discipline).icon} ${s.discipline}`}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--txd)", marginTop: 2 }}>
                          {new Date(s.date).toLocaleDateString("pt-BR")} - {fmtTime(s.totalTime)}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          className="SY"
                          style={{
                            fontWeight: 800,
                            color: Math.round((s.correct / s.total) * 100) >= 70 ? "var(--ok)" : "var(--err)",
                            fontSize: "1rem",
                          }}
                        >
                          {Math.round((s.correct / s.total) * 100)}%
                        </div>
                        <div style={{ fontSize: 11, color: "var(--txd)" }}>
                          {s.correct}/{s.total} - +{s.points}pts
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </>
          ) : (
            <div className="card" style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
              <p style={{ color: "var(--txd)" }}>Sem sessoes no periodo selecionado. Tente outro filtro para ver o historico.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
