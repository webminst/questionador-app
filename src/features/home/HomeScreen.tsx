import { type KeyboardEvent, useMemo, useState } from "react";
import { useApp } from "../../app/context";
import { getPU } from "../../domain/state";
import { hexAlpha } from "../../domain/utils";
import type { Screen } from "../../types/app";

type HomeScreenProps = {
  onSelectDisc: (disc: string) => void;
  onStartQuestionOfDay: (questionId: string) => void;
  onStartReviewErrors: () => void;
  onAddQ: () => void;
  setScreen: (s: Screen) => void;
};

type NextStepType = "create-question" | "continue-study" | "review-errors";

function getNextStep(input: { hasQuestions: boolean; answeredToday: number; currentGoal: number }): NextStepType {
  if (!input.hasQuestions) return "create-question";
  if (input.answeredToday < input.currentGoal) return "continue-study";
  return "review-errors";
}

export default function HomeScreen({ onSelectDisc, onStartQuestionOfDay, onStartReviewErrors, onAddQ, setScreen }: HomeScreenProps) {
  const { state, uid, dispatch, addToast } = useApp();
  const { disciplines, questions } = state;
  const pu = uid ? getPU(state, uid) : null;
  const currentGoal = Math.max(1, pu?.dailyGoalQuestions ?? 20);
  const [goalInput, setGoalInput] = useState<string>(String(currentGoal));
  const withQ = useMemo(() => disciplines.filter((d) => questions.some((q) => q.disciplina === d.name)), [disciplines, questions]);
  const todayKey = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);
  const questionOfDay = useMemo(() => {
    if (!questions.length) return null;
    const seed = todayKey.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const idx = seed % questions.length;
    return questions[idx];
  }, [questions, todayKey]);
  const questionOfDayDisc = useMemo(() => {
    if (!questionOfDay) return null;
    return disciplines.find((d) => d.name === questionOfDay.disciplina) ?? null;
  }, [disciplines, questionOfDay]);
  const questionOfDayPreview = useMemo(() => {
    if (!questionOfDay) return "";
    const clean = questionOfDay.pergunta.replace(/\s+/g, " ").trim();
    const maxLen = 120;
    if (clean.length <= maxLen) return clean;
    return `${clean.slice(0, maxLen).trim()}...`;
  }, [questionOfDay]);
  const answeredToday = useMemo(() => {
    if (!pu) return 0;
    return pu.sessions
      .filter((s) => s.date.slice(0, 10) === todayKey)
      .reduce((sum, s) => sum + s.total, 0);
  }, [pu, todayKey]);
  const goalProgressPct = Math.min(100, Math.round((answeredToday / currentGoal) * 100));
  const nextStep = getNextStep({ hasQuestions: questions.length > 0, answeredToday, currentGoal });

  function runNextStep(): void {
    if (nextStep === "create-question") {
      onAddQ();
      return;
    }
    if (nextStep === "continue-study") {
      onSelectDisc("all");
      return;
    }
    onStartReviewErrors();
  }

  const nextStepTitle = nextStep === "create-question"
    ? "Crie sua primeira questao"
    : nextStep === "continue-study"
      ? "Continue seus estudos"
      : "Hora de revisar erros";

  const nextStepText = nextStep === "create-question"
    ? "Voce ainda nao tem questoes cadastradas para iniciar sessoes."
    : nextStep === "continue-study"
      ? `Faltam ${Math.max(0, currentGoal - answeredToday)} questoes para bater sua meta de hoje.`
      : "Meta concluida. Reforce os pontos fracos revisando os erros da ultima sessao.";

  const nextStepButton = nextStep === "create-question"
    ? "Criar primeira questao"
    : nextStep === "continue-study"
      ? "Continuar estudo"
      : "Revisar erros";

  function handleCardKeyDown(e: KeyboardEvent<HTMLDivElement>, disc: string): void {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    onSelectDisc(disc);
  }

  function saveDailyGoal(): void {
    if (!uid) return;
    const parsed = Number(goalInput);
    const nextGoal = Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : NaN;
    if (!Number.isFinite(nextGoal)) {
      addToast("Informe uma meta válida", "error");
      return;
    }

    dispatch({ type: "UPDATE_PU", uid, data: { dailyGoalQuestions: nextGoal } });
    setGoalInput(String(nextGoal));
    addToast("Meta diária atualizada ✅", "success");
  }

  return (
    <div className="pg fade">
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 6 }}>
        <div>
          <h1 className="SY" style={{ fontSize: "1.5rem", fontWeight: 800 }}>
            O que vamos estudar? 🎯
          </h1>
          <p style={{ color: "var(--txd)", fontSize: 13, marginTop: 2 }}>
            Escolha a disciplina e o modo
          </p>
        </div>
        <button className="btn btn-p btn-sm" onClick={onAddQ}>
          + Questao
        </button>
      </div>
      <div style={{ marginBottom: 28, marginTop: 20 }}>
        <div className="card" style={{ marginBottom: 18, border: "1px solid var(--bdr2)", background: "linear-gradient(135deg, var(--card), var(--pri-d))" }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <span className="badge-pill bp">⚡ Proximo passo</span>
            <span style={{ fontSize: 12, color: "var(--txd)" }}>Recomendado para hoje</span>
          </div>
          <h2 className="SY" style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 6 }}>{nextStepTitle}</h2>
          <p style={{ fontSize: 13, color: "var(--txd)", marginBottom: 12 }}>{nextStepText}</p>
          <button className="btn btn-p btn-sm" onClick={runNextStep} aria-label={nextStepButton}>{nextStepButton} →</button>
        </div>

        {questionOfDay && (
          <div
            className="card"
            style={{
              marginBottom: 18,
              border: "1px solid var(--bdr2)",
              background: "linear-gradient(135deg, var(--pri-d), rgba(255, 200, 100, 0.12))",
            }}
          >
            <div className="row" style={{ justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              <span className="badge-pill bp">⭐ Questao do dia</span>
              <span className="badge-pill bm">{todayKey}</span>
            </div>

            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{questionOfDayPreview}</p>

            <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div className="row" style={{ gap: 8 }}>
                <span className="badge-pill bs">{questionOfDayDisc?.icon ?? "📚"}</span>
                <span className="badge-pill bm">{questionOfDay.disciplina}</span>
                {questionOfDay.dificuldade && <span className="badge-pill by">{questionOfDay.dificuldade}</span>}
              </div>
              <button className="btn btn-p btn-sm" onClick={() => onStartQuestionOfDay(questionOfDay.id)} aria-label="Resolver questao do dia">
                Resolver questao do dia →
              </button>
            </div>
          </div>
        )}

        <div className="card" style={{ marginBottom: 18 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div>
              <h2 className="SY" style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 4 }}>
                Meta diaria de questoes
              </h2>
              <p style={{ color: "var(--txd)", fontSize: 12 }}>
                {answeredToday}/{currentGoal} questoes hoje
              </p>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <input
                type="number"
                min={1}
                step={1}
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                style={{ width: 96, padding: "8px 10px", borderRadius: 10, border: "1px solid var(--bdr)", background: "var(--card)", color: "var(--tx)" }}
                aria-label="Meta diária"
              />
              <button className="btn btn-g btn-sm" onClick={saveDailyGoal}>
                Salvar meta
              </button>
            </div>
          </div>

          <div
            style={{ marginTop: 12, width: "100%", height: 10, borderRadius: 999, background: "var(--pri-d)", overflow: "hidden" }}
            role="progressbar"
            aria-label="Progresso da meta diaria"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={goalProgressPct}
          >
            <div
              style={{
                width: `${goalProgressPct}%`,
                height: "100%",
                background: goalProgressPct >= 100 ? "var(--ok)" : "var(--pri)",
                transition: "width 300ms ease",
              }}
            />
          </div>
          <p style={{ marginTop: 8, color: "var(--txd)", fontSize: 12 }}>
            {goalProgressPct >= 100 ? "Meta batida hoje. Excelente ritmo!" : `${goalProgressPct}% da meta concluida`}
          </p>
        </div>

        {withQ.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <p style={{ color: "var(--txd)" }}>
              Nenhuma questao cadastrada.{" "}
              <button className="btn btn-g btn-sm" style={{ display: "inline", marginLeft: 4 }} onClick={onAddQ}>
                Adicionar →
              </button>
            </p>
          </div>
        ) : (
          <div className="dgrid">
            {withQ.map((d) => (
              <div
                key={d.name}
                className="dcard"
                style={{ borderColor: "transparent" }}
                onClick={() => onSelectDisc(d.name)}
                role="button"
                tabIndex={0}
                aria-label={`Selecionar disciplina ${d.name}`}
                onKeyDown={(e) => handleCardKeyDown(e, d.name)}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = d.color)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
              >
                <div className="dicon" style={{ background: hexAlpha(d.color, 0.18) }}>
                  {d.icon}
                </div>
                <div className="SY" style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 4 }}>
                  {d.name}
                </div>
                <span className="badge-pill bm">{questions.filter((q) => q.disciplina === d.name).length} questoes</span>
              </div>
            ))}
            <div
              className="dcard"
              style={{ borderStyle: "dashed", borderColor: "var(--bdr2)", background: "transparent" }}
              onClick={() => onSelectDisc("all")}
              role="button"
              tabIndex={0}
              aria-label="Selecionar modo aleatorio"
              onKeyDown={(e) => handleCardKeyDown(e, "all")}
            >
              <div className="dicon" style={{ background: "var(--pri-d)" }}>
                🎲
              </div>
              <div className="SY" style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 4 }}>
                Aleatorio
              </div>
              <span className="badge-pill bp">Tudo</span>
            </div>
          </div>
        )}
      </div>
      <div>
        <h2 className="SY" style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 10 }}>
          🏆 Top Jogadores
        </h2>
        <button className="btn btn-g btn-sm" onClick={() => setScreen("leaderboard")}>
          Ver ranking →
        </button>
      </div>
    </div>
  );
}
