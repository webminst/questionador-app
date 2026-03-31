import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppCtx } from "../../app/context";
import type { PersistedState, ResultsData, User } from "../../types/app";
import ResultsScreen from "./ResultsScreen";

function buildResults(): ResultsData {
  return {
    answers: [
      {
        question: {
          id: "q1",
          pergunta: "2 + 2 = ?",
          disciplina: "Matemática",
          nivelEnsino: "Fundamental",
          tipoResposta: "multipla-escolha",
          opcoes: ["3", "4", "5"],
          respostaCorreta: "4",
          origem: "Livro",
          tags: ["soma"],
          dataCadastro: "2026-03-27",
        },
        answer: "4",
        isCorrect: true,
        timeSpent: 5,
      },
      {
        question: {
          id: "q2",
          pergunta: "3 + 3 = ?",
          disciplina: "Matemática",
          nivelEnsino: "Fundamental",
          tipoResposta: "multipla-escolha",
          opcoes: ["5", "6", "7"],
          respostaCorreta: "6",
          origem: "Livro",
          tags: ["soma"],
          dataCadastro: "2026-03-27",
        },
        answer: "5",
        isCorrect: false,
        timeSpent: 6,
      },
    ],
    totalTime: 11,
    correct: 1,
    wrong: 1,
    total: 2,
    points: 10,
    avgTime: 6,
    mode: "study",
  };
}

function renderWithCtx(results: ResultsData, options?: { addToast?: (msg: string, type?: "success" | "error" | "badge") => void; onReviewErrors?: () => void; state?: PersistedState }) {
  const currentUser: User = {
    id: "u1",
    nome: "Ana",
    email: "ana@email.com",
    pwdHash: "hash",
    pontuacao: 100,
    respostasCertas: 10,
    respostasErradas: 2,
  };

  const state: PersistedState = {
    allUsers: [currentUser],
    questions: [],
    disciplines: [],
    perUser: {
      u1: {
        sessions: [
          {
            id: "s-current",
            date: new Date().toISOString(),
            discipline: "Matemática",
            correct: results.correct,
            total: results.total,
            totalTime: results.totalTime,
            points: results.points,
            mode: results.mode,
          },
          {
            id: "s-prev-1",
            date: new Date(Date.now() - 86400000).toISOString(),
            discipline: "Matemática",
            correct: 1,
            total: 2,
            totalTime: 20,
            points: 10,
            mode: "study",
          },
          {
            id: "s-prev-2",
            date: new Date(Date.now() - 2 * 86400000).toISOString(),
            discipline: "Matemática",
            correct: 1,
            total: 2,
            totalTime: 18,
            points: 10,
            mode: "study",
          },
        ],
        bookmarks: [],
        reportedQuestionIds: [],
        dailyGoalQuestions: 20,
        achievements: {},
        streak: { count: 1, lastDate: new Date().toISOString().slice(0, 10) },
        srData: {},
        lastSessionWrongQuestionIds: ["q2"],
      },
    },
  };

  const addToast = options?.addToast ?? vi.fn();
  const mergedState = options?.state ?? state;
  const onReviewErrors = options?.onReviewErrors ?? vi.fn();

  return render(
    <AppCtx.Provider
      value={{
        state: mergedState,
        dispatch: vi.fn(),
        currentUser,
        uid: "u1",
        addToast,
        leaderboard: [currentUser],
      }}
    >
      <ResultsScreen results={results} onHome={vi.fn()} onRetry={vi.fn()} onReviewErrors={onReviewErrors} />
    </AppCtx.Provider>,
  );
}

describe("ResultsScreen share", () => {
  it("renderiza card de compartilhamento com texto de resultado", () => {
    const results = buildResults();
    const { getByText } = renderWithCtx(results);

    expect(getByText("📣 Compartilhar resultado")).toBeTruthy();
    expect(getByText((content) => content.includes("Acertei 1/2 em Matemática! 🎯"))).toBeTruthy();
  });

  it("copia texto ao clicar em copiar", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    const addToast = vi.fn();
    const { getAllByText } = renderWithCtx(buildResults(), { addToast });

    const copyButtons = getAllByText("📋 Copiar texto");
    fireEvent.click(copyButtons[copyButtons.length - 1]);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Acertei 1/2 em Matemática! 🎯"));
    });
    expect(addToast).toHaveBeenCalledWith("Resultado copiado para a área de transferência ✅", "success");
  });

  it("mostra bloco de insights e comparacao com historico", () => {
    const { getAllByText } = renderWithCtx(buildResults());

    expect(getAllByText("🧭 Seus insights").length).toBeGreaterThan(0);
    expect(getAllByText((text) => text.includes("Ponto forte:")).length).toBeGreaterThan(0);
    expect(getAllByText((text) => text.includes("Principal erro:")).length).toBeGreaterThan(0);
    expect(getAllByText((text) => text.includes("Recomendacao:")).length).toBeGreaterThan(0);
    expect(getAllByText((text) => text.includes("vs media das ultimas")).length).toBeGreaterThan(0);
  });

  it("aciona revisao de erros pelo CTA principal", () => {
    const onReviewErrors = vi.fn();
    const { getAllByText } = renderWithCtx(buildResults(), { onReviewErrors });

    const buttons = getAllByText("🔁 Revisar apenas erros");
    fireEvent.click(buttons[buttons.length - 1]);
    expect(onReviewErrors).toHaveBeenCalledTimes(1);
  });
});
