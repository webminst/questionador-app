import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import type { TouchEvent } from "react";
import { fmtTime } from "../../domain/utils";
import { playCorrect, playError, playCompletion, playSkip } from "../../lib/audio";
import MathText from "../common/MathText";
import type { QuizSession } from "../../types/app";

type QuizScreenProps = {
  session: QuizSession;
  onAnswer: (answer: string, qTime: number) => void;
  onNext: () => void;
  onSkip: () => void;
  onToggleQuestionReport?: () => void;
  isQuestionReported?: boolean;
  onExit: () => void;
  onUndoAnswer?: () => void; // Made optional for backward compatibility
};

export default function QuizScreen({ session, onAnswer, onNext, onSkip, onToggleQuestionReport, isQuestionReported, onExit, onUndoAnswer }: QuizScreenProps) {
  const [clockMs, setClockMs] = useState(0);
  const [kbdIdx, setKbdIdx] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number; t: number } | null>(null);

  const handleUndoAnswer = useCallback(() => {
    setKbdIdx(0);
  }, []);

  const q = session.questions[session.current];
  const { answered, selectedAnswer: sel, current, mode } = session;
  const total = session.questions.length;
  const modeLabel = mode === "study" ? "Estudo" : mode === "exam" ? "Simulado" : mode === "spaced" ? "SR" : "Revisao";
  const modeIcon = mode === "study" ? "📖" : mode === "exam" ? "📝" : mode === "spaced" ? "🧠" : "🔁";

  // Wrapper for answer callback with audio feedback
  const handleAnswerWithSound = useCallback((answer: string, qTime: number) => {
    if (answer !== "__skipped__") {
      if (answer === q.respostaCorreta) {
        playCorrect();
      } else {
        playError();
      }
    }
    onAnswer(answer, qTime);
  }, [q.respostaCorreta, onAnswer]);

  // Wrapper for next callback with completion audio
  const handleNextWithSound = useCallback(() => {
    if (current + 1 >= total) {
      playCompletion();
    }
    onNext();
  }, [current, total, onNext]);

  // Wrapper for skip callback with skip sound
  const handleSkipWithSound = useCallback(() => {
    playSkip();
    onSkip();
  }, [onSkip]);

  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (answered) return;
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, t: Date.now() };
  }, [answered]);

  const handleTouchEnd = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (answered) return;
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const elapsedMs = Date.now() - start.t;
    const minSwipeX = 72;
    const maxSwipeY = 64;
    const maxDurationMs = 700;

    if (Math.abs(deltaX) < minSwipeX) return;
    if (Math.abs(deltaY) > maxSwipeY) return;
    if (elapsedMs > maxDurationMs) return;

    handleSkipWithSound();
  }, [answered, handleSkipWithSound]);

  useEffect(() => {
    const t = setInterval(() => setClockMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!session.timer || session.answered) return;
    const qElapsed = Math.max(0, Math.floor((clockMs - session.questionStartTime) / 1000));
    if (qElapsed >= session.timer) handleSkipWithSound();
  }, [clockMs, session.timer, session.answered, session.questionStartTime, handleSkipWithSound]);

  const opts = useMemo(() => q.opcoes || [], [q.opcoes]);
  const labels = ["A", "B", "C", "D", "E"];
  const pct = Math.round((current / total) * 100);
  const elapsed = Math.max(0, Math.floor((clockMs - session.startTime) / 1000));
  const qElapsed = Math.max(0, Math.floor((clockMs - session.questionStartTime) / 1000));
  const timerLeft = session.timer ? Math.max(0, session.timer - qElapsed) : 0;
  const timerPct = session.timer ? (timerLeft / session.timer) * 100 : 100;
  const timerColor = timerLeft > 10 ? "var(--ok)" : timerLeft > 5 ? "var(--sec)" : "var(--err)";

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        onExit();
        return;
      }

      if (e.key === " " || e.key === "Spacebar") {
        if (!answered) {
          e.preventDefault();
          handleSkipWithSound();
        }
        return;
      }

      if (!answered && opts.length > 0 && (e.key === "ArrowDown" || e.key === "ArrowRight")) {
        e.preventDefault();
        setKbdIdx((prev) => (prev + 1) % opts.length);
        return;
      }

      if (!answered && opts.length > 0 && (e.key === "ArrowUp" || e.key === "ArrowLeft")) {
        e.preventDefault();
        setKbdIdx((prev) => (prev - 1 + opts.length) % opts.length);
        return;
      }

      if (e.key === "Enter" && answered) {
        e.preventDefault();
        handleNextWithSound();
        return;
      }

      if (e.key === "Enter" && !answered && opts.length > 0) {
        const keyboardQTime = Math.max(0, Math.floor((Date.now() - session.questionStartTime) / 1000));
        e.preventDefault();
        handleAnswerWithSound(opts[kbdIdx] ?? opts[0], keyboardQTime);
        return;
      }

      if (answered) return;

      const digit = Number(e.key);
      if (!Number.isInteger(digit) || digit < 1 || digit > 5) return;

      const idx = digit - 1;
      if (idx >= opts.length) return;

      const keyboardQTime = Math.max(0, Math.floor((Date.now() - session.questionStartTime) / 1000));
      e.preventDefault();
      handleAnswerWithSound(opts[idx], keyboardQTime);
      setKbdIdx(idx);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answered, kbdIdx, handleAnswerWithSound, onExit, handleNextWithSound, handleSkipWithSound, opts, session.questionStartTime]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div className="qhdr">
        <button className="btn btn-g btn-sm" onClick={onExit} aria-label="Sair do quiz">✕</button>
        <div className="pbar" role="progressbar" aria-label="Progresso do quiz" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><div className="pfill" style={{ width: `${pct}%` }} /></div>
        <span style={{ fontSize: 12, color: "var(--txd)", whiteSpace: "nowrap" }}>{current + 1}/{total}</span>
        <span className={`badge-pill ${mode === "study" ? "bs" : mode === "exam" ? "bb" : "by"}`} style={{ fontSize: 10 }}>
          {modeIcon} {modeLabel}
        </span>
        {session.timer > 0 && !answered ? (
          <div style={{ position: "relative", width: 38, height: 38, flexShrink: 0 }}>
            <svg width="38" height="38" style={{ position: "absolute" }}>
              <circle cx="19" cy="19" r="15" fill="none" stroke="var(--bdr)" strokeWidth="3" />
              <circle
                cx="19"
                cy="19"
                r="15"
                fill="none"
                stroke={timerColor}
                strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 15}`}
                strokeDashoffset={`${2 * Math.PI * 15 * (1 - timerPct / 100)}`}
                className="timer-arc"
                strokeLinecap="round"
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: timerColor }}>{timerLeft}</div>
          </div>
        ) : (
          <div style={{ background: "var(--card)", border: "1.5px solid var(--bdr)", borderRadius: 9, padding: "4px 10px", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" }}>⏱ {fmtTime(elapsed)}</div>
        )}
        <div style={{ background: "var(--sec-d)", border: "1px solid rgba(255,214,10,.3)", borderRadius: 9, padding: "4px 10px", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: "var(--sec)", whiteSpace: "nowrap" }}>
          +{session.answers.filter((a) => a.isCorrect).length * 10}pts
        </div>
      </div>

      <div
        data-testid="quiz-swipe-zone"
        className="quiz-content"
        style={{ maxWidth: 760, margin: "0 auto", padding: "24px 18px 100px" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="row" style={{ gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <span className="badge-pill bb">{q.disciplina}</span>
          <span className="badge-pill bm">{q.nivelEnsino}</span>
          {q.tipoResposta === "verdadeiro-falso" && <span className="badge-pill by">V/F</span>}
        </div>
        <div className="card" style={{ marginBottom: 16, borderRadius: 18 }}>
          <p style={{ fontSize: 11, color: "var(--txd)", marginBottom: 8, fontWeight: 500 }}>QUESTAO {current + 1}</p>
          <MathText text={q.pergunta} block className="katex-question" />
          {q.imagem && (
            <img
              src={q.imagem}
              alt="Imagem da questão"
              style={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 12, marginTop: 10, border: "1px solid var(--bdr)" }}
            />
          )}
        </div>
        <div role="radiogroup" aria-label="Alternativas da questao" aria-disabled={answered}>
        {opts.map((opt, i) => {
          let cls = "aopt";
          if (answered && mode !== "exam") {
            if (opt === q.respostaCorreta) cls += " cor";
            else if (opt === sel) cls += " err";
          } else if (opt === sel) {
            cls += " sel";
          }
          return (
            <button
              key={opt}
              className={cls}
              disabled={answered}
              role="radio"
              aria-checked={opt === sel}
              aria-label={`Alternativa ${labels[i]}: ${opt}`}
              style={!answered && i === kbdIdx ? { outline: "2px solid var(--pri)", outlineOffset: 2 } : undefined}
              onClick={() => {
                if (answered) return;
                setKbdIdx(i);
                handleAnswerWithSound(opt, qElapsed);
              }}
            >
              <span className="oltr">{labels[i]}</span>
              <span style={{ fontSize: 13, flex: 1 }}><MathText text={opt} /></span>
              {answered && mode !== "exam" && opt === q.respostaCorreta && <span>✓</span>}
              {answered && mode !== "exam" && opt === sel && opt !== q.respostaCorreta && <span>✗</span>}
            </button>
          );
        })}
        </div>
        <p style={{ marginTop: 10, fontSize: 12, color: "var(--txd)" }}>Atalhos: 1-5 para responder, setas para navegar, Enter para confirmar/avancar, Space para pular e Esc para sair. No celular, deslize para o lado para pular.</p>
        {answered && mode === "study" && (
          <div className={`fbanner ${sel === q.respostaCorreta ? "ok" : "er"}`} role="status" aria-live="polite">
            <span style={{ fontSize: 20 }}>{sel === q.respostaCorreta ? "🎉" : "💡"}</span>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 3 }}>{sel === "__skipped__" ? "Pulada" : sel === q.respostaCorreta ? "Correta! +10 pts" : "Errada"}</div>
              {q.comentario && <div style={{ fontSize: 12, color: "var(--txd)" }}><MathText text={q.comentario} /></div>}
            </div>
          </div>
        )}
        {answered && mode === "exam" && <div className="fbanner ok" style={{ fontSize: 13 }} role="status" aria-live="polite"><span>⏭</span><div>Resposta registrada. Gabarito ao final.</div></div>}
        <div className="row" style={{ marginTop: 18, justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-g btn-sm" onClick={onToggleQuestionReport} aria-label={isQuestionReported ? "Desfazer marcacao de questao incorreta" : "Marcar questao como incorreta"}>
            {isQuestionReported ? "✅ Sinalizada (toque para desfazer)" : "⚠️ Marcar questão como incorreta"}
          </button>
          <div className="quiz-primary-actions-inline">
            {!answered && <button className="btn btn-s btn-sm" onClick={handleSkipWithSound} aria-label="Pular questao atual">⏭ Pular</button>}
            {answered && <button className="btn btn-p" onClick={handleNextWithSound} aria-label={current + 1 >= total ? "Ver resultados" : "Ir para proxima questao"}>{current + 1 >= total ? "Ver Resultados 📊" : "Proxima →"}</button>}
          </div>
          {answered && (
            <div style={{ marginTop: 12 }}>
              <button
                className="btn btn-g btn-sm"
                onClick={() => {
                  handleUndoAnswer();
                  if (onUndoAnswer) onUndoAnswer();
                }}
                style={{ width: "100%" }}
              >
                ↶ Desfazer Resposta
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="quiz-actions-mobile" data-testid="quiz-mobile-actions">
        {!answered && <button className="btn btn-s btn-sm btn-w" onClick={handleSkipWithSound} aria-label="Pular questao atual">⏭ Pular</button>}
        {answered && <button className="btn btn-p btn-w" onClick={handleNextWithSound} aria-label={current + 1 >= total ? "Ver resultados" : "Ir para proxima questao"}>{current + 1 >= total ? "Ver Resultados 📊" : "Proxima →"}</button>}
      </div>
    </div>
  );
}
