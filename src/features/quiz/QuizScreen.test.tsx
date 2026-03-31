import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { QuizSession } from "../../types/app";
import QuizScreen from "./QuizScreen";

function buildSession(overrides: Partial<QuizSession> = {}): QuizSession {
  return {
    questions: [
      {
        id: "q1",
        pergunta: "2 + 2?",
        disciplina: "Matematica",
        nivelEnsino: "Fundamental",
        tipoResposta: "multipla-escolha",
        opcoes: ["1", "2", "3", "4"],
        respostaCorreta: "4",
        origem: "Livro",
        tags: ["soma"],
        dataCadastro: "2026-03-26",
      },
    ],
    current: 0,
    answers: [],
    startTime: Date.now() - 5000,
    questionStartTime: Date.now() - 3000,
    answered: false,
    selectedAnswer: null,
    questionTimes: [],
    mode: "study",
    timer: 30,
    disc: "Matematica",
    ...overrides,
  };
}

describe("QuizScreen keyboard shortcuts", () => {
  it("seleciona opcao com tecla numerica", () => {
    const onAnswer = vi.fn();
    const onNext = vi.fn();
    const onSkip = vi.fn();
    const onExit = vi.fn();

    render(
      <QuizScreen
        session={buildSession()}
        onAnswer={onAnswer}
        onNext={onNext}
        onSkip={onSkip}
        onUndoAnswer={vi.fn()}
        onExit={onExit}
      />,
    );

    fireEvent.keyDown(window, { key: "4" });

    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith("4", expect.any(Number));
  });

  it("ignora tecla fora do intervalo 1-5", () => {
    const onAnswer = vi.fn();

    render(
      <QuizScreen
        session={buildSession()}
        onAnswer={onAnswer}
        onNext={vi.fn()}
        onSkip={vi.fn()}
        onUndoAnswer={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    fireEvent.keyDown(window, { key: "6" });

    expect(onAnswer).not.toHaveBeenCalled();
  });

  it("seleciona quinta opcao com tecla 5", () => {
    const onAnswer = vi.fn();

    render(
      <QuizScreen
        session={buildSession({
          questions: [
            {
              ...buildSession().questions[0],
              opcoes: ["1", "2", "3", "4", "5"],
              respostaCorreta: "5",
            },
          ],
        })}
        onAnswer={onAnswer}
        onNext={vi.fn()}
        onSkip={vi.fn()}
        onUndoAnswer={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    fireEvent.keyDown(window, { key: "5" });

    expect(onAnswer).toHaveBeenCalledWith("5", expect.any(Number));
  });

  it("avanca com Enter apenas quando ja respondeu", () => {
    const onNextAnswered = vi.fn();

    const { rerender } = render(
      <QuizScreen
        session={buildSession({ answered: false })}
        onAnswer={vi.fn()}
        onNext={onNextAnswered}
        onSkip={vi.fn()}
        onUndoAnswer={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    fireEvent.keyDown(window, { key: "Enter" });
    expect(onNextAnswered).not.toHaveBeenCalled();

    rerender(
      <QuizScreen
        session={buildSession({
          answered: true,
          selectedAnswer: "4",
          answers: [
            {
              question: buildSession().questions[0],
              answer: "4",
              isCorrect: true,
              timeSpent: 2,
            },
          ],
        })}
        onAnswer={vi.fn()}
        onNext={onNextAnswered}
        onSkip={vi.fn()}
        onUndoAnswer={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    fireEvent.keyDown(window, { key: "Enter" });
    expect(onNextAnswered).toHaveBeenCalledTimes(1);
  });

  it("sai com Esc", () => {
    const onExit = vi.fn();

    render(
      <QuizScreen
        session={buildSession()}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onSkip={vi.fn()}
        onUndoAnswer={vi.fn()}
        onExit={onExit}
      />,
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("pula com Space quando nao respondeu", () => {
    const onSkip = vi.fn();

    render(
      <QuizScreen
        session={buildSession({ answered: false })}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onSkip={onSkip}
        onUndoAnswer={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    fireEvent.keyDown(window, { key: " " });
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("navega com setas e confirma com Enter", () => {
    const onAnswer = vi.fn();

    render(
      <QuizScreen
        session={buildSession({ answered: false })}
        onAnswer={onAnswer}
        onNext={vi.fn()}
        onSkip={vi.fn()}
        onUndoAnswer={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    fireEvent.keyDown(window, { key: "ArrowDown" });
    fireEvent.keyDown(window, { key: "ArrowDown" });
    fireEvent.keyDown(window, { key: "Enter" });

    expect(onAnswer).toHaveBeenCalledWith("3", expect.any(Number));
  });

  it("mostra botao desfazer quando respondido", () => {
    const { getAllByText } = render(
      <QuizScreen
        session={buildSession({
          answered: true,
          selectedAnswer: "4",
          answers: [
            {
              question: buildSession().questions[0],
              answer: "4",
              isCorrect: true,
              timeSpent: 2,
            },
          ],
        })}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onSkip={vi.fn()}
        onUndoAnswer={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    const undoButtons = getAllByText("↶ Desfazer Resposta");
    expect(undoButtons.length).toBeGreaterThan(0);
  });

  it("chama onUndoAnswer quando clica botao desfazer", () => {
    const onUndo = vi.fn();
    const { getAllByText } = render(
      <QuizScreen
        session={buildSession({
          answered: true,
          selectedAnswer: "4",
          answers: [
            {
              question: buildSession().questions[0],
              answer: "4",
              isCorrect: true,
              timeSpent: 2,
            },
          ],
        })}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onSkip={vi.fn()}
        onUndoAnswer={onUndo}
        onExit={vi.fn()}
      />,
    );

    const undoButtons = getAllByText("↶ Desfazer Resposta");
    const undoBtn = undoButtons[undoButtons.length - 1];
    fireEvent.click(undoBtn);

    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it("chama callback ao marcar questao como incorreta", () => {
    const onToggleQuestionReport = vi.fn();

    const { getAllByText } = render(
      <QuizScreen
        session={buildSession()}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onSkip={vi.fn()}
        onUndoAnswer={vi.fn()}
        onToggleQuestionReport={onToggleQuestionReport}
        isQuestionReported={false}
        onExit={vi.fn()}
      />,
    );

    const reportButtons = getAllByText("⚠️ Marcar questão como incorreta");
    fireEvent.click(reportButtons[reportButtons.length - 1]);
    expect(onToggleQuestionReport).toHaveBeenCalledTimes(1);
  });

  it("mostra estado de questao ja sinalizada", () => {
    const { getByText } = render(
      <QuizScreen
        session={buildSession()}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onSkip={vi.fn()}
        onUndoAnswer={vi.fn()}
        onToggleQuestionReport={vi.fn()}
        isQuestionReported
        onExit={vi.fn()}
      />,
    );

    expect(getByText("✅ Sinalizada (toque para desfazer)")).toBeTruthy();
  });

  it("pula com swipe horizontal no mobile", () => {
    const onSkip = vi.fn();
    const { getAllByTestId } = render(
      <QuizScreen
        session={buildSession({ answered: false })}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onSkip={onSkip}
        onUndoAnswer={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    const zones = getAllByTestId("quiz-swipe-zone");
    const zone = zones[zones.length - 1];
    fireEvent.touchStart(zone, { touches: [{ clientX: 30, clientY: 120 }] });
    fireEvent.touchEnd(zone, { changedTouches: [{ clientX: 150, clientY: 130 }] });

    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("nao pula com arrasto curto no mobile", () => {
    const onSkip = vi.fn();
    const { getAllByTestId } = render(
      <QuizScreen
        session={buildSession({ answered: false })}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onSkip={onSkip}
        onUndoAnswer={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    const zones = getAllByTestId("quiz-swipe-zone");
    const zone = zones[zones.length - 1];
    fireEvent.touchStart(zone, { touches: [{ clientX: 30, clientY: 120 }] });
    fireEvent.touchEnd(zone, { changedTouches: [{ clientX: 70, clientY: 125 }] });

    expect(onSkip).not.toHaveBeenCalled();
  });

  it("nao dispara swipe para pular quando ja respondeu", () => {
    const onSkip = vi.fn();
    const { getAllByTestId } = render(
      <QuizScreen
        session={buildSession({ answered: true, selectedAnswer: "4" })}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onSkip={onSkip}
        onUndoAnswer={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    const zones = getAllByTestId("quiz-swipe-zone");
    const zone = zones[zones.length - 1];
    fireEvent.touchStart(zone, { touches: [{ clientX: 20, clientY: 100 }] });
    fireEvent.touchEnd(zone, { changedTouches: [{ clientX: 130, clientY: 102 }] });

    expect(onSkip).not.toHaveBeenCalled();
  });

  it("renderiza barra fixa mobile com acao de pular quando nao respondido", () => {
    const { getAllByTestId, getAllByText } = render(
      <QuizScreen
        session={buildSession({ answered: false })}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onSkip={vi.fn()}
        onUndoAnswer={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    const bars = getAllByTestId("quiz-mobile-actions");
    expect(bars.length).toBeGreaterThan(0);
    const skipButtons = getAllByText("⏭ Pular");
    expect(skipButtons.length).toBeGreaterThan(0);
  });

  it("renderiza barra fixa mobile com acao de proxima quando respondido", () => {
    const { getAllByTestId, getAllByText } = render(
      <QuizScreen
        session={buildSession({
          answered: true,
          selectedAnswer: "4",
          answers: [
            {
              question: buildSession().questions[0],
              answer: "4",
              isCorrect: true,
              timeSpent: 2,
            },
          ],
        })}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onSkip={vi.fn()}
        onUndoAnswer={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    const bars = getAllByTestId("quiz-mobile-actions");
    expect(bars.length).toBeGreaterThan(0);
    const nextButtons = getAllByText("Ver Resultados 📊");
    expect(nextButtons.length).toBeGreaterThan(0);
  });
});
