import { useState, useEffect } from "react";
import { useApp } from "../../app/context";
import { getPU } from "../../domain/state";
import { fmtTime, getLvlInfo } from "../../domain/utils";
import { triggerConfettiBurst } from "../../lib/confetti";
import MathText from "../common/MathText";
import type { ResultsData } from "../../types/app";

type ResultsScreenProps = {
  results: ResultsData;
  onHome: () => void;
  onRetry: () => void;
  onReviewErrors: () => void;
};

export default function ResultsScreen({ results, onHome, onRetry, onReviewErrors }: ResultsScreenProps) {
  const [rev, setRev] = useState(false);
  const { currentUser, addToast, state, uid } = useApp();

  const pct = currentUser ? Math.round((results.correct / results.total) * 100) : 0;

  // Trigger confetti on perfect score
  useEffect(() => {
    if (pct === 100) {
      // Delay slightly to let screen render first
      const timer = setTimeout(() => {
        triggerConfettiBurst();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pct]);

  if (!currentUser) return null;

  const disciplines = [...new Set(results.answers.map((a) => a.question.disciplina))];
  const shareDiscipline = disciplines.length === 1 ? disciplines[0] : "Múltiplas disciplinas";
  const shareText = `Acertei ${results.correct}/${results.total} em ${shareDiscipline}! 🎯\nAproveitamento: ${pct}%\nTempo total: ${fmtTime(results.totalTime)}\n+${results.points} pontos no Questionador.`;

  async function handleCopyShareText(): Promise<void> {
    if (!navigator?.clipboard?.writeText) {
      addToast("Cópia não suportada neste navegador", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(shareText);
      addToast("Resultado copiado para a área de transferência ✅", "success");
    } catch {
      addToast("Não foi possível copiar o resultado", "error");
    }
  }

  async function handleShareResult(): Promise<void> {
    if (typeof navigator?.share !== "function") {
      await handleCopyShareText();
      return;
    }

    try {
      await navigator.share({
        title: "Meu resultado no Questionador",
        text: shareText,
      });
      addToast("Resultado compartilhado 🎉", "success");
    } catch {
      // User canceled or share failed.
    }
  }

  const li = getLvlInfo(currentUser.pontuacao);
  const mode = results.mode;
  const modeBadgeClass = mode === "study" ? "bs" : mode === "exam" ? "bb" : "by";
  const modeLabel = mode === "study" ? "📖 Estudo" : mode === "exam" ? "📝 Simulado" : mode === "spaced" ? "🧠 Revisao Espacada" : "🔁 Revisao de Erros";
  const perDifficulty = ["Fácil", "Médio", "Difícil"].map((difficulty) => {
    const total = results.answers.filter((a) => (a.question.dificuldade ?? "Médio") === difficulty).length;
    const correct = results.answers.filter((a) => (a.question.dificuldade ?? "Médio") === difficulty && a.isCorrect).length;
    return { difficulty, total, correct };
  });

  const disciplineStats = disciplines.map((disc) => {
    const discAnswers = results.answers.filter((a) => a.question.disciplina === disc);
    const total = discAnswers.length;
    const correct = discAnswers.filter((a) => a.isCorrect).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { disc, total, correct, accuracy };
  });
  const strongestDiscipline = disciplineStats.slice().sort((a, b) => b.accuracy - a.accuracy)[0];
  const weakestDiscipline = disciplineStats.slice().sort((a, b) => a.accuracy - b.accuracy)[0];

  const pu = getPU(state, uid);
  const previousSessions = pu.sessions.slice(1, 6);
  const previousAvgPct = previousSessions.length > 0
    ? Math.round(previousSessions.reduce((sum, s) => sum + Math.round((s.correct / s.total) * 100), 0) / previousSessions.length)
    : null;
  const deltaPct = previousAvgPct === null ? null : pct - previousAvgPct;

  const recommendation = results.wrong > 0
    ? `Revise ${results.wrong} erro(s), com foco em ${weakestDiscipline?.disc ?? "suas questoes com erro"}.`
    : results.avgTime > 20
      ? "Voce foi preciso. Tente reduzir o tempo medio por questao na proxima sessao."
      : "Excelente ritmo. Avance para um simulado para subir o desafio.";

  return (
    <div className="pg fade">
      <div className="rhdr">
        <div style={{ fontSize: 50, marginBottom: 8 }}>{pct >= 80 ? "🏆" : pct >= 60 ? "🌟" : pct >= 40 ? "💪" : "📖"}</div>
        <h1 className="SY" style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 6 }}>{pct >= 80 ? "Excelente!" : pct >= 60 ? "Muito Bem!" : pct >= 40 ? "Continue assim!" : "Nao desista!"}</h1>
        <p style={{ color: "var(--txd)", fontSize: 13, marginBottom: 14 }}>Acertou <strong style={{ color: "var(--ok)" }}>{results.correct}</strong> de <strong>{results.total}</strong></p>
        <div className="row" style={{ justifyContent: "center", gap: 8 }}>
          <span className="SY" style={{ fontSize: "2rem", fontWeight: 800, color: "var(--sec)" }}>{pct}%</span>
          <span style={{ color: "var(--txd)", fontSize: 13 }}>aproveitamento</span>
        </div>
        <div style={{ marginTop: 12, fontFamily: "'Syne',sans-serif", fontSize: "1.3rem", fontWeight: 800, color: "var(--pri)" }}>+{results.points} pontos</div>
        <div style={{ marginTop: 8 }}><span className={`badge-pill ${modeBadgeClass}`}>{modeLabel}</span></div>
      </div>
      <div className="sgrid">
        {([
          ["✅", "var(--ok)", results.correct, "Acertos"],
          ["❌", "var(--err)", results.wrong, "Erros"],
          ["⏱", "var(--tx)", fmtTime(results.totalTime), "Tempo Total"],
          ["⚡", "var(--tx)", fmtTime(results.avgTime), "Media/Questao"],
          ["🎯", "var(--sec)", results.points, "Pontos"],
          ["📈", "var(--blu)", li.level, "Nivel"],
        ] as Array<[string, string, string | number, string]>).map(([ic, c, v, lb]) => (
          <div key={lb} className="scard"><div style={{ fontSize: 20, marginBottom: 5 }}>{ic}</div><div className="SY" style={{ fontSize: "1.3rem", fontWeight: 800, color: c }}>{v}</div><div className="ptx">{lb}</div></div>
        ))}
      </div>
      <div className="card" style={{ marginBottom: 18 }}>
        <h3 className="SY" style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: 10 }}>🧭 Seus insights</h3>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ background: "var(--surf)", border: "1px solid var(--bdr)", borderRadius: 10, padding: "10px 12px", fontSize: 13 }}>
            <strong style={{ color: "var(--ok)" }}>Ponto forte:</strong> melhor desempenho em {strongestDiscipline?.disc ?? "-"} ({strongestDiscipline?.accuracy ?? 0}%).
          </div>
          <div style={{ background: "var(--surf)", border: "1px solid var(--bdr)", borderRadius: 10, padding: "10px 12px", fontSize: 13 }}>
            <strong style={{ color: "var(--err)" }}>Principal erro:</strong> maior oportunidade em {weakestDiscipline?.disc ?? "-"} ({weakestDiscipline?.accuracy ?? 0}%).
          </div>
          <div style={{ background: "var(--surf)", border: "1px solid var(--bdr)", borderRadius: 10, padding: "10px 12px", fontSize: 13 }}>
            <strong style={{ color: "var(--pri)" }}>Recomendacao:</strong> {recommendation}
          </div>
          {deltaPct !== null && (
            <div style={{ fontSize: 12, color: "var(--txd)" }}>
              {deltaPct >= 0 ? "📈" : "📉"} {deltaPct >= 0 ? "+" : ""}{deltaPct} p.p. vs media das ultimas {previousSessions.length} sessoes.
            </div>
          )}
        </div>
      </div>
      <div className="row" style={{ marginBottom: 22, gap: 8, flexWrap: "wrap" }}>
        <button className="btn btn-p" onClick={onReviewErrors} disabled={results.wrong === 0}>
          🔁 Revisar apenas erros
        </button>
        <button className="btn btn-p" onClick={onHome}>🏠 Inicio</button>
        <button className="btn btn-s" onClick={onRetry}>🔄 Novamente</button>
        <button className="btn btn-g" onClick={() => setRev((r) => !r)}>{rev ? "▲ Fechar" : "▼ Revisar Questoes"}</button>
      </div>
      <div className="card" style={{ marginBottom: 18 }}>
        <h3 className="SY" style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 10 }}>📣 Compartilhar resultado</h3>
        <div style={{ fontSize: 13, color: "var(--tx)", background: "var(--surf)", border: "1px solid var(--bdr)", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
          {shareText}
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-g btn-sm" onClick={handleCopyShareText}>📋 Copiar texto</button>
          <button className="btn btn-p btn-sm" onClick={handleShareResult}>📤 Compartilhar</button>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 18 }}>
        <h3 className="SY" style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 10 }}>🎚 Acerto por Dificuldade</h3>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          {perDifficulty.map((item) => (
            <div key={item.difficulty} className="badge-pill bm" style={{ fontSize: 11 }}>
              {item.difficulty}: {item.correct}/{item.total}
            </div>
          ))}
        </div>
      </div>
      {rev && <div className="fade">
        <h2 className="SY" style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 12 }}>📋 Revisao</h2>
        {results.answers.map((a, i) => (
          <div key={i} className={`rv-item ${a.isCorrect ? "rg" : "wr"}`}>
            <div className="row" style={{ gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <span>{a.isCorrect ? "✅" : "❌"}</span><span className="badge-pill bm">Q{i + 1}</span>
              <span className="badge-pill bm">{a.question.disciplina}</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--txd)" }}>⏱ {fmtTime(a.timeSpent)}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 7 }}><MathText text={a.question.pergunta} /></div>
            {a.question.imagem && (
              <img
                src={a.question.imagem}
                alt="Imagem da questão"
                style={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 10, marginBottom: 8, border: "1px solid var(--bdr)" }}
              />
            )}
            <div style={{ fontSize: 12 }}><span style={{ color: "var(--txd)" }}>Resposta: </span><span style={{ color: a.isCorrect ? "var(--ok)" : a.skipped ? "var(--txd)" : "var(--err)", fontWeight: 600 }}>{a.skipped ? "(Pulada)" : <MathText text={a.answer} />}</span></div>
            {!a.isCorrect && !a.skipped && <div style={{ fontSize: 12, marginTop: 3 }}><span style={{ color: "var(--txd)" }}>Correta: </span><span style={{ color: "var(--ok)", fontWeight: 600 }}><MathText text={a.question.respostaCorreta} /></span></div>}
            {a.question.comentario && <p style={{ fontSize: 11, color: "var(--txd)", marginTop: 7, padding: "7px 11px", background: "var(--surf)", borderRadius: 8 }}>💡 <MathText text={a.question.comentario} /></p>}
          </div>
        ))}
      </div>}
    </div>
  );
}
