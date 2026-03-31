import { useMemo, useState } from "react";
import { useApp } from "../../app/context";
import { DIFFICULTIES, LEVELS_ED } from "../../domain/constants";
import type { Dificuldade, NivelEnsino, QuizMode } from "../../types/app";

export type StartQuizConfig = { disc: string; level: "all" | NivelEnsino; difficulty: "all" | Dificuldade; count: number; mode: QuizMode; timer: number };

type QuizConfigModalProps = { disc: string; onStart: (cfg: StartQuizConfig) => void; onClose: () => void };

export default function QuizConfigModal({ disc, onStart, onClose }: QuizConfigModalProps) {
  const { state } = useApp();
  const { disciplines, questions } = state;
  const [level, setLevel] = useState<"all" | NivelEnsino>("all");
  const [difficulty, setDifficulty] = useState<"all" | Dificuldade>("all");
  const [count, setCount] = useState(10);
  const [mode, setMode] = useState<QuizMode>("study");
  const [timer, setTimer] = useState(0);
  const discObj = disciplines.find((d) => d.name === disc);
  const avail = useMemo(
    () =>
      questions.filter(
        (q) =>
          (disc === "all" || q.disciplina === disc) &&
          (level === "all" || q.nivelEnsino === level) &&
          (difficulty === "all" || (q.dificuldade ?? "Médio") === difficulty),
      ).length,
    [disc, difficulty, level, questions],
  );
  const modes: Array<[QuizMode, string, string, string]> = [
    ["study", "📖", "Estudo", "Gabarito imediato"],
    ["exam", "📝", "Simulado", "Gabarito no final"],
    ["spaced", "🧠", "Revisao Espacada", "Algoritmo SM-2"],
    ["review_errors", "🔁", "Revisao de Erros", "Carrega apenas as questoes erradas da sessao anterior"],
  ];

  return (
    <div className="mover" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal fade" role="dialog" aria-modal="true" aria-labelledby="quiz-config-title">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 20 }}>
          <h2 id="quiz-config-title" className="SY" style={{ fontSize: "1.1rem", fontWeight: 800 }}>{disc === "all" ? "🎲 Aleatorio" : `${discObj?.icon || "📚"} ${disc}`}</h2>
          <button className="btn btn-g btn-sm" onClick={onClose} aria-label="Fechar configuracao do quiz">✕</button>
        </div>
        <label className="lbl">Modo de Estudo</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {modes.map(([id, ic, name]) => (
            <button key={id} className={`mode-chip ${mode === id ? "on" : ""}`} onClick={() => setMode(id)}>
              {ic} {name}
            </button>
          ))}
        </div>
        <div className="card" style={{ background: "var(--surf)", padding: 12, marginBottom: 14, borderRadius: 12 }}>
          <p style={{ fontSize: 12, color: "var(--txd)" }}>{modes.find((m) => m[0] === mode)?.[3]}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div><label className="lbl" htmlFor="quiz-config-level">Nivel</label><select id="quiz-config-level" className="inp" value={level} onChange={(e) => setLevel(e.target.value as "all" | NivelEnsino)}><option value="all">Todos</option>{LEVELS_ED.map((l) => <option key={l} value={l}>{l}</option>)}</select></div>
          <div><label className="lbl" htmlFor="quiz-config-count">Questoes</label><select id="quiz-config-count" className="inp" value={count} onChange={(e) => setCount(+e.target.value)}><option value={5}>5</option><option value={10}>10</option><option value={15}>15</option><option value={20}>20</option><option value={30}>30</option></select></div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className="lbl" htmlFor="quiz-config-difficulty">Dificuldade</label>
          <select id="quiz-config-difficulty" className="inp" value={difficulty} onChange={(e) => setDifficulty(e.target.value as "all" | Dificuldade)}>
            <option value="all">Todas</option>
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <label className="lbl">Tempo por questao</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {([[0, "Sem limite"], [30, "30s"], [60, "1min"], [120, "2min"]] as Array<[number, string]>).map(([v, l]) => (
            <button key={v} className={`mode-chip ${timer === v ? "on" : ""}`} style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => setTimer(v)}>{l}</button>
          ))}
        </div>
        <div className="card" style={{ background: "var(--surf)", marginBottom: 18, padding: 12, borderRadius: 12 }}>
          <div className="row" style={{ gap: 8 }}><span style={{ fontSize: 20 }}>📊</span><div><div style={{ fontWeight: 600, fontSize: 13 }}>{avail} questoes disponiveis</div><div className="ptx">Serao sorteadas {Math.min(count, avail)}</div></div></div>
        </div>
        {avail === 0 ? <p style={{ color: "var(--err)", fontSize: 13 }}>⚠️ Nenhuma questao para essa selecao.</p>
          : <button className="btn btn-p btn-w" onClick={() => onStart({ disc, level, difficulty, count, mode, timer })}>🚀 Iniciar</button>}
      </div>
    </div>
  );
}
