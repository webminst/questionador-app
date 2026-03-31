import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppCtx } from "../../app/context";
import type { PersistedState, User } from "../../types/app";
import LeaderboardScreen from "./LeaderboardScreen";

function makeUser(id: string, nome: string, pontos: number): User {
  return {
    id,
    nome,
    email: `${id}@demo.com`,
    pwdHash: "hash",
    pontuacao: pontos,
    respostasCertas: 10,
    respostasErradas: 2,
  };
}

function makeSession(id: string, daysAgo: number) {
  return {
    id,
    date: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    discipline: "Matematica",
    correct: 7,
    total: 10,
    totalTime: 200,
    points: 30,
    mode: "study" as const,
  };
}

describe("LeaderboardScreen habits", () => {
  it("exibe comparativo semanal de habitos por usuario", () => {
    const u1 = makeUser("u1", "Ana", 400);
    const u2 = makeUser("u2", "Bia", 350);

    const state: PersistedState = {
      allUsers: [u1, u2],
      questions: [
        {
          id: "q1",
          pergunta: "2+2?",
          disciplina: "Matematica",
          nivelEnsino: "Fundamental",
          tipoResposta: "multipla-escolha",
          opcoes: ["2", "3", "4", "5"],
          respostaCorreta: "4",
          origem: "Livro",
          tags: ["soma"],
          dataCadastro: "2026-03-28",
        },
      ],
      disciplines: [{ id: "d1", name: "Matematica", icon: "📐", color: "#4dabf7", builtin: true }],
      perUser: {
        u1: {
          sessions: [makeSession("a1", 0), makeSession("a2", 1), makeSession("a3", 2), makeSession("a4", 3)],
          bookmarks: [],
          reportedQuestionIds: [],
          dailyGoalQuestions: 20,
          achievements: {},
          streak: { count: 4, lastDate: new Date().toISOString().slice(0, 10) },
          srData: {},
          lastSessionWrongQuestionIds: [],
        },
        u2: {
          sessions: [makeSession("b1", 8), makeSession("b2", 9), makeSession("b3", 10), makeSession("b4", 11)],
          bookmarks: [],
          reportedQuestionIds: [],
          dailyGoalQuestions: 20,
          achievements: {},
          streak: { count: 0, lastDate: null },
          srData: {},
          lastSessionWrongQuestionIds: [],
        },
      },
    };

    const { getAllByText } = render(
      <AppCtx.Provider
        value={{
          state,
          dispatch: vi.fn(),
          currentUser: u1,
          uid: "u1",
          addToast: vi.fn(),
          leaderboard: [u1, u2],
        }}
      >
        <LeaderboardScreen />
      </AppCtx.Provider>,
    );

    expect(getAllByText(/Habito 7d:/).length).toBeGreaterThan(0);
    expect(getAllByText(/subindo|caindo|estavel/).length).toBeGreaterThan(0);
    expect(getAllByText(/Atencao:|Habito coletivo estavel\/subindo/).length).toBeGreaterThan(0);
  });
});
